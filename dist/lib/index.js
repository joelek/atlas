"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEqualityFilter = exports.createDecreasingOrder = exports.createIncreasingOrder = exports.createContext = void 0;
const contexts_1 = require("./contexts");
const orders_1 = require("./orders");
const filters_1 = require("./filters");
function createContext() {
    return new contexts_1.Context();
}
exports.createContext = createContext;
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
