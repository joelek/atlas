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
    prefixLength(value?: number): number;
    prefix(value?: Array<number>): Array<number>;
    resident(value?: number): number;
    subtree(value?: number): number;
    total(value?: number): number;
    static readonly LENGTH = 32;
    static readonly MAX_PREFIX_BYTES = 13;
    static readonly MAX_PREFIX_NIBBLES: number;
}
export declare class NodeBody extends Chunk {
    constructor(buffer?: Uint8Array);
    child(index: number, value?: number): number;
    static readonly OFFSET = 32;
    static readonly LENGTH: number;
}
export declare class RadixTreeWalker {
    private blockManager;
    private relationship;
    private keys;
    private directions;
    private doYield;
    private onKeyIsNodeKey;
    private onKeyIsPrefixForNodeKey;
    private onKeyIsBeforeNodeKey;
    private onKeyIsAfterNodeKey;
    private onNodeKeyIsPrefixForKey;
    private visitNode;
    private doTraverse;
    constructor(blockManager: BlockManager, relationship: Relationship, keys: Array<Array<number>>, directions: Array<Direction>);
    traverse(bid: number): Iterable<number>;
}
export declare class RadixTree {
    private blockManager;
    private blockIndex;
    private doDelete;
    private doInsert;
    private doLocate;
    private doRemove;
    private doVacate;
    private locate;
    constructor(blockManager: BlockManager, blockIndex: number);
    [Symbol.iterator](): Iterator<number>;
    branch(keys: Array<Uint8Array>): RadixTree | undefined;
    delete(): void;
    filter(relationship: Relationship, keys: Array<Uint8Array>, directions?: Array<Direction>): Iterable<number>;
    insert(keys: Array<Uint8Array>, value: number): boolean;
    length(): number;
    lookup(keys: Array<Uint8Array>): number | undefined;
    remove(keys: Array<Uint8Array>): boolean;
    vacate(): void;
    static readonly INITIAL_SIZE = 32;
}
