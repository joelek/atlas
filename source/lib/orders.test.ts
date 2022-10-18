import * as wtf from "@joelek/wtf";
import { DecreasingOrder, IncreasingOrder } from "./orders";

const IN_ORDER = -1;
const EQUAL = 0;
const OUT_OF_ORDER = 1;

wtf.test(`It should determine order (DecreasingOrder).`, async (assert) => {
	let filter = new DecreasingOrder<number>();
	assert.equals(filter.compare(-1, -1), EQUAL);
	assert.equals(filter.compare( 0, -1), IN_ORDER);
	assert.equals(filter.compare( 1, -1), IN_ORDER);
	assert.equals(filter.compare(-1,  0), OUT_OF_ORDER);
	assert.equals(filter.compare( 0,  0), EQUAL);
	assert.equals(filter.compare( 1,  0), IN_ORDER);
	assert.equals(filter.compare(-1,  1), OUT_OF_ORDER);
	assert.equals(filter.compare( 0,  1), OUT_OF_ORDER);
	assert.equals(filter.compare( 1,  1), EQUAL);
});

wtf.test(`It should determine order (IncreasingOrder).`, async (assert) => {
	let filter = new IncreasingOrder<number>();
	assert.equals(filter.compare(-1, -1), EQUAL);
	assert.equals(filter.compare( 0, -1), OUT_OF_ORDER);
	assert.equals(filter.compare( 1, -1), OUT_OF_ORDER);
	assert.equals(filter.compare(-1,  0), IN_ORDER);
	assert.equals(filter.compare( 0,  0), EQUAL);
	assert.equals(filter.compare( 1,  0), OUT_OF_ORDER);
	assert.equals(filter.compare(-1,  1), IN_ORDER);
	assert.equals(filter.compare( 0,  1), IN_ORDER);
	assert.equals(filter.compare( 1,  1), EQUAL);
});
