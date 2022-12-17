import { Link, LinkManagersFromLinks, LinkInterfacesFromLinkManagers } from "./links";
import { Store, StoreManagersFromStores, StoreInterfacesFromStoreManagers } from "./stores";
import { Record, Fields, KeysRecordMap, BinaryField, BooleanField, StringField, NullableStringField, RequiredKeys, Value, Field, BigIntField, NumberField, IntegerField, NullableBigIntField, NullableBinaryField, NullableBooleanField, NullableIntegerField, NullableNumberField } from "./records";
import { TransactionManager } from "./transactions";
import { DecreasingOrder, IncreasingOrder, Order, OrderMap, Orders } from "./orders";
import { File, PagedDurableFile, PagedFile, PhysicalFile } from "./files";
import { Database, DatabaseLinksFromLinkManagers, DatabaseQueriesFromQueryManagers, DatabaseStoresFromStorManagers } from "./databases";
import { EqualityOperator, Operator, Operators } from "./operators";
import { SchemaManager } from "./schemas";
import { SubsetOf } from "./inference";
import { Query, QueryManagersFromQueries, QueryInterfacesFromQueryManagers } from "./queries";
import { BlockManager } from "./blocks";

export class FieldReference<A extends Field<any>> {
	private FieldReference!: "FieldReference";
};

export type FieldReferences<A extends Record> = {
	[B in keyof A]: FieldReference<Field<A[B]>>;
};

export class StoreReference<A extends Record, B extends RequiredKeys<A>> {
	private StoreReference!: "StoreReference";
};

export type StoreReferences<A> = {
	[B in keyof A]: A[B] extends StoreReference<infer C, infer D> ? StoreReference<C, D> : A[B];
};

export type StoresFromStoreReferences<A extends StoreReferences<any>> = {
	[B in keyof A]: A[B] extends StoreReference<infer C, infer D> ? Store<C, D> : never;
};

export class LinkReference<A extends Record, B extends RequiredKeys<A>, C extends Record, D extends RequiredKeys<C>, E extends KeysRecordMap<A, B, C>> {
	private LinkReference!: "LinkReference";
};

export type LinkReferences<A> = {
	[B in keyof A]: A[B] extends LinkReference<infer C, infer D, infer E, infer F, infer G> ? LinkReference<C, D, E, F, G> : A[B];
};

export type LinksFromLinkReferences<A extends LinkReferences<any>> = {
	[B in keyof A]: A[B] extends LinkReference<infer C, infer D, infer E, infer F, infer G> ? Link<C, D, E, F, G> : never;
};

export class QueryReference<A extends Record, B extends RequiredKeys<A>, C extends SubsetOf<A, C>, D extends SubsetOf<A, D>> {
	private QueryReference!: "QueryReference";
};

export type QueryReferences<A> = {
	[B in keyof A]: A[B] extends QueryReference<infer C, infer D, infer E, infer F> ? QueryReference<C, D, E, F> : A[B];
};

export type QueriesFromQueryReferences<A extends QueryReferences<any>> = {
	[B in keyof A]: A[B] extends QueryReference<infer C, infer D, infer E, infer F> ? Query<C, D, E, F> : never;
};

export class OrderReference<A extends Order<any>> {
	private OrderReference!: "OrderReference";
};

export type OrderReferences<A extends Record> = {
	[B in keyof A]: OrderReference<Order<A[B]>>;
};

export class OperatorReference<A extends Operator<any>> {
	private OperatorReference!: "OperatorReference";
};

export type OperatorReferences<A extends Record> = {
	[B in keyof A]: OperatorReference<Operator<A[B]>>;
};

export class Context {
	private fields: Map<FieldReference<any>, Field<any>>;
	private links: Map<LinkReference<any, any, any, any, any>, Link<any, any, any, any, any>>;
	private stores: Map<StoreReference<any, any>, Store<any, any>>;
	private queries: Map<QueryReference<any, any, any, any>, Query<any, any, any, any>>;
	private operators: Map<OperatorReference<any>, Operator<any>>;
	private orders: Map<OrderReference<any>, Order<any>>;

	private getField<A extends Field<any>>(reference: FieldReference<A>): A {
		let field = this.fields.get(reference);
		if (field == null) {
			throw `Expected field to be defined in context!`;
		}
		return field as A;
	}

	private getLink<A extends Record, B extends RequiredKeys<A>, C extends Record, D extends RequiredKeys<C>, E extends KeysRecordMap<A, B, C>>(reference: LinkReference<A, B, C, D, E>): Link<A, B, C, D, E> {
		let link = this.links.get(reference);
		if (link == null) {
			throw `Expected link to be defined in context!`;
		}
		return link;
	}

