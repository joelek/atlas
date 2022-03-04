import { FilterMap } from "./filters";
import { SubsetOf } from "./inference";
import { Operators } from "./operators";
import { RequiredKeys, Record } from "./records";
import { Entry, Store, StoreManager } from "./stores";

export class QueryManager<A extends Record, B extends RequiredKeys<A>, C extends SubsetOf<A, C>> {
	private storeManager: StoreManager<A, B>;
	private operators: Operators<C>;

	constructor(storeManager: StoreManager<A, B>, operators: Operators<C>) {
		this.storeManager = storeManager;
		this.operators = operators;
	}

	filter(parameters: C): Iterable<Entry<A>> {
		let filters = {} as FilterMap<A>;
		for (let key in this.operators) {
			filters[key] = this.operators[key].createFilter(parameters[key]) as any;
		}
		return this.storeManager.filter(filters);
	}
};

export class Query<A extends Record, B extends RequiredKeys<A>, C extends SubsetOf<A, C>> {
	store: Store<A, B>;
	operators: Operators<C>;

	constructor(store: Store<A, B>, operators: Operators<C>) {
		this.store = store;
		this.operators = operators;
	}
};
