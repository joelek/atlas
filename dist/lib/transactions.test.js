"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("./test");
const transactions_1 = require("./transactions");
const files_1 = require("./files");
const stores_1 = require("./stores");
const blocks_1 = require("./blocks");
const records_1 = require("./records");
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
(0, test_1.test)(`It should throw an error when using transaction objects outside of the transaction.`, async (assert) => {
    let file = new files_1.VirtualFile(0);
    let blockManager = new blocks_1.BlockManager(file);
    let dummy = new stores_1.WritableStoreManager(stores_1.StoreManager.construct(blockManager, {
        fields: {
            key: new records_1.StringField("")
        },
        keys: ["key"]
    }));
    let manager = new transactions_1.TransactionManager(file, {
        dummy
    }, {}, {});
    let access = await manager.enqueueWritableTransaction(async (access) => {
        return access;
    });
    await assert.throws(async () => {
        access.dummy.length();
    });
});
