import { Link, LinkManagersFromLinks, WritableLinksFromLinkManagers } from "./link";
import { Store, StoreManagersFromStores, WritableStoresFromStoreManagers } from "./store";
import { Record, KeysRecordMap, RequiredKeys, Value } from "./records";
import { TransactionManager } from "./transaction";
import { OrderMap } from "./orders";
export declare class FileReference {
    private FileReference;
}
export declare class FieldReference<A extends Value> {
    private FieldReference;
}
export declare type FieldReferences<A extends Record> = {
    [B in keyof A]: FieldReference<A[B]>;
};
export declare class StoreReference<A extends Record, B extends RequiredKeys<A>> {
    private StoreReference;
}
export declare type StoreReferences<A> = {
    [B in keyof A]: A[B] extends StoreReference<infer C, infer D> ? StoreReference<C, D> : A[B];
};
export declare type StoresFromStoreReferences<A extends StoreReferences<any>> = {
    [B in keyof A]: A[B] extends StoreReference<infer C, infer D> ? Store<C, D> : never;
};
export declare class LinkReference<A extends Record, B extends RequiredKeys<A>, C extends Record, D extends RequiredKeys<C>, E extends KeysRecordMap<A, B, C>> {
    private LinkReference;
}
export declare type LinkReferences<A> = {
    [B in keyof A]: A[B] extends LinkReference<infer C, infer D, infer E, infer F, infer G> ? LinkReference<C, D, E, F, G> : A[B];
};
export declare type LinksFromLinkReferences<A extends LinkReferences<any>> = {
    [B in keyof A]: A[B] extends LinkReference<infer C, infer D, infer E, infer F, infer G> ? Link<C, D, E, F, G> : never;
};
export declare class Context {
    private files;
    private fields;
    private links;
    private stores;
    private databaseManagers;
    private getFile;
    private getField;
    private getLink;
    private getStore;
    constructor();
    createBigIntField(): FieldReference<bigint>;
    createBinaryField(): FieldReference<Uint8Array>;
    createBooleanField(): FieldReference<boolean>;
    createIntegerField(): FieldReference<number>;
    createNumberField(): FieldReference<number>;
    createStringField(): FieldReference<string>;
    createNullableStringField(): FieldReference<string | null>;
    createLink<A extends Record, B extends RequiredKeys<A>, C extends Record, D extends RequiredKeys<C>, E extends KeysRecordMap<A, B, C>>(parent: StoreReference<A, B>, child: StoreReference<C, D>, recordKeysMap: KeysRecordMap<A, B, C>, orders?: OrderMap<C>): LinkReference<A, B, C, D, E>;
    createStore<A extends Record, B extends RequiredKeys<A>>(fieldReferences: FieldReferences<A>, keys: [...B]): StoreReference<A, B>;
    createDiskStorage(path: string): FileReference;
    createMemoryStorage(): FileReference;
    createTransactionManager<A extends StoreReferences<any>, B extends LinkReferences<any>>(fileReference: FileReference, storeReferences?: A, linkReferences?: B): TransactionManager<WritableStoresFromStoreManagers<StoreManagersFromStores<StoresFromStoreReferences<A>>>, WritableLinksFromLinkManagers<LinkManagersFromLinks<LinksFromLinkReferences<B>>>>;
}
