import * as bedrock from "@joelek/bedrock";
import { ConsistencyManager, WritableLinksFromLinkManagers, WritableStoresFromStoreManagers } from "./consistency";
import { File } from "./files";
import { Table } from "./hash";
import { Link, LinkManager, LinkManagers, Links, LinksFromLinkReferences } from "./link";
import { DecreasingOrder, IncreasingOrder, Order, OrderMap } from "./orders";
import { BinaryField, BinaryFieldManager, BooleanField, BooleanFieldManager, Field, FieldManager, FieldManagers, Fields, Key, Keys, KeysRecordMap, NullableStringField, NullableStringFieldManager, RecordManager, StringField, StringFieldManager } from "./records";
import { BinaryFieldSchema, BooleanFieldSchema, DatabaseSchema, DecreasingOrderSchema, FieldSchema, IncreasingOrderSchema, LinkSchema, NullableStringFieldSchema, StoreSchema, StringFieldSchema, OrderSchema, FieldsSchema, IndicesSchema, KeysSchema, IndexSchema, StoresSchema } from "./schema";
import { Index, Store, StoreManager, StoreManagers, Stores, StoresFromStoreReferences } from "./store";
import { TransactionManager } from "./transaction";
import { BlockHandler } from "./vfs";

class Database<A extends Stores, B extends Links> {
	stores: A;
	links: B;

	constructor(stores: A, links: B) {
		this.stores = stores;
		this.links = links;
	}
};

export function isCompatible<V>(codec: bedrock.codecs.Codec<V>, subject: any): subject is V {
	try {
		codec.encode(subject);
		return true;
	} catch (error) {
		return false;
	}
}

export type FieldComparison = boolean;

export type FieldsComparison = {
	fieldsToCreate: Array<Key<any>>;
	fieldsToRemove: Array<Key<any>>;
	fieldsToUpdate: Array<Key<any>>;
};

export type KeysComparison = boolean;

export type IndexComparison = boolean;

export type IndicesComparison = {
	indicesToCreate: Array<Keys<any>>;
	indicesToRemove: Array<Keys<any>>;
};

export type StoreComparison = {
	fields: FieldsComparison;
	keys: KeysComparison;
	indices: IndicesComparison;
};

export type Action = "create" | "remove" | "update";

export type StoresComparison = {
	stores: globalThis.Record<string, StoreComparison>;
	status: Action;
};

export class DatabaseManager<A extends StoreManagers, B extends LinkManagers> {
	private file: File;
	private storeManagers: A;
	private linkManagers: B;

	constructor(file: File, storeManagers: A, linkManagers: B) {
		this.file = file;
		this.storeManagers = storeManagers;
		this.linkManagers = linkManagers;
	}

	createTransactionManager(): TransactionManager<WritableStoresFromStoreManagers<A>, WritableLinksFromLinkManagers<B>> {
		let consistencyManager = new ConsistencyManager(this.storeManagers, this.linkManagers);
		let writableStores = consistencyManager.createWritableStores();
		let writableLinks = consistencyManager.createWritableLinks();
		return new TransactionManager(this.file, writableStores, writableLinks);
	}

	getStoreManager<C extends Key<A>>(key: C): A[C] {
		return this.storeManagers[key];
	}

	getLinkManager<D extends Key<B>>(key: D): B[D] {
		return this.linkManagers[key];
	}
};

export type StoreManagersFromStores<A extends Stores> = {
	[B in keyof A]: A[B] extends Store<infer C, infer D> ? StoreManager<C, D> : never;
};

export type LinkManagersFromLinks<A extends Links> = {
	[B in keyof A]: A[B] extends Link<infer C, infer D, infer E, infer F, infer G> ? LinkManager<C, D, E, F, G> : never;
};

export class SchemaManager {
	constructor() {}

	createFieldManager(blockHandler: BlockHandler, fieldSchema: FieldSchema): FieldManager<any> {
		if (isCompatible(BinaryFieldSchema, fieldSchema)) {
			return new BinaryFieldManager(blockHandler, 1337, fieldSchema.defaultValue);
		}
		if (isCompatible(BooleanFieldSchema, fieldSchema)) {
			return new BooleanFieldManager(blockHandler, 1337, fieldSchema.defaultValue);
		}
		if (isCompatible(StringFieldSchema, fieldSchema)) {
			return new StringFieldManager(blockHandler, 1337, fieldSchema.defaultValue);
		}
		if (isCompatible(NullableStringFieldSchema, fieldSchema)) {
			return new NullableStringFieldManager(blockHandler, 1337, fieldSchema.defaultValue);
		}
		throw `Expected code to be unreachable!`;
	}

