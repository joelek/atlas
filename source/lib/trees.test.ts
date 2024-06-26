import * as wtf from "@joelek/wtf";
import * as bedrock from "@joelek/bedrock"
import { BlockManager } from "./blocks";
import { VirtualFile } from "./files";
import { getKeyPermutations, RadixTree } from "./trees";
import { StreamIterable } from "./streams";

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

	wtf.test(`It should support ordered filtering in ">" mode.`, async (assert) => {
		let observed = Array.from(tree.filter(">", [getKeyFromString("B"), getKeyFromString("A"), getKeyFromString("A")], ["decreasing", "increasing", "decreasing"]));
		let expected = [8, 7, 2, 1, 4, 3];
		assert.equals(observed, expected);
	});

	wtf.test(`It should support ordered filtering in ">=" mode.`, async (assert) => {
		let observed = Array.from(tree.filter(">=", [getKeyFromString("B"), getKeyFromString("A"), getKeyFromString("A")], ["decreasing", "increasing", "decreasing"]));
		let expected = [5, 8, 7, 2, 1, 4, 3];
		assert.equals(observed, expected);
	});

	wtf.test(`It should support ordered filtering in "<" mode.`, async (assert) => {
		let observed = Array.from(tree.filter("<", [getKeyFromString("B"), getKeyFromString("A"), getKeyFromString("A")], ["decreasing", "increasing", "decreasing"]));
		let expected = [6];
		assert.equals(observed, expected);
	});

	wtf.test(`It should support ordered filtering in "<=" mode.`, async (assert) => {
		let observed = Array.from(tree.filter("<=", [getKeyFromString("B"), getKeyFromString("A"), getKeyFromString("A")], ["decreasing", "increasing", "decreasing"]));
		let expected = [6, 5];
		assert.equals(observed, expected);
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

	wtf.test(`It should support filtering values matching a zero element key in "^=" mode`, async (assert) => {
		let observed = Array.from(tree.filter("^=", []));
		let expected = [1, 2, 3, 4, 5, 6, 7] as Array<number>;
		assert.equals(observed, expected);
	});

	wtf.test(`It should support filtering values matching a zero element key in "=" mode`, async (assert) => {
		let observed = Array.from(tree.filter("=", []));
		let expected = [] as Array<number>;
		assert.equals(observed, expected);
	});

	wtf.test(`It should support filtering values matching a zero element key in ">" mode`, async (assert) => {
		let observed = Array.from(tree.filter(">", []));
		let expected = [1, 2, 3, 4, 5, 6, 7] as Array<number>;
		assert.equals(observed, expected);
	});

	wtf.test(`It should support filtering values matching a zero element key in ">=" mode`, async (assert) => {
		let observed = Array.from(tree.filter(">=", []));
		let expected = [1, 2, 3, 4, 5, 6, 7] as Array<number>;
		assert.equals(observed, expected);
	});

	wtf.test(`It should support filtering values matching a zero element key in "<" mode`, async (assert) => {
		let observed = Array.from(tree.filter("<", []));
		let expected = [] as Array<number>;
		assert.equals(observed, expected);
	});

	wtf.test(`It should support filtering values matching a zero element key in "<=" mode`, async (assert) => {
		let observed = Array.from(tree.filter("<=", []));
		let expected = [] as Array<number>;
		assert.equals(observed, expected);
	});

	wtf.test(`It should support filtering values matching a one element key in "^=" mode`, async (assert) => {
		let observed = Array.from(tree.filter("^=", [getKeyFromString("a")]));
		let expected = [1, 2, 3] as Array<number>;
		assert.equals(observed, expected);
	});

	wtf.test(`It should support filtering values matching a one element key in "=" mode`, async (assert) => {
		let observed = Array.from(tree.filter("=", [getKeyFromString("a")]));
		let expected = [1] as Array<number>;
		assert.equals(observed, expected);
	});

	wtf.test(`It should support filtering values matching a one element key in ">" mode`, async (assert) => {
		let observed = Array.from(tree.filter(">", [getKeyFromString("a")]));
		let expected = [2, 3, 4, 5, 6, 7] as Array<number>;
		assert.equals(observed, expected);
	});

	wtf.test(`It should support filtering values matching a one element key in ">=" mode`, async (assert) => {
		let observed = Array.from(tree.filter(">=", [getKeyFromString("a")]));
		let expected = [1, 2, 3, 4, 5, 6, 7] as Array<number>;
		assert.equals(observed, expected);
	});

	wtf.test(`It should support filtering values matching a one element key in "<" mode`, async (assert) => {
		let observed = Array.from(tree.filter("<", [getKeyFromString("b")]));
		let expected = [1, 2, 3] as Array<number>;
		assert.equals(observed, expected);
	});

	wtf.test(`It should support filtering values matching a one element key in "<=" mode`, async (assert) => {
		let observed = Array.from(tree.filter("<=", [getKeyFromString("b")]));
		let expected = [1, 2, 3, 4] as Array<number>;
		assert.equals(observed, expected);
	});

	wtf.test(`It should support filtering values matching a two element key in "^=" mode`, async (assert) => {
		let observed = Array.from(tree.filter("^=", [getKeyFromString("a"), getKeyFromString("a")]));
		let expected = [2] as Array<number>;
		assert.equals(observed, expected);
	});

	wtf.test(`It should support filtering values matching a two element key in "=" mode`, async (assert) => {
		let observed = Array.from(tree.filter("=", [getKeyFromString("a"), getKeyFromString("a")]));
		let expected = [2] as Array<number>;
		assert.equals(observed, expected);
	});

	wtf.test(`It should support filtering values matching a two element key in ">" mode`, async (assert) => {
		let observed = Array.from(tree.filter(">", [getKeyFromString("a"), getKeyFromString("a")]));
		let expected = [3, 4, 5, 6, 7] as Array<number>;
		assert.equals(observed, expected);
	});

	wtf.test(`It should support filtering values matching a two element key in ">=" mode`, async (assert) => {
		let observed = Array.from(tree.filter(">=", [getKeyFromString("a"), getKeyFromString("a")]));
		let expected = [2, 3, 4, 5, 6, 7] as Array<number>;
		assert.equals(observed, expected);
	});

	wtf.test(`It should support filtering values matching a two element key in "<" mode`, async (assert) => {
		let observed = Array.from(tree.filter("<", [getKeyFromString("b"), getKeyFromString("b")]));
		let expected = [1, 2, 3, 4, 5] as Array<number>;
		assert.equals(observed, expected);
	});

	wtf.test(`It should support filtering values matching a two element key in "<=" mode`, async (assert) => {
		let observed = Array.from(tree.filter("<=", [getKeyFromString("b"), getKeyFromString("b")]));
		let expected = [1, 2, 3, 4, 5, 6] as Array<number>;
		assert.equals(observed, expected);
	});
})();

