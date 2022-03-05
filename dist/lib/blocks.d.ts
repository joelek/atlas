import { Chunk, Readable, Writable } from "./chunks";
import { File } from "./files";
export declare enum BlockFlags {
    APPLICATION_0 = 0,
    APPLICATION_1 = 1,
    APPLICATION_2 = 2,
    APPLICATION_3 = 3,
    RESERVED_4 = 4,
    RESERVED_5 = 5,
    RESERVED_6 = 6,
    DELETED = 7
}
export declare class BlockHeader extends Chunk {
    constructor(buffer?: Uint8Array);
    flag(bit: number, value?: boolean): boolean;
    flags(value?: number): number;
    category(value?: number): number;
    offset(value?: number): number;
    length(value?: number): number;
    static getCategory(minLength: number): number;
    static getLength(cateogry: number): number;
    static readonly LENGTH = 8;
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
    cloneBlock(idOne: number): number;
    createBlock(minLength: number): number;
    deleteBlock(id: number): void;
    getBlockCount(): number;
    getBlockFlag(id: number, bit: number): boolean;
    getBlockSize(id: number): number;
    makeReadable(id: number): Readable;
    makeWritable(id: number): Writable;
    readBlock(id: number, data?: Uint8Array, blockOffset?: number): Uint8Array;
    resizeBlock(idOne: number, minLength: number): void;
    setBlockFlag(id: number, bit: number, value: boolean): void;
    swapBlocks(idOne: number, idTwo: number): void;
    writeBlock(id: number, data: Uint8Array, blockOffset?: number): Uint8Array;
}
