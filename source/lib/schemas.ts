import * as bedrock from "@joelek/bedrock";
import { Database, DatabaseManager } from "./databases";
import { File } from "./files";
import { Table } from "./tables";
import { LinkManager, LinkManagers, Links, LinkManagersFromLinks, Link } from "./links";
import { DecreasingOrder, IncreasingOrder, Order, OrderMap, Orders } from "./orders";
import { RequiredKeys, RecordManager, KeysRecordMap, Value, NullableStringField, Record, BinaryField, BooleanField, Field, StringField, Fields, Keys, BigIntField, NumberField, IntegerField, NullableBigIntField, NullableBinaryField, NullableBooleanField, NullableIntegerField, NullableNumberField, MetadataKeysRecordMap } from "./records";
import { Stores, StoreManager, StoreManagers, StoreManagersFromStores, Store, Index, IndexManager, SearchIndex, SearchIndexManager } from "./stores";
import { BlockManager } from "./blocks";
import { Queries, Query, QueryManager, QueryManagers, QueryManagersFromQueries } from "./queries";
import { EqualityOperator, GreaterThanOperator, LessThanOperator, Operator, OperatorMap, Operators } from "./operators";
import { SubsetOf } from "./inference";
import { RadixTree } from "./trees";

export const BigIntFieldSchema = bedrock.codecs.Object.of({
	type: bedrock.codecs.StringLiteral.of("BigIntField"),
	defaultValue: bedrock.codecs.BigInt,
}, {
	unique: bedrock.codecs.Boolean
});

export type BigIntFieldSchema = ReturnType<typeof BigIntFieldSchema["decode"]>;

export const NullableBigIntFieldSchema = bedrock.codecs.Object.of({
	type: bedrock.codecs.StringLiteral.of("NullableBigIntField"),
	defaultValue: bedrock.codecs.Union.of(
		bedrock.codecs.BigInt,
		bedrock.codecs.Null
	)
}, {
	unique: bedrock.codecs.Boolean
});

export type NullableBigIntFieldSchema = ReturnType<typeof NullableBigIntFieldSchema["decode"]>;

export const BinaryFieldSchema = bedrock.codecs.Object.of({
	type: bedrock.codecs.StringLiteral.of("BinaryField"),
	defaultValue: bedrock.codecs.Binary
}, {
	unique: bedrock.codecs.Boolean
});

export type BinaryFieldSchema = ReturnType<typeof BinaryFieldSchema["decode"]>;

export const NullableBinaryFieldSchema = bedrock.codecs.Object.of({
	type: bedrock.codecs.StringLiteral.of("NullableBinaryField"),
	defaultValue: bedrock.codecs.Union.of(
		bedrock.codecs.Binary,
		bedrock.codecs.Null
	)
}, {
	unique: bedrock.codecs.Boolean
});

export type NullableBinaryFieldSchema = ReturnType<typeof NullableBinaryFieldSchema["decode"]>;

export const BooleanFieldSchema = bedrock.codecs.Object.of({
	type: bedrock.codecs.StringLiteral.of("BooleanField"),
	defaultValue: bedrock.codecs.Boolean
}, {
	unique: bedrock.codecs.Boolean
});

export type BooleanFieldSchema = ReturnType<typeof BooleanFieldSchema["decode"]>;

export const NullableBooleanFieldSchema = bedrock.codecs.Object.of({
	type: bedrock.codecs.StringLiteral.of("NullableBooleanField"),
	defaultValue: bedrock.codecs.Union.of(
		bedrock.codecs.Boolean,
		bedrock.codecs.Null
	)
}, {
	unique: bedrock.codecs.Boolean
});

export type NullableBooleanFieldSchema = ReturnType<typeof NullableBooleanFieldSchema["decode"]>;

export const IntegerFieldSchema = bedrock.codecs.Object.of({
	type: bedrock.codecs.StringLiteral.of("IntegerField"),
	defaultValue: bedrock.codecs.Integer
}, {
	unique: bedrock.codecs.Boolean
});

export type IntegerFieldSchema = ReturnType<typeof IntegerFieldSchema["decode"]>;

