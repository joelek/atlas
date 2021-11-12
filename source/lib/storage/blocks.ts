import * as bedrock from "@joelek/bedrock";
import * as libpath from "path";
import { DEBUG } from "../env";
import { IntegerAssert } from "../asserts";
import { Cache } from "./cache";
import * as is from "../is";
import * as fs from "./fs";

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
	debug(): void;
	clearBlock(index: number): void;
	cloneBlock(index: number): number;
	commitTransaction(): void;
	createBlock(minLength: number): number;
	deleteBlock(index: number): void;
	discardTransaction(): void;
	getBlockSize(index: number): number;
	getRootBlock(): number | undefined;
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

	debug(): void {

	}

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
		this.createBlock(32); // TODO: Remove when zero and null are distinguishable.
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

	commitTransaction(): void {

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

	discardTransaction(): void {

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

	getRootBlock(): number | undefined {
		if (this.getCount() > InMemoryBlockHandler.FIRST_APPLICATION_BLOCK) {
			return InMemoryBlockHandler.FIRST_APPLICATION_BLOCK;
		}
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

	static readonly FIRST_APPLICATION_BLOCK = 64;
};

const Transaction = bedrock.codecs.Object.of({
	bin: bedrock.codecs.Object.of({
		initialSize: bedrock.codecs.BigInt,
		currentSize: bedrock.codecs.BigInt,
		deltas: bedrock.codecs.Record.of(
			bedrock.codecs.Object.of({
				offset: bedrock.codecs.BigInt,
				redo: bedrock.codecs.Binary,
				undo: bedrock.codecs.Binary
			})
		)
	}),
	toc: bedrock.codecs.Object.of({
		initialSize: bedrock.codecs.BigInt,
		currentSize: bedrock.codecs.BigInt,
		deltas: bedrock.codecs.Record.of(
			bedrock.codecs.Object.of({
				offset: bedrock.codecs.BigInt,
				redo: bedrock.codecs.Binary,
				undo: bedrock.codecs.Binary
			})
		)
	})
});

type Transaction = ReturnType<typeof Transaction["decode"]>;

export class DiskBlockHandler implements BlockHandler {
	private bin: number;
	private log: number;
	private toc: number;
	private blockCache: Cache<number, Buffer>;
	private entryCache: Cache<number, Entry>;
	private transaction: Transaction;

	debug(): void {
		let entry = new Entry();
		let counter = new Counter();
		let pointer = new Pointer();
		for (let pool = 0; pool < 10; pool++) {
			fs.read(this.toc, entry.buffer, pool * Entry.LENGTH);
			fs.read(this.bin, counter.buffer, entry.offset);
			console.log("pool: ", Math.pow(2, pool), "bytes", entry.offset, entry.length, "has", counter.count, "free blocks");
			for (let i = 0; i < counter.count; i++) {
				fs.read(this.bin, pointer.buffer, entry.offset + Counter.SIZE + (i) * Pointer.SIZE);
				console.log("\t" + pointer.index);
			}
		}
	}

	private computePool(minLength: number): number {
		if (DEBUG) IntegerAssert.atLeast(0, minLength);
		let lengthLog2 = Math.ceil(Math.log2(Math.max(1, minLength)));
		return lengthLog2;
	}

	private createNewBlock(minLength: number): number {
		let index = this.getCount();
		let entry = new Entry();
		entry.offset = Number(this.transaction.bin.currentSize);
		entry.length = Math.pow(2, this.computePool(minLength));
		this.transaction.bin.deltas[entry.offset] = {
			offset: BigInt(entry.offset),
			redo: new Uint8Array(entry.length),
			undo: new Uint8Array(entry.length)
		};
		this.transaction.toc.deltas[index] = {
			offset: BigInt(index * Entry.LENGTH),
			redo: Uint8Array.from(entry.buffer),
			undo: new Uint8Array(Entry.LENGTH)
		};
		this.transaction.bin.currentSize += BigInt(entry.length);
		this.transaction.toc.currentSize += BigInt(Entry.LENGTH);
		return index;
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
		let delta = this.transaction.toc.deltas[index];
		if (is.present(delta)) {
			Buffer.from(delta.redo).copy(entry.buffer, 0, 0);
		} else {
			let cached = this.entryCache.lookup(index);
			if (is.absent(cached)) {
				cached = new Entry();
				fs.read(this.toc, cached.buffer, index * Entry.LENGTH);
				this.entryCache.insert(index, cached);
			}
			cached.buffer.copy(entry.buffer, 0, 0);
		}
		return entry;
	}

	private writeEntry(index: number, entry: Entry): Entry {
		if (DEBUG) IntegerAssert.between(0, index, this.getCount() - 1);
		let delta = this.transaction.toc.deltas[index];
		if (is.absent(delta)) {
			let offset = BigInt(index * Entry.LENGTH);
			let redo = new Uint8Array(Entry.LENGTH);
			let undo = Uint8Array.from(this.readEntry(index, new Entry).buffer);
			delta = {
				offset,
				redo,
				undo
			};
			this.transaction.toc.deltas[index] = delta;
			this.entryCache.remove(index);
		}
		entry.buffer.copy(delta.redo, 0, 0);
		return entry;
	}

	private redoTransaction(): void {
		for (let key in this.transaction.bin.deltas) {
			let delta = this.transaction.bin.deltas[key];
			fs.write(this.bin, Buffer.from(delta.redo), Number(delta.offset));
		}
		fs.sync(this.bin);
		for (let key in this.transaction.toc.deltas) {
			let delta = this.transaction.toc.deltas[key];
			fs.write(this.toc, Buffer.from(delta.redo), Number(delta.offset));
		}
		fs.sync(this.toc);
		this.discardTransaction();
	}

	private undoTransaction(): void {
		for (let key in this.transaction.bin.deltas) {
			let delta = this.transaction.bin.deltas[key];
			fs.write(this.bin, Buffer.from(delta.undo), Number(delta.offset));
		}
		fs.truncate(this.bin, Number(this.transaction.bin.initialSize));
		fs.sync(this.bin);
		for (let key in this.transaction.toc.deltas) {
			let delta = this.transaction.toc.deltas[key];
			fs.write(this.toc, Buffer.from(delta.undo), Number(delta.offset));
		}
		fs.truncate(this.toc, Number(this.transaction.toc.initialSize));
		fs.sync(this.toc);
		this.discardTransaction();
	}

	constructor(path: string) {
		this.bin = fs.open(libpath.join(path, "bin"));
		this.log = fs.open(libpath.join(path, "log"));
		this.toc = fs.open(libpath.join(path, "toc"));
		this.transaction = {
			bin: {
				currentSize: BigInt(fs.size(this.bin)),
				initialSize: BigInt(fs.size(this.bin)),
				deltas: {}
			},
			toc: {
				currentSize: BigInt(fs.size(this.toc)),
				initialSize: BigInt(fs.size(this.toc)),
				deltas: {}
			}
		};
		if (fs.size(this.log) > 0) {
			this.transaction = Transaction.decode(Uint8Array.from(fs.read(this.log, Buffer.alloc(fs.size(this.log)), 0)));
			this.undoTransaction();
		}
		this.blockCache = new Cache<number, Buffer>({
			getWeightForValue: (value) => value.length
		}, 512 * 1024 * 1024);
		this.entryCache = new Cache<number, Entry>({
			getWeightForValue: (value) => 1
		}, 1 * 1000 * 1000);
		if (this.getCount() === 0) {
			for (let i = 0; i < DiskBlockHandler.FIRST_APPLICATION_BLOCK; i++) {
				this.createNewBlock(16);
			}
			this.commitTransaction();
		}
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

	commitTransaction(): void {
		fs.truncate(this.log, 0);
		fs.write(this.log, Buffer.from(Transaction.encode(this.transaction)), 0);
		fs.sync(this.log);
		this.redoTransaction();
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
		let length = this.getBlockSize(pool);
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
	}

	discardTransaction(): void {
		fs.truncate(this.log, 0);
		this.transaction = {
			bin: {
				currentSize: BigInt(fs.size(this.bin)),
				initialSize: BigInt(fs.size(this.bin)),
				deltas: {}
			},
			toc: {
				currentSize: BigInt(fs.size(this.toc)),
				initialSize: BigInt(fs.size(this.toc)),
				deltas: {}
			}
		}
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
		let count = Number(this.transaction.toc.currentSize) / Entry.LENGTH;
		if (DEBUG) IntegerAssert.atLeast(0, count);
		return count;
	}

	getRootBlock(): number | undefined {
		if (this.getCount() > DiskBlockHandler.FIRST_APPLICATION_BLOCK) {
			return DiskBlockHandler.FIRST_APPLICATION_BLOCK;
		}
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
		let delta = this.transaction.bin.deltas[entry.offset];
		if (is.present(delta)) {
			Buffer.from(delta.redo).copy(buffer, 0, offset);
		} else {
			let cached = this.blockCache.lookup(index);
			if (is.absent(cached)) {
				cached = Buffer.alloc(entry.length);
				fs.read(this.bin, cached, entry.offset);
				this.blockCache.insert(index, cached);
			}
			cached.copy(buffer, 0, offset);
		}
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
		if (is.present(blockTwo)) {
			this.blockCache.insert(indexOne, blockTwo);
		}
		if (is.present(blockOne)) {
			this.blockCache.insert(indexTwo, blockOne);
		}
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
		let delta = this.transaction.bin.deltas[entry.offset];
		if (is.absent(delta)) {
			let offset = BigInt(entry.offset);
			let undo = Uint8Array.from(this.readBlock(index));
			let redo = Uint8Array.from(undo);
			delta = {
				offset,
				redo,
				undo
			};
			this.transaction.bin.deltas[entry.offset] = delta;
			this.blockCache.remove(index);
		}
		buffer.copy(delta.redo, offset);
		if (is.absent(skipLength)) {
			delta.redo.fill(0, buffer.length);
		}
		return buffer
	}

	static readonly FIRST_APPLICATION_BLOCK = 64;
};
