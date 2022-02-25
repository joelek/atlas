import * as bedrock from "@joelek/bedrock";
import { Database, DatabaseManager } from "./database";
import { File } from "./files";
import { Table } from "./hash";
import { LinkManager, LinkManagers, Links, LinkManagersFromLinks, Link } from "./link";
import { DecreasingOrder, IncreasingOrder, Order, OrderMap } from "./orders";
import { RequiredKeys, FieldManager, BinaryFieldManager, BooleanFieldManager, StringFieldManager, NullableStringFieldManager, FieldManagers, RecordManager, KeysRecordMap, Value, NullableStringField, Record, BinaryField, BooleanField, Field, StringField, Fields, Keys, BigIntField, BigIntFieldManager } from "./records";
import { Stores, StoreManager, StoreManagers, StoreManagersFromStores, Store, Index } from "./store";
import { BlockHandler } from "./vfs";

export const BigIntFieldSchema = bedrock.codecs.Object.of({
	type: bedrock.codecs.StringLiteral.of("BigIntField"),
	defaultValue: bedrock.codecs.BigInt
});

export type BigIntFieldSchema = ReturnType<typeof BigIntFieldSchema["decode"]>;

export const BinaryFieldSchema = bedrock.codecs.Object.of({
	type: bedrock.codecs.StringLiteral.of("BinaryField"),
	defaultValue: bedrock.codecs.Binary
});

export type BinaryFieldSchema = ReturnType<typeof BinaryFieldSchema["decode"]>;

export const BooleanFieldSchema = bedrock.codecs.Object.of({
	type: bedrock.codecs.StringLiteral.of("BooleanField"),
	defaultValue: bedrock.codecs.Boolean
});

export type BooleanFieldSchema = ReturnType<typeof BooleanFieldSchema["decode"]>;

export const StringFieldSchema = bedrock.codecs.Object.of({
	type: bedrock.codecs.StringLiteral.of("StringField"),
	defaultValue: bedrock.codecs.String
});

export type StringFieldSchema = ReturnType<typeof StringFieldSchema["decode"]>;

export const NullableStringFieldSchema = bedrock.codecs.Object.of({
	type: bedrock.codecs.StringLiteral.of("NullableStringField"),
	defaultValue: bedrock.codecs.Union.of(
		bedrock.codecs.String,
		bedrock.codecs.Null
	)
});

export type NullableStringFieldSchema = ReturnType<typeof NullableStringFieldSchema["decode"]>;

export const FieldSchema = bedrock.codecs.Union.of(
	BigIntFieldSchema,
	BinaryFieldSchema,
	BooleanFieldSchema,
	StringFieldSchema,
	NullableStringFieldSchema
);

export type FieldSchema = ReturnType<typeof FieldSchema["decode"]>;

export const FieldsSchema = bedrock.codecs.Record.of(FieldSchema);

export type FieldsSchema = ReturnType<typeof FieldsSchema["decode"]>;

export const KeysSchema = bedrock.codecs.Array.of(bedrock.codecs.String);

export type KeysSchema = ReturnType<typeof KeysSchema["decode"]>;

export const IndexSchema = bedrock.codecs.Object.of({
	keys: KeysSchema,
	bid: bedrock.codecs.Integer
});

export type IndexSchema = ReturnType<typeof IndexSchema["decode"]>;

export const IndicesSchema = bedrock.codecs.Array.of(IndexSchema);

export type IndicesSchema = ReturnType<typeof IndicesSchema["decode"]>;

export const StoreSchema = bedrock.codecs.Object.of({
	version: bedrock.codecs.Integer,
	fields: FieldsSchema,
	keys: KeysSchema,
	indices: IndicesSchema,
	storageBid: bedrock.codecs.Integer
});

export type StoreSchema = ReturnType<typeof StoreSchema["decode"]>;

export const StoresSchema = bedrock.codecs.Record.of(StoreSchema);

export type StoresSchema = ReturnType<typeof StoresSchema["decode"]>;

export const DecreasingOrderSchema = bedrock.codecs.Object.of({
	type: bedrock.codecs.StringLiteral.of("DecreasingOrder")
});

export type DecreasingOrderSchema = ReturnType<typeof DecreasingOrderSchema["decode"]>;

export const IncreasingOrderSchema = bedrock.codecs.Object.of({
	type: bedrock.codecs.StringLiteral.of("IncreasingOrder")
});

export type IncreasingOrderSchema = ReturnType<typeof IncreasingOrderSchema["decode"]>;

