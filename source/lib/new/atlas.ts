import * as bedrock from "@joelek/bedrock";
import { CachedFile, DurableFile, File, PhysicalFile } from "./files";
import { BlockHandler } from "./vfs";
import { Table } from "./hash";
import { StreamIterable } from "../stream";

export type Value = Uint8Array | bigint | boolean | null | number | string;
export type Key<A> = keyof A & string;
export type Keys<A> = Array<Key<A>>;
export type KeysRecord<A extends Fields<A>, B extends Keys<A>> = Record<A | Pick<A, B[number]>>;
export type KeysRecordMap<A extends Fields<A>, B extends Keys<A>, C extends Fields<C>> = {
	[D in B[number]]: {
		[E in keyof C]: A[D] extends C[E] ? E : never;
	}[keyof C];
};

export class RecordEncoder<A extends Fields<A>> {
	private fields: A;
	private keys: Keys<A>;
	private codec: bedrock.codecs.TupleCodec<Array<Value>>;

	constructor(fields: A) {
		this.fields = fields;
		this.keys = globalThis.Object.keys(fields).sort() as Keys<A>;
		this.codec = bedrock.codecs.Tuple.of(...this.keys.map((key) => fields[key].getCodec()));
	}

	decode(buffer: Uint8Array): Record<A> {
		let values = this.codec.decode(buffer);
		let record = {} as Record<A>;
		for (let [index, key] of this.keys.entries()) {
			record[key] = values[index] as any;
		}
		return record;
	}

	encode(record: Record<A>): Uint8Array {
		let values = this.keys.map((key) => record[key]);
		let buffer = this.codec.encode(values);
		return buffer;
	}

	decodeKeys<B extends Keys<A>>(keys: [...B], buffers: Array<Uint8Array>): Record<Pick<A, B[number]>> {
		let record = {} as Record<Pick<A, B[number]>>;
		for (let [index, key] of keys.entries()) {
			record[key] = this.fields[key].getCodec().decodePayload(buffers[index]) as any;
		}
		return record;
	}

	encodeKeys<B extends Keys<A>>(keys: [...B], record: Record<Pick<A, B[number]>>): Array<Uint8Array> {
		let buffers = keys.map((key) => this.fields[key].getCodec().encodePayload(record[key]));
		return buffers;
	}
};


























export abstract class Filter<A extends Value> {
	constructor() {}

	abstract matches(value: A): boolean;
};

export class EqualityFilter<A extends Value> extends Filter<A> {
	private value: A;

	constructor(value: A) {
		super();
		this.value = value;
	}

	getValue(): A {
		return this.value;
	}

	matches(value: A): boolean {
		throw `TODO`;
	}
};

export type FilterMap<A extends Fields<A>> = {
	[C in keyof A]?: A[C] extends Field<infer D> ? Filter<D> : never;
};
























export abstract class Order<A extends Value> {
	constructor() {}

	abstract compare(one: A, two: A): number;
};

export class IncreasingOrder<A extends Value> extends Order<A> {
	constructor() {
		super();
	}

	compare(one: A, two: A): number {
		let oneEncoded = bedrock.codecs.Any.encodePayload(one);
		let twoEncoded = bedrock.codecs.Any.encodePayload(two);
		return bedrock.utils.Chunk.comparePrefixes(oneEncoded, twoEncoded);
	}
}

export class DecreasingOrder<A extends Value> extends Order<A> {
	constructor() {
		super();
	}

	compare(one: A, two: A): number {
		let oneEncoded = bedrock.codecs.Any.encodePayload(one);
		let twoEncoded = bedrock.codecs.Any.encodePayload(two);
		return bedrock.utils.Chunk.comparePrefixes(twoEncoded, oneEncoded);
	}
}

export type OrderMap<A extends Fields<A>> = {
	[C in keyof A]?: A[C] extends Field<infer D> ? Order<D> : never;
};


































