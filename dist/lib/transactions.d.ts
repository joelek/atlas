import { File } from "./files";
import { Record, KeysRecordMap, RequiredKeys } from "./records";
import { LinkInterface } from "./links";
import { StoreInterface } from "./stores";
import { PromiseQueue } from "./utils";
import { QueryInterface } from "./queries";
import { SubsetOf } from "./inference";
import { DatabaseLink, DatabaseLinks, DatabaseQueries, DatabaseQuery, DatabaseStore, DatabaseStores } from "./databases";
import { Cache } from "./caches";
export declare class ReadableQueue {
    protected queue: PromiseQueue;
    protected cache: Cache<any>;
    constructor(queue: PromiseQueue, cache: Cache<any>);
    enqueueReadableOperation<A>(operation: Promise<A> | (() => Promise<A>) | (() => A)): Promise<A>;
    getCache(): Cache<any>;
}
export declare class WritableQueue extends ReadableQueue {
    constructor(queue: PromiseQueue, cache: Cache<any>);
    enqueueWritableOperation<A>(operation: Promise<A> | (() => Promise<A>) | (() => A)): Promise<A>;
}
export declare class TransactionalStore<A extends Record, B extends RequiredKeys<A>> {
    protected store: DatabaseStore<A, B>;
    constructor(store: DatabaseStore<A, B>);
    filter(queue: ReadableQueue, ...parameters: Parameters<StoreInterface<A, B>["filter"]>): ReturnType<StoreInterface<A, B>["filter"]>;
    insert(queue: WritableQueue, ...parameters: Parameters<StoreInterface<A, B>["insert"]>): ReturnType<StoreInterface<A, B>["insert"]>;
    length(queue: ReadableQueue, ...parameters: Parameters<StoreInterface<A, B>["length"]>): ReturnType<StoreInterface<A, B>["length"]>;
    lookup(queue: ReadableQueue, ...parameters: Parameters<StoreInterface<A, B>["lookup"]>): ReturnType<StoreInterface<A, B>["lookup"]>;
    remove(queue: WritableQueue, ...parameters: Parameters<StoreInterface<A, B>["remove"]>): ReturnType<StoreInterface<A, B>["remove"]>;
    search(queue: ReadableQueue, ...parameters: Parameters<StoreInterface<A, B>["search"]>): ReturnType<StoreInterface<A, B>["search"]>;
    update(queue: WritableQueue, ...parameters: Parameters<StoreInterface<A, B>["update"]>): ReturnType<StoreInterface<A, B>["update"]>;
    vacate(queue: WritableQueue, ...parameters: Parameters<StoreInterface<A, B>["vacate"]>): ReturnType<StoreInterface<A, B>["vacate"]>;
}
export type TransactionalStoresFromDatabaseStores<A extends DatabaseStores<any>> = {
    [B in keyof A]: A[B] extends DatabaseStore<infer C, infer D> ? TransactionalStore<C, D> : never;
};
export declare class TransactionalLink<A extends Record, B extends RequiredKeys<A>, C extends Record, D extends RequiredKeys<C>, E extends KeysRecordMap<A, B, C>> {
    protected link: DatabaseLink<A, B, C, D, E>;
    constructor(link: DatabaseLink<A, B, C, D, E>);
    filter(queue: ReadableQueue, ...parameters: Parameters<LinkInterface<A, B, C, D, E>["filter"]>): ReturnType<LinkInterface<A, B, C, D, E>["filter"]>;
    lookup(queue: ReadableQueue, ...parameters: Parameters<LinkInterface<A, B, C, D, E>["lookup"]>): ReturnType<LinkInterface<A, B, C, D, E>["lookup"]>;
}
export type TransactionalLinksFromDatabaseLinks<A extends DatabaseLinks<any>> = {
    [B in keyof A]: A[B] extends DatabaseLink<infer C, infer D, infer E, infer F, infer G> ? TransactionalLink<C, D, E, F, G> : never;
};
export declare class TransactionalQuery<A extends Record, B extends RequiredKeys<A>, C extends SubsetOf<A, C>, D extends SubsetOf<A, D>> {
    protected query: DatabaseQuery<A, B, C, D>;
    constructor(query: DatabaseQuery<A, B, C, D>);
    filter(queue: ReadableQueue, ...parameters: Parameters<QueryInterface<A, B, C, D>["filter"]>): ReturnType<QueryInterface<A, B, C, D>["filter"]>;
}
export type TransactionalQueriesFromDatabaseQueries<A extends DatabaseQueries<any>> = {
    [B in keyof A]: A[B] extends DatabaseQuery<infer C, infer D, infer E, infer F> ? TransactionalQuery<C, D, E, F> : never;
};
export type ReadableTransaction<A> = (queue: ReadableQueue) => Promise<A>;
export type WritableTransaction<A> = (queue: WritableQueue) => Promise<A>;
export interface TransactionManagerDetail {
    onDiscard?(): void;
}
export declare class TransactionManager<A extends DatabaseStores<any>, B extends DatabaseLinks<any>, C extends DatabaseQueries<any>> {
    private file;
    private readableTransactionLock;
    private writableTransactionLock;
    private cache;
    readonly stores: Readonly<TransactionalStoresFromDatabaseStores<A>>;
    readonly links: Readonly<TransactionalLinksFromDatabaseLinks<B>>;
    readonly queries: Readonly<TransactionalQueriesFromDatabaseQueries<C>>;
    private detail?;
    private createTransactionalStores;
    private createTransactionalLinks;
    private createTransactionalQueries;
    constructor(file: File, databaseStores: A, databaseLinks: B, databaseQueries: C, detail?: TransactionManagerDetail);
    enqueueReadableTransaction<D>(transaction: ReadableTransaction<D>): Promise<D>;
    enqueueWritableTransaction<D>(transaction: WritableTransaction<D>): Promise<D>;
}
