"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Query = exports.QueryManager = void 0;
class QueryManager {
    storeManager;
    operators;
    constructor(storeManager, operators) {
        this.storeManager = storeManager;
        this.operators = operators;
    }
    filter(parameters) {
        let filters = {};
        for (let key in this.operators) {
            filters[key] = this.operators[key].createFilter(parameters[key]);
        }
        return this.storeManager.filter(filters);
    }
}
exports.QueryManager = QueryManager;
;
class Query {
    store;
    operators;
    constructor(store, operators) {
        this.store = store;
        this.operators = operators;
    }
}
exports.Query = Query;
;
