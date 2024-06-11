"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Query = exports.QueryManager = void 0;
const operators_1 = require("./operators");
const stores_1 = require("./stores");
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
    filter(parameters, anchorKeysRecord, limit) {
        let filters = {};
        for (let key in this.operators) {
            filters[key] = this.operators[key].createFilter(parameters[key]);
        }
        let orders = {};
        for (let key in this.orders) {
            orders[key] = this.orders[key];
        }
        return this.storeManager.filter(filters, orders, anchorKeysRecord, limit);
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
        this.store.index(this.createIndex());
    }
    createIndex() {
        let keys = [];
        for (let key in this.operators) {
            let operator = this.operators[key];
            if (operator instanceof operators_1.EqualityOperator) {
                if (!keys.includes(key)) {
                    keys.push(key);
                }
            }
        }
        for (let key in this.operators) {
            let operator = this.operators[key];
            if (!(operator instanceof operators_1.EqualityOperator)) {
                if (!keys.includes(key)) {
                    keys.push(key);
                }
            }
        }
        for (let key in this.orders) {
            let order = this.orders[key];
            if (order == null) {
                continue;
            }
            if (!keys.includes(key)) {
                keys.push(key);
            }
        }
        for (let key of this.store.keys) {
            if (!keys.includes(key)) {
                keys.push(key);
            }
        }
        return new stores_1.Index(keys);
    }
}
exports.Query = Query;
;
