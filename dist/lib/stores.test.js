"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stores_1 = require("./stores");
const records_1 = require("./records");
const blocks_1 = require("./blocks");
const files_1 = require("./files");
const filters_1 = require("./filters");
const orders_1 = require("./orders");
const test_1 = require("./test");
(0, test_1.test)(`It should support for-of iteration of the records stored.`, async (assert) => {
    let blockManager = new blocks_1.BlockManager(new files_1.VirtualFile(0));
    let users = stores_1.StoreManager.construct(blockManager, {
        fields: {
            key: new records_1.StringField("")
        },
        keys: ["key"]
    });
    users.insert({
        key: "A"
    });
    users.insert({
        key: "B"
    });
    let observed = [];
    for (let entry of users) {
        observed.push(entry.record().key);
    }
    let expected = ["A", "B"];
    observed.sort();
    assert.array.equals(observed, expected);
});
(0, test_1.test)(`It should support iteration of the records stored.`, async (assert) => {
    let blockManager = new blocks_1.BlockManager(new files_1.VirtualFile(0));
    let users = stores_1.StoreManager.construct(blockManager, {
        fields: {
            key: new records_1.StringField("")
        },
        keys: ["key"]
    });
    users.insert({
        key: "A"
    });
    users.insert({
        key: "B"
    });
    let iterable = users;
    let observed = Array.from(iterable).map((entry) => entry.record().key).sort();
    let expected = ["A", "B"];
    assert.array.equals(observed, expected);
});
(0, test_1.test)(`It should support filtering of the records stored.`, async (assert) => {
    let blockManager = new blocks_1.BlockManager(new files_1.VirtualFile(0));
    let users = stores_1.StoreManager.construct(blockManager, {
        fields: {
            key: new records_1.StringField("")
        },
        keys: ["key"]
    });
    users.insert({
        key: "A"
    });
    users.insert({
        key: "B"
    });
    let iterable = users.filter({
        key: new filters_1.EqualityFilter("A")
    });
    let observed = Array.from(iterable).map((entry) => entry.record().key).sort();
    let expected = ["A"];
    assert.array.equals(observed, expected);
});
(0, test_1.test)(`It should support ordering of the records stored in increasing order.`, async (assert) => {
    let blockManager = new blocks_1.BlockManager(new files_1.VirtualFile(0));
    let users = stores_1.StoreManager.construct(blockManager, {
        fields: {
            key: new records_1.StringField("")
        },
        keys: ["key"]
    });
    users.insert({
        key: "A"
    });
    users.insert({
        key: "B"
    });
    let iterable = users.filter({}, {
        key: new orders_1.IncreasingOrder()
    });
    let observed = Array.from(iterable).map((entry) => entry.record().key);
    let expected = ["A", "B"];
    assert.array.equals(observed, expected);
});
(0, test_1.test)(`It should support ordering of the records stored in decreasing order.`, async (assert) => {
    let blockManager = new blocks_1.BlockManager(new files_1.VirtualFile(0));
    let users = stores_1.StoreManager.construct(blockManager, {
        fields: {
            key: new records_1.StringField("")
        },
        keys: ["key"]
    });
    users.insert({
        key: "A"
    });
    users.insert({
        key: "B"
    });
    let iterable = users.filter({}, {
        key: new orders_1.DecreasingOrder()
    });
    let observed = Array.from(iterable).map((entry) => entry.record().key);
    let expected = ["B", "A"];
    assert.array.equals(observed, expected);
});
(0, test_1.test)(`It should support inserting a record previously inserted.`, async (assert) => {
    let blockManager = new blocks_1.BlockManager(new files_1.VirtualFile(0));
    let users = stores_1.StoreManager.construct(blockManager, {
        fields: {
            key: new records_1.StringField(""),
            name: new records_1.StringField("")
        },
        keys: ["key"]
    });
    users.insert({
        key: "A",
        name: "One"
    });
    assert.true(users.lookup({ key: "A" }).name === "One");
    users.insert({
        key: "A",
        name: "Two"
    });
    assert.true(users.lookup({ key: "A" }).name === "Two");
});
(0, test_1.test)(`It should support inserting a record not previously inserted.`, async (assert) => {
    let blockManager = new blocks_1.BlockManager(new files_1.VirtualFile(0));
    let users = stores_1.StoreManager.construct(blockManager, {
        fields: {
            key: new records_1.StringField(""),
            name: new records_1.StringField("")
        },
        keys: ["key"]
    });
    users.insert({
        key: "A",
        name: "One"
    });
    assert.true(users.lookup({ key: "A" }).name === "One");
});
(0, test_1.test)(`It should keep track of the number of records stored.`, async (assert) => {
    let blockManager = new blocks_1.BlockManager(new files_1.VirtualFile(0));
    let users = stores_1.StoreManager.construct(blockManager, {
        fields: {
            key: new records_1.StringField("")
        },
        keys: ["key"]
    });
    assert.true(users.length() === 0);
    users.insert({
        key: "A"
    });
    assert.true(users.length() === 1);
    users.insert({
        key: "B"
    });
    assert.true(users.length() === 2);
    users.insert({
        key: "A"
    });
    assert.true(users.length() === 2);
    users.remove({
        key: "B"
    });
    assert.true(users.length() === 1);
    users.remove({
        key: "A"
    });
    assert.true(users.length() === 0);
});
(0, test_1.test)(`It should support looking up records previously inserted.`, async (assert) => {
    let blockManager = new blocks_1.BlockManager(new files_1.VirtualFile(0));
    let users = stores_1.StoreManager.construct(blockManager, {
        fields: {
            key: new records_1.StringField("")
        },
        keys: ["key"]
    });
    users.insert({
        key: "A"
    });
    assert.true(users.lookup({ key: "A" }).key === "A");
});
(0, test_1.test)(`It should throw an error when looking up records not previously inserted.`, async (assert) => {
    let blockManager = new blocks_1.BlockManager(new files_1.VirtualFile(0));
    let users = stores_1.StoreManager.construct(blockManager, {
        fields: {
            key: new records_1.StringField("")
        },
        keys: ["key"]
    });
    await assert.throws(async () => {
        users.lookup({
            key: "A"
        });
    });
});
(0, test_1.test)(`It should support removing records previously inserted.`, async (assert) => {
    let blockManager = new blocks_1.BlockManager(new files_1.VirtualFile(0));
    let users = stores_1.StoreManager.construct(blockManager, {
        fields: {
            key: new records_1.StringField("")
        },
        keys: ["key"]
    });
    users.insert({
        key: "A"
    });
    assert.true(users.lookup({ key: "A" }).key === "A");
    users.remove({
        key: "A"
    });
    await assert.throws(async () => {
        users.lookup({
            key: "A"
        });
    });
});
(0, test_1.test)(`It should support removing records not previously inserted.`, async (assert) => {
    let blockManager = new blocks_1.BlockManager(new files_1.VirtualFile(0));
    let users = stores_1.StoreManager.construct(blockManager, {
        fields: {
            key: new records_1.StringField("")
        },
        keys: ["key"]
    });
    users.remove({
        key: "A"
    });
    await assert.throws(async () => {
        users.lookup({
            key: "A"
        });
    });
});
(0, test_1.test)(`It should support updating a record previously inserted.`, async (assert) => {
    let blockManager = new blocks_1.BlockManager(new files_1.VirtualFile(0));
    let users = stores_1.StoreManager.construct(blockManager, {
        fields: {
            key: new records_1.StringField(""),
            name: new records_1.StringField("")
        },
        keys: ["key"]
    });
    users.update({
        key: "A",
        name: "One"
    });
    assert.true(users.lookup({ key: "A" }).name === "One");
    users.update({
        key: "A",
        name: "Two"
    });
    assert.true(users.lookup({ key: "A" }).name === "Two");
});
(0, test_1.test)(`It should support updating a record not previously inserted.`, async (assert) => {
    let blockManager = new blocks_1.BlockManager(new files_1.VirtualFile(0));
    let users = stores_1.StoreManager.construct(blockManager, {
        fields: {
            key: new records_1.StringField(""),
            name: new records_1.StringField("")
        },
        keys: ["key"]
    });
    users.update({
        key: "A",
        name: "One"
    });
    assert.true(users.lookup({ key: "A" }).name === "One");
});
