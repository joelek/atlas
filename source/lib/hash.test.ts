import * as hash from "./hash";
import * as files from "./files";
import * as utils from "./utils";
import * as vfs from "./vfs";
import { test } from "./test";

const DETAIL: hash.TableDetail = {
	getKeyFromValue: (value) => {
		let buffer = new Uint8Array(4);
		utils.Binary.unsigned(buffer, 0, 4, value);
		return [buffer];
	}
};

test(`It should support iteration with no values inserted.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let blockManager = new vfs.BlockManager(file);
	let ht = new hash.Table(blockManager, DETAIL, {
		minimumCapacity: 2
	});
	let observed = Array.from(ht).map((entry) => entry.value()).sort();
	let expected = [] as Array<number>;
	assert.array.equals(observed, expected);
});

test(`It should support iteration with value one inserted.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let blockManager = new vfs.BlockManager(file);
	let ht = new hash.Table(blockManager, DETAIL, {
		minimumCapacity: 2
	});
	ht.insert(DETAIL.getKeyFromValue(1), 1);
	let observed = Array.from(ht).map((entry) => entry.value()).sort();
	let expected = [1] as Array<number>;
	assert.array.equals(observed, expected);
});

test(`It should support iteration with value two inserted.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let blockManager = new vfs.BlockManager(file);
	let ht = new hash.Table(blockManager, DETAIL, {
		minimumCapacity: 2
	});
	ht.insert(DETAIL.getKeyFromValue(2), 2);
	let observed = Array.from(ht).map((entry) => entry.value()).sort();
	let expected = [2] as Array<number>;
	assert.array.equals(observed, expected);
});

test(`It should support iteration with both values inserted.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let blockManager = new vfs.BlockManager(file);
	let ht = new hash.Table(blockManager, DETAIL, {
		minimumCapacity: 2
	});
	ht.insert(DETAIL.getKeyFromValue(1), 1);
	ht.insert(DETAIL.getKeyFromValue(2), 2);
	let observed = Array.from(ht).map((entry) => entry.value()).sort();
	let expected = [1, 2] as Array<number>;
	assert.array.equals(observed, expected);
});

test(`It should support clearing.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let blockManager = new vfs.BlockManager(file);
	let ht = new hash.Table(blockManager, DETAIL, {
		minimumCapacity: 2
	});
	ht.insert(DETAIL.getKeyFromValue(1), 1);
	ht.insert(DETAIL.getKeyFromValue(2), 2);
	ht.clear();
	let observed = Array.from(ht).map((entry) => entry.value()).sort();
	let expected = [] as Array<number>;
	assert.array.equals(observed, expected);
});

test(`It should throw an error when attempting to insert after deletion.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let blockManager = new vfs.BlockManager(file);
	let ht = new hash.Table(blockManager, DETAIL, {
		minimumCapacity: 2
	});
	ht.delete();
	await assert.throws(async () => {
		ht.insert(DETAIL.getKeyFromValue(1), 1);
	});
});

test(`It should throw an error when attempting to lookup after deletion.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let blockManager = new vfs.BlockManager(file);
	let ht = new hash.Table(blockManager, DETAIL, {
		minimumCapacity: 2
	});
	ht.delete();
	await assert.throws(async () => {
		ht.lookup(DETAIL.getKeyFromValue(1));
	});
});

test(`It should throw an error when attempting to remove after deletion.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let blockManager = new vfs.BlockManager(file);
	let ht = new hash.Table(blockManager, DETAIL, {
		minimumCapacity: 2
	});
	ht.delete();
	await assert.throws(async () => {
		ht.remove(DETAIL.getKeyFromValue(1));
	});
});

test(`It should support inserting value one.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let blockManager = new vfs.BlockManager(file);
	let ht = new hash.Table(blockManager, DETAIL, {
		minimumCapacity: 2
	});
	let keysOne = DETAIL.getKeyFromValue(1);
	assert.true(ht.insert(keysOne, 1) === true);
	assert.true(ht.insert(keysOne, 1) === false);
});

test(`It should support inserting value two.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let blockManager = new vfs.BlockManager(file);
	let ht = new hash.Table(blockManager, DETAIL, {
		minimumCapacity: 2
	});
	let keysTwo = DETAIL.getKeyFromValue(2);
	assert.true(ht.insert(keysTwo, 2) === true);
	assert.true(ht.insert(keysTwo, 2) === false);
});

