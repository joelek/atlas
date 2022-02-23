import { StreamIterable } from "./streams";
import { FilterMap } from "./filters";
import { Table } from "./hash";
import { OrderMap } from "./orders";
import { Fields, Record, Keys, KeysRecord, RecordManager, FieldManagers, RequiredKeys } from "./records";
import { BlockHandler } from "./vfs";

export type Entry<A extends Record> = {
	bid(): number;
	record(): A;
};

export interface ReadableStore<A extends Record, B extends RequiredKeys<A>> {
	filter(filters?: FilterMap<A>, orders?: OrderMap<A>): Promise<Iterable<Entry<A>>>;
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
		return this.storeManager.filter(...parameters);
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

// TODO: Handle indices.
// TODO: Implement interface WritableStore directly.
export class StoreManager<A extends Record, B extends RequiredKeys<A>> {
	private blockHandler: BlockHandler;
	private fieldManagers: FieldManagers<A>;
	private keys: [...B];
	private recordManager: RecordManager<A>;
	private table: Table;

	private filterIterable(bids: Iterable<number>, filters: FilterMap<A>, orders: OrderMap<A>): Iterable<Entry<A>> {
		return StreamIterable.of(bids)
			.map((bid) => {
				let buffer = this.blockHandler.readBlock(bid);
				let record = this.recordManager.decode(buffer);
				return {
					bid: () => bid,
					record: () => record
				};
			})
			.filter((entry) => {
				for (let key in filters) {
					let filter = filters[key];
					if (filter == null) {
						continue;
					}
					let value = entry.record()[key];
					if (!filter.matches(value)) {
						return false;
					}
				}
				return true;
			})
			.sort((one, two) => {
				for (let key in orders) {
					let order = orders[key];
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

	constructor(blockHandler: BlockHandler, fieldManagers: FieldManagers<A>, keys: [...B], table: Table) {
		this.blockHandler = blockHandler;
		this.fieldManagers = fieldManagers;
		this.keys = keys;
		this.recordManager = new RecordManager(fieldManagers);
		this.table = table;
	}

	* [Symbol.iterator](): Iterator<Entry<A>> {
		yield * this.filter();
	}

	delete(): void {
		for (let entry of this) {
			this.blockHandler.deleteBlock(entry.bid());
		}
		this.table.delete();
	}

	filter(filters?: FilterMap<A>, orders?: OrderMap<A>): Iterable<Entry<A>> {
		// TODO: Use indices.
		let filtersRemaining = { ...filters } as FilterMap<A>;
		let ordersRemaining = { ...orders } as OrderMap<A>;
		let iterable = StreamIterable.of(this.table)
			.map((entry) => entry.value());
		return this.filterIterable(iterable, filtersRemaining, ordersRemaining);
	}

	insert(record: A): void {
		let key = this.recordManager.encodeKeys(this.keys, record);
		let encoded = this.recordManager.encode(record);
		let index = this.table.lookup(key);
		if (index == null) {
			index = this.blockHandler.createBlock(encoded.length);
			this.blockHandler.writeBlock(index, encoded);
			this.table.insert(key, index);
		} else {
			let buffer = this.blockHandler.readBlock(index);
			let oldRecord = this.recordManager.decode(buffer);
			this.blockHandler.resizeBlock(index, encoded.length);
			this.blockHandler.writeBlock(index, encoded);
			// TODO: Remove old record from indices.
		}
		// TODO: Insert record into indices.
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
		let buffer = this.blockHandler.readBlock(index);
		let record = this.recordManager.decode(buffer);
		return record;
	}

	remove(keysRecord: KeysRecord<A, B>): void {
		let key = this.recordManager.encodeKeys(this.keys, keysRecord);
		let index = this.table.lookup(key);
		if (index != null) {
			let buffer = this.blockHandler.readBlock(index);
			let oldRecord = this.recordManager.decode(buffer);
			this.table.remove(key);
			this.blockHandler.deleteBlock(index);
			// TODO: Remove old record from indices.
		}
	}

	update(record: A): void {
		return this.insert(record);
	}

	static construct<A extends Record, B extends RequiredKeys<A>>(blockHandler: BlockHandler, options: {
		fields: Fields<A>,
		keys: [...B]
	}): StoreManager<A, B> {
		let fieldManagers = {} as FieldManagers<A>;
		for (let key in options.fields) {
			fieldManagers[key] = options.fields[key].createManager();
		}
		let keys = options.keys;
		let recordManager = new RecordManager(fieldManagers);
		let storage = new Table(blockHandler, {
			getKeyFromValue: (value) => {
				let buffer = blockHandler.readBlock(value);
				let record = recordManager.decode(buffer);
				return recordManager.encodeKeys(keys, record);
			}
		});
		let manager = new StoreManager(blockHandler, fieldManagers, keys, storage);
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
};

export class Store<A extends Record, B extends RequiredKeys<A>> {
	fields: Fields<A>;
	keys: [...B];
	indices: Array<Index<A>>;

	constructor(fields: Fields<A>, keys: [...B]) {
		this.fields = fields;
		this.keys = keys;
		this.indices = [];
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
		return this.overrides.filter?.(...parameters) ?? this.storeManager.filter(...parameters);
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
