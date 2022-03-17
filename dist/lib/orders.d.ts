import { Record, Value } from "./records";
import { Direction } from "./trees";
export declare abstract class Order<A extends Value> {
    constructor();
    abstract compare(one: A, two: A): number;
    abstract getDirection(): Direction;
}
export declare class IncreasingOrder<A extends Value> extends Order<A> {
    constructor();
    compare(one: A, two: A): number;
    getDirection(): Direction;
}
export declare class DecreasingOrder<A extends Value> extends Order<A> {
    constructor();
    compare(one: A, two: A): number;
    getDirection(): Direction;
}
export declare type OrderMap<A extends Record> = {
    [C in keyof A]?: Order<A[C]>;
};
export declare type Orders<A extends Record> = {
    [C in keyof A]: Order<A[C]>;
};
