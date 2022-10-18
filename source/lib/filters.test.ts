import * as wtf from "@joelek/wtf";
import { EqualityFilter } from "./filters";

wtf.test(`It should determine matches (EqualityFilter).`, async (assert) => {
	let filter = new EqualityFilter<number>(0);
	assert.equals(filter.matches(-1), false);
	assert.equals(filter.matches(0), true);
	assert.equals(filter.matches(1), false);
});
