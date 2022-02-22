import * as libcrypto from "crypto";
import { BlockHandler } from "./vfs";
import { BlockReference, Chunk } from "./chunks";
import { DEBUG } from "./env";
import * as asserts from "../asserts";
import * as keys from "./keys";
import { IntegerAssert } from "../asserts";

export class HashTableHeader extends Chunk {
	readonly count: BlockReference;
	readonly table: BlockReference;

	constructor(buffer?: Uint8Array) {
		super(buffer ?? new Uint8Array(HashTableHeader.LENGTH));
		if (DEBUG) asserts.IntegerAssert.exactly(this.buffer.length, HashTableHeader.LENGTH);
		this.count = new BlockReference(this.buffer.subarray(16, 16 + BlockReference.LENGTH));
		this.table = new BlockReference(this.buffer.subarray(24, 24 + BlockReference.LENGTH));
	}

	static readonly LENGTH = 32;
};

export class HashTableSlot extends BlockReference {
	constructor(buffer?: Uint8Array) {
		super(buffer ?? new Uint8Array(HashTableSlot.LENGTH));
	}

	probeDistance(value?: number): number {
		return this.metadata(value);
	}
};

export interface Entry {
	key(): keys.Chunks;
	value(): number;
};

export interface TableDetail {
	getKeyFromValue(value: number): keys.Chunks;
};

export class Table {
	private blockHandler: BlockHandler;
	private bid: number;
	private detail: TableDetail;
	private header: HashTableHeader;
	private minimumCapacity: number;

	constructor(
		blockHandler: BlockHandler,
		detail: TableDetail,
		options?: {
			bid?: number,
			minimumCapacity?: number
		}
	) {
		let blockId = options?.bid;
		this.blockHandler = blockHandler;
		this.bid = blockId ?? blockHandler.createBlock(HashTableHeader.LENGTH);
		this.detail = detail;
		this.header = new HashTableHeader();
		this.minimumCapacity = asserts.IntegerAssert.atLeast(1, options?.minimumCapacity ?? 64);
		if (blockId != null) {
			this.header.read(blockHandler.makeReadable(blockId), 0);
		}
		if (this.header.table.value() === 0) {
			let table = blockHandler.createBlock(this.minimumCapacity * HashTableSlot.LENGTH);
			this.header.table.value(table);
		}
		this.header.write(blockHandler.makeWritable(this.bid), 0);
	}

	private readSlot(index: number, slot: HashTableSlot): HashTableSlot {
		slot.read(this.blockHandler.makeReadable(this.header.table.value()), index * HashTableSlot.LENGTH);
		return slot;
	}

	private writeSlot(index: number, slot: HashTableSlot): HashTableSlot {
		slot.write(this.blockHandler.makeWritable(this.header.table.value()), index * HashTableSlot.LENGTH);
		return slot;
	}

	private computeOptimalSlot(key: keys.Chunks): number {
		let slotCount = this.getSlotCount();
		let hash = Buffer.alloc(6);
		for (let keyPart of key) {
			hash = libcrypto.createHash("sha256")
				.update(hash)
				.update(keyPart)
				.digest();
		}
		return hash.readUIntBE(0, 6) % slotCount;
	}

	private doInsert(key: keys.Chunks, value: number): number | undefined {
		let optimalSlot = this.computeOptimalSlot(key);
		let slotCount = this.getSlotCount();
		let probeDistance = 0;
		let slotIndex = optimalSlot;
		let slot = new HashTableSlot();
		for (let i = 0; i < slotCount; i++) {
			this.readSlot(slotIndex, slot);
			if (slot.value() === 0) {
				slot.probeDistance(probeDistance);
				slot.value(value);
				this.writeSlot(slotIndex, slot);
				return slotIndex;
			}
			if (keys.compareChunks(this.detail.getKeyFromValue(slot.value()), key) === 0) {
				return;
			}
			if (probeDistance > slot.probeDistance()) {
				let replacementSlot = new HashTableSlot();
				replacementSlot.probeDistance(probeDistance);
				replacementSlot.value(value);
				this.writeSlot(slotIndex, replacementSlot);
				value = slot.value();
				probeDistance = slot.probeDistance();
			}
			slotIndex = (slotIndex + 1) % slotCount;
			probeDistance += 1;
		}
	}

	private doLookup(key: keys.Chunks): number | undefined {
		let optimalSlot = this.computeOptimalSlot(key);
		let slotCount = this.getSlotCount();
		let probeDistance = 0;
		let slotIndex = optimalSlot;
		let slot = new HashTableSlot();
		for (let i = 0; i < slotCount; i++) {
			this.readSlot(slotIndex, slot);
			let value = slot.value();
			if (value === 0 || probeDistance > slot.probeDistance()) {
				return;
			}
			if (keys.compareChunks(this.detail.getKeyFromValue(value), key) === 0) {
				return slotIndex;
			}
			slotIndex = (slotIndex + 1) % slotCount;
			probeDistance += 1;
		}
	}

