import * as bedrock from "@joelek/bedrock";
import * as libcrypto from "crypto";
import { BlockManager, BlockReference } from "./blocks";
import { Chunk } from "./chunks";
import { DEBUG } from "./variables";
import * as asserts from "../mod/asserts";
import { IntegerAssert } from "../mod/asserts";
import * as utils from "./utils";

export function compareBuffers(one: Array<Uint8Array>, two: Array<Uint8Array>): number {
	if (one.length < two.length) {
		return -1;
	}
	if (one.length > two.length) {
		return 1;
	}
	for (let i = 0; i < one.length; i++) {
		let comparison = bedrock.utils.Chunk.comparePrefixes(one[i], two[i]);
		if (comparison !== 0) {
			return comparison;
		}
	}
	return 0;
};

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

export interface TableDetail {
	getKeyFromValue(value: number): Array<Uint8Array>;
};

export class Table {
	private blockManager: BlockManager;
	private bid: number;
	private detail: TableDetail;
	private header: HashTableHeader;
	private minimumCapacity: number;
	private slotCount: number;

	constructor(
		blockManager: BlockManager,
		detail: TableDetail,
		options?: {
			bid?: number,
			minimumCapacity?: number
		}
	) {
		let blockId = options?.bid;
		this.blockManager = blockManager;
		this.bid = blockId ?? blockManager.createBlock(HashTableHeader.LENGTH);
		this.detail = detail;
		this.header = new HashTableHeader();
		this.minimumCapacity = asserts.IntegerAssert.atLeast(1, options?.minimumCapacity ?? 64);
		if (blockId != null) {
			this.header.read(blockManager.makeReadable(blockId), 0);
		}
		if (this.header.table.value() === 0) {
			let table = blockManager.createBlock(this.minimumCapacity * HashTableSlot.LENGTH);
			this.header.table.value(table);
		}
		this.header.write(blockManager.makeWritable(this.bid), 0);
		this.slotCount = Math.floor(this.blockManager.getBlockSize(this.header.table.value()) / HashTableSlot.LENGTH);
	}

	private readSlot(index: number, slot: HashTableSlot): HashTableSlot {
		slot.read(this.blockManager.makeReadable(this.header.table.value()), index * HashTableSlot.LENGTH);
		return slot;
	}

	private writeSlot(index: number, slot: HashTableSlot): HashTableSlot {
		slot.write(this.blockManager.makeWritable(this.header.table.value()), index * HashTableSlot.LENGTH);
		return slot;
	}

	private computeOptimalSlot(key: Array<Uint8Array>): number {
		let hash = Buffer.alloc(6);
		for (let keyPart of key) {
			hash = libcrypto.createHash("sha256")
				.update(hash)
				.update(keyPart)
				.digest();
		}
		return hash.readUIntBE(0, 6) % this.slotCount;
	}

