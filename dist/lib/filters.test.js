"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const wtf = require("@joelek/wtf");
const filters_1 = require("./filters");
wtf.test(`It should determine matches (EqualityFilter).`, async (assert) => {
    let filter = new filters_1.EqualityFilter(0);
    assert.equals(filter.matches(-1), false);
    assert.equals(filter.matches(0), true);
    assert.equals(filter.matches(1), false);
});
