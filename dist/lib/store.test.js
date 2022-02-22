"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const store_1 = require("./store");
const records_1 = require("./records");
const vfs_1 = require("./vfs");
const files_1 = require("./files");
const filters_1 = require("./filters");
const orders_1 = require("./orders");
const test_1 = require("./test");
(0, test_1.test)(`It should support iteration of the records stored.`, async (assert) => {
    let blockHandler = new vfs_1.BlockHandler(new files_1.VirtualFile(0));
    let users = store_1.StoreManager.construct(blockHandler, null, {
        fields: {
            key: new records_1.StringField("")
        },
        keys: ["key"],
        indices: []
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
    let blockHandler = new vfs_1.BlockHandler(new files_1.VirtualFile(0));
    let users = store_1.StoreManager.construct(blockHandler, null, {
        fields: {
            key: new records_1.StringField("")
        },
        keys: ["key"],
        indices: []
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
    let blockHandler = new vfs_1.BlockHandler(new files_1.VirtualFile(0));
    let users = store_1.StoreManager.construct(blockHandler, null, {
        fields: {
            key: new records_1.StringField("")
        },
        keys: ["key"],
        indices: []
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
    let blockHandler = new vfs_1.BlockHandler(new files_1.VirtualFile(0));
    let users = store_1.StoreManager.construct(blockHandler, null, {
        fields: {
            key: new records_1.StringField("")
        },
        keys: ["key"],
        indices: []
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
    let blockHandler = new vfs_1.BlockHandler(new files_1.VirtualFile(0));
    let users = store_1.StoreManager.construct(blockHandler, null, {
        fields: {
            key: new records_1.StringField(""),
            name: new records_1.StringField("")
        },
        keys: ["key"],
        indices: []
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
    let blockHandler = new vfs_1.BlockHandler(new files_1.VirtualFile(0));
    let users = store_1.StoreManager.construct(blockHandler, null, {
        fields: {
            key: new records_1.StringField(""),
            name: new records_1.StringField("")
        },
        keys: ["key"],
        indices: []
    });
    users.insert({
        key: "A",
        name: "One"
    });
    assert.true(users.lookup({ key: "A" }).name === "One");
});
(0, test_1.test)(`It should keep track of the number of records stored.`, async (assert) => {
    let blockHandler = new vfs_1.BlockHandler(new files_1.VirtualFile(0));
    let users = store_1.StoreManager.construct(blockHandler, null, {
        fields: {
            key: new records_1.StringField("")
        },
        keys: ["key"],
        indices: []
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
    let blockHandler = new vfs_1.BlockHandler(new files_1.VirtualFile(0));
    let users = store_1.StoreManager.construct(blockHandler, null, {
        fields: {
            key: new records_1.StringField("")
        },
        keys: ["key"],
        indices: []
    });
    users.insert({
        key: "A"
    });
    assert.true(users.lookup({ key: "A" }).key === "A");
});
(0, test_1.test)(`It should throw an error when looking up records not previously inserted.`, async (assert) => {
    let blockHandler = new vfs_1.BlockHandler(new files_1.VirtualFile(0));
    let users = store_1.StoreManager.construct(blockHandler, null, {
        fields: {
            key: new records_1.StringField("")
        },
        keys: ["key"],
        indices: []
    });
    await assert.throws(async () => {
        users.lookup({
            key: "A"
        });
    });
});
(0, test_1.test)(`It should support removing records previously inserted.`, async (assert) => {
    let blockHandler = new vfs_1.BlockHandler(new files_1.VirtualFile(0));
    let users = store_1.StoreManager.construct(blockHandler, null, {
        fields: {
            key: new records_1.StringField("")
        },
        keys: ["key"],
        indices: []
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
    let blockHandler = new vfs_1.BlockHandler(new files_1.VirtualFile(0));
    let users = store_1.StoreManager.construct(blockHandler, null, {
        fields: {
            key: new records_1.StringField("")
        },
        keys: ["key"],
        indices: []
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
    let blockHandler = new vfs_1.BlockHandler(new files_1.VirtualFile(0));
    let users = store_1.StoreManager.construct(blockHandler, null, {
        fields: {
            key: new records_1.StringField(""),
            name: new records_1.StringField("")
        },
        keys: ["key"],
        indices: []
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
    let blockHandler = new vfs_1.BlockHandler(new files_1.VirtualFile(0));
    let users = store_1.StoreManager.construct(blockHandler, null, {
        fields: {
            key: new records_1.StringField(""),
            name: new records_1.StringField("")
        },
        keys: ["key"],
        indices: []
    });
    users.update({
        key: "A",
        name: "One"
    });
    assert.true(users.lookup({ key: "A" }).name === "One");
});
(0, test_1.test)(`It should be able to construct a new manager.`, async (assert) => {
    let blockHandler = new vfs_1.BlockHandler(new files_1.VirtualFile(0));
    let users = store_1.StoreManager.construct(blockHandler, null);
});
(0, test_1.test)(`It should be able to construct a new manager with a given schema.`, async (assert) => {
    let blockHandler = new vfs_1.BlockHandler(new files_1.VirtualFile(0));
    let users = store_1.StoreManager.construct(blockHandler, null, {
        fields: {
            key: new records_1.StringField("")
        },
        keys: ["key"],
        indices: []
    });
});
(0, test_1.test)(`It should be able to construct an existing manager.`, async (assert) => {
    let blockHandler = new vfs_1.BlockHandler(new files_1.VirtualFile(0));
    let users = store_1.StoreManager.construct(blockHandler, null, {
        fields: {
            key: new records_1.StringField("")
        },
        keys: ["key"],
        indices: []
    });
    let users2 = store_1.StoreManager.construct(blockHandler, users.getBid());
    let blocks = blockHandler.getBlockCount();
    let users3 = store_1.StoreManager.construct(blockHandler, users.getBid());
    assert.true(blockHandler.getBlockCount() === blocks);
});
(0, test_1.test)(`It should be able to construct an existing manager with a given schema.`, async (assert) => {
    let blockHandler = new vfs_1.BlockHandler(new files_1.VirtualFile(0));
    let users = store_1.StoreManager.construct(blockHandler, null, {
        fields: {
            key: new records_1.StringField("")
        },
        keys: ["key"],
        indices: []
    });
    let users2 = store_1.StoreManager.construct(blockHandler, users.getBid(), {
        fields: {
            key: new records_1.StringField("")
        },
        keys: ["key"],
        indices: []
    });
    let blocks = blockHandler.getBlockCount();
    let users3 = store_1.StoreManager.construct(blockHandler, users.getBid(), {
        fields: {
            key: new records_1.StringField("")
        },
        keys: ["key"],
        indices: []
    });
    assert.true(blockHandler.getBlockCount() === blocks);
});
(0, test_1.test)(`It should be able to migrate a manager when one field is added to the schema.`, async (assert) => {
    let blockHandler = new vfs_1.BlockHandler(new files_1.VirtualFile(0));
    let users = store_1.StoreManager.construct(blockHandler, null, {
        fields: {
            key: new records_1.StringField("")
        },
        keys: ["key"],
        indices: []
    });
    users.insert({
        key: "A"
    });
    let users2 = store_1.StoreManager.migrate(users, {
        fields: {
            key: new records_1.StringField(""),
            name: new records_1.StringField("")
        },
        keys: ["key"],
        indices: []
    });
    assert.true(users2.lookup({ key: "A" }).name === "");
});
(0, test_1.test)(`It should be able to migrate a manager when one field is removed from the schema.`, async (assert) => {
    let blockHandler = new vfs_1.BlockHandler(new files_1.VirtualFile(0));
    let users = store_1.StoreManager.construct(blockHandler, null, {
        fields: {
            key: new records_1.StringField(""),
            name: new records_1.StringField("")
        },
        keys: ["key"],
        indices: []
    });
    users.insert({
        key: "A",
        name: "One"
    });
    let users2 = store_1.StoreManager.migrate(users, {
        fields: {
            key: new records_1.StringField("")
        },
        keys: ["key"],
        indices: []
    });
    assert.true(users2.lookup({ key: "A" }).key === "A");
});
(0, test_1.test)(`It should be able to migrate a manager when one field is changed in the schema.`, async (assert) => {
    let blockHandler = new vfs_1.BlockHandler(new files_1.VirtualFile(0));
    let users = store_1.StoreManager.construct(blockHandler, null, {
        fields: {
            key: new records_1.StringField(""),
            name: new records_1.StringField("")
        },
        keys: ["key"],
        indices: []
    });
    users.insert({
        key: "A",
        name: "One"
    });
    let users2 = store_1.StoreManager.migrate(users, {
        fields: {
            key: new records_1.StringField(""),
            name: new records_1.BooleanField(false)
        },
        keys: ["key"],
        indices: []
    });
    assert.true(users2.lookup({ key: "A" }).name === false);
});
(0, test_1.test)(`It should be able to migrate a manager when the keys have changed in the schema.`, async (assert) => {
    let blockHandler = new vfs_1.BlockHandler(new files_1.VirtualFile(0));
    let users = store_1.StoreManager.construct(blockHandler, null, {
        fields: {
            key1: new records_1.StringField(""),
            key2: new records_1.StringField("")
        },
        keys: ["key1"],
        indices: []
    });
    users.insert({
        key1: "A",
        key2: "B"
    });
    let users2 = store_1.StoreManager.migrate(users, {
        fields: {
            key1: new records_1.StringField(""),
            key2: new records_1.StringField("")
        },
        keys: ["key2"],
        indices: []
    });
    assert.true(users2.lookup({ key2: "B" }).key1 === "A");
});