export const NullableIntegerFieldSchema = bedrock.codecs.Object.of({
	type: bedrock.codecs.StringLiteral.of("NullableIntegerField"),
	defaultValue: bedrock.codecs.Union.of(
		bedrock.codecs.Integer,
		bedrock.codecs.Null
	)
}, {
	unique: bedrock.codecs.Boolean
});

export type NullableIntegerFieldSchema = ReturnType<typeof NullableIntegerFieldSchema["decode"]>;

export const NumberFieldSchema = bedrock.codecs.Object.of({
	type: bedrock.codecs.StringLiteral.of("NumberField"),
	defaultValue: bedrock.codecs.Number
}, {
	unique: bedrock.codecs.Boolean
});

export type NumberFieldSchema = ReturnType<typeof NumberFieldSchema["decode"]>;

export const NullableNumberFieldSchema = bedrock.codecs.Object.of({
	type: bedrock.codecs.StringLiteral.of("NullableNumberField"),
	defaultValue: bedrock.codecs.Union.of(
		bedrock.codecs.Number,
		bedrock.codecs.Null
	)
}, {
	unique: bedrock.codecs.Boolean
});

export type NullableNumberFieldSchema = ReturnType<typeof NullableNumberFieldSchema["decode"]>;

export const StringFieldSchema = bedrock.codecs.Object.of({
	type: bedrock.codecs.StringLiteral.of("StringField"),
	defaultValue: bedrock.codecs.String
}, {
	unique: bedrock.codecs.Boolean,
	searchable: bedrock.codecs.Boolean
});

export type StringFieldSchema = ReturnType<typeof StringFieldSchema["decode"]>;

export const NullableStringFieldSchema = bedrock.codecs.Object.of({
	type: bedrock.codecs.StringLiteral.of("NullableStringField"),
	defaultValue: bedrock.codecs.Union.of(
		bedrock.codecs.String,
		bedrock.codecs.Null
	)
}, {
	unique: bedrock.codecs.Boolean,
	searchable: bedrock.codecs.Boolean
});

export type NullableStringFieldSchema = ReturnType<typeof NullableStringFieldSchema["decode"]>;

