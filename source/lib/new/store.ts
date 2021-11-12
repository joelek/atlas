import * as bedrock from "@joelek/bedrock";
import { StreamIterable } from "../stream";
import { FilterMap } from "./filters";
import { Table } from "./hash";
import { OrderMap } from "./orders";
import { Fields, Record, Keys, KeysRecord, RecordManager, FieldManagers, AllocatedFields, AllocatedField } from "./records";
import { BlockHandler } from "./vfs";

export const StoreSchema = bedrock.codecs.Object.of({
	fieldBids: bedrock.codecs.Record.of(bedrock.codecs.Integer),
	keys: bedrock.codecs.Array.of(bedrock.codecs.String),
	storageBid: bedrock.codecs.Integer
});

export type StoreSchema = ReturnType<typeof StoreSchema["decode"]>;

export class Store<A extends Record, B extends Keys<A>> {
	private fields: Fields<A>;
	private keys: [...B];

	constructor(fields: Fields<A>, keys: [...B]) {
		this.fields = fields;
		this.keys = keys;
	}

	allocate(blockHandler: BlockHandler): AllocatedStore<A, B> {
		let allocatedFields = {} as AllocatedFields<A>;
		for (let key in this.fields) {
			allocatedFields[key] = this.fields[key].allocate(blockHandler);
		}
		let fieldBids = {} as StoreSchema["fieldBids"];
		for (let key in allocatedFields) {
			fieldBids[key] = allocatedFields[key].getBid();
		}
		let keys = this.keys;
		let storageBid = blockHandler.createBlock(Table.LENGTH);
		let schema: StoreSchema = {
			fieldBids,
			keys,
			storageBid
		};
		let buffer = StoreSchema.encode(schema);
		let bid = blockHandler.createBlock(buffer.length);
		blockHandler.writeBlock(bid, buffer);
		return new AllocatedStore(allocatedFields, keys, blockHandler, bid, storageBid);
	}
};

export class AllocatedStore<A extends Record, B extends Keys<A>> {
	private allocatedFields: AllocatedFields<A>;
	private keys: [...B];
	private blockHandler: BlockHandler;
	private bid: number;
	private storageBid: number;

	constructor(allocatedFields: AllocatedFields<A>, keys: [...B], blockHandler: BlockHandler, bid: number, storageBid: number) {
		this.allocatedFields = allocatedFields;
		this.keys = keys;
		this.blockHandler = blockHandler;
		this.bid = bid;
		this.storageBid = storageBid;
	}

	createManager(): StoreManager<A, B> {
		let fieldManagers = {} as FieldManagers<A>;
		for (let key in this.allocatedFields) {
			fieldManagers[key] = this.allocatedFields[key].createManager();
		}
		return new StoreManager(fieldManagers, this.keys, this.blockHandler, this.storageBid);
	}

	deallocate(): void {
		for (let key in this.allocatedFields) {
			this.allocatedFields[key].deallocate();
		}
		this.blockHandler.deleteBlock(this.storageBid); // TODO: Let table handle deletion.
		this.blockHandler.deleteBlock(this.bid);
	}

	getBid(): number {
		return this.bid;
	}

	migrateData<C extends Record, D extends Keys<C>>(that: AllocatedStore<C, D>): AllocatedStore<C, D> {
		if (this.bid !== that.bid) {
			let thisManager = this.createManager();
			let thatManager = that.createManager();
			if (this.requiresDataMigration(that)) {
				for (let entry of thisManager.filter()) {
					let thisRecord = entry.record();
					let thatRecord = {} as C;
					for (let thatKey in that.allocatedFields) {
						let thatField = that.allocatedFields[thatKey];
						let thisValue = thisRecord[thatKey];
						let thatValue = thatField.migrateData(thisValue);
						thatRecord[thatKey] = thatValue;
					}
					thatManager.insert(thatRecord);
				}
			} else {
				let storageBid = that.storageBid; that.storageBid = this.storageBid; this.storageBid = storageBid;
			}
			this.deallocate();
		}
		return that;
	}

	requiresDataMigration<C extends Record, D extends Keys<C>>(that: AllocatedStore<C, D>): boolean {
		if (this.keys.length !== that.keys.length) {
			return true;
		}
		for (let i = 0; i < this.keys.length; i++) {
			if (this.keys[i] !== that.keys[i]) {
				return true;
			}
		}
		for (let thisKey in this.allocatedFields) {
			let thatField = that.allocatedFields[thisKey];
			if (thatField == null) {
				return true;
			}
		}
		for (let thatKey in that.allocatedFields) {
			let thatField = that.allocatedFields[thatKey];
			let thisField = this.allocatedFields[thatKey];
			if (thisField == null) {
				return true;
			}
			if (thisField.requiresDataMigration(thatField)) {
				return true;
			}
		}
		return false;
	}