export abstract class Field<A extends Value> {
	protected defaultValue: A;
	protected codec: bedrock.codecs.Codec<A>;

	constructor(defaultValue: A, codec: bedrock.codecs.Codec<A>) {
		this.defaultValue = defaultValue;
		this.codec = codec;
	}

	getCodec(): bedrock.codecs.Codec<A> {
		return this.codec;
	}

	abstract isCompatibleWith(that: Field<any>): boolean;
};

export type Fields<A extends Fields<A>> = {
	[B in keyof A]: A[B] extends Field<infer C> ? Field<C> : never;
};

export type Record<A extends Fields<A>> = {
	[B in keyof A]: A[B] extends Field<infer C> ? C : never;
};

const BinaryFieldSchema = bedrock.codecs.Object.of({
	type: bedrock.codecs.StringLiteral.of("binary")
});

type BinaryFieldSchema = ReturnType<typeof BinaryFieldSchema["decode"]>;

export class BinaryField extends Field<Uint8Array> {
	constructor(schema: BinaryFieldSchema) {
		super(Uint8Array.of(), bedrock.codecs.Binary);
	}

	isCompatibleWith(that: Field<any>): boolean {
		return that instanceof BinaryField;
	}
};

const StringFieldSchema = bedrock.codecs.Object.of({
	type: bedrock.codecs.StringLiteral.of("string")
});

type StringFieldSchema = ReturnType<typeof StringFieldSchema["decode"]>;

export class StringField extends Field<string> {
	constructor(schema: StringFieldSchema) {
		super("", bedrock.codecs.String);
	}

	isCompatibleWith(that: Field<any>): boolean {
		return that instanceof StringField;
	}
};















































































export class Store<A extends Fields<A>, B extends Keys<A>> {
	private fields: A;
	private keys: [...B];

	constructor(fields: A, keys: [...B]) {
		this.fields = fields;
		this.keys = keys;
	}

	async migrateHandler(handler: StoreHandler<any, any>): Promise<StoreHandler<A, B>> {
		return handler.migrate(this.fields, this.keys);
	}
};

export type Stores<A extends Stores<A>> = {
	[B in keyof A]: A[B] extends Store<infer C, infer D> ? Store<C, D> : never;
};

export const StoreSchema = bedrock.codecs.Object.of({
	fields: bedrock.codecs.Record.of(bedrock.codecs.Number),
	keys: bedrock.codecs.Array.of(bedrock.codecs.String),
	storage: bedrock.codecs.Union.of(bedrock.codecs.Number, bedrock.codecs.Null)
});

export type StoreSchema = ReturnType<typeof StoreSchema["decode"]>;

export type StoreEntry<A extends Fields<A>> = {
	bid(): number;
	record(): Record<A>;
};

export class StoreHandler<A extends Fields<A>, B extends Keys<A>> {
	private blockHandler: BlockHandler;
	private bid: number;
	private fields: A;
	private keys: [...B];
	private recordHandler: RecordEncoder<A>;
	private storage: Table;

	constructor(blockHandler: BlockHandler, bid?: number) {
		if (bid == null) {
			let buffer = StoreSchema.encode({
				fields: {},
				keys: [],
				storage: null
			});
			bid = blockHandler.createBlock(buffer.length);
			blockHandler.writeBlock(bid, buffer);
		}
		let schema = StoreSchema.decode(blockHandler.readBlock(bid));
		let fields = {} as A;
		for (let key in schema.fields) {
			fields[key as keyof A] = Field.construct(blockHandler, schema.fields[key]) as any;
		}
		let keys = schema.keys as [...B];
		this.blockHandler = blockHandler;
		this.bid = bid;
		this.fields = fields;
		this.keys = keys;
		this.recordHandler = new RecordEncoder(fields);
		this.storage = new Table(blockHandler, {
			getKeyFromValue: (value) => {
				let buffer = this.blockHandler.readBlock(value);
				let record = this.recordHandler.decode(buffer);
				return this.recordHandler.encodeKeys(this.keys, record);
			}
		}, {
			bid: schema.storage ?? undefined
		});
		this.saveSchema();
	}

