import { Context } from "./contexts";
import { DecreasingOrder, IncreasingOrder } from "./orders";
import { EqualityFilter } from "./filters";
import { Value } from "./records";

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
