"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Context = exports.OperatorReference = exports.OrderReference = exports.QueryReference = exports.LinkReference = exports.StoreReference = exports.FieldReference = exports.FileReference = void 0;
const link_1 = require("./link");
const store_1 = require("./store");
const records_1 = require("./records");
const orders_1 = require("./orders");
const files_1 = require("./files");
const database_1 = require("./database");
const operators_1 = require("./operators");
const schema_1 = require("./schema");
const queries_1 = require("./queries");
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
class QueryReference {
    QueryReference;
}
exports.QueryReference = QueryReference;
;
class OrderReference {
    OrderReference;
}
exports.OrderReference = OrderReference;
;
class OperatorReference {
    OperatorReference;
}
exports.OperatorReference = OperatorReference;
;
class Context {
    files;
    fields;
    links;
    stores;
    queries;
    operators;
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
    getQuery(reference) {
        let query = this.queries.get(reference);
        if (query == null) {
            throw `Expected query to be defined in context!`;
        }
        return query;
    }
    getOperator(reference) {
        let operator = this.operators.get(reference);
        if (operator == null) {
            throw `Expected operator to be defined in context!`;
        }
        return operator;
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
        this.queries = new Map();
        this.operators = new Map();
        this.orders = new Map();
        this.databaseManagers = new Map();
    }
    createBigIntField() {
        let reference = new FieldReference();
        let field = new records_1.BigIntField(0n);
        this.fields.set(reference, field);
        return reference;
    }
    createNullableBigIntField() {
        let reference = new FieldReference();
        let field = new records_1.NullableBigIntField(null);
        this.fields.set(reference, field);
        return reference;
    }
    createBinaryField() {
        let reference = new FieldReference();
        let field = new records_1.BinaryField(Uint8Array.of());
        this.fields.set(reference, field);
        return reference;
    }
    createNullableBinaryField() {
        let reference = new FieldReference();
        let field = new records_1.NullableBinaryField(null);
        this.fields.set(reference, field);
        return reference;
    }
    createBooleanField() {
        let reference = new FieldReference();
        let field = new records_1.BooleanField(false);
        this.fields.set(reference, field);
        return reference;
    }
    createNullableBooleanField() {
        let reference = new FieldReference();
        let field = new records_1.NullableBooleanField(null);
        this.fields.set(reference, field);
        return reference;
    }
    createIntegerField() {
        let reference = new FieldReference();
        let field = new records_1.IntegerField(0);
        this.fields.set(reference, field);
        return reference;
    }
    createNullableIntegerField() {
        let reference = new FieldReference();
        let field = new records_1.NullableIntegerField(null);
        this.fields.set(reference, field);
        return reference;
    }
    createNumberField() {
        let reference = new FieldReference();
        let field = new records_1.NumberField(0);
        this.fields.set(reference, field);
        return reference;
    }
    createNullableNumberField() {
        let reference = new FieldReference();
        let field = new records_1.NullableNumberField(null);
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
        // TODO: Create indices.
        let link = new link_1.Link(this.getStore(parent), this.getStore(child), recordKeysMap, orders);
        this.links.set(reference, link);
        return reference;
    }
    createStore(fieldReferences, keys, orderReferences) {
        orderReferences = orderReferences ?? {};
        let fields = {};
        for (let key in fieldReferences) {
            fields[key] = this.getField(fieldReferences[key]);
        }
        let orders = {};
        for (let key in orderReferences) {
            orders[key] = this.getOrder(orderReferences[key]);
        }
        let reference = new StoreReference();
        let store = new store_1.Store(fields, keys, orders);
        this.stores.set(reference, store);
        return reference;
    }
    createQuery(storeReference, operatorReferences) {
        let store = this.getStore(storeReference);
        let operators = {};
        for (let key in operatorReferences) {
            operators[key] = this.getOperator(operatorReferences[key]);
        }
        // TODO: Create indices.
        let reference = new QueryReference();
        let query = new queries_1.Query(store, operators);
        this.queries.set(reference, query);
        return reference;
    }
    createEqualityOperator() {
        let reference = new OperatorReference();
        let operator = new operators_1.EqualityOperator();
        this.operators.set(reference, operator);
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
