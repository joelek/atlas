import { EqualityFilter } from "./filters";
import { EqualityOperator } from "./operators";
import { test } from "./test";

test(`It should create a filter (EqualityOperator).`, async (assert) => {
	let operator = new EqualityOperator<number>();
	let filter = operator.createFilter(0);
	assert.true(filter instanceof EqualityFilter);
});
