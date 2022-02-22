import { LinkManagersFromLinks, LinkReference, LinkReferences, LinksFromLinkReferences, WritableLinksFromLinkManagers } from "./link";
import { StoreManagersFromStores, StoreReference, StoreReferences, StoresFromStoreReferences, WritableStoresFromStoreManagers } from "./store";
import { Record, Fields, KeysRecordMap, BinaryField, BooleanField, StringField, NullableStringField, RequiredKeys } from "./records";
import { TransactionManager } from "./transaction";
import { OrderMap } from "./orders";
export declare class FileReference {
    private FileReference;
}
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
