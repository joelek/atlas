import { BlockManager } from "./blocks";
import { Chunk } from "./chunks";
import { Statistic } from "./utils";
export type Relationship = "^=" | "=" | ">" | ">=" | "<" | "<=";
export type Direction = "increasing" | "decreasing";
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
type NodeVisitorOutcome = [yield_outcome: number, check_outcome: number];
export interface NodeVisitor {
    visit(node_nibbles: Array<number>): NodeVisitorOutcome;
}
export declare class NodeVisitorEqual implements NodeVisitor {
    protected key_nibbles: Array<number>;
    constructor(key_nibbles: Array<number>);
    visit(node_nibbles: Array<number>): NodeVisitorOutcome;
}
export declare class NodeVisitorPrefix implements NodeVisitor {
    protected key_nibbles: Array<number>;
    constructor(key_nibbles: Array<number>);
    visit(node_nibbles: Array<number>): NodeVisitorOutcome;
}
export declare class NodeVisitorGreaterThan implements NodeVisitor {
    protected key_nibbles: Array<number>;
    constructor(key_nibbles: Array<number>);
    visit(node_nibbles: Array<number>): NodeVisitorOutcome;
}
export declare class NodeVisitorGreaterThanOrEqual implements NodeVisitor {
    protected key_nibbles: Array<number>;
    constructor(key_nibbles: Array<number>);
    visit(node_nibbles: Array<number>): NodeVisitorOutcome;
}
export declare class NodeVisitorLessThan implements NodeVisitor {
    protected key_nibbles: Array<number>;
    constructor(key_nibbles: Array<number>);
    visit(node_nibbles: Array<number>): NodeVisitorOutcome;
}
export declare class NodeVisitorLessThanOrEqual implements NodeVisitor {
    protected key_nibbles: Array<number>;
    constructor(key_nibbles: Array<number>);
    visit(node_nibbles: Array<number>): NodeVisitorOutcome;
}
export declare class NodeVisitorOr implements NodeVisitor {
    protected visitor: NodeVisitor;
    protected visitors: Array<NodeVisitor>;
    constructor(visitor: NodeVisitor, ...vistors: Array<NodeVisitor>);
    visit(node_nibbles: Array<number>): NodeVisitorOutcome;
}
export declare class NodeVisitorAnd implements NodeVisitor {
    protected visitor: NodeVisitor;
    protected visitors: Array<NodeVisitor>;
    constructor(visitor: NodeVisitor, ...vistors: Array<NodeVisitor>);
    visit(node_nibbles: Array<number>): NodeVisitorOutcome;
}
export declare class NodeVisitorNot implements NodeVisitor {
    protected visitor: NodeVisitor;
    constructor(visitor: NodeVisitor);
    visit(node_nibbles: Array<number>): NodeVisitorOutcome;
}
export declare class NodeVisitorBefore implements NodeVisitor {
    protected visitor: NodeVisitor;
    constructor(key_nibbles: Array<number>, direction: Direction | undefined);
    visit(node_nibbles: Array<number>): NodeVisitorOutcome;
}
export declare class NodeVisitorAfter implements NodeVisitor {
    protected visitor: NodeVisitor;
    constructor(key_nibbles: Array<number>, direction: Direction | undefined);
    visit(node_nibbles: Array<number>): NodeVisitorOutcome;
}
export declare class NodeVisitorIn implements NodeVisitor {
    protected visitor: NodeVisitor;
    constructor(key_nibbles_array: Array<Array<number>>);
    visit(node_nibbles: Array<number>): NodeVisitorOutcome;
}
export declare class RadixTreeIncreasingWalker {
    protected block_manager: BlockManager;
    protected node_visitor: NodeVisitor;
    protected yieldChild(node_bid: number): Iterable<number>;
    protected visitNode(node_bid: number, previous_node_nibbles: Array<number>): Iterable<number>;
    constructor(block_manager: BlockManager, node_visitor: NodeVisitor);
    traverse(node_bid: number): Iterable<number>;
}
export declare class RadixTreeDecreasingWalker {
    protected block_manager: BlockManager;
    protected node_visitor: NodeVisitor;
    protected yieldChild(node_bid: number): Iterable<number>;
    protected visitNode(node_bid: number, previous_node_nibbles: Array<number>): Iterable<number>;
    constructor(block_manager: BlockManager, node_visitor: NodeVisitor);
    traverse(node_bid: number): Iterable<number>;
}
export declare abstract class RadixTreeTraverser {
    protected blockManager: BlockManager;
    protected bid: number;
    protected abstract doTraverse(bid: number, keys: Array<Array<number>>, key: Array<number>): Iterable<number>;
    protected traverseUnconditionally(bid: number): Iterable<number>;
    protected traverseChildrenUnconditionally(bid: number): Iterable<number>;
    constructor(blockManager: BlockManager, bid: number);
    traverse(keys: Array<Array<number>>): Iterable<number>;
}
export declare class RadixTreeTraverserAt extends RadixTreeTraverser {
    protected doTraverse(bid: number, keys: Array<Array<number>>, keyNibbles: Array<number>): Iterable<number>;
    constructor(blockManager: BlockManager, bid: number);
}
export declare class RadixTreeTraverserPrefix extends RadixTreeTraverser {
    protected doTraverse(bid: number, keys: Array<Array<number>>, keyNibbles: Array<number>): Iterable<number>;
    constructor(blockManager: BlockManager, bid: number);
}
export declare class RadixTreeTraverserAtOrAfter extends RadixTreeTraverser {
    protected doTraverse(bid: number, keys: Array<Array<number>>, keyNibbles: Array<number>): Iterable<number>;
    constructor(blockManager: BlockManager, bid: number);
}
export declare class RadixTreeTraverserAfter extends RadixTreeTraverser {
    protected doTraverse(bid: number, keys: Array<Array<number>>, keyNibbles: Array<number>): Iterable<number>;
    constructor(blockManager: BlockManager, bid: number);
}
export declare class RadixTree {
    private blockManager;
    private blockIndex;
    private doDelete;
    private doInsert;
    private doLocate;
    private doRemove;
    private doVacate;
    private traverse;
    constructor(blockManager: BlockManager, blockIndex?: number);
    [Symbol.iterator](): Iterator<number>;
    branch(relationship: Relationship, keys: Array<Uint8Array>): Iterable<RadixTree>;
    debug(indent?: string): void;
    delete(): void;
    filter(relationship: Relationship, keys: Array<Uint8Array>, directions?: Array<Direction>): Iterable<number>;
    get_filtered_node_bids(nodeVisitor: NodeVisitor | undefined, direction: Direction | undefined): Iterable<number>;
    get_resident_bid(): number | undefined;
    get_statistics(): Record<string, Statistic>;
    get_subtree_bid(): number | undefined;
    insert(keys: Array<Uint8Array>, value: number): boolean;
    length(): number;
    lookup(keys: Array<Uint8Array>): number | undefined;
    remove(keys: Array<Uint8Array>): boolean;
    vacate(): void;
    static readonly INITIAL_SIZE = 32;
}
export {};
