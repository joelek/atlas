import { Context, LinkReferences, LinksFromLinkReferences, QueriesFromQueryReferences, QueryReferences, StoreReference, StoreReferences, StoresFromStoreReferences } from "./contexts";
import { DecreasingOrder, IncreasingOrder } from "./orders";
import { EqualityFilter } from "./filters";
import { Value } from "./records";
import * as transactions from "./transactions";
import { LinkInterfacesFromLinkManagers, LinkManagersFromLinks } from "./links";
import { QueryInterfacesFromQueryManagers, QueryManagersFromQueries } from "./queries";
import { StoreInterfacesFromStoreManagers, StoreManagersFromStores } from "./stores";

export type ReadableQueue = transactions.ReadableQueue;

export type WritableQueue = transactions.WritableQueue;

export type RecordOf<A> = A extends StoreReference<infer C, infer D> ? C : never;

export function createContext(): Context {
	return new Context();
};

export function createTransactionManager<A extends StoreReferences<any>, B extends LinkReferences<any>, C extends QueryReferences<any>>(path: string, schemaProvider: (context: Context) => { stores?: A, links?: B, queries?: C }): transactions.TransactionManager<StoreInterfacesFromStoreManagers<StoreManagersFromStores<StoresFromStoreReferences<A>>>, LinkInterfacesFromLinkManagers<LinkManagersFromLinks<LinksFromLinkReferences<B>>>, QueryInterfacesFromQueryManagers<QueryManagersFromQueries<QueriesFromQueryReferences<C>>>> {
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
