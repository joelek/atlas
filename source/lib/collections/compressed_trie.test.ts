import { InMemoryBlockHandler } from "../storage";
import { StreamIterable } from "../stream";
import * as keys from "../keys";
import * as subject from "./";

let blockHandler = new InMemoryBlockHandler();
blockHandler.createBlock(256);
blockHandler.createBlock(256);
let map = new subject.CompressedTrie(blockHandler, 1);
map.insert([Buffer.from("apa")], 1);
map.insert([Buffer.from("apa1")], 2);
map.insert([Buffer.from("apa3")], 3);
map.insert([Buffer.from("banan")], 4);
map.insert([Buffer.from("banan1")], 5);
map.insert([Buffer.from("banan3")], 6);

(async () => {
	(async () => {
		let results = map.search([Buffer.from("")], "^=");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [1, 2, 3, 4, 5, 6];
		console.assert(keys.comparePathPart(observed, expected) === 0,
			`It should return the correct search results for a root node match in ^= mode.`
		);
	})();

	(async () => {
		let results = map.search([Buffer.from("apa")], "^=");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [1, 2, 3];
		console.assert(keys.comparePathPart(observed, expected) === 0,
			`It should return the correct search results for an inner node match in ^= mode.`
		);
	})();

	(async () => {
		let results = map.search([Buffer.from("apa1")], "^=");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [2];
		console.assert(keys.comparePathPart(observed, expected) === 0,
			`It should return the correct search results for a leaf node match in ^= mode.`
		);
	})();

	(async () => {
		let results = map.search([Buffer.from("apa2")], "^=");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [] as Array<number>;
		console.assert(keys.comparePathPart(observed, expected) === 0,
			`It should return the correct search results for a non-existing leaf node match in ^= mode.`
		);
	})();

	(async () => {
		let results = map.search([Buffer.from("ap")], "^=");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [1, 2, 3];
		console.assert(keys.comparePathPart(observed, expected) === 0,
			`It should return the correct search results for a partial inner node match in ^= mode.`
		);
	})();

	(async () => {
		let results = map.search([Buffer.from("apa1b")], "^=");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [] as Array<number>;
		console.assert(keys.comparePathPart(observed, expected) === 0,
			`It should return the correct search results for a childless leaf node match in ^= mode.`
		);
	})();
})();

(async () => {
	(async () => {
		let results = map.search([Buffer.from("")], "=");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [] as Array<number>;
		console.assert(keys.comparePathPart(observed, expected) === 0,
			`It should return the correct search results for a root node match in = mode.`
		);
	})();

	(async () => {
		let results = map.search([Buffer.from("apa")], "=");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [1];
		console.assert(keys.comparePathPart(observed, expected) === 0,
			`It should return the correct search results for an inner node match in = mode.`
		);
	})();

	(async () => {
		let results = map.search([Buffer.from("apa1")], "=");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [2];
		console.assert(keys.comparePathPart(observed, expected) === 0,
			`It should return the correct search results for a leaf node match in = mode.`
		);
	})();

	(async () => {
		let results = map.search([Buffer.from("apa2")], "=");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [] as Array<number>;
		console.assert(keys.comparePathPart(observed, expected) === 0,
			`It should return the correct search results for a non-existing leaf node match in = mode.`
		);
	})();

	(async () => {
		let results = map.search([Buffer.from("ap")], "=");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [] as Array<number>;
		console.assert(keys.comparePathPart(observed, expected) === 0,
			`It should return the correct search results for a partial inner node match in = mode.`
		);
	})();

	(async () => {
		let results = map.search([Buffer.from("apa1b")], "=");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [] as Array<number>;
		console.assert(keys.comparePathPart(observed, expected) === 0,
			`It should return the correct search results for a childless leaf node match in = mode.`
		);
	})();
})();

(async () => {
	(async () => {
		let results = map.search([Buffer.from("")], ">");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [1, 2, 3, 4, 5, 6];
		console.assert(keys.comparePathPart(observed, expected) === 0,
			`It should return the correct search results for a root node match in > mode.`
		);
	})();

	(async () => {
		let results = map.search([Buffer.from("apa")], ">");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [2, 3, 4, 5, 6];
		console.assert(keys.comparePathPart(observed, expected) === 0,
			`It should return the correct search results for an inner node match in > mode.`
		);
	})();

	(async () => {
		let results = map.search([Buffer.from("apa1")], ">");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [3, 4, 5, 6];
		console.assert(keys.comparePathPart(observed, expected) === 0,
			`It should return the correct search results for a leaf node match in > mode.`
		);
	})();

	(async () => {
		let results = map.search([Buffer.from("apa2")], ">");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [3, 4, 5, 6];
		console.assert(keys.comparePathPart(observed, expected) === 0,
			`It should return the correct search results for a non-existing leaf node match in > mode.`
		);
	})();

	(async () => {
		let results = map.search([Buffer.from("ap")], ">");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [1, 2, 3, 4, 5, 6];
		console.assert(keys.comparePathPart(observed, expected) === 0,
			`It should return the correct search results for a partial inner node match in > mode.`
		);
	})();

	(async () => {
		let results = map.search([Buffer.from("apa1b")], ">");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [3, 4, 5, 6];
		console.assert(keys.comparePathPart(observed, expected) === 0,
			`It should return the correct search results for a childless leaf node match in > mode.`
		);
	})();
})();

