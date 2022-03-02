import { EqualityFilter, RangeFilter } from "./filters";
import { EqualityOperator, RangeOperator } from "./operators";
import { test } from "./test";

test(`It should create a filter (EqualityOperator).`, async (assert) => {
	let operator = new EqualityOperator<number>();
	let filter = operator.createFilter(0);
	assert.true(filter instanceof EqualityFilter);
});

test(`It should create a filter (RangeOperator).`, async (assert) => {
	let operator = new RangeOperator<number>();
	let filter = operator.createFilter([0, 0]);
	assert.true(filter instanceof RangeFilter);
});
