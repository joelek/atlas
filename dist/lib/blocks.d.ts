import { Readable, Writable } from "./chunks";
import { File } from "./files";
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
