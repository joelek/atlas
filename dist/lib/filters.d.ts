import { Record, Value } from "./records";
import { NodeVisitor } from "./trees";
export declare abstract class Filter<A extends Value> {
    constructor();
    abstract createNodeVisitor(key_nibbles: Array<number>): NodeVisitor;
    abstract getValue(): A;
    abstract matches(encodedFilterValue: Uint8Array, encodedRecordValue: Uint8Array): boolean;
}
export declare class EqualityFilter<A extends Value> extends Filter<A> {
    private value;
    constructor(value: A);
    createNodeVisitor(key_nibbles: Array<number>): NodeVisitor;
    getValue(): A;
    matches(encodedFilterValue: Uint8Array, encodedRecordValue: Uint8Array): boolean;
}
export declare class GreaterThanFilter<A extends Value> extends Filter<A> {
    private value;
    constructor(value: A);
    createNodeVisitor(key_nibbles: Array<number>): NodeVisitor;
    getValue(): A;
    matches(encodedFilterValue: Uint8Array, encodedRecordValue: Uint8Array): boolean;
}
export declare class LessThanFilter<A extends Value> extends Filter<A> {
    private value;
    constructor(value: A);
    createNodeVisitor(key_nibbles: Array<number>): NodeVisitor;
    getValue(): A;
    matches(encodedFilterValue: Uint8Array, encodedRecordValue: Uint8Array): boolean;
}
export type FilterMap<A extends Record> = {
    [C in keyof A]?: Filter<A[C]>;
};
export type Filters<A extends Record> = {
    [C in keyof A]: Filter<A[C]>;
};