export const OrderSchema = bedrock.codecs.Union.of(
	DecreasingOrderSchema,
	IncreasingOrderSchema
);

export type OrderSchema = ReturnType<typeof OrderSchema["decode"]>;

export const KeyOrderSchema = bedrock.codecs.Object.of({
	key: bedrock.codecs.String,
	order: OrderSchema
});

export type KeyOrderSchema = ReturnType<typeof KeyOrderSchema["decode"]>;

export const KeyOrdersSchema = bedrock.codecs.Array.of(KeyOrderSchema);

export type KeyOrdersSchema = ReturnType<typeof KeyOrdersSchema["decode"]>;

export const KeysMapSchema = bedrock.codecs.Record.of(bedrock.codecs.String);

export type KeyMapSchema = ReturnType<typeof KeysMapSchema["decode"]>;

export const LinkSchema = bedrock.codecs.Object.of({
	version: bedrock.codecs.Integer,
	parent: bedrock.codecs.String,
	child: bedrock.codecs.String,
	keysMap: KeysMapSchema,
	orders: KeyOrdersSchema
});

export type LinkSchema = ReturnType<typeof LinkSchema["decode"]>;

export const LinksSchema = bedrock.codecs.Record.of(LinkSchema);

export type LinksSchema = ReturnType<typeof LinksSchema["decode"]>;

export const DatabaseSchema = bedrock.codecs.Object.of({
	stores: StoresSchema,
	links: LinksSchema
});

export type DatabaseSchema = ReturnType<typeof DatabaseSchema["decode"]>;

export function isSchemaCompatible<V>(codec: bedrock.codecs.Codec<V>, subject: any): subject is V {
	try {
		codec.encode(subject);
		return true;
	} catch (error) {
		return false;
	}
}

export class SchemaManager {
	private getStoreName<A extends Record, B extends RequiredKeys<A>>(store: Store<A, B>, stores: Stores<any>): string {
		for (let key in stores) {
			if (stores[key] === store) {
				return key;
			}
		}
		throw `Expected store!`;
	}

	private initializeDatabase(blockHandler: BlockHandler): void {
		let databaseSchema: DatabaseSchema = {
			stores: {},
			links: {}
		};
		let buffer = DatabaseSchema.encode(databaseSchema);
		blockHandler.createBlock(buffer.length);
		blockHandler.writeBlock(0, buffer);
	}

	private loadFieldManager(blockHandler: BlockHandler, fieldSchema: FieldSchema): FieldManager<any> {
		if (isSchemaCompatible(BigIntFieldSchema, fieldSchema)) {
			return new BigIntFieldManager(fieldSchema.defaultValue);
		}
		if (isSchemaCompatible(BinaryFieldSchema, fieldSchema)) {
			return new BinaryFieldManager(fieldSchema.defaultValue);
		}
		if (isSchemaCompatible(BooleanFieldSchema, fieldSchema)) {
			return new BooleanFieldManager(fieldSchema.defaultValue);
		}
		if (isSchemaCompatible(StringFieldSchema, fieldSchema)) {
			return new StringFieldManager(fieldSchema.defaultValue);
		}
		if (isSchemaCompatible(NullableStringFieldSchema, fieldSchema)) {
			return new NullableStringFieldManager(fieldSchema.defaultValue);
		}
		throw `Expected code to be unreachable!`;
	}

	private loadOrderManager(orderSchema: OrderSchema): Order<any> {
		if (isSchemaCompatible(DecreasingOrderSchema, orderSchema)) {
			return new DecreasingOrder();
		}
		if (isSchemaCompatible(IncreasingOrderSchema, orderSchema)) {
			return new IncreasingOrder();
		}
		throw `Expected code to be unreachable!`;
	}

	private loadStoreManager(blockHandler: BlockHandler, oldSchema: StoreSchema): StoreManager<any, any> {
		let fieldManagers = {} as FieldManagers<any>;
		for (let key in oldSchema.fields) {
			fieldManagers[key] = this.loadFieldManager(blockHandler, oldSchema.fields[key]);
		}
		let keys = oldSchema.keys as any;
		// TODO: Create index managers.
		let recordManager = new RecordManager(fieldManagers);
		let storage = new Table(blockHandler, {
			getKeyFromValue: (value) => {
				let buffer = blockHandler.readBlock(value);
				let record = recordManager.decode(buffer);
				return recordManager.encodeKeys(keys, record);
			}
		}, {
			bid: oldSchema.storageBid
		});
		return new StoreManager(blockHandler, fieldManagers, keys, storage);
	}

