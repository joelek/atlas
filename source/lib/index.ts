import { Context, LinkReferences, LinksFromLinkReferences, QueriesFromQueryReferences, QueryReferences, StoreReference, StoreReferences, StoresFromStoreReferences } from "./contexts";
import { DecreasingOrder, IncreasingOrder } from "./orders";
import { EqualityFilter, GreaterThanFilter } from "./filters";
import { Value } from "./records";
import * as transactions from "./transactions";
import { LinkManagersFromLinks } from "./links";
import { QueryManagersFromQueries } from "./queries";
import { StoreManagersFromStores } from "./stores";
import { DatabaseLinksFromLinkManagers, DatabaseQueriesFromQueryManagers, DatabaseStoresFromStorManagers } from "./databases";

export type ReadableQueue = transactions.ReadableQueue;

export type WritableQueue = transactions.WritableQueue;

export type RecordOf<A> = A extends StoreReference<infer C, infer D> ? C : never;

export function createContext(): Context {
	return new Context();
};

export function createTransactionManager<A extends StoreReferences<any>, B extends LinkReferences<any>, C extends QueryReferences<any>>(path: string, schemaProvider: (context: Context) => { stores?: A, links?: B, queries?: C }): transactions.TransactionManager<DatabaseStoresFromStorManagers<StoreManagersFromStores<StoresFromStoreReferences<A>>>, DatabaseLinksFromLinkManagers<LinkManagersFromLinks<LinksFromLinkReferences<B>>>, DatabaseQueriesFromQueryManagers<QueryManagersFromQueries<QueriesFromQueryReferences<C>>>> {
	let context = new Context();
	let schema = schemaProvider(context);
	return context.createTransactionManager(path, schema.stores, schema.links, schema.queries);
};

export function createIncreasingOrder<A extends Value>(): IncreasingOrder<A> {
	return new IncreasingOrder();
};

export function createDecreasingOrder<A extends Value>(): DecreasingOrder<A> {
	return new DecreasingOrder();
};

export function createEqualityFilter<A extends Value>(value: A): EqualityFilter<A> {
	return new EqualityFilter(value);
};

export function createGreaterThanFilter<A extends Value>(value: A): GreaterThanFilter<A> {
	return new GreaterThanFilter(value);
};