	createOrderManager(orderSchema: OrderSchema): Order<any> {
		if (isCompatible(DecreasingOrderSchema, orderSchema)) {
			return new DecreasingOrder();
		}
		if (isCompatible(IncreasingOrderSchema, orderSchema)) {
			return new IncreasingOrder();
		}
		throw `Expected code to be unreachable!`;
	}

	createStoreManager(blockHandler: BlockHandler, storeSchema: StoreSchema): StoreManager<any, any> {
		let fieldManagers = {} as FieldManagers<any>;
		for (let key in storeSchema.fields) {
			fieldManagers[key] = this.createFieldManager(blockHandler, storeSchema.fields[key]);
		}
		let keys = storeSchema.keys as any;
		// TODO: Create index managers.
		let recordManager = new RecordManager(fieldManagers);
		let storage = new Table(blockHandler, {
			getKeyFromValue: (value) => {
				let buffer = blockHandler.readBlock(value);
				let record = recordManager.decode(buffer);
				return recordManager.encodeKeys(keys, record);
			}
		}, {
			bid: storeSchema.storageBid
		});
		return new StoreManager(blockHandler, 1337, fieldManagers, keys, storage);
	}

	createLinkManager(linkSchema: LinkSchema, storeManagers: StoreManagers): LinkManager<any, any, any, any, any> {
		let parent = storeManagers[linkSchema.parent] as StoreManager<any, any> | undefined;
		if (parent == null) {
			throw `Expected store with name "${linkSchema.parent}"!`;
		}
		let child = storeManagers[linkSchema.child] as StoreManager<any, any> | undefined;
		if (child == null) {
			throw `Expected store with name "${linkSchema.child}"!`;
		}
		let recordKeysMap = linkSchema.keys as KeysRecordMap<any, any, any>;
		let orders = {} as OrderMap<any>;
		for (let order of linkSchema.orders) {
			orders[order.key] = this.createOrderManager(order.order);
		}
		return new LinkManager(parent, child, recordKeysMap, orders);
	}

	createDatabaseManager<A extends Stores, B extends Links>(file: File, stores: A, links: B): DatabaseManager<StoreManagersFromStores<A>, LinkManagersFromLinks<B>> {
		let blockHandler = new BlockHandler(file);
		if (blockHandler.getBlockCount() === 0) {
			let databaseSchema: DatabaseSchema = {
				stores: {},
				links: {}
			};
			let buffer = DatabaseSchema.encode(databaseSchema);
			blockHandler.createBlock(buffer.length);
			blockHandler.writeBlock(0, buffer);
		}
		throw `Migration code`;
		let databaseSchema = DatabaseSchema.decode(blockHandler.readBlock(0));
		let storeManagers = {} as StoreManagersFromStores<A>;
		for (let key in databaseSchema.stores) {
			storeManagers[key as keyof A] = this.createStoreManager(blockHandler, databaseSchema.stores[key]) as StoreManagersFromStores<A>[keyof A];
		}
		let linkManagers = {} as LinkManagersFromLinks<B>;
		for (let key in databaseSchema.links) {
			linkManagers[key as keyof B] = this.createLinkManager(databaseSchema.links[key], storeManagers) as  LinkManagersFromLinks<B>[keyof B];
		}
		return new DatabaseManager(file, storeManagers, linkManagers);
	}
/*
a store is dirty when keys or fields change, requires full recreation and migration of data
a link is dirty when the parent or child stores are dirty (keys or fields change) or when the link itself changes
*/
/* 	migrateSchema(): DatabaseManager<StoreManagersFromStores<A>, LinkManagersFromLinks<B>> {
		let databaseSchema = DatabaseSchema.decode(this.blockHandler.readBlock(0));
		let database: Database<any, any> = {
			stores,
			links
		};
		let migratedStores = [] as Array<string>;

		throw `TODO`;
		let buffer = DatabaseSchema.encode(databaseSchema);
		this.blockHandler.resizeBlock(0, buffer.length);
		this.blockHandler.writeBlock(0, buffer);
		return this as unknown as SchemaManager<C, D>;
	}
 */
	static compareField(fieldSchema: FieldSchema, field: Field<any>): FieldComparison {
		if (isCompatible(BinaryFieldSchema, fieldSchema)) {
			if (field instanceof BinaryField) {
				return true;
			}
			return false;
		}
		if (isCompatible(BooleanFieldSchema, fieldSchema)) {
			if (field instanceof BooleanField) {
				return true;
			}
			return false;
		}
		if (isCompatible(StringFieldSchema, fieldSchema)) {
			if (field instanceof StringField) {
				return true;
			}
			if (field instanceof NullableStringField) {
				return true;
			}
			return false;
		}
		if (isCompatible(NullableStringFieldSchema, fieldSchema)) {
			if (field instanceof NullableStringField) {
				return true;
			}
			return false;
		}
		throw `Expected code to be unreachable!`;
	}

