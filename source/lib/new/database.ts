import * as bedrock from "@joelek/bedrock";
import { ConsistencyManager } from "./consistency";
import { File } from "./files";
import { Table } from "./hash";
import { LinkManager, LinkManagers, Links } from "./link";
import { DecreasingOrder, IncreasingOrder, Order, OrderMap } from "./orders";
import { BinaryField, BinaryFieldManager, BooleanField, BooleanFieldManager, Field, FieldManager, FieldManagers, Fields, Key, Keys, KeysRecordMap, NullableStringField, NullableStringFieldManager, RecordManager, StringField, StringFieldManager } from "./records";
import { BinaryFieldSchema, BooleanFieldSchema, DatabaseSchema, DecreasingOrderSchema, FieldSchema, IncreasingOrderSchema, LinkSchema, NullableStringFieldSchema, StoreSchema, StringFieldSchema, OrderSchema, FieldsSchema, IndicesSchema, KeysSchema, IndexSchema, StoresSchema } from "./schema";
import { Index, Store, StoreManager, StoreManagers, Stores } from "./store";
import { TransactionManager } from "./transaction";
import { BlockHandler } from "./vfs";

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

export type StoresComparison = {
	storesToCreate: Array<Key<any>>;
	storesToRemove: Array<Key<any>>;
	storesToUpdate: Array<Key<any>>;
};

export class DatabaseManager<A, B> {
	private file: File;
	private blockHandler: BlockHandler;

	private createFieldManager(fieldSchema: FieldSchema): FieldManager<any> {
		let blockHandler = this.blockHandler;
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

	private createOrderManager(orderSchema: OrderSchema): Order<any> {
		if (isCompatible(DecreasingOrderSchema, orderSchema)) {
			return new DecreasingOrder();
		}
		if (isCompatible(IncreasingOrderSchema, orderSchema)) {
			return new IncreasingOrder();
		}
		throw `Expected code to be unreachable!`;
	}

	private createStoreManager(storeSchema: StoreSchema): StoreManager<any, any> {
		let blockHandler = this.blockHandler;
		let fieldManagers = {} as FieldManagers<any>;
		for (let key in storeSchema.fields) {
			fieldManagers[key] = this.createFieldManager(storeSchema.fields[key]);
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

	private createLinkManager(linkSchema: LinkSchema, storeManagers: StoreManagers<any>): LinkManager<any, any, any, any, any> {
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

	constructor(file: File) {
		this.file = file;
		this.blockHandler = new BlockHandler(file);
		if (this.blockHandler.getBlockCount() === 0) {
			let databaseSchema: DatabaseSchema = {
				stores: {},
				links: {}
			};
			let buffer = DatabaseSchema.encode(databaseSchema);
			this.blockHandler.createBlock(buffer.length);
			this.blockHandler.writeBlock(0, buffer);
		}
	}

	createTransactionManager(): TransactionManager<Stores<A>, Links<B>> {
		let databaseSchema = DatabaseSchema.decode(this.blockHandler.readBlock(0));
		let storeManagers = {} as StoreManagers<any>;
		for (let key in databaseSchema.stores) {
			storeManagers[key] = this.createStoreManager(databaseSchema.stores[key]);
		}
		let linkManagers = {} as LinkManagers<any>;
		for (let key in databaseSchema.links) {
			// TODO: Build parent and child lists here?
			linkManagers[key] = this.createLinkManager(databaseSchema.links[key], storeManagers);
		}
		let consistencyManager = new ConsistencyManager<any, any>(storeManagers, linkManagers);
		let writableStores = consistencyManager.createWritableStores();
		let writableLinks = consistencyManager.createWritableLinks();
		return new TransactionManager<any, any>(this.file, writableStores, writableLinks);
	}

	migrateSchema<C, D>(stores: Stores<C>, links: Links<D>): DatabaseManager<C, D> {
		let databaseSchema = DatabaseSchema.decode(this.blockHandler.readBlock(0));
		throw `TODO`;
		let buffer = DatabaseSchema.encode(databaseSchema);
		this.blockHandler.resizeBlock(0, buffer.length);
		this.blockHandler.writeBlock(0, buffer);
		return this as unknown as DatabaseManager<C, D>;
	}

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
				if (!DatabaseManager.compareField(fieldsSchema[key], fields[key])) {
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
		return DatabaseManager.compareKeys(indexSchema.keys, index.keys);
	}

	static compareIndices(indicesSchema: IndicesSchema, indices: Array<Index<any>>): IndicesComparison {
		let indicesToCreate = [] as Array<Keys<any>>;
		let indicesToRemove = [] as Array<Keys<any>>;
		newIndices: for (let index of indices) {
			oldIndices: for (let indexSchema of indicesSchema) {
				if (DatabaseManager.compareIndex(indexSchema, index)) {
					continue newIndices;
				}
			}
			indicesToCreate.push(index.keys);
		}
		oldIndices: for (let indexSchema of indicesSchema) {
			newIndices: for (let index of indices) {
				if (DatabaseManager.compareIndex(indexSchema, index)) {
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
		let fields = DatabaseManager.compareFields(storeSchema.fields, store.fields);
		let keys = DatabaseManager.compareKeys(storeSchema.keys, store.keys);
		let indices = DatabaseManager.compareIndices(storeSchema.indices, store.indices);
		return {
			fields,
			keys,
			indices
		};
	}

	static compareStores(storesSchema: StoresSchema, stores: Stores<any>): StoresComparison {
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
				if (!DatabaseManager.compareStore(storesSchema[key], stores[key])) {
					storesToUpdate.push(key);
				}
			}
		}
		return {
			storesToCreate,
			storesToRemove,
			storesToUpdate
		};
	}
};
