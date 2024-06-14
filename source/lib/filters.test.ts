import * as bedrock from "@joelek/bedrock";
import * as wtf from "@joelek/wtf";
import { EqualityFilter, GreaterThanFilter, GreaterThanOrEqualFilter, LessThanFilter, LessThanOrEqualFilter } from "./filters";

const CODEC = bedrock.codecs.Integer;

wtf.test(`It should determine matches (EqualityFilter).`, async (assert) => {
	let filter = new EqualityFilter<number>(0);
	assert.equals(filter.matches(CODEC.encode(filter.getValue()), CODEC.encode(-1)), false);
	assert.equals(filter.matches(CODEC.encode(filter.getValue()), CODEC.encode( 0)), true);
	assert.equals(filter.matches(CODEC.encode(filter.getValue()), CODEC.encode( 1)), false);
});

wtf.test(`It should determine matches (GreaterThanFilter).`, async (assert) => {
	let filter = new GreaterThanFilter<number>(0);
	assert.equals(filter.matches(CODEC.encode(filter.getValue()), CODEC.encode(-1)), false);
	assert.equals(filter.matches(CODEC.encode(filter.getValue()), CODEC.encode( 0)), false);
	assert.equals(filter.matches(CODEC.encode(filter.getValue()), CODEC.encode( 1)), true);
});

wtf.test(`It should determine matches (GreaterThanOrEqualFilter).`, async (assert) => {
	let filter = new GreaterThanOrEqualFilter<number>(0);
	assert.equals(filter.matches(CODEC.encode(filter.getValue()), CODEC.encode(-1)), false);
	assert.equals(filter.matches(CODEC.encode(filter.getValue()), CODEC.encode( 0)), true);
	assert.equals(filter.matches(CODEC.encode(filter.getValue()), CODEC.encode( 1)), true);
});

wtf.test(`It should determine matches (LessThanFilter).`, async (assert) => {
	let filter = new LessThanFilter<number>(0);
	assert.equals(filter.matches(CODEC.encode(filter.getValue()), CODEC.encode(-1)), true);
	assert.equals(filter.matches(CODEC.encode(filter.getValue()), CODEC.encode( 0)), false);
	assert.equals(filter.matches(CODEC.encode(filter.getValue()), CODEC.encode( 1)), false);
});

wtf.test(`It should determine matches (LessThanOrEqualFilter).`, async (assert) => {
	let filter = new LessThanOrEqualFilter<number>(0);
	assert.equals(filter.matches(CODEC.encode(filter.getValue()), CODEC.encode(-1)), true);
	assert.equals(filter.matches(CODEC.encode(filter.getValue()), CODEC.encode( 0)), true);
	assert.equals(filter.matches(CODEC.encode(filter.getValue()), CODEC.encode( 1)), false);
});