	private loadLinkManager(blockHandler: BlockHandler, linkSchema: LinkSchema, storeManagers: StoreManagers<any>): LinkManager<any, any, any, any, any> {
		let parent = storeManagers[linkSchema.parent] as StoreManager<any, any> | undefined;
		if (parent == null) {
			throw `Expected store with name "${linkSchema.parent}"!`;
		}
		let child = storeManagers[linkSchema.child] as StoreManager<any, any> | undefined;
		if (child == null) {
			throw `Expected store with name "${linkSchema.child}"!`;
		}
		let recordKeysMap = linkSchema.keysMap as KeysRecordMap<any, any, any>;
		let orders = {} as OrderMap<any>;
		for (let order of linkSchema.orders) {
			orders[order.key] = this.loadOrderManager(order.order);
		}
		return new LinkManager(parent, child, recordKeysMap, orders);
	}

	private loadDatabaseManager(databaseSchema: DatabaseSchema, blockHandler: BlockHandler): DatabaseManager<any, any> {
		let storeManagers = {} as StoreManagers<any>;
		for (let key in databaseSchema.stores) {
			storeManagers[key] = this.loadStoreManager(blockHandler, databaseSchema.stores[key]);
		}
		let linkManagers = {} as LinkManagers<any>;
		for (let key in databaseSchema.links) {
			linkManagers[key] = this.loadLinkManager(blockHandler, databaseSchema.links[key], storeManagers);
		}
		return new DatabaseManager(storeManagers, linkManagers);
	}

	private compareField<A extends Value>(field: Field<A>, schema: FieldSchema): boolean {
		if (isSchemaCompatible(BigIntFieldSchema, schema)) {
			if (field instanceof BigIntField) {
				return true;
			}
			return false;
		}
		if (isSchemaCompatible(BinaryFieldSchema, schema)) {
			if (field instanceof BinaryField) {
				return true;
			}
			return false;
		}
		if (isSchemaCompatible(BooleanFieldSchema, schema)) {
			if (field instanceof BooleanField) {
				return true;
			}
			return false;
		}
		if (isSchemaCompatible(StringFieldSchema, schema)) {
			if (field instanceof StringField) {
				return true;
			}
			if (field instanceof NullableStringField) {
				return true;
			}
			return false;
		}
		if (isSchemaCompatible(NullableStringFieldSchema, schema)) {
			if (field instanceof NullableStringField) {
				return true;
			}
			return false;
		}
		throw `Expected code to be unreachable!`;
	}

	private compareFields<A extends Record>(fields: Fields<A>, oldSchema: FieldsSchema): boolean {
		for (let key in oldSchema) {
			if (fields[key] == null) {
				return false;
			}
		}
		for (let key in fields) {
			if (oldSchema[key] == null) {
				return false;
			} else {
				if (!this.compareField(fields[key], oldSchema[key])) {
					return false;
				}
			}
		}
		return true;
	}

	private compareKeys<A extends Record>(keys: Keys<A>, oldSchema: KeysSchema): boolean {
		if (oldSchema.length !== keys.length) {
			return false;
		}
		for (let i = 0; i < oldSchema.length; i++) {
			if (oldSchema[i] !== keys[i]) {
				return false;
			}
		}
		return true;
	}

	private compareIndex<A extends Record>(index: Index<A>, oldSchema: IndexSchema): boolean {
		return this.compareKeys(oldSchema.keys, index.keys);
	}

	private compareStore<A extends Record, B extends RequiredKeys<A>>(store: Store<A, B>, oldSchema: StoreSchema): boolean {
		if (!this.compareKeys(store.keys, oldSchema.keys)) {
			return false;
		}
		if (!this.compareFields(store.fields, oldSchema.fields)) {
			return false;
		}
		return true;
	}

	private compareLink<A extends Record, B extends RequiredKeys<A>, C extends Record, D extends RequiredKeys<C>, E extends KeysRecordMap<A, B, C>>(stores: Stores<any>, link: Link<A, B, C, D, E>, oldSchema: LinkSchema): boolean {
		if (this.getStoreName(link.parent, stores) !== oldSchema.parent) {
			return false;
		}
		if (this.getStoreName(link.child, stores) !== oldSchema.child) {
			return false;
		}
		for (let key in link.recordKeysMap) {
			if (oldSchema.keysMap[key] !== link.recordKeysMap[key]) {
				return false;
			}
		}
		for (let key in oldSchema.keysMap) {
			if (oldSchema.keysMap[key] !== link.recordKeysMap[key as keyof E]) {
				return false;
			}
		}
		return true;
	}