	filter(filters?: FilterMap<A>, orders?: OrderMap<A>, anchor?: KeysRecord<A, B>): Iterable<StoreEntry<A>> {
		// TODO: Use indices.
		let filtersRemaining = { ...filters } as FilterMap<A>;
		let ordersRemaining = { ...orders } as OrderMap<A>;
		let bids = StreamIterable.of(this.storage)
			.map((entry) => entry.value())
			.collect();
		let entries = StreamIterable.of(bids)
			.map((bid) => {
				let buffer = this.blockHandler.readBlock(bid);
				let record = this.recordHandler.decode(buffer);
				return {
					bid: () => bid,
					record: () => record
				};
			});
		if (Object.keys(filtersRemaining).length > 0) {
			entries = entries.filter((entry) => {
				for (let key in filtersRemaining) {
					let filter = filtersRemaining[key];
					if (filter == null) {
						continue;
					}
					let value = entry.record()[key];
					if (!filter.matches(value)) {
						return false;
					}
				}
				return true;
			});
		}
		if (Object.keys(ordersRemaining).length > 0) {
			entries = entries
				.sort((one, two) => {
					for (let key in ordersRemaining) {
						let order = ordersRemaining[key];
						if (order == null) {
							continue;
						}
						let comparison = order.compare(one.record()[key], two.record()[key]);
						if (comparison !== 0) {
							return comparison;
						}
					}
					return 0;
				});
		}
		return entries;
	}

	insert(record: Record<A>): void {
		let encoded = this.recordHandler.encode(record);
		let key = this.recordHandler.encodeKeys(this.keys, record);
		let bid = this.storage.lookup(key);
		if (bid == null) {
			bid = this.blockHandler.createBlock(encoded.length);
			this.blockHandler.writeBlock(bid, encoded);
			this.storage.insert(key, bid);
		} else {
			let buffer = this.blockHandler.readBlock(bid);
			let oldRecord = this.recordHandler.decode(buffer);
			this.blockHandler.resizeBlock(bid, encoded.length);
			this.blockHandler.writeBlock(bid, encoded);
			// TODO: Remove old record from indices.
		}
		// TODO: Insert record into indices.
	}

	length(): number {
		return this.storage.length();
	}

	lookup(keysRecord: KeysRecord<A, B>): Record<A> {
		let key = this.recordHandler.encodeKeys(this.keys, keysRecord);
		let bid = this.storage.lookup(key);
		if (bid == null) {
			throw `Expected a matching record for key ${keysRecord}!`;
		}
		let buffer = this.blockHandler.readBlock(bid);
		let record = this.recordHandler.decode(buffer);
		return record;
	}

	remove(keysRecord: KeysRecord<A, B>): void {
		let key = this.recordHandler.encodeKeys(this.keys, keysRecord);
		let bid = this.storage.lookup(key);
		if (bid != null) {
			let buffer = this.blockHandler.readBlock(bid);
			let oldRecord = this.recordHandler.decode(buffer);
			this.storage.remove(key);
			this.blockHandler.deleteBlock(bid);
			// TODO: Remove old record from indices.
		}
	}

	destroy(): void {
		throw `Unimplemented!`;
	}

	getBid(): number {
		return this.bid;
	}

/*
migration is easy when there are 0 records in the store, just update the schema

record migration is done when:
	a) primary keys change
			because the mapping between a key and a block breaks
	b) field is added
			because the new schema must be able to decode the record
	c) field is removed
			because the new schema must be able to decode the record
			there is junk in the db that needs to be removed
	d) field changes type
			because the new schema must be able to decode the record
			conversion is done if possible, "0" => 0, 0 => "0" (transitive)
	e) field is made non-nullable
			because the new schema must be able to decode the record
			conversion is done if possible, null => "", "" => "" (not transitive)


requirement: be able to load store without strict typings

*/

