import { File } from "./files";
import { Link, LinkManagers, WritableLinksFromLinkManagers } from "./link";
import { Keys } from "./records";
import { Store, StoreManagers, WritableStoresFromStoreManagers } from "./store";
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
export declare type Stores2<A> = {
    [B in keyof A]: A[B] extends Store<infer C, infer D> ? Store<C, D> : A[B];
};
export declare type Links2<A> = {
    [B in keyof A]: A[B] extends Link<infer C, infer D, infer E, infer F, infer G> ? Link<C, D, E, F, G> : A[B];
};
export declare class Database<A extends Stores2<any>, B extends Links2<any>> {
    stores: A;
    links: B;
    constructor(stores?: A, links?: B);
}
