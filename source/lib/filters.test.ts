import * as bedrock from "@joelek/bedrock";
import * as wtf from "@joelek/wtf";
import { EqualityFilter, GreaterThanFilter } from "./filters";

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
