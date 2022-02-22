import { File } from "./files";
import { LinkManagers, Links, WritableLinksFromLinkManagers } from "./link";
import { Keys } from "./records";
import { StoreManagers, Stores, WritableStoresFromStoreManagers } from "./store";
import { TransactionManager } from "./transaction";
export declare class DatabaseManager<A extends StoreManagers, B extends LinkManagers> {
    private storeManagers;
    private linkManagers;
    private linksWhereStoreIsParent;
    private linksWhereStoreIsChild;
    private doInsert;
    private doRemove;
    private getLinksWhereStoreIsParent;
    private getLinksWhereStoreIsChild;
    constructor(storeManagers: A, linkManagers: B);
    createTransactionManager(file: File): TransactionManager<WritableStoresFromStoreManagers<A>, WritableLinksFromLinkManagers<B>>;
    createWritableStores(): WritableStoresFromStoreManagers<A>;
    createWritableLinks(): WritableLinksFromLinkManagers<B>;
    enforceStoreConsistency<C extends Keys<A>>(storeNames: [...C]): void;
    enforceLinkConsistency<D extends Keys<B>>(linkNames: [...D]): void;
    enforceConsistency<C extends Keys<A>, D extends Keys<B>>(storeNames: [...C], linkNames: [...D]): void;
}
export declare class Database<A extends Stores, B extends Links> {
    stores: A;
    links: B;
    constructor(stores: A, links: B);
}
