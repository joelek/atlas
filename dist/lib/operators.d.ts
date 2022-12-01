import { EqualityFilter, Filter } from "./filters";
import { Record, Value } from "./records";
export declare abstract class Operator<A extends Value> {
    constructor();
    abstract createFilter(value: A): Filter<A>;
}
export declare class EqualityOperator<A extends Value> extends Operator<A> {
    constructor();
    createFilter(value: A): EqualityFilter<A>;
}
export type OperatorMap<A extends Record> = {
    [B in keyof A]?: Operator<A[B]>;
};
export type Operators<A extends Record> = {
    [B in keyof A]: Operator<A[B]>;
};
