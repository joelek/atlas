import { Link, LinkManagersFromLinks, WritableLinksFromLinkManagers } from "./link";
import { Store, StoreManagersFromStores, WritableStoresFromStoreManagers } from "./store";
import { Record, Fields, KeysRecordMap, BinaryField, BooleanField, StringField, NullableStringField, RequiredKeys } from "./records";
import { TransactionManager } from "./transaction";
import { OrderMap } from "./orders";
export declare class FileReference {
    private FileReference;
}
export declare class StoreReference<A extends Record, B extends RequiredKeys<A>> {
    private StoreReference;
}
export declare type StoreReferences = {
    [key: string]: StoreReference<any, any>;
};
export declare type StoresFromStoreReferences<A extends StoreReferences> = {
    [B in keyof A]: A[B] extends StoreReference<infer C, infer D> ? Store<C, D> : never;
};
export declare class LinkReference<A extends Record, B extends RequiredKeys<A>, C extends Record, D extends RequiredKeys<C>, E extends KeysRecordMap<A, B, C>> {
    private LinkReference;
}
export declare type LinkReferences = {
    [key: string]: LinkReference<any, any, any, any, any>;
};
export declare type LinksFromLinkReferences<A extends LinkReferences> = {
    [B in keyof A]: A[B] extends LinkReference<infer C, infer D, infer E, infer F, infer G> ? Link<C, D, E, F, G> : never;
};
export declare class Context {
    private files;
    private links;
    private stores;
    private databaseManagers;
    private getFile;
    private getLink;
    private getStore;
    constructor();
    createBinaryField(): BinaryField;
    createBooleanField(): BooleanField;
    createStringField(): StringField;
    createNullableStringField(): NullableStringField;
    createLink<A extends Record, B extends RequiredKeys<A>, C extends Record, D extends RequiredKeys<C>, E extends KeysRecordMap<A, B, C>>(parent: StoreReference<A, B>, child: StoreReference<C, D>, recordKeysMap: KeysRecordMap<A, B, C>, orders?: OrderMap<C>): LinkReference<A, B, C, D, E>;
    createStore<A extends Record, B extends RequiredKeys<A>>(fields: Fields<A>, keys: [...B]): StoreReference<A, B>;
    createDiskStorage(path: string): FileReference;
    createMemoryStorage(): FileReference;
    createTransactionManager<A extends StoreReferences, B extends LinkReferences>(fileReference: FileReference, storeReferences?: A, linkReferences?: B): TransactionManager<WritableStoresFromStoreManagers<StoreManagersFromStores<StoresFromStoreReferences<A>>>, WritableLinksFromLinkManagers<LinkManagersFromLinks<LinksFromLinkReferences<B>>>>;
}
