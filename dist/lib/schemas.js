"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaManager = exports.isSchemaCompatible = exports.DatabaseSchema = exports.QueriesSchema = exports.QuerySchema = exports.LinksSchema = exports.LinkSchema = exports.StoresSchema = exports.StoreSchema = exports.SearchIndicesSchema = exports.SearchIndexSchema = exports.KeysMapSchema = exports.KeyOrdersSchema = exports.KeyOrderSchema = exports.OrderSchema = exports.IncreasingOrderSchema = exports.DecreasingOrderSchema = exports.KeyOperatorsSchema = exports.KeyOperatorSchema = exports.OperatorSchema = exports.EqualityOperatorSchema = exports.IndicesSchema = exports.IndexSchema = exports.KeysSchema = exports.FieldsSchema = exports.FieldSchema = exports.NullableStringFieldSchema = exports.StringFieldSchema = exports.NullableNumberFieldSchema = exports.NumberFieldSchema = exports.NullableIntegerFieldSchema = exports.IntegerFieldSchema = exports.NullableBooleanFieldSchema = exports.BooleanFieldSchema = exports.NullableBinaryFieldSchema = exports.BinaryFieldSchema = exports.NullableBigIntFieldSchema = exports.BigIntFieldSchema = void 0;
const bedrock = require("@joelek/bedrock");
const databases_1 = require("./databases");
const tables_1 = require("./tables");
const links_1 = require("./links");
const orders_1 = require("./orders");
const records_1 = require("./records");
const stores_1 = require("./stores");
const blocks_1 = require("./blocks");
const queries_1 = require("./queries");
const operators_1 = require("./operators");
const trees_1 = require("./trees");
exports.BigIntFieldSchema = bedrock.codecs.Object.of({
    type: bedrock.codecs.StringLiteral.of("BigIntField"),
    defaultValue: bedrock.codecs.BigInt
});
exports.NullableBigIntFieldSchema = bedrock.codecs.Object.of({
    type: bedrock.codecs.StringLiteral.of("NullableBigIntField"),
    defaultValue: bedrock.codecs.Union.of(bedrock.codecs.BigInt, bedrock.codecs.Null)
});
exports.BinaryFieldSchema = bedrock.codecs.Object.of({
    type: bedrock.codecs.StringLiteral.of("BinaryField"),
    defaultValue: bedrock.codecs.Binary
});
exports.NullableBinaryFieldSchema = bedrock.codecs.Object.of({
    type: bedrock.codecs.StringLiteral.of("NullableBinaryField"),
    defaultValue: bedrock.codecs.Union.of(bedrock.codecs.Binary, bedrock.codecs.Null)
});
exports.BooleanFieldSchema = bedrock.codecs.Object.of({
    type: bedrock.codecs.StringLiteral.of("BooleanField"),
    defaultValue: bedrock.codecs.Boolean
});
exports.NullableBooleanFieldSchema = bedrock.codecs.Object.of({
    type: bedrock.codecs.StringLiteral.of("NullableBooleanField"),
    defaultValue: bedrock.codecs.Union.of(bedrock.codecs.Boolean, bedrock.codecs.Null)
});
exports.IntegerFieldSchema = bedrock.codecs.Object.of({
    type: bedrock.codecs.StringLiteral.of("IntegerField"),
    defaultValue: bedrock.codecs.Integer
});
exports.NullableIntegerFieldSchema = bedrock.codecs.Object.of({
    type: bedrock.codecs.StringLiteral.of("NullableIntegerField"),
    defaultValue: bedrock.codecs.Union.of(bedrock.codecs.Integer, bedrock.codecs.Null)
});
exports.NumberFieldSchema = bedrock.codecs.Object.of({
    type: bedrock.codecs.StringLiteral.of("NumberField"),
    defaultValue: bedrock.codecs.Number
});
exports.NullableNumberFieldSchema = bedrock.codecs.Object.of({
    type: bedrock.codecs.StringLiteral.of("NullableNumberField"),
    defaultValue: bedrock.codecs.Union.of(bedrock.codecs.Number, bedrock.codecs.Null)
});
exports.StringFieldSchema = bedrock.codecs.Object.of({
    type: bedrock.codecs.StringLiteral.of("StringField"),
    defaultValue: bedrock.codecs.String
}, {
    searchable: bedrock.codecs.Boolean
});
exports.NullableStringFieldSchema = bedrock.codecs.Object.of({
    type: bedrock.codecs.StringLiteral.of("NullableStringField"),
    defaultValue: bedrock.codecs.Union.of(bedrock.codecs.String, bedrock.codecs.Null)
}, {
    searchable: bedrock.codecs.Boolean
});
exports.FieldSchema = bedrock.codecs.Union.of(exports.BigIntFieldSchema, exports.NullableBigIntFieldSchema, exports.BinaryFieldSchema, exports.NullableBinaryFieldSchema, exports.BooleanFieldSchema, exports.NullableBooleanFieldSchema, exports.IntegerFieldSchema, exports.NullableIntegerFieldSchema, exports.NumberFieldSchema, exports.NullableNumberFieldSchema, exports.StringFieldSchema, exports.NullableStringFieldSchema);
exports.FieldsSchema = bedrock.codecs.Record.of(exports.FieldSchema);
exports.KeysSchema = bedrock.codecs.Array.of(bedrock.codecs.String);
exports.IndexSchema = bedrock.codecs.Object.of({
    keys: exports.KeysSchema,
    bid: bedrock.codecs.Integer
});
exports.IndicesSchema = bedrock.codecs.Array.of(exports.IndexSchema);
exports.EqualityOperatorSchema = bedrock.codecs.Object.of({
    type: bedrock.codecs.StringLiteral.of("EqualityOperator")
});
exports.OperatorSchema = bedrock.codecs.Union.of(exports.EqualityOperatorSchema);
exports.KeyOperatorSchema = bedrock.codecs.Object.of({
    key: bedrock.codecs.String,
    operator: exports.OperatorSchema
});
exports.KeyOperatorsSchema = bedrock.codecs.Array.of(exports.KeyOperatorSchema);
exports.DecreasingOrderSchema = bedrock.codecs.Object.of({
    type: bedrock.codecs.StringLiteral.of("DecreasingOrder")
});
exports.IncreasingOrderSchema = bedrock.codecs.Object.of({
    type: bedrock.codecs.StringLiteral.of("IncreasingOrder")
});
exports.OrderSchema = bedrock.codecs.Union.of(exports.DecreasingOrderSchema, exports.IncreasingOrderSchema);
exports.KeyOrderSchema = bedrock.codecs.Object.of({
    key: bedrock.codecs.String,
    order: exports.OrderSchema
});
exports.KeyOrdersSchema = bedrock.codecs.Array.of(exports.KeyOrderSchema);
exports.KeysMapSchema = bedrock.codecs.Record.of(bedrock.codecs.String);
exports.SearchIndexSchema = bedrock.codecs.Object.of({
    key: bedrock.codecs.String,
    bid: bedrock.codecs.Integer
});
exports.SearchIndicesSchema = bedrock.codecs.Array.of(exports.SearchIndexSchema);
exports.StoreSchema = bedrock.codecs.Object.of({
    version: bedrock.codecs.Integer,
    fields: exports.FieldsSchema,
    keys: exports.KeysSchema,
    orders: exports.KeyOrdersSchema,
    indices: exports.IndicesSchema,
    storageBid: bedrock.codecs.Integer,
    searchIndices: exports.SearchIndicesSchema
});
exports.StoresSchema = bedrock.codecs.Record.of(exports.StoreSchema);
exports.LinkSchema = bedrock.codecs.Object.of({
    version: bedrock.codecs.Integer,
    parent: bedrock.codecs.String,
    child: bedrock.codecs.String,
    keysMap: exports.KeysMapSchema,
    orders: exports.KeyOrdersSchema
});
exports.LinksSchema = bedrock.codecs.Record.of(exports.LinkSchema);
exports.QuerySchema = bedrock.codecs.Object.of({
    version: bedrock.codecs.Integer,
    store: bedrock.codecs.String,
    operators: exports.KeyOperatorsSchema,
    orders: exports.KeyOrdersSchema
});
exports.QueriesSchema = bedrock.codecs.Record.of(exports.QuerySchema);
exports.DatabaseSchema = bedrock.codecs.Object.of({
    stores: exports.StoresSchema,
    links: exports.LinksSchema,
    queries: exports.QueriesSchema
});
function isSchemaCompatible(codec, subject) {
    try {
        codec.encode(subject);
        return true;
    }
    catch (error) {
        return false;
    }
}
exports.isSchemaCompatible = isSchemaCompatible;
class SchemaManager {
    getStoreName(store, stores) {
        for (let key in stores) {
            if (stores[key] === store) {
                return key;
            }
        }
        throw `Expected store!`;
    }
    initializeDatabase(blockManager) {
        let databaseSchema = {
            stores: {},
            links: {},
            queries: {}
        };
        let buffer = exports.DatabaseSchema.encode(databaseSchema, "schema");
        blockManager.createBlock(buffer.length);
        blockManager.writeBlock(0, buffer);
    }
    loadFieldManager(blockManager, fieldSchema) {
        if (isSchemaCompatible(exports.BigIntFieldSchema, fieldSchema)) {
            return new records_1.BigIntField(fieldSchema.defaultValue);
        }
        if (isSchemaCompatible(exports.NullableBigIntFieldSchema, fieldSchema)) {
            return new records_1.NullableBigIntField(fieldSchema.defaultValue);
        }
        if (isSchemaCompatible(exports.BinaryFieldSchema, fieldSchema)) {
            return new records_1.BinaryField(fieldSchema.defaultValue);
        }
        if (isSchemaCompatible(exports.NullableBinaryFieldSchema, fieldSchema)) {
            return new records_1.NullableBinaryField(fieldSchema.defaultValue);
        }
        if (isSchemaCompatible(exports.BooleanFieldSchema, fieldSchema)) {
            return new records_1.BooleanField(fieldSchema.defaultValue);
        }
        if (isSchemaCompatible(exports.NullableBooleanFieldSchema, fieldSchema)) {
            return new records_1.NullableBooleanField(fieldSchema.defaultValue);
        }
        if (isSchemaCompatible(exports.IntegerFieldSchema, fieldSchema)) {
            return new records_1.IntegerField(fieldSchema.defaultValue);
        }
        if (isSchemaCompatible(exports.NullableIntegerFieldSchema, fieldSchema)) {
            return new records_1.NullableIntegerField(fieldSchema.defaultValue);
        }
        if (isSchemaCompatible(exports.NumberFieldSchema, fieldSchema)) {
            return new records_1.NumberField(fieldSchema.defaultValue);
        }
        if (isSchemaCompatible(exports.NullableNumberFieldSchema, fieldSchema)) {
            return new records_1.NullableNumberField(fieldSchema.defaultValue);
        }
        if (isSchemaCompatible(exports.StringFieldSchema, fieldSchema)) {
            return new records_1.StringField(fieldSchema.defaultValue, fieldSchema.searchable);
        }
        if (isSchemaCompatible(exports.NullableStringFieldSchema, fieldSchema)) {
            return new records_1.NullableStringField(fieldSchema.defaultValue, fieldSchema.searchable);
        }
        throw `Expected code to be unreachable!`;
    }
    loadOperatorManager(operatorSchema) {
        if (isSchemaCompatible(exports.EqualityOperatorSchema, operatorSchema)) {
            return new operators_1.EqualityOperator();
        }
        throw `Expected code to be unreachable!`;
    }
    loadOrderManager(orderSchema) {
        if (isSchemaCompatible(exports.DecreasingOrderSchema, orderSchema)) {
            return new orders_1.DecreasingOrder();
        }
        if (isSchemaCompatible(exports.IncreasingOrderSchema, orderSchema)) {
            return new orders_1.IncreasingOrder();
        }
        throw `Expected code to be unreachable!`;
    }
    loadIndexManager(recordManager, blockManager, indexSchema) {
        return new stores_1.IndexManager(recordManager, blockManager, indexSchema.keys, {
            bid: indexSchema.bid
        });
    }
    loadSearchIndexManager(recordManager, blockManager, searchIndexSchema) {
        return new stores_1.SearchIndexManagerV1(recordManager, blockManager, searchIndexSchema.key, {
            bid: searchIndexSchema.bid
        });
    }
    loadRecordManager(blockManager, fieldsSchema) {
        let fields = {};
        for (let key in fieldsSchema) {
            fields[key] = this.loadFieldManager(blockManager, fieldsSchema[key]);
        }
        return new records_1.RecordManager(fields);
    }
    loadStoreManager(blockManager, oldSchema) {
        let fields = {};
        for (let key in oldSchema.fields) {
            fields[key] = this.loadFieldManager(blockManager, oldSchema.fields[key]);
        }
        let keys = oldSchema.keys;
        let orders = {};
        for (let order of oldSchema.orders) {
            orders[order.key] = this.loadOrderManager(order.order);
        }
        let recordManager = new records_1.RecordManager(fields);
        let storage = new tables_1.Table(blockManager, {
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
        return new stores_1.StoreManager(blockManager, fields, keys, orders, storage, indexManagers, searchIndexManagers);
    }
    loadLinkManager(blockManager, linkSchema, storeManagers) {
        let parent = storeManagers[linkSchema.parent];
        if (parent == null) {
            throw `Expected store with name "${linkSchema.parent}"!`;
        }
        let child = storeManagers[linkSchema.child];
        if (child == null) {
            throw `Expected store with name "${linkSchema.child}"!`;
        }
        let recordKeysMap = linkSchema.keysMap;
        let orders = {};
        for (let order of linkSchema.orders) {
            orders[order.key] = this.loadOrderManager(order.order);
        }
        return new links_1.LinkManager(parent, child, recordKeysMap, orders);
    }
    loadQueryManager(blockManager, querySchema, storeManagers) {
        let store = storeManagers[querySchema.store];
        if (store == null) {
            throw `Expected store with name "${querySchema.store}"!`;
        }
        let operators = {};
        for (let operator of querySchema.operators) {
            operators[operator.key] = this.loadOperatorManager(operator.operator);
        }
        let orders = {};
        for (let order of querySchema.orders) {
            orders[order.key] = this.loadOrderManager(order.order);
        }
        return new queries_1.QueryManager(store, operators, orders);
    }
    loadDatabaseManager(databaseSchema, blockManager) {
        let storeManagers = {};
        for (let key in databaseSchema.stores) {
            storeManagers[key] = this.loadStoreManager(blockManager, databaseSchema.stores[key]);
        }
        let linkManagers = {};
        for (let key in databaseSchema.links) {
            linkManagers[key] = this.loadLinkManager(blockManager, databaseSchema.links[key], storeManagers);
        }
        let queryManagers = {};
        for (let key in databaseSchema.queries) {
            queryManagers[key] = this.loadQueryManager(blockManager, databaseSchema.queries[key], storeManagers);
        }
        return new databases_1.DatabaseManager(storeManagers, linkManagers, queryManagers);
    }
    compareField(field, schema) {
        if (isSchemaCompatible(exports.BigIntFieldSchema, schema)) {
            if (field instanceof records_1.BigIntField) {
                return true;
            }
            if (field instanceof records_1.NullableBigIntField) {
                return true;
            }
            return false;
        }
        if (isSchemaCompatible(exports.NullableBigIntFieldSchema, schema)) {
            if (field instanceof records_1.NullableBigIntField) {
                return true;
            }
            return false;
        }
        if (isSchemaCompatible(exports.BinaryFieldSchema, schema)) {
            if (field instanceof records_1.BinaryField) {
                return true;
            }
            if (field instanceof records_1.NullableBinaryField) {
                return true;
            }
            return false;
        }
        if (isSchemaCompatible(exports.NullableBinaryFieldSchema, schema)) {
            if (field instanceof records_1.NullableBinaryField) {
                return true;
            }
            return false;
        }
        if (isSchemaCompatible(exports.BooleanFieldSchema, schema)) {
            if (field instanceof records_1.BooleanField) {
                return true;
            }
            if (field instanceof records_1.NullableBooleanField) {
                return true;
            }
            return false;
        }
        if (isSchemaCompatible(exports.NullableBooleanFieldSchema, schema)) {
            if (field instanceof records_1.NullableBooleanField) {
                return true;
            }
            return false;
        }
        if (isSchemaCompatible(exports.IntegerFieldSchema, schema)) {
            if (field instanceof records_1.IntegerField) {
                return true;
            }
            if (field instanceof records_1.NullableIntegerField) {
                return true;
            }
            return false;
        }
        if (isSchemaCompatible(exports.NullableIntegerFieldSchema, schema)) {
            if (field instanceof records_1.NullableIntegerField) {
                return true;
            }
            return false;
        }
        if (isSchemaCompatible(exports.NumberFieldSchema, schema)) {
            if (field instanceof records_1.NumberField) {
                return true;
            }
            if (field instanceof records_1.NullableNumberField) {
                return true;
            }
            return false;
        }
        if (isSchemaCompatible(exports.NullableNumberFieldSchema, schema)) {
            if (field instanceof records_1.NullableNumberField) {
                return true;
            }
            return false;
        }
        if (isSchemaCompatible(exports.StringFieldSchema, schema)) {
            if (field instanceof records_1.StringField) {
                return true;
            }
            if (field instanceof records_1.NullableStringField) {
                return true;
            }
            return false;
        }
        if (isSchemaCompatible(exports.NullableStringFieldSchema, schema)) {
            if (field instanceof records_1.NullableStringField) {
                return true;
            }
            return false;
        }
        throw `Expected code to be unreachable!`;
    }
    compareFields(fields, oldSchema) {
        for (let key in oldSchema) {
            if (fields[key] == null) {
                return false;
            }
        }
        for (let key in fields) {
            if (oldSchema[key] == null) {
                return false;
            }
            else {
                if (!this.compareField(fields[key], oldSchema[key])) {
                    return false;
                }
            }
        }
        return true;
    }
    compareKeys(keys, oldSchema) {
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
    compareIndex(index, oldSchema) {
        return this.compareKeys(oldSchema.keys, index.keys);
    }
    compareSearchIndex(searchIndex, oldSchema) {
        return oldSchema.key === searchIndex.key;
    }
    compareStore(store, oldSchema) {
        if (!this.compareKeys(store.keys, oldSchema.keys)) {
            return false;
        }
        if (!this.compareFields(store.fields, oldSchema.fields)) {
            return false;
        }
        return true;
    }
    compareLink(stores, link, oldSchema) {
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
            if (oldSchema.keysMap[key] !== link.recordKeysMap[key]) {
                return false;
            }
        }
        return true;
    }
    createField(field) {
        if (field instanceof records_1.BigIntField) {
            return {
                type: "BigIntField",
                defaultValue: field.getDefaultValue()
            };
        }
        if (field instanceof records_1.NullableBigIntField) {
            return {
                type: "NullableBigIntField",
                defaultValue: field.getDefaultValue()
            };
        }
        if (field instanceof records_1.BinaryField) {
            return {
                type: "BinaryField",
                defaultValue: field.getDefaultValue()
            };
        }
        if (field instanceof records_1.NullableBinaryField) {
            return {
                type: "NullableBinaryField",
                defaultValue: field.getDefaultValue()
            };
        }
        if (field instanceof records_1.BooleanField) {
            return {
                type: "BooleanField",
                defaultValue: field.getDefaultValue()
            };
        }
        if (field instanceof records_1.NullableBooleanField) {
            return {
                type: "NullableBooleanField",
                defaultValue: field.getDefaultValue()
            };
        }
        if (field instanceof records_1.IntegerField) {
            return {
                type: "IntegerField",
                defaultValue: field.getDefaultValue()
            };
        }
        if (field instanceof records_1.NullableIntegerField) {
            return {
                type: "NullableIntegerField",
                defaultValue: field.getDefaultValue()
            };
        }
        if (field instanceof records_1.NumberField) {
            return {
                type: "NumberField",
                defaultValue: field.getDefaultValue()
            };
        }
        if (field instanceof records_1.NullableNumberField) {
            return {
                type: "NullableNumberField",
                defaultValue: field.getDefaultValue()
            };
        }
        if (field instanceof records_1.StringField) {
            return {
                type: "StringField",
                defaultValue: field.getDefaultValue(),
                searchable: field.getSearchable()
            };
        }
        if (field instanceof records_1.NullableStringField) {
            return {
                type: "NullableStringField",
                defaultValue: field.getDefaultValue(),
                searchable: field.getSearchable()
            };
        }
        throw `Expected code to be unreachable!`;
    }
    createIndex(blockManager, index) {
        let schema = {
            keys: index.keys,
            bid: blockManager.createBlock(trees_1.RadixTree.INITIAL_SIZE)
        };
        return schema;
    }
    createSearchIndex(blockManager, searchIndex) {
        let schema = {
            key: searchIndex.key,
            bid: blockManager.createBlock(trees_1.RadixTree.INITIAL_SIZE)
        };
        return schema;
    }
    createStore(blockManager, store) {
        let version = 0;
        let fields = {};
        for (let key in store.fields) {
            fields[key] = this.createField(store.fields[key]);
        }
        let keys = store.keys;
        let orders = this.createKeyOrders(blockManager, store.orders);
        let indices = [];
        for (let index of store.indices) {
            indices.push(this.createIndex(blockManager, index));
        }
        let searchIndices = [];
        for (let searchIndex of store.searchIndices) {
            searchIndices.push(this.createSearchIndex(blockManager, searchIndex));
        }
        let schema = {
            version,
            fields,
            keys,
            orders,
            indices,
            searchIndices,
            storageBid: blockManager.createBlock(tables_1.Table.LENGTH)
        };
        return schema;
    }
    deleteStore(blockManager, oldSchema) {
        this.loadStoreManager(blockManager, oldSchema).delete();
    }
    deleteIndex(blockManager, indexSchema, fieldsSchema) {
        let recordManager = this.loadRecordManager(blockManager, fieldsSchema);
        this.loadIndexManager(recordManager, blockManager, indexSchema).delete();
    }
    deleteSearchIndex(blockManager, searchIndexSchema, fieldsSchema) {
        let recordManager = this.loadRecordManager(blockManager, fieldsSchema);
        this.loadSearchIndexManager(recordManager, blockManager, searchIndexSchema).delete();
    }
    updateStore(blockManager, store, oldSchema) {
        if (this.compareStore(store, oldSchema)) {
            let indices = [];
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
                let storage = new tables_1.Table(blockManager, {
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
            let searchIndices = [];
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
                let storage = new tables_1.Table(blockManager, {
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
        }
        else {
            let newSchema = this.createStore(blockManager, store);
            let oldManager = this.loadStoreManager(blockManager, oldSchema);
            let newManager = this.loadStoreManager(blockManager, newSchema);
            for (let oldRecord of oldManager) {
                try {
                    let newRecord = {};
                    for (let key in store.fields) {
                        let field = store.fields[key];
                        let codec = field.getCodec();
                        if (isSchemaCompatible(codec, oldRecord[key])) {
                            newRecord[key] = oldRecord[key];
                        }
                        else {
                            newRecord[key] = field.getDefaultValue();
                        }
                    }
                    newManager.insert(newRecord);
                }
                catch (error) { }
            }
            oldManager.delete();
            newSchema.version = oldSchema.version + 1;
            return newSchema;
        }
    }
    updateStores(blockManager, stores, oldSchema) {
        let newSchema = {};
        for (let key in oldSchema) {
            if (stores[key] == null) {
                this.deleteStore(blockManager, oldSchema[key]);
            }
        }
        for (let key in stores) {
            if (oldSchema[key] == null) {
                newSchema[key] = this.createStore(blockManager, stores[key]);
            }
            else {
                newSchema[key] = this.updateStore(blockManager, stores[key], oldSchema[key]);
            }
        }
        return newSchema;
    }
    createOperator(operator) {
        if (operator instanceof operators_1.EqualityOperator) {
            return {
                type: "EqualityOperator"
            };
        }
        throw `Expected code to be unreachable!`;
    }
    createKeyOperators(blockManager, operatorMap) {
        let operators = [];
        for (let key in operatorMap) {
            let operator = operatorMap[key];
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
    createOrder(order) {
        if (order instanceof orders_1.DecreasingOrder) {
            return {
                type: "DecreasingOrder"
            };
        }
        if (order instanceof orders_1.IncreasingOrder) {
            return {
                type: "IncreasingOrder"
            };
        }
        throw `Expected code to be unreachable!`;
    }
    createKeyOrders(blockManager, orderMap) {
        let orders = [];
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
    createLink(blockManager, stores, link) {
        let version = 0;
        let parent = this.getStoreName(link.parent, stores);
        let child = this.getStoreName(link.child, stores);
        let keysMap = link.recordKeysMap;
        let orders = this.createKeyOrders(blockManager, link.orders);
        return {
            version,
            parent,
            child,
            keysMap,
            orders
        };
    }
    deleteLink(blockManager, oldSchema) {
    }
    updateLink(blockManager, stores, link, oldSchema) {
        if (this.compareLink(stores, link, oldSchema)) {
            let orders = this.createKeyOrders(blockManager, link.orders);
            return {
                ...oldSchema,
                orders
            };
        }
        else {
            let newSchema = this.createLink(blockManager, stores, link);
            newSchema.version = oldSchema.version + 1;
            return newSchema;
        }
    }
    updateLinks(blockManager, stores, links, oldSchema) {
        let newSchema = {};
        for (let key in oldSchema) {
            if (links[key] == null) {
                this.deleteLink(blockManager, oldSchema[key]);
            }
        }
        for (let key in links) {
            if (oldSchema[key] == null) {
                newSchema[key] = this.createLink(blockManager, stores, links[key]);
            }
            else {
                newSchema[key] = this.updateLink(blockManager, stores, links[key], oldSchema[key]);
            }
        }
        return newSchema;
    }
    compareQuery(stores, query, oldSchema) {
        if (this.getStoreName(query.store, stores) !== oldSchema.store) {
            return false;
        }
        return true;
    }
    createQuery(blockManager, stores, query) {
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
    deleteQuery(blockManager, oldSchema) {
    }
    updateQuery(blockManager, stores, query, oldSchema) {
        if (this.compareQuery(stores, query, oldSchema)) {
            let operators = this.createKeyOperators(blockManager, query.operators);
            let orders = this.createKeyOrders(blockManager, query.orders);
            return {
                ...oldSchema,
                operators,
                orders
            };
        }
        else {
            let newSchema = this.createQuery(blockManager, stores, query);
            newSchema.version = oldSchema.version + 1;
            return newSchema;
        }
    }
    updateQueries(blockManager, stores, queries, oldSchema) {
        let newSchema = {};
        for (let key in oldSchema) {
            if (queries[key] == null) {
                this.deleteQuery(blockManager, oldSchema[key]);
            }
        }
        for (let key in queries) {
            if (oldSchema[key] == null) {
                newSchema[key] = this.createQuery(blockManager, stores, queries[key]);
            }
            else {
                newSchema[key] = this.updateQuery(blockManager, stores, queries[key], oldSchema[key]);
            }
        }
        return newSchema;
    }
    updateDatabase(blockManager, database, oldSchema) {
        let stores = this.updateStores(blockManager, database.stores, oldSchema.stores);
        let links = this.updateLinks(blockManager, database.stores, database.links, oldSchema.links);
        let queries = this.updateQueries(blockManager, database.stores, database.queries, oldSchema.queries);
        let newSchema = {
            stores,
            links,
            queries
        };
        return newSchema;
    }
    getDirtyStoreNames(oldSchema, newSchema) {
        let names = [];
        for (let key in newSchema) {
            if (newSchema[key].version !== oldSchema[key]?.version) {
                names.push(key);
            }
        }
        return names;
    }
    getDirtyLinkNames(oldSchema, newSchema) {
        let names = [];
        for (let key in newSchema) {
            if (newSchema[key].version !== oldSchema[key]?.version) {
                names.push(key);
            }
        }
        return names;
    }
    constructor() { }
    createDatabaseManager(file, database) {
        let blockManager = new blocks_1.BlockManager(file);
        if (blockManager.getBlockCount() === 0) {
            this.initializeDatabase(blockManager);
        }
        let oldSchema = exports.DatabaseSchema.decode(blockManager.readBlock(0), "schema");
        let newSchema = this.updateDatabase(blockManager, database, oldSchema);
        let buffer = exports.DatabaseSchema.encode(newSchema, "schema");
        blockManager.resizeBlock(0, buffer.length);
        blockManager.writeBlock(0, buffer);
        let databaseManager = this.loadDatabaseManager(newSchema, blockManager);
        let dirtyLinkNames = this.getDirtyLinkNames(oldSchema.links, newSchema.links);
        let dirtyStoreNames = this.getDirtyStoreNames(oldSchema.stores, newSchema.stores);
        databaseManager.enforceConsistency(dirtyStoreNames, dirtyLinkNames);
        file.persist();
        return databaseManager;
    }
}
exports.SchemaManager = SchemaManager;
;
