import { File } from "./files";
import { LinkManagers, Links, WritableLinksFromLinkManagers } from "./links";
import { Queries, QueryManagers, WritableQueriesFromQueryManagers } from "./queries";
import { Keys } from "./records";
import { StoreManagers, Stores, WritableStoresFromStoreManagers } from "./stores";
import { TransactionManager } from "./transactions";
export declare class DatabaseManager<A extends StoreManagers<any>, B extends LinkManagers<any>, C extends QueryManagers<any>> {
    private storeManagers;
    private linkManagers;
    private queryManagers;
    private linksWhereStoreIsParent;
    private linksWhereStoreIsChild;
    private doInsert;
    private doRemove;
    private getLinksWhereStoreIsParent;
    private getLinksWhereStoreIsChild;
    constructor(storeManagers: A, linkManagers: B, queryManagers: C);
    createTransactionManager(file: File): TransactionManager<WritableStoresFromStoreManagers<A>, WritableLinksFromLinkManagers<B>, WritableQueriesFromQueryManagers<C>>;
    createWritableStores(): WritableStoresFromStoreManagers<A>;
    createWritableLinks(): WritableLinksFromLinkManagers<B>;
    createWritableQueries(): WritableQueriesFromQueryManagers<C>;
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
