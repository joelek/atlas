import * as bedrock from "@joelek/bedrock";
import { Database, DatabaseManager } from "./database";
import { File } from "./files";
import { Table } from "./hash";
import { LinkManager, LinkManagers, Links, LinkManagersFromLinks, Link } from "./link";
import { DecreasingOrder, IncreasingOrder, Order, OrderMap } from "./orders";
import { RequiredKeys, RecordManager, KeysRecordMap, Value, NullableStringField, Record, BinaryField, BooleanField, Field, StringField, Fields, Keys, BigIntField, NumberField, IntegerField, NullableBigIntField } from "./records";
import { Stores, StoreManager, StoreManagers, StoreManagersFromStores, Store, Index } from "./store";
import { BlockManager } from "./vfs";

export const BigIntFieldSchema = bedrock.codecs.Object.of({
	type: bedrock.codecs.StringLiteral.of("BigIntField"),
	defaultValue: bedrock.codecs.BigInt
});

export type BigIntFieldSchema = ReturnType<typeof BigIntFieldSchema["decode"]>;

export const NullableBigIntFieldSchema = bedrock.codecs.Object.of({
	type: bedrock.codecs.StringLiteral.of("NullableBigIntField"),
	defaultValue: bedrock.codecs.Union.of(
		bedrock.codecs.BigInt,
		bedrock.codecs.Null
	)
});

export type NullableBigIntFieldSchema = ReturnType<typeof NullableBigIntFieldSchema["decode"]>;

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

export const IntegerFieldSchema = bedrock.codecs.Object.of({
	type: bedrock.codecs.StringLiteral.of("IntegerField"),
	defaultValue: bedrock.codecs.Integer
});

export type IntegerFieldSchema = ReturnType<typeof IntegerFieldSchema["decode"]>;

export const NumberFieldSchema = bedrock.codecs.Object.of({
	type: bedrock.codecs.StringLiteral.of("NumberField"),
	defaultValue: bedrock.codecs.Number
});

export type NumberFieldSchema = ReturnType<typeof NumberFieldSchema["decode"]>;

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
	NullableBigIntFieldSchema,
	BinaryFieldSchema,
	BooleanFieldSchema,
	IntegerFieldSchema,
	NumberFieldSchema,
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

export const StoreSchema = bedrock.codecs.Object.of({
	version: bedrock.codecs.Integer,
	fields: FieldsSchema,
	keys: KeysSchema,
	orders: KeyOrdersSchema,
	indices: IndicesSchema,
	storageBid: bedrock.codecs.Integer
});

export type StoreSchema = ReturnType<typeof StoreSchema["decode"]>;

export const StoresSchema = bedrock.codecs.Record.of(StoreSchema);

