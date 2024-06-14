import * as wtf from "@joelek/wtf";
import { EqualityFilter, GreaterThanFilter, LessThanFilter } from "./filters";
import { EqualityOperator, GreaterThanOperator, LessThanOperator } from "./operators";

wtf.test(`It should create a filter (EqualityOperator).`, async (assert) => {
	let operator = new EqualityOperator<number>();
	let filter = operator.createFilter(0);
	assert.equals(filter instanceof EqualityFilter, true);
});

wtf.test(`It should create a filter (GreaterThanOperator).`, async (assert) => {
	let operator = new GreaterThanOperator<number>();
	let filter = operator.createFilter(0);
	assert.equals(filter instanceof GreaterThanFilter, true);
});

wtf.test(`It should create a filter (LessThanOperator).`, async (assert) => {
	let operator = new LessThanOperator<number>();
	let filter = operator.createFilter(0);
	assert.equals(filter instanceof LessThanFilter, true);
});
