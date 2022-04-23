import { FilterMap } from "./filters";
import { Table } from "./tables";
import { OrderMap, Orders } from "./orders";
import { Fields, Record, Keys, KeysRecord, RecordManager, RequiredKeys, Key } from "./records";
import { BlockManager } from "./blocks";
import { SubsetOf } from "./inference";
export interface WritableStore<A extends Record, B extends RequiredKeys<A>> {
    filter(filters?: FilterMap<A>, orders?: OrderMap<A>, anchor?: KeysRecord<A, B>, limit?: number): Promise<Array<A>>;
    insert(record: A): Promise<void>;
    length(): Promise<number>;
    lookup(keysRecord: KeysRecord<A, B>): Promise<A>;
    remove(keysRecord: KeysRecord<A, B>): Promise<void>;
    search(query: string, anchor?: KeysRecord<A, B>, limit?: number): Promise<Array<A>>;
    update(keysRecord: KeysRecord<A, B>): Promise<void>;
    vacate(): Promise<void>;
}
export declare type WritableStores<A> = {
    [B in keyof A]: A[B] extends WritableStore<infer C, infer D> ? WritableStore<C, D> : A[B];
};
export declare type WritableStoresFromStores<A extends Stores<any>> = {
    [B in keyof A]: A[B] extends Store<infer C, infer D> ? WritableStore<C, D> : never;
};
export declare type StoresFromWritableStores<A extends WritableStores<any>> = {
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
    search(...parameters: Parameters<WritableStore<A, B>["search"]>): ReturnType<WritableStore<A, B>["search"]>;
    update(...parameters: Parameters<WritableStore<A, B>["update"]>): ReturnType<WritableStore<A, B>["update"]>;
    vacate(...parameters: Parameters<WritableStore<A, B>["vacate"]>): ReturnType<WritableStore<A, B>["vacate"]>;
}
export declare class FilteredStore<A extends Record> {
    private recordManager;
    private blockManager;
    private bids;
    private filters;
    private orders;
    private anchor?;
    constructor(recordManager: RecordManager<A>, blockManager: BlockManager, bids: Iterable<number>, filters?: FilterMap<A>, orders?: OrderMap<A>, anchor?: A);
    [Symbol.iterator](): Iterator<A>;
    static getOptimal<A extends Record>(filteredStores: Array<FilteredStore<A>>): FilteredStore<A> | undefined;
}
export declare class IndexManager<A extends Record, B extends Keys<A>> {
    private recordManager;
    private blockManager;
    private keys;
    private tree;
    constructor(recordManager: RecordManager<A>, blockManager: BlockManager, keys: [...B], options?: {
        bid?: number;
    });
    [Symbol.iterator](): Iterator<A>;
    delete(): void;
    filter(filters?: FilterMap<A>, orders?: OrderMap<A>, anchor?: A): FilteredStore<A> | undefined;
    insert(keysRecord: KeysRecord<A, B>, bid: number): void;
    remove(keysRecord: KeysRecord<A, B>): void;
    update(oldKeysRecord: KeysRecord<A, B>, newKeysRecord: KeysRecord<A, B>, bid: number): void;
    vacate(): void;
}
export declare type SearchResult<A extends Record> = {
    bid: number;
    record: A;
    tokens: Array<string>;
    rank: number;
};
export declare function getFirstCompletion(prefix: string, tokens: Array<string>): string | undefined;
export declare class SearchIndexManagerV1<A extends Record, B extends Key<A>> {
    private recordManager;
    private blockManager;
    private key;
    private tree;
    private computeRank;
    private computeRecordRank;
    private getNextMatch;
    private insertToken;
    private removeToken;
    private readRecord;
    private tokenizeRecord;
    constructor(recordManager: RecordManager<A>, blockManager: BlockManager, key: B, options?: {
        bid?: number;
    });
    [Symbol.iterator](): Iterator<SearchResult<A>>;
    delete(): void;
    insert(record: A, bid: number): void;
    remove(record: A, bid: number): void;
    search(query: string, bid?: number): Iterable<SearchResult<A>>;
    update(oldRecord: A, newRecord: A, bid: number): void;
    vacate(): void;
    static search<A extends Record>(searchIndexManagers: Array<SearchIndexManagerV1<A, Key<A>>>, query: string, bid?: number): Iterable<SearchResult<A>>;
}
export declare class SearchIndexManagerV2<A extends Record, B extends Key<A>> {
    private recordManager;
    private blockManager;
    private key;
    private tree;
    private computeRank;
    private computeRecordRank;
    private insertToken;
    private removeToken;
    private readRecord;
    private tokenizeRecord;
    constructor(recordManager: RecordManager<A>, blockManager: BlockManager, key: B, options?: {
        bid?: number;
    });
    [Symbol.iterator](): Iterator<SearchResult<A>>;
    delete(): void;
    insert(record: A, bid: number): void;
    remove(record: A, bid: number): void;
    search(query: string, bid?: number): Iterable<SearchResult<A>>;
    update(oldRecord: A, newRecord: A, bid: number): void;
    vacate(): void;
    static search<A extends Record>(searchIndexManagers: Array<SearchIndexManagerV2<A, Key<A>>>, query: string, bid?: number): Iterable<SearchResult<A>>;
}
export declare class StoreManager<A extends Record, B extends RequiredKeys<A>> {
    private blockManager;
    private fields;
    private keys;
    private orders;
    private recordManager;
    private table;
    private indexManagers;
    private searchIndexManagers;
    private getDefaultRecord;
    private lookupBlockIndex;
    constructor(blockManager: BlockManager, fields: Fields<A>, keys: [...B], orders: OrderMap<A>, table: Table, indexManagers: Array<IndexManager<A, Keys<A>>>, searchIndexManagers: Array<SearchIndexManagerV1<A, Key<A>>>);
    [Symbol.iterator](): Iterator<A>;
    delete(): void;
    filter(filters?: FilterMap<A>, orders?: OrderMap<A>, anchorKeysRecord?: KeysRecord<A, B>, limit?: number): Array<A>;
    insert(record: A): void;
    length(): number;
    lookup(keysRecord: KeysRecord<A, B>): A;
    remove(keysRecord: KeysRecord<A, B>): void;
    search(query: string, anchorKeysRecord?: KeysRecord<A, B>, limit?: number): Array<SearchResult<A>>;
    update(keysRecord: KeysRecord<A, B>): void;
    vacate(): void;
    static construct<A extends Record, B extends RequiredKeys<A>, C extends SubsetOf<A, C>>(blockManager: BlockManager, options: {
        fields: Fields<A>;
        keys: [...B];
        orders?: Orders<C>;
        indices?: Array<Index<any>>;
        searchIndices?: Array<SearchIndex<any>>;
    }): StoreManager<A, B>;
}
export declare type StoreManagers<A> = {
    [B in keyof A]: A[B] extends StoreManager<infer C, infer D> ? StoreManager<C, D> : A[B];
};
export declare type StoreManagersFromStores<A extends Stores<any>> = {
    [B in keyof A]: A[B] extends Store<infer C, infer D> ? StoreManager<C, D> : never;
};
export declare type WritableStoresFromStoreManagers<A extends StoreManagers<any>> = {
    [B in keyof A]: A[B] extends StoreManager<infer C, infer D> ? WritableStore<C, D> : never;
};
export declare class Index<A extends Record> {
    keys: Keys<A>;
    constructor(keys: Keys<A>);
    equals(that: Index<A>): boolean;
}
export declare class SearchIndex<A extends Record> {
    key: Key<A>;
    constructor(key: Key<A>);
    equals(that: SearchIndex<A>): boolean;
}
export declare class Store<A extends Record, B extends RequiredKeys<A>> {
    fields: Fields<A>;
    keys: [...B];
    orders: OrderMap<A>;
    indices: Array<Index<A>>;
    searchIndices: Array<SearchIndex<A>>;
    constructor(fields: Fields<A>, keys: [...B], orders?: OrderMap<A>);
    createIndex(): Index<A>;
    index(that: Index<A>): void;
}
export declare type Stores<A> = {
    [B in keyof A]: A[B] extends Store<infer C, infer D> ? Store<C, D> : A[B];
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
    search(...parameters: Parameters<WritableStore<A, B>["search"]>): ReturnType<WritableStore<A, B>["search"]>;
    update(...parameters: Parameters<WritableStore<A, B>["update"]>): ReturnType<WritableStore<A, B>["update"]>;
    vacate(...parameters: Parameters<WritableStore<A, B>["vacate"]>): ReturnType<WritableStore<A, B>["vacate"]>;
}