	private doRemove(key: keys.Chunks): number | undefined {
		let optimalSlot = this.computeOptimalSlot(key);
		let slotCount = this.getSlotCount();
		let probeDistance = 0;
		let slotIndex = optimalSlot;
		let slot = new HashTableSlot();
		for (let i = 0; i < slotCount; i++) {
			this.readSlot(slotIndex, slot);
			let value = slot.value();
			if (value === 0 || probeDistance > slot.probeDistance()) {
				return;
			}
			if (keys.compareChunks(this.detail.getKeyFromValue(value), key) === 0) {
				this.writeSlot(slotIndex, new HashTableSlot());
				return slotIndex;
			}
			slotIndex = (slotIndex + 1) % slotCount;
			probeDistance += 1;
		}
	}

	private getSlotCount(): number {
		let blockSize = this.blockHandler.getBlockSize(this.header.table.value());
		return Math.floor(blockSize / BlockReference.LENGTH);
	}

	private propagateBackwards(slotIndex: number): void {
		let slotCount = this.getSlotCount();
		let slot = new HashTableSlot();
		for (let i = 0; i < slotCount; i++) {
			this.readSlot((slotIndex + 1) % slotCount, slot);
			let probeDistance = slot.probeDistance();
			if (probeDistance === 0) {
				this.writeSlot(slotIndex, new HashTableSlot());
				break;
			}
			slot.probeDistance(probeDistance - 1);
			this.writeSlot(slotIndex, slot);
			slotIndex = (slotIndex + 1) % slotCount;
		}
	}

	private resizeIfNecessary(): void {
		let slotCount = this.getSlotCount();
		let currentLoadFactor = this.header.count.value() / slotCount;
		let desiredSlotCount = slotCount;
		if (currentLoadFactor <= 0.25) {
			desiredSlotCount = Math.max(Math.ceil(slotCount / 2), this.minimumCapacity);
		}
		if (currentLoadFactor >= 0.75) {
			desiredSlotCount = slotCount * 2;
		}
		if (desiredSlotCount === slotCount) {
			return;
		}
		let values = new Array<number>();
		let slot = new HashTableSlot();
		for (let i = 0; i < slotCount; i++) {
			this.readSlot(i, slot);
			let value = slot.value();
			if (value !== 0) {
				values.push(value);
			}
		}
		let minLength = desiredSlotCount * BlockReference.LENGTH;
		this.blockHandler.resizeBlock(this.header.table.value(), minLength);
		this.blockHandler.clearBlock(this.header.table.value());
		for (let value of values) {
			let key = this.detail.getKeyFromValue(value);
			this.doInsert(key, value);
		}
		this.header.write(this.blockHandler.makeWritable(this.bid), 0);
	}

	* [Symbol.iterator](): Iterator<Entry> {
		let slotCount = this.getSlotCount();
		let slot = new HashTableSlot();
		for (let i = 0; i < slotCount; i++) {
			this.readSlot(i, slot);
			let value = slot.value();
			if (value !== 0) {
				yield {
					key: () => this.detail.getKeyFromValue(value),
					value: () => value
				};
			}
		}
	}

	getBid(): number {
		return this.bid;
	}

	clear(): void {
		this.blockHandler.clearBlock(this.header.table.value());
		this.header.count.value(0);
		this.header.write(this.blockHandler.makeWritable(this.bid), 0);
	}

	delete(): void {
		this.blockHandler.deleteBlock(this.header.table.value());
		this.blockHandler.deleteBlock(this.bid);
		this.header.count.value(0);
	}

	insert(key: keys.Chunks, value: number): boolean {
		if (DEBUG) IntegerAssert.atLeast(1, value);
		let slotIndex = this.doInsert(key, value);
		if (slotIndex == null) {
			return false;
		}
		this.header.count.value(this.header.count.value() + 1);
		this.header.write(this.blockHandler.makeWritable(this.bid), 0);
		this.resizeIfNecessary();
		return true;
	}

	length(): number {
		return this.header.count.value();
	}

	lookup(key: keys.Chunks): number | undefined {
		let slotIndex = this.doLookup(key);
		if (slotIndex == null) {
			return;
		}
		let slot = new HashTableSlot();
		this.readSlot(slotIndex, slot);
		return slot.value();
	}

	remove(key: keys.Chunks): boolean {
		let slotIndex = this.doRemove(key);
		if (slotIndex == null) {
			return false;
		}
		this.header.count.value(this.header.count.value() - 1);
		this.header.write(this.blockHandler.makeWritable(this.bid), 0);
		this.propagateBackwards(slotIndex);
		this.resizeIfNecessary();
		return true;
	}

	static LENGTH = HashTableHeader.LENGTH;
};
