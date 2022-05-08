import { SubsetOf } from "./inference";
import { LinkManager, LinkManagers, Links, LinkInterface } from "./links";
import { Queries, QueryManager, QueryManagers, QueryInterface } from "./queries";
import { Record, Keys, RequiredKeys, KeysRecordMap } from "./records";
import { StoreManager, StoreManagers, Stores, StoreInterface } from "./stores";
export declare class DatabaseStore<A extends Record, B extends RequiredKeys<A>> implements StoreInterface<A, B> {
    private storeManager;
    private overrides;
    constructor(storeManager: StoreManager<A, B>, overrides: Partial<StoreManager<A, B>>);
    filter(...parameters: Parameters<StoreInterface<A, B>["filter"]>): ReturnType<StoreInterface<A, B>["filter"]>;
    insert(...parameters: Parameters<StoreInterface<A, B>["insert"]>): ReturnType<StoreInterface<A, B>["insert"]>;
    length(...parameters: Parameters<StoreInterface<A, B>["length"]>): ReturnType<StoreInterface<A, B>["length"]>;
    lookup(...parameters: Parameters<StoreInterface<A, B>["lookup"]>): ReturnType<StoreInterface<A, B>["lookup"]>;
    remove(...parameters: Parameters<StoreInterface<A, B>["remove"]>): ReturnType<StoreInterface<A, B>["remove"]>;
    search(...parameters: Parameters<StoreInterface<A, B>["search"]>): ReturnType<StoreInterface<A, B>["search"]>;
    update(...parameters: Parameters<StoreInterface<A, B>["update"]>): ReturnType<StoreInterface<A, B>["update"]>;
    vacate(...parameters: Parameters<StoreInterface<A, B>["vacate"]>): ReturnType<StoreInterface<A, B>["vacate"]>;
}
export declare type DatabaseStores<A> = {
    [B in keyof A]: A[B] extends DatabaseStore<infer C, infer D> ? DatabaseStore<C, D> : A[B];
};
export declare type DatabaseStoresFromStorManagers<A extends StoreManagers<any>> = {
    [B in keyof A]: A[B] extends StoreManager<infer C, infer D> ? DatabaseStore<C, D> : never;
};
export declare class DatabaseLink<A extends Record, B extends RequiredKeys<A>, C extends Record, D extends RequiredKeys<C>, E extends KeysRecordMap<A, B, C>> implements LinkInterface<A, B, C, D, E> {
    private linkManager;
    private overrides;
    constructor(linkManager: LinkManager<A, B, C, D, E>, overrides: Partial<LinkManager<A, B, C, D, E>>);
    filter(...parameters: Parameters<LinkInterface<A, B, C, D, E>["filter"]>): ReturnType<LinkInterface<A, B, C, D, E>["filter"]>;
    lookup(...parameters: Parameters<LinkInterface<A, B, C, D, E>["lookup"]>): ReturnType<LinkInterface<A, B, C, D, E>["lookup"]>;
}
export declare type DatabaseLinks<A> = {
    [B in keyof A]: A[B] extends DatabaseLink<infer C, infer D, infer E, infer F, infer G> ? DatabaseLink<C, D, E, F, G> : A[B];
};
export declare type DatabaseLinksFromLinkManagers<A extends LinkManagers<any>> = {
    [B in keyof A]: A[B] extends LinkManager<infer C, infer D, infer E, infer F, infer G> ? DatabaseLink<C, D, E, F, G> : never;
};
export declare class DatabaseQuery<A extends Record, B extends RequiredKeys<A>, C extends SubsetOf<A, C>, D extends SubsetOf<A, D>> implements QueryInterface<A, B, C, D> {
    private queryManager;
    private overrides;
    constructor(queryManager: QueryManager<A, B, C, D>, overrides: Partial<QueryManager<A, B, C, D>>);
    filter(...parameters: Parameters<QueryInterface<A, B, C, D>["filter"]>): ReturnType<QueryInterface<A, B, C, D>["filter"]>;
}
export declare type DatabaseQueries<A> = {
    [B in keyof A]: A[B] extends DatabaseQuery<infer C, infer D, infer E, infer F> ? DatabaseQuery<C, D, E, F> : A[B];
};
export declare type DatabaseQueriesFromQueryManagers<A extends QueryManagers<any>> = {
    [B in keyof A]: A[B] extends QueryManager<infer C, infer D, infer E, infer F> ? DatabaseQuery<C, D, E, F> : never;
};
export declare class DatabaseManager<A extends StoreManagers<any>, B extends LinkManagers<any>, C extends QueryManagers<any>> {
    private storeManagers;
    private linkManagers;
    private queryManagers;
    private linksWhereStoreIsParent;
    private linksWhereStoreIsChild;
    private doInsert;
    private doRemove;
    private doVacate;
    private getLinksWhereStoreIsParent;
    private getLinksWhereStoreIsChild;
    constructor(storeManagers: A, linkManagers: B, queryManagers: C);
    createDatabaseStores(): DatabaseStoresFromStorManagers<A>;
    createDatabaseLinks(): DatabaseLinksFromLinkManagers<B>;
    createDatabaseQueries(): DatabaseQueriesFromQueryManagers<C>;
    enforceStoreConsistency<C extends Keys<A>>(storeNames: [...C]): void;
    enforceLinkConsistency<D extends Keys<B>>(linkNames: [...D]): void;
    enforceConsistency<C extends Keys<A>, D extends Keys<B>>(storeNames: [...C], linkNames: [...D]): void;
}
export declare class Database<A extends Stores<any>, B extends Links<any>, C extends Queries<any>> {
    stores: A;
    links: B;
    queries: C;
    constructor(stores?: A, links?: B, queries?: C);
}
