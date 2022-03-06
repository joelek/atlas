import { Cache } from "./caches";
import { test } from "./test";

test(`It should support iteration.`, async (assert) => {
	let cache = new Cache<number, {}>({
		getWeightForValue: (value) => 1
	});
	cache.insert(1, {});
	cache.insert(2, {});
	let observed = Array.from(cache).map((entry) => entry.key);
	let expected = [1, 2];
	assert.array.equals(observed, expected);
});

test(`It should support clearing the cache of all inserted values.`, async (assert) => {
	let cache = new Cache<number, {}>({
		getWeightForValue: (value) => 1
	});
	cache.insert(1, {});
	cache.insert(2, {});
	cache.clear();
	let observed = Array.from(cache).map((entry) => entry.key);
	let expected = [] as Array<number>;
	assert.array.equals(observed, expected);
});

test(`It should support inserting and looking up an inserted value.`, async (assert) => {
	let cache = new Cache<number, {}>({
		getWeightForValue: (value) => 1
	});
	let one = {};
	let two = {};
	cache.insert(1, one);
	cache.insert(2, two);
	assert.true(cache.lookup(1) === one);
	assert.true(cache.lookup(2) === two);
});

test(`It should keep track of the number of values inserted.`, async (assert) => {
	let cache = new Cache<number, {}>({
		getWeightForValue: (value) => 1
	});
	assert.true(cache.length() == 0);
	cache.insert(1, {});
	assert.true(cache.length() == 1);
	cache.insert(2, {});
	assert.true(cache.length() == 2);
	cache.remove(1);
	assert.true(cache.length() == 1);
	cache.remove(2);
	assert.true(cache.length() == 0);
});

test(`It should support removing an inserted value.`, async (assert) => {
	let cache = new Cache<number, {}>({
		getWeightForValue: (value) => 1
	});
	let one = {};
	let two = {};
	assert.true(cache.lookup(1) == null);
	assert.true(cache.lookup(2) == null);
	cache.insert(1, one);
	assert.true(cache.lookup(1) === one);
	assert.true(cache.lookup(2) == null);
	cache.insert(2, two);
	assert.true(cache.lookup(1) === one);
	assert.true(cache.lookup(2) === two);
	cache.remove(1);
	assert.true(cache.lookup(1) == null);
	assert.true(cache.lookup(2) === two);
	cache.remove(2);
	assert.true(cache.lookup(1) == null);
	assert.true(cache.lookup(2) == null);
});

test(`It should purge the cache when necessary.`, async (assert) => {
	let cache = new Cache<number, {}>({
		getWeightForValue: (value) => 1
	}, 1);
	let one = {};
	let two = {};
	assert.true(cache.lookup(1) == null);
	assert.true(cache.lookup(2) == null);
	cache.insert(1, one);
	assert.true(cache.lookup(1) === one);
	assert.true(cache.lookup(2) == null);
	cache.insert(2, two);
	assert.true(cache.lookup(1) == null);
	assert.true(cache.lookup(2) === two);
});