(async () => {
	(async () => {
		let results = map.search([Buffer.from("")], ">=");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [1, 2, 3, 4, 5, 6];
		console.assert(keys.comparePathPart(observed, expected) === 0,
			`It should return the correct search results for a root node match in >= mode.`
		);
	})();

	(async () => {
		let results = map.search([Buffer.from("apa")], ">=");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [1, 2, 3, 4, 5, 6];
		console.assert(keys.comparePathPart(observed, expected) === 0,
			`It should return the correct search results for an inner node match in >= mode.`
		);
	})();

	(async () => {
		let results = map.search([Buffer.from("apa1")], ">=");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [2, 3, 4, 5, 6];
		console.assert(keys.comparePathPart(observed, expected) === 0,
			`It should return the correct search results for a leaf node match in >= mode.`
		);
	})();

	(async () => {
		let results = map.search([Buffer.from("apa2")], ">=");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [3, 4, 5, 6];
		console.assert(keys.comparePathPart(observed, expected) === 0,
			`It should return the correct search results for a non-existing leaf node match in >= mode.`
		);
	})();

	(async () => {
		let results = map.search([Buffer.from("ap")], ">=");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [1, 2, 3, 4, 5, 6];
		console.assert(keys.comparePathPart(observed, expected) === 0,
			`It should return the correct search results for a partial inner node match in >= mode.`
		);
	})();

	(async () => {
		let results = map.search([Buffer.from("apa1b")], ">=");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [3, 4, 5, 6];
		console.assert(keys.comparePathPart(observed, expected) === 0,
			`It should return the correct search results for a childless leaf node match in >= mode.`
		);
	})();
})();

(async () => {
	(async () => {
		let results = map.search([Buffer.from("")], "<");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [] as Array<number>;
		console.assert(keys.comparePathPart(observed, expected) === 0,
			`It should return the correct search results for a root node match in < mode.`
		);
	})();

	(async () => {
		let results = map.search([Buffer.from("banan")], "<");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [1, 2, 3];
		console.assert(keys.comparePathPart(observed, expected) === 0,
			`It should return the correct search results for an inner node match in < mode.`
		);
	})();

	(async () => {
		let results = map.search([Buffer.from("banan1")], "<");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [1, 2, 3, 4];
		console.assert(keys.comparePathPart(observed, expected) === 0,
			`It should return the correct search results for a leaf node match in < mode.`
		);
	})();

	(async () => {
		let results = map.search([Buffer.from("banan2")], "<");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [1, 2, 3, 4, 5];
		console.assert(keys.comparePathPart(observed, expected) === 0,
			`It should return the correct search results for a non-existing leaf node match in < mode.`
		);
	})();

	(async () => {
		let results = map.search([Buffer.from("bana")], "<");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [1, 2, 3];
		console.assert(keys.comparePathPart(observed, expected) === 0,
			`It should return the correct search results for a partial inner node match in < mode.`
		);
	})();

	(async () => {
		let results = map.search([Buffer.from("banan1b")], "<");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [1, 2, 3, 4, 5];
		console.assert(keys.comparePathPart(observed, expected) === 0,
			`It should return the correct search results for a childless leaf node match in < mode.`
		);
	})();
})();

(async () => {
	(async () => {
		let results = map.search([Buffer.from("")], "<=");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [] as Array<number>;
		console.assert(keys.comparePathPart(observed, expected) === 0,
			`It should return the correct search results for a root node match in <= mode.`
		);
	})();

	(async () => {
		let results = map.search([Buffer.from("banan")], "<=");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [1, 2, 3, 4];
		console.assert(keys.comparePathPart(observed, expected) === 0,
			`It should return the correct search results for an inner node match in <= mode.`
		);
	})();

	(async () => {
		let results = map.search([Buffer.from("banan1")], "<=");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [1, 2, 3, 4, 5];
		console.assert(keys.comparePathPart(observed, expected) === 0,
			`It should return the correct search results for a leaf node match in <= mode.`
		);
	})();

	(async () => {
		let results = map.search([Buffer.from("banan2")], "<=");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [1, 2, 3, 4, 5];
		console.assert(keys.comparePathPart(observed, expected) === 0,
			`It should return the correct search results for a non-existing leaf node match in <= mode.`
		);
	})();

	(async () => {
		let results = map.search([Buffer.from("bana")], "<=");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [1, 2, 3];
		console.assert(keys.comparePathPart(observed, expected) === 0,
			`It should return the correct search results for a partial inner node match in <= mode.`
		);
	})();

	(async () => {
		let results = map.search([Buffer.from("banan1b")], "<=");
		let observed = StreamIterable.of(results).collect().map((entry) => entry.value());
		let expected = [1, 2, 3, 4, 5];
		console.assert(keys.comparePathPart(observed, expected) === 0,
			`It should return the correct search results for a childless leaf node match in <= mode.`
		);
	})();
})();
