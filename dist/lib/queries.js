"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OverridableWritableQuery = exports.Query = exports.QueryManager = exports.WritableQueryManager = void 0;
const operators_1 = require("./operators");
const stores_1 = require("./stores");
;
;
class WritableQueryManager {
    queryManager;
    constructor(queryManager) {
        this.queryManager = queryManager;
    }
    async filter(...parameters) {
        return this.queryManager.filter(...parameters);
    }
}
exports.WritableQueryManager = WritableQueryManager;
;
class QueryManager {
    storeManager;
    operators;
    orders;
    constructor(storeManager, operators, orders) {
        this.storeManager = storeManager;
        this.operators = operators;
        this.orders = orders;
    }
    filter(parameters) {
        let filters = {};
        for (let key in this.operators) {
            filters[key] = this.operators[key].createFilter(parameters[key]);
        }
        let orders = {};
        for (let key in this.orders) {
            orders[key] = this.orders[key];
        }
        return this.storeManager.filter(filters, orders);
    }
}
exports.QueryManager = QueryManager;
;
class Query {
    store;
    operators;
    orders;
    constructor(store, operators, orders) {
        this.store = store;
        this.operators = operators;
        this.orders = orders;
        this.store.index(new stores_1.Index(this.createIndexKeys()));
    }
    createIndexKeys() {
        let keys = [];
        for (let key in this.operators) {
            let operator = this.operators[key];
            if (operator instanceof operators_1.EqualityOperator) {
                keys.push(key);
            }
        }
        for (let key in this.orders) {
            let order = this.orders[key];
            if (order != null) {
                keys.push(key);
            }
        }
        for (let key of this.store.keys) {
            let order = this.orders[key];
            if (order == null) {
                keys.push(key);
            }
        }
        return keys;
    }
}
exports.Query = Query;
;
class OverridableWritableQuery {
    queryManager;
    overrides;
    constructor(queryManager, overrides) {
        this.queryManager = queryManager;
        this.overrides = overrides;
    }
    async filter(...parameters) {
        return this.overrides.filter?.(...parameters) ?? this.queryManager.filter(...parameters);
    }
}
exports.OverridableWritableQuery = OverridableWritableQuery;
;
