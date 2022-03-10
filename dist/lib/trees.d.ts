import { BlockManager } from "./blocks";
import { Chunk } from "./chunks";
export declare type Relationship = "^=" | "=" | ">" | ">=" | "<" | "<=";
export declare type Direction = "increasing" | "decreasing";
export declare function computeCommonPrefixLength(one: Array<number>, two: Array<number>): number;
export declare function getNibblesFromBytes(buffer: Uint8Array): Array<number>;
export declare function getBytesFromNibbles(nibbles: Array<number>): Uint8Array;
export declare class NodeHead extends Chunk {
    private nibbles;
    constructor(buffer?: Uint8Array);
    prefix(value?: Array<number>): Array<number>;
    resident(value?: number): number;
    parent(value?: number): number;
    subtree(value?: number): number;
    total(value?: number): number;
    static readonly LENGTH = 32;
}
export declare class NodeBody extends Chunk {
    constructor(buffer?: Uint8Array);
    child(index: number, value?: number): number;
    static readonly OFFSET = 32;
    static readonly LENGTH: number;
}
export declare type RadixTreeRange = {
    offset: number;
    length: number;
};
export declare function combineRanges(one: RadixTreeRange, two: RadixTreeRange): RadixTreeRange | undefined;
export declare class RadixTree {
    private blockManager;
    private blockIndex;
    private createDecreasingIterable;
    private createIncreasingIterable;
    private createIterable;
    private updateChildParents;
    private createNodes;
    private getRange;
    private getOffset;
    private updateTotal;
    private doDelete;
    constructor(blockManager: BlockManager, blockIndex: number);
    [Symbol.iterator](): Iterator<number>;
    branch(key: Array<Uint8Array>): RadixTree | undefined;
    delete(): void;
    insert(key: Array<Uint8Array>, value: number): boolean;
    length(): number;
    lookup(key: Array<Uint8Array>): number | undefined;
    remove(key: Array<Uint8Array>): boolean;
    search(key: Array<Uint8Array>, relationship: Relationship, options?: {
        anchor?: Array<Uint8Array>;
        offset?: number;
        length?: number;
        directions?: Array<Direction>;
    }): Iterable<number>;
    static readonly INITIAL_SIZE = 32;
}
