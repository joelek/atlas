import { DecreasingOrder, IncreasingOrder } from "./orders";
import { test } from "./test";

const IN_ORDER = -1;
const EQUAL = 0;
const OUT_OF_ORDER = 1;

test(`It should determine order (DecreasingOrder).`, async (assert) => {
	let filter = new DecreasingOrder<number>();
	assert.true(filter.compare(-1, -1) === EQUAL);
	assert.true(filter.compare( 0, -1) === IN_ORDER);
	assert.true(filter.compare( 1, -1) === IN_ORDER);
	assert.true(filter.compare(-1,  0) === OUT_OF_ORDER);
	assert.true(filter.compare( 0,  0) === EQUAL);
	assert.true(filter.compare( 1,  0) === IN_ORDER);
	assert.true(filter.compare(-1,  1) === OUT_OF_ORDER);
	assert.true(filter.compare( 0,  1) === OUT_OF_ORDER);
	assert.true(filter.compare( 1,  1) === EQUAL);
});

test(`It should determine order (IncreasingOrder).`, async (assert) => {
	let filter = new IncreasingOrder<number>();
	assert.true(filter.compare(-1, -1) === EQUAL);
	assert.true(filter.compare( 0, -1) === OUT_OF_ORDER);
	assert.true(filter.compare( 1, -1) === OUT_OF_ORDER);
	assert.true(filter.compare(-1,  0) === IN_ORDER);
	assert.true(filter.compare( 0,  0) === EQUAL);
	assert.true(filter.compare( 1,  0) === OUT_OF_ORDER);
	assert.true(filter.compare(-1,  1) === IN_ORDER);
	assert.true(filter.compare( 0,  1) === IN_ORDER);
	assert.true(filter.compare( 1,  1) === EQUAL);
});
