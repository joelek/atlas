import * as bedrock from "@joelek/bedrock"
import { BlockManager } from "./blocks";
import { VirtualFile } from "./files";
import { combineRanges, RadixTree } from "./trees";
import { test } from "./test";

function getKeyFromString(string: string): Uint8Array {
	return bedrock.utils.Chunk.fromString(string, "utf-8");
};

(async () => {
	test(`It should combine ranges when range one is before range two.`, async (assert) => {
		let observed = combineRanges({ offset: 0, length: 2 }, { offset: 3, length: 4 }) ?? {};
		let expected = {};
		assert.record.equals(observed, expected);
	});

	test(`It should combine ranges when range one is just before range two.`, async (assert) => {
		let observed = combineRanges({ offset: 1, length: 2 }, { offset: 3, length: 4 }) ?? {};
		let expected = { offset: 1, length: 6 };
		assert.record.equals(observed, expected);
	});

	test(`It should combine ranges when range one overlaps the beginning of range two.`, async (assert) => {
		let observed = combineRanges({ offset: 2, length: 2 }, { offset: 3, length: 4 }) ?? {};
		let expected = { offset: 2, length: 5 };
		assert.record.equals(observed, expected);
	});

	test(`It should combine ranges when range one is at the beginning of range two.`, async (assert) => {
		let observed = combineRanges({ offset: 3, length: 2 }, { offset: 3, length: 4 }) ?? {};
		let expected = { offset: 3, length: 4 };
		assert.record.equals(observed, expected);
	});

	test(`It should combine ranges when range one is embedded into range two.`, async (assert) => {
		let observed = combineRanges({ offset: 4, length: 2 }, { offset: 3, length: 4 }) ?? {};
		let expected = { offset: 3, length: 4 };
		assert.record.equals(observed, expected);
	});

	test(`It should combine ranges when range one is at the end of range two.`, async (assert) => {
		let observed = combineRanges({ offset: 5, length: 2 }, { offset: 3, length: 4 }) ?? {};
		let expected = { offset: 3, length: 4 };
		assert.record.equals(observed, expected);
	});

	test(`It should combine ranges when range one overlaps the end of range two.`, async (assert) => {
		let observed = combineRanges({ offset: 6, length: 2 }, { offset: 3, length: 4 }) ?? {};
		let expected = { offset: 3, length: 5 };
		assert.record.equals(observed, expected);
	});

	test(`It should combine ranges when range one is just after range two.`, async (assert) => {
		let observed = combineRanges({ offset: 7, length: 2 }, { offset: 3, length: 4 }) ?? {};
		let expected = { offset: 3, length: 6 };
		assert.record.equals(observed, expected);
	});

	test(`It should combine ranges when range one is after range two.`, async (assert) => {
		let observed = combineRanges({ offset: 8, length: 2 }, { offset: 3, length: 4 }) ?? {};
		let expected = {};
		assert.record.equals(observed, expected);
	});
});

