import * as bedrock from "@joelek/bedrock"
import { BlockManager } from "./blocks";
import { VirtualFile } from "./files";
import { RadixTree } from "./trees";
import { test } from "./test";

function getKeyFromString(string: string): Uint8Array {
	return bedrock.utils.Chunk.fromString(string, "utf-8");
};

(async () => {
	let blockManager = new BlockManager(new VirtualFile(0));
	blockManager.createBlock(256);
	let tree = new RadixTree(blockManager, blockManager.createBlock(256));
	tree.insert([getKeyFromString("A"), getKeyFromString("A"), getKeyFromString("A")], 1);
	tree.insert([getKeyFromString("A"), getKeyFromString("A"), getKeyFromString("B")], 2);
	tree.insert([getKeyFromString("A"), getKeyFromString("B"), getKeyFromString("A")], 3);
	tree.insert([getKeyFromString("A"), getKeyFromString("B"), getKeyFromString("B")], 4);
	tree.insert([getKeyFromString("B"), getKeyFromString("A"), getKeyFromString("A")], 5);
	tree.insert([getKeyFromString("B"), getKeyFromString("A"), getKeyFromString("B")], 6);
	tree.insert([getKeyFromString("B"), getKeyFromString("B"), getKeyFromString("A")], 7);
	tree.insert([getKeyFromString("B"), getKeyFromString("B"), getKeyFromString("B")], 8);

	test(`It should support ordered filtering in ">" mode.`, async (assert) => {
		let observed = Array.from(tree.filter(">", [getKeyFromString("B"), getKeyFromString("A"), getKeyFromString("A")], ["decreasing", "increasing", "decreasing"]));
		let expected = [8, 7, 2, 1, 4, 3];
		assert.array.equals(observed, expected);
	});

	test(`It should support ordered filtering in ">=" mode.`, async (assert) => {
		let observed = Array.from(tree.filter(">=", [getKeyFromString("B"), getKeyFromString("A"), getKeyFromString("A")], ["decreasing", "increasing", "decreasing"]));
		let expected = [5, 8, 7, 2, 1, 4, 3];
		assert.array.equals(observed, expected);
	});

	test(`It should support ordered filtering in "<" mode.`, async (assert) => {
		let observed = Array.from(tree.filter("<", [getKeyFromString("B"), getKeyFromString("A"), getKeyFromString("A")], ["decreasing", "increasing", "decreasing"]));
		let expected = [6];
		assert.array.equals(observed, expected);
	});

	test(`It should support ordered filtering in "<=" mode.`, async (assert) => {
		let observed = Array.from(tree.filter("<=", [getKeyFromString("B"), getKeyFromString("A"), getKeyFromString("A")], ["decreasing", "increasing", "decreasing"]));
		let expected = [6, 5];
		assert.array.equals(observed, expected);
	});
})();

