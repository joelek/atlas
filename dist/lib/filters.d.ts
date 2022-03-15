import { Record, Value } from "./records";
export declare abstract class Filter<A extends Value> {
    constructor();
    abstract matches(value: A): boolean;
}
export declare class EqualityFilter<A extends Value> extends Filter<A> {
    private value;
    constructor(value: A);
    getEncodedValue(): Uint8Array;
    getValue(): A;
    matches(value: A): boolean;
}
export declare type FilterMap<A extends Record> = {
    [C in keyof A]?: Filter<A[C]>;
};
export declare type Filters<A extends Record> = {
    [C in keyof A]: Filter<A[C]>;
};
