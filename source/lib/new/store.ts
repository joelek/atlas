import * as bedrock from "@joelek/bedrock";
import { StreamIterable } from "../stream";
import { FilterMap } from "./filters";
import { Table } from "./hash";
import { OrderMap } from "./orders";
import { Fields, Record, Keys, KeysRecord, RecordManager, FieldManagers, FieldManager, Key } from "./records";
import { BlockHandler } from "./vfs";

export const StoreSchema = bedrock.codecs.Object.of({
	fieldBids: bedrock.codecs.Record.of(bedrock.codecs.Integer),
	keys: bedrock.codecs.Array.of(bedrock.codecs.String),
	tableBid: bedrock.codecs.Integer,
	indexBids: bedrock.codecs.Record.of(bedrock.codecs.Integer)
});

export type StoreSchema = ReturnType<typeof StoreSchema["decode"]>;

export type Entry<A extends Record> = {
	bid(): number;
	record(): A;
};

export interface ReadableStore<A extends Record, B extends Keys<A>> {
	filter(filters?: FilterMap<A>, orders?: OrderMap<A>): Promise<Iterable<Entry<A>>>;
	length(): Promise<number>;
	lookup(keysRecord: KeysRecord<A, B>): Promise<A>;
};

export type ReadableStores<A> = {
	[B in keyof A]: A[B] extends Store<infer C, infer D> ? ReadableStore<C, D> : never;
};

export interface WritableStore<A extends Record, B extends Keys<A>> extends ReadableStore<A, B> {
	insert(record: A): Promise<void>;
	remove(keysRecord: KeysRecord<A, B>): Promise<void>;
	update(record: A): Promise<void>;
};

export type WritableStores<A> = {
	[B in keyof A]: A[B] extends Store<infer C, infer D> ? WritableStore<C, D> : never;
};

export class WritableStoreManager<A extends Record, B extends Keys<A>> implements WritableStore<A, B> {
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
export class StoreManager<A extends Record, B extends Keys<A>> {
	private blockHandler: BlockHandler;
	private bid: number;
	private fieldManagers: FieldManagers<A>;
	private keys: [...B];
	private recordManager: RecordManager<A>;
	private table: Table;

	private delete(): void {
		for (let entry of this) {
			this.blockHandler.deleteBlock(entry.bid());
		}
		for (let key in this.fieldManagers) {
			this.fieldManagers[key].delete();
		}
		this.table.delete();
		this.blockHandler.deleteBlock(this.bid);
	}

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

	private saveSchema(): void {
		let fieldBids = {} as StoreSchema["fieldBids"];
		for (let key in this.fieldManagers) {
			fieldBids[key] = this.fieldManagers[key].getBid();
		}
		let keys = this.keys;
		let tableBid = this.table.getBid();
		let indexBids = {} as StoreSchema["indexBids"];
		let schema: StoreSchema = {
			fieldBids,
			keys,
			tableBid,
			indexBids
		};
		let buffer = StoreSchema.encode(schema);
		this.blockHandler.resizeBlock(this.bid, buffer.length);
		this.blockHandler.writeBlock(this.bid, buffer);
	}

	constructor(blockHandler: BlockHandler, bid: number, fieldManagers: FieldManagers<A>, keys: [...B], table: Table) {
		this.blockHandler = blockHandler;
		this.bid = bid;
		this.fieldManagers = fieldManagers;
		this.keys = keys;
		this.recordManager = new RecordManager(fieldManagers);
		this.table = table;
	}

	* [Symbol.iterator](): Iterator<Entry<A>> {
		yield * this.filter();
	}

