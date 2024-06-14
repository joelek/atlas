"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Context = exports.OperatorReference = exports.OrderReference = exports.QueryReference = exports.LinkReference = exports.StoreReference = exports.FieldReference = void 0;
const links_1 = require("./links");
const stores_1 = require("./stores");
const records_1 = require("./records");
const transactions_1 = require("./transactions");
const orders_1 = require("./orders");
const files_1 = require("./files");
const databases_1 = require("./databases");
const operators_1 = require("./operators");
const schemas_1 = require("./schemas");
const queries_1 = require("./queries");
const blocks_1 = require("./blocks");
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
    fields;
    links;
    stores;
    queries;
    operators;
    orders;
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
    createFile(path) {
        let bin = new files_1.PhysicalFile(`${path}.bin`);
        let log = new files_1.PhysicalFile(`${path}.log`);
        let file = new files_1.PagedDurableFile(new files_1.PagedFile(bin, bin.hint().pageSizeLog2, 16384), new files_1.PagedFile(log, log.hint().pageSizeLog2, 16384), bin.hint().pageSizeLog2);
        return file;
    }
    constructor() {
        this.fields = new Map();
        this.links = new Map();
        this.stores = new Map();
        this.queries = new Map();
        this.operators = new Map();
        this.orders = new Map();
    }
    createBigIntField(options) {
        let reference = new FieldReference();
        let field = new records_1.BigIntField(options?.defaultValue ?? 0n, options?.unique);
        this.fields.set(reference, field);
        return reference;
    }
    createNullableBigIntField(options) {
        let reference = new FieldReference();
        let field = new records_1.NullableBigIntField(options?.defaultValue ?? null, options?.unique);
        this.fields.set(reference, field);
        return reference;
    }
    createBinaryField(options) {
        let reference = new FieldReference();
        let field = new records_1.BinaryField(options?.defaultValue ?? Uint8Array.of(), options?.unique);
        this.fields.set(reference, field);
        return reference;
    }
    createNullableBinaryField(options) {
        let reference = new FieldReference();
        let field = new records_1.NullableBinaryField(options?.defaultValue ?? null, options?.unique);
        this.fields.set(reference, field);
        return reference;
    }
    createBooleanField(options) {
        let reference = new FieldReference();
        let field = new records_1.BooleanField(options?.defaultValue ?? false, options?.unique);
        this.fields.set(reference, field);
        return reference;
    }
    createNullableBooleanField(options) {
        let reference = new FieldReference();
        let field = new records_1.NullableBooleanField(options?.defaultValue ?? null, options?.unique);
        this.fields.set(reference, field);
        return reference;
    }
    createIntegerField(options) {
        let reference = new FieldReference();
        let field = new records_1.IntegerField(options?.defaultValue ?? 0, options?.unique);
        this.fields.set(reference, field);
        return reference;
    }
    createNullableIntegerField(options) {
        let reference = new FieldReference();
        let field = new records_1.NullableIntegerField(options?.defaultValue ?? null, options?.unique);
        this.fields.set(reference, field);
        return reference;
    }
    createNumberField(options) {
        let reference = new FieldReference();
        let field = new records_1.NumberField(options?.defaultValue ?? 0, options?.unique);
        this.fields.set(reference, field);
        return reference;
    }
    createNullableNumberField(options) {
        let reference = new FieldReference();
        let field = new records_1.NullableNumberField(options?.defaultValue ?? null, options?.unique);
        this.fields.set(reference, field);
        return reference;
    }
    createStringField(options) {
        let reference = new FieldReference();
        let field = new records_1.StringField(options?.defaultValue ?? "", options?.unique, options?.searchable);
        this.fields.set(reference, field);
        return reference;
    }
    createNullableStringField(options) {
        let reference = new FieldReference();
        let field = new records_1.NullableStringField(options?.defaultValue ?? null, options?.unique, options?.searchable);
        this.fields.set(reference, field);
        return reference;
    }
    createLink(parent, child, recordKeysMap, orderReferences) {
        let reference = new LinkReference();
        let orders = {};
        for (let key in orderReferences) {
            let orderReference = orderReferences[key]; // TypeScript 4.0 cannot infer type properly.
            if (orderReference == null) {
                continue;
            }
            orders[key] = this.getOrder(orderReference);
        }
        let link = new links_1.Link(this.getStore(parent), this.getStore(child), recordKeysMap, orders);
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
        let store = new stores_1.Store(fields, keys, orders);
        this.stores.set(reference, store);
        return reference;
    }
    createQuery(storeReference, operatorReferences, orderReferences) {
        orderReferences = orderReferences ?? {};
        let store = this.getStore(storeReference);
        let operators = {};
        for (let key in operatorReferences) {
            operators[key] = this.getOperator(operatorReferences[key]);
        }
        let orders = {};
        for (let key in orderReferences) {
            orders[key] = this.getOrder(orderReferences[key]);
        }
        let reference = new QueryReference();
        let query = new queries_1.Query(store, operators, orders);
        this.queries.set(reference, query);
        return reference;
    }
    createEqualityOperator() {
        let reference = new OperatorReference();
        let operator = new operators_1.EqualityOperator();
        this.operators.set(reference, operator);
        return reference;
    }
    createGreaterThanOperator() {
        let reference = new OperatorReference();
        let operator = new operators_1.GreaterThanOperator();
        this.operators.set(reference, operator);
        return reference;
    }
    createGreaterThanOrEqualOperator() {
        let reference = new OperatorReference();
        let operator = new operators_1.GreaterThanOrEqualOperator();
        this.operators.set(reference, operator);
        return reference;
    }
    createLessThanOperator() {
        let reference = new OperatorReference();
        let operator = new operators_1.LessThanOperator();
        this.operators.set(reference, operator);
        return reference;
    }
    createLessThanOrEqualOperator() {
        let reference = new OperatorReference();
        let operator = new operators_1.LessThanOrEqualOperator();
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
    createTransactionManager(path, storeReferences, linkReferences, queryReferences) {
        let file = this.createFile(path);
        let blockManager = new blocks_1.BlockManager(file);
        let stores = {};
        for (let key in storeReferences) {
            stores[key] = this.getStore(storeReferences[key]);
        }
        let links = {};
        for (let key in linkReferences) {
            links[key] = this.getLink(linkReferences[key]);
        }
        let queries = {};
        for (let key in queryReferences) {
            queries[key] = this.getQuery(queryReferences[key]);
        }
        let schemaManager = new schemas_1.SchemaManager();
        let database = new databases_1.Database(stores, links, queries);
        let databaseManager = schemaManager.createDatabaseManager(file, blockManager, database);
        let databaseStores = databaseManager.createDatabaseStores();
        let databaseLinks = databaseManager.createDatabaseLinks();
        let databaseQueries = databaseManager.createDatabaseQueries();
        let transactionManager = new transactions_1.TransactionManager(file, databaseStores, databaseLinks, databaseQueries, {
            onDiscard: () => {
                blockManager.reload();
                databaseManager.reload();
            }
        });
        return transactionManager;
    }
}
exports.Context = Context;
;
