import { BlockManager, BlockReference } from "./blocks";
import { Chunk } from "./chunks";
import * as utils from "./utils";
export declare function compareBuffers(one: Array<Uint8Array>, two: Array<Uint8Array>): number;
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
export interface TableDetail {
    getKeyFromValue(value: number): Array<Uint8Array>;
}
export declare class Table {
    private blockManager;
    private bid;
    private detail;
    private header;
    private minimumCapacity;
    private slotCount;
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
    private propagateBackwards;
    private resizeIfNecessary;
    [Symbol.iterator](): Iterator<number>;
    delete(): void;
    getStatistics(): Record<string, utils.Statistic>;
    insert(key: Array<Uint8Array>, value: number): boolean;
    length(): number;
    lookup(key: Array<Uint8Array>): number | undefined;
    reload(): void;
    remove(key: Array<Uint8Array>): boolean;
    vacate(): void;
    static LENGTH: number;
}