test(`It should support inserting both values.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let blockManager = new vfs.BlockManager(file);
	let ht = new hash.Table(blockManager, DETAIL, {
		minimumCapacity: 2
	});
	let keysOne = DETAIL.getKeyFromValue(1);
	let keysTwo = DETAIL.getKeyFromValue(2);
	assert.true(ht.insert(keysOne, 1) === true);
	assert.true(ht.insert(keysTwo, 2) === true);
	assert.true(ht.insert(keysOne, 1) === false);
	assert.true(ht.insert(keysTwo, 2) === false);
});

test(`It should support keeping track of the total number of values.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let blockManager = new vfs.BlockManager(file);
	let ht = new hash.Table(blockManager, DETAIL, {
		minimumCapacity: 2
	});
	let keysOne = DETAIL.getKeyFromValue(1);
	let keysTwo = DETAIL.getKeyFromValue(2);
	assert.true(ht.length() === 0);
	ht.insert(keysOne, 1);
	assert.true(ht.length() === 1);
	ht.insert(keysTwo, 2);
	assert.true(ht.length() === 2);
	ht.remove(keysOne);
	assert.true(ht.length() === 1);
	ht.remove(keysTwo);
	assert.true(ht.length() === 0);
});

test(`It should support looking up values with no values inserted.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let blockManager = new vfs.BlockManager(file);
	let ht = new hash.Table(blockManager, DETAIL, {
		minimumCapacity: 2
	});
	let keysOne = DETAIL.getKeyFromValue(1);
	let keysTwo = DETAIL.getKeyFromValue(2);
	assert.true(ht.lookup(keysOne) === undefined);
	assert.true(ht.lookup(keysTwo) === undefined);
});

test(`It should support looking up values with value one inserted.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let blockManager = new vfs.BlockManager(file);
	let ht = new hash.Table(blockManager, DETAIL, {
		minimumCapacity: 2
	});
	let keysOne = DETAIL.getKeyFromValue(1);
	let keysTwo = DETAIL.getKeyFromValue(2);
	ht.insert(keysOne, 1);
	assert.true(ht.lookup(keysOne) === 1);
	assert.true(ht.lookup(keysTwo) === undefined);
});

test(`It should support looking up values with value two inserted.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let blockManager = new vfs.BlockManager(file);
	let ht = new hash.Table(blockManager, DETAIL, {
		minimumCapacity: 2
	});
	let keysOne = DETAIL.getKeyFromValue(1);
	let keysTwo = DETAIL.getKeyFromValue(2);
	ht.insert(keysTwo, 2);
	assert.true(ht.lookup(keysOne) === undefined);
	assert.true(ht.lookup(keysTwo) === 2);
});

test(`It should support looking up values with both values inserted.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let blockManager = new vfs.BlockManager(file);
	let ht = new hash.Table(blockManager, DETAIL, {
		minimumCapacity: 2
	});
	let keysOne = DETAIL.getKeyFromValue(1);
	let keysTwo = DETAIL.getKeyFromValue(2);
	ht.insert(keysOne, 1);
	ht.insert(keysTwo, 2);
	assert.true(ht.lookup(keysOne) === 1);
	assert.true(ht.lookup(keysTwo) === 2);
});

test(`It should support removing values with no values inserted.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let blockManager = new vfs.BlockManager(file);
	let ht = new hash.Table(blockManager, DETAIL, {
		minimumCapacity: 2
	});
	let keysOne = DETAIL.getKeyFromValue(1);
	let keysTwo = DETAIL.getKeyFromValue(2);
	assert.true(ht.remove(keysOne) === false);
	assert.true(ht.remove(keysTwo) === false);
});

test(`It should support removing values with value one inserted.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let blockManager = new vfs.BlockManager(file);
	let ht = new hash.Table(blockManager, DETAIL, {
		minimumCapacity: 2
	});
	let keysOne = DETAIL.getKeyFromValue(1);
	let keysTwo = DETAIL.getKeyFromValue(2);
	ht.insert(keysOne, 1);
	assert.true(ht.remove(keysOne) === true);
	assert.true(ht.remove(keysTwo) === false);
});

test(`It should support removing values with value two inserted.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let blockManager = new vfs.BlockManager(file);
	let ht = new hash.Table(blockManager, DETAIL, {
		minimumCapacity: 2
	});
	let keysOne = DETAIL.getKeyFromValue(1);
	let keysTwo = DETAIL.getKeyFromValue(2);
	ht.insert(keysTwo, 2);
	assert.true(ht.remove(keysOne) === false);
	assert.true(ht.remove(keysTwo) === true);
});

test(`It should support removing values with both values inserted.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let blockManager = new vfs.BlockManager(file);
	let ht = new hash.Table(blockManager, DETAIL, {
		minimumCapacity: 2
	});
	let keysOne = DETAIL.getKeyFromValue(1);
	let keysTwo = DETAIL.getKeyFromValue(2);
	ht.insert(keysOne, 1);
	ht.insert(keysTwo, 2);
	assert.true(ht.remove(keysOne) === true);
	assert.true(ht.remove(keysTwo) === true);
});
