import { File } from "./files";
import { Record, KeysRecordMap, RequiredKeys } from "./records";
import { Links, LinksFromWritableLinks, ReadableLink, ReadableLinksFromLinks, WritableLink, WritableLinks, WritableLinksFromLinks } from "./links";
import { ReadableStore, ReadableStoresFromStores, Stores, StoresFromWritableStores, WritableStore, WritableStores, WritableStoresFromStores } from "./stores";
import { PromiseQueue } from "./utils";
import { Queries, QueriesFromWritableQueries, ReadableQueriesFromQueries, ReadableQuery, WritableQueries, WritableQueriesFromQueries, WritableQuery } from "./queries";
import { SubsetOf } from "./inference";
export declare class QueuedReadableStore<A extends Record, B extends RequiredKeys<A>> implements ReadableStore<A, B> {
    protected writableStore: WritableStore<A, B>;
    protected queue: PromiseQueue;
    constructor(writableStore: WritableStore<A, B>, queue: PromiseQueue);
    filter(...parameters: Parameters<ReadableStore<A, B>["filter"]>): ReturnType<ReadableStore<A, B>["filter"]>;
    length(...parameters: Parameters<ReadableStore<A, B>["length"]>): ReturnType<ReadableStore<A, B>["length"]>;
    lookup(...parameters: Parameters<ReadableStore<A, B>["lookup"]>): ReturnType<ReadableStore<A, B>["lookup"]>;
}
export declare class QueuedWritableStore<A extends Record, B extends RequiredKeys<A>> extends QueuedReadableStore<A, B> implements WritableStore<A, B> {
    constructor(writableStore: WritableStore<A, B>, queue: PromiseQueue);
    insert(...parameters: Parameters<WritableStore<A, B>["insert"]>): ReturnType<WritableStore<A, B>["insert"]>;
    remove(...parameters: Parameters<WritableStore<A, B>["remove"]>): ReturnType<WritableStore<A, B>["remove"]>;
    update(...parameters: Parameters<WritableStore<A, B>["update"]>): ReturnType<WritableStore<A, B>["update"]>;
}
export declare class QueuedReadableLink<A extends Record, B extends RequiredKeys<A>, C extends Record, D extends RequiredKeys<C>, E extends KeysRecordMap<A, B, C>> implements ReadableLink<A, B, C, D, E> {
    protected writableLink: WritableLink<A, B, C, D, E>;
    protected queue: PromiseQueue;
    constructor(writableLink: WritableLink<A, B, C, D, E>, queue: PromiseQueue);
    filter(...parameters: Parameters<ReadableLink<A, B, C, D, E>["filter"]>): ReturnType<ReadableLink<A, B, C, D, E>["filter"]>;
    lookup(...parameters: Parameters<ReadableLink<A, B, C, D, E>["lookup"]>): ReturnType<ReadableLink<A, B, C, D, E>["lookup"]>;
}
export declare class QueuedWritableLink<A extends Record, B extends RequiredKeys<A>, C extends Record, D extends RequiredKeys<C>, E extends KeysRecordMap<A, B, C>> extends QueuedReadableLink<A, B, C, D, E> implements WritableLink<A, B, C, D, E> {
    constructor(writableLink: WritableLink<A, B, C, D, E>, queue: PromiseQueue);
}
export declare class QueuedReadableQuery<A extends Record, B extends RequiredKeys<A>, C extends SubsetOf<A, C>, D extends SubsetOf<A, D>> implements ReadableQuery<A, B, C, D> {
    protected writableQuery: WritableQuery<A, B, C, D>;
    protected queue: PromiseQueue;
    constructor(writableQuery: WritableQuery<A, B, C, D>, queue: PromiseQueue);
    filter(...parameters: Parameters<ReadableQuery<A, B, C, D>["filter"]>): ReturnType<ReadableQuery<A, B, C, D>["filter"]>;
}
export declare class QueuedWritableQuery<A extends Record, B extends RequiredKeys<A>, C extends SubsetOf<A, C>, D extends SubsetOf<A, D>> extends QueuedReadableQuery<A, B, C, D> implements WritableQuery<A, B, C, D> {
    constructor(writableQuery: WritableQuery<A, B, C, D>, queue: PromiseQueue);
}
export declare type ReadableTransaction<A extends Stores<any>, B extends Links<any>, C extends Queries<any>, D> = (stores: ReadableStoresFromStores<A>, links: ReadableLinksFromLinks<B>, queries: ReadableQueriesFromQueries<C>) => Promise<D>;
export declare type WritableTransaction<A extends Stores<any>, B extends Links<any>, C extends Queries<any>, D> = (stores: WritableStoresFromStores<A>, links: WritableLinksFromLinks<B>, queries: WritableQueriesFromQueries<C>) => Promise<D>;
export declare class TransactionManager<A extends WritableStores<any>, B extends WritableLinks<any>, C extends WritableQueries<any>> {
    private file;
    private readableTransactionLock;
    private writableTransactionLock;
    private writableStores;
    private writableLinks;
    private writableQueries;
    private createReadableLinks;
    private createReadableStores;
    private createReadableQueries;
    private createWritableLinks;
    private createWritableStores;
    private createWritableQueries;
    constructor(file: File, writableStores: A, writableLinks: B, writableQueries: C);
    enqueueReadableTransaction<D>(transaction: ReadableTransaction<StoresFromWritableStores<A>, LinksFromWritableLinks<B>, QueriesFromWritableQueries<C>, D>): Promise<D>;
    enqueueWritableTransaction<D>(transaction: WritableTransaction<StoresFromWritableStores<A>, LinksFromWritableLinks<B>, QueriesFromWritableQueries<C>, D>): Promise<D>;
}
