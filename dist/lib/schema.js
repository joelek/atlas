"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaManager = exports.isSchemaCompatible = exports.DatabaseSchema = exports.LinksSchema = exports.LinkSchema = exports.KeysMapSchema = exports.KeyOrdersSchema = exports.KeyOrderSchema = exports.OrderSchema = exports.IncreasingOrderSchema = exports.DecreasingOrderSchema = exports.StoresSchema = exports.StoreSchema = exports.IndicesSchema = exports.IndexSchema = exports.KeysSchema = exports.FieldsSchema = exports.FieldSchema = exports.NullableStringFieldSchema = exports.StringFieldSchema = exports.BooleanFieldSchema = exports.BinaryFieldSchema = void 0;
const bedrock = require("@joelek/bedrock");
const database_1 = require("./database");
const hash_1 = require("./hash");
const link_1 = require("./link");
const orders_1 = require("./orders");
const records_1 = require("./records");
const store_1 = require("./store");
const vfs_1 = require("./vfs");
exports.BinaryFieldSchema = bedrock.codecs.Object.of({
    type: bedrock.codecs.StringLiteral.of("BinaryField"),
    defaultValue: bedrock.codecs.Binary
});
exports.BooleanFieldSchema = bedrock.codecs.Object.of({
    type: bedrock.codecs.StringLiteral.of("BooleanField"),
    defaultValue: bedrock.codecs.Boolean
});
exports.StringFieldSchema = bedrock.codecs.Object.of({
    type: bedrock.codecs.StringLiteral.of("StringField"),
    defaultValue: bedrock.codecs.String
});
exports.NullableStringFieldSchema = bedrock.codecs.Object.of({
    type: bedrock.codecs.StringLiteral.of("NullableStringField"),
    defaultValue: bedrock.codecs.Union.of(bedrock.codecs.String, bedrock.codecs.Null)
});
exports.FieldSchema = bedrock.codecs.Union.of(exports.BinaryFieldSchema, exports.BooleanFieldSchema, exports.StringFieldSchema, exports.NullableStringFieldSchema);
exports.FieldsSchema = bedrock.codecs.Record.of(exports.FieldSchema);
exports.KeysSchema = bedrock.codecs.Array.of(bedrock.codecs.String);
exports.IndexSchema = bedrock.codecs.Object.of({
    keys: exports.KeysSchema,
    bid: bedrock.codecs.Integer
});
exports.IndicesSchema = bedrock.codecs.Array.of(exports.IndexSchema);
exports.StoreSchema = bedrock.codecs.Object.of({
    version: bedrock.codecs.Integer,
    fields: exports.FieldsSchema,
    keys: exports.KeysSchema,
    indices: exports.IndicesSchema,
    storageBid: bedrock.codecs.Integer
});
exports.StoresSchema = bedrock.codecs.Record.of(exports.StoreSchema);
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
exports.LinkSchema = bedrock.codecs.Object.of({
    version: bedrock.codecs.Integer,
    parent: bedrock.codecs.String,
    child: bedrock.codecs.String,
    keysMap: exports.KeysMapSchema,
    orders: exports.KeyOrdersSchema
});
exports.LinksSchema = bedrock.codecs.Record.of(exports.LinkSchema);
exports.DatabaseSchema = bedrock.codecs.Object.of({
    stores: exports.StoresSchema,
    links: exports.LinksSchema
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
    initializeDatabase(blockHandler) {
        let databaseSchema = {
            stores: {},
            links: {}
        };
        let buffer = exports.DatabaseSchema.encode(databaseSchema);
        blockHandler.createBlock(buffer.length);
        blockHandler.writeBlock(0, buffer);
    }
    loadFieldManager(blockHandler, fieldSchema) {
        if (isSchemaCompatible(exports.BinaryFieldSchema, fieldSchema)) {
            return new records_1.BinaryFieldManager(fieldSchema.defaultValue);
        }
        if (isSchemaCompatible(exports.BooleanFieldSchema, fieldSchema)) {
            return new records_1.BooleanFieldManager(fieldSchema.defaultValue);
        }
        if (isSchemaCompatible(exports.StringFieldSchema, fieldSchema)) {
            return new records_1.StringFieldManager(fieldSchema.defaultValue);
        }
        if (isSchemaCompatible(exports.NullableStringFieldSchema, fieldSchema)) {
            return new records_1.NullableStringFieldManager(fieldSchema.defaultValue);
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
    loadStoreManager(blockHandler, oldSchema) {
        let fieldManagers = {};
        for (let key in oldSchema.fields) {
            fieldManagers[key] = this.loadFieldManager(blockHandler, oldSchema.fields[key]);
        }
        let keys = oldSchema.keys;
        // TODO: Create index managers.
        let recordManager = new records_1.RecordManager(fieldManagers);
        let storage = new hash_1.Table(blockHandler, {
            getKeyFromValue: (value) => {
                let buffer = blockHandler.readBlock(value);
                let record = recordManager.decode(buffer);
                return recordManager.encodeKeys(keys, record);
            }
        }, {
            bid: oldSchema.storageBid
        });
        return new store_1.StoreManager(blockHandler, fieldManagers, keys, storage);
    }
    loadLinkManager(blockHandler, linkSchema, storeManagers) {
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
        return new link_1.LinkManager(parent, child, recordKeysMap, orders);
    }
    loadDatabaseManager(databaseSchema, blockHandler) {
        let storeManagers = {};
        for (let key in databaseSchema.stores) {
            storeManagers[key] = this.loadStoreManager(blockHandler, databaseSchema.stores[key]);
        }
        let linkManagers = {};
        for (let key in databaseSchema.links) {
            linkManagers[key] = this.loadLinkManager(blockHandler, databaseSchema.links[key], storeManagers);
        }
        return new database_1.DatabaseManager(storeManagers, linkManagers);
    }
    compareField(field, schema) {
        if (isSchemaCompatible(exports.BinaryFieldSchema, schema)) {
            if (field instanceof records_1.BinaryField) {
                return true;
            }
            return false;
        }
        if (isSchemaCompatible(exports.BooleanFieldSchema, schema)) {
            if (field instanceof records_1.BooleanField) {
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
        if (field instanceof records_1.BinaryField) {
            return {
                type: "BinaryField",
                defaultValue: field.defaultValue
            };
        }
        if (field instanceof records_1.BooleanField) {
            return {
                type: "BooleanField",
                defaultValue: field.defaultValue
            };
        }
        if (field instanceof records_1.StringField) {
            return {
                type: "StringField",
                defaultValue: field.defaultValue
            };
        }
        if (field instanceof records_1.NullableStringField) {
            return {
                type: "NullableStringField",
                defaultValue: field.defaultValue
            };
        }
        throw `Expected code to be unreachable!`;
    }
    createStore(blockHandler, store) {
        let version = 0;
        let fields = {};
        for (let key in store.fields) {
            fields[key] = this.createField(store.fields[key]);
        }
        let keys = store.keys;
        let indices = [];
        for (let i = 0; i < store.indices.length; i++) {
            // TODO: Handle indices.
        }
        let schema = {
            version,
            fields,
            keys,
            indices,
            storageBid: blockHandler.createBlock(hash_1.Table.LENGTH)
        };
        return schema;
    }
    deleteStore(blockHandler, oldSchema) {
        this.loadStoreManager(blockHandler, oldSchema).delete();
    }
    updateStore(blockHandler, store, oldSchema) {
        if (this.compareStore(store, oldSchema)) {
            let indices = [];
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
        }
        else {
            let newSchema = this.createStore(blockHandler, store);
            let oldManager = this.loadStoreManager(blockHandler, oldSchema);
            let newManager = this.loadStoreManager(blockHandler, newSchema);
            for (let entry of oldManager) {
                try {
                    let oldRecord = entry.record();
                    let newRecord = {};
                    for (let key in store.fields) {
                        let fieldManager = store.fields[key].createManager();
                        let codec = fieldManager.getCodec();
                        if (isSchemaCompatible(codec, oldRecord[key])) {
                            newRecord[key] = oldRecord[key];
                        }
                        else {
                            newRecord[key] = store.fields[key].defaultValue;
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
    updateStores(blockHandler, stores, oldSchema) {
        let newSchema = {};
        for (let key in oldSchema) {
            if (stores[key] == null) {
                this.deleteStore(blockHandler, oldSchema[key]);
            }
        }
        for (let key in stores) {
            if (oldSchema[key] == null) {
                newSchema[key] = this.createStore(blockHandler, stores[key]);
            }
            else {
                newSchema[key] = this.updateStore(blockHandler, stores[key], oldSchema[key]);
            }
        }
        return newSchema;
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
    createKeyOrders(blockHandler, link) {
        let orders = [];
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
    createLink(blockHandler, stores, link) {
        let version = 0;
        let parent = this.getStoreName(link.parent, stores);
        let child = this.getStoreName(link.child, stores);
        let keysMap = link.recordKeysMap;
        let orders = this.createKeyOrders(blockHandler, link);
        return {
            version,
            parent,
            child,
            keysMap,
            orders
        };
    }
    deleteLink(blockHandler, oldSchema) {
    }
    updateLink(blockHandler, stores, link, oldSchema) {
        if (this.compareLink(stores, link, oldSchema)) {
            let orders = this.createKeyOrders(blockHandler, link);
            return {
                ...oldSchema,
                orders
            };
        }
        else {
            let newSchema = this.createLink(blockHandler, stores, link);
            newSchema.version = oldSchema.version + 1;
            return newSchema;
        }
    }
    updateLinks(blockHandler, stores, links, oldSchema) {
        let newSchema = {};
        for (let key in oldSchema) {
            if (links[key] == null) {
                this.deleteLink(blockHandler, oldSchema[key]);
            }
        }
        for (let key in links) {
            if (oldSchema[key] == null) {
                newSchema[key] = this.createLink(blockHandler, stores, links[key]);
            }
            else {
                newSchema[key] = this.updateLink(blockHandler, stores, links[key], oldSchema[key]);
            }
        }
        return newSchema;
    }
    updateDatabase(blockHandler, database, oldSchema) {
        let stores = this.updateStores(blockHandler, database.stores, oldSchema.stores);
        let links = this.updateLinks(blockHandler, database.stores, database.links, oldSchema.links);
        let newSchema = {
            stores,
            links
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
        let blockHandler = new vfs_1.BlockHandler(file);
        if (blockHandler.getBlockCount() === 0) {
            this.initializeDatabase(blockHandler);
        }
        let oldSchema = exports.DatabaseSchema.decode(blockHandler.readBlock(0));
        let newSchema = this.updateDatabase(blockHandler, database, oldSchema);
        let buffer = exports.DatabaseSchema.encode(newSchema);
        blockHandler.resizeBlock(0, buffer.length);
        blockHandler.writeBlock(0, buffer);
        let databaseManager = this.loadDatabaseManager(newSchema, blockHandler);
        let dirtyLinkNames = this.getDirtyLinkNames(oldSchema.links, newSchema.links);
        let dirtyStoreNames = this.getDirtyStoreNames(oldSchema.stores, newSchema.stores);
        databaseManager.enforceConsistency(dirtyStoreNames, dirtyLinkNames);
        file.persist();
        return databaseManager;
    }
}
exports.SchemaManager = SchemaManager;
;
