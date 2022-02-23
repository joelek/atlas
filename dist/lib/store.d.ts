import { FilterMap } from "./filters";
import { Table } from "./hash";
import { OrderMap } from "./orders";
import { Fields, Record, Keys, KeysRecord, FieldManagers, RequiredKeys } from "./records";
import { BlockHandler } from "./vfs";
export declare type Entry<A extends Record> = {
    bid(): number;
    record(): A;
};
export interface ReadableStore<A extends Record, B extends RequiredKeys<A>> {
    filter(filters?: FilterMap<A>, orders?: OrderMap<A>): Promise<Iterable<Entry<A>>>;
    length(): Promise<number>;
    lookup(keysRecord: KeysRecord<A, B>): Promise<A>;
}
export declare type ReadableStores = {
    [key: string]: ReadableStore<any, any>;
};
export declare type ReadableStoresFromStores<A extends Stores> = {
    [B in keyof A]: A[B] extends Store<infer C, infer D> ? ReadableStore<C, D> : never;
};
export declare type StoresFromReadableStores<A extends ReadableStores> = {
    [B in keyof A]: A[B] extends ReadableStore<infer C, infer D> ? Store<C, D> : never;
};
export interface WritableStore<A extends Record, B extends RequiredKeys<A>> extends ReadableStore<A, B> {
    insert(record: A): Promise<void>;
    remove(keysRecord: KeysRecord<A, B>): Promise<void>;
    update(record: A): Promise<void>;
}
export declare type WritableStores = {
    [key: string]: WritableStore<any, any>;
};
export declare type WritableStoresFromStores<A extends Stores> = {
    [B in keyof A]: A[B] extends Store<infer C, infer D> ? WritableStore<C, D> : never;
};
export declare type StoresFromWritableStores<A extends WritableStores> = {
    [B in keyof A]: A[B] extends WritableStore<infer C, infer D> ? Store<C, D> : never;
};
export declare class WritableStoreManager<A extends Record, B extends RequiredKeys<A>> implements WritableStore<A, B> {
    private storeManager;
    constructor(storeManager: StoreManager<A, B>);
    filter(...parameters: Parameters<WritableStore<A, B>["filter"]>): ReturnType<WritableStore<A, B>["filter"]>;
    insert(...parameters: Parameters<WritableStore<A, B>["insert"]>): ReturnType<WritableStore<A, B>["insert"]>;
    length(...parameters: Parameters<WritableStore<A, B>["length"]>): ReturnType<WritableStore<A, B>["length"]>;
    lookup(...parameters: Parameters<WritableStore<A, B>["lookup"]>): ReturnType<WritableStore<A, B>["lookup"]>;
    remove(...parameters: Parameters<WritableStore<A, B>["remove"]>): ReturnType<WritableStore<A, B>["remove"]>;
    update(...parameters: Parameters<WritableStore<A, B>["update"]>): ReturnType<WritableStore<A, B>["update"]>;
}
export declare class StoreManager<A extends Record, B extends RequiredKeys<A>> {
    private blockHandler;
    private bid;
    private fieldManagers;
    private keys;
    private recordManager;
    private table;
    private filterIterable;
    constructor(blockHandler: BlockHandler, bid: number, fieldManagers: FieldManagers<A>, keys: [...B], table: Table);
    [Symbol.iterator](): Iterator<Entry<A>>;
    delete(): void;
    filter(filters?: FilterMap<A>, orders?: OrderMap<A>): Iterable<Entry<A>>;
    insert(record: A): void;
    length(): number;
    lookup(keysRecord: KeysRecord<A, B>): A;
    remove(keysRecord: KeysRecord<A, B>): void;
    update(record: A): void;
    static construct<A extends Record, B extends RequiredKeys<A>>(blockHandler: BlockHandler, bid: number | null, options?: {
        fields: Fields<A>;
        keys: [...B];
        indices: Array<Keys<A>>;
    }): StoreManager<A, B>;
}
export declare type StoreManagers = {
    [key: string]: StoreManager<any, any>;
};
export declare type StoreManagersFromStores<A extends Stores> = {
    [B in keyof A]: A[B] extends Store<infer C, infer D> ? StoreManager<C, D> : never;
};
export declare type WritableStoresFromStoreManagers<A extends StoreManagers> = {
    [B in keyof A]: A[B] extends StoreManager<infer C, infer D> ? WritableStore<C, D> : never;
};
export declare class StoreReference<A extends Record, B extends RequiredKeys<A>> {
    private StoreReference;
}
export declare type StoreReferences = {
    [key: string]: StoreReference<any, any>;
};
export declare class Index<A extends Record> {
    keys: Keys<A>;
    constructor(keys: Keys<A>);
}
export declare class Store<A extends Record, B extends RequiredKeys<A>> {
    fields: Fields<A>;
    keys: [...B];
    indices: Array<Index<A>>;
    constructor(fields: Fields<A>, keys: [...B]);
}
export declare type StoresFromStoreReferences<A extends StoreReferences> = {
    [B in keyof A]: A[B] extends StoreReference<infer C, infer D> ? Store<C, D> : never;
};
export declare type Stores = {
    [key: string]: Store<any, any>;
};
export declare class OverridableWritableStore<A extends Record, B extends RequiredKeys<A>> implements WritableStore<A, B> {
    private storeManager;
    private overrides;
    constructor(storeManager: StoreManager<A, B>, overrides: Partial<WritableStore<A, B>>);
    filter(...parameters: Parameters<WritableStore<A, B>["filter"]>): ReturnType<WritableStore<A, B>["filter"]>;
    insert(...parameters: Parameters<WritableStore<A, B>["insert"]>): ReturnType<WritableStore<A, B>["insert"]>;
    length(...parameters: Parameters<WritableStore<A, B>["length"]>): ReturnType<WritableStore<A, B>["length"]>;
    lookup(...parameters: Parameters<WritableStore<A, B>["lookup"]>): ReturnType<WritableStore<A, B>["lookup"]>;
    remove(...parameters: Parameters<WritableStore<A, B>["remove"]>): ReturnType<WritableStore<A, B>["remove"]>;
    update(...parameters: Parameters<WritableStore<A, B>["update"]>): ReturnType<WritableStore<A, B>["update"]>;
}