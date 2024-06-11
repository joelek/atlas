import * as wtf from "@joelek/wtf";
import { StreamIterable } from "./streams";

wtf.test(`It should flatten Iterable<string> into Iterable<string>.`, async (assert) => {
	let iterable = StreamIterable.of(["a", "b"]);
	let observed = iterable.flatten().collect();
	let expected = ["a", "b"];
	assert.equals(observed, expected);
});

wtf.test(`It should flatten Iterable<Iterable<string>> into Iterable<string>.`, async (assert) => {
	let iterable = StreamIterable.of(["a", "b"]).map((v) => StreamIterable.of(v === "a" ? ["a", "b"] : ["c", "d"]));
	let observed = iterable.flatten().collect();
	let expected = ["a", "b", "c", "d"];
	assert.equals(observed, expected);
});

wtf.test(`It should support peeking.`, async (assert) => {
	let iterable = StreamIterable.of(["a", "b"]);
	assert.equals(iterable.peek(), "a");
	assert.equals(iterable.peek(), "a");
	assert.equals(iterable.peek(), "a");
	let observed = iterable.collect();
	let expected = ["a", "b"];
	assert.equals(observed, expected);
});
