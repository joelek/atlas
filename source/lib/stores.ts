import { StreamIterable } from "./streams";
import { EqualityFilter, FilterMap } from "./filters";
import { Table } from "./tables";
import { IncreasingOrder, OrderMap, Orders } from "./orders";
import { Fields, Record, Keys, KeysRecord, RecordManager, RequiredKeys, Key } from "./records";
import { BlockManager } from "./blocks";
import { SubsetOf } from "./inference";
import { Direction, RadixTree } from "./trees";
import { CompositeSorter, NumberSorter } from "../mod/sorters";

export type Entry<A extends Record> = {
	bid(): number;
	record(): A;
};

export interface ReadableStore<A extends Record, B extends RequiredKeys<A>> {
	filter(filters?: FilterMap<A>, orders?: OrderMap<A>): Promise<Iterable<A>>;
	length(): Promise<number>;
	lookup(keysRecord: KeysRecord<A, B>): Promise<A>;
};

export type ReadableStores<A> = {
	[B in keyof A]: A[B] extends ReadableStore<infer C, infer D> ? ReadableStore<C, D> : A[B];
};

export type ReadableStoresFromStores<A extends Stores<any>> = {
	[B in keyof A]: A[B] extends Store<infer C, infer D> ? ReadableStore<C, D> : never;
};

export type StoresFromReadableStores<A extends ReadableStores<any>> = {
	[B in keyof A]: A[B] extends ReadableStore<infer C, infer D> ? Store<C, D> : never;
};

export interface WritableStore<A extends Record, B extends RequiredKeys<A>> extends ReadableStore<A, B> {
	insert(record: A): Promise<void>;
	remove(keysRecord: KeysRecord<A, B>): Promise<void>;
	update(record: A): Promise<void>;
};

export type WritableStores<A> = {
	[B in keyof A]: A[B] extends WritableStore<infer C, infer D> ? WritableStore<C, D> : A[B];
};

export type WritableStoresFromStores<A extends Stores<any>> = {
	[B in keyof A]: A[B] extends Store<infer C, infer D> ? WritableStore<C, D> : never;
};

export type StoresFromWritableStores<A extends WritableStores<any>> = {
	[B in keyof A]: A[B] extends WritableStore<infer C, infer D> ? Store<C, D> : never;
};

export class WritableStoreManager<A extends Record, B extends RequiredKeys<A>> implements WritableStore<A, B> {
	private storeManager: StoreManager<A, B>;

	constructor(storeManager: StoreManager<A, B>) {
		this.storeManager = storeManager;
	}

	async filter(...parameters: Parameters<WritableStore<A, B>["filter"]>): ReturnType<WritableStore<A, B>["filter"]> {
		return StreamIterable.of(this.storeManager.filter(...parameters))
			.map((entry) => {
				return entry.record()
			});
	}

	async insert(...parameters: Parameters<WritableStore<A, B>["insert"]>): ReturnType<WritableStore<A, B>["insert"]> {
		return this.storeManager.insert(...parameters);
	}

	async length(...parameters: Parameters<WritableStore<A, B>["length"]>): ReturnType<WritableStore<A, B>["length"]> {
		return this.storeManager.length(...parameters);
	}

	async lookup(...parameters: Parameters<WritableStore<A, B>["lookup"]>): ReturnType<WritableStore<A, B>["lookup"]> {
		return this.storeManager.lookup(...parameters);
	}

	async remove(...parameters: Parameters<WritableStore<A, B>["remove"]>): ReturnType<WritableStore<A, B>["remove"]> {
		return this.storeManager.remove(...parameters);
	}

	async update(...parameters: Parameters<WritableStore<A, B>["update"]>): ReturnType<WritableStore<A, B>["update"]> {
		return this.storeManager.update(...parameters);
	}
};

export class FilteredStore<A extends Record> {
	private recordManager: RecordManager<A>;
	private blockManager: BlockManager;
	private bids: Iterable<number>;
	private filters: FilterMap<A>;
	private orders: OrderMap<A>;

	constructor(recordManager: RecordManager<A>, blockManager: BlockManager, bids: Iterable<number>, filters?: FilterMap<A>, orders?: OrderMap<A>) {
		this.recordManager = recordManager;
		this.blockManager = blockManager;
		this.bids = bids;
		this.filters = filters ?? {};
		this.orders = orders ?? {};
	}

