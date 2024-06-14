"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLessThanFilter = exports.createGreaterThanFilter = exports.createEqualityFilter = exports.createDecreasingOrder = exports.createIncreasingOrder = exports.createTransactionManager = exports.createContext = void 0;
const contexts_1 = require("./contexts");
const orders_1 = require("./orders");
const filters_1 = require("./filters");
function createContext() {
    return new contexts_1.Context();
}
exports.createContext = createContext;
;
function createTransactionManager(path, schemaProvider) {
    let context = new contexts_1.Context();
    let schema = schemaProvider(context);
    return context.createTransactionManager(path, schema.stores, schema.links, schema.queries);
}
exports.createTransactionManager = createTransactionManager;
;
function createIncreasingOrder() {
    return new orders_1.IncreasingOrder();
}
exports.createIncreasingOrder = createIncreasingOrder;
;
function createDecreasingOrder() {
    return new orders_1.DecreasingOrder();
}
exports.createDecreasingOrder = createDecreasingOrder;
;
function createEqualityFilter(value) {
    return new filters_1.EqualityFilter(value);
}
exports.createEqualityFilter = createEqualityFilter;
;
function createGreaterThanFilter(value) {
    return new filters_1.GreaterThanFilter(value);
}
exports.createGreaterThanFilter = createGreaterThanFilter;
;
function createLessThanFilter(value) {
    return new filters_1.LessThanFilter(value);
}
exports.createLessThanFilter = createLessThanFilter;
;
