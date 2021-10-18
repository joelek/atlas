import * as libfs from "fs";
import * as libpath from "path";
import { DEBUG } from "../env";
import { IntegerAssert } from "../asserts";
import { Cache } from "./cache";
import * as is from "../is";

namespace fs {
	export function open(filename: string): number {
		let exists = libfs.existsSync(filename);
		libfs.mkdirSync(libpath.dirname(filename), { recursive: true });
		let fd = libfs.openSync(filename, exists ? "r+" : "w+");
		return fd;
	};

	export function read(fd: number, buffer: Buffer, offset: number): Buffer {
		let length = buffer.length;
		let bytes = libfs.readSync(fd, buffer, {
			position: offset
		});
		if (bytes !== length) {
			throw `Expected to read ${length} bytes but read ${bytes}!`;
		}
		return buffer;
	};

	export function size(fd: number): number {
		return libfs.fstatSync(fd).size;
	};

	export function sync(fd: number): void {
		libfs.fsyncSync(fd);
	};

	export function write(fd: number, buffer: Buffer, offset: number): Buffer {
		let length = buffer.length;
		let bytes = libfs.writeSync(fd, buffer, 0, length, offset);
		if (bytes !== length) {
			throw `Expected to write ${length} bytes but wrote ${bytes}!`;
		}
		return buffer;
	};
};

class Counter {
	readonly buffer: Buffer;

	// TODO: Combine into one.
	get count(): number {
		return this.buffer.readUInt32BE(0);
	}

	set count(value: number) {
		if (DEBUG) IntegerAssert.between(0, value, 0xFFFFFFFF);
		this.buffer.writeUInt32BE(value, 0);
	}

	constructor(buffer?: Buffer) {
		buffer = buffer ?? Buffer.alloc(Counter.SIZE);
		if (DEBUG) IntegerAssert.exactly(buffer.length, Counter.SIZE);
		this.buffer = buffer;
	}

	static readonly SIZE = 4;
};

class Pointer {
	readonly buffer: Buffer;

	// TODO: Combine into one.
	get index(): number {
		return this.buffer.readUInt32BE(0);
	}

	set index(value: number) {
		if (DEBUG) IntegerAssert.between(0, value, 0xFFFFFFFF);
		this.buffer.writeUInt32BE(value, 0);
	}

	constructor(buffer?: Buffer) {
		buffer = buffer ?? Buffer.alloc(Pointer.SIZE);
		if (DEBUG) IntegerAssert.exactly(buffer.length, Pointer.SIZE);
		this.buffer = buffer;
	}

	static readonly SIZE = 4;
};

class Entry {
	readonly buffer: Buffer;

	// TODO: Combine into one.
	get offset(): number {
		return Number(this.buffer.readBigUInt64BE(0));
	}

	set offset(value: number) {
		if (DEBUG) IntegerAssert.between(0, value, 0xFFFFFFFFFFFF);
		this.buffer.writeBigUInt64BE(BigInt(value), 0);
	}

	get deleted(): boolean {
		return this.buffer.readUInt8(8) === 0x80;
	}

	set deleted(value: boolean) {
		this.buffer.writeUInt8(value ? 0x80 : 0x00, 8);
	}

	get length(): number {
		return Number(this.buffer.readBigUInt64BE(8) & BigInt(0xFFFFFFFFFFFF)) + 1;
	}

	set length(value: number) {
		value = value - 1;
		if (DEBUG) IntegerAssert.between(0, value, 0xFFFFFFFFFFFF);
		let deleted = this.deleted;
		this.buffer.writeBigUInt64BE(BigInt(value), 8);
		this.deleted = deleted;
	}

	constructor(buffer?: Buffer) {
		buffer = buffer ?? Buffer.alloc(Entry.LENGTH);
		if (DEBUG) IntegerAssert.exactly(buffer.length, Entry.LENGTH);
		this.buffer = buffer;
	}

	static readonly LENGTH = 16;
};

export interface BlockHandler {
	clearBlock(index: number): void;
	cloneBlock(index: number): number;
	createBlock(minLength: number): number;
	deleteBlock(index: number): void;
	getBlockSize(index: number): number;
	getCount(): number;
	readBlock(index: number, buffer?: Buffer, skipLength?: number): Buffer;
	resizeBlock(index: number, minLength: number): void;
	swapBlocks(indexOne: number, indexTwo: number): void;
	writeBlock(index: number, buffer?: Buffer, skipLength?: number): Buffer;
};

export class InMemoryBlockHandler implements BlockHandler {
	private blocks: Array<{
		deleted: boolean,
		buffer: Buffer
	}>;
	private deleted: Array<Array<number>>;

