import * as wtf from "@joelek/wtf";
import * as hash from "./tables";
import * as files from "./files";
import * as utils from "./utils";
import * as blocks from "./blocks";

const DETAIL: hash.TableDetail = {
	getKeyFromValue: (value) => {
		let buffer = new Uint8Array(4);
		utils.Binary.unsigned(buffer, 0, 4, value);
		return [buffer];
	}
};

wtf.test(`It should support iteration with no values inserted.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let blockManager = new blocks.BlockManager(file);
	let ht = new hash.Table(blockManager, DETAIL, {
		minimumCapacity: 2
	});
	let observed = Array.from(ht).sort();
	let expected = [] as Array<number>;
	assert.equals(observed, expected);
});

wtf.test(`It should support iteration with value one inserted.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let blockManager = new blocks.BlockManager(file);
	let ht = new hash.Table(blockManager, DETAIL, {
		minimumCapacity: 2
	});
	ht.insert(DETAIL.getKeyFromValue(1), 1);
	let observed = Array.from(ht).sort();
	let expected = [1] as Array<number>;
	assert.equals(observed, expected);
});

wtf.test(`It should support iteration with value two inserted.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let blockManager = new blocks.BlockManager(file);
	let ht = new hash.Table(blockManager, DETAIL, {
		minimumCapacity: 2
	});
	ht.insert(DETAIL.getKeyFromValue(2), 2);
	let observed = Array.from(ht).sort();
	let expected = [2] as Array<number>;
	assert.equals(observed, expected);
});

wtf.test(`It should support iteration with both values inserted.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let blockManager = new blocks.BlockManager(file);
	let ht = new hash.Table(blockManager, DETAIL, {
		minimumCapacity: 2
	});
	ht.insert(DETAIL.getKeyFromValue(1), 1);
	ht.insert(DETAIL.getKeyFromValue(2), 2);
	let observed = Array.from(ht).sort();
	let expected = [1, 2] as Array<number>;
	assert.equals(observed, expected);
});

wtf.test(`It should support vacating.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let blockManager = new blocks.BlockManager(file);
	let ht = new hash.Table(blockManager, DETAIL, {
		minimumCapacity: 2
	});
	ht.insert(DETAIL.getKeyFromValue(1), 1);
	ht.insert(DETAIL.getKeyFromValue(2), 2);
	ht.vacate();
	let observed = Array.from(ht).sort();
	let expected = [] as Array<number>;
	assert.equals(observed, expected);
});

wtf.test(`It should throw an error when attempting to insert after deletion.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let blockManager = new blocks.BlockManager(file);
	let ht = new hash.Table(blockManager, DETAIL, {
		minimumCapacity: 2
	});
	ht.delete();
	await assert.throws(async () => {
		ht.insert(DETAIL.getKeyFromValue(1), 1);
	});
});

wtf.test(`It should throw an error when attempting to lookup after deletion.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let blockManager = new blocks.BlockManager(file);
	let ht = new hash.Table(blockManager, DETAIL, {
		minimumCapacity: 2
	});
	ht.delete();
	await assert.throws(async () => {
		ht.lookup(DETAIL.getKeyFromValue(1));
	});
});

wtf.test(`It should throw an error when attempting to remove after deletion.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let blockManager = new blocks.BlockManager(file);
	let ht = new hash.Table(blockManager, DETAIL, {
		minimumCapacity: 2
	});
	ht.delete();
	await assert.throws(async () => {
		ht.remove(DETAIL.getKeyFromValue(1));
	});
});

wtf.test(`It should throw an error when attempting to vacate after deletion.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let blockManager = new blocks.BlockManager(file);
	let ht = new hash.Table(blockManager, DETAIL, {
		minimumCapacity: 2
	});
	ht.delete();
	await assert.throws(async () => {
		ht.vacate();
	});
});

wtf.test(`It should support inserting value one.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let blockManager = new blocks.BlockManager(file);
	let ht = new hash.Table(blockManager, DETAIL, {
		minimumCapacity: 2
	});
	let keysOne = DETAIL.getKeyFromValue(1);
	assert.equals(ht.insert(keysOne, 1), true);
	assert.equals(ht.insert(keysOne, 1), false);
});

wtf.test(`It should support inserting value two.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let blockManager = new blocks.BlockManager(file);
	let ht = new hash.Table(blockManager, DETAIL, {
		minimumCapacity: 2
	});
	let keysTwo = DETAIL.getKeyFromValue(2);
	assert.equals(ht.insert(keysTwo, 2), true);
	assert.equals(ht.insert(keysTwo, 2), false);
});

wtf.test(`It should support inserting both values.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let blockManager = new blocks.BlockManager(file);
	let ht = new hash.Table(blockManager, DETAIL, {
		minimumCapacity: 2
	});
	let keysOne = DETAIL.getKeyFromValue(1);
	let keysTwo = DETAIL.getKeyFromValue(2);
	assert.equals(ht.insert(keysOne, 1), true);
	assert.equals(ht.insert(keysTwo, 2), true);
	assert.equals(ht.insert(keysOne, 1), false);
	assert.equals(ht.insert(keysTwo, 2), false);
});

