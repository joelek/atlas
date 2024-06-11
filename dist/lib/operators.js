"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GreaterThanOperator = exports.EqualityOperator = exports.Operator = void 0;
const filters_1 = require("./filters");
class Operator {
    constructor() { }
}
exports.Operator = Operator;
;
class EqualityOperator extends Operator {
    constructor() {
        super();
    }
    createFilter(value) {
        return new filters_1.EqualityFilter(value);
    }
}
exports.EqualityOperator = EqualityOperator;
;
class GreaterThanOperator extends Operator {
    constructor() {
        super();
    }
    createFilter(value) {
        return new filters_1.GreaterThanFilter(value);
    }
}
exports.GreaterThanOperator = GreaterThanOperator;
;