	private computePool(minLength: number): number {
		if (DEBUG) IntegerAssert.atLeast(0, minLength);
		let lengthLog2 = Math.ceil(Math.log2(Math.max(1, minLength)));
		return lengthLog2;
	}

	constructor() {
		this.blocks = new Array<{
			deleted: boolean,
			buffer: Buffer
		}>();
		this.deleted = new Array<Array<number>>();
		for (let i = 0; i < 64; i++) {
			this.deleted.push(new Array<number>());
		}
	}

	clearBlock(index: number): void {
		let entry = this.blocks[index];
		if (is.absent(entry) || entry.deleted) {
			throw `Expected a block for index ${index}!`;
		}
		entry.buffer.fill(0);
	}

	cloneBlock(index: number): number {
		let entry = this.blocks[index];
		if (is.absent(entry) || entry.deleted) {
			throw `Expected a block for index ${index}!`;
		}
		let indexTwo = this.createBlock(entry.buffer.length);
		let entryTwo = this.blocks[indexTwo];
		if (is.absent(entryTwo) || entryTwo.deleted) {
			throw `Expected a block for index ${indexTwo}!`;
		}
		entryTwo.buffer.set(entry.buffer, 0);
		return indexTwo;
	}

	createBlock(minLength: number): number {
		let pool = this.computePool(minLength);
		let index = this.deleted[pool].pop();
		if (is.present(index)) {
			this.blocks[index].deleted = false;
			return index;
		}
		this.blocks.push({
			deleted: false,
			buffer: Buffer.alloc(Math.pow(2, pool))
		});
		return this.blocks.length - 1;
	}

	deleteBlock(index: number): void {
		let entry = this.blocks[index];
		if (is.absent(entry) || entry.deleted) {
			throw `Expected a block for index ${index}!`;
		}
		let pool = this.computePool(entry.buffer.length);
		this.deleted[pool].push(index);
		entry.deleted = true;
	}

	getBlockSize(index: number): number {
		let entry = this.blocks[index];
		if (is.absent(entry) || entry.deleted) {
			throw `Expected a block for index ${index}!`;
		}
		return entry.buffer.length;
	}

	getCount(): number {
		return this.blocks.length;
	}

	readBlock(index: number, buffer?: Buffer, skipLength?: number): Buffer {
		let entry = this.blocks[index];
		if (is.absent(entry) || entry.deleted) {
			throw `Expected a block for index ${index}!`;
		}
		buffer = buffer ?? Buffer.alloc(entry.buffer.length);
		let offset = skipLength ?? 0;
		let length = buffer.length;
		if (DEBUG) IntegerAssert.between(0, offset, entry.buffer.length - 1);
		if (DEBUG) IntegerAssert.between(0, length, entry.buffer.length - offset);
		entry.buffer.copy(buffer, 0, offset);
		return buffer;
	}

	resizeBlock(index: number, minLength: number): void {
		let entry = this.blocks[index];
		if (is.absent(entry) || entry.deleted) {
			throw `Expected a block for index ${index}!`;
		}
		if (this.computePool(minLength) === this.computePool(entry.buffer.length)) {
			return;
		}
		let indexTwo = this.createBlock(minLength);
		let entryTwo = this.blocks[indexTwo];
		if (is.absent(entryTwo) || entryTwo.deleted) {
			throw `Expected a block for index ${indexTwo}!`;
		}
		let length = Math.min(entry.buffer.length, entryTwo.buffer.length);
		let buffer = Buffer.alloc(length);
		this.readBlock(index, buffer);
		this.writeBlock(indexTwo, buffer, 0);
		this.swapBlocks(index, indexTwo);
		this.deleteBlock(indexTwo);
	}

	swapBlocks(indexOne: number, indexTwo: number): void {
		let entryOne = this.blocks[indexOne];
		if (is.absent(entryOne) || entryOne.deleted) {
			throw `Expected a block for index ${indexOne}!`;
		}
		let entryTwo = this.blocks[indexTwo];
		if (is.absent(entryTwo) || entryTwo.deleted) {
			throw `Expected a block for index ${indexTwo}!`;
		}
		this.blocks[indexOne] = entryTwo;
		this.blocks[indexTwo] = entryOne;
	}

	writeBlock(index: number, buffer?: Buffer, skipLength?: number): Buffer {
		let entry = this.blocks[index];
		if (is.absent(entry) || entry.deleted) {
			throw `Expected a block for index ${index}!`;
		}
		buffer = buffer ?? Buffer.alloc(entry.buffer.length);
		let offset = skipLength ?? 0;
		let length = buffer.length;
		if (DEBUG) IntegerAssert.between(0, offset, entry.buffer.length - 1);
		if (DEBUG) IntegerAssert.between(0, length, entry.buffer.length - offset);
		entry.buffer.set(buffer, offset);
		if (is.absent(skipLength)) {
			entry.buffer.set(Buffer.alloc(entry.buffer.length - buffer.length), buffer.length);
		}
		return buffer;
	}
};

