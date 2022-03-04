import { Link, LinkManagersFromLinks, WritableLinksFromLinkManagers } from "./link";
import { Store, StoreManagersFromStores, WritableStoresFromStoreManagers } from "./stores";
import { Record, Fields, KeysRecordMap, BinaryField, BooleanField, StringField, NullableStringField, RequiredKeys, Value, Field, BigIntField, NumberField, IntegerField, NullableBigIntField, NullableBinaryField, NullableBooleanField, NullableIntegerField, NullableNumberField } from "./records";
import { TransactionManager } from "./transaction";
import { DecreasingOrder, IncreasingOrder, Order, OrderMap } from "./orders";
import { CachedFile, DurableFile, File, PhysicalFile, VirtualFile } from "./files";
import { Database, DatabaseManager } from "./database";
import { EqualityOperator, Operator, Operators } from "./operators";
import { SchemaManager } from "./schema";
import { SubsetOf } from "./inference";
import { Query } from "./queries";

export class FileReference {
	private FileReference!: "FileReference";
};

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

export class QueryReference<A extends Record, B extends RequiredKeys<A>, C extends SubsetOf<A, C>> {
	private QueryReference!: "QueryReference";
};

export type QueryReferences<A> = {
	[B in keyof A]: A[B] extends QueryReference<infer C, infer D, infer E> ? QueryReference<C, D, E> : A[B];
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
	private files: Map<FileReference, File>;
	private fields: Map<FieldReference<any>, Field<any>>;
	private links: Map<LinkReference<any, any, any, any, any>, Link<any, any, any, any, any>>;
	private stores: Map<StoreReference<any, any>, Store<any, any>>;
	private queries: Map<QueryReference<any, any, any>, Query<any, any, any>>;
	private operators: Map<OperatorReference<any>, Operator<any>>;
	private orders: Map<OrderReference<any>, Order<any>>;
	private databaseManagers: Map<FileReference, DatabaseManager<any, any>>;

	private getFile(reference: FileReference): File {
		let file = this.files.get(reference);
		if (file == null) {
			throw `Expected file to be defined in context!`;
		}
		return file;
	}

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

	private getQuery<A extends Record, B extends RequiredKeys<A>, C extends SubsetOf<A, C>>(reference: QueryReference<A, B, C>): Query<A, B, C> {
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

	constructor() {
		this.files = new Map();
		this.fields = new Map();
		this.links = new Map();
		this.stores = new Map();
		this.queries = new Map();
		this.operators = new Map();
		this.orders = new Map();
		this.databaseManagers = new Map();
	}

	createBigIntField(): FieldReference<BigIntField> {
		let reference = new FieldReference();
		let field = new BigIntField(0n);
		this.fields.set(reference, field);
		return reference;
	}

	createNullableBigIntField(): FieldReference<NullableBigIntField> {
		let reference = new FieldReference();
		let field = new NullableBigIntField(null);
		this.fields.set(reference, field);
		return reference;
	}

	createBinaryField(): FieldReference<BinaryField> {
		let reference = new FieldReference();
		let field = new BinaryField(Uint8Array.of());
		this.fields.set(reference, field);
		return reference;
	}

	createNullableBinaryField(): FieldReference<NullableBinaryField> {
		let reference = new FieldReference();
		let field = new NullableBinaryField(null);
		this.fields.set(reference, field);
		return reference;
	}

	createBooleanField(): FieldReference<BooleanField> {
		let reference = new FieldReference();
		let field = new BooleanField(false);
		this.fields.set(reference, field);
		return reference;
	}

	createNullableBooleanField(): FieldReference<NullableBooleanField> {
		let reference = new FieldReference();
		let field = new NullableBooleanField(null);
		this.fields.set(reference, field);
		return reference;
	}

	createIntegerField(): FieldReference<IntegerField> {
		let reference = new FieldReference();
		let field = new IntegerField(0);
		this.fields.set(reference, field);
		return reference;
	}

	createNullableIntegerField(): FieldReference<NullableIntegerField> {
		let reference = new FieldReference();
		let field = new NullableIntegerField(null);
		this.fields.set(reference, field);
		return reference;
	}

	createNumberField(): FieldReference<NumberField> {
		let reference = new FieldReference();
		let field = new NumberField(0);
		this.fields.set(reference, field);
		return reference;
	}

	createNullableNumberField(): FieldReference<NullableNumberField> {
		let reference = new FieldReference();
		let field = new NullableNumberField(null);
		this.fields.set(reference, field);
		return reference;
	}

	createStringField(): FieldReference<StringField> {
		let reference = new FieldReference();
		let field = new StringField("");
		this.fields.set(reference, field);
		return reference;
	}

	createNullableStringField(): FieldReference<NullableStringField> {
		let reference = new FieldReference();
		let field = new NullableStringField(null);
		this.fields.set(reference, field);
		return reference;
	}

	createLink<A extends Record, B extends RequiredKeys<A>, C extends Record, D extends RequiredKeys<C>, E extends KeysRecordMap<A, B, C>>(parent: StoreReference<A, B>, child: StoreReference<C, D>, recordKeysMap: E, orderReferences?: Partial<OrderReferences<C>>): LinkReference<A, B, C, D, E> {
		let reference = new LinkReference<A, B, C, D, E>();
		let orders = {} as OrderMap<C>;
		for (let key in orderReferences) {
			let orderReference = orderReferences[key];
			if (orderReference == null) {
				continue;
			}
			orders[key] = this.getOrder(orderReference);
		}
		// TODO: Create indices.
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

	createQuery<A extends Record, B extends RequiredKeys<A>, C extends SubsetOf<A, C>>(storeReference: StoreReference<A, B>, operatorReferences: OperatorReferences<C>): QueryReference<A, B, C> {
		let store = this.getStore(storeReference);
		let operators = {} as Operators<C>;
		for (let key in operatorReferences) {
			operators[key] = this.getOperator(operatorReferences[key]);
		}
		// TODO: Create indices.
		let reference = new QueryReference();
		let query = new Query(store, operators);
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

	createDiskStorage(path: string): FileReference {
		let reference = new FileReference();
		let bin = new CachedFile(new PhysicalFile(`${path}.bin`), 64 * 1024 * 1024);
		let log = new CachedFile(new PhysicalFile(`${path}.log`), 64 * 1024 * 1024);
		let file = new DurableFile(bin, log);
		this.files.set(reference, file);
		return reference;
	}

	createMemoryStorage(): FileReference {
		let reference = new FileReference();
		let file = new VirtualFile(0);
		this.files.set(reference, file);
		return reference;
	}

	createTransactionManager<A extends StoreReferences<any>, B extends LinkReferences<any>>(fileReference: FileReference, storeReferences?: A, linkReferences?: B): TransactionManager<WritableStoresFromStoreManagers<StoreManagersFromStores<StoresFromStoreReferences<A>>>, WritableLinksFromLinkManagers<LinkManagersFromLinks<LinksFromLinkReferences<B>>>> {
		if (this.databaseManagers.has(fileReference)) {
			throw `Expected given storage to not be in use by another database!`;
		}
		storeReferences = storeReferences ?? {} as A;
		linkReferences = linkReferences ?? {} as B;
		let file = this.getFile(fileReference);
		let stores = {} as StoresFromStoreReferences<A>;
		for (let key in storeReferences) {
			stores[key as keyof A] = this.getStore(storeReferences[key]) as StoresFromStoreReferences<A>[keyof A];
		}
		let links = {} as LinksFromLinkReferences<B>;
		for (let key in linkReferences) {
			links[key as keyof B] = this.getLink(linkReferences[key]) as LinksFromLinkReferences<B>[keyof B];
		}
		let schemaManager = new SchemaManager();
		let database = new Database(stores, links);
		let databaseManager = schemaManager.createDatabaseManager(file, database);
		this.databaseManagers.set(fileReference, databaseManager);
		let transactionManager = databaseManager.createTransactionManager(file);
		return transactionManager;
	}
};
