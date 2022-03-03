"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const filters_1 = require("./filters");
const test_1 = require("./test");
(0, test_1.test)(`It should determine matches (EqualityFilter).`, async (assert) => {
    let filter = new filters_1.EqualityFilter(0);
    assert.false(filter.matches(-1));
    assert.true(filter.matches(0));
    assert.false(filter.matches(1));
});
