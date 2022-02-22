"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const keys = require("./keys");
const test_1 = require("./test");
(0, test_1.test)(`It should compare a single chunk ([0] < [0,1]).`, async (assert) => {
    let observed = keys.compareChunk(Uint8Array.of(0), Uint8Array.of(0, 1));
    let expected = -1;
    assert.true(observed === expected);
});
(0, test_1.test)(`It should compare a single chunk ([1] > [0,1]).`, async (assert) => {
    let observed = keys.compareChunk(Uint8Array.of(1), Uint8Array.of(0, 1));
    let expected = 1;
    assert.true(observed === expected);
});
(0, test_1.test)(`It should compare a single chunk ([2] > [0,1]).`, async (assert) => {
    let observed = keys.compareChunk(Uint8Array.of(2), Uint8Array.of(0, 1));
    let expected = 1;
    assert.true(observed === expected);
});
(0, test_1.test)(`It should compare a single chunk ([0] < [1,1]).`, async (assert) => {
    let observed = keys.compareChunk(Uint8Array.of(0), Uint8Array.of(1, 1));
    let expected = -1;
    assert.true(observed === expected);
});
(0, test_1.test)(`It should compare a single chunk ([1] < [1,1]).`, async (assert) => {
    let observed = keys.compareChunk(Uint8Array.of(1), Uint8Array.of(1, 1));
    let expected = -1;
    assert.true(observed === expected);
});
(0, test_1.test)(`It should compare a single chunk ([2] > [1,1]).`, async (assert) => {
    let observed = keys.compareChunk(Uint8Array.of(2), Uint8Array.of(1, 1));
    let expected = 1;
    assert.true(observed === expected);
});
(0, test_1.test)(`It should compare a single chunk ([0] < [2,1]).`, async (assert) => {
    let observed = keys.compareChunk(Uint8Array.of(0), Uint8Array.of(2, 1));
    let expected = -1;
    assert.true(observed === expected);
});
(0, test_1.test)(`It should compare a single chunk ([1] < [2,1]).`, async (assert) => {
    let observed = keys.compareChunk(Uint8Array.of(1), Uint8Array.of(2, 1));
    let expected = -1;
    assert.true(observed === expected);
});
(0, test_1.test)(`It should compare a single chunk ([2] < [2,1]).`, async (assert) => {
    let observed = keys.compareChunk(Uint8Array.of(2), Uint8Array.of(2, 1));
    let expected = -1;
    assert.true(observed === expected);
});
(0, test_1.test)(`It should compare a single chunk ([0,0] < [0,1]).`, async (assert) => {
    let observed = keys.compareChunk(Uint8Array.of(0, 0), Uint8Array.of(0, 1));
    let expected = -1;
    assert.true(observed === expected);
});
(0, test_1.test)(`It should compare a single chunk ([0,1] = [0,1]).`, async (assert) => {
    let observed = keys.compareChunk(Uint8Array.of(0, 1), Uint8Array.of(0, 1));
    let expected = 0;
    assert.true(observed === expected);
});
(0, test_1.test)(`It should compare a single chunk ([0,2] > [0,1]).`, async (assert) => {
    let observed = keys.compareChunk(Uint8Array.of(0, 2), Uint8Array.of(0, 1));
    let expected = 1;
    assert.true(observed === expected);
});
(0, test_1.test)(`It should compare a single chunk ([0,0] < [1,1]).`, async (assert) => {
    let observed = keys.compareChunk(Uint8Array.of(0, 0), Uint8Array.of(1, 1));
    let expected = -1;
    assert.true(observed === expected);
});
(0, test_1.test)(`It should compare a single chunk ([0,1] < [1,1]).`, async (assert) => {
    let observed = keys.compareChunk(Uint8Array.of(0, 1), Uint8Array.of(1, 1));
    let expected = -1;
    assert.true(observed === expected);
});
(0, test_1.test)(`It should compare a single chunk ([0,2] < [1,1]).`, async (assert) => {
    let observed = keys.compareChunk(Uint8Array.of(0, 2), Uint8Array.of(1, 1));
    let expected = -1;
    assert.true(observed === expected);
});
(0, test_1.test)(`It should compare a single chunk ([0,0] < [2,1]).`, async (assert) => {
    let observed = keys.compareChunk(Uint8Array.of(0, 0), Uint8Array.of(2, 1));
    let expected = -1;
    assert.true(observed === expected);
});
(0, test_1.test)(`It should compare a single chunk ([0,1] < [2,1]).`, async (assert) => {
    let observed = keys.compareChunk(Uint8Array.of(0, 1), Uint8Array.of(2, 1));
    let expected = -1;
    assert.true(observed === expected);
});
(0, test_1.test)(`It should compare a single chunk ([0,2] < [2,1]).`, async (assert) => {
    let observed = keys.compareChunk(Uint8Array.of(0, 2), Uint8Array.of(2, 1));
    let expected = -1;
    assert.true(observed === expected);
});
(0, test_1.test)(`It should compare a single chunk ([1,0] > [0,1]).`, async (assert) => {
    let observed = keys.compareChunk(Uint8Array.of(1, 0), Uint8Array.of(0, 1));
    let expected = 1;
    assert.true(observed === expected);
});
(0, test_1.test)(`It should compare a single chunk ([1,1] > [0,1]).`, async (assert) => {
    let observed = keys.compareChunk(Uint8Array.of(1, 1), Uint8Array.of(0, 1));
    let expected = 1;
    assert.true(observed === expected);
});
(0, test_1.test)(`It should compare a single chunk ([1,2] > [0,1]).`, async (assert) => {
    let observed = keys.compareChunk(Uint8Array.of(1, 2), Uint8Array.of(0, 1));
    let expected = 1;
    assert.true(observed === expected);
});
(0, test_1.test)(`It should compare a single chunk ([1,0] < [1,1]).`, async (assert) => {
    let observed = keys.compareChunk(Uint8Array.of(1, 0), Uint8Array.of(1, 1));
    let expected = -1;
    assert.true(observed === expected);
});
(0, test_1.test)(`It should compare a single chunk ([1,1] = [1,1]).`, async (assert) => {
    let observed = keys.compareChunk(Uint8Array.of(1, 1), Uint8Array.of(1, 1));
    let expected = 0;
    assert.true(observed === expected);
});
(0, test_1.test)(`It should compare a single chunk ([1,2] > [1,1]).`, async (assert) => {
    let observed = keys.compareChunk(Uint8Array.of(1, 2), Uint8Array.of(1, 1));
    let expected = 1;
    assert.true(observed === expected);
});
(0, test_1.test)(`It should compare a single chunk ([1,0] < [2,1]).`, async (assert) => {
    let observed = keys.compareChunk(Uint8Array.of(1, 0), Uint8Array.of(2, 1));
    let expected = -1;
    assert.true(observed === expected);
});
(0, test_1.test)(`It should compare a single chunk ([1,1] < [2,1]).`, async (assert) => {
    let observed = keys.compareChunk(Uint8Array.of(1, 1), Uint8Array.of(2, 1));
    let expected = -1;
    assert.true(observed === expected);
});
(0, test_1.test)(`It should compare a single chunk ([1,2] < [2,1]).`, async (assert) => {
    let observed = keys.compareChunk(Uint8Array.of(1, 2), Uint8Array.of(2, 1));
    let expected = -1;
    assert.true(observed === expected);
});
(0, test_1.test)(`It should compare a single chunk ([2,0] > [0,1]).`, async (assert) => {
    let observed = keys.compareChunk(Uint8Array.of(2, 0), Uint8Array.of(0, 1));
    let expected = 1;
    assert.true(observed === expected);
});
(0, test_1.test)(`It should compare a single chunk ([2,1] > [0,1]).`, async (assert) => {
    let observed = keys.compareChunk(Uint8Array.of(2, 1), Uint8Array.of(0, 1));
    let expected = 1;
    assert.true(observed === expected);
});
(0, test_1.test)(`It should compare a single chunk ([2,2] > [0,1]).`, async (assert) => {
    let observed = keys.compareChunk(Uint8Array.of(2, 2), Uint8Array.of(0, 1));
    let expected = 1;
    assert.true(observed === expected);
});
(0, test_1.test)(`It should compare a single chunk ([2,0] > [1,1]).`, async (assert) => {
    let observed = keys.compareChunk(Uint8Array.of(2, 0), Uint8Array.of(1, 1));
    let expected = 1;
    assert.true(observed === expected);
});
(0, test_1.test)(`It should compare a single chunk ([2,1] > [1,1]).`, async (assert) => {
    let observed = keys.compareChunk(Uint8Array.of(2, 1), Uint8Array.of(1, 1));
    let expected = 1;
    assert.true(observed === expected);
});
(0, test_1.test)(`It should compare a single chunk ([2,2] > [1,1]).`, async (assert) => {
    let observed = keys.compareChunk(Uint8Array.of(2, 2), Uint8Array.of(1, 1));
    let expected = 1;
    assert.true(observed === expected);
});
(0, test_1.test)(`It should compare a single chunk ([2,0] < [2,1]).`, async (assert) => {
    let observed = keys.compareChunk(Uint8Array.of(2, 0), Uint8Array.of(2, 1));
    let expected = -1;
    assert.true(observed === expected);
});
(0, test_1.test)(`It should compare a single chunk ([2,1] = [2,1]).`, async (assert) => {
    let observed = keys.compareChunk(Uint8Array.of(2, 1), Uint8Array.of(2, 1));
    let expected = 0;
    assert.true(observed === expected);
});
(0, test_1.test)(`It should compare a single chunk ([2,2] > [2,1]).`, async (assert) => {
    let observed = keys.compareChunk(Uint8Array.of(2, 2), Uint8Array.of(2, 1));
    let expected = 1;
    assert.true(observed === expected);
});