(async () => {
	let blockManager = new BlockManager(new VirtualFile(0));
	blockManager.createBlock(256);
	let tree = new RadixTree(blockManager, blockManager.createBlock(256));
	tree.insert([getKeyFromString("a")], 1);
	tree.insert([getKeyFromString("a"), getKeyFromString("a")], 2);
	tree.insert([getKeyFromString("a"), getKeyFromString("b")], 3);
	tree.insert([getKeyFromString("b")], 4);
	tree.insert([getKeyFromString("b"), getKeyFromString("a")], 5);
	tree.insert([getKeyFromString("b"), getKeyFromString("b")], 6);
	tree.insert([getKeyFromString("c")], 7);

	test(`It should support filtering values matching a zero element key in "^=" mode`, async (assert) => {
		let observed = Array.from(tree.filter("^=", []));
		let expected = [1, 2, 3, 4, 5, 6, 7] as Array<number>;
		assert.array.equals(observed, expected);
	});

	test(`It should support filtering values matching a zero element key in "=" mode`, async (assert) => {
		let observed = Array.from(tree.filter("=", []));
		let expected = [] as Array<number>;
		assert.array.equals(observed, expected);
	});

	test(`It should support filtering values matching a zero element key in ">" mode`, async (assert) => {
		let observed = Array.from(tree.filter(">", []));
		let expected = [1, 2, 3, 4, 5, 6, 7] as Array<number>;
		assert.array.equals(observed, expected);
	});

	test(`It should support filtering values matching a zero element key in ">=" mode`, async (assert) => {
		let observed = Array.from(tree.filter(">=", []));
		let expected = [1, 2, 3, 4, 5, 6, 7] as Array<number>;
		assert.array.equals(observed, expected);
	});

	test(`It should support filtering values matching a zero element key in "<" mode`, async (assert) => {
		let observed = Array.from(tree.filter("<", []));
		let expected = [] as Array<number>;
		assert.array.equals(observed, expected);
	});

	test(`It should support filtering values matching a zero element key in "<=" mode`, async (assert) => {
		let observed = Array.from(tree.filter("<=", []));
		let expected = [] as Array<number>;
		assert.array.equals(observed, expected);
	});

	test(`It should support filtering values matching a one element key in "^=" mode`, async (assert) => {
		let observed = Array.from(tree.filter("^=", [getKeyFromString("a")]));
		let expected = [1, 2, 3] as Array<number>;
		assert.array.equals(observed, expected);
	});

	test(`It should support filtering values matching a one element key in "=" mode`, async (assert) => {
		let observed = Array.from(tree.filter("=", [getKeyFromString("a")]));
		let expected = [1] as Array<number>;
		assert.array.equals(observed, expected);
	});

	test(`It should support filtering values matching a one element key in ">" mode`, async (assert) => {
		let observed = Array.from(tree.filter(">", [getKeyFromString("a")]));
		let expected = [2, 3, 4, 5, 6, 7] as Array<number>;
		assert.array.equals(observed, expected);
	});

	test(`It should support filtering values matching a one element key in ">=" mode`, async (assert) => {
		let observed = Array.from(tree.filter(">=", [getKeyFromString("a")]));
		let expected = [1, 2, 3, 4, 5, 6, 7] as Array<number>;
		assert.array.equals(observed, expected);
	});

	test(`It should support filtering values matching a one element key in "<" mode`, async (assert) => {
		let observed = Array.from(tree.filter("<", [getKeyFromString("b")]));
		let expected = [1, 2, 3] as Array<number>;
		assert.array.equals(observed, expected);
	});

	test(`It should support filtering values matching a one element key in "<=" mode`, async (assert) => {
		let observed = Array.from(tree.filter("<=", [getKeyFromString("b")]));
		let expected = [1, 2, 3, 4] as Array<number>;
		assert.array.equals(observed, expected);
	});

	test(`It should support filtering values matching a two element key in "^=" mode`, async (assert) => {
		let observed = Array.from(tree.filter("^=", [getKeyFromString("a"), getKeyFromString("a")]));
		let expected = [2] as Array<number>;
		assert.array.equals(observed, expected);
	});

	test(`It should support filtering values matching a two element key in "=" mode`, async (assert) => {
		let observed = Array.from(tree.filter("=", [getKeyFromString("a"), getKeyFromString("a")]));
		let expected = [2] as Array<number>;
		assert.array.equals(observed, expected);
	});

	test(`It should support filtering values matching a two element key in ">" mode`, async (assert) => {
		let observed = Array.from(tree.filter(">", [getKeyFromString("a"), getKeyFromString("a")]));
		let expected = [3, 4, 5, 6, 7] as Array<number>;
		assert.array.equals(observed, expected);
	});

	test(`It should support filtering values matching a two element key in ">=" mode`, async (assert) => {
		let observed = Array.from(tree.filter(">=", [getKeyFromString("a"), getKeyFromString("a")]));
		let expected = [2, 3, 4, 5, 6, 7] as Array<number>;
		assert.array.equals(observed, expected);
	});

	test(`It should support filtering values matching a two element key in "<" mode`, async (assert) => {
		let observed = Array.from(tree.filter("<", [getKeyFromString("b"), getKeyFromString("b")]));
		let expected = [1, 2, 3, 4, 5] as Array<number>;
		assert.array.equals(observed, expected);
	});

	test(`It should support filtering values matching a two element key in "<=" mode`, async (assert) => {
		let observed = Array.from(tree.filter("<=", [getKeyFromString("b"), getKeyFromString("b")]));
		let expected = [1, 2, 3, 4, 5, 6] as Array<number>;
		assert.array.equals(observed, expected);
	});
})();

(async () => {
	let blockManager = new BlockManager(new VirtualFile(0));
	blockManager.createBlock(256);
	let tree = new RadixTree(blockManager, blockManager.createBlock(256));
	tree.insert([getKeyFromString("apa")], 1);
	test(`It should return the correct values for a full root node match in > mode.`, async (assert) => {
		let results = tree.filter(">", [getKeyFromString("")]);
		let observed = Array.from(results);
		let expected = [1];
		assert.array.equals(observed, expected);
	});
})();

