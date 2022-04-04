import { Context, StoreReference } from "./contexts";
import { DecreasingOrder, IncreasingOrder } from "./orders";
import { EqualityFilter } from "./filters";
import { Value } from "./records";
import * as transactions from "./transactions";

export type ReadableQueue = transactions.ReadableQueue;

export type WritableQueue = transactions.WritableQueue;

export type RecordOf<A> = A extends StoreReference<infer C, infer D> ? C : never;

export function createContext(): Context {
	return new Context();
};

export function createIncreasingOrder<A extends Value>(): IncreasingOrder<A> {
	return new IncreasingOrder();
};

export function createDecreasingOrder<A extends Value>(): DecreasingOrder<A> {
	return new DecreasingOrder();
};

export function createEqualityFilter<A extends Value>(value: A): EqualityFilter<A> {
	return new EqualityFilter(value);
};
