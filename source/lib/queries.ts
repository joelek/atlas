import { FilterMap } from "./filters";
import { SubsetOf } from "./inference";
import { EqualityOperator, Operators } from "./operators";
import { OrderMap, Orders } from "./orders";
import { RequiredKeys, Record, Keys, Key, KeysRecord } from "./records";
import { Index, Store, StoreManager } from "./stores";

export interface QueryInterface<A extends Record, B extends RequiredKeys<A>, C extends SubsetOf<A, C>, D extends SubsetOf<A, D>> {
	filter(parameters: C, anchor?: KeysRecord<A, B>, limit?: number): Promise<Array<A>>;
};

export type QueryInterfaces<A> = {
	[B in keyof A]: A[B] extends QueryInterface<infer C, infer D, infer E, infer F> ? QueryInterface<C, D, E, F> : A[B];
};

export type QueryInterfacesFromQueries<A extends Queries<any>> = {
	[B in keyof A]: A[B] extends Query<infer C, infer D, infer E, infer F> ? QueryInterface<C, D, E, F> : never;
};

export type QueriesFromQueryInterfaces<A extends QueryInterfaces<any>> = {
	[B in keyof A]: A[B] extends QueryInterface<infer C, infer D, infer E, infer F> ? Query<C, D, E, F> : never;
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

	filter(parameters: C, anchorKeysRecord?: KeysRecord<A, B>, limit?: number): Array<A> {
		let filters = {} as FilterMap<A>;
		for (let key in this.operators) {
			filters[key] = this.operators[key].createFilter(parameters[key]) as any;
		}
		let orders = {} as OrderMap<A>;
		for (let key in this.orders) {
			orders[key] = this.orders[key] as any;
		}
		return this.storeManager.filter(filters, orders, anchorKeysRecord, limit);
	}
};

export type QueryManagers<A> = {
	[B in keyof A]: A[B] extends QueryManager<infer C, infer D, infer E, infer F> ? QueryManager<C, D, E, F> : A[B];
};

export type QueryManagersFromQueries<A extends Queries<any>> = {
	[B in keyof A]: A[B] extends Query<infer C, infer D, infer E, infer F> ? QueryManager<C, D, E, F> : never;
};

export type QueryInterfacesFromQueryManagers<A extends QueryManagers<any>> = {
	[B in keyof A]: A[B] extends QueryManager<infer C, infer D, infer E, infer F> ? QueryInterface<C, D, E, F> : never;
};

export class Query<A extends Record, B extends RequiredKeys<A>, C extends SubsetOf<A, C>, D extends SubsetOf<A, D>> {
	store: Store<A, B>;
	operators: Operators<C>;
	orders: Orders<D>;

	constructor(store: Store<A, B>, operators: Operators<C>, orders: Orders<D>) {
		this.store = store;
		this.operators = operators;
		this.orders = orders;
		this.store.index(this.createIndex());
	}

	createIndex(): Index<A> {
		let keys = [] as Keys<A>;
		for (let key in this.operators) {
			let operator = this.operators[key];
			if (operator instanceof EqualityOperator) {
				if (!keys.includes(key)) {
					keys.push(key);
				}
			}
		}
		for (let key in this.operators) {
			let operator = this.operators[key];
			if (!(operator instanceof EqualityOperator)) {
				if (!keys.includes(key)) {
					keys.push(key);
				}
			}
		}
		for (let key in this.orders) {
			let order = this.orders[key];
			if (order == null) {
				continue;
			}
			if (!keys.includes(key)) {
				keys.push(key);
			}
		}
		for (let key of this.store.keys) {
			if (!keys.includes(key)) {
				keys.push(key);
			}
		}
		return new Index(keys);
	}
};

export type Queries<A> = {
	[B in keyof A]: A[B] extends Query<infer C, infer D, infer E, infer F> ? Query<C, D, E, F> : A[B];
};
