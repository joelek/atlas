import { SubsetOf } from "./inference";
import { Operators } from "./operators";
import { RequiredKeys, Record } from "./records";
import { Entry, Store, StoreManager } from "./store";
export declare class QueryManager<A extends Record, B extends RequiredKeys<A>, C extends SubsetOf<A, C>> {
    private storeManager;
    private operators;
    constructor(storeManager: StoreManager<A, B>, operators: Operators<C>);
    filter(parameters: C): Iterable<Entry<A>>;
}
export declare class Query<A extends Record, B extends RequiredKeys<A>, C extends SubsetOf<A, C>> {
    store: Store<A, B>;
    operators: Operators<C>;
    constructor(store: Store<A, B>, operators: Operators<C>);
}
