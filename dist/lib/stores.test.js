"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stores_1 = require("./stores");
const records_1 = require("./records");
const blocks_1 = require("./blocks");
const files_1 = require("./files");
const filters_1 = require("./filters");
const orders_1 = require("./orders");
const test_1 = require("./test");
const tables_1 = require("./tables");
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
        observed.push(entry.key);
    }
    let expected = ["A", "B"];
    assert.array.equals(observed, expected);
});
(0, test_1.test)(`It should support iteration of the records stored in increasing order.`, async (assert) => {
    let blockManager = new blocks_1.BlockManager(new files_1.VirtualFile(0));
    let users = stores_1.StoreManager.construct(blockManager, {
        fields: {
            key: new records_1.StringField("")
        },
        keys: ["key"],
        orders: {
            key: new orders_1.IncreasingOrder()
        }
    });
    users.insert({
        key: "A"
    });
    users.insert({
        key: "B"
    });
    let iterable = users;
    let observed = Array.from(iterable).map((entry) => entry.key);
    let expected = ["A", "B"];
    assert.array.equals(observed, expected);
});
(0, test_1.test)(`It should support iteration of the records stored in decreasing order.`, async (assert) => {
    let blockManager = new blocks_1.BlockManager(new files_1.VirtualFile(0));
    let users = stores_1.StoreManager.construct(blockManager, {
        fields: {
            key: new records_1.StringField("")
        },
        keys: ["key"],
        orders: {
            key: new orders_1.DecreasingOrder()
        }
    });
    users.insert({
        key: "A"
    });
    users.insert({
        key: "B"
    });
    let iterable = users;
    let observed = Array.from(iterable).map((entry) => entry.key);
    let expected = ["B", "A"];
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
    let observed = Array.from(iterable).map((entry) => entry.key);
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
    let observed = Array.from(iterable).map((entry) => entry.key);
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
    let observed = Array.from(iterable).map((entry) => entry.key);
    let expected = ["B", "A"];
    assert.array.equals(observed, expected);
});
(0, test_1.test)(`It should support ordering of the records stored in increasing order with an index.`, async (assert) => {
    let blockManager = new blocks_1.BlockManager(new files_1.VirtualFile(0));
    let users = stores_1.StoreManager.construct(blockManager, {
        fields: {
            key: new records_1.StringField("")
        },
        keys: ["key"],
        indices: [
            new stores_1.Index(["key"])
        ]
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
    let observed = Array.from(iterable).map((entry) => entry.key);
    let expected = ["A", "B"];
    assert.array.equals(observed, expected);
});
(0, test_1.test)(`It should support ordering of the records stored in decreasing order with an index.`, async (assert) => {
    let blockManager = new blocks_1.BlockManager(new files_1.VirtualFile(0));
    let users = stores_1.StoreManager.construct(blockManager, {
        fields: {
            key: new records_1.StringField("")
        },
        keys: ["key"],
        indices: [
            new stores_1.Index(["key"])
        ]
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
    let observed = Array.from(iterable).map((entry) => entry.key);
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
(0, test_1.test)(`It should support partially updating a record previously inserted.`, async (assert) => {
    let blockManager = new blocks_1.BlockManager(new files_1.VirtualFile(0));
    let users = stores_1.StoreManager.construct(blockManager, {
        fields: {
            key: new records_1.StringField(""),
            name: new records_1.StringField("")
        },
        keys: ["key"]
    });
    users.update({
        key: "A"
    });
    assert.true(users.lookup({ key: "A" }).name === "");
    users.update({
        key: "A",
        name: "Two"
    });
    assert.true(users.lookup({ key: "A" }).name === "Two");
});
(0, test_1.test)(`It should support partially updating a record not previously inserted.`, async (assert) => {
    let blockManager = new blocks_1.BlockManager(new files_1.VirtualFile(0));
    let users = stores_1.StoreManager.construct(blockManager, {
        fields: {
            key: new records_1.StringField(""),
            name: new records_1.StringField("")
        },
        keys: ["key"]
    });
    users.update({
        key: "A"
    });
    assert.true(users.lookup({ key: "A" }).name === "");
});
(0, test_1.test)(`It should create the correct index for a store without orders.`, async (assert) => {
    let users = new stores_1.Store({
        user_id: new records_1.StringField(""),
        name: new records_1.StringField("")
    }, ["user_id"], {
        user_id: undefined,
        name: undefined
    });
    let index = users.createIndex();
    let observed = index.keys;
    let expected = ["user_id"];
    assert.array.equals(observed, expected);
});
(0, test_1.test)(`It should create the correct index for a store with metadata field orders.`, async (assert) => {
    let users = new stores_1.Store({
        user_id: new records_1.StringField(""),
        name: new records_1.StringField("")
    }, ["user_id"], {
        user_id: undefined,
        name: new orders_1.IncreasingOrder()
    });
    let index = users.createIndex();
    let observed = index.keys;
    let expected = ["name", "user_id"];
    assert.array.equals(observed, expected);
});
(0, test_1.test)(`It should create the correct index for a store with identifying field orders.`, async (assert) => {
    let users = new stores_1.Store({
        user_id: new records_1.StringField(""),
        name: new records_1.StringField("")
    }, ["user_id"], {
        user_id: new orders_1.IncreasingOrder(),
        name: undefined
    });
    let index = users.createIndex();
    let observed = index.keys;
    let expected = ["user_id"];
    assert.array.equals(observed, expected);
});
(0, test_1.test)(`It should update indices on insert.`, async (assert) => {
    let blockManager = new blocks_1.BlockManager(new files_1.VirtualFile(0));
    let fields = {
        user_id: new records_1.StringField(""),
        name: new records_1.StringField("")
    };
    let keys = ["user_id"];
    let recordManager = new records_1.RecordManager(fields);
    let table = new tables_1.Table(blockManager, {
        getKeyFromValue: (value) => {
            let buffer = blockManager.readBlock(value);
            let record = recordManager.decode(buffer);
            return recordManager.encodeKeys(keys, record);
        }
    });
    let index = new stores_1.IndexManager(recordManager, blockManager, ["name"]);
    let users = new stores_1.StoreManager(blockManager, fields, keys, {}, table, [index]);
    users.insert({
        user_id: "User 1",
        name: "Name 1"
    });
    let observed = Array.from(index).map((record) => record.name);
    let expected = ["Name 1"];
    assert.array.equals(observed, expected);
});
(0, test_1.test)(`It should update indices on update.`, async (assert) => {
    let blockManager = new blocks_1.BlockManager(new files_1.VirtualFile(0));
    let fields = {
        user_id: new records_1.StringField(""),
        name: new records_1.StringField("")
    };
    let keys = ["user_id"];
    let recordManager = new records_1.RecordManager(fields);
    let table = new tables_1.Table(blockManager, {
        getKeyFromValue: (value) => {
            let buffer = blockManager.readBlock(value);
            let record = recordManager.decode(buffer);
            return recordManager.encodeKeys(keys, record);
        }
    });
    let index = new stores_1.IndexManager(recordManager, blockManager, ["name"]);
    let users = new stores_1.StoreManager(blockManager, fields, keys, {}, table, [index]);
    users.insert({
        user_id: "User 1",
        name: "Name 1"
    });
    users.insert({
        user_id: "User 1",
        name: "Name 2"
    });
    let observed = Array.from(index).map((record) => record.name);
    let expected = ["Name 2"];
    assert.array.equals(observed, expected);
});
(0, test_1.test)(`It should update indices on remove.`, async (assert) => {
    let blockManager = new blocks_1.BlockManager(new files_1.VirtualFile(0));
    let fields = {
        user_id: new records_1.StringField(""),
        name: new records_1.StringField("")
    };
    let keys = ["user_id"];
    let recordManager = new records_1.RecordManager(fields);
    let table = new tables_1.Table(blockManager, {
        getKeyFromValue: (value) => {
            let buffer = blockManager.readBlock(value);
            let record = recordManager.decode(buffer);
            return recordManager.encodeKeys(keys, record);
        }
    });
    let index = new stores_1.IndexManager(recordManager, blockManager, ["name"]);
    let users = new stores_1.StoreManager(blockManager, fields, keys, {}, table, [index]);
    users.insert({
        user_id: "User 1",
        name: "Name 1"
    });
    users.remove({
        user_id: "User 1"
    });
    let observed = Array.from(index).map((record) => record.name);
    let expected = [];
    assert.array.equals(observed, expected);
});
(0, test_1.test)(`It should use the optimal index when filtering with filters.`, async (assert) => {
    let blockManager = new blocks_1.BlockManager(new files_1.VirtualFile(0));
    let fields = {
        user_id: new records_1.StringField(""),
        name: new records_1.StringField("")
    };
    let keys = ["user_id"];
    let recordManager = new records_1.RecordManager(fields);
    let table = new tables_1.Table(blockManager, {
        getKeyFromValue: (value) => {
            let buffer = blockManager.readBlock(value);
            let record = recordManager.decode(buffer);
            return recordManager.encodeKeys(keys, record);
        }
    });
    let indexOne = new stores_1.IndexManager(recordManager, blockManager, ["user_id"]);
    let usersOne = new stores_1.StoreManager(blockManager, fields, keys, {}, table, [indexOne]);
    usersOne.insert({
        user_id: "User 1",
        name: "Name"
    });
    let indexTwo = new stores_1.IndexManager(recordManager, blockManager, ["name"]);
    let usersTwo = new stores_1.StoreManager(blockManager, fields, keys, {}, table, [indexTwo]);
    usersTwo.insert({
        user_id: "User 2",
        name: "Name"
    });
    let users = new stores_1.StoreManager(blockManager, fields, keys, {}, table, [indexOne, indexTwo]);
    let iterable = users.filter({
        name: new filters_1.EqualityFilter("Name")
    });
    let observed = Array.from(iterable).map((record) => record.user_id);
    let expected = ["User 1"];
    assert.array.equals(observed, expected);
});
(0, test_1.test)(`It should use the optimal index when filtering with filters and orders`, async (assert) => {
    let blockManager = new blocks_1.BlockManager(new files_1.VirtualFile(0));
    let fields = {
        user_id: new records_1.StringField(""),
        name: new records_1.StringField("")
    };
    let keys = ["user_id"];
    let recordManager = new records_1.RecordManager(fields);
    let table = new tables_1.Table(blockManager, {
        getKeyFromValue: (value) => {
            let buffer = blockManager.readBlock(value);
            let record = recordManager.decode(buffer);
            return recordManager.encodeKeys(keys, record);
        }
    });
    let indexOne = new stores_1.IndexManager(recordManager, blockManager, ["user_id"]);
    let usersOne = new stores_1.StoreManager(blockManager, fields, keys, {}, table, [indexOne]);
    usersOne.insert({
        user_id: "User 1",
        name: "Name"
    });
    let indexTwo = new stores_1.IndexManager(recordManager, blockManager, ["name", "user_id"]);
    let usersTwo = new stores_1.StoreManager(blockManager, fields, keys, {}, table, [indexTwo]);
    usersTwo.insert({
        user_id: "User 2",
        name: "Name"
    });
    let users = new stores_1.StoreManager(blockManager, fields, keys, {}, table, [indexOne, indexTwo]);
    let iterable = users.filter({
        name: new filters_1.EqualityFilter("Name")
    });
    let observed = Array.from(iterable).map((record) => record.user_id);
    let expected = ["User 2"];
    assert.array.equals(observed, expected);
});
(0, test_1.test)(`It should support anchored filtering of the records stored in increasing order.`, async (assert) => {
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
    users.insert({
        key: "C"
    });
    users.insert({
        key: "D"
    });
    let iterable = users.filter({}, {
        key: new orders_1.IncreasingOrder()
    }, {
        key: "B"
    });
    let observed = Array.from(iterable).map((entry) => entry.key);
    let expected = ["C", "D"];
    assert.array.equals(observed, expected);
});
(0, test_1.test)(`It should support anchored filtering of the records stored in increasing order with an index.`, async (assert) => {
    let blockManager = new blocks_1.BlockManager(new files_1.VirtualFile(0));
    let users = stores_1.StoreManager.construct(blockManager, {
        fields: {
            key: new records_1.StringField("")
        },
        keys: ["key"],
        indices: [
            new stores_1.Index(["key"])
        ]
    });
    users.insert({
        key: "A"
    });
    users.insert({
        key: "B"
    });
    users.insert({
        key: "C"
    });
    users.insert({
        key: "D"
    });
    let iterable = users.filter({}, {
        key: new orders_1.IncreasingOrder()
    }, {
        key: "B"
    });
    let observed = Array.from(iterable).map((entry) => entry.key);
    let expected = ["C", "D"];
    assert.array.equals(observed, expected);
});
(0, test_1.test)(`It should support anchored filtering of the records stored in decreasing order.`, async (assert) => {
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
    users.insert({
        key: "C"
    });
    users.insert({
        key: "D"
    });
    let iterable = users.filter({}, {
        key: new orders_1.DecreasingOrder()
    }, {
        key: "C"
    });
    let observed = Array.from(iterable).map((entry) => entry.key);
    let expected = ["B", "A"];
    assert.array.equals(observed, expected);
});
(0, test_1.test)(`It should support anchored filtering of the records stored in decreasing order with an index.`, async (assert) => {
    let blockManager = new blocks_1.BlockManager(new files_1.VirtualFile(0));
    let users = stores_1.StoreManager.construct(blockManager, {
        fields: {
            key: new records_1.StringField("")
        },
        keys: ["key"],
        indices: [
            new stores_1.Index(["key"])
        ]
    });
    users.insert({
        key: "A"
    });
    users.insert({
        key: "B"
    });
    users.insert({
        key: "C"
    });
    users.insert({
        key: "D"
    });
    let iterable = users.filter({}, {
        key: new orders_1.DecreasingOrder()
    }, {
        key: "C"
    });
    let observed = Array.from(iterable).map((entry) => entry.key);
    let expected = ["B", "A"];
    assert.array.equals(observed, expected);
});
(0, test_1.test)(`It should perform significantly better with a suitable index.`, async (assert) => {
    let blockManager = new blocks_1.BlockManager(new files_1.VirtualFile(0));
    let storeOne = stores_1.StoreManager.construct(blockManager, {
        fields: {
            key: new records_1.IntegerField(0)
        },
        keys: ["key"],
        indices: [
            new stores_1.Index(["key"])
        ]
    });
    let storeTwo = stores_1.StoreManager.construct(blockManager, {
        fields: {
            key: new records_1.IntegerField(0)
        },
        keys: ["key"],
        indices: []
    });
    for (let key = 0; key < 1000; key++) {
        storeOne.insert({
            key
        });
        storeTwo.insert({
            key
        });
    }
    let averageOne = await (0, test_1.benchmark)(async () => {
        storeOne.filter(undefined, undefined, undefined, 10);
    });
    let averageTwo = await (0, test_1.benchmark)(async () => {
        storeTwo.filter(undefined, undefined, undefined, 10);
    });
    assert.true(averageOne * 100 < averageTwo);
});
(0, test_1.test)(`It should prevent identical records from being re-indexed.`, async (assert) => {
    let blockManager = new blocks_1.BlockManager(new files_1.VirtualFile(0));
    let fields = {
        user_id: new records_1.StringField(""),
        name: new records_1.StringField("")
    };
    let keys = ["user_id"];
    let recordManager = new records_1.RecordManager(fields);
    let table = new tables_1.Table(blockManager, {
        getKeyFromValue: (value) => {
            let buffer = blockManager.readBlock(value);
            let record = recordManager.decode(buffer);
            return recordManager.encodeKeys(keys, record);
        }
    });
    let index = new stores_1.IndexManager(recordManager, blockManager, ["user_id"]);
    let users = new stores_1.StoreManager(blockManager, fields, keys, {}, table, [index]);
    let record = {
        user_id: "User 1",
        name: "Name2"
    };
    assert.true(!Number.isInteger(Math.log2(recordManager.encode(record).length)));
    users.insert(record);
    assert.array.equals(Array.from(index).map((user) => user.user_id), ["User 1"]);
    index.remove(record);
    assert.array.equals(Array.from(index).map((user) => user.user_id), []);
    users.insert(record);
    assert.array.equals(Array.from(index).map((user) => user.user_id), []);
});
