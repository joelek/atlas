"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const wtf = require("@joelek/wtf");
const streams_1 = require("./streams");
wtf.test(`It should flatten Iterable<string> into Iterable<string>.`, async (assert) => {
    let iterable = streams_1.StreamIterable.of(["a", "b"]);
    let observed = iterable.flatten().collect();
    let expected = ["a", "b"];
    assert.equals(observed, expected);
});
wtf.test(`It should flatten Iterable<Iterable<string>> into Iterable<string>.`, async (assert) => {
    let iterable = streams_1.StreamIterable.of(["a", "b"]).map((v) => streams_1.StreamIterable.of(v === "a" ? ["a", "b"] : ["c", "d"]));
    let observed = iterable.flatten().collect();
    let expected = ["a", "b", "c", "d"];
    assert.equals(observed, expected);
});
wtf.test(`It should support peeking.`, async (assert) => {
    let iterable = streams_1.StreamIterable.of(["a", "b"]);
    assert.equals(iterable.peek(), "a");
    assert.equals(iterable.peek(), "a");
    assert.equals(iterable.peek(), "a");
    let observed = iterable.collect();
    let expected = ["a", "b"];
    assert.equals(observed, expected);
});
