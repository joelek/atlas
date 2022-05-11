import * as asserts from "../mod/asserts";
import { Chunk, Readable, Writable } from "./chunks";
import { File } from "./files";
import { DEBUG } from "./variables";
import * as utils from "./utils";

export enum BlockFlags {
	APPLICATION_0 = 0,
	APPLICATION_1 = 1,
	APPLICATION_2 = 2,
	APPLICATION_3 = 3,
	RESERVED_4 = 4,
	RESERVED_5 = 5,
	RESERVED_6 = 6,
	DELETED = 7,
};

export class BlockHeader extends Chunk {
	constructor(buffer?: Uint8Array) {
		super(buffer ?? new Uint8Array(BlockHeader.LENGTH));
		if (DEBUG) asserts.IntegerAssert.exactly(this.buffer.length, BlockHeader.LENGTH);
	}

	flag(bit: number, value?: boolean): boolean {
		return utils.Binary.boolean(this.buffer, 0, bit, value);
	}

	flags(value?: number): number {
		return utils.Binary.unsigned(this.buffer, 0, 1, value);
	}

	category(value?: number): number {
		return utils.Binary.unsigned(this.buffer, 1, 1, value);
	}

	offset(value?: number): number {
		return utils.Binary.unsigned(this.buffer, 2, 6, value);
	}

	length(value?: number): number {
		let category = this.category(value != null ? BlockHeader.getCategory(value) : undefined);
		return BlockHeader.getLength(category);
	}

	static getCategory(minLength: number): number {
		if (DEBUG) asserts.IntegerAssert.atLeast(1, minLength);
		let category = Math.ceil(Math.log2(minLength));
		return category;
	}

	static getLength(category: number): number {
		if (DEBUG) asserts.IntegerAssert.atLeast(0, category);
		if (category <= 31) {
			return (1 << category) >>> 0;
		} else {
			return Math.pow(2, category);
		}
	}

	static readonly LENGTH = 8;
};

export class BlockReference extends Chunk {
	constructor(buffer?: Uint8Array) {
		super(buffer ?? new Uint8Array(BlockReference.LENGTH));
		if (DEBUG) asserts.IntegerAssert.exactly(this.buffer.length, BlockReference.LENGTH);
	}

	metadata(value?: number): number {
		return utils.Binary.unsigned(this.buffer, 0, 2, value);
	}

	value(value?: number): number {
		return utils.Binary.unsigned(this.buffer, 2, 6, value);
	}

	static readonly LENGTH = 8;
};

export class BinHeader extends Chunk {
	readonly table: BlockHeader;
	readonly count: BlockReference;
	readonly pools: Array<BlockHeader>;

	constructor(buffer?: Uint8Array) {
		super(buffer ?? new Uint8Array(BinHeader.LENGTH));
		if (DEBUG) asserts.IntegerAssert.exactly(this.buffer.length, BinHeader.LENGTH);
		this.identifier(BinHeader.IDENTIFIER);
		this.table = new BlockHeader(this.buffer.subarray(16, 16 + BlockHeader.LENGTH));
		this.count = new BlockReference(this.buffer.subarray(24, 24 + BlockReference.LENGTH));
		this.pools = new Array<BlockHeader>();
		let offset = 32;
		for (let i = 0; i < 64; i++) {
			let pool = new BlockHeader(this.buffer.subarray(offset, offset + BlockHeader.LENGTH));
			this.pools.push(pool);
			offset += BlockHeader.LENGTH;
		}
	}

	identifier(value?: string): string {
		return utils.Binary.string(this.buffer, 0, 8, "binary", value);
	}

	read(readable: Readable, offset: number): void {
		super.read(readable, offset);
		if (this.identifier() !== BinHeader.IDENTIFIER) {
			throw `Expected identifier to be ${BinHeader.IDENTIFIER}!`;
		}
	}

	static readonly IDENTIFIER = "atlasbin";
	static readonly LENGTH = 32 + 64 * BlockHeader.LENGTH;
};

export class BlockManager {
	private file: File;
	private header: BinHeader;

	constructor(file: File, options?: {
		initialTableCapacity?: number,
		initialPoolCapacity?: number
	}) {
		this.file = file;
		this.header = new BinHeader();
		if (this.file.size() === 0) {
			this.header.write(this.file, 0);
		} else {
			this.header.read(this.file, 0);
		}
		let initialTableCapacity = options?.initialTableCapacity ?? 256;
		let initialPoolCapacity = options?.initialPoolCapacity ?? 16;
		if (DEBUG) asserts.IntegerAssert.atLeast(1, initialTableCapacity);
		if (DEBUG) asserts.IntegerAssert.atLeast(1, initialPoolCapacity);
		if (this.header.table.offset() === 0) {
			this.allocateBlock(this.header.table, initialTableCapacity * BlockHeader.LENGTH);
		}
		for (let pool of this.header.pools) {
			if (pool.offset() === 0) {
				this.allocateBlock(pool, initialPoolCapacity * BlockReference.LENGTH);
			}
		}
		this.header.write(this.file, 0);
		this.file.persist();
	}