	private getStore<A extends Record, B extends RequiredKeys<A>>(reference: StoreReference<A, B>): Store<A, B> {
		let store = this.stores.get(reference);
		if (store == null) {
			throw `Expected store to be defined in context!`;
		}
		return store;
	}

	private getQuery<A extends Record, B extends RequiredKeys<A>, C extends SubsetOf<A, C>, D extends SubsetOf<A, D>>(reference: QueryReference<A, B, C, D>): Query<A, B, C, D> {
		let query = this.queries.get(reference);
		if (query == null) {
			throw `Expected query to be defined in context!`;
		}
		return query;
	}

	private getOperator<A extends Operator<any>>(reference: OperatorReference<A>): A {
		let operator = this.operators.get(reference);
		if (operator == null) {
			throw `Expected operator to be defined in context!`;
		}
		return operator as A;
	}

	private getOrder<A extends Order<any>>(reference: OrderReference<A>): A {
		let order = this.orders.get(reference);
		if (order == null) {
			throw `Expected order to be defined in context!`;
		}
		return order as A;
	}

	private createFile(path: string): File {
		let bin = new PhysicalFile(`${path}.bin`);
		let log = new PhysicalFile(`${path}.log`);
		let file = new PagedDurableFile(new PagedFile(bin, bin.hint().pageSizeLog2, 16384), new PagedFile(log, log.hint().pageSizeLog2, 16384), bin.hint().pageSizeLog2);
		return file;
	}

	constructor() {
		this.fields = new Map();
		this.links = new Map();
		this.stores = new Map();
		this.queries = new Map();
		this.operators = new Map();
		this.orders = new Map();
	}

	createBigIntField(options?: { unique?: boolean }): FieldReference<BigIntField> {
		let reference = new FieldReference();
		let field = new BigIntField(0n, options?.unique);
		this.fields.set(reference, field);
		return reference;
	}

	createNullableBigIntField(options?: { unique?: boolean }): FieldReference<NullableBigIntField> {
		let reference = new FieldReference();
		let field = new NullableBigIntField(null, options?.unique);
		this.fields.set(reference, field);
		return reference;
	}

	createBinaryField(options?: { unique?: boolean }): FieldReference<BinaryField> {
		let reference = new FieldReference();
		let field = new BinaryField(Uint8Array.of(), options?.unique);
		this.fields.set(reference, field);
		return reference;
	}

	createNullableBinaryField(options?: { unique?: boolean }): FieldReference<NullableBinaryField> {
		let reference = new FieldReference();
		let field = new NullableBinaryField(null, options?.unique);
		this.fields.set(reference, field);
		return reference;
	}

	createBooleanField(options?: { unique?: boolean }): FieldReference<BooleanField> {
		let reference = new FieldReference();
		let field = new BooleanField(false, options?.unique);
		this.fields.set(reference, field);
		return reference;
	}

	createNullableBooleanField(options?: { unique?: boolean }): FieldReference<NullableBooleanField> {
		let reference = new FieldReference();
		let field = new NullableBooleanField(null, options?.unique);
		this.fields.set(reference, field);
		return reference;
	}

	createIntegerField(options?: { unique?: boolean }): FieldReference<IntegerField> {
		let reference = new FieldReference();
		let field = new IntegerField(0, options?.unique);
		this.fields.set(reference, field);
		return reference;
	}

	createNullableIntegerField(options?: { unique?: boolean }): FieldReference<NullableIntegerField> {
		let reference = new FieldReference();
		let field = new NullableIntegerField(null, options?.unique);
		this.fields.set(reference, field);
		return reference;
	}

	createNumberField(options?: { unique?: boolean }): FieldReference<NumberField> {
		let reference = new FieldReference();
		let field = new NumberField(0, options?.unique);
		this.fields.set(reference, field);
		return reference;
	}

	createNullableNumberField(options?: { unique?: boolean }): FieldReference<NullableNumberField> {
		let reference = new FieldReference();
		let field = new NullableNumberField(null, options?.unique);
		this.fields.set(reference, field);
		return reference;
	}

	createStringField(options?: { unique?: boolean, searchable?: boolean }): FieldReference<StringField> {
		let reference = new FieldReference();
		let field = new StringField("", options?.unique, options?.searchable);
		this.fields.set(reference, field);
		return reference;
	}

	createNullableStringField(options?: { unique?: boolean, searchable?: boolean }): FieldReference<NullableStringField> {
		let reference = new FieldReference();
		let field = new NullableStringField(null, options?.unique, options?.searchable);
		this.fields.set(reference, field);
		return reference;
	}