	* [Symbol.iterator](): Iterator<Entry<A>> {
		let iterable = StreamIterable.of(this.bids)
			.map((bid) => {
				let buffer = this.blockManager.readBlock(bid);
				let record = this.recordManager.decode(buffer);
				return {
					bid,
					record
				};
			})
			.filter((entry) => {
				for (let key in this.filters) {
					let filter = this.filters[key];
					if (filter == null) {
						continue;
					}
					let value = entry.record[key];
					if (!filter.matches(value)) {
						return false;
					}
				}
				return true;
			});
		if (Object.keys(this.orders).length > 0) {
			iterable = iterable.sort((one, two) => {
				for (let key in this.orders) {
					let order = this.orders[key];
					if (order == null) {
						continue;
					}
					let comparison = order.compare(one.record[key], two.record[key]);
					if (comparison !== 0) {
						return comparison;
					}
				}
				return 0;
			});
		}
		yield * iterable.map((entry) => {
			return {
				bid: () => entry.bid,
				record: () => entry.record
			};

		});
	}

	static getOptimal<A extends Record>(filteredStores: Array<FilteredStore<A>>): FilteredStore<A> | undefined {
		filteredStores.sort(CompositeSorter.of<FilteredStore<A>>(
			NumberSorter.decreasing((value) => Object.keys(value.orders).length),
			NumberSorter.decreasing((value) => Object.keys(value.filters).length)
		));
		return filteredStores.pop();
	}
};

export class IndexManager<A extends Record, B extends Keys<A>> {
	private recordManager: RecordManager<A>;
	private blockManager: BlockManager;
	private bid: number;
	private keys: Keys<A>;
	private tree: RadixTree;

	constructor(recordManager: RecordManager<A>, blockManager: BlockManager, keys: Keys<A>, options?: {
		bid?: number
	}) {
		let bid = options?.bid ?? blockManager.createBlock(RadixTree.INITIAL_SIZE);
		this.recordManager = recordManager;
		this.blockManager = blockManager;
		this.bid = bid;
		this.keys = keys;
		this.tree = new RadixTree(blockManager, bid);
	}

	* [Symbol.iterator](): Iterator<Entry<A>> {
		yield * new FilteredStore(this.recordManager, this.blockManager, this.tree, {}, {});
	}

	delete(): void {
		this.tree.delete();
	}

	filter(filters?: FilterMap<A>, orders?: OrderMap<A>): Array<FilteredStore<A>> {
		filters = filters ?? {};
		orders = orders ?? {};
		filters = { ...filters };
		orders = { ...orders };
		let keysConsumed = [] as Keys<A>;
		let keysRemaining = [...this.keys];
		let tree = this.tree;
		for (let indexKey of this.keys) {
			let filter = filters[indexKey];
			if (filter == null) {
				break;
			}
			if (filter instanceof EqualityFilter) {
				let encodedValue = filter.getEncodedValue();
				let branch = tree.branch([encodedValue]);
				if (branch == null) {
					return [];
				}
				delete filters[indexKey];
				keysConsumed.push(keysRemaining.shift() as Key<A>);
				tree = branch;
			}
		}
		let directions = [] as Array<Direction>;
		let orderKeys = Object.keys(orders) as Keys<A>;
		for (let i = 0; i < orderKeys.length; i++) {
			if (keysRemaining[i] !== orderKeys[i]) {
				break;
			}
			let order = orders[orderKeys[i]];
			if (order == null) {
				break;
			}
			directions.push(order.getDirection());
			delete orders[orderKeys[i]];
		}
		let iterable = tree.filter("^=", [], directions);
		return [
			new FilteredStore(this.recordManager, this.blockManager, iterable, filters, orders)
		];
	}

	insert(keysRecord: KeysRecord<A, B>, bid: number): void {
		let keys = this.recordManager.encodeKeys<Keys<A>>(this.keys, keysRecord);
		this.tree.insert(keys, bid);
	}

	remove(keysRecord: KeysRecord<A, B>): void {
		let keys = this.recordManager.encodeKeys<Keys<A>>(this.keys, keysRecord);
		this.tree.remove(keys);
	}
};