	// called exactly once, after migration or creation => does not belong in class
	migrate<C extends Fields<C>, D extends Keys<C>>(fields: C, keys: [...D]): StoreHandler<C, D> {
		let migrateRecords = false;
		for (let fieldHandlersKey in this.fields) {
			let fieldsKey = fieldHandlersKey as string as keyof C;
			let fieldHandler = this.fields[fieldHandlersKey];
			let field = fields[fieldsKey];
			if (field == null) {
				console.log(`Field "${fieldsKey}" was removed!`);
				migrateRecords = true;
			}
		}
		let fieldHandlers = {} as FieldHandlers<C>;
		for (let fieldsKey in fields) {
			let fieldHandlersKey = fieldsKey as string as keyof A;
			let oldFieldHandler = this.fields[fieldHandlersKey];
			let field = fields[fieldsKey];
			let newFieldHandler = field.createHandler();
			if (oldFieldHandler == null) {
				console.log(`Field "${fieldsKey}" was added!`);
				migrateRecords = true;
			} else {
				if (oldFieldHandler.isCompatibleWith(newFieldHandler)) {
					console.log(`Field "${fieldsKey}" requires migration!`);
					migrateRecords = true;
				}
			}
			fieldHandlers[fieldsKey] = newFieldHandler as any;
		}
		if (this.keys.join("\0") !== keys.join("\0")) {
			console.log(`Keys changed!`);
			migrateRecords = true;
		}
		if (this.length() > 0 && migrateRecords) {
			let that = new StoreHandler(this.blockHandler).migrate(fields, keys);
			for (let oldRecord of this.filter()) {
				that.insert();
			}
			return that;
		} else {
			return this as any;
		}
	}

	// called exactly once, after migration or creation => does not belong in class
	saveSchema(): void {
		let schema: StoreSchema = {
			fields: {},
			keys: this.keys,
			storage: this.storage.getBid()
		};
		for (let key in this.fields) {
			schema.fields[key] = this.fields[key].getBid();
		}
		let buffer = StoreSchema.encode(schema);
		this.blockHandler.resizeBlock(this.bid, buffer.length);
		this.blockHandler.writeBlock(this.bid, buffer);
	}
};

export type StoreHandlers<A extends Stores<A>> = {
	[B in keyof A]: A[B] extends Store<infer C, infer D> ? StoreHandler<C, D> : never;
};











































class Link<A extends Fields<A>, B extends Keys<A>, C extends Fields<C>, D extends Keys<C>> {
	private parent: Store<A, B>;
	private child: Store<C, D>;
	private keys: KeysRecordMap<A, B, C>;
	private orders: OrderMap<C>;

	constructor(parent: Store<A, B>, child: Store<C, D>, keys: KeysRecordMap<A, B, C>, orders: OrderMap<C>) {
		this.parent = parent;
		this.child = child;
		this.keys = keys;
		this.orders = orders;
	}

	migrateHandler(handler: LinkHandler<any, any, any, any>): LinkHandler<A, B, C, D> {
		return handler.migrate(this.parent, this.child, this.keys, this.orders);
	}
};

type Links<A extends Links<A>> = {
	[B in keyof A]: A[B] extends Link<infer C, infer D, infer E, infer F> ? Link<C, D, E, F> : never;
};

const LinkSchema = bedrock.codecs.Object.of({
	parent: bedrock.codecs.String,
	child: bedrock.codecs.String,
	keys: bedrock.codecs.Array.of(bedrock.codecs.String)
});

type LinkSchema = ReturnType<typeof LinkSchema["decode"]>;

export class LinkHandler<A extends Fields<A>, B extends Keys<A>, C extends Fields<C>, D extends Keys<C>> {
	private parent: StoreHandler<A, B>;
	private child: StoreHandler<C, D>;
	private recordKeysMap: KeysRecordMap<A, B, C>;
	private orders: OrderMap<C>;

