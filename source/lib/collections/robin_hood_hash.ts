import * as libcrypto from "crypto";
import { BlockHandler } from "../storage";
import { StreamIterable } from "../stream";
import * as is from "../is";
import * as keys from "../keys";

interface RobinHoodHashEntry {
	key(): keys.Key;
	value(): number
};

interface RobinHoodHashDetail {
	getKeyForValue(value: number): keys.Key;
};

export class RobinHoodHash {
	private blockHandler: BlockHandler;
	private blockIndex: number;
	private detail: RobinHoodHashDetail;

	constructor(
		blockHandler: BlockHandler,
		blockIndex: number,
		detail: RobinHoodHashDetail
	) {
		this.blockHandler = blockHandler;
		this.blockIndex = blockIndex;
		this.detail = detail;
	}

	private readHeader(): { occupiedSlots: number } {
		let buffer = Buffer.alloc(16);
		this.blockHandler.readBlock(this.blockIndex, buffer, 0);
		let occupiedSlots = buffer.readUIntBE(2, 6);
		return {
			occupiedSlots
		};
	}

	private writeHeader(header: { occupiedSlots: number }): void {
		let buffer = Buffer.alloc(16);
		buffer.writeUIntBE(header.occupiedSlots, 2, 6);
		this.blockHandler.writeBlock(this.blockIndex, buffer, 0);
	}

	private readSlot(slotIndex: number): { isOccupied: boolean, probeDistance: number, value: number } {
		let buffer = Buffer.alloc(8);
		this.blockHandler.readBlock(this.blockIndex, buffer, 16 + (slotIndex * 8));
		let flags = buffer.readUIntBE(0, 2);
		let isOccupied = !!((flags >> 15) & 0x0001);
		let probeDistance = ((flags >> 0) & 0x7FFF);
		let value = buffer.readUIntBE(2, 6);
		return {
			isOccupied,
			probeDistance,
			value
		};
	}

	private writeSlot(slotIndex: number, slot: { isOccupied: boolean, probeDistance: number, value: number }): void {
		let buffer = Buffer.alloc(8);
		let flags = 0;
		flags |= (~~slot.isOccupied << 15);
		flags |= (slot.probeDistance << 0);
		buffer.writeUIntBE(flags, 0, 2);
		buffer.writeUIntBE(slot.value, 2, 6);
		this.blockHandler.writeBlock(this.blockIndex, buffer, 16 + (slotIndex * 8));
	}

	private computeOptimalSlot(key: keys.Key): number {
		let slotCount = this.getSlotCount();
		let hash = Buffer.of();
		for (let keyPart of key) {
			hash = libcrypto.createHash("sha256")
				.update(hash)
				.update(keyPart)
				.digest();
		}
		return hash.readUIntBE(0, 6) % slotCount;
	}

	private doInsert(key: keys.Key, value: number): number | undefined {
		let header = this.readHeader();
		let optimalSlot = this.computeOptimalSlot(key);
		let slotCount = this.getSlotCount();
		let probeDistance = 0;
		let slotIndex = optimalSlot;
		for (let i = 0; i < slotCount; i++) {
			let slot = this.readSlot(slotIndex);
			if (!slot.isOccupied) {
				this.writeSlot(slotIndex, {
					isOccupied: true,
					probeDistance,
					value
				});
				header.occupiedSlots += 1;
				this.writeHeader(header);
				return slotIndex;
			}
			if (keys.compareKey(this.detail.getKeyForValue(slot.value), key) === 0) {
				return;
			}
			if (probeDistance > slot.probeDistance) {
				this.writeSlot(slotIndex, {
					isOccupied: true,
					probeDistance,
					value
				});
				value = slot.value;
				probeDistance = slot.probeDistance;
			}
			slotIndex = (slotIndex + 1) % slotCount;
			probeDistance += 1;
		}
	}

	private doLookup(key: keys.Key): number | undefined {
		let optimalSlot = this.computeOptimalSlot(key);
		let slotCount = this.getSlotCount();
		let probeDistance = 0;
		let slotIndex = optimalSlot;
		for (let i = 0; i < slotCount; i++) {
			let slot = this.readSlot(slotIndex);
			if (!slot.isOccupied || probeDistance > slot.probeDistance) {
				return;
			}
			if (keys.compareKey(this.detail.getKeyForValue(slot.value), key) === 0) {
				return slotIndex;
			}
			slotIndex = (slotIndex + 1) % slotCount;
			probeDistance += 1;
		}
	}