export class StoreManager<A extends Record, B extends RequiredKeys<A>> {
	private blockManager: BlockManager;
	private fields: Fields<A>;
	private keys: [...B];
	private orders: OrderMap<A>;
	private recordManager: RecordManager<A>;
	private table: Table;
	private indexManagers: Array<IndexManager<A, Keys<A>>>;

	constructor(blockManager: BlockManager, fields: Fields<A>, keys: [...B], orders: OrderMap<A>, table: Table, indexManagers: Array<IndexManager<A, Keys<A>>>) {
		this.blockManager = blockManager;
		this.fields = fields;
		this.keys = keys;
		this.orders = orders;
		this.recordManager = new RecordManager(fields);
		this.table = table;
		this.indexManagers = indexManagers;
	}

	* [Symbol.iterator](): Iterator<Entry<A>> {
		yield * this.filter();
	}

	delete(): void {
		for (let bid of this.table) {
			this.blockManager.deleteBlock(bid);
		}
		for (let indexManager of this.indexManagers) {
			indexManager.delete();
		}
		this.table.delete();
	}

	* filter(filters?: FilterMap<A>, orders?: OrderMap<A>): Iterable<Entry<A>> {
		orders = orders ?? this.orders;
		for (let key of this.keys) {
			if (!(key in orders)) {
				orders[key] = new IncreasingOrder();
			}
		}
		let filteredStores = this.indexManagers.flatMap((indexManager) => {
			return indexManager.filter(filters, orders);
		});
		filteredStores.push(new FilteredStore(this.recordManager, this.blockManager, this.table, filters, orders));
		let filteredStore = FilteredStore.getOptimal(filteredStores);
		if (filteredStore != null) {
			yield * filteredStore;
		}
	}

	insert(record: A): void {
		let key = this.recordManager.encodeKeys(this.keys, record);
		let encoded = this.recordManager.encode(record);
		let index = this.table.lookup(key);
		if (index == null) {
			index = this.blockManager.createBlock(encoded.length);
			this.blockManager.writeBlock(index, encoded);
			this.table.insert(key, index);
		} else {
			let buffer = this.blockManager.readBlock(index);
			let oldRecord = this.recordManager.decode(buffer);
			this.blockManager.resizeBlock(index, encoded.length);
			this.blockManager.writeBlock(index, encoded);
			for (let indexManager of this.indexManagers) {
				indexManager.remove(oldRecord);
			}
		}
		for (let indexManager of this.indexManagers) {
			indexManager.insert(record, index);
		}
	}

	length(): number {
		return this.table.length();
	}

	lookup(keysRecord: KeysRecord<A, B>): A {
		let key = this.recordManager.encodeKeys(this.keys, keysRecord);
		let index = this.table.lookup(key);
		if (index == null) {
			let key = this.keys.map((key) => keysRecord[key]).join(", ");
			throw `Expected a matching record for key ${key}!`;
		}
		let buffer = this.blockManager.readBlock(index);
		let record = this.recordManager.decode(buffer);
		return record;
	}

	remove(keysRecord: KeysRecord<A, B>): void {
		let key = this.recordManager.encodeKeys(this.keys, keysRecord);
		let index = this.table.lookup(key);
		if (index != null) {
			let buffer = this.blockManager.readBlock(index);
			let oldRecord = this.recordManager.decode(buffer);
			this.table.remove(key);
			this.blockManager.deleteBlock(index);
			for (let indexManager of this.indexManagers) {
				indexManager.remove(oldRecord);
			}
		}
	}

	update(record: A): void {
		return this.insert(record);
	}

	static construct<A extends Record, B extends RequiredKeys<A>, C extends SubsetOf<A, C>>(blockManager: BlockManager, options: {
		fields: Fields<A>,
		keys: [...B],
		orders?: Orders<C>,
		indices?: Array<Index<any>>
	}): StoreManager<A, B> {
		let fields = options.fields;
		let keys = options.keys;
		let orders = options.orders ?? {};
		let indices = options.indices ?? [];
		let recordManager = new RecordManager(fields);
		let storage = new Table(blockManager, {
			getKeyFromValue: (value) => {
				let buffer = blockManager.readBlock(value);
				let record = recordManager.decode(buffer);
				return recordManager.encodeKeys(keys, record);
			}
		});
		let indexManagers = indices.map((index) => new IndexManager<A, Keys<A>>(recordManager, blockManager, index.keys));
		let manager = new StoreManager(blockManager, fields, keys, orders, storage, indexManagers);
		return manager;
	}
};

