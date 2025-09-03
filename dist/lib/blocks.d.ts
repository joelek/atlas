import { Chunk, Readable, Writable } from "./chunks";
import { File } from "./files";
import * as utils from "./utils";
export declare enum BlockFlags1 {
    COMPRESSION_REQUESTED = 6,
    DELETED = 7
}
export declare enum BlockFlags2 {
    RESERVED_6 = 6,
    RESERVED_7 = 7
}
export declare class BlockHeader extends Chunk {
    constructor(buffer?: Uint8Array);
    flag1(bit: BlockFlags1, value?: boolean): boolean;
    flags1(value?: number): number;
    uncompressedCategory(value?: number): number;
    flag2(bit: BlockFlags2, value?: boolean): boolean;
    flags2(value?: number): number;
    allocatedCategory(value?: number): number;
    offset(value?: number): number;
    uncompressedLength(value?: number): number;
    allocatedLength(value?: number): number;
    isCompressionRequested(): boolean;
    isDeleted(): boolean;
    isCompressed(): boolean;
    toJSON(): {
        isDeleted: boolean;
        isCompressionRequested: boolean;
        isCompressed: boolean;
        allocatedCategory: number;
        uncompressedCategory: number;
        offset: number;
    };
    toString(): string;
    static getCategory(minLength: number): number;
    static getLength(category: number): number;
    static readonly LENGTH = 8;
    static readonly CATEGORY_MASK = 63;
    static readonly FLAGS_MASK = 192;
}
export declare class BlockReference extends Chunk {
    constructor(buffer?: Uint8Array);
    metadata(value?: number): number;
    value(value?: number): number;
    static readonly LENGTH = 8;
}
export declare class BinHeader extends Chunk {
    readonly table: BlockHeader;
    readonly count: BlockReference;
    readonly pools: Array<BlockHeader>;
    constructor(buffer?: Uint8Array);
    identifier(value?: string): string;
    read(readable: Readable, offset: number): void;
    static readonly IDENTIFIER = "atlasbin";
    static readonly LENGTH: number;
}
export declare class BlockManager {
    private file;
    private header;
    constructor(file: File, options?: {
        initialTableCapacity?: number;
        initialPoolCapacity?: number;
    });
    private allocateBlock;
    private resizeSystemBlock;
    private createNewBlock;
    private createOldBlock;
    private readBlockHeader;
    private writeBlockHeader;
    [Symbol.iterator](): Iterator<{
        bid: number;
        buffer: Uint8Array;
    }>;
    clearBlock(id: number): void;
    cloneBlock(idOne: number, compression?: boolean): number;
    createBlock(minLength: number, compression?: boolean): number;
    deleteBlock(id: number): void;
    getBlockCount(): number;
    getBlockSize(id: number): number;
    getStatistics(): Record<string, utils.Statistic>;
    makeReadable(id: number): Readable;
    makeWritable(id: number): Writable;
    readBlock(id: number, data?: Uint8Array, blockOffset?: number): Uint8Array;
    protected readCompleteBlock(header: BlockHeader, data: Uint8Array): void;
    protected readPartialBlock(header: BlockHeader, data: Uint8Array, activeBlockOffset: number): void;
    reload(): void;
    recreateBlock(idOne: number, minLength: number): void;
    resizeBlock(idOne: number, minLength: number): void;
    swapBlocks(idOne: number, idTwo: number): void;
    writeBlock(id: number, data: Uint8Array, blockOffset?: number): Uint8Array;
    protected writeCompleteBlock(header: BlockHeader, id: number, data: Uint8Array): void;
    protected writePartialBlock(header: BlockHeader, id: number, data: Uint8Array, activeBlockOffset: number): void;
    static readonly RESERVED_BLOCK_DATABASE_SCHEMA = 0;
}