	private createField<A extends Value>(field: Field<A>): FieldSchema {
		if (field instanceof BigIntField) {
			return {
				type: "BigIntField",
				defaultValue: field.defaultValue
			};
		}
		if (field instanceof BinaryField) {
			return {
				type: "BinaryField",
				defaultValue: field.defaultValue
			};
		}
		if (field instanceof BooleanField) {
			return {
				type: "BooleanField",
				defaultValue: field.defaultValue
			};
		}
		if (field instanceof StringField) {
			return {
				type: "StringField",
				defaultValue: field.defaultValue
			};
		}
		if (field instanceof NullableStringField) {
			return {
				type: "NullableStringField",
				defaultValue: field.defaultValue
			};
		}
		throw `Expected code to be unreachable!`;
	}

	private createStore<A extends Record, B extends RequiredKeys<A>>(blockHandler: BlockHandler, store: Store<A, B>): StoreSchema {
		let version = 0;
		let fields: FieldsSchema = {};
		for (let key in store.fields) {
			fields[key] = this.createField(store.fields[key]);
		}
		let keys: KeysSchema = store.keys;
		let indices: IndicesSchema = [];
		for (let i = 0; i < store.indices.length; i++) {
			// TODO: Handle indices.
		}
		let schema: StoreSchema = {
			version,
			fields,
			keys,
			indices,
			storageBid: blockHandler.createBlock(Table.LENGTH)
		};
		return schema;
	}

	private deleteStore(blockHandler: BlockHandler, oldSchema: StoreSchema): void {
		this.loadStoreManager(blockHandler, oldSchema).delete();
	}

	private updateStore<A extends Record, B extends RequiredKeys<A>>(blockHandler: BlockHandler, store: Store<A, B>, oldSchema: StoreSchema): StoreSchema {
		if (this.compareStore(store, oldSchema)) {
			let indices: IndicesSchema = [];
			newIndices: for (let index of store.indices) {
				oldIndices: for (let indexSchema of oldSchema.indices) {
					if (this.compareIndex(index, indexSchema)) {
						continue newIndices;
					}
				}
				// TODO: Create index and insert existing records.
			}
			oldIndices: for (let indexSchema of oldSchema.indices) {
				newIndices: for (let index of store.indices) {
					if (this.compareIndex(index, indexSchema)) {
						continue oldIndices;
					}
				}
				// TODO: Delete index.
			}
			return {
				...oldSchema,
				indices
			};
		} else {
			let newSchema = this.createStore(blockHandler, store);
			let oldManager = this.loadStoreManager(blockHandler, oldSchema);
			let newManager = this.loadStoreManager(blockHandler, newSchema);
			for (let entry of oldManager) {
				try {
					let oldRecord = entry.record();
					let newRecord = {} as A;
					for (let key in store.fields) {
						let fieldManager = store.fields[key].createManager();
						let codec = fieldManager.getCodec();
						if (isSchemaCompatible(codec, oldRecord[key])) {
							newRecord[key] = oldRecord[key];
						} else {
							newRecord[key] = store.fields[key].defaultValue;
						}
					}
					newManager.insert(newRecord);
				} catch (error) {}
			}
			oldManager.delete();
			newSchema.version = oldSchema.version + 1;
			return newSchema;
		}
	}

	private updateStores<A extends Stores<any>>(blockHandler: BlockHandler, stores: A, oldSchema: StoresSchema): StoresSchema {
		let newSchema: StoresSchema = {};
		for (let key in oldSchema) {
			if (stores[key] == null) {
				this.deleteStore(blockHandler, oldSchema[key]);
			}
		}
		for (let key in stores) {
			if (oldSchema[key] == null) {
				newSchema[key] = this.createStore(blockHandler, stores[key]);
			} else {
				newSchema[key] = this.updateStore(blockHandler, stores[key], oldSchema[key]);
			}
		}
		return newSchema;
	}

	private createOrder<A extends Value>(order: Order<A>): OrderSchema {
		if (order instanceof DecreasingOrder) {
			return {
				type: "DecreasingOrder"
			};
		}
		if (order instanceof IncreasingOrder) {
			return {
				type: "IncreasingOrder"
			};
		}
		throw `Expected code to be unreachable!`;
	}

	private createKeyOrders<A extends Record, B extends RequiredKeys<A>, C extends Record, D extends RequiredKeys<C>, E extends KeysRecordMap<A, B, C>>(blockHandler: BlockHandler, link: Link<A, B, C, D, E>): KeyOrdersSchema {
		let orders: KeyOrdersSchema = [];
		for (let key in link.orders) {
			let order = link.orders[key];
			if (order == null) {
				continue;
			}
			orders.push({
				key,
				order: this.createOrder(order)
			});
		}
		return orders;
	}