export type StoreManagers<A> = {
	[B in keyof A]: A[B] extends StoreManager<infer C, infer D> ? StoreManager<C, D> : A[B];
};

export type StoreManagersFromStores<A extends Stores<any>> = {
	[B in keyof A]: A[B] extends Store<infer C, infer D> ? StoreManager<C, D> : never;
};

export type WritableStoresFromStoreManagers<A extends StoreManagers<any>> = {
	[B in keyof A]: A[B] extends StoreManager<infer C, infer D> ? WritableStore<C, D> : never;
};

export class Index<A extends Record> {
	keys: Keys<A>;

	constructor(keys: Keys<A>) {
		this.keys = keys;
	}

	equals(that: Index<A>): boolean {
		if (this.keys.length !== that.keys.length) {
			return false;
		}
		for (let i = 0; i < this.keys.length; i++) {
			if (this.keys[i] !== that.keys[i]) {
				return false;
			}
		}
		return true;
	}
};

export class Store<A extends Record, B extends RequiredKeys<A>> {
	fields: Fields<A>;
	keys: [...B];
	orders: OrderMap<A>;
	indices: Array<Index<A>>;

	constructor(fields: Fields<A>, keys: [...B], orders?: OrderMap<A>) {
		this.fields = fields;
		this.keys = keys;
		this.orders = orders ?? {};
		this.indices = [];
		this.index(this.createIndex());
	}

	createIndex(): Index<A> {
		let keys = [] as Keys<A>;
		for (let key in this.orders) {
			let order = this.orders[key];
			if (order == null) {
				continue;
			}
			if (!keys.includes(key)) {
				keys.push(key);
			}
		}
		for (let key of this.keys) {
			if (!keys.includes(key)) {
				keys.push(key);
			}
		}
		return new Index(keys);
	}

	index(that: Index<A>): void {
		for (let index of this.indices) {
			if (index.equals(that)) {
				return;
			}
		}
		this.indices.push(that);
	}
};

export type Stores<A> = {
	[B in keyof A]: A[B] extends Store<infer C, infer D> ? Store<C, D> : A[B];
};

export class OverridableWritableStore<A extends Record, B extends RequiredKeys<A>> implements WritableStore<A, B> {
	private storeManager: StoreManager<A, B>;
	private overrides: Partial<WritableStore<A, B>>;

	constructor(storeManager: StoreManager<A, B>, overrides: Partial<WritableStore<A, B>>) {
		this.storeManager = storeManager;
		this.overrides = overrides;
	}

	async filter(...parameters: Parameters<WritableStore<A, B>["filter"]>): ReturnType<WritableStore<A, B>["filter"]> {
		return this.overrides.filter?.(...parameters) ?? StreamIterable.of(this.storeManager.filter(...parameters))
			.map((entry) => {
				return entry.record()
			});
	}

	async insert(...parameters: Parameters<WritableStore<A, B>["insert"]>): ReturnType<WritableStore<A, B>["insert"]> {
		return this.overrides.insert?.(...parameters) ?? this.storeManager.insert(...parameters);
	}

	async length(...parameters: Parameters<WritableStore<A, B>["length"]>): ReturnType<WritableStore<A, B>["length"]> {
		return this.overrides.length?.(...parameters) ?? this.storeManager.length(...parameters);
	}

	async lookup(...parameters: Parameters<WritableStore<A, B>["lookup"]>): ReturnType<WritableStore<A, B>["lookup"]> {
		return this.overrides.lookup?.(...parameters) ?? this.storeManager.lookup(...parameters);
	}

	async remove(...parameters: Parameters<WritableStore<A, B>["remove"]>): ReturnType<WritableStore<A, B>["remove"]> {
		return this.overrides.remove?.(...parameters) ?? this.storeManager.remove(...parameters);
	}

	async update(...parameters: Parameters<WritableStore<A, B>["update"]>): ReturnType<WritableStore<A, B>["update"]> {
		return this.overrides.update?.(...parameters) ?? this.storeManager.update(...parameters);
	}
};
