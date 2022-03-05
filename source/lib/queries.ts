import { FilterMap } from "./filters";
import { SubsetOf } from "./inference";
import { Operators } from "./operators";
import { OrderMap, Orders } from "./orders";
import { RequiredKeys, Record } from "./records";
import { Entry, Store, StoreManager } from "./stores";

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
