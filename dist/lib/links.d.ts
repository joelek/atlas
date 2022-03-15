import { OrderMap } from "./orders";
import { Keys, KeysRecord, KeysRecordMap, Record, RequiredKeys } from "./records";
import { Entry, Store, StoreManager } from "./stores";
export interface ReadableLink<A extends Record, B extends RequiredKeys<A>, C extends Record, D extends RequiredKeys<C>, E extends KeysRecordMap<A, B, C>> {
    filter(keysRecord: KeysRecord<A, B>): Promise<Iterable<Entry<C>>>;
    lookup(record: C | Pick<C, E[B[number]]>): Promise<A | undefined>;
}
export declare type ReadableLinks<A> = {
    [B in keyof A]: A[B] extends ReadableLink<infer C, infer D, infer E, infer F, infer G> ? ReadableLink<C, D, E, F, G> : A[B];
};
export declare type ReadableLinksFromLinks<A extends Links<any>> = {
    [B in keyof A]: A[B] extends Link<infer C, infer D, infer E, infer F, infer G> ? ReadableLink<C, D, E, F, G> : never;
};
export declare type LinksFromReadableLinks<A extends ReadableLinks<any>> = {
    [B in keyof A]: A[B] extends ReadableLink<infer C, infer D, infer E, infer F, infer G> ? Link<C, D, E, F, G> : never;
};
export interface WritableLink<A extends Record, B extends RequiredKeys<A>, C extends Record, D extends RequiredKeys<C>, E extends KeysRecordMap<A, B, C>> extends ReadableLink<A, B, C, D, E> {
}
export declare type WritableLinks<A> = {
    [B in keyof A]: A[B] extends WritableLink<infer C, infer D, infer E, infer F, infer G> ? WritableLink<C, D, E, F, G> : A[B];
};
export declare type WritableLinksFromLinks<A extends Links<any>> = {
    [B in keyof A]: A[B] extends Link<infer C, infer D, infer E, infer F, infer G> ? WritableLink<C, D, E, F, G> : never;
};
export declare type LinksFromWritableLinks<A extends WritableLinks<any>> = {
    [B in keyof A]: A[B] extends WritableLink<infer C, infer D, infer E, infer F, infer G> ? Link<C, D, E, F, G> : never;
};
export declare class WritableLinkManager<A extends Record, B extends RequiredKeys<A>, C extends Record, D extends RequiredKeys<C>, E extends KeysRecordMap<A, B, C>> implements WritableLink<A, B, C, D, E> {
    protected linkManager: LinkManager<A, B, C, D, E>;
    constructor(linkManager: LinkManager<A, B, C, D, E>);
    filter(...parameters: Parameters<WritableLink<A, B, C, D, E>["filter"]>): ReturnType<WritableLink<A, B, C, D, E>["filter"]>;
    lookup(...parameters: Parameters<WritableLink<A, B, C, D, E>["lookup"]>): ReturnType<WritableLink<A, B, C, D, E>["lookup"]>;
}
export declare class LinkManager<A extends Record, B extends RequiredKeys<A>, C extends Record, D extends RequiredKeys<C>, E extends KeysRecordMap<A, B, C>> {
    private parent;
    private child;
    private keysRecordMap;
    private orders;
    constructor(parent: StoreManager<A, B>, child: StoreManager<C, D>, keysRecordMap: E, orders?: OrderMap<C>);
    getParent(): StoreManager<A, B>;
    getChild(): StoreManager<C, D>;
    filter(keysRecord: KeysRecord<A, B>): Iterable<Entry<C>>;
    lookup(record: C | Pick<C, E[B[number]]>): A | undefined;
    static construct<A extends Record, B extends RequiredKeys<A>, C extends Record, D extends RequiredKeys<C>, E extends KeysRecordMap<A, B, C>>(parent: StoreManager<A, B>, child: StoreManager<C, D>, recordKeysMap: E, orders?: OrderMap<C>): LinkManager<A, B, C, D, E>;
}
export declare type LinkManagers<A> = {
    [B in keyof A]: A[B] extends LinkManager<infer C, infer D, infer E, infer F, infer G> ? LinkManager<C, D, E, F, G> : A[B];
};
export declare type LinkManagersFromLinks<A extends Links<any>> = {
    [B in keyof A]: A[B] extends Link<infer C, infer D, infer E, infer F, infer G> ? LinkManager<C, D, E, F, G> : never;
};
export declare type WritableLinksFromLinkManagers<A extends LinkManagers<any>> = {
    [B in keyof A]: A[B] extends LinkManager<infer C, infer D, infer E, infer F, infer G> ? WritableLink<C, D, E, F, G> : never;
};
export declare class Link<A extends Record, B extends RequiredKeys<A>, C extends Record, D extends RequiredKeys<C>, E extends KeysRecordMap<A, B, C>> {
    parent: Store<A, B>;
    child: Store<C, D>;
    recordKeysMap: E;
    orders: OrderMap<C>;
    constructor(parent: Store<A, B>, child: Store<C, D>, recordKeysMap: E, orders: OrderMap<C>);
    createIndexKeys(): Keys<C>;
}
export declare type Links<A> = {
    [B in keyof A]: A[B] extends Link<infer C, infer D, infer E, infer F, infer G> ? Link<C, D, E, F, G> : A[B];
};
export declare class OverridableWritableLink<A extends Record, B extends RequiredKeys<A>, C extends Record, D extends RequiredKeys<C>, E extends KeysRecordMap<A, B, C>> implements WritableLink<A, B, C, D, E> {
    private linkManager;
    private overrides;
    constructor(linkManager: LinkManager<A, B, C, D, E>, overrides: Partial<WritableLink<A, B, C, D, E>>);
    filter(...parameters: Parameters<WritableLink<A, B, C, D, E>["filter"]>): ReturnType<WritableLink<A, B, C, D, E>["filter"]>;
    lookup(...parameters: Parameters<WritableLink<A, B, C, D, E>["lookup"]>): ReturnType<WritableLink<A, B, C, D, E>["lookup"]>;
}