(async () => {
	let blockManager = new BlockManager(new VirtualFile(0));
	blockManager.createBlock(256);
	let tree = new RadixTree(blockManager, blockManager.createBlock(256));
	tree.insert([getKeyFromString("apa")], 1);
	wtf.test(`It should return the correct values for a full root node match in > mode.`, async (assert) => {
		let results = tree.filter(">", [getKeyFromString("")]);
		let observed = Array.from(results);
		let expected = [1];
		assert.equals(observed, expected);
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

	wtf.test(`It should return the correct values for a root node match in ^= mode.`, async (assert) => {
		let results = tree.filter("^=", [getKeyFromString("")]);
		let observed = Array.from(results);
		let expected = [1, 2, 3, 4, 5, 6];
		assert.equals(observed, expected);
	});

	wtf.test(`It should return the correct values for an inner node match in ^= mode.`, async (assert) => {
		let results = tree.filter("^=", [getKeyFromString("apa")]);
		let observed = Array.from(results);
		let expected = [1, 2, 3];
		assert.equals(observed, expected);
	});

	wtf.test(`It should return the correct values for a leaf node match in ^= mode.`, async (assert) => {
		let results = tree.filter("^=", [getKeyFromString("apa1")]);
		let observed = Array.from(results);
		let expected = [2];
		assert.equals(observed, expected);
	});

	wtf.test(`It should return the correct values for a non-existing leaf node match in ^= mode.`, async (assert) => {
		let results = tree.filter("^=", [getKeyFromString("apa2")]);
		let observed = Array.from(results);
		let expected = [] as Array<number>;
		assert.equals(observed, expected);
	});

	wtf.test(`It should return the correct values for a partial inner node match in ^= mode.`, async (assert) => {
		let results = tree.filter("^=", [getKeyFromString("ap")]);
		let observed = Array.from(results);
		let expected = [1, 2, 3];
		assert.equals(observed, expected);
	});

	wtf.test(`It should return the correct values for a childless leaf node match in ^= mode.`, async (assert) => {
		let results = tree.filter("^=", [getKeyFromString("apa1b")]);
		let observed = Array.from(results);
		let expected = [] as Array<number>;
		assert.equals(observed, expected);
	});

	wtf.test(`It should return the correct values for a root node match in = mode.`, async (assert) => {
		let results = tree.filter("=", [getKeyFromString("")]);
		let observed = Array.from(results);
		let expected = [] as Array<number>;
		assert.equals(observed, expected);
	});

	wtf.test(`It should return the correct values for an inner node match in = mode.`, async (assert) => {
		let results = tree.filter("=", [getKeyFromString("apa")]);
		let observed = Array.from(results);
		let expected = [1];
		assert.equals(observed, expected);
	});

	wtf.test(`It should return the correct values for a leaf node match in = mode.`, async (assert) => {
		let results = tree.filter("=", [getKeyFromString("apa1")]);
		let observed = Array.from(results);
		let expected = [2];
		assert.equals(observed, expected);
	});

	wtf.test(`It should return the correct values for a non-existing leaf node match in = mode.`, async (assert) => {
		let results = tree.filter("=", [getKeyFromString("apa2")]);
		let observed = Array.from(results);
		let expected = [] as Array<number>;
		assert.equals(observed, expected);
	});

	wtf.test(`It should return the correct values for a partial inner node match in = mode.`, async (assert) => {
		let results = tree.filter("=", [getKeyFromString("ap")]);
		let observed = Array.from(results);
		let expected = [] as Array<number>;
		assert.equals(observed, expected);
	});

	wtf.test(`It should return the correct values for a partial inner node match in = mode.`, async (assert) => {
		let results = tree.filter("=", [getKeyFromString("apa1b")]);
		let observed = Array.from(results);
		let expected = [] as Array<number>;
		assert.equals(observed, expected);
	});

	wtf.test(`It should return the correct values for a root node match in > mode.`, async (assert) => {
		let results = tree.filter(">", [getKeyFromString("")]);
		let observed = Array.from(results);
		let expected = [1, 2, 3, 4, 5, 6];
		assert.equals(observed, expected);
	});

	wtf.test(`It should return the correct values for an inner node match in > mode.`, async (assert) => {
		let results = tree.filter(">", [getKeyFromString("apa")]);
		let observed = Array.from(results);
		let expected = [2, 3, 4, 5, 6];
		assert.equals(observed, expected);
	});

	wtf.test(`It should return the correct values for a leaf node match in > mode.`, async (assert) => {
		let results = tree.filter(">", [getKeyFromString("apa1")]);
		let observed = Array.from(results);
		let expected = [3, 4, 5, 6];
		assert.equals(observed, expected);
	});

	wtf.test(`It should return the correct values for a non-existing leaf node match in > mode.`, async (assert) => {
		let results = tree.filter(">", [getKeyFromString("apa2")]);
		let observed = Array.from(results);
		let expected = [3, 4, 5, 6];
		assert.equals(observed, expected);
	});

	wtf.test(`It should return the correct values for a partial inner node match in > mode.`, async (assert) => {
		let results = tree.filter(">", [getKeyFromString("ap")]);
		let observed = Array.from(results);
		let expected = [1, 2, 3, 4, 5, 6];
		assert.equals(observed, expected);
	});

	wtf.test(`It should return the correct values for a childless leaf node match in > mode.`, async (assert) => {
		let results = tree.filter(">", [getKeyFromString("apa1b")]);
		let observed = Array.from(results);
		let expected = [3, 4, 5, 6];
		assert.equals(observed, expected);
	});

	wtf.test(`It should return the correct values for a root node match in >= mode.`, async (assert) => {
		let results = tree.filter(">=", [getKeyFromString("")]);
		let observed = Array.from(results);
		let expected = [1, 2, 3, 4, 5, 6];
		assert.equals(observed, expected);
	});

	wtf.test(`It should return the correct values for an inner node match in >= mode.`, async (assert) => {
		let results = tree.filter(">=", [getKeyFromString("apa")]);
		let observed = Array.from(results);
		let expected = [1, 2, 3, 4, 5, 6];
		assert.equals(observed, expected);
	});

	wtf.test(`It should return the correct values for a leaf node match in >= mode.`, async (assert) => {
		let results = tree.filter(">=", [getKeyFromString("apa1")]);
		let observed = Array.from(results);
		let expected = [2, 3, 4, 5, 6];
		assert.equals(observed, expected);
	});

	wtf.test(`It should return the correct values for a non-existing leaf node match in >= mode.`, async (assert) => {
		let results = tree.filter(">=", [getKeyFromString("apa2")]);
		let observed = Array.from(results);
		let expected = [3, 4, 5, 6];
		assert.equals(observed, expected);
	});

	wtf.test(`It should return the correct values for a partial inner node match in >= mode.`, async (assert) => {
		let results = tree.filter(">=", [getKeyFromString("ap")]);
		let observed = Array.from(results);
		let expected = [1, 2, 3, 4, 5, 6];
		assert.equals(observed, expected);
	});

	wtf.test(`It should return the correct values for a childless leaf node match in >= mode.`, async (assert) => {
		let results = tree.filter(">=", [getKeyFromString("apa1b")]);
		let observed = Array.from(results);
		let expected = [3, 4, 5, 6];
		assert.equals(observed, expected);
	});

	wtf.test(`It should return the correct values for a root node match in < mode.`, async (assert) => {
		let results = tree.filter("<", [getKeyFromString("")]);
		let observed = Array.from(results);
		let expected = [] as Array<number>;
		assert.equals(observed, expected);
	});

	wtf.test(`It should return the correct values for an inner node match in < mode.`, async (assert) => {
		let results = tree.filter("<", [getKeyFromString("banan")]);
		let observed = Array.from(results);
		let expected = [1, 2, 3];
		assert.equals(observed, expected);
	});

	wtf.test(`It should return the correct values for a leaf node match in < mode.`, async (assert) => {
		let results = tree.filter("<", [getKeyFromString("banan1")]);
		let observed = Array.from(results);
		let expected = [1, 2, 3, 4];
		assert.equals(observed, expected);
	});

	wtf.test(`It should return the correct values for a non-existing leaf node match in < mode.`, async (assert) => {
		let results = tree.filter("<", [getKeyFromString("banan2")]);
		let observed = Array.from(results);
		let expected = [1, 2, 3, 4, 5];
		assert.equals(observed, expected);
	});

	wtf.test(`It should return the correct values for a partial inner node match in < mode.`, async (assert) => {
		let results = tree.filter("<", [getKeyFromString("bana")]);
		let observed = Array.from(results);
		let expected = [1, 2, 3];
		assert.equals(observed, expected);
	});

	wtf.test(`It should return the correct values for a childless leaf node match in < mode.`, async (assert) => {
		let results = tree.filter("<", [getKeyFromString("banan1b")]);
		let observed = Array.from(results);
		let expected = [1, 2, 3, 4, 5];
		assert.equals(observed, expected);
	});

	wtf.test(`It should return the correct values for a root node match in <= mode.`, async (assert) => {
		let results = tree.filter("<=", [getKeyFromString("")]);
		let observed = Array.from(results);
		let expected = [] as Array<number>;
		assert.equals(observed, expected);
	});

	wtf.test(`It should return the correct values for an inner node match in <= mode.`, async (assert) => {
		let results = tree.filter("<=", [getKeyFromString("banan")]);
		let observed = Array.from(results);
		let expected = [1, 2, 3, 4];
		assert.equals(observed, expected);
	});

	wtf.test(`It should return the correct values for a leaf node match in <= mode.`, async (assert) => {
		let results = tree.filter("<=", [getKeyFromString("banan1")]);
		let observed = Array.from(results);
		let expected = [1, 2, 3, 4, 5];
		assert.equals(observed, expected);
	});

	wtf.test(`It should return the correct values for a non-existing leaf node match in <= mode.`, async (assert) => {
		let results = tree.filter("<=", [getKeyFromString("banan2")]);
		let observed = Array.from(results);
		let expected = [1, 2, 3, 4, 5];
		assert.equals(observed, expected);
	});

	wtf.test(`It should return the correct values for a partial inner node match in <= mode.`, async (assert) => {
		let results = tree.filter("<=", [getKeyFromString("bana")]);
		let observed = Array.from(results);
		let expected = [1, 2, 3];
		assert.equals(observed, expected);
	});

	wtf.test(`It should return the correct values for a childless leaf node match in <= mode.`, async (assert) => {
		let results = tree.filter("<=", [getKeyFromString("banan1b")]);
		let observed = Array.from(results);
		let expected = [1, 2, 3, 4, 5];
		assert.equals(observed, expected);
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

	wtf.test(`It should return the correct branch for an existing key in "=" mode.`, async (assert) => {
		let results = StreamIterable.of(tree.branch("=", [getKeyFromString("one")])).shift();
		let observed = Array.from(results ?? []);
		let expected = [2, 3];
		assert.equals(observed, expected);
	});

	wtf.test(`It should return the correct branch for a non-existing key in "=" mode.`, async (assert) => {
		let results = StreamIterable.of(tree.branch("=", [getKeyFromString("three")])).shift();
		let observed = Array.from(results ?? []);
		let expected = [] as Array<number>;
		assert.equals(observed, expected);
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

	wtf.test(`It should return the correct values when directions are "increasing", "increasing".`, async (assert) => {
		let results = tree.filter(">", [getKeyFromString("a")], ["increasing", "increasing"]);
		let observed = Array.from(results);
		let expected = [2, 3, 4, 5, 6, 7];
		assert.equals(observed, expected);
	});

	wtf.test(`It should return the correct values when directions are "increasing", "decreasing".`, async (assert) => {
		let results = tree.filter(">", [getKeyFromString("a")], ["increasing", "decreasing"]);
		let observed = Array.from(results);
		let expected = [3, 2, 5, 4, 7, 6];
		assert.equals(observed, expected);
	});

	wtf.test(`It should return the correct values when directions are "decreasing", "increasing".`, async (assert) => {
		let results = tree.filter(">", [getKeyFromString("a")], ["decreasing", "increasing"]);
		let observed = Array.from(results);
		let expected = [] as Array<number>;
		assert.equals(observed, expected);
	});

	wtf.test(`It should return the correct values when directions are "decreasing", "decreasing".`, async (assert) => {
		let results = tree.filter(">", [getKeyFromString("a")], ["decreasing", "decreasing"]);
		let observed = Array.from(results);
		let expected = [] as Array<number>;
		assert.equals(observed, expected);
	});
})();

(async () => {
	let blockManager = new BlockManager(new VirtualFile(0));
	blockManager.createBlock(256);
	let tree = new RadixTree(blockManager, blockManager.createBlock(256));
	tree.insert([getKeyFromString("one")], 1);
	tree.insert([getKeyFromString("two")], 2);

	wtf.test(`It should support iteration.`, async (assert) => {
		let observed = Array.from(tree);
		let expected = [1, 2];
		assert.equals(observed, expected);
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

	wtf.test(`It should return the correct values when directions are "increasing", "increasing" and key is set.`, async (assert) => {
		let results = tree.filter(">", [getKeyFromString("b"), getKeyFromString("b")], ["increasing", "increasing"]);
		let observed = Array.from(results);
		let expected = [6, 7, 8, 9];
		assert.equals(observed, expected);
	});

	wtf.test(`It should return the correct values when directions are "increasing", "decreasing" and key is set.`, async (assert) => {
		let results = tree.filter(">", [getKeyFromString("b"), getKeyFromString("b")], ["increasing", "decreasing"]);
		let observed = Array.from(results);
		let expected = [4, 9, 8, 7];
		assert.equals(observed, expected);
	});

	wtf.test(`It should return the correct values when directions are "decreasing", "increasing" and key is set.`, async (assert) => {
		let results = tree.filter(">", [getKeyFromString("b"), getKeyFromString("b")], ["decreasing", "increasing"]);
		let observed = Array.from(results);
		let expected = [6, 1, 2, 3];
		assert.equals(observed, expected);
	});

	wtf.test(`It should return the correct values when directions are "decreasing", "decreasing" and key is set.`, async (assert) => {
		let results = tree.filter(">", [getKeyFromString("b"), getKeyFromString("b")], ["decreasing", "decreasing"]);
		let observed = Array.from(results);
		let expected = [4, 3, 2, 1];
		assert.equals(observed, expected);
	});

	wtf.test(`It should return the correct values when directions are "increasing", "increasing".`, async (assert) => {
		let results = tree.filter(">", [], ["increasing", "increasing"]);
		let observed = Array.from(results);
		let expected = [1, 2, 3, 4, 5, 6, 7, 8, 9];
		assert.equals(observed, expected);
	});

	wtf.test(`It should return the correct values when directions are "increasing", "decreasing".`, async (assert) => {
		let results = tree.filter(">", [], ["increasing", "decreasing"]);
		let observed = Array.from(results);
		let expected = [3, 2, 1, 6, 5, 4, 9, 8, 7];
		assert.equals(observed, expected);
	});

	wtf.test(`It should return the correct values when directions are "decreasing", "increasing".`, async (assert) => {
		let results = tree.filter(">", [], ["decreasing", "increasing"]);
		let observed = Array.from(results);
		let expected = [] as Array<number>;
		assert.equals(observed, expected);
	});

	wtf.test(`It should return the correct values when directions are "decreasing", "decreasing".`, async (assert) => {
		let results = tree.filter(">", [], ["decreasing", "decreasing"]);
		let observed = Array.from(results);
		let expected = [] as Array<number>;
		assert.equals(observed, expected);
	});
})();

wtf.test(`It should throw errors when used after deletion.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	blockManager.createBlock(256);
	let tree = new RadixTree(blockManager, blockManager.createBlock(256));
	tree.delete();
	await assert.throws(async () => {
		Array.from(tree);
	});
	await assert.throws(async () => {
		Array.from(tree.branch("=", []));
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
	await assert.throws(async () => {
		tree.vacate();
	});
});

wtf.test(`It should support inserting values not prevously inserted.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	blockManager.createBlock(256);
	let tree = new RadixTree(blockManager, blockManager.createBlock(256));
	assert.equals(tree.lookup([]), undefined);
	tree.insert([], 1);
	assert.equals(tree.lookup([]), 1);
});

wtf.test(`It should support inserting values prevously inserted.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	blockManager.createBlock(256);
	let tree = new RadixTree(blockManager, blockManager.createBlock(256));
	assert.equals(tree.lookup([]), undefined);
	tree.insert([], 1);
	assert.equals(tree.lookup([]), 1);
	tree.insert([], 1);
	assert.equals(tree.lookup([]), 1);
});

wtf.test(`It should keep track of the number of values stored.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	blockManager.createBlock(256);
	let tree = new RadixTree(blockManager, blockManager.createBlock(256));
	assert.equals(tree.length(), 0);
	tree.insert([getKeyFromString("a")], 1);
	assert.equals(tree.length(), 1);
	tree.insert([getKeyFromString("b")], 2);
	assert.equals(tree.length(), 2);
	tree.remove([getKeyFromString("b")]);
	assert.equals(tree.length(), 1);
	tree.remove([getKeyFromString("a")]);
	assert.equals(tree.length(), 0);
});

wtf.test(`It should support looking up values not prevously inserted.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	blockManager.createBlock(256);
	let tree = new RadixTree(blockManager, blockManager.createBlock(256));
	assert.equals(tree.lookup([]), undefined);
});

wtf.test(`It should support looking up values prevously inserted.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	blockManager.createBlock(256);
	let tree = new RadixTree(blockManager, blockManager.createBlock(256));
	assert.equals(tree.lookup([]), undefined);
	tree.insert([], 1);
	assert.equals(tree.lookup([]), 1);
});

wtf.test(`It should support removing values not prevously inserted.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	blockManager.createBlock(256);
	let tree = new RadixTree(blockManager, blockManager.createBlock(256));
	assert.equals(tree.lookup([]), undefined);
	tree.remove([]);
	assert.equals(tree.lookup([]), undefined);
});

wtf.test(`It should support removing values prevously inserted.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	blockManager.createBlock(256);
	let tree = new RadixTree(blockManager, blockManager.createBlock(256));
	assert.equals(tree.lookup([]), undefined);
	tree.insert([], 1);
	assert.equals(tree.lookup([]), 1);
	tree.remove([]);
	assert.equals(tree.lookup([]), undefined);
});

wtf.test(`It should support vacating.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	blockManager.createBlock(256);
	let tree = new RadixTree(blockManager, blockManager.createBlock(256));
	tree.insert([], 1);
	tree.insert([], 2);
	tree.vacate();
	let observed = Array.from(tree).sort();
	let expected = [] as Array<number>;
	assert.equals(observed, expected);
});

wtf.test(`It should support inserting values with a key already inserted being a prefix for the key.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	blockManager.createBlock(256);
	let tree = new RadixTree(blockManager, blockManager.createBlock(256));
	tree.insert([getKeyFromString("a")], 1);
	tree.insert([getKeyFromString("ab")], 2);
	let observed = Array.from(tree);
	let expected = [1, 2];
	assert.equals(observed, expected);
});

wtf.test(`It should support inserting values with the key being a prefix for a key already inserted.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	blockManager.createBlock(256);
	let tree = new RadixTree(blockManager, blockManager.createBlock(256));
	tree.insert([getKeyFromString("ab")], 1);
	tree.insert([getKeyFromString("a")], 2);
	let observed = Array.from(tree);
	let expected = [2, 1];
	assert.equals(observed, expected);
});

wtf.test(`It should support inserting values with the key being indentical to a key already inserted.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	blockManager.createBlock(256);
	let tree = new RadixTree(blockManager, blockManager.createBlock(256));
	tree.insert([getKeyFromString("a")], 1);
	tree.insert([getKeyFromString("a")], 2);
	let observed = Array.from(tree);
	let expected = [2];
	assert.equals(observed, expected);
});

wtf.test(`It should support inserting values with the key being a lesser sibling of a key already inserted.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	blockManager.createBlock(256);
	let tree = new RadixTree(blockManager, blockManager.createBlock(256));
	tree.insert([getKeyFromString("b")], 1);
	tree.insert([getKeyFromString("a")], 2);
	let observed = Array.from(tree);
	let expected = [2, 1];
	assert.equals(observed, expected);
});

wtf.test(`It should support inserting values with the key being a greater sibling of a key already inserted.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	blockManager.createBlock(256);
	let tree = new RadixTree(blockManager, blockManager.createBlock(256));
	tree.insert([getKeyFromString("a")], 1);
	tree.insert([getKeyFromString("b")], 2);
	let observed = Array.from(tree);
	let expected = [1, 2];
	assert.equals(observed, expected);
});

wtf.test(`It should support inserting long values.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	blockManager.createBlock(256);
	let tree = new RadixTree(blockManager, blockManager.createBlock(256));
	tree.insert([getKeyFromString("01234566789abcdef")], 1);
	let observed = Array.from(tree);
	let expected = [1];
	assert.equals(observed, expected);
});

wtf.test(`It should support removing values with a key already inserted being a prefix for the key.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	blockManager.createBlock(256);
	let tree = new RadixTree(blockManager, blockManager.createBlock(256));
	tree.insert([getKeyFromString("a")], 1);
	tree.insert([getKeyFromString("ab")], 2);
	tree.remove([getKeyFromString("ab")]);
	let observed = Array.from(tree);
	let expected = [1];
	assert.equals(observed, expected);
});