wtf.test(`It should support keeping track of the total number of values.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let blockManager = new blocks.BlockManager(file);
	let ht = new hash.Table(blockManager, DETAIL, {
		minimumCapacity: 2
	});
	let keysOne = DETAIL.getKeyFromValue(1);
	let keysTwo = DETAIL.getKeyFromValue(2);
	assert.equals(ht.length(), 0);
	ht.insert(keysOne, 1);
	assert.equals(ht.length(), 1);
	ht.insert(keysTwo, 2);
	assert.equals(ht.length(), 2);
	ht.remove(keysOne);
	assert.equals(ht.length(), 1);
	ht.remove(keysTwo);
	assert.equals(ht.length(), 0);
});

wtf.test(`It should support looking up values with no values inserted.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let blockManager = new blocks.BlockManager(file);
	let ht = new hash.Table(blockManager, DETAIL, {
		minimumCapacity: 2
	});
	let keysOne = DETAIL.getKeyFromValue(1);
	let keysTwo = DETAIL.getKeyFromValue(2);
	assert.equals(ht.lookup(keysOne), undefined);
	assert.equals(ht.lookup(keysTwo), undefined);
});

wtf.test(`It should support looking up values with value one inserted.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let blockManager = new blocks.BlockManager(file);
	let ht = new hash.Table(blockManager, DETAIL, {
		minimumCapacity: 2
	});
	let keysOne = DETAIL.getKeyFromValue(1);
	let keysTwo = DETAIL.getKeyFromValue(2);
	ht.insert(keysOne, 1);
	assert.equals(ht.lookup(keysOne), 1);
	assert.equals(ht.lookup(keysTwo), undefined);
});

wtf.test(`It should support looking up values with value two inserted.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let blockManager = new blocks.BlockManager(file);
	let ht = new hash.Table(blockManager, DETAIL, {
		minimumCapacity: 2
	});
	let keysOne = DETAIL.getKeyFromValue(1);
	let keysTwo = DETAIL.getKeyFromValue(2);
	ht.insert(keysTwo, 2);
	assert.equals(ht.lookup(keysOne), undefined);
	assert.equals(ht.lookup(keysTwo), 2);
});

wtf.test(`It should support looking up values with both values inserted.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let blockManager = new blocks.BlockManager(file);
	let ht = new hash.Table(blockManager, DETAIL, {
		minimumCapacity: 2
	});
	let keysOne = DETAIL.getKeyFromValue(1);
	let keysTwo = DETAIL.getKeyFromValue(2);
	ht.insert(keysOne, 1);
	ht.insert(keysTwo, 2);
	assert.equals(ht.lookup(keysOne), 1);
	assert.equals(ht.lookup(keysTwo), 2);
});

wtf.test(`It should support removing values with no values inserted.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let blockManager = new blocks.BlockManager(file);
	let ht = new hash.Table(blockManager, DETAIL, {
		minimumCapacity: 2
	});
	let keysOne = DETAIL.getKeyFromValue(1);
	let keysTwo = DETAIL.getKeyFromValue(2);
	assert.equals(ht.remove(keysOne), false);
	assert.equals(ht.remove(keysTwo), false);
});

wtf.test(`It should support removing values with value one inserted.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let blockManager = new blocks.BlockManager(file);
	let ht = new hash.Table(blockManager, DETAIL, {
		minimumCapacity: 2
	});
	let keysOne = DETAIL.getKeyFromValue(1);
	let keysTwo = DETAIL.getKeyFromValue(2);
	ht.insert(keysOne, 1);
	assert.equals(ht.remove(keysOne), true);
	assert.equals(ht.remove(keysTwo), false);
});

wtf.test(`It should support removing values with value two inserted.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let blockManager = new blocks.BlockManager(file);
	let ht = new hash.Table(blockManager, DETAIL, {
		minimumCapacity: 2
	});
	let keysOne = DETAIL.getKeyFromValue(1);
	let keysTwo = DETAIL.getKeyFromValue(2);
	ht.insert(keysTwo, 2);
	assert.equals(ht.remove(keysOne), false);
	assert.equals(ht.remove(keysTwo), true);
});

wtf.test(`It should support removing values with both values inserted.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let blockManager = new blocks.BlockManager(file);
	let ht = new hash.Table(blockManager, DETAIL, {
		minimumCapacity: 2
	});
	let keysOne = DETAIL.getKeyFromValue(1);
	let keysTwo = DETAIL.getKeyFromValue(2);
	ht.insert(keysOne, 1);
	ht.insert(keysTwo, 2);
	assert.equals(ht.remove(keysOne), true);
	assert.equals(ht.remove(keysTwo), true);
});
