import { Context } from "./contexts";
import { DecreasingOrder, IncreasingOrder } from "./orders";
import { EqualityFilter } from "./filters";
import { Value } from "./records";
export declare function createContext(): Context;
export declare function createIncreasingOrder<A extends Value>(): IncreasingOrder<A>;
export declare function createDecreasingOrder<A extends Value>(): DecreasingOrder<A>;
export declare function createEqualityFilter<A extends Value>(value: A): EqualityFilter<A>;