export class DiskBlockHandler implements BlockHandler {
	private bin: number;
	private toc: number;
	private blockCache: Cache<number, Buffer>;
	private entryCache: Cache<number, Entry>;
	private inBatchOperation: Set<number>;

	private computePool(minLength: number): number {
		if (DEBUG) IntegerAssert.atLeast(0, minLength);
		let lengthLog2 = Math.ceil(Math.log2(Math.max(1, minLength)));
		return lengthLog2;
	}

	private createNewBlock(minLength: number): number {
		let entry = new Entry();
		entry.offset = fs.size(this.bin);
		entry.length = Math.pow(2, this.computePool(minLength));
		fs.write(this.bin, Buffer.alloc(entry.length), entry.offset);
		fs.write(this.toc, entry.buffer, fs.size(this.toc));
		return this.getCount() - 1;
	}

	private createOldBlock(minLength: number): number {
		let pool = this.computePool(minLength);
		let counter = new Counter();
		this.readBlock(pool, counter.buffer, 0);
		if (counter.count === 0) {
			throw ``;
		}
		let pointer = new Pointer();
		this.readBlock(pool, pointer.buffer, Counter.SIZE + (counter.count - 1) * Pointer.SIZE);
		let index = pointer.index;
		pointer.index = 0;
		this.writeBlock(pool, pointer.buffer, Counter.SIZE + (counter.count - 1) * Pointer.SIZE);
		counter.count -= 1;
		this.writeBlock(pool, counter.buffer, 0);
		let entry = new Entry();
		this.readEntry(index, entry);
		entry.deleted = false;
		this.writeEntry(index, entry);
		return index;
	}

	private readEntry(index: number, entry: Entry): Entry {
		if (DEBUG) IntegerAssert.between(0, index, this.getCount() - 1);
		let cached = this.entryCache.lookup(index);
		if (is.absent(cached)) {
			cached = new Entry();
			fs.read(this.toc, cached.buffer, index * Entry.LENGTH);
			this.entryCache.insert(index, cached);
		}
		cached.buffer.copy(entry.buffer, 0, 0);
		return entry;
	}

	private writeEntry(index: number, entry: Entry): Entry {
		if (DEBUG) IntegerAssert.between(0, index, this.getCount() - 1);
		fs.write(this.toc, entry.buffer, index * Entry.LENGTH);
		let cached = new Entry();
		entry.buffer.copy(cached.buffer, 0, 0);
		this.entryCache.insert(index, cached);
		return entry;
	}

	constructor(path: string) {
		this.bin = fs.open(libpath.join(path, "bin"));
		this.toc = fs.open(libpath.join(path, "toc"));
		this.blockCache = new Cache<number, Buffer>({
			getWeightForValue: (value) => value.length
		}, 512 * 1024 * 1024);
		this.entryCache = new Cache<number, Entry>({
			getWeightForValue: (value) => 1
		}, 1 * 1000 * 1000);
		this.inBatchOperation = new Set<number>();
		if (this.getCount() === 0) {
			for (let i = 0; i < DiskBlockHandler.FIRST_APPLICATION_BLOCK; i++) {
				this.createNewBlock(16);
			}
		}
	}

	batchOperation(index: number, operation: () => void): void {
		if (this.inBatchOperation.has(index)) {
			throw `Expected block ${index} to be in normal operation!`;
		}
		this.inBatchOperation.add(index);
		try {
			operation();
		} catch (error) {
			this.inBatchOperation.delete(index);
			throw error;
		}
		this.inBatchOperation.delete(index);
		let buffer = this.readBlock(index);
		this.writeBlock(index, buffer);
	}

	clearBlock(index: number): void {
		this.writeBlock(index, Buffer.alloc(0));
	}

	cloneBlock(index: number): number {
		let buffer = this.readBlock(index);
		let indexTwo = this.createBlock(buffer.length);
		this.writeBlock(indexTwo, buffer);
		return indexTwo;
	}

	createBlock(minLength: number): number {
		if (minLength === 0) {
			return 0xFFFFFFFF;
		}
		try {
			return this.createOldBlock(minLength);
		} catch (error) {}
		try {
			return this.createNewBlock(minLength);
		} catch (error) {}
		throw `Unable to create block with length ${minLength}!`;
	}