export const FieldSchema = bedrock.codecs.Union.of(
	BigIntFieldSchema,
	NullableBigIntFieldSchema,
	BinaryFieldSchema,
	NullableBinaryFieldSchema,
	BooleanFieldSchema,
	NullableBooleanFieldSchema,
	IntegerFieldSchema,
	NullableIntegerFieldSchema,
	NumberFieldSchema,
	NullableNumberFieldSchema,
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

export const EqualityOperatorSchema = bedrock.codecs.Object.of({
	type: bedrock.codecs.StringLiteral.of("EqualityOperator")
});

export type EqualityOperatorSchema = ReturnType<typeof EqualityOperatorSchema["decode"]>;

export const GreaterThanOperatorSchema = bedrock.codecs.Object.of({
	type: bedrock.codecs.StringLiteral.of("GreaterThanOperator")
});

export type GreaterThanOperatorSchema = ReturnType<typeof GreaterThanOperatorSchema["decode"]>;

export const GreaterThanOrEqualOperatorSchema = bedrock.codecs.Object.of({
	type: bedrock.codecs.StringLiteral.of("GreaterThanOrEqualOperator")
});

export type GreaterThanOrEqualOperatorSchema = ReturnType<typeof GreaterThanOrEqualOperatorSchema["decode"]>;

export const LessThanOperatorSchema = bedrock.codecs.Object.of({
	type: bedrock.codecs.StringLiteral.of("LessThanOperator")
});

export type LessThanOperatorSchema = ReturnType<typeof LessThanOperatorSchema["decode"]>;

export const LessThanOrEqualOperatorSchema = bedrock.codecs.Object.of({
	type: bedrock.codecs.StringLiteral.of("LessThanOrEqualOperator")
});

export type LessThanOrEqualOperatorSchema = ReturnType<typeof LessThanOrEqualOperatorSchema["decode"]>;

export const OperatorSchema = bedrock.codecs.Union.of(
	EqualityOperatorSchema,
	GreaterThanOperatorSchema,
	GreaterThanOrEqualOperatorSchema,
	LessThanOperatorSchema,
	LessThanOrEqualOperatorSchema
);

export type OperatorSchema = ReturnType<typeof OperatorSchema["decode"]>;

export const KeyOperatorSchema = bedrock.codecs.Object.of({
	key: bedrock.codecs.String,
	operator: OperatorSchema
});

export type KeyOperatorSchema = ReturnType<typeof KeyOperatorSchema["decode"]>;

export const KeyOperatorsSchema = bedrock.codecs.Array.of(KeyOperatorSchema);

export type KeyOperatorsSchema = ReturnType<typeof KeyOperatorsSchema["decode"]>;

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

export const SearchIndexSchema = bedrock.codecs.Object.of({
	key: bedrock.codecs.String,
	bid: bedrock.codecs.Integer
});

export type SearchIndexSchema = ReturnType<typeof SearchIndexSchema["decode"]>;

export const SearchIndicesSchema = bedrock.codecs.Array.of(SearchIndexSchema);

export type SearchIndicesSchema = ReturnType<typeof SearchIndicesSchema["decode"]>;

export const StoreSchema = bedrock.codecs.Object.of({
	version: bedrock.codecs.Integer,
	fields: FieldsSchema,
	keys: KeysSchema,
	orders: KeyOrdersSchema,
	indices: IndicesSchema,
	storageBid: bedrock.codecs.Integer,
	searchIndices: SearchIndicesSchema
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
}, {
	syncedFields: KeysMapSchema
});

export type LinkSchema = ReturnType<typeof LinkSchema["decode"]>;

export const LinksSchema = bedrock.codecs.Record.of(LinkSchema);

export type LinksSchema = ReturnType<typeof LinksSchema["decode"]>;

export const QuerySchema = bedrock.codecs.Object.of({
	version: bedrock.codecs.Integer,
	store: bedrock.codecs.String,
	operators: KeyOperatorsSchema,
	orders: KeyOrdersSchema
});

export type QuerySchema = ReturnType<typeof QuerySchema["decode"]>;

export const QueriesSchema = bedrock.codecs.Record.of(QuerySchema);

export type QueriesSchema = ReturnType<typeof QueriesSchema["decode"]>;

export const DatabaseSchema = bedrock.codecs.Object.of({
	stores: StoresSchema,
	links: LinksSchema,
	queries: QueriesSchema
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
			links: {},
			queries: {}
		};
		let buffer = DatabaseSchema.encode(databaseSchema, "schema");
		blockManager.createBlock(buffer.length);
		blockManager.writeBlock(BlockManager.RESERVED_BLOCK_DATABASE_SCHEMA, buffer);
	}

	private loadFieldManager(blockManager: BlockManager, fieldSchema: FieldSchema): Field<any> {
		if (isSchemaCompatible(BigIntFieldSchema, fieldSchema)) {
			return new BigIntField(fieldSchema.defaultValue, fieldSchema.unique);
		}
		if (isSchemaCompatible(NullableBigIntFieldSchema, fieldSchema)) {
			return new NullableBigIntField(fieldSchema.defaultValue as bigint | null, fieldSchema.unique);
		}
		if (isSchemaCompatible(BinaryFieldSchema, fieldSchema)) {
			return new BinaryField(fieldSchema.defaultValue, fieldSchema.unique);
		}
		if (isSchemaCompatible(NullableBinaryFieldSchema, fieldSchema)) {
			return new NullableBinaryField(fieldSchema.defaultValue as Uint8Array | null, fieldSchema.unique);
		}
		if (isSchemaCompatible(BooleanFieldSchema, fieldSchema)) {
			return new BooleanField(fieldSchema.defaultValue, fieldSchema.unique);
		}
		if (isSchemaCompatible(NullableBooleanFieldSchema, fieldSchema)) {
			return new NullableBooleanField(fieldSchema.defaultValue as boolean | null, fieldSchema.unique);
		}
		if (isSchemaCompatible(IntegerFieldSchema, fieldSchema)) {
			return new IntegerField(fieldSchema.defaultValue, fieldSchema.unique);
		}
		if (isSchemaCompatible(NullableIntegerFieldSchema, fieldSchema)) {
			return new NullableIntegerField(fieldSchema.defaultValue as number | null, fieldSchema.unique);
		}
		if (isSchemaCompatible(NumberFieldSchema, fieldSchema)) {
			return new NumberField(fieldSchema.defaultValue, fieldSchema.unique);
		}
		if (isSchemaCompatible(NullableNumberFieldSchema, fieldSchema)) {
			return new NullableNumberField(fieldSchema.defaultValue as number | null, fieldSchema.unique);
		}
		if (isSchemaCompatible(StringFieldSchema, fieldSchema)) {
			return new StringField(fieldSchema.defaultValue, fieldSchema.unique, fieldSchema.searchable);
		}
		if (isSchemaCompatible(NullableStringFieldSchema, fieldSchema)) {
			return new NullableStringField(fieldSchema.defaultValue as string | null, fieldSchema.unique, fieldSchema.searchable);
		}
		throw `Expected code to be unreachable!`;
	}

	private loadOperatorManager(operatorSchema: OperatorSchema): Operator<any> {
		if (isSchemaCompatible(EqualityOperatorSchema, operatorSchema)) {
			return new EqualityOperator();
		}
		if (isSchemaCompatible(GreaterThanOperatorSchema, operatorSchema)) {
			return new GreaterThanOperator();
		}
		if (isSchemaCompatible(LessThanOperatorSchema, operatorSchema)) {
			return new LessThanOperator();
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

	private loadIndexManager(recordManager: RecordManager<any>, blockManager: BlockManager, indexSchema: IndexSchema): IndexManager<any, any> {
		return new IndexManager(recordManager, blockManager, indexSchema.keys, {
			bid: indexSchema.bid
		});
	}

	private loadSearchIndexManager(recordManager: RecordManager<any>, blockManager: BlockManager, searchIndexSchema: SearchIndexSchema): SearchIndexManager<any, any> {
		return new SearchIndexManager(recordManager, blockManager, searchIndexSchema.key, {
			bid: searchIndexSchema.bid
		});
	}

	private loadRecordManager(blockManager: BlockManager, fieldsSchema: FieldsSchema): RecordManager<any> {
		let fields = {} as Fields<any>;
		for (let key in fieldsSchema) {
			fields[key] = this.loadFieldManager(blockManager, fieldsSchema[key]);
		}
		return new RecordManager(fields);
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
		let indexManagers = oldSchema.indices.map((indexSchema) => {
			return this.loadIndexManager(recordManager, blockManager, indexSchema);
		});
		let searchIndexManagers = oldSchema.searchIndices.map((searchIndexSchema) => {
			return this.loadSearchIndexManager(recordManager, blockManager, searchIndexSchema);
		});
		return new StoreManager(blockManager, fields, keys, orders, storage, indexManagers, searchIndexManagers);
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
		let syncedFields = linkSchema.syncedFields as MetadataKeysRecordMap<any, any, any, any> | undefined;
		return new LinkManager(parent, child, recordKeysMap, orders, syncedFields);
	}

	private loadQueryManager(blockManager: BlockManager, querySchema: QuerySchema, storeManagers: StoreManagers<any>): QueryManager<any, any, any, any> {
		let store = storeManagers[querySchema.store] as StoreManager<any, any> | undefined;
		if (store == null) {
			throw `Expected store with name "${querySchema.store}"!`;
		}
		let operators = {} as Operators<any>;
		for (let operator of querySchema.operators) {
			operators[operator.key] = this.loadOperatorManager(operator.operator);
		}
		let orders = {} as Orders<any>;
		for (let order of querySchema.orders) {
			orders[order.key] = this.loadOrderManager(order.order);
		}
		return new QueryManager(store, operators, orders);
	}

	private loadDatabaseManager(databaseSchema: DatabaseSchema, blockManager: BlockManager): DatabaseManager<any, any, any> {
		let storeManagers = {} as StoreManagers<any>;
		for (let key in databaseSchema.stores) {
			storeManagers[key] = this.loadStoreManager(blockManager, databaseSchema.stores[key]);
		}
		let linkManagers = {} as LinkManagers<any>;
		for (let key in databaseSchema.links) {
			linkManagers[key] = this.loadLinkManager(blockManager, databaseSchema.links[key], storeManagers);
		}
		let queryManagers = {} as QueryManagers<any>;
		for (let key in databaseSchema.queries) {
			queryManagers[key] = this.loadQueryManager(blockManager, databaseSchema.queries[key], storeManagers);
		}
		return new DatabaseManager(storeManagers, linkManagers, queryManagers, blockManager);
	}

	private compareField<A extends Value>(field: Field<A>, schema: FieldSchema): boolean {
		if (field.getUnique() && !schema.unique) {
			return false;
		}
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
			if (field instanceof NullableBinaryField) {
				return true;
			}
			return false;
		}
		if (isSchemaCompatible(NullableBinaryFieldSchema, schema)) {
			if (field instanceof NullableBinaryField) {
				return true;
			}
			return false;
		}
		if (isSchemaCompatible(BooleanFieldSchema, schema)) {
			if (field instanceof BooleanField) {
				return true;
			}
			if (field instanceof NullableBooleanField) {
				return true;
			}
			return false;
		}
		if (isSchemaCompatible(NullableBooleanFieldSchema, schema)) {
			if (field instanceof NullableBooleanField) {
				return true;
			}
			return false;
		}
		if (isSchemaCompatible(IntegerFieldSchema, schema)) {
			if (field instanceof IntegerField) {
				return true;
			}
			if (field instanceof NullableIntegerField) {
				return true;
			}
			return false;
		}
		if (isSchemaCompatible(NullableIntegerFieldSchema, schema)) {
			if (field instanceof NullableIntegerField) {
				return true;
			}
			return false;
		}
		if (isSchemaCompatible(NumberFieldSchema, schema)) {
			if (field instanceof NumberField) {
				return true;
			}
			if (field instanceof NullableNumberField) {
				return true;
			}
			return false;
		}
		if (isSchemaCompatible(NullableNumberFieldSchema, schema)) {
			if (field instanceof NullableNumberField) {
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

	private compareSearchIndex<A extends Record>(searchIndex: SearchIndex<A>, oldSchema: SearchIndexSchema): boolean {
		return oldSchema.key === searchIndex.key;
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
		for (let key in link.syncedFields) {
			if (link.syncedFields[key] !== oldSchema.syncedFields?.[key as any]) {
				return false;
			}
		}
		for (let key in oldSchema.syncedFields) {
			if (oldSchema.syncedFields[key] !== link.syncedFields[key as any]) {
				return false;
			}
		}
		return true;
	}

	private createField<A extends Value>(field: Field<A>): FieldSchema {
		if (field instanceof BigIntField) {
			return {
				type: "BigIntField",
				defaultValue: (field as BigIntField).getDefaultValue(),
				unique: field.getUnique()
			};
		}
		if (field instanceof NullableBigIntField) {
			return {
				type: "NullableBigIntField",
				defaultValue: (field as NullableBigIntField).getDefaultValue(),
				unique: field.getUnique()
			};
		}
		if (field instanceof BinaryField) {
			return {
				type: "BinaryField",
				defaultValue: (field as BinaryField).getDefaultValue(),
				unique: field.getUnique()
			};
		}
		if (field instanceof NullableBinaryField) {
			return {
				type: "NullableBinaryField",
				defaultValue: (field as NullableBinaryField).getDefaultValue(),
				unique: field.getUnique()
			};
		}
		if (field instanceof BooleanField) {
			return {
				type: "BooleanField",
				defaultValue: (field as BooleanField).getDefaultValue(),
				unique: field.getUnique()
			};
		}
		if (field instanceof NullableBooleanField) {
			return {
				type: "NullableBooleanField",
				defaultValue: (field as NullableBooleanField).getDefaultValue(),
				unique: field.getUnique()
			};
		}
		if (field instanceof IntegerField) {
			return {
				type: "IntegerField",
				defaultValue: (field as IntegerField).getDefaultValue(),
				unique: field.getUnique()
			};
		}
		if (field instanceof NullableIntegerField) {
			return {
				type: "NullableIntegerField",
				defaultValue: (field as NullableIntegerField).getDefaultValue(),
				unique: field.getUnique()
			};
		}
		if (field instanceof NumberField) {
			return {
				type: "NumberField",
				defaultValue: (field as NumberField).getDefaultValue(),
				unique: field.getUnique()
			};
		}
		if (field instanceof NullableNumberField) {
			return {
				type: "NullableNumberField",
				defaultValue: (field as NullableNumberField).getDefaultValue(),
				unique: field.getUnique()
			};
		}
		if (field instanceof StringField) {
			return {
				type: "StringField",
				defaultValue: (field as StringField).getDefaultValue(),
				unique: field.getUnique(),
				searchable: field.getSearchable()
			};
		}
		if (field instanceof NullableStringField) {
			return {
				type: "NullableStringField",
				defaultValue: (field as NullableStringField).getDefaultValue(),
				unique: field.getUnique(),
				searchable: field.getSearchable()
			};
		}
		throw `Expected code to be unreachable!`;
	}

	private createIndex<A extends Record>(blockManager: BlockManager, index: Index<A>): IndexSchema {
		let schema: IndexSchema = {
			keys: index.keys,
			bid: blockManager.createBlock(RadixTree.INITIAL_SIZE)
		};
		return schema;
	}

	private createSearchIndex<A extends Record>(blockManager: BlockManager, searchIndex: SearchIndex<A>): SearchIndexSchema {
		let schema: SearchIndexSchema = {
			key: searchIndex.key,
			bid: blockManager.createBlock(RadixTree.INITIAL_SIZE)
		};
		return schema;
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
		for (let index of store.indices) {
			indices.push(this.createIndex(blockManager, index));
		}
		let searchIndices: SearchIndicesSchema = [];
		for (let searchIndex of store.searchIndices) {
			searchIndices.push(this.createSearchIndex(blockManager, searchIndex));
		}
		let schema: StoreSchema = {
			version,
			fields,
			keys,
			orders,
			indices,
			searchIndices,
			storageBid: blockManager.createBlock(Table.LENGTH)
		};
		return schema;
	}

	private deleteStore(blockManager: BlockManager, oldSchema: StoreSchema): void {
		this.loadStoreManager(blockManager, oldSchema).delete();
	}

	private deleteIndex(blockManager: BlockManager, indexSchema: IndexSchema, fieldsSchema: FieldsSchema): void {
		let recordManager = this.loadRecordManager(blockManager, fieldsSchema);
		this.loadIndexManager(recordManager, blockManager, indexSchema).delete();
	}

	private deleteSearchIndex(blockManager: BlockManager, searchIndexSchema: SearchIndexSchema, fieldsSchema: FieldsSchema): void {
		let recordManager = this.loadRecordManager(blockManager, fieldsSchema);
		this.loadSearchIndexManager(recordManager, blockManager, searchIndexSchema).delete();
	}

	private updateStore<A extends Record, B extends RequiredKeys<A>>(blockManager: BlockManager, store: Store<A, B>, oldSchema: StoreSchema): StoreSchema {
		if (this.compareStore(store, oldSchema)) {
			let indices: IndicesSchema = [];
			newIndices: for (let index of store.indices) {
				oldIndices: for (let indexSchema of oldSchema.indices) {
					if (this.compareIndex(index, indexSchema)) {
						indices.push(indexSchema);
						continue newIndices;
					}
				}
				let recordManager = this.loadRecordManager(blockManager, oldSchema.fields);
				let indexSchema = this.createIndex(blockManager, index);
				let indexManager = this.loadIndexManager(recordManager, blockManager, indexSchema);
				let storage = new Table(blockManager, {
					getKeyFromValue: (value) => {
						let buffer = blockManager.readBlock(value);
						let record = recordManager.decode(buffer);
						return recordManager.encodeKeys(oldSchema.keys, record);
					}
				}, {
					bid: oldSchema.storageBid
				});
				for (let bid of storage) {
					let buffer = blockManager.readBlock(bid);
					let record = recordManager.decode(buffer);
					indexManager.insert(record, bid);
				}
				indices.push(indexSchema);
			}
			oldIndices: for (let indexSchema of oldSchema.indices) {
				newIndices: for (let index of store.indices) {
					if (this.compareIndex(index, indexSchema)) {
						continue oldIndices;
					}
				}
				this.deleteIndex(blockManager, indexSchema, oldSchema.fields);
			}
			let searchIndices: SearchIndicesSchema = [];
			newIndices: for (let searchIndex of store.searchIndices) {
				oldIndices: for (let searchIndexSchema of oldSchema.searchIndices) {
					if (this.compareSearchIndex(searchIndex, searchIndexSchema)) {
						searchIndices.push(searchIndexSchema);
						continue newIndices;
					}
				}
				let recordManager = this.loadRecordManager(blockManager, oldSchema.fields);
				let searchIndexSchema = this.createSearchIndex(blockManager, searchIndex);
				let searchIndexManager = this.loadSearchIndexManager(recordManager, blockManager, searchIndexSchema);
				let storage = new Table(blockManager, {
					getKeyFromValue: (value) => {
						let buffer = blockManager.readBlock(value);
						let record = recordManager.decode(buffer);
						return recordManager.encodeKeys(oldSchema.keys, record);
					}
				}, {
					bid: oldSchema.storageBid
				});
				for (let bid of storage) {
					let buffer = blockManager.readBlock(bid);
					let record = recordManager.decode(buffer);
					searchIndexManager.insert(record, bid);
				}
				searchIndices.push(searchIndexSchema);
			}
			oldIndices: for (let searchIndexSchema of oldSchema.searchIndices) {
				newIndices: for (let searchIndex of store.searchIndices) {
					if (this.compareSearchIndex(searchIndex, searchIndexSchema)) {
						continue oldIndices;
					}
				}
				this.deleteSearchIndex(blockManager, searchIndexSchema, oldSchema.fields);
			}
			let orders = this.createKeyOrders(blockManager, store.orders);
			return {
				...oldSchema,
				orders,
				indices,
				searchIndices
			};
		} else {
			let newSchema = this.createStore(blockManager, store);
			let oldManager = this.loadStoreManager(blockManager, oldSchema);
			let newManager = this.loadStoreManager(blockManager, newSchema);
			for (let oldRecord of oldManager) {
				try {
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

	private createOperator<A extends Value>(operator: Operator<A>): OperatorSchema {
		if (operator instanceof EqualityOperator) {
			return {
				type: "EqualityOperator"
			};
		}
		if (operator instanceof GreaterThanOperator) {
			return {
				type: "GreaterThanOperator"
			};
		}
		throw `Expected code to be unreachable!`;
	}

	private createKeyOperators<A extends Record>(blockManager: BlockManager, operatorMap: OperatorMap<A>): KeyOperatorsSchema {
		let operators: KeyOperatorsSchema = [];
		for (let key in operatorMap) {
			let operator = operatorMap[key] as any; // TypeScript 4.0 cannot infer type properly.
			if (operator == null) {
				continue;
			}
			operators.push({
				key,
				operator: this.createOperator(operator)
			});
		}
		return operators;
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
			let order = orderMap[key] as any; // TypeScript 4.0 cannot infer type properly.
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
		let syncedFields = link.syncedFields as KeyMapSchema;
		return {
			version,
			parent,
			child,
			keysMap,
			orders,
			syncedFields
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

	private compareQuery<A extends Record, B extends RequiredKeys<A>, C extends SubsetOf<A, C>, D extends SubsetOf<A, D>>(stores: Stores<any>, query: Query<A, B, C, D>, oldSchema: QuerySchema): boolean {
		if (this.getStoreName(query.store, stores) !== oldSchema.store) {
			return false;
		}
		return true;
	}

	private createQuery<A extends Record, B extends RequiredKeys<A>, C extends SubsetOf<A, C>, D extends SubsetOf<A, D>>(blockManager: BlockManager, stores: Stores<any>, query: Query<A, B, C, D>): QuerySchema {
		let version = 0;
		let store = this.getStoreName(query.store, stores);
		let operators = this.createKeyOperators(blockManager, query.operators);
		let orders = this.createKeyOrders(blockManager, query.orders);
		return {
			version,
			store,
			operators,
			orders
		};
	}

	private deleteQuery(blockManager: BlockManager, oldSchema: QuerySchema): void {

	}

	private updateQuery<A extends Record, B extends RequiredKeys<A>, C extends SubsetOf<A, C>, D extends SubsetOf<A, D>>(blockManager: BlockManager, stores: Stores<any>, query: Query<A, B, C, D>, oldSchema: QuerySchema): QuerySchema {
		if (this.compareQuery(stores, query, oldSchema)) {
			let operators = this.createKeyOperators(blockManager, query.operators);
			let orders = this.createKeyOrders(blockManager, query.orders);
			return {
				...oldSchema,
				operators,
				orders
			};
		} else {
			let newSchema = this.createQuery(blockManager, stores, query);
			newSchema.version = oldSchema.version + 1;
			return newSchema;
		}
	}

	private updateQueries<A extends Stores<any>, B extends Queries<any>>(blockManager: BlockManager, stores: A, queries: B, oldSchema: QueriesSchema): QueriesSchema {
		let newSchema: QueriesSchema = {};
		for (let key in oldSchema) {
			if (queries[key] == null) {
				this.deleteQuery(blockManager, oldSchema[key]);
			}
		}
		for (let key in queries) {
			if (oldSchema[key] == null) {
				newSchema[key] = this.createQuery(blockManager, stores, queries[key]);
			} else {
				newSchema[key] = this.updateQuery(blockManager, stores, queries[key], oldSchema[key]);
			}
		}
		return newSchema;
	}

	private updateDatabase<A extends Stores<any>, B extends Links<any>, C extends Queries<any>>(blockManager: BlockManager, database: Database<A, B, C>, oldSchema: DatabaseSchema): DatabaseSchema {
		let stores = this.updateStores(blockManager, database.stores, oldSchema.stores);
		let links = this.updateLinks(blockManager, database.stores, database.links, oldSchema.links);
		let queries = this.updateQueries(blockManager, database.stores, database.queries, oldSchema.queries);
		let newSchema: DatabaseSchema = {
			stores,
			links,
			queries
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

	createDatabaseManager<A extends Stores<any>, B extends Links<any>, C extends Queries<any>>(file: File, blockManager: BlockManager, database: Database<A, B, C>): DatabaseManager<StoreManagersFromStores<A>, LinkManagersFromLinks<B>, QueryManagersFromQueries<C>> {
		if (blockManager.getBlockCount() === 0) {
			this.initializeDatabase(blockManager);
		}
		let oldSchema = DatabaseSchema.decode(blockManager.readBlock(BlockManager.RESERVED_BLOCK_DATABASE_SCHEMA), "schema");
		let newSchema = this.updateDatabase(blockManager, database, oldSchema);
		let buffer = DatabaseSchema.encode(newSchema, "schema");
		blockManager.resizeBlock(BlockManager.RESERVED_BLOCK_DATABASE_SCHEMA, buffer.length);
		blockManager.writeBlock(BlockManager.RESERVED_BLOCK_DATABASE_SCHEMA, buffer);
		let databaseManager = this.loadDatabaseManager(newSchema, blockManager);
		let dirtyLinkNames = this.getDirtyLinkNames(oldSchema.links, newSchema.links);
		let dirtyStoreNames = this.getDirtyStoreNames(oldSchema.stores, newSchema.stores);
		databaseManager.enforceConsistency(dirtyStoreNames, dirtyLinkNames);
		file.persist();
		return databaseManager as DatabaseManager<StoreManagersFromStores<A>, LinkManagersFromLinks<B>, QueryManagersFromQueries<C>>;
	}
};