	constructor(blockHandler: BlockHandler, bid: number) {
		let schema = LinkSchema.decode(blockHandler.readBlock(bid));
	}

	migrate<A extends Fields<A>, B extends Keys<A>, C extends Fields<C>, D extends Keys<C>>(parent: StoreHandler<A, B>, child: StoreHandler<C, D>, recordKeysMap: KeysRecordMap<A, B, C>, orders: OrderMap<C>): LinkHandler<A, B, C, D> {
		throw `TODO`;
	}

	async filter(keysRecord: KeysRecord<A, B>): Promise<Iterable<Record<C>>> {
		let filters = {} as FilterMap<C>;
		for (let key in this.recordKeysMap) {
			let keyOne = key as B[number];
			let keyTwo = this.recordKeysMap[keyOne];
			filters[keyTwo] = new EqualityFilter(keysRecord[keyOne]) as any;
		}
		return StreamIterable.of(this.child.filter(filters))
			.map((entry) => entry.record);
	}

	async lookup(record: KeysRecord<C, D>): Promise<Record<A>> {
		let keysRecord = {} as KeysRecord<A, B>;
		for (let key in this.recordKeysMap) {
			let keyOne = key as B[number];
			let keyTwo = this.recordKeysMap[keyOne];
			keysRecord[keyOne] = record[keyTwo] as any;
		}
		return this.parent.lookup(keysRecord);
	}
};

type LinkHandlers<A extends Links<A>> = {
	[B in keyof A]: A[B] extends Link<infer C, infer D, infer E, infer F> ? LinkHandler<C, D, E, F> : never;
};











































class ReadableStore<A extends Fields<A>, B extends Keys<A>> {
	protected storeHandler: StoreHandler<A, B>;
	protected queue: PromiseQueue;

	constructor(storeHandler: StoreHandler<A, B>, queue: PromiseQueue) {
		this.storeHandler = storeHandler;
		this.queue = queue;
	}

	async filter(...parameters: Parameters<StoreHandler<A, B>["filter"]>): ReturnType<StoreHandler<A, B>["filter"]> {
		return this.queue.enqueue(this.storeHandler.filter(...parameters));
	}

	async length(...parameters: Parameters<StoreHandler<A, B>["length"]>): ReturnType<StoreHandler<A, B>["length"]> {
		return this.queue.enqueue(this.storeHandler.length(...parameters));
	}

	async lookup(...parameters: Parameters<StoreHandler<A, B>["lookup"]>): ReturnType<StoreHandler<A, B>["lookup"]> {
		return this.queue.enqueue(this.storeHandler.lookup(...parameters));
	}
};

type ReadableStores<A extends Stores<A>> = {
	[B in keyof A]: A[B] extends Store<infer C, infer D> ? ReadableStore<C, D> : never;
};

class WritableStore<A extends Fields<A>, B extends Keys<A>> extends ReadableStore<A, B> {
	constructor(storeHandler: StoreHandler<A, B>, queue: PromiseQueue) {
		super(storeHandler, queue);
	}

	async insert(...parameters: Parameters<StoreHandler<A, B>["insert"]>): ReturnType<StoreHandler<A, B>["insert"]> {
		return this.queue.enqueue(this.storeHandler.insert(...parameters));
	}

	async remove(...parameters: Parameters<StoreHandler<A, B>["remove"]>): ReturnType<StoreHandler<A, B>["remove"]> {
		return this.queue.enqueue(this.storeHandler.remove(...parameters));
	}
};

type WritableStores<A extends Stores<A>> = {
	[B in keyof A]: A[B] extends Store<infer C, infer D> ? WritableStore<C, D> : never;
};

class ReadableLink<A extends Fields<A>, B extends Keys<A>, C extends Fields<C>, D extends Keys<C>> {
	protected linkHandler: LinkHandler<A, B, C, D>;
	protected queue: PromiseQueue;

