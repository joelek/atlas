import { SubsetOf } from "./inference";
import { Operators } from "./operators";
import { Orders } from "./orders";
import { RequiredKeys, Record } from "./records";
import { Entry, Store, StoreManager } from "./stores";
export declare class QueryManager<A extends Record, B extends RequiredKeys<A>, C extends SubsetOf<A, C>, D extends SubsetOf<A, D>> {
    private storeManager;
    private operators;
    private orders;
    constructor(storeManager: StoreManager<A, B>, operators: Operators<C>, orders: Orders<D>);
    filter(parameters: C): Iterable<Entry<A>>;
}
export declare class Query<A extends Record, B extends RequiredKeys<A>, C extends SubsetOf<A, C>, D extends SubsetOf<A, D>> {
    store: Store<A, B>;
    operators: Operators<C>;
    orders: Orders<D>;
    constructor(store: Store<A, B>, operators: Operators<C>, orders: Orders<D>);
}
