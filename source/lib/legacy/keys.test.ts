import * as keys from "./keys";
import { test } from "../new/test";

test(`It should ...`, async (assert) => {
	let observed = keys.isPathPrefix([[1]], [[]]);
	let expected = true;
	assert.true(observed === expected);
});