	constructor(link: LinkHandler<A, B, C, D>, queue: PromiseQueue) {
		this.linkHandler = link;
		this.queue = queue;
	}

	async filter(...parameters: Parameters<LinkHandler<A, B, C, D>["filter"]>): ReturnType<LinkHandler<A, B, C, D>["filter"]> {
		return this.queue.enqueue(this.linkHandler.filter(...parameters));
	}

	async lookup(...parameters: Parameters<LinkHandler<A, B, C, D>["lookup"]>): ReturnType<LinkHandler<A, B, C, D>["lookup"]> {
		return this.queue.enqueue(this.linkHandler.lookup(...parameters));
	}
};

type ReadableLinks<A extends Links<A>> = {
	[B in keyof A]: A[B] extends Link<infer C, infer D, infer E, infer F> ? ReadableLink<C, D, E, F> : never;
};

class WritableLink<A extends Fields<A>, B extends Keys<A>, C extends Fields<C>, D extends Keys<C>> extends ReadableLink<A, B, C, D> {
	constructor(linkHandler: LinkHandler<A, B, C, D>, queue: PromiseQueue) {
		super(linkHandler, queue);
	}
};

type WritableLinks<A extends Links<A>> = {
	[B in keyof A]: A[B] extends Link<infer C, infer D, infer E, infer F> ? WritableLink<C, D, E, F> : never;
};

export class Database<A extends Stores<A>, B extends Links<B>> {
	private stores: A;
	private links: B;

	constructor(stores: A, links: B) {
		this.stores = stores;
		this.links = links;
	}

	async migrateHandler(handler: DatabaseHandler<any, any>): Promise<DatabaseHandler<A, B>> {
		return handler.migrate(this.stores, this.links);
	}
};

const DatabaseSchema = bedrock.codecs.Object.of({
	stores: bedrock.codecs.Record.of(bedrock.codecs.Number),
	links: bedrock.codecs.Record.of(
		bedrock.codecs.Object.of({
			parent: bedrock.codecs.String,
			child: bedrock.codecs.String,
			keys: bedrock.codecs.Array.of(bedrock.codecs.String)
		})
	)
});

type DatabaseSchema = ReturnType<typeof DatabaseSchema["decode"]>;

export class DatabaseHandler<A extends Stores<A>, B extends Links<B>> {
	private blockHandler: BlockHandler;
	private bid: number;
	private storeHandlers: StoreHandlers<A>;
	private linkHandlers: LinkHandlers<B>;

	constructor(blockHandler: BlockHandler, bid?: number) {
		if (bid == null) {
			let buffer = DatabaseSchema.encode({
				stores: {},
				links: {}
			});
			bid = blockHandler.createBlock(buffer.length);
			blockHandler.writeBlock(bid, buffer);
		}
		let schema = DatabaseSchema.decode(blockHandler.readBlock(bid));
		let storeHandlers = {} as StoreHandlers<A>;
		for (let key in schema.stores) {
			storeHandlers[key as any as keyof A] = new StoreHandler(blockHandler, schema.stores[key]) as any;
		}
		let linkHandlers = {} as LinkHandlers<B>;
		for (let key in schema.links) {
			linkHandlers[key as any as keyof B] = new LinkHandler(blockHandler, schema.stores[key], {
				getStoreHandler: (name) => {
					let storeHandler = this.storeHandlers[name];

				}
			}) as any;
		}
		this.blockHandler = blockHandler;
		this.bid = bid;
		this.storeHandlers = storeHandlers;
		this.linkHandlers = linkHandlers;
	}

	createReadableLinks(queue: PromiseQueue): ReadableLinks<B> {
		let links = {} as ReadableLinks<B>;
		for (let key in this.linkHandlers) {
			let linkHandler = this.linkHandlers[key];
			let link = new ReadableLink(linkHandler, queue);
			links[key] = link as any;
		}
		return links;
	}