(async () => {
	let blockManager = new BlockManager(new VirtualFile(0));
	blockManager.createBlock(256);
	let tree = new RadixTree(blockManager, blockManager.createBlock(256));
	tree.insert([getKeyFromString("apa")], 1);
	test(`It should return the correct search results for a full root node match in > mode.`, async (assert) => {
		let results = tree.search([getKeyFromString("")], ">");
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

	test(`It should return the correct search results for a root node match in ^= mode.`, async (assert) => {
		let results = tree.search([getKeyFromString("")], "^=");
		let observed = Array.from(results);
		let expected = [1, 2, 3, 4, 5, 6];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct search results for an inner node match in ^= mode.`, async (assert) => {
		let results = tree.search([getKeyFromString("apa")], "^=");
		let observed = Array.from(results);
		let expected = [1, 2, 3];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct search results for a leaf node match in ^= mode.`, async (assert) => {
		let results = tree.search([getKeyFromString("apa1")], "^=");
		let observed = Array.from(results);
		let expected = [2];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct search results for a non-existing leaf node match in ^= mode.`, async (assert) => {
		let results = tree.search([getKeyFromString("apa2")], "^=");
		let observed = Array.from(results);
		let expected = [] as Array<number>;
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct search results for a partial inner node match in ^= mode.`, async (assert) => {
		let results = tree.search([getKeyFromString("ap")], "^=");
		let observed = Array.from(results);
		let expected = [1, 2, 3];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct search results for a childless leaf node match in ^= mode.`, async (assert) => {
		let results = tree.search([getKeyFromString("apa1b")], "^=");
		let observed = Array.from(results);
		let expected = [] as Array<number>;
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct search results for a root node match in = mode.`, async (assert) => {
		let results = tree.search([getKeyFromString("")], "=");
		let observed = Array.from(results);
		let expected = [] as Array<number>;
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct search results for an inner node match in = mode.`, async (assert) => {
		let results = tree.search([getKeyFromString("apa")], "=");
		let observed = Array.from(results);
		let expected = [1];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct search results for a leaf node match in = mode.`, async (assert) => {
		let results = tree.search([getKeyFromString("apa1")], "=");
		let observed = Array.from(results);
		let expected = [2];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct search results for a non-existing leaf node match in = mode.`, async (assert) => {
		let results = tree.search([getKeyFromString("apa2")], "=");
		let observed = Array.from(results);
		let expected = [] as Array<number>;
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct search results for a partial inner node match in = mode.`, async (assert) => {
		let results = tree.search([getKeyFromString("ap")], "=");
		let observed = Array.from(results);
		let expected = [] as Array<number>;
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct search results for a partial inner node match in = mode.`, async (assert) => {
		let results = tree.search([getKeyFromString("apa1b")], "=");
		let observed = Array.from(results);
		let expected = [] as Array<number>;
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct search results for a root node match in > mode.`, async (assert) => {
		let results = tree.search([getKeyFromString("")], ">");
		let observed = Array.from(results);
		let expected = [1, 2, 3, 4, 5, 6];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct search results for an inner node match in > mode.`, async (assert) => {
		let results = tree.search([getKeyFromString("apa")], ">");
		let observed = Array.from(results);
		let expected = [2, 3, 4, 5, 6];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct search results for a leaf node match in > mode.`, async (assert) => {
		let results = tree.search([getKeyFromString("apa1")], ">");
		let observed = Array.from(results);
		let expected = [3, 4, 5, 6];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct search results for a non-existing leaf node match in > mode.`, async (assert) => {
		let results = tree.search([getKeyFromString("apa2")], ">");
		let observed = Array.from(results);
		let expected = [3, 4, 5, 6];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct search results for a partial inner node match in > mode.`, async (assert) => {
		let results = tree.search([getKeyFromString("ap")], ">");
		let observed = Array.from(results);
		let expected = [1, 2, 3, 4, 5, 6];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct search results for a childless leaf node match in > mode.`, async (assert) => {
		let results = tree.search([getKeyFromString("apa1b")], ">");
		let observed = Array.from(results);
		let expected = [3, 4, 5, 6];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct search results for a root node match in >= mode.`, async (assert) => {
		let results = tree.search([getKeyFromString("")], ">=");
		let observed = Array.from(results);
		let expected = [1, 2, 3, 4, 5, 6];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct search results for an inner node match in >= mode.`, async (assert) => {
		let results = tree.search([getKeyFromString("apa")], ">=");
		let observed = Array.from(results);
		let expected = [1, 2, 3, 4, 5, 6];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct search results for a leaf node match in >= mode.`, async (assert) => {
		let results = tree.search([getKeyFromString("apa1")], ">=");
		let observed = Array.from(results);
		let expected = [2, 3, 4, 5, 6];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct search results for a non-existing leaf node match in >= mode.`, async (assert) => {
		let results = tree.search([getKeyFromString("apa2")], ">=");
		let observed = Array.from(results);
		let expected = [3, 4, 5, 6];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct search results for a partial inner node match in >= mode.`, async (assert) => {
		let results = tree.search([getKeyFromString("ap")], ">=");
		let observed = Array.from(results);
		let expected = [1, 2, 3, 4, 5, 6];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct search results for a childless leaf node match in >= mode.`, async (assert) => {
		let results = tree.search([getKeyFromString("apa1b")], ">=");
		let observed = Array.from(results);
		let expected = [3, 4, 5, 6];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct search results for a root node match in < mode.`, async (assert) => {
		let results = tree.search([getKeyFromString("")], "<");
		let observed = Array.from(results);
		let expected = [] as Array<number>;
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct search results for an inner node match in < mode.`, async (assert) => {
		let results = tree.search([getKeyFromString("banan")], "<");
		let observed = Array.from(results);
		let expected = [1, 2, 3];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct search results for a leaf node match in < mode.`, async (assert) => {
		let results = tree.search([getKeyFromString("banan1")], "<");
		let observed = Array.from(results);
		let expected = [1, 2, 3, 4];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct search results for a non-existing leaf node match in < mode.`, async (assert) => {
		let results = tree.search([getKeyFromString("banan2")], "<");
		let observed = Array.from(results);
		let expected = [1, 2, 3, 4, 5];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct search results for a partial inner node match in < mode.`, async (assert) => {
		let results = tree.search([getKeyFromString("bana")], "<");
		let observed = Array.from(results);
		let expected = [1, 2, 3];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct search results for a childless leaf node match in < mode.`, async (assert) => {
		let results = tree.search([getKeyFromString("banan1b")], "<");
		let observed = Array.from(results);
		let expected = [1, 2, 3, 4, 5];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct search results for a root node match in <= mode.`, async (assert) => {
		let results = tree.search([getKeyFromString("")], "<=");
		let observed = Array.from(results);
		let expected = [] as Array<number>;
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct search results for an inner node match in <= mode.`, async (assert) => {
		let results = tree.search([getKeyFromString("banan")], "<=");
		let observed = Array.from(results);
		let expected = [1, 2, 3, 4];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct search results for a leaf node match in <= mode.`, async (assert) => {
		let results = tree.search([getKeyFromString("banan1")], "<=");
		let observed = Array.from(results);
		let expected = [1, 2, 3, 4, 5];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct search results for a non-existing leaf node match in <= mode.`, async (assert) => {
		let results = tree.search([getKeyFromString("banan2")], "<=");
		let observed = Array.from(results);
		let expected = [1, 2, 3, 4, 5];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct search results for a partial inner node match in <= mode.`, async (assert) => {
		let results = tree.search([getKeyFromString("bana")], "<=");
		let observed = Array.from(results);
		let expected = [1, 2, 3];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct search results for a childless leaf node match in <= mode.`, async (assert) => {
		let results = tree.search([getKeyFromString("banan1b")], "<=");
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

	test(`It should return the correct branch for an existing trunk.`, async (assert) => {
		let results = tree.branch([getKeyFromString("one")]);
		let observed = Array.from(results ?? []);
		let expected = [2, 3];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct branch for a non-existing trunk.`, async (assert) => {
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

	test(`It should return the correct search results when directions are "increasing", "increasing".`, async (assert) => {
		let results = tree.search([getKeyFromString("a")], ">", { offset: 1, length: 3, directions: ["increasing", "increasing"]});
		let observed = Array.from(results);
		let expected = [3, 4, 5];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct search results when directions are "increasing", "decreasing".`, async (assert) => {
		let results = tree.search([getKeyFromString("a")], ">", { offset: 1, length: 3, directions: ["increasing", "decreasing"]});
		let observed = Array.from(results);
		let expected = [2, 5, 4];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct search results when directions are "decreasing", "increasing".`, async (assert) => {
		let results = tree.search([getKeyFromString("a")], ">", { offset: 1, length: 3, directions: ["decreasing", "increasing"]});
		let observed = Array.from(results);
		let expected = [7, 4, 5];
		assert.array.equals(observed, expected);
	});

	test(`It should return the correct search results when directions are "decreasing", "decreasing".`, async (assert) => {
		let results = tree.search([getKeyFromString("a")], ">", { offset: 1, length: 3, directions: ["decreasing", "decreasing"]});
		let observed = Array.from(results);
		let expected = [6, 5, 4];
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
