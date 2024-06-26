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
wtf.test(`It should create a filter (GreaterThanOperator).`, async (assert) => {
    let operator = new operators_1.GreaterThanOperator();
    let filter = operator.createFilter(0);
    assert.equals(filter instanceof filters_1.GreaterThanFilter, true);
});
wtf.test(`It should create a filter (GreaterThanOrEqualOperator).`, async (assert) => {
    let operator = new operators_1.GreaterThanOrEqualOperator();
    let filter = operator.createFilter(0);
    assert.equals(filter instanceof filters_1.GreaterThanOrEqualFilter, true);
});
wtf.test(`It should create a filter (LessThanOperator).`, async (assert) => {
    let operator = new operators_1.LessThanOperator();
    let filter = operator.createFilter(0);
    assert.equals(filter instanceof filters_1.LessThanFilter, true);
});
wtf.test(`It should create a filter (LessThanOrEqualOperator).`, async (assert) => {
    let operator = new operators_1.LessThanOrEqualOperator();
    let filter = operator.createFilter(0);
    assert.equals(filter instanceof filters_1.LessThanOrEqualFilter, true);
});