	private allocateBlock(header: BlockHeader, minLength: number): void {
		let offset = header.offset(this.file.size());
		let length = header.length(minLength);
		this.file.resize(offset + length);
	}

	private resizeSystemBlock(header: BlockHeader, minLength: number): void {
		if (BlockHeader.getCategory(minLength) <= header.category()) {
			return;
		}
		let offset = header.offset();
		let length = header.length();
		let oldHeader = new BlockHeader();
		oldHeader.offset(offset);
		oldHeader.length(length);
		let buffer = new Uint8Array(length);
		this.file.read(buffer, offset);
		this.allocateBlock(header, minLength);
		this.file.write(buffer, header.offset());
		let count = this.header.count.value();
		this.header.count.value(count + 1);
		this.header.write(this.file, 0);
		let id = count;
		this.writeBlockHeader(id, oldHeader);
		this.deleteBlock(id);
	}

	private createNewBlock(minLength: number): number {
		let length = this.header.table.length();
		let count = this.header.count.value();
		let capactity = Math.floor(length / BlockHeader.LENGTH);
		if (count === capactity) {
			this.resizeSystemBlock(this.header.table, length + length);
			// The old system block becomes an application block which affects the block count.
			count = this.header.count.value();
		}
		this.header.count.value(count + 1);
		this.header.write(this.file, 0);
		let id = count;
		let header = new BlockHeader();
		this.allocateBlock(header, minLength);
		this.writeBlockHeader(id, header);
		return id;
	}

	private createOldBlock(minLength: number): number {
		let category = BlockHeader.getCategory(minLength);
		let pool = this.header.pools[category];
		let offset = pool.offset();
		let counter = new BlockReference();
		counter.read(this.file, offset);
		let count = counter.value();
		if (count === 0) {
			throw `Expected pool to contain at least one free block!`;
		}
		let pointer = new BlockReference();
		pointer.read(this.file, offset + BlockReference.LENGTH + (count - 1) * BlockReference.LENGTH);
		let id = pointer.value();
		pointer.value(0);
		pointer.write(this.file, offset + BlockReference.LENGTH + (count - 1) * BlockReference.LENGTH);
		counter.value(count - 1);
		counter.write(this.file, offset);
		let header = new BlockHeader();
		this.readBlockHeader(id, header, true);
		header.flag(BlockFlags.DELETED, false);
		this.writeBlockHeader(id, header);
		return id;
	}

	private readBlockHeader(id: number, header: BlockHeader, deleted?: boolean): void {
		let count = this.getBlockCount();
		if (DEBUG) asserts.IntegerAssert.between(0, id, count - 1);
		let offset = this.header.table.offset();
		header.read(this.file, offset + id * BlockHeader.LENGTH);
		if (deleted != null) {
			if (deleted) {
				if (!header.flag(BlockFlags.DELETED)) {
					throw `Expected block to be deleted!`;
				}
			} else {
				if (header.flag(BlockFlags.DELETED)) {
					throw `Expected block to not be deleted!`;
				}
			}
		}
	}

	private writeBlockHeader(id: number, header: BlockHeader): void {
		let count = this.getBlockCount();
		if (DEBUG) asserts.IntegerAssert.between(0, id, count - 1);
		let offset = this.header.table.offset();
		header.write(this.file, offset + id * BlockHeader.LENGTH);
	}

	* [Symbol.iterator](): Iterator<{ bid: number, buffer: Uint8Array }> {
		for (let bid = 0; bid < this.getBlockCount(); bid++) {
			let header = new BlockHeader();
			this.readBlockHeader(bid, header);
			if (!header.flag(BlockFlags.DELETED)) {
				let buffer = this.readBlock(bid);
				yield {
					bid,
					buffer
				};
			}
		}
	}

	clearBlock(id: number): void {
		let header = new BlockHeader();
		this.readBlockHeader(id, header, false);
		let buffer = new Uint8Array(header.length());
		this.writeBlock(id, buffer, 0);
	}

	cloneBlock(idOne: number): number {
		let headerOne = new BlockHeader();
		this.readBlockHeader(idOne, headerOne, false);
		let buffer = new Uint8Array(headerOne.length());
		this.readBlock(idOne, buffer, 0);
		let idTwo = this.createBlock(buffer.length);
		this.writeBlock(idTwo, buffer, 0);
		return idTwo;
	}

	createBlock(minLength: number): number {
		try {
			return this.createOldBlock(minLength);
		} catch (error) {}
		try {
			return this.createNewBlock(minLength);
		} catch (error) {}
		throw `Expected block with a length of at least ${minLength} bytes to be created!`;
	}

