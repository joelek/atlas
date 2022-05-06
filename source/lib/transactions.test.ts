import * as wtf from "@joelek/wtf";
import { TransactionManager } from "./transactions";
import { VirtualFile } from "./files";
import { StoreManager } from "./stores";
import { BlockManager } from "./blocks";
import { RecordManager, StringField } from "./records";
import { DatabaseStore } from "./databases";
import { Table } from "./tables";
import { Cache } from "./caches";

async function delay(ms: number): Promise<void> {
	await new Promise((resolve, reject) => {
		setTimeout(resolve, ms);
	});
};

wtf.test(`It should wait for all read actions to complete before starting a write action.`, async (assert) => {
	let file = new VirtualFile(0);
	let manager = new TransactionManager(file, {}, {}, {});
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
	assert.equals(await transactionOne, 1);
	assert.equals(await transactionTwo, 2);
	assert.equals(await transactionThree,3);
	assert.equals(await transactionFour, 4);
	events.push("E");
	assert.equals(events, ["S", "1S", "2S", "1E", "2E", "3S", "3E", "4S", "4E", "E"]);
});

wtf.test(`It should wait for all write actions to complete before starting a read action.`, async (assert) => {
	let file = new VirtualFile(0);
	let manager = new TransactionManager(file, {}, {}, {});
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
	assert.equals(await transactionOne, 1);
	assert.equals(await transactionTwo, 2);
	assert.equals(await transactionThree, 3);
	assert.equals(await transactionFour, 4);
	events.push("E");
	assert.equals(events, ["S", "1S", "1E", "2S", "2E", "3S", "4S", "3E", "4E", "E"]);
});

wtf.test(`It should recover from transactions that throw errors.`, async (assert) => {
	let file = new VirtualFile(0);
	let manager = new TransactionManager(file, {}, {}, {});
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
	assert.equals(await transactionTwo, 2);
	events.push("E");
	assert.equals(events, ["S", "1S", "2S", "2E", "E"]);
});

wtf.test(`It should throw an error when using transaction objects outside of the transaction.`, async (assert) => {
	let file = new VirtualFile(0);
	let blockManager = new BlockManager(file);
	let dummy = new DatabaseStore(StoreManager.construct(blockManager, {
		fields: {
			key: new StringField("")
		},
		keys: ["key"]
	}), {});
	let manager = new TransactionManager(file, {
		dummy
	}, {}, {});
	let queue = await manager.enqueueWritableTransaction(async (queue) => {
		return queue;
	});
	await assert.throws(async () => {
		await queue.enqueueReadableOperation(() => 1);
	});
});

wtf.test(`It should reload entities with cached values when a transaction fails to complete.`, async (assert) => {
	let file = new VirtualFile(0);
	let blockManager = new BlockManager(file);
	let fields = {
		key: new StringField("")
	};
	let keys = ["key"] as ["key"];
	let recordManager = new RecordManager(fields);
	let table = new Table(blockManager, {
		getKeyFromValue: (value) => {
			let buffer = blockManager.readBlock(value);
			let record = recordManager.decode(buffer);
			return recordManager.encodeKeys(keys, record);
		}
	}, {
		minimumCapacity: 2
	});
	let storeManager = new StoreManager(blockManager, fields, keys, {}, table, [], []);
	let databaseStore = new DatabaseStore(storeManager, {});
	let transactionManager = new TransactionManager(file, {
		transactionalStore: databaseStore
	}, {}, {}, {
		onDiscard: () => {
			blockManager.reload();
			storeManager.reload();
		}
	});
	storeManager.insert(new Cache<any>(), {
		key: "1"
	});
	file.persist();
	try {
		await transactionManager.enqueueWritableTransaction(async (queue) => {
			await transactionManager.stores.transactionalStore.insert(queue, {
				key: "2"
			});
			throw "";
		});
	} catch (error) {}
	let observed = Array.from(storeManager).map((record) => record.key);
	let expected = ["1"];
	assert.equals(observed, expected);
});
