import { FilterMap } from "./filters";
import { SubsetOf } from "./inference";
import { Operators } from "./operators";
import { OrderMap, Orders } from "./orders";
import { RequiredKeys, Record } from "./records";
import { Entry, Store, StoreManager } from "./stores";

export interface ReadableQuery<A extends Record, B extends RequiredKeys<A>, C extends SubsetOf<A, C>, D extends SubsetOf<A, D>> {
	filter(parameters: C): Promise<Iterable<Entry<A>>>;
};

export type ReadableQueries<A> = {
	[B in keyof A]: A[B] extends ReadableQuery<infer C, infer D, infer E, infer F> ? ReadableQuery<C, D, E, F> : A[B];
};

export type ReadableQueriesFromQueries<A extends Queries<any>> = {
	[B in keyof A]: A[B] extends Query<infer C, infer D, infer E, infer F> ? ReadableQuery<C, D, E, F> : never;
};

export type QueriesFromReadableQueries<A extends ReadableQueries<any>> = {
	[B in keyof A]: A[B] extends ReadableQuery<infer C, infer D, infer E, infer F> ? Query<C, D, E, F> : never;
};

export interface WritableQuery<A extends Record, B extends RequiredKeys<A>, C extends SubsetOf<A, C>, D extends SubsetOf<A, D>> extends ReadableQuery<A, B, C, D> {

};

export type WritableQueries<A> = {
	[B in keyof A]: A[B] extends WritableQuery<infer C, infer D, infer E, infer F> ? WritableQuery<C, D, E, F> : A[B];
};

export type WritableQueriesFromQueries<A extends Queries<any>> = {
	[B in keyof A]: A[B] extends Query<infer C, infer D, infer E, infer F> ? WritableQuery<C, D, E, F> : never;
};

export type QueriesFromWritableQueries<A extends WritableQueries<any>> = {
	[B in keyof A]: A[B] extends WritableQuery<infer C, infer D, infer E, infer F> ? Query<C, D, E, F> : never;
};

export class WritableQueryManager<A extends Record, B extends RequiredKeys<A>, C extends SubsetOf<A, C>, D extends SubsetOf<A, D>> implements WritableQuery<A, B, C, D> {
	protected queryManager: QueryManager<A, B, C, D>;

	constructor(queryManager: QueryManager<A, B, C, D>) {
		this.queryManager = queryManager;
	}

	async filter(...parameters: Parameters<WritableQuery<A, B, C, D>["filter"]>): ReturnType<WritableQuery<A, B, C, D>["filter"]> {
		return this.queryManager.filter(...parameters);
	}
};

export class QueryManager<A extends Record, B extends RequiredKeys<A>, C extends SubsetOf<A, C>, D extends SubsetOf<A, D>> {
	private storeManager: StoreManager<A, B>;
	private operators: Operators<C>;
	private orders: Orders<D>;

	constructor(storeManager: StoreManager<A, B>, operators: Operators<C>, orders: Orders<D>) {
		this.storeManager = storeManager;
		this.operators = operators;
		this.orders = orders;
	}

	filter(parameters: C): Iterable<Entry<A>> {
		let filters = {} as FilterMap<A>;
		for (let key in this.operators) {
			filters[key] = this.operators[key].createFilter(parameters[key]) as any;
		}
		let orders = {} as OrderMap<A>;
		for (let key in this.orders) {
			orders[key] = this.orders[key] as any;
		}
		return this.storeManager.filter(filters, orders);
	}
};

export type QueryManagers<A> = {
	[B in keyof A]: A[B] extends QueryManager<infer C, infer D, infer E, infer F> ? QueryManager<C, D, E, F> : A[B];
};

export type QueryManagersFromQueries<A extends Queries<any>> = {
	[B in keyof A]: A[B] extends Query<infer C, infer D, infer E, infer F> ? QueryManager<C, D, E, F> : never;
};

export type WritableQueriesFromQueryManagers<A extends QueryManagers<any>> = {
	[B in keyof A]: A[B] extends QueryManager<infer C, infer D, infer E, infer F> ? WritableQuery<C, D, E, F> : never;
};

export class Query<A extends Record, B extends RequiredKeys<A>, C extends SubsetOf<A, C>, D extends SubsetOf<A, D>> {
	store: Store<A, B>;
	operators: Operators<C>;
	orders: Orders<D>;

	constructor(store: Store<A, B>, operators: Operators<C>, orders: Orders<D>) {
		this.store = store;
		this.operators = operators;
		this.orders = orders;
	}
};

export type Queries<A> = {
	[B in keyof A]: A[B] extends Query<infer C, infer D, infer E, infer F> ? Query<C, D, E, F> : A[B];
};

export class OverridableWritableQuery<A extends Record, B extends RequiredKeys<A>, C extends SubsetOf<A, C>, D extends SubsetOf<A, D>> implements WritableQuery<A, B, C, D> {
	private queryManager: QueryManager<A, B, C, D>;
	private overrides: Partial<WritableQuery<A, B, C, D>>;

	constructor(queryManager: QueryManager<A, B, C, D>, overrides: Partial<WritableQuery<A, B, C, D>>) {
		this.queryManager = queryManager;
		this.overrides = overrides;
	}

	async filter(...parameters: Parameters<WritableQuery<A, B, C, D>["filter"]>): ReturnType<WritableQuery<A, B, C, D>["filter"]> {
		return this.overrides.filter?.(...parameters) ?? this.queryManager.filter(...parameters);
	}
};
