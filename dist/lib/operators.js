"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LessThanOrEqualOperator = exports.LessThanOperator = exports.GreaterThanOrEqualOperator = exports.GreaterThanOperator = exports.EqualityOperator = exports.Operator = void 0;
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
class GreaterThanOrEqualOperator extends Operator {
    constructor() {
        super();
    }
    createFilter(value) {
        return new filters_1.GreaterThanOrEqualFilter(value);
    }
}
exports.GreaterThanOrEqualOperator = GreaterThanOrEqualOperator;
;
class LessThanOperator extends Operator {
    constructor() {
        super();
    }
    createFilter(value) {
        return new filters_1.LessThanFilter(value);
    }
}
exports.LessThanOperator = LessThanOperator;
;
class LessThanOrEqualOperator extends Operator {
    constructor() {
        super();
    }
    createFilter(value) {
        return new filters_1.LessThanOrEqualFilter(value);
    }
}
exports.LessThanOrEqualOperator = LessThanOrEqualOperator;
;
