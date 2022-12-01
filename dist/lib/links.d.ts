import { OrderMap } from "./orders";
import { KeysRecord, KeysRecordMap, Record, RequiredKeys } from "./records";
import { Index, Store, StoreManager } from "./stores";
export interface LinkInterface<A extends Record, B extends RequiredKeys<A>, C extends Record, D extends RequiredKeys<C>, E extends KeysRecordMap<A, B, C>> {
    filter(keysRecord?: KeysRecord<A, B>, anchor?: KeysRecord<C, D>, limit?: number): Promise<Array<C>>;
    lookup(keysRecord: C | Pick<C, E[B[number]]>): Promise<A | undefined>;
}
export type LinkInterfaces<A> = {
    [B in keyof A]: A[B] extends LinkInterface<infer C, infer D, infer E, infer F, infer G> ? LinkInterface<C, D, E, F, G> : A[B];
};
export type LinkInterfacesFromLinks<A extends Links<any>> = {
    [B in keyof A]: A[B] extends Link<infer C, infer D, infer E, infer F, infer G> ? LinkInterface<C, D, E, F, G> : never;
};
export type LinksFromLinkInterfaces<A extends LinkInterfaces<any>> = {
    [B in keyof A]: A[B] extends LinkInterface<infer C, infer D, infer E, infer F, infer G> ? Link<C, D, E, F, G> : never;
};
export declare class LinkManager<A extends Record, B extends RequiredKeys<A>, C extends Record, D extends RequiredKeys<C>, E extends KeysRecordMap<A, B, C>> {
    private parent;
    private child;
    private keysRecordMap;
    private orders;
    constructor(parent: StoreManager<A, B>, child: StoreManager<C, D>, keysRecordMap: E, orders?: OrderMap<C>);
    getParent(): StoreManager<A, B>;
    getChild(): StoreManager<C, D>;
    filter(keysRecord?: KeysRecord<A, B>, anchorKeysRecord?: KeysRecord<C, D>, limit?: number): Array<C>;
    lookup(keysRecord: C | Pick<C, E[B[number]]>): A | undefined;
    static construct<A extends Record, B extends RequiredKeys<A>, C extends Record, D extends RequiredKeys<C>, E extends KeysRecordMap<A, B, C>>(parent: StoreManager<A, B>, child: StoreManager<C, D>, recordKeysMap: E, orders?: OrderMap<C>): LinkManager<A, B, C, D, E>;
}
export type LinkManagers<A> = {
    [B in keyof A]: A[B] extends LinkManager<infer C, infer D, infer E, infer F, infer G> ? LinkManager<C, D, E, F, G> : A[B];
};
export type LinkManagersFromLinks<A extends Links<any>> = {
    [B in keyof A]: A[B] extends Link<infer C, infer D, infer E, infer F, infer G> ? LinkManager<C, D, E, F, G> : never;
};
export type LinkInterfacesFromLinkManagers<A extends LinkManagers<any>> = {
    [B in keyof A]: A[B] extends LinkManager<infer C, infer D, infer E, infer F, infer G> ? LinkInterface<C, D, E, F, G> : never;
};
export declare class Link<A extends Record, B extends RequiredKeys<A>, C extends Record, D extends RequiredKeys<C>, E extends KeysRecordMap<A, B, C>> {
    parent: Store<A, B>;
    child: Store<C, D>;
    recordKeysMap: E;
    orders: OrderMap<C>;
    constructor(parent: Store<A, B>, child: Store<C, D>, recordKeysMap: E, orders?: OrderMap<C>);
    createIndex(): Index<C>;
}
export type Links<A> = {
    [B in keyof A]: A[B] extends Link<infer C, infer D, infer E, infer F, infer G> ? Link<C, D, E, F, G> : A[B];
};
