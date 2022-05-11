"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("./test");
const transactions_1 = require("./transactions");
const files_1 = require("./files");
const stores_1 = require("./stores");
const blocks_1 = require("./blocks");
const records_1 = require("./records");
const databases_1 = require("./databases");
const tables_1 = require("./tables");
async function delay(ms) {
    await new Promise((resolve, reject) => {
        setTimeout(resolve, ms);
    });
}
;
(0, test_1.test)(`It should wait for all read actions to complete before starting a write action.`, async (assert) => {
    let file = new files_1.VirtualFile(0);
    let manager = new transactions_1.TransactionManager(file, {}, {}, {});
    let events = new Array();
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
(0, test_1.test)(`It should wait for all write actions to complete before starting a read action.`, async (assert) => {
    let file = new files_1.VirtualFile(0);
    let manager = new transactions_1.TransactionManager(file, {}, {}, {});
    let events = new Array();
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
(0, test_1.test)(`It should recover from transactions that throw errors.`, async (assert) => {
    let file = new files_1.VirtualFile(0);
    let manager = new transactions_1.TransactionManager(file, {}, {}, {});
    let events = new Array();
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
/*
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
    }, {}, {});
    let queue = await manager.enqueueWritableTransaction(async (queue) => {
        return queue;
    });
    await assert.throws(async () => {
        await queue.enqueueReadableOperation(() => 1);
    });
});
*/
(0, test_1.test)(`It should reload entities with cached values when a transaction fails to complete.`, async (assert) => {
    let file = new files_1.VirtualFile(0);
    let blockManager = new blocks_1.BlockManager(file);
    let fields = {
        key: new records_1.StringField("")
    };
    let keys = ["key"];
    let recordManager = new records_1.RecordManager(fields);
    let table = new tables_1.Table(blockManager, {
        getKeyFromValue: (value) => {
            let buffer = blockManager.readBlock(value);
            let record = recordManager.decode(buffer);
            return recordManager.encodeKeys(keys, record);
        }
    }, {
        minimumCapacity: 2
    });
    let storeManager = new stores_1.StoreManager(blockManager, fields, keys, {}, table, [], []);
    let databaseStore = new databases_1.DatabaseStore(storeManager, {});
    let transactionManager = new transactions_1.TransactionManager(file, {
        transactionalStore: databaseStore
    }, {}, {}, {
        onDiscard: () => {
            blockManager.reload();
            storeManager.reload();
        }
    });
    storeManager.insert({
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
    }
    catch (error) { }
    let observed = Array.from(storeManager).map((record) => record.key);
    let expected = ["1"];
    assert.array.equals(observed, expected);
});