	private createLink<A extends Record, B extends RequiredKeys<A>, C extends Record, D extends RequiredKeys<C>, E extends KeysRecordMap<A, B, C>>(blockHandler: BlockHandler, stores: Stores<any>, link: Link<A, B, C, D, E>): LinkSchema {
		let version = 0;
		let parent = this.getStoreName(link.parent, stores);
		let child = this.getStoreName(link.child, stores);
		let keysMap = link.recordKeysMap as KeyMapSchema;
		let orders = this.createKeyOrders(blockHandler, link);
		return {
			version,
			parent,
			child,
			keysMap,
			orders
		};
	}

	private deleteLink(blockHandler: BlockHandler, oldSchema: LinkSchema): void {

	}

	private updateLink<A extends Record, B extends RequiredKeys<A>, C extends Record, D extends RequiredKeys<C>, E extends KeysRecordMap<A, B, C>>(blockHandler: BlockHandler, stores: Stores<any>, link: Link<A, B, C, D, E>, oldSchema: LinkSchema): LinkSchema {
		if (this.compareLink(stores, link, oldSchema)) {
			let orders = this.createKeyOrders(blockHandler, link);
			return {
				...oldSchema,
				orders
			};
		} else {
			let newSchema = this.createLink(blockHandler, stores, link);
			newSchema.version = oldSchema.version + 1;
			return newSchema;
		}
	}

	private updateLinks<A extends Stores<any>, B extends Links<any>>(blockHandler: BlockHandler, stores: A, links: B, oldSchema: LinksSchema): LinksSchema {
		let newSchema: LinksSchema = {};
		for (let key in oldSchema) {
			if (links[key] == null) {
				this.deleteLink(blockHandler, oldSchema[key]);
			}
		}
		for (let key in links) {
			if (oldSchema[key] == null) {
				newSchema[key] = this.createLink(blockHandler, stores, links[key]);
			} else {
				newSchema[key] = this.updateLink(blockHandler, stores, links[key], oldSchema[key]);
			}
		}
		return newSchema;
	}

	private updateDatabase<A extends Stores<any>, B extends Links<any>>(blockHandler: BlockHandler, database: Database<A, B>, oldSchema: DatabaseSchema): DatabaseSchema {
		let stores = this.updateStores(blockHandler, database.stores, oldSchema.stores);
		let links = this.updateLinks(blockHandler, database.stores, database.links, oldSchema.links);
		let newSchema: DatabaseSchema = {
			stores,
			links
		};
		return newSchema;
	}

	private getDirtyStoreNames(oldSchema: StoresSchema, newSchema: StoresSchema): Array<string> {
		let names = [] as Array<string>;
		for (let key in newSchema) {
			if (newSchema[key].version !== oldSchema[key]?.version) {
				names.push(key);
			}
		}
		return names;
	}

	private getDirtyLinkNames(oldSchema: LinksSchema, newSchema: LinksSchema): Array<string> {
		let names = [] as Array<string>;
		for (let key in newSchema) {
			if (newSchema[key].version !== oldSchema[key]?.version) {
				names.push(key);
			}
		}
		return names;
	}

	constructor() {}

	createDatabaseManager<A extends Stores<any>, B extends Links<any>>(file: File, database: Database<A, B>): DatabaseManager<StoreManagersFromStores<A>, LinkManagersFromLinks<B>> {
		let blockHandler = new BlockHandler(file);
		if (blockHandler.getBlockCount() === 0) {
			this.initializeDatabase(blockHandler);
		}
		let oldSchema = DatabaseSchema.decode(blockHandler.readBlock(0));
		let newSchema = this.updateDatabase(blockHandler, database, oldSchema);
		let buffer = DatabaseSchema.encode(newSchema);
		blockHandler.resizeBlock(0, buffer.length);
		blockHandler.writeBlock(0, buffer);
		let databaseManager = this.loadDatabaseManager(newSchema, blockHandler);
		let dirtyLinkNames = this.getDirtyLinkNames(oldSchema.links, newSchema.links);
		let dirtyStoreNames = this.getDirtyStoreNames(oldSchema.stores, newSchema.stores);
		databaseManager.enforceConsistency(dirtyStoreNames, dirtyLinkNames);
		file.persist();
		return databaseManager as DatabaseManager<StoreManagersFromStores<A>, LinkManagersFromLinks<B>>;
	}
};
