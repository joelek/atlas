import { BlockManager } from "./vfs";
import { BlockReference, Chunk } from "./chunks";
import * as keys from "./keys";
export declare class HashTableHeader extends Chunk {
    readonly count: BlockReference;
    readonly table: BlockReference;
    constructor(buffer?: Uint8Array);
    static readonly LENGTH = 32;
}
export declare class HashTableSlot extends BlockReference {
    constructor(buffer?: Uint8Array);
    probeDistance(value?: number): number;
}
export interface Entry {
    key(): keys.Chunks;
    value(): number;
}
export interface TableDetail {
    getKeyFromValue(value: number): keys.Chunks;
}
export declare class Table {
    private blockManager;
    private bid;
    private detail;
    private header;
    private minimumCapacity;
    constructor(blockManager: BlockManager, detail: TableDetail, options?: {
        bid?: number;
        minimumCapacity?: number;
    });
    private readSlot;
    private writeSlot;
    private computeOptimalSlot;
    private doInsert;
    private doLookup;
    private doRemove;
    private getSlotCount;
    private propagateBackwards;
    private resizeIfNecessary;
    [Symbol.iterator](): Iterator<Entry>;
    clear(): void;
    delete(): void;
    insert(key: keys.Chunks, value: number): boolean;
    length(): number;
    lookup(key: keys.Chunks): number | undefined;
    remove(key: keys.Chunks): boolean;
    static LENGTH: number;
}
