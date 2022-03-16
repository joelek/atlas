import { SubsetOf } from "./inference";
import { Operators } from "./operators";
import { Orders } from "./orders";
import { RequiredKeys, Record } from "./records";
import { Entry, Index, Store, StoreManager } from "./stores";
export interface ReadableQuery<A extends Record, B extends RequiredKeys<A>, C extends SubsetOf<A, C>, D extends SubsetOf<A, D>> {
    filter(parameters: C): Promise<Iterable<Entry<A>>>;
}
export declare type ReadableQueries<A> = {
    [B in keyof A]: A[B] extends ReadableQuery<infer C, infer D, infer E, infer F> ? ReadableQuery<C, D, E, F> : A[B];
};
export declare type ReadableQueriesFromQueries<A extends Queries<any>> = {
    [B in keyof A]: A[B] extends Query<infer C, infer D, infer E, infer F> ? ReadableQuery<C, D, E, F> : never;
};
export declare type QueriesFromReadableQueries<A extends ReadableQueries<any>> = {
    [B in keyof A]: A[B] extends ReadableQuery<infer C, infer D, infer E, infer F> ? Query<C, D, E, F> : never;
};
export interface WritableQuery<A extends Record, B extends RequiredKeys<A>, C extends SubsetOf<A, C>, D extends SubsetOf<A, D>> extends ReadableQuery<A, B, C, D> {
}
export declare type WritableQueries<A> = {
    [B in keyof A]: A[B] extends WritableQuery<infer C, infer D, infer E, infer F> ? WritableQuery<C, D, E, F> : A[B];
};
export declare type WritableQueriesFromQueries<A extends Queries<any>> = {
    [B in keyof A]: A[B] extends Query<infer C, infer D, infer E, infer F> ? WritableQuery<C, D, E, F> : never;
};
export declare type QueriesFromWritableQueries<A extends WritableQueries<any>> = {
    [B in keyof A]: A[B] extends WritableQuery<infer C, infer D, infer E, infer F> ? Query<C, D, E, F> : never;
};
export declare class WritableQueryManager<A extends Record, B extends RequiredKeys<A>, C extends SubsetOf<A, C>, D extends SubsetOf<A, D>> implements WritableQuery<A, B, C, D> {
    protected queryManager: QueryManager<A, B, C, D>;
    constructor(queryManager: QueryManager<A, B, C, D>);
    filter(...parameters: Parameters<WritableQuery<A, B, C, D>["filter"]>): ReturnType<WritableQuery<A, B, C, D>["filter"]>;
}
export declare class QueryManager<A extends Record, B extends RequiredKeys<A>, C extends SubsetOf<A, C>, D extends SubsetOf<A, D>> {
    private storeManager;
    private operators;
    private orders;
    constructor(storeManager: StoreManager<A, B>, operators: Operators<C>, orders: Orders<D>);
    filter(parameters: C): Iterable<Entry<A>>;
}
export declare type QueryManagers<A> = {
    [B in keyof A]: A[B] extends QueryManager<infer C, infer D, infer E, infer F> ? QueryManager<C, D, E, F> : A[B];
};
export declare type QueryManagersFromQueries<A extends Queries<any>> = {
    [B in keyof A]: A[B] extends Query<infer C, infer D, infer E, infer F> ? QueryManager<C, D, E, F> : never;
};
export declare type WritableQueriesFromQueryManagers<A extends QueryManagers<any>> = {
    [B in keyof A]: A[B] extends QueryManager<infer C, infer D, infer E, infer F> ? WritableQuery<C, D, E, F> : never;
};
export declare class Query<A extends Record, B extends RequiredKeys<A>, C extends SubsetOf<A, C>, D extends SubsetOf<A, D>> {
    store: Store<A, B>;
    operators: Operators<C>;
    orders: Orders<D>;
    constructor(store: Store<A, B>, operators: Operators<C>, orders: Orders<D>);
    createIndex(): Index<A>;
}
export declare type Queries<A> = {
    [B in keyof A]: A[B] extends Query<infer C, infer D, infer E, infer F> ? Query<C, D, E, F> : A[B];
};
export declare class OverridableWritableQuery<A extends Record, B extends RequiredKeys<A>, C extends SubsetOf<A, C>, D extends SubsetOf<A, D>> implements WritableQuery<A, B, C, D> {
    private queryManager;
    private overrides;
    constructor(queryManager: QueryManager<A, B, C, D>, overrides: Partial<WritableQuery<A, B, C, D>>);
    filter(...parameters: Parameters<WritableQuery<A, B, C, D>["filter"]>): ReturnType<WritableQuery<A, B, C, D>["filter"]>;
}
