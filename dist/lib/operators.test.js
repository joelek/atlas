"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const wtf = require("@joelek/wtf");
const filters_1 = require("./filters");
const operators_1 = require("./operators");
wtf.test(`It should create a filter (EqualityOperator).`, async (assert) => {
    let operator = new operators_1.EqualityOperator();
    let filter = operator.createFilter(0);
    assert.equals(filter instanceof filters_1.EqualityFilter, true);
});
