import { File } from "./files";
import { Record, KeysRecordMap, RequiredKeys } from "./records";
import { WritableLink, WritableLinks } from "./links";
import { WritableStore, WritableStores } from "./stores";
import { PromiseQueue } from "./utils";
import { WritableQueries, WritableQuery } from "./queries";
import { SubsetOf } from "./inference";
export declare class ReadableQueue {
    protected queue: PromiseQueue;
    constructor(queue: PromiseQueue);
    enqueueReadableOperation<A>(operation: Promise<A> | (() => Promise<A>) | (() => A)): Promise<A>;
}
export declare class WritableQueue extends ReadableQueue {
    constructor(queue: PromiseQueue);
    enqueueWritableOperation<A>(operation: Promise<A> | (() => Promise<A>) | (() => A)): Promise<A>;
}
export declare class TransactionalStore<A extends Record, B extends RequiredKeys<A>> {
    protected store: WritableStore<A, B>;
    constructor(store: WritableStore<A, B>);
    filter(queue: ReadableQueue, ...parameters: Parameters<WritableStore<A, B>["filter"]>): ReturnType<WritableStore<A, B>["filter"]>;
    insert(queue: WritableQueue, ...parameters: Parameters<WritableStore<A, B>["insert"]>): ReturnType<WritableStore<A, B>["insert"]>;
    length(queue: ReadableQueue, ...parameters: Parameters<WritableStore<A, B>["length"]>): ReturnType<WritableStore<A, B>["length"]>;
    lookup(queue: ReadableQueue, ...parameters: Parameters<WritableStore<A, B>["lookup"]>): ReturnType<WritableStore<A, B>["lookup"]>;
    remove(queue: WritableQueue, ...parameters: Parameters<WritableStore<A, B>["remove"]>): ReturnType<WritableStore<A, B>["remove"]>;
    update(queue: WritableQueue, ...parameters: Parameters<WritableStore<A, B>["update"]>): ReturnType<WritableStore<A, B>["update"]>;
    vacate(queue: WritableQueue, ...parameters: Parameters<WritableStore<A, B>["vacate"]>): ReturnType<WritableStore<A, B>["vacate"]>;
}
export declare type TransactionalStoresFromWritableStores<A extends WritableStores<any>> = {
    [B in keyof A]: A[B] extends WritableStore<infer C, infer D> ? TransactionalStore<C, D> : never;
};
export declare class TransactionalLink<A extends Record, B extends RequiredKeys<A>, C extends Record, D extends RequiredKeys<C>, E extends KeysRecordMap<A, B, C>> {
    protected link: WritableLink<A, B, C, D, E>;
    constructor(link: WritableLink<A, B, C, D, E>);
    filter(queue: ReadableQueue, ...parameters: Parameters<WritableLink<A, B, C, D, E>["filter"]>): ReturnType<WritableLink<A, B, C, D, E>["filter"]>;
    lookup(queue: ReadableQueue, ...parameters: Parameters<WritableLink<A, B, C, D, E>["lookup"]>): ReturnType<WritableLink<A, B, C, D, E>["lookup"]>;
}
export declare type TransactionalLinksFromWritableLinks<A extends WritableLinks<any>> = {
    [B in keyof A]: A[B] extends WritableLink<infer C, infer D, infer E, infer F, infer G> ? TransactionalLink<C, D, E, F, G> : never;
};
export declare class TransactionalQuery<A extends Record, B extends RequiredKeys<A>, C extends SubsetOf<A, C>, D extends SubsetOf<A, D>> {
    protected query: WritableQuery<A, B, C, D>;
    constructor(query: WritableQuery<A, B, C, D>);
    filter(queue: ReadableQueue, ...parameters: Parameters<WritableQuery<A, B, C, D>["filter"]>): ReturnType<WritableQuery<A, B, C, D>["filter"]>;
}
export declare type TransactionalQueriesFromWritableQueries<A extends WritableQueries<any>> = {
    [B in keyof A]: A[B] extends WritableQuery<infer C, infer D, infer E, infer F> ? TransactionalQuery<C, D, E, F> : never;
};
export declare type ReadableTransaction<A> = (queue: ReadableQueue) => Promise<A>;
export declare type WritableTransaction<A> = (queue: WritableQueue) => Promise<A>;
export declare class TransactionManager<A extends WritableStores<any>, B extends WritableLinks<any>, C extends WritableQueries<any>> {
    private file;
    private readableTransactionLock;
    private writableTransactionLock;
    private writableStores;
    private writableLinks;
    private writableQueries;
    constructor(file: File, writableStores: A, writableLinks: B, writableQueries: C);
    createTransactionalStores(): TransactionalStoresFromWritableStores<A>;
    createTransactionalLinks(): TransactionalLinksFromWritableLinks<B>;
    createTransactionalQueries(): TransactionalQueriesFromWritableQueries<C>;
    enqueueReadableTransaction<D>(transaction: ReadableTransaction<D>): Promise<D>;
    enqueueWritableTransaction<D>(transaction: WritableTransaction<D>): Promise<D>;
}