	static compareFields(fieldsSchema: FieldsSchema, fields: Fields<any>): FieldsComparison {
		let fieldsToCreate = [] as Array<Key<any>>;
		let fieldsToRemove = [] as Array<Key<any>>;
		let fieldsToUpdate = [] as Array<Key<any>>;
		for (let key in fieldsSchema) {
			if (fields[key] == null) {
				fieldsToRemove.push(key);
			}
		}
		for (let key in fields) {
			if (fieldsSchema[key] == null) {
				fieldsToCreate.push(key);
			} else {
				if (!SchemaManager.compareField(fieldsSchema[key], fields[key])) {
					fieldsToUpdate.push(key);
				}
			}
		}
		return {
			fieldsToCreate,
			fieldsToRemove,
			fieldsToUpdate
		};
	}

	static compareKeys(keysSchema: KeysSchema, keys: Keys<any>): KeysComparison {
		if (keysSchema.length !== keys.length) {
			return false;
		}
		for (let i = 0; i < keysSchema.length; i++) {
			if (keysSchema[i] !== keys[i]) {
				return false;
			}
		}
		return true;
	}

	static compareIndex(indexSchema: IndexSchema, index: Index<any>): IndexComparison {
		return SchemaManager.compareKeys(indexSchema.keys, index.keys);
	}

	static compareIndices(indicesSchema: IndicesSchema, indices: Array<Index<any>>): IndicesComparison {
		let indicesToCreate = [] as Array<Keys<any>>;
		let indicesToRemove = [] as Array<Keys<any>>;
		newIndices: for (let index of indices) {
			oldIndices: for (let indexSchema of indicesSchema) {
				if (SchemaManager.compareIndex(indexSchema, index)) {
					continue newIndices;
				}
			}
			indicesToCreate.push(index.keys);
		}
		oldIndices: for (let indexSchema of indicesSchema) {
			newIndices: for (let index of indices) {
				if (SchemaManager.compareIndex(indexSchema, index)) {
					continue oldIndices;
				}
			}
			indicesToRemove.push(indexSchema.keys);
		}
		return {
			indicesToCreate,
			indicesToRemove
		};
	}

	static compareStore(storeSchema: StoreSchema, store: Store<any, any>): StoreComparison {
		let fields = SchemaManager.compareFields(storeSchema.fields, store.fields);
		let keys = SchemaManager.compareKeys(storeSchema.keys, store.keys);
		let indices = SchemaManager.compareIndices(storeSchema.indices, store.indices);
		return {
			fields,
			keys,
			indices
		};
	}

	static compareStores(storesSchema: StoresSchema, stores: StoresFromStoreReferences<any>): StoresComparison {
		let storesToCreate = [] as Array<Key<any>>;
		let storesToRemove = [] as Array<Key<any>>;
		let storesToUpdate = [] as Array<Key<any>>;
		for (let key in storesSchema) {
			if (stores[key] == null) {
				storesToRemove.push(key);
			}
		}
		for (let key in stores) {
			if (storesSchema[key] == null) {
				storesToCreate.push(key);
			} else {
				if (!SchemaManager.compareStore(storesSchema[key], stores[key])) {
					storesToUpdate.push(key);
				}
			}
		}
		throw ``;
	}
};