	private doInsert(key: Array<Uint8Array>, value: number): number | undefined {
		let optimalSlot = this.computeOptimalSlot(key);
		let probeDistance = 0;
		let slotIndex = optimalSlot;
		let slot = new HashTableSlot();
		for (let i = 0; i < this.slotCount; i++) {
			this.readSlot(slotIndex, slot);
			if (slot.value() === 0) {
				slot.probeDistance(probeDistance);
				slot.value(value);
				this.writeSlot(slotIndex, slot);
				return slotIndex;
			}
			if (compareBuffers(this.detail.getKeyFromValue(slot.value()), key) === 0) {
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
			slotIndex = (slotIndex + 1) % this.slotCount;
			probeDistance += 1;
		}
	}

	private doLookup(key: Array<Uint8Array>): number | undefined {
		let optimalSlot = this.computeOptimalSlot(key);
		let probeDistance = 0;
		let slotIndex = optimalSlot;
		let slot = new HashTableSlot();
		for (let i = 0; i < this.slotCount; i++) {
			this.readSlot(slotIndex, slot);
			let value = slot.value();
			if (value === 0 || probeDistance > slot.probeDistance()) {
				return;
			}
			if (compareBuffers(this.detail.getKeyFromValue(value), key) === 0) {
				return slotIndex;
			}
			slotIndex = (slotIndex + 1) % this.slotCount;
			probeDistance += 1;
		}
	}

	private doRemove(key: Array<Uint8Array>): number | undefined {
		let optimalSlot = this.computeOptimalSlot(key);
		let probeDistance = 0;
		let slotIndex = optimalSlot;
		let slot = new HashTableSlot();
		for (let i = 0; i < this.slotCount; i++) {
			this.readSlot(slotIndex, slot);
			let value = slot.value();
			if (value === 0 || probeDistance > slot.probeDistance()) {
				return;
			}
			if (compareBuffers(this.detail.getKeyFromValue(value), key) === 0) {
				this.writeSlot(slotIndex, new HashTableSlot());
				return slotIndex;
			}
			slotIndex = (slotIndex + 1) % this.slotCount;
			probeDistance += 1;
		}
	}

	private propagateBackwards(slotIndex: number): void {
		let slot = new HashTableSlot();
		for (let i = 0; i < this.slotCount; i++) {
			this.readSlot((slotIndex + 1) % this.slotCount, slot);
			let probeDistance = slot.probeDistance();
			if (probeDistance === 0) {
				this.writeSlot(slotIndex, new HashTableSlot());
				break;
			}
			slot.probeDistance(probeDistance - 1);
			this.writeSlot(slotIndex, slot);
			slotIndex = (slotIndex + 1) % this.slotCount;
		}
	}

	private resizeIfNecessary(): void {
		let currentLoadFactor = this.header.count.value() / this.slotCount;
		let desiredSlotCount = this.slotCount;
		if (currentLoadFactor <= 0.25) {
			desiredSlotCount = Math.max(Math.ceil(this.slotCount / 2), this.minimumCapacity);
		}
		if (currentLoadFactor >= 0.75) {
			desiredSlotCount = this.slotCount * 2;
		}
		if (desiredSlotCount === this.slotCount) {
			return;
		}
		let values = new Array<number>();
		let slot = new HashTableSlot();
		for (let i = 0; i < this.slotCount; i++) {
			this.readSlot(i, slot);
			let value = slot.value();
			if (value !== 0) {
				values.push(value);
			}
		}
		let minLength = desiredSlotCount * HashTableSlot.LENGTH;
		this.blockManager.resizeBlock(this.header.table.value(), minLength);
		this.blockManager.clearBlock(this.header.table.value());
		this.slotCount = Math.floor(this.blockManager.getBlockSize(this.header.table.value()) / HashTableSlot.LENGTH);
		for (let value of values) {
			let key = this.detail.getKeyFromValue(value);
			this.doInsert(key, value);
		}
		this.header.write(this.blockManager.makeWritable(this.bid), 0);
	}

	* [Symbol.iterator](): Iterator<number> {
		let slot = new HashTableSlot();
		for (let i = 0; i < this.slotCount; i++) {
			this.readSlot(i, slot);
			let value = slot.value();
			if (value !== 0) {
				yield value;
			}
		}
	}

	delete(): void {
		this.blockManager.deleteBlock(this.header.table.value());
		this.blockManager.deleteBlock(this.bid);
		this.header.count.value(0);
	}

	getStatistics(): Record<string, utils.Statistic> {
		let statistics: Record<string, utils.Statistic> = {};
		statistics.header = {
			entries: 1,
			bytesPerEntry: HashTableHeader.LENGTH
		};
		statistics.slotsUsed = {
			entries: this.header.count.value(),
			bytesPerEntry: HashTableSlot.LENGTH
		};
		statistics.slotsFree = {
			entries: this.slotCount - this.header.count.value(),
			bytesPerEntry: HashTableSlot.LENGTH
		};
		return statistics;
	}

	insert(key: Array<Uint8Array>, value: number): boolean {
		if (DEBUG) IntegerAssert.atLeast(1, value);
		let slotIndex = this.doInsert(key, value);
		if (slotIndex == null) {
			return false;
		}
		this.header.count.value(this.header.count.value() + 1);
		this.header.write(this.blockManager.makeWritable(this.bid), 0);
		this.resizeIfNecessary();
		return true;
	}

	length(): number {
		return this.header.count.value();
	}

	lookup(key: Array<Uint8Array>): number | undefined {
		let slotIndex = this.doLookup(key);
		if (slotIndex == null) {
			return;
		}
		let slot = new HashTableSlot();
		this.readSlot(slotIndex, slot);
		return slot.value();
	}

	reload(): void {
		this.header.read(this.blockManager.makeReadable(this.bid), 0);
		this.slotCount = Math.floor(this.blockManager.getBlockSize(this.header.table.value()) / HashTableSlot.LENGTH);
	}

	remove(key: Array<Uint8Array>): boolean {
		let slotIndex = this.doRemove(key);
		if (slotIndex == null) {
			return false;
		}
		this.header.count.value(this.header.count.value() - 1);
		this.header.write(this.blockManager.makeWritable(this.bid), 0);
		this.propagateBackwards(slotIndex);
		this.resizeIfNecessary();
		return true;
	}

	vacate(): void {
		this.blockManager.clearBlock(this.header.table.value());
		this.header.count.value(0);
		this.header.write(this.blockManager.makeWritable(this.bid), 0);
	}

	static LENGTH = HashTableHeader.LENGTH;
};
