import { InMemoryBlockHandler } from "../storage";
import { StreamIterable } from "../new/streams";
import * as keys from "../keys";
import * as subject from "./radix_tree";
import { test } from "../new/test";

(async () => {
	let blockHandler = new InMemoryBlockHandler();
	let tree = new subject.CompressedTrie(blockHandler, blockHandler.createBlock(256));
	tree.insert([Buffer.from("apa")], 1);
	test(`It should return the correct search results for a full root node match in > mode.`, async (assert) => {
		let results = tree.search([Buffer.from("")], ">");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [1];
		assert.true(keys.comparePathPart(observed, expected) === 0);
	});
})();

(async () => {
	let blockHandler = new InMemoryBlockHandler();
	let tree = new subject.CompressedTrie(blockHandler, blockHandler.createBlock(256));
	tree.insert([Buffer.from("apa")], 1);
	tree.insert([Buffer.from("apa1")], 2);
	tree.insert([Buffer.from("apa3")], 3);
	tree.insert([Buffer.from("banan")], 4);
	tree.insert([Buffer.from("banan1")], 5);
	tree.insert([Buffer.from("banan3")], 6);

	test(`It should return the correct search results for a root node match in ^= mode.`, async (assert) => {
		let results = tree.search([Buffer.from("")], "^=");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [1, 2, 3, 4, 5, 6];
		assert.true(keys.comparePathPart(observed, expected) === 0);
	});

	test(`It should return the correct search results for an inner node match in ^= mode.`, async (assert) => {
		let results = tree.search([Buffer.from("apa")], "^=");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [1, 2, 3];
		assert.true(keys.comparePathPart(observed, expected) === 0);
	});

	test(`It should return the correct search results for a leaf node match in ^= mode.`, async (assert) => {
		let results = tree.search([Buffer.from("apa1")], "^=");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [2];
		assert.true(keys.comparePathPart(observed, expected) === 0);
	});

	test(`It should return the correct search results for a non-existing leaf node match in ^= mode.`, async (assert) => {
		let results = tree.search([Buffer.from("apa2")], "^=");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [] as Array<number>;
		assert.true(keys.comparePathPart(observed, expected) === 0);
	});

	test(`It should return the correct search results for a partial inner node match in ^= mode.`, async (assert) => {
		let results = tree.search([Buffer.from("ap")], "^=");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [1, 2, 3];
		assert.true(keys.comparePathPart(observed, expected) === 0);
	});

	test(`It should return the correct search results for a childless leaf node match in ^= mode.`, async (assert) => {
		let results = tree.search([Buffer.from("apa1b")], "^=");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [] as Array<number>;
		assert.true(keys.comparePathPart(observed, expected) === 0);
	});

	test(`It should return the correct search results for a root node match in = mode.`, async (assert) => {
		let results = tree.search([Buffer.from("")], "=");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [] as Array<number>;
		assert.true(keys.comparePathPart(observed, expected) === 0);
	});

	test(`It should return the correct search results for an inner node match in = mode.`, async (assert) => {
		let results = tree.search([Buffer.from("apa")], "=");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [1];
		assert.true(keys.comparePathPart(observed, expected) === 0);
	});

	test(`It should return the correct search results for a leaf node match in = mode.`, async (assert) => {
		let results = tree.search([Buffer.from("apa1")], "=");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [2];
		assert.true(keys.comparePathPart(observed, expected) === 0);
	});

	test(`It should return the correct search results for a non-existing leaf node match in = mode.`, async (assert) => {
		let results = tree.search([Buffer.from("apa2")], "=");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [] as Array<number>;
		assert.true(keys.comparePathPart(observed, expected) === 0);
	});

	test(`It should return the correct search results for a partial inner node match in = mode.`, async (assert) => {
		let results = tree.search([Buffer.from("ap")], "=");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [] as Array<number>;
		assert.true(keys.comparePathPart(observed, expected) === 0);
	});

	test(`It should return the correct search results for a partial inner node match in = mode.`, async (assert) => {
		let results = tree.search([Buffer.from("apa1b")], "=");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [] as Array<number>;
		assert.true(keys.comparePathPart(observed, expected) === 0);
	});

	test(`It should return the correct search results for a root node match in > mode.`, async (assert) => {
		let results = tree.search([Buffer.from("")], ">");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [1, 2, 3, 4, 5, 6];
		assert.true(keys.comparePathPart(observed, expected) === 0);
	});

	test(`It should return the correct search results for an inner node match in > mode.`, async (assert) => {
		let results = tree.search([Buffer.from("apa")], ">");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [2, 3, 4, 5, 6];
		assert.true(keys.comparePathPart(observed, expected) === 0);
	});

	test(`It should return the correct search results for a leaf node match in > mode.`, async (assert) => {
		let results = tree.search([Buffer.from("apa1")], ">");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [3, 4, 5, 6];
		assert.true(keys.comparePathPart(observed, expected) === 0);
	});

	test(`It should return the correct search results for a non-existing leaf node match in > mode.`, async (assert) => {
		let results = tree.search([Buffer.from("apa2")], ">");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [3, 4, 5, 6];
		assert.true(keys.comparePathPart(observed, expected) === 0);
	});

	test(`It should return the correct search results for a partial inner node match in > mode.`, async (assert) => {
		let results = tree.search([Buffer.from("ap")], ">");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [1, 2, 3, 4, 5, 6];
		assert.true(keys.comparePathPart(observed, expected) === 0);
	});

	test(`It should return the correct search results for a childless leaf node match in > mode.`, async (assert) => {
		let results = tree.search([Buffer.from("apa1b")], ">");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [3, 4, 5, 6];
		assert.true(keys.comparePathPart(observed, expected) === 0);
	});

	test(`It should return the correct search results for a root node match in >= mode.`, async (assert) => {
		let results = tree.search([Buffer.from("")], ">=");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [1, 2, 3, 4, 5, 6];
		assert.true(keys.comparePathPart(observed, expected) === 0);
	});

	test(`It should return the correct search results for an inner node match in >= mode.`, async (assert) => {
		let results = tree.search([Buffer.from("apa")], ">=");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [1, 2, 3, 4, 5, 6];
		assert.true(keys.comparePathPart(observed, expected) === 0);
	});

	test(`It should return the correct search results for a leaf node match in >= mode.`, async (assert) => {
		let results = tree.search([Buffer.from("apa1")], ">=");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [2, 3, 4, 5, 6];
		assert.true(keys.comparePathPart(observed, expected) === 0);
	});

	test(`It should return the correct search results for a non-existing leaf node match in >= mode.`, async (assert) => {
		let results = tree.search([Buffer.from("apa2")], ">=");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [3, 4, 5, 6];
		assert.true(keys.comparePathPart(observed, expected) === 0);
	});

	test(`It should return the correct search results for a partial inner node match in >= mode.`, async (assert) => {
		let results = tree.search([Buffer.from("ap")], ">=");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [1, 2, 3, 4, 5, 6];
		assert.true(keys.comparePathPart(observed, expected) === 0);
	});

	test(`It should return the correct search results for a childless leaf node match in >= mode.`, async (assert) => {
		let results = tree.search([Buffer.from("apa1b")], ">=");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [3, 4, 5, 6];
		assert.true(keys.comparePathPart(observed, expected) === 0);
	});

	test(`It should return the correct search results for a root node match in < mode.`, async (assert) => {
		let results = tree.search([Buffer.from("")], "<");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [] as Array<number>;
		assert.true(keys.comparePathPart(observed, expected) === 0);
	});

	test(`It should return the correct search results for an inner node match in < mode.`, async (assert) => {
		let results = tree.search([Buffer.from("banan")], "<");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [1, 2, 3];
		assert.true(keys.comparePathPart(observed, expected) === 0);
	});

	test(`It should return the correct search results for a leaf node match in < mode.`, async (assert) => {
		let results = tree.search([Buffer.from("banan1")], "<");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [1, 2, 3, 4];
		assert.true(keys.comparePathPart(observed, expected) === 0);
	});

	test(`It should return the correct search results for a non-existing leaf node match in < mode.`, async (assert) => {
		let results = tree.search([Buffer.from("banan2")], "<");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [1, 2, 3, 4, 5];
		assert.true(keys.comparePathPart(observed, expected) === 0);
	});

	test(`It should return the correct search results for a partial inner node match in < mode.`, async (assert) => {
		let results = tree.search([Buffer.from("bana")], "<");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [1, 2, 3];
		assert.true(keys.comparePathPart(observed, expected) === 0);
	});

	test(`It should return the correct search results for a childless leaf node match in < mode.`, async (assert) => {
		let results = tree.search([Buffer.from("banan1b")], "<");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [1, 2, 3, 4, 5];
		assert.true(keys.comparePathPart(observed, expected) === 0);
	});

	test(`It should return the correct search results for a root node match in <= mode.`, async (assert) => {
		let results = tree.search([Buffer.from("")], "<=");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [] as Array<number>;
		assert.true(keys.comparePathPart(observed, expected) === 0);
	});

	test(`It should return the correct search results for an inner node match in <= mode.`, async (assert) => {
		let results = tree.search([Buffer.from("banan")], "<=");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [1, 2, 3, 4];
		assert.true(keys.comparePathPart(observed, expected) === 0);
	});

	test(`It should return the correct search results for a leaf node match in <= mode.`, async (assert) => {
		let results = tree.search([Buffer.from("banan1")], "<=");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [1, 2, 3, 4, 5];
		assert.true(keys.comparePathPart(observed, expected) === 0);
	});

	test(`It should return the correct search results for a non-existing leaf node match in <= mode.`, async (assert) => {
		let results = tree.search([Buffer.from("banan2")], "<=");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [1, 2, 3, 4, 5];
		assert.true(keys.comparePathPart(observed, expected) === 0);
	});

	test(`It should return the correct search results for a partial inner node match in <= mode.`, async (assert) => {
		let results = tree.search([Buffer.from("bana")], "<=");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [1, 2, 3];
		assert.true(keys.comparePathPart(observed, expected) === 0);
	});

	test(`It should return the correct search results for a childless leaf node match in <= mode.`, async (assert) => {
		let results = tree.search([Buffer.from("banan1b")], "<=");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [1, 2, 3, 4, 5];
		assert.true(keys.comparePathPart(observed, expected) === 0);
	});
})();