(async () => {
	let blockManager = new BlockManager(new VirtualFile(0));
	blockManager.createBlock(256);
	let tree = new RadixTree(blockManager, blockManager.createBlock(256));
	tree.insert([getKeyFromString("apa")], 1);
	tree.insert([getKeyFromString("apa1")], 2);
	tree.insert([getKeyFromString("apa3")], 3);
	tree.insert([getKeyFromString("banan")], 4);
	tree.insert([getKeyFromString("banan1")], 5);
	tree.insert([getKeyFromString("banan3")], 6);

	test(`It should return the correct values for a root node match in ^= mode.`, async (assert) => {
		let results = tree.filter("^=", [getKeyFromString("")]);
		let observed = Array.from(results);
		let expected = [1, 2, 3, 4, 5, 6];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct values for an inner node match in ^= mode.`, async (assert) => {
		let results = tree.filter("^=", [getKeyFromString("apa")]);
		let observed = Array.from(results);
		let expected = [1, 2, 3];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct values for a leaf node match in ^= mode.`, async (assert) => {
		let results = tree.filter("^=", [getKeyFromString("apa1")]);
		let observed = Array.from(results);
		let expected = [2];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct values for a non-existing leaf node match in ^= mode.`, async (assert) => {
		let results = tree.filter("^=", [getKeyFromString("apa2")]);
		let observed = Array.from(results);
		let expected = [] as Array<number>;
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct values for a partial inner node match in ^= mode.`, async (assert) => {
		let results = tree.filter("^=", [getKeyFromString("ap")]);
		let observed = Array.from(results);
		let expected = [1, 2, 3];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct values for a childless leaf node match in ^= mode.`, async (assert) => {
		let results = tree.filter("^=", [getKeyFromString("apa1b")]);
		let observed = Array.from(results);
		let expected = [] as Array<number>;
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct values for a root node match in = mode.`, async (assert) => {
		let results = tree.filter("=", [getKeyFromString("")]);
		let observed = Array.from(results);
		let expected = [] as Array<number>;
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct values for an inner node match in = mode.`, async (assert) => {
		let results = tree.filter("=", [getKeyFromString("apa")]);
		let observed = Array.from(results);
		let expected = [1];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct values for a leaf node match in = mode.`, async (assert) => {
		let results = tree.filter("=", [getKeyFromString("apa1")]);
		let observed = Array.from(results);
		let expected = [2];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct values for a non-existing leaf node match in = mode.`, async (assert) => {
		let results = tree.filter("=", [getKeyFromString("apa2")]);
		let observed = Array.from(results);
		let expected = [] as Array<number>;
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct values for a partial inner node match in = mode.`, async (assert) => {
		let results = tree.filter("=", [getKeyFromString("ap")]);
		let observed = Array.from(results);
		let expected = [] as Array<number>;
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct values for a partial inner node match in = mode.`, async (assert) => {
		let results = tree.filter("=", [getKeyFromString("apa1b")]);
		let observed = Array.from(results);
		let expected = [] as Array<number>;
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct values for a root node match in > mode.`, async (assert) => {
		let results = tree.filter(">", [getKeyFromString("")]);
		let observed = Array.from(results);
		let expected = [1, 2, 3, 4, 5, 6];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct values for an inner node match in > mode.`, async (assert) => {
		let results = tree.filter(">", [getKeyFromString("apa")]);
		let observed = Array.from(results);
		let expected = [2, 3, 4, 5, 6];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct values for a leaf node match in > mode.`, async (assert) => {
		let results = tree.filter(">", [getKeyFromString("apa1")]);
		let observed = Array.from(results);
		let expected = [3, 4, 5, 6];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct values for a non-existing leaf node match in > mode.`, async (assert) => {
		let results = tree.filter(">", [getKeyFromString("apa2")]);
		let observed = Array.from(results);
		let expected = [3, 4, 5, 6];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct values for a partial inner node match in > mode.`, async (assert) => {
		let results = tree.filter(">", [getKeyFromString("ap")]);
		let observed = Array.from(results);
		let expected = [1, 2, 3, 4, 5, 6];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct values for a childless leaf node match in > mode.`, async (assert) => {
		let results = tree.filter(">", [getKeyFromString("apa1b")]);
		let observed = Array.from(results);
		let expected = [3, 4, 5, 6];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct values for a root node match in >= mode.`, async (assert) => {
		let results = tree.filter(">=", [getKeyFromString("")]);
		let observed = Array.from(results);
		let expected = [1, 2, 3, 4, 5, 6];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct values for an inner node match in >= mode.`, async (assert) => {
		let results = tree.filter(">=", [getKeyFromString("apa")]);
		let observed = Array.from(results);
		let expected = [1, 2, 3, 4, 5, 6];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct values for a leaf node match in >= mode.`, async (assert) => {
		let results = tree.filter(">=", [getKeyFromString("apa1")]);
		let observed = Array.from(results);
		let expected = [2, 3, 4, 5, 6];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct values for a non-existing leaf node match in >= mode.`, async (assert) => {
		let results = tree.filter(">=", [getKeyFromString("apa2")]);
		let observed = Array.from(results);
		let expected = [3, 4, 5, 6];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct values for a partial inner node match in >= mode.`, async (assert) => {
		let results = tree.filter(">=", [getKeyFromString("ap")]);
		let observed = Array.from(results);
		let expected = [1, 2, 3, 4, 5, 6];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct values for a childless leaf node match in >= mode.`, async (assert) => {
		let results = tree.filter(">=", [getKeyFromString("apa1b")]);
		let observed = Array.from(results);
		let expected = [3, 4, 5, 6];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct values for a root node match in < mode.`, async (assert) => {
		let results = tree.filter("<", [getKeyFromString("")]);
		let observed = Array.from(results);
		let expected = [] as Array<number>;
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct values for an inner node match in < mode.`, async (assert) => {
		let results = tree.filter("<", [getKeyFromString("banan")]);
		let observed = Array.from(results);
		let expected = [1, 2, 3];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct values for a leaf node match in < mode.`, async (assert) => {
		let results = tree.filter("<", [getKeyFromString("banan1")]);
		let observed = Array.from(results);
		let expected = [1, 2, 3, 4];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct values for a non-existing leaf node match in < mode.`, async (assert) => {
		let results = tree.filter("<", [getKeyFromString("banan2")]);
		let observed = Array.from(results);
		let expected = [1, 2, 3, 4, 5];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct values for a partial inner node match in < mode.`, async (assert) => {
		let results = tree.filter("<", [getKeyFromString("bana")]);
		let observed = Array.from(results);
		let expected = [1, 2, 3];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct values for a childless leaf node match in < mode.`, async (assert) => {
		let results = tree.filter("<", [getKeyFromString("banan1b")]);
		let observed = Array.from(results);
		let expected = [1, 2, 3, 4, 5];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct values for a root node match in <= mode.`, async (assert) => {
		let results = tree.filter("<=", [getKeyFromString("")]);
		let observed = Array.from(results);
		let expected = [] as Array<number>;
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct values for an inner node match in <= mode.`, async (assert) => {
		let results = tree.filter("<=", [getKeyFromString("banan")]);
		let observed = Array.from(results);
		let expected = [1, 2, 3, 4];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct values for a leaf node match in <= mode.`, async (assert) => {
		let results = tree.filter("<=", [getKeyFromString("banan1")]);
		let observed = Array.from(results);
		let expected = [1, 2, 3, 4, 5];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct values for a non-existing leaf node match in <= mode.`, async (assert) => {
		let results = tree.filter("<=", [getKeyFromString("banan2")]);
		let observed = Array.from(results);
		let expected = [1, 2, 3, 4, 5];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct values for a partial inner node match in <= mode.`, async (assert) => {
		let results = tree.filter("<=", [getKeyFromString("bana")]);
		let observed = Array.from(results);
		let expected = [1, 2, 3];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct values for a childless leaf node match in <= mode.`, async (assert) => {
		let results = tree.filter("<=", [getKeyFromString("banan1b")]);
		let observed = Array.from(results);
		let expected = [1, 2, 3, 4, 5];
		assert.array.equals(observed, expected);
	});
})();

(async () => {
	let blockManager = new BlockManager(new VirtualFile(0));
	blockManager.createBlock(256);
	let tree = new RadixTree(blockManager, blockManager.createBlock(256));
	tree.insert([getKeyFromString("one")], 1);
	tree.insert([getKeyFromString("one"), getKeyFromString("a")], 2);
	tree.insert([getKeyFromString("one"), getKeyFromString("b")], 3);
	tree.insert([getKeyFromString("two")], 4);
	tree.insert([getKeyFromString("two"), getKeyFromString("a")], 5);
	tree.insert([getKeyFromString("two"), getKeyFromString("b")], 6);

	test(`It should return the correct branch for an existing key.`, async (assert) => {
		let results = tree.branch([getKeyFromString("one")]);
		let observed = Array.from(results ?? []);
		let expected = [2, 3];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct branch for a non-existing key.`, async (assert) => {
		let results = tree.branch([getKeyFromString("three")]);
		let observed = Array.from(results ?? []);
		let expected = [] as Array<number>;
		assert.array.equals(observed, expected);
	});
})();

(async () => {
	let blockManager = new BlockManager(new VirtualFile(0));
	blockManager.createBlock(256);
	let tree = new RadixTree(blockManager, blockManager.createBlock(256));
	tree.insert([getKeyFromString("a")], 1);
	tree.insert([getKeyFromString("b"), getKeyFromString("1")], 2);
	tree.insert([getKeyFromString("b"), getKeyFromString("2")], 3);
	tree.insert([getKeyFromString("c"), getKeyFromString("1")], 4);
	tree.insert([getKeyFromString("c"), getKeyFromString("2")], 5);
	tree.insert([getKeyFromString("d"), getKeyFromString("1")], 6);
	tree.insert([getKeyFromString("d"), getKeyFromString("2")], 7);

	test(`It should return the correct values when directions are "increasing", "increasing".`, async (assert) => {
		let results = tree.filter(">", [getKeyFromString("a")], ["increasing", "increasing"]);
		let observed = Array.from(results);
		let expected = [2, 3, 4, 5, 6, 7];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct values when directions are "increasing", "decreasing".`, async (assert) => {
		let results = tree.filter(">", [getKeyFromString("a")], ["increasing", "decreasing"]);
		let observed = Array.from(results);
		let expected = [3, 2, 5, 4, 7, 6];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct values when directions are "decreasing", "increasing".`, async (assert) => {
		let results = tree.filter(">", [getKeyFromString("a")], ["decreasing", "increasing"]);
		let observed = Array.from(results);
		let expected = [] as Array<number>;
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct values when directions are "decreasing", "decreasing".`, async (assert) => {
		let results = tree.filter(">", [getKeyFromString("a")], ["decreasing", "decreasing"]);
		let observed = Array.from(results);
		let expected = [] as Array<number>;
		assert.array.equals(observed, expected);
	});
})();

(async () => {
	let blockManager = new BlockManager(new VirtualFile(0));
	blockManager.createBlock(256);
	let tree = new RadixTree(blockManager, blockManager.createBlock(256));
	tree.insert([getKeyFromString("one")], 1);
	tree.insert([getKeyFromString("two")], 2);

	test(`It should support iteration.`, async (assert) => {
		let observed = Array.from(tree);
		let expected = [1, 2];
		assert.array.equals(observed, expected);
	});
})();

(async () => {
	let blockManager = new BlockManager(new VirtualFile(0));
	blockManager.createBlock(256);
	let tree = new RadixTree(blockManager, blockManager.createBlock(256));
	tree.insert([getKeyFromString("a"), getKeyFromString("a")], 1);
	tree.insert([getKeyFromString("a"), getKeyFromString("b")], 2);
	tree.insert([getKeyFromString("a"), getKeyFromString("c")], 3);
	tree.insert([getKeyFromString("b"), getKeyFromString("a")], 4);
	tree.insert([getKeyFromString("b"), getKeyFromString("b")], 5);
	tree.insert([getKeyFromString("b"), getKeyFromString("c")], 6);
	tree.insert([getKeyFromString("c"), getKeyFromString("a")], 7);
	tree.insert([getKeyFromString("c"), getKeyFromString("b")], 8);
	tree.insert([getKeyFromString("c"), getKeyFromString("c")], 9);

	test(`It should return the correct values when directions are "increasing", "increasing" and key is set.`, async (assert) => {
		let results = tree.filter(">", [getKeyFromString("b"), getKeyFromString("b")], ["increasing", "increasing"]);
		let observed = Array.from(results);
		let expected = [6, 7, 8, 9];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct values when directions are "increasing", "decreasing" and key is set.`, async (assert) => {
		let results = tree.filter(">", [getKeyFromString("b"), getKeyFromString("b")], ["increasing", "decreasing"]);
		let observed = Array.from(results);
		let expected = [4, 9, 8, 7];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct values when directions are "decreasing", "increasing" and key is set.`, async (assert) => {
		let results = tree.filter(">", [getKeyFromString("b"), getKeyFromString("b")], ["decreasing", "increasing"]);
		let observed = Array.from(results);
		let expected = [6, 1, 2, 3];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct values when directions are "decreasing", "decreasing" and key is set.`, async (assert) => {
		let results = tree.filter(">", [getKeyFromString("b"), getKeyFromString("b")], ["decreasing", "decreasing"]);
		let observed = Array.from(results);
		let expected = [4, 3, 2, 1];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct values when directions are "increasing", "increasing".`, async (assert) => {
		let results = tree.filter(">", [], ["increasing", "increasing"]);
		let observed = Array.from(results);
		let expected = [1, 2, 3, 4, 5, 6, 7, 8, 9];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct values when directions are "increasing", "decreasing".`, async (assert) => {
		let results = tree.filter(">", [], ["increasing", "decreasing"]);
		let observed = Array.from(results);
		let expected = [3, 2, 1, 6, 5, 4, 9, 8, 7];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct values when directions are "decreasing", "increasing".`, async (assert) => {
		let results = tree.filter(">", [], ["decreasing", "increasing"]);
		let observed = Array.from(results);
		let expected = [] as Array<number>;
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct values when directions are "decreasing", "decreasing".`, async (assert) => {
		let results = tree.filter(">", [], ["decreasing", "decreasing"]);
		let observed = Array.from(results);
		let expected = [] as Array<number>;
		assert.array.equals(observed, expected);
	});
})();

test(`It should throw errors when used after deletion.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	blockManager.createBlock(256);
	let tree = new RadixTree(blockManager, blockManager.createBlock(256));
	tree.delete();
	await assert.throws(async () => {
		Array.from(tree);
	});
	await assert.throws(async () => {
		tree.branch([]);
	});
	await assert.throws(async () => {
		tree.delete();
	});
	await assert.throws(async () => {
		tree.insert([], 1);
	});
	await assert.throws(async () => {
		tree.length();
	});
	await assert.throws(async () => {
		tree.lookup([]);
	});
	await assert.throws(async () => {
		tree.remove([]);
	});
	await assert.throws(async () => {
		Array.from(tree.filter("=", []));
	});
});

test(`It should support inserting values not prevously inserted.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	blockManager.createBlock(256);
	let tree = new RadixTree(blockManager, blockManager.createBlock(256));
	assert.true(tree.lookup([]) == null);
	tree.insert([], 1);
	assert.true(tree.lookup([]) === 1);
});

test(`It should support inserting values prevously inserted.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	blockManager.createBlock(256);
	let tree = new RadixTree(blockManager, blockManager.createBlock(256));
	assert.true(tree.lookup([]) == null);
	tree.insert([], 1);
	assert.true(tree.lookup([]) === 1);
	tree.insert([], 1);
	assert.true(tree.lookup([]) === 1);
});

test(`It should keep track of the number of values stored.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	blockManager.createBlock(256);
	let tree = new RadixTree(blockManager, blockManager.createBlock(256));
	assert.true(tree.length() === 0);
	tree.insert([getKeyFromString("a")], 1);
	assert.true(tree.length() === 1);
	tree.insert([getKeyFromString("b")], 2);
	assert.true(tree.length() === 2);
	tree.remove([getKeyFromString("b")]);
	assert.true(tree.length() === 1);
	tree.remove([getKeyFromString("a")]);
	assert.true(tree.length() === 0);
});

test(`It should support looking up values not prevously inserted.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	blockManager.createBlock(256);
	let tree = new RadixTree(blockManager, blockManager.createBlock(256));
	assert.true(tree.lookup([]) == null);
});

test(`It should support looking up values prevously inserted.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	blockManager.createBlock(256);
	let tree = new RadixTree(blockManager, blockManager.createBlock(256));
	assert.true(tree.lookup([]) == null);
	tree.insert([], 1);
	assert.true(tree.lookup([]) === 1);
});

test(`It should support removing values not prevously inserted.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	blockManager.createBlock(256);
	let tree = new RadixTree(blockManager, blockManager.createBlock(256));
	assert.true(tree.lookup([]) == null);
	tree.remove([]);
	assert.true(tree.lookup([]) == null);
});

test(`It should support removing values prevously inserted.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	blockManager.createBlock(256);
	let tree = new RadixTree(blockManager, blockManager.createBlock(256));
	assert.true(tree.lookup([]) == null);
	tree.insert([], 1);
	assert.true(tree.lookup([]) === 1);
	tree.remove([]);
	assert.true(tree.lookup([]) == null);
});