	createWritableLinks(queue: PromiseQueue): WritableLinks<B> {
		let links = {} as WritableLinks<B>;
		for (let key in this.linkHandlers) {
			let linkHandler = this.linkHandlers[key];
			let link = new ReadableLink(linkHandler, queue);
			links[key] = link as any;
		}
		return links;
	}

	createReadableStores(queue: PromiseQueue): ReadableStores<A> {
		let stores = {} as ReadableStores<A>;
		for (let key in this.storeHandlers) {
			let storeHandler = this.storeHandlers[key];
			let store = new ReadableStore(storeHandler, queue);
			stores[key] = store as any;
		}
		return stores;
	}

	createWritableStores(queue: PromiseQueue): WritableStores<A> {
		let stores = {} as WritableStores<A>;
		for (let key in this.storeHandlers) {
			let storeHandler = this.storeHandlers[key];
			let store = new WritableStore(storeHandler, queue); // pass detail to writable
			stores[key] = store as any;
		}
		return stores;
	}

	destroy(): void {
		throw `Unimplemented!`;
	}

	getBid(): number {
		return this.bid;
	}

	async migrate<C extends Stores<C>, D extends Links<D>>(stores: C, links: D): Promise<DatabaseHandler<C, D>> {
		for (let key in this.storeHandlers) {
			if (!(key in stores)) {
				this.storeHandlers[key].destroy();
				delete this.storeHandlers[key];
			}
		}
		for (let key in stores) {
			if (key in this.storeHandlers) {
				this.storeHandlers[key as any as keyof A] = await stores[key].migrateHandler(this.storeHandlers[key as any as keyof A]) as any;
			} else {
				this.storeHandlers[key as any as keyof A] = await stores[key].migrateHandler(new StoreHandler(this.blockHandler)) as any;
			}
		}
		// TODO: Links.
/*
a link may be added
	child store may contain data inconsistent with the link constraints

a link may be removed
	nothing needs to be done

a store may be migrated
	store contents change, new structure is possibly inconsistent with the link constraints

*/
		this.saveSchema();
		return this as any;
	}

	saveSchema(): void {
		let schema: DatabaseSchema = {
			stores: {},
			links: {}
		};
		for (let key in this.storeHandlers) {
			schema.stores[key] = this.storeHandlers[key].getBid();
		}
		for (let key in this.linkHandlers) {
			schema.links[key] = this.linkHandlers[key].getBid();
		}
		let buffer = DatabaseSchema.encode(schema);
		this.blockHandler.resizeBlock(this.bid, buffer.length);
		this.blockHandler.writeBlock(this.bid, buffer);
	}
};














































export class PromiseQueue {
	private lock: Promise<any>;

	constructor() {
		this.lock = Promise.resolve();
	}

	enqueue<A>(operation: Promise<A>): Promise<A> {
		return this.lock = this.lock
			.then(() => operation);
	}

	wait(): Promise<any> {
		return this.lock;
	}
};

export class Manager<A extends Stores<A>, B extends Links<B>> {
	private storage: File;
	private databaseHandler: Promise<DatabaseHandler<A, B>>;
	private readableTransactionLock: Promise<any>;
	private writableTransactionLock: Promise<any>;

	constructor(storage: File, databaseHandler: Promise<DatabaseHandler<A, B>>) {
		this.storage = storage;
		this.databaseHandler = databaseHandler;
		this.readableTransactionLock = Promise.resolve();
		this.writableTransactionLock = Promise.resolve();
	}

	async enqueueReadableTransaction<C>(supplier: (stores: ReadableStores<A>, links: ReadableLinks<B>) => Promise<C>): Promise<C> {
		let databaseHandler = await this.databaseHandler;
		let queue = new PromiseQueue();
		let readableStores = databaseHandler.createReadableStores(queue);
		let readableLinks = databaseHandler.createReadableLinks(queue);
		let transaction = this.readableTransactionLock
			.then(() => supplier(readableStores, readableLinks))
			.then(() => queue.wait());
		this.writableTransactionLock = this.writableTransactionLock
			.then(() => transaction)
			.catch(() => {});
		try {
			let value = await transaction;
			return value;
		} catch (error) {
			throw error;
		}
	}

