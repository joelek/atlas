import { EqualityFilter } from "./filters";
import { test } from "./test";

test(`It should determine matches (EqualityFilter).`, async (assert) => {
	let filter = new EqualityFilter<number>(0);
	assert.false(filter.matches(-1));
	assert.true(filter.matches(0));
	assert.false(filter.matches(1));
});