	createLink<A extends Record, B extends RequiredKeys<A>, C extends Record, D extends RequiredKeys<C>, E extends KeysRecordMap<A, B, C>>(parent: StoreReference<A, B>, child: StoreReference<C, D>, recordKeysMap: E, orderReferences?: Partial<OrderReferences<C>>): LinkReference<A, B, C, D, E> {
		let reference = new LinkReference<A, B, C, D, E>();
		let orders = {} as OrderMap<C>;
		for (let key in orderReferences) {
			let orderReference = orderReferences[key] as any; // TypeScript 4.0 cannot infer type properly.
			if (orderReference == null) {
				continue;
			}
			orders[key] = this.getOrder(orderReference);
		}
		let link = new Link(this.getStore(parent), this.getStore(child), recordKeysMap, orders);
		this.links.set(reference, link);
		return reference;
	}

	createStore<A extends Record, B extends RequiredKeys<A>, C extends SubsetOf<A, C>>(fieldReferences: FieldReferences<A>, keys: [...B], orderReferences?: OrderReferences<C>): StoreReference<A, B> {
		orderReferences = orderReferences ?? {} as OrderReferences<C>;
		let fields = {} as Fields<A>;
		for (let key in fieldReferences) {
			fields[key] = this.getField(fieldReferences[key]);
		}
		let orders = {} as OrderMap<A>;
		for (let key in orderReferences) {
			orders[key] = this.getOrder(orderReferences[key]) as any;
		}
		let reference = new StoreReference();
		let store = new Store(fields, keys, orders);
		this.stores.set(reference, store);
		return reference;
	}

	createQuery<A extends Record, B extends RequiredKeys<A>, C extends SubsetOf<A, C>, D extends SubsetOf<A, D>>(storeReference: StoreReference<A, B>, operatorReferences: OperatorReferences<C>, orderReferences?: OrderReferences<D>): QueryReference<A, B, C, D> {
		orderReferences = orderReferences ?? {} as OrderReferences<D>;
		let store = this.getStore(storeReference);
		let operators = {} as Operators<C>;
		for (let key in operatorReferences) {
			operators[key] = this.getOperator(operatorReferences[key]);
		}
		let orders = {} as Orders<D>;
		for (let key in orderReferences) {
			orders[key] = this.getOrder(orderReferences[key]);
		}
		let reference = new QueryReference();
		let query = new Query(store, operators, orders);
		this.queries.set(reference, query);
		return reference;
	}

	createEqualityOperator<A extends Value>(): OperatorReference<EqualityOperator<A>> {
		let reference = new OperatorReference();
		let operator = new EqualityOperator();
		this.operators.set(reference, operator);
		return reference;
	}

	createDecreasingOrder<A extends Value>(): OrderReference<DecreasingOrder<A>> {
		let reference = new OrderReference();
		let order = new DecreasingOrder();
		this.orders.set(reference, order);
		return reference;
	}

	createIncreasingOrder<A extends Value>(): OrderReference<IncreasingOrder<A>> {
		let reference = new OrderReference();
		let order = new IncreasingOrder();
		this.orders.set(reference, order);
		return reference;
	}

	createTransactionManager<A extends StoreReferences<any>, B extends LinkReferences<any>, C extends QueryReferences<any>>(path: string, storeReferences?: A, linkReferences?: B, queryReferences?: C): TransactionManager<DatabaseStoresFromStorManagers<StoreManagersFromStores<StoresFromStoreReferences<A>>>, DatabaseLinksFromLinkManagers<LinkManagersFromLinks<LinksFromLinkReferences<B>>>, DatabaseQueriesFromQueryManagers<QueryManagersFromQueries<QueriesFromQueryReferences<C>>>> {
		let file = this.createFile(path);
		let blockManager = new BlockManager(file);
		let stores = {} as StoresFromStoreReferences<A>;
		for (let key in storeReferences) {
			stores[key] = this.getStore(storeReferences[key]) as StoresFromStoreReferences<A>[keyof A];
		}
		let links = {} as LinksFromLinkReferences<B>;
		for (let key in linkReferences) {
			links[key] = this.getLink(linkReferences[key]) as LinksFromLinkReferences<B>[keyof B];
		}
		let queries = {} as QueriesFromQueryReferences<C>;
		for (let key in queryReferences) {
			queries[key] = this.getQuery(queryReferences[key]) as QueriesFromQueryReferences<C>[keyof C];
		}
		let schemaManager = new SchemaManager();
		let database = new Database(stores, links, queries);
		let databaseManager = schemaManager.createDatabaseManager(file, blockManager, database);
		let databaseStores = databaseManager.createDatabaseStores();
		let databaseLinks = databaseManager.createDatabaseLinks();
		let databaseQueries = databaseManager.createDatabaseQueries();
		let transactionManager = new TransactionManager(file, databaseStores, databaseLinks, databaseQueries, {
			onDiscard: () => {
				blockManager.reload();
				databaseManager.reload();
			}
		});
		return transactionManager;
	}
};
