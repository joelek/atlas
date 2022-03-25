import { Context, LinkReference, QueryReference, StoreReference } from "./contexts";
import { DecreasingOrder, IncreasingOrder } from "./orders";
import { EqualityFilter } from "./filters";
import { Value } from "./records";
import { ReadableLink, WritableLink } from "./links";
import { ReadableQuery, WritableQuery } from "./queries";
import { ReadableStore, WritableStore } from "./stores";
import * as transactions from "./transactions";

export type ReadableQueue = transactions.ReadableQueue;

export type WritableQueue = transactions.WritableQueue;

export type RecordOf<A> = A extends StoreReference<infer C, infer D> ? C : never;

export type ReadableStoreOf<A> = A extends StoreReference<infer C, infer D> ? ReadableStore<C, D> : never;

export type WritableStoreOf<A> = A extends StoreReference<infer C, infer D> ? WritableStore<C, D> : never;

export type ReadableLinkOf<A> = A extends LinkReference<infer C, infer D, infer E, infer F, infer G> ? ReadableLink<C, D, E, F, G> : never;

export type WritableLinkOf<A> = A extends LinkReference<infer C, infer D, infer E, infer F, infer G> ? WritableLink<C, D, E, F, G> : never;

export type ReadableQueryOf<A> = A extends QueryReference<infer C, infer D, infer E, infer F> ? ReadableQuery<C, D, E, F> : never;

export type WritableQueryOf<A> = A extends QueryReference<infer C, infer D, infer E, infer F> ? WritableQuery<C, D, E, F> : never;

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
