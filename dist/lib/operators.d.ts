import { EqualityFilter, Filter, GreaterThanFilter, GreaterThanOrEqualFilter, LessThanFilter, LessThanOrEqualFilter } from "./filters";
import { Record, Value } from "./records";
export declare abstract class Operator<A extends Value> {
    constructor();
    abstract createFilter(value: A): Filter<A>;
}
export declare class EqualityOperator<A extends Value> extends Operator<A> {
    constructor();
    createFilter(value: A): EqualityFilter<A>;
}
export declare class GreaterThanOperator<A extends Value> extends Operator<A> {
    constructor();
    createFilter(value: A): GreaterThanFilter<A>;
}
export declare class GreaterThanOrEqualOperator<A extends Value> extends Operator<A> {
    constructor();
    createFilter(value: A): GreaterThanOrEqualFilter<A>;
}
export declare class LessThanOperator<A extends Value> extends Operator<A> {
    constructor();
    createFilter(value: A): LessThanFilter<A>;
}
export declare class LessThanOrEqualOperator<A extends Value> extends Operator<A> {
    constructor();
    createFilter(value: A): LessThanOrEqualFilter<A>;
}
export type OperatorMap<A extends Record> = {
    [B in keyof A]?: Operator<A[B]>;
};
export type Operators<A extends Record> = {
    [B in keyof A]: Operator<A[B]>;
};