export type StoresSchema = ReturnType<typeof StoresSchema["decode"]>;

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

	private initializeDatabase(blockManager: BlockManager): void {
		let databaseSchema: DatabaseSchema = {
			stores: {},
			links: {}
		};
		let buffer = DatabaseSchema.encode(databaseSchema, "schema");
		blockManager.createBlock(buffer.length);
		blockManager.writeBlock(0, buffer);
	}

	private loadFieldManager(blockManager: BlockManager, fieldSchema: FieldSchema): Field<any> {
		if (isSchemaCompatible(BigIntFieldSchema, fieldSchema)) {
			return new BigIntField(fieldSchema.defaultValue);
		}
		if (isSchemaCompatible(NullableBigIntFieldSchema, fieldSchema)) {
			return new NullableBigIntField(fieldSchema.defaultValue);
		}
		if (isSchemaCompatible(BinaryFieldSchema, fieldSchema)) {
			return new BinaryField(fieldSchema.defaultValue);
		}
		if (isSchemaCompatible(BooleanFieldSchema, fieldSchema)) {
			return new BooleanField(fieldSchema.defaultValue);
		}
		if (isSchemaCompatible(IntegerFieldSchema, fieldSchema)) {
			return new IntegerField(fieldSchema.defaultValue);
		}
		if (isSchemaCompatible(NumberFieldSchema, fieldSchema)) {
			return new NumberField(fieldSchema.defaultValue);
		}
		if (isSchemaCompatible(StringFieldSchema, fieldSchema)) {
			return new StringField(fieldSchema.defaultValue);
		}
		if (isSchemaCompatible(NullableStringFieldSchema, fieldSchema)) {
			return new NullableStringField(fieldSchema.defaultValue);
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

	private loadStoreManager(blockManager: BlockManager, oldSchema: StoreSchema): StoreManager<any, any> {
		let fields = {} as Fields<any>;
		for (let key in oldSchema.fields) {
			fields[key] = this.loadFieldManager(blockManager, oldSchema.fields[key]);
		}
		let keys = oldSchema.keys as any;
		let orders = {} as OrderMap<any>;
		for (let order of oldSchema.orders) {
			orders[order.key] = this.loadOrderManager(order.order);
		}
		// TODO: Create index managers.
		let recordManager = new RecordManager(fields);
		let storage = new Table(blockManager, {
			getKeyFromValue: (value) => {
				let buffer = blockManager.readBlock(value);
				let record = recordManager.decode(buffer);
				return recordManager.encodeKeys(keys, record);
			}
		}, {
			bid: oldSchema.storageBid
		});
		return new StoreManager(blockManager, fields, keys, orders, storage);
	}

	private loadLinkManager(blockManager: BlockManager, linkSchema: LinkSchema, storeManagers: StoreManagers<any>): LinkManager<any, any, any, any, any> {
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

	private loadDatabaseManager(databaseSchema: DatabaseSchema, blockManager: BlockManager): DatabaseManager<any, any> {
		let storeManagers = {} as StoreManagers<any>;
		for (let key in databaseSchema.stores) {
			storeManagers[key] = this.loadStoreManager(blockManager, databaseSchema.stores[key]);
		}
		let linkManagers = {} as LinkManagers<any>;
		for (let key in databaseSchema.links) {
			linkManagers[key] = this.loadLinkManager(blockManager, databaseSchema.links[key], storeManagers);
		}
		return new DatabaseManager(storeManagers, linkManagers);
	}

	private compareField<A extends Value>(field: Field<A>, schema: FieldSchema): boolean {
		if (isSchemaCompatible(BigIntFieldSchema, schema)) {
			if (field instanceof BigIntField) {
				return true;
			}
			if (field instanceof NullableBigIntField) {
				return true;
			}
			return false;
		}
		if (isSchemaCompatible(NullableBigIntFieldSchema, schema)) {
			if (field instanceof NullableBigIntField) {
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
		if (isSchemaCompatible(IntegerFieldSchema, schema)) {
			if (field instanceof IntegerField) {
				return true;
			}
			return false;
		}
		if (isSchemaCompatible(NumberFieldSchema, schema)) {
			if (field instanceof NumberField) {
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
				defaultValue: (field as BigIntField).getDefaultValue()
			};
		}
		if (field instanceof NullableBigIntField) {
			return {
				type: "NullableBigIntField",
				defaultValue: (field as NullableBigIntField).getDefaultValue()
			};
		}
		if (field instanceof BinaryField) {
			return {
				type: "BinaryField",
				defaultValue: (field as BinaryField).getDefaultValue()
			};
		}
		if (field instanceof BooleanField) {
			return {
				type: "BooleanField",
				defaultValue: (field as BooleanField).getDefaultValue()
			};
		}
		if (field instanceof IntegerField) {
			return {
				type: "IntegerField",
				defaultValue: (field as IntegerField).getDefaultValue()
			};
		}
		if (field instanceof NumberField) {
			return {
				type: "NumberField",
				defaultValue: (field as NumberField).getDefaultValue()
			};
		}
		if (field instanceof StringField) {
			return {
				type: "StringField",
				defaultValue: (field as StringField).getDefaultValue()
			};
		}
		if (field instanceof NullableStringField) {
			return {
				type: "NullableStringField",
				defaultValue: (field as NullableStringField).getDefaultValue()
			};
		}
		throw `Expected code to be unreachable!`;
	}

	private createStore<A extends Record, B extends RequiredKeys<A>>(blockManager: BlockManager, store: Store<A, B>): StoreSchema {
		let version = 0;
		let fields: FieldsSchema = {};
		for (let key in store.fields) {
			fields[key] = this.createField(store.fields[key]);
		}
		let keys: KeysSchema = store.keys;
		let orders = this.createKeyOrders(blockManager, store.orders);
		let indices: IndicesSchema = [];
		for (let i = 0; i < store.indices.length; i++) {
			// TODO: Handle indices.
		}
		let schema: StoreSchema = {
			version,
			fields,
			keys,
			orders,
			indices,
			storageBid: blockManager.createBlock(Table.LENGTH)
		};
		return schema;
	}

	private deleteStore(blockManager: BlockManager, oldSchema: StoreSchema): void {
		this.loadStoreManager(blockManager, oldSchema).delete();
	}

	private updateStore<A extends Record, B extends RequiredKeys<A>>(blockManager: BlockManager, store: Store<A, B>, oldSchema: StoreSchema): StoreSchema {
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
			let newSchema = this.createStore(blockManager, store);
			let oldManager = this.loadStoreManager(blockManager, oldSchema);
			let newManager = this.loadStoreManager(blockManager, newSchema);
			for (let entry of oldManager) {
				try {
					let oldRecord = entry.record();
					let newRecord = {} as A;
					for (let key in store.fields) {
						let field = store.fields[key];
						let codec = field.getCodec();
						if (isSchemaCompatible(codec, oldRecord[key])) {
							newRecord[key] = oldRecord[key];
						} else {
							newRecord[key] = field.getDefaultValue();
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

	private updateStores<A extends Stores<any>>(blockManager: BlockManager, stores: A, oldSchema: StoresSchema): StoresSchema {
		let newSchema: StoresSchema = {};
		for (let key in oldSchema) {
			if (stores[key] == null) {
				this.deleteStore(blockManager, oldSchema[key]);
			}
		}
		for (let key in stores) {
			if (oldSchema[key] == null) {
				newSchema[key] = this.createStore(blockManager, stores[key]);
			} else {
				newSchema[key] = this.updateStore(blockManager, stores[key], oldSchema[key]);
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

	private createKeyOrders<A extends Record>(blockManager: BlockManager, orderMap: OrderMap<A>): KeyOrdersSchema {
		let orders: KeyOrdersSchema = [];
		for (let key in orderMap) {
			let order = orderMap[key];
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

	private createLink<A extends Record, B extends RequiredKeys<A>, C extends Record, D extends RequiredKeys<C>, E extends KeysRecordMap<A, B, C>>(blockManager: BlockManager, stores: Stores<any>, link: Link<A, B, C, D, E>): LinkSchema {
		let version = 0;
		let parent = this.getStoreName(link.parent, stores);
		let child = this.getStoreName(link.child, stores);
		let keysMap = link.recordKeysMap as KeyMapSchema;
		let orders = this.createKeyOrders(blockManager, link.orders);
		return {
			version,
			parent,
			child,
			keysMap,
			orders
		};
	}

	private deleteLink(blockManager: BlockManager, oldSchema: LinkSchema): void {

	}

	private updateLink<A extends Record, B extends RequiredKeys<A>, C extends Record, D extends RequiredKeys<C>, E extends KeysRecordMap<A, B, C>>(blockManager: BlockManager, stores: Stores<any>, link: Link<A, B, C, D, E>, oldSchema: LinkSchema): LinkSchema {
		if (this.compareLink(stores, link, oldSchema)) {
			let orders = this.createKeyOrders(blockManager, link.orders);
			return {
				...oldSchema,
				orders
			};
		} else {
			let newSchema = this.createLink(blockManager, stores, link);
			newSchema.version = oldSchema.version + 1;
			return newSchema;
		}
	}

	private updateLinks<A extends Stores<any>, B extends Links<any>>(blockManager: BlockManager, stores: A, links: B, oldSchema: LinksSchema): LinksSchema {
		let newSchema: LinksSchema = {};
		for (let key in oldSchema) {
			if (links[key] == null) {
				this.deleteLink(blockManager, oldSchema[key]);
			}
		}
		for (let key in links) {
			if (oldSchema[key] == null) {
				newSchema[key] = this.createLink(blockManager, stores, links[key]);
			} else {
				newSchema[key] = this.updateLink(blockManager, stores, links[key], oldSchema[key]);
			}
		}
		return newSchema;
	}

	private updateDatabase<A extends Stores<any>, B extends Links<any>>(blockManager: BlockManager, database: Database<A, B>, oldSchema: DatabaseSchema): DatabaseSchema {
		let stores = this.updateStores(blockManager, database.stores, oldSchema.stores);
		let links = this.updateLinks(blockManager, database.stores, database.links, oldSchema.links);
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
		let blockManager = new BlockManager(file);
		if (blockManager.getBlockCount() === 0) {
			this.initializeDatabase(blockManager);
		}
		let oldSchema = DatabaseSchema.decode(blockManager.readBlock(0), "schema");
		let newSchema = this.updateDatabase(blockManager, database, oldSchema);
		let buffer = DatabaseSchema.encode(newSchema, "schema");
		blockManager.resizeBlock(0, buffer.length);
		blockManager.writeBlock(0, buffer);
		let databaseManager = this.loadDatabaseManager(newSchema, blockManager);
		let dirtyLinkNames = this.getDirtyLinkNames(oldSchema.links, newSchema.links);
		let dirtyStoreNames = this.getDirtyStoreNames(oldSchema.stores, newSchema.stores);
		databaseManager.enforceConsistency(dirtyStoreNames, dirtyLinkNames);
		file.persist();
		return databaseManager as DatabaseManager<StoreManagersFromStores<A>, LinkManagersFromLinks<B>>;
	}
};