	static loadFromBid(blockHandler: BlockHandler, bid: number): AllocatedStore<any, any> {
		let schema = StoreSchema.decode(blockHandler.readBlock(bid));
		let allocatedFields = {} as AllocatedFields<any>;
		let keys = schema.keys;
		for (let key in schema.fieldBids) {
			let bid = schema.fieldBids[key];
			allocatedFields[key] = AllocatedField.loadFromBid(blockHandler, bid);
		}
		let storageBid = schema.storageBid;
		return new AllocatedStore(allocatedFields, keys, blockHandler, bid, storageBid);
	}
};















export type Entry<A extends Record> = {
	bid(): number;
	record(): A;
};

export class StoreManager<A extends Record, B extends Keys<A>> {
	private fieldManagers: FieldManagers<A>;
	private keys: [...B];
	private blockHandler: BlockHandler;
	private recordCodec: RecordManager<A>;
	private storage: Table;

	// constructor(blockManager: BlockManager, recordManager: RecordManager<A, B>, storageManager: StorageManager)
	constructor(fieldManagers: FieldManagers<A>, keys: [...B], blockHandler: BlockHandler, storageBid: number) {
		this.fieldManagers = fieldManagers;
		this.keys = keys;
		this.blockHandler = blockHandler;
		this.recordCodec = new RecordManager(fieldManagers);
		this.storage = new Table(blockHandler, {
			getKeyFromValue: (value) => {
				let buffer = this.blockHandler.readBlock(value);
				let record = this.recordCodec.decode(buffer);
				return this.recordCodec.encodeKeys(this.keys, record);
			}
		}, {
			bid: storageBid
		});
	}

	private filterIterable(iterable: Iterable<number>, filters: FilterMap<A>, orders: OrderMap<A>): Iterable<Entry<A>> {
		let bids = StreamIterable.of(iterable)
			.collect();
		let entries = StreamIterable.of(bids)
			.map((bid) => {
				let buffer = this.blockHandler.readBlock(bid);
				let record = this.recordCodec.decode(buffer);
				return {
					bid: () => bid,
					record: () => record
				};
			});
		if (Object.keys(filters).length > 0) {
			entries = entries.filter((entry) => {
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
			});
		}
		if (Object.keys(orders).length > 0) {
			entries = entries
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
		return entries;
	}

	[Symbol.iterator](): Iterable<Entry<A>> {
		return this.filter();
	}

	filter(filters?: FilterMap<A>, orders?: OrderMap<A>): Iterable<Entry<A>> {
		// TODO: Use indices.
		let filtersRemaining = { ...filters } as FilterMap<A>;
		let ordersRemaining = { ...orders } as OrderMap<A>;
		let iterable = StreamIterable.of(this.storage)
			.map((entry) => entry.value());
		return this.filterIterable(iterable, filtersRemaining, ordersRemaining);
	}

	insert(record: A): void {
		let key = this.recordCodec.encodeKeys(this.keys, record);
		let encoded = this.recordCodec.encode(record);
		let index = this.storage.lookup(key);
		if (index == null) {
			index = this.blockHandler.createBlock(encoded.length);
			this.blockHandler.writeBlock(index, encoded);
			this.storage.insert(key, index);
		} else {
			let buffer = this.blockHandler.readBlock(index);
			let oldRecord = this.recordCodec.decode(buffer);
			this.blockHandler.resizeBlock(index, encoded.length);
			this.blockHandler.writeBlock(index, encoded);
			// TODO: Remove old record from indices.
		}
		// TODO: Insert record into indices.
	}

	length(): number {
		return this.storage.length();
	}

	lookup(keysRecord: KeysRecord<A, B>): A {
		let key = this.recordCodec.encodeKeys(this.keys, keysRecord);
		let index = this.storage.lookup(key);
		if (index == null) {
			throw `Expected a matching record for key ${keysRecord}!`;
		}
		let buffer = this.blockHandler.readBlock(index);
		let record = this.recordCodec.decode(buffer);
		return record;
	}

	remove(keysRecord: KeysRecord<A, B>): void {
		let key = this.recordCodec.encodeKeys(this.keys, keysRecord);
		let index = this.storage.lookup(key);
		if (index != null) {
			let buffer = this.blockHandler.readBlock(index);
			let oldRecord = this.recordCodec.decode(buffer);
			this.storage.remove(key);
			this.blockHandler.deleteBlock(index);
			// TODO: Remove old record from indices.
		}
	}
};
