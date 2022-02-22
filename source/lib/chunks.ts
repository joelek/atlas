import * as utils from "./utils";
import * as asserts from "../mod/asserts";
import { DEBUG } from "./env";

export interface Readable {
	read(buffer: Uint8Array, offset: number): Uint8Array;
};

export interface Writable {
	write(buffer: Uint8Array, offset: number): Uint8Array;
};

export abstract class Chunk {
	protected buffer: Uint8Array;

	constructor(buffer: Uint8Array) {
		this.buffer = buffer;
	}

	read(readable: Readable, offset: number): void {
		readable.read(this.buffer, offset);
	}

	write(writable: Writable, offset: number): void {
		writable.write(this.buffer, offset);
	}
};

export class LogHeader extends Chunk {
	constructor(buffer?: Uint8Array) {
		super(buffer ?? new Uint8Array(LogHeader.LENGTH));
		if (DEBUG) asserts.IntegerAssert.exactly(this.buffer.length, LogHeader.LENGTH);
		this.identifier(LogHeader.IDENTIFIER);
	}

	identifier(value?: string): string {
		return utils.Binary.string(this.buffer, 0, 8, "binary", value);
	}

	redoSize(value?: number): number {
		return utils.Binary.unsigned(this.buffer, 18, 6, value);
	}

	undoSize(value?: number): number {
		return utils.Binary.unsigned(this.buffer, 26, 6, value);
	}

	read(readable: Readable, offset: number): void {
		super.read(readable, offset);
		if (this.identifier() !== LogHeader.IDENTIFIER) {
			throw `Expected identifier to be ${LogHeader.IDENTIFIER}!`;
		}
	}

	static readonly IDENTIFIER = "atlaslog";
	static readonly LENGTH = 32;
};

export class LogDeltaHeader extends Chunk {
	constructor(buffer?: Uint8Array) {
		super(buffer ?? new Uint8Array(LogDeltaHeader.LENGTH));
		if (DEBUG) asserts.IntegerAssert.exactly(this.buffer.length, LogDeltaHeader.LENGTH);
	}

	offset(value?: number): number {
		return utils.Binary.unsigned(this.buffer, 2, 6, value);
	}

	length(value?: number): number {
		return utils.Binary.unsigned(this.buffer, 10, 6, value);
	}

	static readonly LENGTH = 16;
};

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

	static getLength(cateogry: number): number {
		if (DEBUG) asserts.IntegerAssert.atLeast(0, cateogry);
		let length = Math.pow(2, cateogry);
		return length;
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