(async () => {
	let blockHandler = new InMemoryBlockHandler();
	let tree = new subject.CompressedTrie(blockHandler, blockHandler.createBlock(256));
	tree.insert([Buffer.from("one")], 1);
	tree.insert([Buffer.from("one"), Buffer.from("a")], 2);
	tree.insert([Buffer.from("one"), Buffer.from("b")], 3);
	tree.insert([Buffer.from("two")], 4);
	tree.insert([Buffer.from("two"), Buffer.from("a")], 5);
	tree.insert([Buffer.from("two"), Buffer.from("b")], 6);

	test(`It should return the correct branch for an existing trunk.`, async (assert) => {
		let results = tree.branch([Buffer.from("one")]);
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [2, 3];
		assert.true(keys.comparePathPart(observed, expected) === 0);
	});

	test(`It should return the correct branch for a non-existing trunk.`, async (assert) => {
		let results = tree.branch([Buffer.from("three")]);
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [] as Array<number>;
		assert.true(keys.comparePathPart(observed, expected) === 0);
	});
})();

(async () => {
	let blockHandler = new InMemoryBlockHandler();
	let tree = new subject.CompressedTrie(blockHandler, blockHandler.createBlock(256));
	tree.insert([Buffer.from("a")], 1);
	tree.insert([Buffer.from("b"), Buffer.from("1")], 2);
	tree.insert([Buffer.from("b"), Buffer.from("2")], 3);
	tree.insert([Buffer.from("c"), Buffer.from("1")], 4);
	tree.insert([Buffer.from("c"), Buffer.from("2")], 5);
	tree.insert([Buffer.from("d"), Buffer.from("1")], 6);
	tree.insert([Buffer.from("d"), Buffer.from("2")], 7);

	test(`It should return the correct search results when directions are "increasing", "increasing".`, async (assert) => {
		let results = tree.search([Buffer.from("a")], ">", { offset: 1, length: 3, directions: ["increasing", "increasing"]});
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [3, 4, 5];
		assert.true(keys.comparePathPart(observed, expected) === 0);
	});

	test(`It should return the correct search results when directions are "increasing", "decreasing".`, async (assert) => {
		let results = tree.search([Buffer.from("a")], ">", { offset: 1, length: 3, directions: ["increasing", "decreasing"]});
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [2, 5, 4];
		assert.true(keys.comparePathPart(observed, expected) === 0);
	});

	test(`It should return the correct search results when directions are "decreasing", "increasing".`, async (assert) => {
		let results = tree.search([Buffer.from("a")], ">", { offset: 1, length: 3, directions: ["decreasing", "increasing"]});
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [7, 4, 5];
		assert.true(keys.comparePathPart(observed, expected) === 0);
	});

	test(`It should return the correct search results when directions are "decreasing", "decreasing".`, async (assert) => {
		let results = tree.search([Buffer.from("a")], ">", { offset: 1, length: 3, directions: ["decreasing", "decreasing"]});
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [6, 5, 4];
		assert.true(keys.comparePathPart(observed, expected) === 0);
	});
})();
