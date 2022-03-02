import { EqualityFilter, RangeFilter } from "./filters";
import { test } from "./test";

test(`It should determine matches (EqualityFilter).`, async (assert) => {
	let filter = new EqualityFilter<number>(0);
	assert.false(filter.matches(-1));
	assert.true(filter.matches(0));
	assert.false(filter.matches(1));
});

test(`It should determine matches (RangeFilter).`, async (assert) => {
	let filter = new RangeFilter<number>(0, 0);
	assert.false(filter.matches(-1));
	assert.true(filter.matches(0));
	assert.false(filter.matches(1));
});
