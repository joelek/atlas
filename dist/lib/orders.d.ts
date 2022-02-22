import { Record, Value } from "./records";
export declare abstract class Order<A extends Value> {
    constructor();
    abstract compare(one: A, two: A): number;
}
export declare class IncreasingOrder<A extends Value> extends Order<A> {
    constructor();
    compare(one: A, two: A): number;
}
export declare class DecreasingOrder<A extends Value> extends Order<A> {
    constructor();
    compare(one: A, two: A): number;
}
export declare type OrderMap<A extends Record> = {
    [C in keyof A]?: Order<A[C]>;
};