	deleteBlock(index: number): void {
		if (index === 0xFFFFFFFF) {
			return;
		}
		let entry = new Entry();
		this.readEntry(index, entry);
		if (entry.deleted) {
			return;
		}
		let pool = this.computePool(entry.length);
		let counter = new Counter();
		this.readBlock(pool, counter.buffer, 0);
		let minLength = Counter.SIZE + (counter.count + 1) * Pointer.SIZE;
		let length = this.readEntry(pool, new Entry()).length;
		if (minLength > length) {
			this.resizeBlock(pool, minLength);
			this.readBlock(pool, counter.buffer, 0); // Resize can in theory consume one block.
		}
		let pointer = new Pointer();
		pointer.index = index;
		this.writeBlock(pool, pointer.buffer, Counter.SIZE + (counter.count * Pointer.SIZE));
		counter.count += 1;
		this.writeBlock(pool, counter.buffer, 0);
		let buffer = Buffer.alloc(entry.length);
		this.writeBlock(index, buffer, 0);
		entry.deleted = true;
		this.writeEntry(index, entry);
		this.blockCache.remove(index);
		this.inBatchOperation.delete(index);
	}

	getBlockSize(index: number): number {
		if (index === 0xFFFFFFFF) {
			return 0;
		}
		let entry = new Entry();
		this.readEntry(index, entry);
		return entry.length;
	}

	getCount(): number {
		let count = fs.size(this.toc) / Entry.LENGTH;
		if (DEBUG) IntegerAssert.atLeast(0, count);
		return count;
	}

	readBlock(index: number, buffer?: Buffer, skipLength?: number): Buffer {
		if (index === 0xFFFFFFFF) {
			return Buffer.alloc(0);
		}
		let entry = new Entry();
		this.readEntry(index, entry);
		buffer = buffer ?? Buffer.alloc(entry.length);
		let offset = skipLength ?? 0;
		let length = buffer.length;
		if (DEBUG) IntegerAssert.between(0, offset, entry.length - 1);
		if (DEBUG) IntegerAssert.between(0, length, entry.length - offset);
		let cached = this.blockCache.lookup(index);
		if (is.absent(cached)) {
			cached = Buffer.alloc(entry.length);
			fs.read(this.bin, cached, entry.offset);
			this.blockCache.insert(index, cached);
		}
		cached.copy(buffer, 0, offset);
		return buffer;
	}

	resizeBlock(index: number, minLength: number): void {
		if (index === 0xFFFFFFFF) {
			return;
		}
		let entry = new Entry();
		this.readEntry(index, entry);
		if (this.computePool(minLength) === this.computePool(entry.length)) {
			return;
		}
		let indexTwo = this.createBlock(minLength);
		let entryTwo = new Entry();
		this.readEntry(indexTwo, entryTwo);
		let length = Math.min(entry.length, entryTwo.length);
		let buffer = Buffer.alloc(length);
		this.readBlock(index, buffer);
		this.writeBlock(indexTwo, buffer, 0);
		this.swapBlocks(index, indexTwo);
		this.deleteBlock(indexTwo);
	}

	swapBlocks(indexOne: number, indexTwo: number): void {
		let entryOne = new Entry();
		this.readEntry(indexOne, entryOne);
		let entryTwo = new Entry();
		this.readEntry(indexTwo, entryTwo);
		this.writeEntry(indexOne, entryTwo);
		this.writeEntry(indexTwo, entryOne);
		let blockOne = this.blockCache.remove(indexOne);
		let blockTwo = this.blockCache.remove(indexTwo);
		this.blockCache.insert(indexOne, blockTwo);
		this.blockCache.insert(indexTwo, blockOne);
	}

	writeBlock(index: number, buffer?: Buffer, skipLength?: number): Buffer {
		if (index === 0xFFFFFFFF) {
			return Buffer.alloc(0);
		}
		let entry = new Entry();
		this.readEntry(index, entry);
		buffer = buffer ?? Buffer.alloc(entry.length);
		let offset = skipLength ?? 0;
		let length = buffer.length;
		if (DEBUG) IntegerAssert.between(0, offset, entry.length - 1);
		if (DEBUG) IntegerAssert.between(0, length, entry.length - offset);
		let cached = this.blockCache.lookup(index);
		if (is.absent(cached)) {
			cached = this.readBlock(index);
			this.blockCache.insert(index, cached);
		}
		cached.set(buffer, offset);
		if (is.absent(skipLength)) {
			cached.set(Buffer.alloc(entry.length - buffer.length), buffer.length);
		}
		if (!this.inBatchOperation.has(index)) {
			fs.write(this.bin, buffer, entry.offset + offset);
			if (is.absent(skipLength)) {
				fs.write(this.bin, Buffer.alloc(entry.length - buffer.length), entry.offset + buffer.length);
			}
		}
		return buffer
	}

	static readonly FIRST_APPLICATION_BLOCK = 64;
};