	deleteBlock(id: number): void {
		let header = new BlockHeader();
		this.readBlockHeader(id, header, false);
		let category = header.category();
		let pool = this.header.pools[category];
		let offset = pool.offset();
		let counter = new BlockReference();
		counter.read(this.file, offset);
		let count = counter.value();
		let minLength = BlockReference.LENGTH + (count + 1) * BlockReference.LENGTH;
		if (minLength > pool.length()) {
			this.resizeSystemBlock(pool, minLength);
			offset = pool.offset();
			// The pool block may in theory be deleted and placed in itself.
			counter.read(this.file, offset);
			count = counter.value();
		}
		let pointer = new BlockReference();
		pointer.value(id);
		pointer.write(this.file, offset + BlockReference.LENGTH + count * BlockReference.LENGTH);
		counter.value(count + 1);
		counter.write(this.file, offset);
		this.clearBlock(id);
		header.flags(0);
		header.flag(BlockFlags.DELETED, true);
		this.writeBlockHeader(id, header);
	}

	getBlockCount(): number {
		return this.header.count.value();
	}

	getBlockFlag(id: number, bit: number): boolean {
		let header = new BlockHeader();
		this.readBlockHeader(id, header, false);
		if (DEBUG) asserts.IntegerAssert.between(BlockFlags.APPLICATION_0, bit, BlockFlags.APPLICATION_3);
		return header.flag(bit);
	}

	getBlockSize(id: number): number {
		let header = new BlockHeader();
		this.readBlockHeader(id, header, false);
		return header.length();
	}

	makeReadable(id: number): Readable {
		return {
			read: (buffer, offset) => this.readBlock(id, buffer, offset)
		};
	}

	makeWritable(id: number): Writable {
		return {
			write: (buffer, offset) => this.writeBlock(id, buffer, offset)
		};
	}

	readBlock(id: number, data?: Uint8Array, blockOffset?: number): Uint8Array {
		let header = new BlockHeader();
		this.readBlockHeader(id, header, false);
		let offset = header.offset();
		let length = header.length();
		data = data ?? new Uint8Array(length);
		let activeBlockOffset = blockOffset ?? 0;
		if (DEBUG) asserts.IntegerAssert.between(0, activeBlockOffset, length);
		if (DEBUG) asserts.IntegerAssert.between(0, data.length, length - activeBlockOffset);
		if (blockOffset == null) {
			let buffer = new Uint8Array(length);
			this.file.read(buffer, offset + activeBlockOffset);
			data.set(buffer.subarray(0, data.length), 0);
		} else {
			this.file.read(data, offset + activeBlockOffset);
		}
		return data;
	}

	reload(): void {
		this.header.read(this.file, 0);
	}

	resizeBlock(idOne: number, minLength: number): void {
		let headerOne = new BlockHeader();
		this.readBlockHeader(idOne, headerOne, false);
		if (BlockHeader.getCategory(minLength) === headerOne.category()) {
			return;
		}
		let idTwo = this.createBlock(minLength);
		let headerTwo = new BlockHeader();
		this.readBlockHeader(idTwo, headerTwo, false);
		let length = Math.min(headerOne.length(), headerTwo.length());
		let buffer = new Uint8Array(length);
		this.readBlock(idOne, buffer, 0);
		this.writeBlock(idTwo, buffer, 0);
		this.swapBlocks(idOne, idTwo);
		this.deleteBlock(idTwo);
	}

	setBlockFlag(id: number, bit: number, value: boolean): void {
		let header = new BlockHeader();
		this.readBlockHeader(id, header, false);
		if (DEBUG) asserts.IntegerAssert.between(BlockFlags.APPLICATION_0, bit, BlockFlags.APPLICATION_3);
		header.flag(bit, value);
		this.writeBlockHeader(id, header);
	}

	swapBlocks(idOne: number, idTwo: number): void {
		let headerOne = new BlockHeader();
		this.readBlockHeader(idOne, headerOne, false);
		let headerTwo = new BlockHeader();
		this.readBlockHeader(idTwo, headerTwo, false);
		this.writeBlockHeader(idOne, headerTwo);
		this.writeBlockHeader(idTwo, headerOne);
	}

	writeBlock(id: number, data: Uint8Array, blockOffset?: number): Uint8Array {
		let header = new BlockHeader();
		this.readBlockHeader(id, header, false);
		let offset = header.offset();
		let length = header.length();
		let activeBlockOffset = blockOffset ?? 0;
		if (DEBUG) asserts.IntegerAssert.between(0, activeBlockOffset, length);
		if (DEBUG) asserts.IntegerAssert.between(0, data.length, length - activeBlockOffset);
		if (blockOffset == null) {
			let buffer = new Uint8Array(length);
			buffer.set(data, 0);
			this.file.write(buffer, offset + activeBlockOffset);
		} else {
			this.file.write(data, offset + activeBlockOffset);
		}
		return data;
	}
};
