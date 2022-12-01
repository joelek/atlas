import { SubsetOf } from "./inference";
import { Operators } from "./operators";
import { Orders } from "./orders";
import { RequiredKeys, Record, KeysRecord } from "./records";
import { Index, Store, StoreManager } from "./stores";
export interface QueryInterface<A extends Record, B extends RequiredKeys<A>, C extends SubsetOf<A, C>, D extends SubsetOf<A, D>> {
    filter(parameters: C, anchor?: KeysRecord<A, B>, limit?: number): Promise<Array<A>>;
}
export type QueryInterfaces<A> = {
    [B in keyof A]: A[B] extends QueryInterface<infer C, infer D, infer E, infer F> ? QueryInterface<C, D, E, F> : A[B];
};
export type QueryInterfacesFromQueries<A extends Queries<any>> = {
    [B in keyof A]: A[B] extends Query<infer C, infer D, infer E, infer F> ? QueryInterface<C, D, E, F> : never;
};
export type QueriesFromQueryInterfaces<A extends QueryInterfaces<any>> = {
    [B in keyof A]: A[B] extends QueryInterface<infer C, infer D, infer E, infer F> ? Query<C, D, E, F> : never;
};
export declare class QueryManager<A extends Record, B extends RequiredKeys<A>, C extends SubsetOf<A, C>, D extends SubsetOf<A, D>> {
    private storeManager;
    private operators;
    private orders;
    constructor(storeManager: StoreManager<A, B>, operators: Operators<C>, orders: Orders<D>);
    filter(parameters: C, anchorKeysRecord?: KeysRecord<A, B>, limit?: number): Array<A>;
}
export type QueryManagers<A> = {
    [B in keyof A]: A[B] extends QueryManager<infer C, infer D, infer E, infer F> ? QueryManager<C, D, E, F> : A[B];
};
export type QueryManagersFromQueries<A extends Queries<any>> = {
    [B in keyof A]: A[B] extends Query<infer C, infer D, infer E, infer F> ? QueryManager<C, D, E, F> : never;
};
export type QueryInterfacesFromQueryManagers<A extends QueryManagers<any>> = {
    [B in keyof A]: A[B] extends QueryManager<infer C, infer D, infer E, infer F> ? QueryInterface<C, D, E, F> : never;
};
export declare class Query<A extends Record, B extends RequiredKeys<A>, C extends SubsetOf<A, C>, D extends SubsetOf<A, D>> {
    store: Store<A, B>;
    operators: Operators<C>;
    orders: Orders<D>;
    constructor(store: Store<A, B>, operators: Operators<C>, orders: Orders<D>);
    createIndex(): Index<A>;
}
export type Queries<A> = {
    [B in keyof A]: A[B] extends Query<infer C, infer D, infer E, infer F> ? Query<C, D, E, F> : A[B];
};
