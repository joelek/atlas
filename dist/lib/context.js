"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Context = exports.OrderReference = exports.LinkReference = exports.StoreReference = exports.FieldReference = exports.FileReference = void 0;
const link_1 = require("./link");
const store_1 = require("./store");
const records_1 = require("./records");
const orders_1 = require("./orders");
const files_1 = require("./files");
const database_1 = require("./database");
const schema_1 = require("./schema");
class FileReference {
    FileReference;
}
exports.FileReference = FileReference;
;
class FieldReference {
    FieldReference;
}
exports.FieldReference = FieldReference;
;
class StoreReference {
    StoreReference;
}
exports.StoreReference = StoreReference;
;
class LinkReference {
    LinkReference;
}
exports.LinkReference = LinkReference;
;
class OrderReference {
    OrderReference;
}
exports.OrderReference = OrderReference;
;
class Context {
    files;
    fields;
    links;
    stores;
    orders;
    databaseManagers;
    getFile(reference) {
        let file = this.files.get(reference);
        if (file == null) {
            throw `Expected file to be defined in context!`;
        }
        return file;
    }
    getField(reference) {
        let field = this.fields.get(reference);
        if (field == null) {
            throw `Expected field to be defined in context!`;
        }
        return field;
    }
    getLink(reference) {
        let link = this.links.get(reference);
        if (link == null) {
            throw `Expected link to be defined in context!`;
        }
        return link;
    }
    getStore(reference) {
        let store = this.stores.get(reference);
        if (store == null) {
            throw `Expected store to be defined in context!`;
        }
        return store;
    }
    getOrder(reference) {
        let order = this.orders.get(reference);
        if (order == null) {
            throw `Expected order to be defined in context!`;
        }
        return order;
    }
    constructor() {
        this.files = new Map();
        this.fields = new Map();
        this.links = new Map();
        this.stores = new Map();
        this.orders = new Map();
        this.databaseManagers = new Map();
    }
    createBigIntField() {
        let reference = new FieldReference();
        let field = new records_1.BigIntField(0n);
        this.fields.set(reference, field);
        return reference;
    }
    createBinaryField() {
        let reference = new FieldReference();
        let field = new records_1.BinaryField(Uint8Array.of());
        this.fields.set(reference, field);
        return reference;
    }
    createBooleanField() {
        let reference = new FieldReference();
        let field = new records_1.BooleanField(false);
        this.fields.set(reference, field);
        return reference;
    }
    createIntegerField() {
        let reference = new FieldReference();
        let field = new records_1.IntegerField(0);
        this.fields.set(reference, field);
        return reference;
    }
    createNumberField() {
        let reference = new FieldReference();
        let field = new records_1.NumberField(0);
        this.fields.set(reference, field);
        return reference;
    }
    createStringField() {
        let reference = new FieldReference();
        let field = new records_1.StringField("");
        this.fields.set(reference, field);
        return reference;
    }
    createNullableStringField() {
        let reference = new FieldReference();
        let field = new records_1.NullableStringField(null);
        this.fields.set(reference, field);
        return reference;
    }
    createLink(parent, child, recordKeysMap, orderReferences) {
        let reference = new LinkReference();
        let orders = {};
        for (let key in orderReferences) {
            let orderReference = orderReferences[key];
            if (orderReference == null) {
                continue;
            }
            orders[key] = this.getOrder(orderReference);
        }
        let link = new link_1.Link(this.getStore(parent), this.getStore(child), recordKeysMap, orders);
        this.links.set(reference, link);
        return reference;
    }
    createStore(fieldReferences, keys) {
        let reference = new StoreReference();
        let fields = {};
        for (let key in fieldReferences) {
            fields[key] = this.getField(fieldReferences[key]);
        }
        let store = new store_1.Store(fields, keys);
        this.stores.set(reference, store);
        return reference;
    }
    createDecreasingOrder() {
        let reference = new OrderReference();
        let order = new orders_1.DecreasingOrder();
        this.orders.set(reference, order);
        return reference;
    }
    createIncreasingOrder() {
        let reference = new OrderReference();
        let order = new orders_1.IncreasingOrder();
        this.orders.set(reference, order);
        return reference;
    }
    createDiskStorage(path) {
        let reference = new FileReference();
        let bin = new files_1.CachedFile(new files_1.PhysicalFile(`${path}.bin`), 64 * 1024 * 1024);
        let log = new files_1.CachedFile(new files_1.PhysicalFile(`${path}.log`), 64 * 1024 * 1024);
        let file = new files_1.DurableFile(bin, log);
        this.files.set(reference, file);
        return reference;
    }
    createMemoryStorage() {
        let reference = new FileReference();
        let file = new files_1.VirtualFile(0);
        this.files.set(reference, file);
        return reference;
    }
    createTransactionManager(fileReference, storeReferences, linkReferences) {
        if (this.databaseManagers.has(fileReference)) {
            throw `Expected given storage to not be in use by another database!`;
        }
        storeReferences = storeReferences ?? {};
        linkReferences = linkReferences ?? {};
        let file = this.getFile(fileReference);
        let stores = {};
        for (let key in storeReferences) {
            stores[key] = this.getStore(storeReferences[key]);
        }
        let links = {};
        for (let key in linkReferences) {
            links[key] = this.getLink(linkReferences[key]);
        }
        let schemaManager = new schema_1.SchemaManager();
        let database = new database_1.Database(stores, links);
        let databaseManager = schemaManager.createDatabaseManager(file, database);
        this.databaseManagers.set(fileReference, databaseManager);
        let transactionManager = databaseManager.createTransactionManager(file);
        return transactionManager;
    }
}
exports.Context = Context;
;