wtf.test(`It should support removing values with the key being a prefix for a key already inserted.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	blockManager.createBlock(256);
	let tree = new RadixTree(blockManager, blockManager.createBlock(256));
	tree.insert([getKeyFromString("ab")], 1);
	tree.insert([getKeyFromString("a")], 2);
	tree.remove([getKeyFromString("a")]);
	let observed = Array.from(tree);
	let expected = [1];
	assert.equals(observed, expected);
});

wtf.test(`It should support removing values with the key being indentical to a key already inserted.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	blockManager.createBlock(256);
	let tree = new RadixTree(blockManager, blockManager.createBlock(256));
	tree.insert([getKeyFromString("a")], 1);
	tree.insert([getKeyFromString("a")], 2);
	tree.remove([getKeyFromString("a")]);
	let observed = Array.from(tree);
	let expected = [] as Array<number>;
	assert.equals(observed, expected);
});

wtf.test(`It should support removing values with the key being a lesser sibling of a key already inserted.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	blockManager.createBlock(256);
	let tree = new RadixTree(blockManager, blockManager.createBlock(256));
	tree.insert([getKeyFromString("b")], 1);
	tree.insert([getKeyFromString("a")], 2);
	tree.remove([getKeyFromString("a")]);
	let observed = Array.from(tree);
	let expected = [1];
	assert.equals(observed, expected);
});

wtf.test(`It should support removing values with the key being a greater sibling of a key already inserted.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	blockManager.createBlock(256);
	let tree = new RadixTree(blockManager, blockManager.createBlock(256));
	tree.insert([getKeyFromString("a")], 1);
	tree.insert([getKeyFromString("b")], 2);
	tree.remove([getKeyFromString("b")]);
	let observed = Array.from(tree);
	let expected = [1];
	assert.equals(observed, expected);
});

wtf.test(`It should support removing long values.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	blockManager.createBlock(256);
	let tree = new RadixTree(blockManager, blockManager.createBlock(256));
	tree.insert([getKeyFromString("01234566789abcdef")], 1);
	tree.remove([getKeyFromString("01234566789abcdef")]);
	let observed = Array.from(tree);
	let expected = [] as Array<number>;
	assert.equals(observed, expected);
});

wtf.test(`It should create key permutations.`, async (assert) => {
	let observed = getKeyPermutations([[0], [1, 2], [3, 4], [5]].map((array) => array.map((value) => Uint8Array.of(value)))).map((array) => array.map((value) => value[0]));
	assert.equals(observed, [
		[0, 1, 3, 5],
		[0, 1, 4, 5],
		[0, 2, 3, 5],
		[0, 2, 4, 5]
	]);
});
