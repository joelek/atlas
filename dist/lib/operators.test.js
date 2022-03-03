"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const filters_1 = require("./filters");
const operators_1 = require("./operators");
const test_1 = require("./test");
(0, test_1.test)(`It should create a filter (EqualityOperator).`, async (assert) => {
    let operator = new operators_1.EqualityOperator();
    let filter = operator.createFilter(0);
    assert.true(filter instanceof filters_1.EqualityFilter);
});