	getBid(): number {
		return this.bid;
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

	static compareFields(oldFields: FieldManagers<any>, newFields: Fields<any>): { create: Array<Key<any>>, remove: Array<Key<any>>, update: Array<Key<any>>, equal: boolean } {
		let create = [] as Array<Key<any>>;
		let remove = [] as Array<Key<any>>;
		let update = [] as Array<Key<any>>;
		for (let key in newFields) {
			if (oldFields[key] == null) {
				create.push(key);
			}
		}
		for (let key in oldFields) {
			if (newFields[key] == null) {
				remove.push(key);
			}
		}
		for (let key in newFields) {
			if (oldFields[key] != null) {
				if (!newFields[key].isCompatibleWith(oldFields[key])) {
					update.push(key);
				}
			}
		}
		let equal = create.length === 0 && remove.length === 0 && update.length === 0;
		return {
			create,
			remove,
			update,
			equal
		};
	}

	static compareIndices(oldIndices: Array<Keys<any>>, newIndices: Array<Keys<any>>): { create: Array<Keys<any>>, remove: Array<Keys<any>>, equal: boolean } {
		let create = [] as Array<Keys<any>>;
		let remove = [] as Array<Keys<any>>;
		newIndices: for (let newIndex of newIndices) {
			oldIndices: for (let oldIndex of oldIndices) {
				if (this.compareKeys(oldIndex, newIndex)) {
					continue newIndices;
				}
			}
			create.push(newIndex);
		}
		oldIndices: for (let oldIndex of oldIndices) {
			newIndices: for (let newIndex of newIndices) {
				if (this.compareKeys(oldIndex, newIndex)) {
					continue oldIndices;
				}
			}
			remove.push(oldIndex);
		}
		let equal = create.length === 0 && remove.length === 0;
		return {
			create,
			remove,
			equal
		};
	}

	static compareKeys(oldKeys: Keys<any>, newKeys: Keys<any>): { equal: boolean } {
		if (oldKeys.length !== newKeys.length) {
			return { equal: false };
		}
		for (let i = 0; i < oldKeys.length; i++) {
			if (oldKeys[i] !== newKeys[i]) {
				return { equal: false };
			}
		}
		return { equal: true };
	}

	static migrate<A extends Record, B extends Keys<A>>(oldManager: StoreManager<any, any>, options: {
		fields: Fields<A>,
		keys: [...B],
		indices: Array<Keys<A>>
	}): StoreManager<A, B> {
		let keyComparison = StoreManager.compareKeys(oldManager.keys, options.keys);
		let fieldComparison = StoreManager.compareFields(oldManager.fieldManagers, options.fields);
		if (keyComparison.equal && fieldComparison.equal) {
			let indexComparison = StoreManager.compareIndices([], options.indices);
			// TODO: Handle migration of indices.
			return oldManager;
		} else {
			let newManager = StoreManager.construct(oldManager.blockHandler, null, options);
			for (let entry of oldManager) {
				try {
					let oldRecord = entry.record();
					let newRecord = {} as A;
					for (let key in options.fields) {
						newRecord[key] = options.fields[key].convertValue(oldRecord[key]);
					}
					newManager.insert(newRecord);
				} catch (error) {}
			}
			let bid = oldManager.bid; oldManager.bid = newManager.bid; newManager.bid = bid;
			oldManager.delete();
			newManager.saveSchema();
			return newManager;
		}
	}

	static construct<A extends Record, B extends Keys<A>>(blockHandler: BlockHandler, bid: number | null, options?: {
		fields: Fields<A>,
		keys: [...B],
		indices: Array<Keys<A>>
	}): StoreManager<A, B> {
		if (bid == null) {
			if (options == null) {
				return StoreManager.construct<any, any>(blockHandler, null, {
					fields: {},
					keys: [],
					indices: []
				});
			} else {
				let fieldManagers = {} as FieldManagers<A>;
				for (let key in options.fields) {
					fieldManagers[key] = options.fields[key].createManager(blockHandler, null);
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
				bid = blockHandler.createBlock(64);
				let manager = new StoreManager(blockHandler, bid, fieldManagers, keys, storage);
				manager.saveSchema();
				return manager;
			}
		} else {
			if (options == null) {
				let schema = StoreSchema.decode(blockHandler.readBlock(bid));
				let fieldManagers = {} as FieldManagers<A>;
				for (let key in schema.fieldBids) {
					fieldManagers[key as keyof A] = FieldManager.construct(blockHandler, schema.fieldBids[key]);
				}
				let keys = schema.keys as [...B];
				let recordManager = new RecordManager(fieldManagers);
				let storage = new Table(blockHandler, {
					getKeyFromValue: (value) => {
						let buffer = blockHandler.readBlock(value);
						let record = recordManager.decode(buffer);
						return recordManager.encodeKeys(keys, record);
					}
				}, {
					bid: schema.tableBid
				});
				let manager = new StoreManager(blockHandler, bid, fieldManagers, keys, storage);
				return manager;
			} else {
				return StoreManager.migrate(StoreManager.construct(blockHandler, bid), options);
			}
		}
	}
};

export type StoreManagers<A> = {
	[B in keyof A]: A[B] extends Store<infer C, infer D> ? StoreManager<C, D> : never;
};

export class StoreReference<A extends Record, B extends Keys<A>> {
	private StoreReference!: "StoreReference";
};

export type StoreReferences<A> = {
	[B in keyof A]: A[B] extends StoreReference<infer C, infer D> ? StoreReference<C, D> : never;
};

export class Store<A extends Record, B extends Keys<A>> {
	fields: Fields<A>;
	keys: [...B];
	indices: Array<Keys<A>>;

	constructor(fields: Fields<A>, keys: [...B], indices: Array<Keys<A>>) {
		this.fields = fields;
		this.keys = keys;
		this.indices = indices;
	}

	createManager(blockHandler: BlockHandler, bid: number | null): StoreManager<A, B> {
		return StoreManager.construct(blockHandler, bid, {
			fields: this.fields,
			keys: this.keys,
			indices: this.indices
		});
	}
};

export type Stores<A> = {
	[B in keyof A]: A[B] extends StoreReference<infer C, infer D> ? Store<C, D> : never;
};
