import * as wtf from "@joelek/wtf";
import { EqualityFilter } from "./filters";
import { EqualityOperator } from "./operators";

wtf.test(`It should create a filter (EqualityOperator).`, async (assert) => {
	let operator = new EqualityOperator<number>();
	let filter = operator.createFilter(0);
	assert.equals(filter instanceof EqualityFilter, true);
});
