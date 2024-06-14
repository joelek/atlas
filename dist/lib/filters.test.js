"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bedrock = require("@joelek/bedrock");
const wtf = require("@joelek/wtf");
const filters_1 = require("./filters");
const CODEC = bedrock.codecs.Integer;
wtf.test(`It should determine matches (EqualityFilter).`, async (assert) => {
    let filter = new filters_1.EqualityFilter(0);
    assert.equals(filter.matches(CODEC.encode(filter.getValue()), CODEC.encode(-1)), false);
    assert.equals(filter.matches(CODEC.encode(filter.getValue()), CODEC.encode(0)), true);
    assert.equals(filter.matches(CODEC.encode(filter.getValue()), CODEC.encode(1)), false);
});
wtf.test(`It should determine matches (GreaterThanFilter).`, async (assert) => {
    let filter = new filters_1.GreaterThanFilter(0);
    assert.equals(filter.matches(CODEC.encode(filter.getValue()), CODEC.encode(-1)), false);
    assert.equals(filter.matches(CODEC.encode(filter.getValue()), CODEC.encode(0)), false);
    assert.equals(filter.matches(CODEC.encode(filter.getValue()), CODEC.encode(1)), true);
});
wtf.test(`It should determine matches (LessThanFilter).`, async (assert) => {
    let filter = new filters_1.LessThanFilter(0);
    assert.equals(filter.matches(CODEC.encode(filter.getValue()), CODEC.encode(-1)), true);
    assert.equals(filter.matches(CODEC.encode(filter.getValue()), CODEC.encode(0)), false);
    assert.equals(filter.matches(CODEC.encode(filter.getValue()), CODEC.encode(1)), false);
});