	private doRemove(key: keys.Key): number | undefined {
		let header = this.readHeader();
		let optimalSlot = this.computeOptimalSlot(key);
		let slotCount = this.getSlotCount();
		let probeDistance = 0;
		let slotIndex = optimalSlot;
		for (let i = 0; i < slotCount; i++) {
			let slot = this.readSlot(slotIndex);
			if (!slot.isOccupied || probeDistance > slot.probeDistance) {
				return;
			}
			if (keys.compareKey(this.detail.getKeyForValue(slot.value), key) === 0) {
				this.writeSlot(slotIndex, {
					isOccupied: false,
					probeDistance: 0,
					value: 0
				});
				header.occupiedSlots -= 1;
				this.writeHeader(header);
				return slotIndex;
			}
			slotIndex = (slotIndex + 1) % slotCount;
			probeDistance += 1;
		}
	}

	private getSlotCount(): number {
		let blockSize = this.blockHandler.getBlockSize(this.blockIndex);
		return Math.floor((blockSize - 16) / 8);
	}

	private propagateBackwards(slotIndex: number): void {
		let slotCount = this.getSlotCount();
		for (let i = 0; i < slotCount; i++) {
			let slot = this.readSlot((slotIndex + 1) % slotCount);
			if (slot.probeDistance === 0) {
				this.writeSlot(slotIndex, {
					isOccupied: false,
					probeDistance: 0,
					value: 0
				});
				break;
			}
			this.writeSlot(slotIndex, {
				isOccupied: true,
				probeDistance: slot.probeDistance - 1,
				value: slot.value
			});
			slotIndex = (slotIndex + 1) % slotCount;
		}
	}

	private resizeIfNecessary(): void {
		let slotCount = this.getSlotCount();
		let header = this.readHeader();
		let currentLoadFactor = header.occupiedSlots / slotCount;
		let desiredSlotCount = slotCount;
		if (currentLoadFactor <= 0.25) {
			desiredSlotCount = Math.max(Math.ceil(slotCount / 2), 2);
		}
		if (currentLoadFactor >= 0.75) {
			desiredSlotCount = slotCount * 2;
		}
		if (desiredSlotCount === slotCount) {
			return;
		}
		let entries = StreamIterable.of(this).collect();
		let minLength = 16 + (desiredSlotCount * 8);
		this.blockHandler.resizeBlock(this.blockIndex, minLength);
		let newSlotCount = this.getSlotCount();
		if (newSlotCount === slotCount) {
			return;
		}
		this.blockHandler.clearBlock(this.blockIndex);
		for (let entry of entries) {
			this.doInsert(entry.key(), entry.value());
		}
		this.writeHeader(header);
	}

	* [Symbol.iterator](): Iterator<RobinHoodHashEntry> {
		let slotCount = this.getSlotCount();
		for (let slotIndex = 0; slotIndex < slotCount; slotIndex++) {
			let { isOccupied, probeDistance, value} = this.readSlot(slotIndex);
			if (isOccupied) {
				yield {
					key: () => this.detail.getKeyForValue(value),
					value: () => value
				};
			}
		}
	}

	insert(key: keys.Key, value: number): boolean {
		let slotIndex = this.doInsert(key, value);
		if (is.absent(slotIndex)) {
			return false;
		}
		this.resizeIfNecessary();
		return true;
	}

	length(): number {
		let header = this.readHeader();
		return header.occupiedSlots;
	}

	lookup(key: keys.Key): number | undefined {
		let slotIndex = this.doLookup(key);
		if (is.absent(slotIndex)) {
			return;
		}
		let slot = this.readSlot(slotIndex);
		return slot.value;
	}

	remove(key: keys.Key): boolean {
		let slotIndex = this.doRemove(key);
		if (is.absent(slotIndex)) {
			return false;
		}
		this.propagateBackwards(slotIndex);
		this.resizeIfNecessary();
		return true;
	}

	static readonly INITIAL_SIZE = 16 + (2 * 8);
};
