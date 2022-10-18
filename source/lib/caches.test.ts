import * as wtf from "@joelek/wtf";
import { Cache } from "./caches";

wtf.test(`It should support iteration.`, async (assert) => {
	let cache = new Cache<{}>({
		getWeightForValue: (value) => 1
	});
	cache.insert(1, {});
	cache.insert(2, {});
	let observed = Array.from(cache).map((entry) => entry.key);
	let expected = [1, 2];
	assert.equals(observed, expected);
});

wtf.test(`It should support clearing the cache of all inserted values.`, async (assert) => {
	let cache = new Cache<{}>({
		getWeightForValue: (value) => 1
	});
	cache.insert(1, {});
	cache.insert(2, {});
	cache.clear();
	let observed = Array.from(cache).map((entry) => entry.key);
	let expected = [] as Array<number>;
	assert.equals(observed, expected);
});

wtf.test(`It should support inserting and looking up an inserted value.`, async (assert) => {
	let cache = new Cache<{}>({
		getWeightForValue: (value) => 1
	});
	let one = {};
	let two = {};
	cache.insert(1, one);
	cache.insert(2, two);
	assert.equals(cache.lookup(1), one);
	assert.equals(cache.lookup(2), two);
});

wtf.test(`It should keep track of the number of values inserted.`, async (assert) => {
	let cache = new Cache<{}>({
		getWeightForValue: (value) => 1
	});
	assert.equals(cache.length(), 0);
	cache.insert(1, {});
	assert.equals(cache.length(), 1);
	cache.insert(2, {});
	assert.equals(cache.length(), 2);
	cache.remove(1);
	assert.equals(cache.length(), 1);
	cache.remove(2);
	assert.equals(cache.length(), 0);
});

wtf.test(`It should support removing an inserted value.`, async (assert) => {
	let cache = new Cache<{}>({
		getWeightForValue: (value) => 1
	});
	let one = {};
	let two = {};
	assert.equals(cache.lookup(1), undefined);
	assert.equals(cache.lookup(2), undefined);
	cache.insert(1, one);
	assert.equals(cache.lookup(1) === one, true);
	assert.equals(cache.lookup(2), undefined);
	cache.insert(2, two);
	assert.equals(cache.lookup(1) === one, true);
	assert.equals(cache.lookup(2) === two, true);
	cache.remove(1);
	assert.equals(cache.lookup(1), undefined);
	assert.equals(cache.lookup(2) === two, true);
	cache.remove(2);
	assert.equals(cache.lookup(1), undefined);
	assert.equals(cache.lookup(2), undefined);
});

wtf.test(`It should purge the cache when necessary.`, async (assert) => {
	let cache = new Cache<{}>({
		getWeightForValue: (value) => 1
	}, 1);
	let one = {};
	let two = {};
	assert.equals(cache.lookup(1), undefined);
	assert.equals(cache.lookup(2), undefined);
	cache.insert(1, one);
	assert.equals(cache.lookup(1) === one, true);
	assert.equals(cache.lookup(2), undefined);
	cache.insert(2, two);
	assert.equals(cache.lookup(1), undefined);
	assert.equals(cache.lookup(2) === two, true);
});