	async enqueueWritableTransaction<C>(supplier: (stores: WritableStores<A>, links: WritableLinks<B>) => Promise<C>): Promise<C> {
		let databaseHandler = await this.databaseHandler;
		let queue = new PromiseQueue();
		let writableStores = databaseHandler.createWritableStores(queue);
		let writableLinks = databaseHandler.createWritableLinks(queue);
		let transaction = this.writableTransactionLock
			.then(() => supplier(writableStores, writableLinks))
			.then(() => queue.wait());
		this.writableTransactionLock = this.readableTransactionLock = this.writableTransactionLock
			.then(() => transaction)
			.catch(() => {});
		try {
			let value = await transaction;
			this.storage.persist();
			return value;
		} catch (error) {
			this.storage.discard();
			throw error;
		}
	}
};



































export namespace atlas {
	const CACHE_SIZE = 64 * 1024 * 1024;

	export function createLink<A extends Fields<A>, B extends Keys<A>, C extends Fields<C>, D extends Keys<C>>(parent: Store<A, B>, child: Store<C, D>, keys: KeysRecordMap<A, B, C>, orders?: OrderMap<C>): Link<A, B, C, D> {
		return new Link(
			parent,
			child,
			keys,
			{ ...orders }
		);
	};

	export function createStore<A extends Fields<A>, B extends Keys<A>>(fields: A, keys: [...B]): Store<A, B> {
		return new Store(
			fields,
			keys
		);
	};

	export function createManager<A extends Stores<A>, B extends Links<B>>(path: string, stores?: A, links?: B): Manager<A, B> {
		let bin = new PhysicalFile(`${path}.bin`);
		let log = new PhysicalFile(`${path}.log`);
		let storage = new DurableFile(new CachedFile(bin, CACHE_SIZE), new CachedFile(log, CACHE_SIZE));
		let blockHandler = new BlockHandler(storage);
		let database = new Database({ ...stores } as A, { ...links } as B);
		let databaseHandler = database.migrateHandler(new DatabaseHandler(blockHandler, blockHandler.getBlockCount() === 0 ? undefined : 0));
		return new Manager(storage, databaseHandler);
	};

	export function createStringField(): Field<string> {
		return new StringField();
	};

	export function createBinaryField(): Field<Uint8Array> {
		return new BinaryField();
	};

	export function createDecreasingOrder<A extends Value>(): DecreasingOrder<A> {
		return new DecreasingOrder<A>();
	};
};






































let users = atlas.createStore(
	{
		user_id: atlas.createBinaryField(),
		name: atlas.createStringField()
	},
	["user_id"]
);

let posts = atlas.createStore(
	{
		post_id: atlas.createBinaryField(),
		user_id: atlas.createBinaryField(),
		title: atlas.createStringField()
	},
	["post_id"]
);

let userPosts = atlas.createLink(users, posts, {
	user_id: "user_id"
}, {
	title: atlas.createDecreasingOrder()
});

let manager = atlas.createManager("./private/atlas", {
	users,
	posts
}, {
	userPosts
});

manager.enqueueWritableTransaction(async ({ users }, { userPosts }) => {
	let a = await users.insert({
		user_id: Uint8Array.of(1),
		name: ""
	});
	let b = await users.lookup({
		user_id: Uint8Array.of(1)
	});
	let c = await users.length();
	let d = await users.filter();
	let e = await users.remove({
		user_id: Uint8Array.of(1)
	});
	let f = await userPosts.filter({ user_id: Uint8Array.of(1) });
	let g = await userPosts.lookup({ post_id: Uint8Array.of(1) });
});
