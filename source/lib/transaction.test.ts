import { test } from "./test";
import { TransactionManager } from "./transaction";
import { VirtualFile } from "./files";
import { WritableStoreManager, StoreManager } from "./stores";
import { BlockManager } from "./vfs";
import { StringField } from "./records";

async function delay(ms: number): Promise<void> {
	await new Promise((resolve, reject) => {
		setTimeout(resolve, ms);
	});
};

test(`It should wait for all read actions to complete before starting a write action.`, async (assert) => {
	let file = new VirtualFile(0);
	let manager = new TransactionManager(file, {}, {});
	let events = new Array<string>();
	let transactionOne = manager.enqueueReadableTransaction(async (access) => {
		events.push("1S");
		await delay(0);
		events.push("1E");
		return 1;
	});
	let transactionTwo = manager.enqueueReadableTransaction(async (access) => {
		events.push("2S");
		await delay(0);
		events.push("2E");
		return 2;
	});
	let transactionThree = manager.enqueueWritableTransaction(async (access) => {
		events.push("3S");
		await delay(0);
		events.push("3E");
		return 3;
	});
	let transactionFour = manager.enqueueWritableTransaction(async (access) => {
		events.push("4S");
		await delay(0);
		events.push("4E");
		return 4;
	});
	events.push("S");
	assert.true(await transactionOne === 1);
	assert.true(await transactionTwo === 2);
	assert.true(await transactionThree === 3);
	assert.true(await transactionFour === 4);
	events.push("E");
	assert.array.equals(events, ["S", "1S", "2S", "1E", "2E", "3S", "3E", "4S", "4E", "E"]);
});

test(`It should wait for all write actions to complete before starting a read action.`, async (assert) => {
	let file = new VirtualFile(0);
	let manager = new TransactionManager(file, {}, {});
	let events = new Array<string>();
	let transactionOne = manager.enqueueWritableTransaction(async (access) => {
		events.push("1S");
		await delay(0);
		events.push("1E");
		return 1;
	});
	let transactionTwo = manager.enqueueWritableTransaction(async (access) => {
		events.push("2S");
		await delay(0);
		events.push("2E");
		return 2;
	});
	let transactionThree = manager.enqueueReadableTransaction(async (access) => {
		events.push("3S");
		await delay(0);
		events.push("3E");
		return 3;
	});
	let transactionFour = manager.enqueueReadableTransaction(async (access) => {
		events.push("4S");
		await delay(0);
		events.push("4E");
		return 4;
	});
	events.push("S");
	assert.true(await transactionOne === 1);
	assert.true(await transactionTwo === 2);
	assert.true(await transactionThree === 3);
	assert.true(await transactionFour === 4);
	events.push("E");
	assert.array.equals(events, ["S", "1S", "1E", "2S", "2E", "3S", "4S", "3E", "4E", "E"]);
});

test(`It should recover from transactions that throw errors.`, async (assert) => {
	let file = new VirtualFile(0);
	let manager = new TransactionManager(file, {}, {});
	let events = new Array<string>();
	let transactionOne = manager.enqueueWritableTransaction(async (access) => {
		events.push("1S");
		await delay(0);
		throw ``;
		events.push("1E");
		return 1;
	});
	let transactionTwo = manager.enqueueWritableTransaction(async (access) => {
		events.push("2S");
		await delay(0);
		events.push("2E");
		return 2;
	});
	events.push("S");
	await assert.throws(async () => {
		await transactionOne;
	});
	assert.true(await transactionTwo === 2);
	events.push("E");
	assert.array.equals(events, ["S", "1S", "2S", "2E", "E"]);
});

test(`It should throw an error when using transaction objects outside of the transaction.`, async (assert) => {
	let file = new VirtualFile(0);
	let blockManager = new BlockManager(file);
	let dummy = new WritableStoreManager(StoreManager.construct(blockManager, {
		fields: {
			key: new StringField("")
		},
		keys: ["key"]
	}));
	let manager = new TransactionManager(file, {
		dummy
	}, {});
	let access = await manager.enqueueWritableTransaction(async (access) => {
		return access;
	});
	await assert.throws(async () => {
		access.dummy.length();
	});
});
