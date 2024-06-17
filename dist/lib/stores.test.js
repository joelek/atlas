"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const wtf = require("@joelek/wtf");
const stores_1 = require("./stores");
const records_1 = require("./records");
const blocks_1 = require("./blocks");
const files_1 = require("./files");
const filters_1 = require("./filters");
const orders_1 = require("./orders");
const test_1 = require("./test");
const tables_1 = require("./tables");
const links_1 = require("./links");
wtf.test(`It should support for-of iteration of the records stored.`, async (assert) => {
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
    assert.equals(observed, expected);
});
wtf.test(`It should support iteration of the records stored in increasing order.`, async (assert) => {
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
    assert.equals(observed, expected);
});
wtf.test(`It should support iteration of the records stored in decreasing order.`, async (assert) => {
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
    assert.equals(observed, expected);
});
wtf.test(`It should support filtering of the records stored.`, async (assert) => {
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
    assert.equals(observed, expected);
});
wtf.test(`It should support ordering of the records stored in increasing order.`, async (assert) => {
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
    assert.equals(observed, expected);
});
wtf.test(`It should support ordering of the records stored in decreasing order.`, async (assert) => {
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
    assert.equals(observed, expected);
});
wtf.test(`It should support ordering of the records stored in increasing order with an index.`, async (assert) => {
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
    assert.equals(observed, expected);
});
wtf.test(`It should support ordering of the records stored in decreasing order with an index.`, async (assert) => {
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
    assert.equals(observed, expected);
});
wtf.test(`It should support inserting a record previously inserted.`, async (assert) => {
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
    assert.equals(users.lookup({ key: "A" }).name, "One");
    users.insert({
        key: "A",
        name: "Two"
    });
    assert.equals(users.lookup({ key: "A" }).name, "Two");
});
wtf.test(`It should support inserting a record not previously inserted.`, async (assert) => {
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
    assert.equals(users.lookup({ key: "A" }).name, "One");
});
wtf.test(`It should keep track of the number of records stored.`, async (assert) => {
    let blockManager = new blocks_1.BlockManager(new files_1.VirtualFile(0));
    let users = stores_1.StoreManager.construct(blockManager, {
        fields: {
            key: new records_1.StringField("")
        },
        keys: ["key"]
    });
    assert.equals(users.length(), 0);
    users.insert({
        key: "A"
    });
    assert.equals(users.length(), 1);
    users.insert({
        key: "B"
    });
    assert.equals(users.length(), 2);
    users.insert({
        key: "A"
    });
    assert.equals(users.length(), 2);
    users.remove({
        key: "B"
    });
    assert.equals(users.length(), 1);
    users.remove({
        key: "A"
    });
    assert.equals(users.length(), 0);
});
wtf.test(`It should support looking up records previously inserted.`, async (assert) => {
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
    assert.equals(users.lookup({ key: "A" }).key, "A");
});
wtf.test(`It should throw an error when looking up records not previously inserted.`, async (assert) => {
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
wtf.test(`It should support removing records previously inserted.`, async (assert) => {
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
    assert.equals(users.lookup({ key: "A" }).key, "A");
    users.remove({
        key: "A"
    });
    await assert.throws(async () => {
        users.lookup({
            key: "A"
        });
    });
});
wtf.test(`It should support removing records not previously inserted.`, async (assert) => {
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
wtf.test(`It should support updating a record previously inserted.`, async (assert) => {
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
    assert.equals(users.lookup({ key: "A" }).name, "One");
    users.update({
        key: "A",
        name: "Two"
    });
    assert.equals(users.lookup({ key: "A" }).name, "Two");
});
wtf.test(`It should support updating a record not previously inserted.`, async (assert) => {
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
    assert.equals(users.lookup({ key: "A" }).name, "One");
});
wtf.test(`It should support partially updating a record previously inserted.`, async (assert) => {
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
    assert.equals(users.lookup({ key: "A" }).name, "");
    users.update({
        key: "A",
        name: "Two"
    });
    assert.equals(users.lookup({ key: "A" }).name, "Two");
});
wtf.test(`It should support partially updating a record not previously inserted.`, async (assert) => {
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
    assert.equals(users.lookup({ key: "A" }).name, "");
});
wtf.test(`It should create the correct index for a store without orders.`, async (assert) => {
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
    assert.equals(observed, expected);
});
wtf.test(`It should create the correct index for a store with metadata field orders.`, async (assert) => {
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
    assert.equals(observed, expected);
});
wtf.test(`It should create the correct index for a store with identifying field orders.`, async (assert) => {
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
    assert.equals(observed, expected);
});
wtf.test(`It should create appropriate indices for a store with unique fields.`, async (assert) => {
    let users = new stores_1.Store({
        user_id: new records_1.StringField(""),
        name: new records_1.StringField("", true)
    }, ["user_id"]);
    assert.equals(users.index(new stores_1.Index(["name", "user_id"])), false);
});
wtf.test(`It should update indices on insert.`, async (assert) => {
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
    let users = new stores_1.StoreManager(blockManager, fields, keys, {}, table, [index], []);
    users.insert({
        user_id: "User 1",
        name: "Name 1"
    });
    let observed = Array.from(index).map((record) => record.name);
    let expected = ["Name 1"];
    assert.equals(observed, expected);
});
wtf.test(`It should update indices on update.`, async (assert) => {
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
    let users = new stores_1.StoreManager(blockManager, fields, keys, {}, table, [index], []);
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
    assert.equals(observed, expected);
});
wtf.test(`It should update indices on remove.`, async (assert) => {
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
    let users = new stores_1.StoreManager(blockManager, fields, keys, {}, table, [index], []);
    users.insert({
        user_id: "User 1",
        name: "Name 1"
    });
    users.remove({
        user_id: "User 1"
    });
    let observed = Array.from(index).map((record) => record.name);
    let expected = [];
    assert.equals(observed, expected);
});
wtf.test(`It should not prevent unique fields from being stored with identical non-null values for the same record.`, async (assert) => {
    let blockManager = new blocks_1.BlockManager(new files_1.VirtualFile(0));
    let fields = {
        user_id: new records_1.StringField(""),
        name: new records_1.NullableStringField("", true)
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
    let users = new stores_1.StoreManager(blockManager, fields, keys, {}, table, [], []);
    users.insert({
        user_id: "User 1",
        name: "Name 1"
    });
    users.insert({
        user_id: "User 1",
        name: "Name 1"
    });
});
wtf.test(`It should not prevent unique fields from being stored with null values for two different records.`, async (assert) => {
    let blockManager = new blocks_1.BlockManager(new files_1.VirtualFile(0));
    let fields = {
        user_id: new records_1.StringField(""),
        name: new records_1.NullableStringField("", true)
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
    let users = new stores_1.StoreManager(blockManager, fields, keys, {}, table, [], []);
    users.insert({
        user_id: "User 1",
        name: null
    });
    users.insert({
        user_id: "User 2",
        name: null
    });
});
wtf.test(`It should prevent unique fields from being stored with identical non-null values for two different records.`, async (assert) => {
    let blockManager = new blocks_1.BlockManager(new files_1.VirtualFile(0));
    let fields = {
        user_id: new records_1.StringField(""),
        name: new records_1.NullableStringField("", true)
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
    let users = new stores_1.StoreManager(blockManager, fields, keys, {}, table, [], []);
    users.insert({
        user_id: "User 1",
        name: "Name 1"
    });
    await assert.throws(async () => {
        users.insert({
            user_id: "User 2",
            name: "Name 1"
        });
    });
});
wtf.test(`It should use the optimal index when filtering with filters.`, async (assert) => {
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
    let usersOne = new stores_1.StoreManager(blockManager, fields, keys, {}, table, [indexOne], []);
    usersOne.insert({
        user_id: "User 1",
        name: "Right Name"
    });
    usersOne.insert({
        user_id: "User 2",
        name: "Wrong Name"
    });
    let indexTwo = new stores_1.IndexManager(recordManager, blockManager, ["name", "user_id"]);
    let usersTwo = new stores_1.StoreManager(blockManager, fields, keys, {}, table, [indexTwo], []);
    usersTwo.insert({
        user_id: "User 1",
        name: "Wrong Name"
    });
    usersTwo.insert({
        user_id: "User 2",
        name: "Right Name"
    });
    let users = new stores_1.StoreManager(blockManager, fields, keys, {}, table, [indexOne, indexTwo], []);
    let iterable = users.filter({
        name: new filters_1.EqualityFilter("Right Name")
    });
    let observed = Array.from(iterable).map((record) => record.user_id);
    let expected = ["User 2"];
    assert.equals(observed, expected);
});
wtf.test(`It should use the optimal index when filtering with filters and orders`, async (assert) => {
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
    let usersOne = new stores_1.StoreManager(blockManager, fields, keys, {}, table, [indexOne], []);
    usersOne.insert({
        user_id: "User 1",
        name: "Right Name"
    });
    usersOne.insert({
        user_id: "User 2",
        name: "Wrong Name"
    });
    let indexTwo = new stores_1.IndexManager(recordManager, blockManager, ["name", "user_id"]);
    let usersTwo = new stores_1.StoreManager(blockManager, fields, keys, {}, table, [indexTwo], []);
    usersTwo.insert({
        user_id: "User 1",
        name: "Wrong Name"
    });
    usersTwo.insert({
        user_id: "User 2",
        name: "Right Name"
    });
    let users = new stores_1.StoreManager(blockManager, fields, keys, {}, table, [indexOne, indexTwo], []);
    let iterable = users.filter({
        name: new filters_1.EqualityFilter("Right Name")
    });
    let observed = Array.from(iterable).map((record) => record.user_id);
    let expected = ["User 2"];
    assert.equals(observed, expected);
});
wtf.test(`It should support anchored filtering of the records stored in increasing order.`, async (assert) => {
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
    assert.equals(observed, expected);
});
wtf.test(`It should support anchored filtering of the records stored in increasing order with an index.`, async (assert) => {
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
    assert.equals(observed, expected);
});
wtf.test(`It should support anchored filtering of the records stored in decreasing order.`, async (assert) => {
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
    assert.equals(observed, expected);
});
wtf.test(`It should support anchored filtering of the records stored in decreasing order with an index.`, async (assert) => {
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
    assert.equals(observed, expected);
});
wtf.test(`It should support anchored filtering of the records through a self-referencing link in increasing order with an index.`, async (assert) => {
    let blockManager = new blocks_1.BlockManager(new files_1.VirtualFile(0));
    let directories = stores_1.StoreManager.construct(blockManager, {
        fields: {
            directory_id: new records_1.StringField(""),
            parent_directory_id: new records_1.NullableStringField(""),
            name: new records_1.StringField("")
        },
        keys: ["directory_id"],
        indices: [
            new stores_1.Index(["parent_directory_id", "name", "directory_id"])
        ]
    });
    let directory_directories = links_1.LinkManager.construct(directories, directories, {
        directory_id: "parent_directory_id"
    }, {
        name: new orders_1.IncreasingOrder()
    });
    directories.insert({
        directory_id: "2",
        parent_directory_id: null,
        name: "A"
    });
    directories.insert({
        directory_id: "3",
        parent_directory_id: null,
        name: "B"
    });
    directories.insert({
        directory_id: "1",
        parent_directory_id: null,
        name: "C"
    });
    let records = [];
    while (true) {
        let batch = directory_directories.filter(undefined, records[records.length - 1], 1);
        if (batch.length === 0) {
            break;
        }
        records.push(...batch);
    }
    assert.equals(records.map((record) => record.name), ["A", "B", "C"]);
});
wtf.test(`It should perform significantly better with a suitable index.`, async (assert) => {
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
    assert.equals(averageOne * 100 < averageTwo, true);
});
wtf.test(`It should perform equally good when there are two suitable indices.`, async (assert) => {
    let blockManager = new blocks_1.BlockManager(new files_1.VirtualFile(0));
    let tracks = stores_1.StoreManager.construct(blockManager, {
        fields: {
            track_id: new records_1.StringField("")
        },
        keys: ["track_id"],
        indices: [
            new stores_1.Index(["track_id"])
        ]
    });
    let files = stores_1.StoreManager.construct(blockManager, {
        fields: {
            file_id: new records_1.StringField("")
        },
        keys: ["file_id"],
        indices: [
            new stores_1.Index(["file_id"])
        ]
    });
    let track_files = stores_1.StoreManager.construct(blockManager, {
        fields: {
            track_id: new records_1.StringField(""),
            file_id: new records_1.StringField("")
        },
        keys: ["track_id", "file_id"],
        indices: [
            new stores_1.Index(["track_id", "file_id"]),
            new stores_1.Index(["file_id", "track_id"])
        ]
    });
    let track_track_files = links_1.LinkManager.construct(tracks, track_files, {
        track_id: "track_id"
    });
    let file_track_files = links_1.LinkManager.construct(files, track_files, {
        file_id: "file_id"
    });
    for (let i = 0; i < 1000; i++) {
        tracks.insert({
            track_id: `Track ${i}`
        });
        files.insert({
            file_id: `File ${i}`
        });
        track_files.insert({
            track_id: `Track ${i}`,
            file_id: `File ${i}`
        });
    }
    let averageOne = await (0, test_1.benchmark)(() => {
        track_track_files.filter({
            track_id: "Track 500"
        });
    });
    let averageTwo = await (0, test_1.benchmark)(() => {
        file_track_files.filter({
            file_id: "File 500"
        });
    });
    let min = Math.min(averageOne, averageTwo);
    let max = Math.max(averageOne, averageTwo);
    assert.equals(min * 2 >= max, true);
});
wtf.test(`It should prevent identical records from being re-indexed.`, async (assert) => {
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
    let users = new stores_1.StoreManager(blockManager, fields, keys, {}, table, [index], []);
    let record = {
        user_id: "User 1",
        name: "Name2"
    };
    assert.equals(Number.isInteger(Math.log2(recordManager.encode(record).length)), false);
    users.insert(record);
    assert.equals(Array.from(index).map((user) => user.user_id), ["User 1"]);
    index.remove(record);
    assert.equals(Array.from(index).map((user) => user.user_id), []);
    users.insert(record);
    assert.equals(Array.from(index).map((user) => user.user_id), []);
});
wtf.test(`It should support vacating.`, async (assert) => {
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
    users.vacate();
    let observed = Array.from(users).map((entry) => entry.key);
    let expected = [];
    assert.equals(observed, expected);
});
function makeUsersSearchIndex() {
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
    let index = new stores_1.SearchIndexManager(recordManager, blockManager, "name");
    let users = new stores_1.StoreManager(blockManager, fields, keys, {}, table, [], [index]);
    return {
        users,
        index
    };
}
;
wtf.test(`It should update search indices on insert.`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert({
        user_id: "User 1",
        name: "Name 1"
    });
    let observed = Array.from(index).map((record) => record.record.name);
    let expected = ["Name 1"];
    assert.equals(observed, expected);
});
wtf.test(`It should update search indices on update.`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert({
        user_id: "User 1",
        name: "Name 1"
    });
    users.insert({
        user_id: "User 1",
        name: "Name 2"
    });
    let observed = Array.from(index).map((record) => record.record.name);
    let expected = ["Name 2"];
    assert.equals(observed, expected);
});
wtf.test(`It should update search indices on remove.`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert({
        user_id: "User 1",
        name: "Name 1"
    });
    users.remove({
        user_id: "User 1"
    });
    let observed = Array.from(index).map((record) => record.record.name);
    let expected = [];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Ek"] and query is "".`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert({
        user_id: "User 1",
        name: "Ek"
    });
    let observed = users.search("").map((record) => record.record.user_id);
    let expected = ["User 1"];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Ek"] and query is "e".`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert({
        user_id: "User 1",
        name: "Ek"
    });
    let observed = users.search("e").map((record) => record.record.user_id);
    let expected = ["User 1"];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Ek"] and query is "ek".`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert({
        user_id: "User 1",
        name: "Ek"
    });
    let observed = users.search("ek").map((record) => record.record.user_id);
    let expected = ["User 1"];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Ek"] and query is "eks".`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert({
        user_id: "User 1",
        name: "Ek"
    });
    let observed = users.search("eks").map((record) => record.record.user_id);
    let expected = [];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Joel Ek"] and query is "".`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert({
        user_id: "User 1",
        name: "Joel Ek"
    });
    let observed = users.search("").map((record) => record.record.user_id);
    let expected = ["User 1"];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Joel Ek"] and query is "e".`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert({
        user_id: "User 1",
        name: "Joel Ek"
    });
    let observed = users.search("e").map((record) => record.record.user_id);
    let expected = ["User 1"];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Joel Ek"] and query is "ek".`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert({
        user_id: "User 1",
        name: "Joel Ek"
    });
    let observed = users.search("ek").map((record) => record.record.user_id);
    let expected = ["User 1"];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Joel Ek"] and query is "eks".`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert({
        user_id: "User 1",
        name: "Joel Ek"
    });
    let observed = users.search("eks").map((record) => record.record.user_id);
    let expected = [];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Joel Ek"] and query is "joel".`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert({
        user_id: "User 1",
        name: "Joel Ek"
    });
    let observed = users.search("joel").map((record) => record.record.user_id);
    let expected = ["User 1"];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Joel Ek"] and query is "joel ek".`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert({
        user_id: "User 1",
        name: "Joel Ek"
    });
    let observed = users.search("joel ek").map((record) => record.record.user_id);
    let expected = ["User 1"];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Joel Ek"] and query is "ek joel".`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert({
        user_id: "User 1",
        name: "Joel Ek"
    });
    let observed = users.search("ek joel").map((record) => record.record.user_id);
    let expected = ["User 1"];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Joel Ek"] and query is "joel eks".`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert({
        user_id: "User 1",
        name: "Joel Ek"
    });
    let observed = users.search("joel eks").map((record) => record.record.user_id);
    let expected = [];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Joel Ek"] and query is "joels ek".`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert({
        user_id: "User 1",
        name: "Joel Ek"
    });
    let observed = users.search("joels ek").map((record) => record.record.user_id);
    let expected = [];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Joel A Z", "Joel Ek", "Joel A Z"] and query is "".`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert({
        user_id: "User 0",
        name: "Joel A Z"
    });
    users.insert({
        user_id: "User 1",
        name: "Joel Ek"
    });
    users.insert({
        user_id: "User 2",
        name: "Joel A Z"
    });
    let observed = users.search("").map((record) => record.record.user_id);
    let expected = ["User 0", "User 1", "User 2"];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Joel A Z", "Joel Ek", "Joel A Z"] and query is "e".`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert({
        user_id: "User 0",
        name: "Joel A Z"
    });
    users.insert({
        user_id: "User 1",
        name: "Joel Ek"
    });
    users.insert({
        user_id: "User 2",
        name: "Joel A Z"
    });
    let observed = users.search("e").map((record) => record.record.user_id);
    let expected = ["User 1"];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Joel A Z", "Joel Ek", "Joel A Z"] and query is "ek".`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert({
        user_id: "User 0",
        name: "Joel A Z"
    });
    users.insert({
        user_id: "User 1",
        name: "Joel Ek"
    });
    users.insert({
        user_id: "User 2",
        name: "Joel A Z"
    });
    let observed = users.search("ek").map((record) => record.record.user_id);
    let expected = ["User 1"];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Joel A Z", "Joel Ek", "Joel A Z"] and query is "eks".`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert({
        user_id: "User 0",
        name: "Joel A Z"
    });
    users.insert({
        user_id: "User 1",
        name: "Joel Ek"
    });
    users.insert({
        user_id: "User 2",
        name: "Joel A Z"
    });
    let observed = users.search("eks").map((record) => record.record.user_id);
    let expected = [];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Joel A Z", "Joel Ek", "Joel A Z"] and query is "joel".`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert({
        user_id: "User 0",
        name: "Joel A Z"
    });
    users.insert({
        user_id: "User 1",
        name: "Joel Ek"
    });
    users.insert({
        user_id: "User 2",
        name: "Joel A Z"
    });
    let observed = users.search("joel").map((record) => record.record.user_id);
    let expected = ["User 1", "User 0", "User 2"];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Joel A Z", "Joel Ek", "Joel A Z"] and query is "joel e".`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert({
        user_id: "User 0",
        name: "Joel A Z"
    });
    users.insert({
        user_id: "User 1",
        name: "Joel Ek"
    });
    users.insert({
        user_id: "User 2",
        name: "Joel A Z"
    });
    let observed = users.search("joel e").map((record) => record.record.user_id);
    let expected = ["User 1"];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Joel A Z", "Joel Ek", "Joel A Z"] and query is "joel ek".`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert({
        user_id: "User 0",
        name: "Joel A Z"
    });
    users.insert({
        user_id: "User 1",
        name: "Joel Ek"
    });
    users.insert({
        user_id: "User 2",
        name: "Joel A Z"
    });
    let observed = users.search("joel ek").map((record) => record.record.user_id);
    let expected = ["User 1"];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Joel A Z", "Joel Ek", "Joel A Z"] and query is "joel eks".`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert({
        user_id: "User 0",
        name: "Joel A Z"
    });
    users.insert({
        user_id: "User 1",
        name: "Joel Ek"
    });
    users.insert({
        user_id: "User 2",
        name: "Joel A Z"
    });
    let observed = users.search("joel eks").map((record) => record.record.user_id);
    let expected = [];
    assert.equals(observed, expected);
});
wtf.test(`It should support anchored searches.`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert({
        user_id: "User 0",
        name: "A"
    });
    users.insert({
        user_id: "User 1",
        name: "B"
    });
    users.insert({
        user_id: "User 2",
        name: "C"
    });
    let observed = users.search("", { user_id: "User 1" }).map((record) => record.record.user_id);
    let expected = ["User 2"];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Aa Ab", "Aa"] and query is "a"`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert({
        user_id: "User 0",
        name: "Aa Ab"
    });
    users.insert({
        user_id: "User 1",
        name: "Aa"
    });
    let observed = users.search("a").map((record) => record.record.user_id);
    let expected = ["User 1", "User 0"];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Aa Az", "Aa"] and query is "a"`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert({
        user_id: "User 0",
        name: "Aa Az"
    });
    users.insert({
        user_id: "User 1",
        name: "Aa"
    });
    let observed = users.search("a").map((record) => record.record.user_id);
    let expected = ["User 1", "User 0"];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Aa Ab", "Ab"] and query is "a"`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert({
        user_id: "User 0",
        name: "Aa Ab"
    });
    users.insert({
        user_id: "User 1",
        name: "Ab"
    });
    let observed = users.search("a").map((record) => record.record.user_id);
    let expected = ["User 1", "User 0"];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Aa Az", "Ab"] and query is "a"`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert({
        user_id: "User 0",
        name: "Aa Az"
    });
    users.insert({
        user_id: "User 1",
        name: "Ab"
    });
    let observed = users.search("a").map((record) => record.record.user_id);
    let expected = ["User 1", "User 0"];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Aa Ab", "Az"] and query is "a"`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert({
        user_id: "User 0",
        name: "Aa Ab"
    });
    users.insert({
        user_id: "User 1",
        name: "Az"
    });
    let observed = users.search("a").map((record) => record.record.user_id);
    let expected = ["User 1", "User 0"];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Aa Az", "Az"] and query is "a"`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert({
        user_id: "User 0",
        name: "Aa Az"
    });
    users.insert({
        user_id: "User 1",
        name: "Az"
    });
    let observed = users.search("a").map((record) => record.record.user_id);
    let expected = ["User 1", "User 0"];
    assert.equals(observed, expected);
});
wtf.test(`It should not skip the entire category branch when the first candidate occurs before the first result in the same category.`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert({
        user_id: "User 0",
        name: "a c"
    });
    users.insert({
        user_id: "User 1",
        name: "a b"
    });
    users.insert({
        user_id: "User 2",
        name: "a c"
    });
    let observed = users.search("b").map((record) => record.record.user_id);
    let expected = ["User 1"];
    assert.equals(observed, expected);
});
wtf.test(`It should not return the same result twice when multiple indices match the query and the ranks are 0 and 0.`, async (assert) => {
    let blockManager = new blocks_1.BlockManager(new files_1.VirtualFile(0));
    let fields = {
        user_id: new records_1.StringField(""),
        firstname: new records_1.StringField(""),
        lastname: new records_1.StringField("")
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
    let indexOne = new stores_1.SearchIndexManager(recordManager, blockManager, "firstname");
    let indexTwo = new stores_1.SearchIndexManager(recordManager, blockManager, "lastname");
    let users = new stores_1.StoreManager(blockManager, fields, keys, {}, table, [], [indexOne, indexTwo]);
    users.insert({
        user_id: "User 1",
        firstname: "Name",
        lastname: "Name"
    });
    let iterable = users.search("name");
    let observed = Array.from(iterable).map((record) => record.record.user_id);
    let expected = ["User 1"];
    assert.equals(observed, expected);
});
wtf.test(`It should not return the same result twice when multiple indices match the query and the ranks are -1 and 0.`, async (assert) => {
    let blockManager = new blocks_1.BlockManager(new files_1.VirtualFile(0));
    let fields = {
        user_id: new records_1.StringField(""),
        firstname: new records_1.StringField(""),
        lastname: new records_1.StringField("")
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
    let indexOne = new stores_1.SearchIndexManager(recordManager, blockManager, "firstname");
    let indexTwo = new stores_1.SearchIndexManager(recordManager, blockManager, "lastname");
    let users = new stores_1.StoreManager(blockManager, fields, keys, {}, table, [], [indexOne, indexTwo]);
    users.insert({
        user_id: "User 1",
        firstname: "Name Additional",
        lastname: "Name"
    });
    let iterable = users.search("name");
    let observed = Array.from(iterable).map((record) => record.record.user_id);
    let expected = ["User 1"];
    assert.equals(observed, expected);
});
wtf.test(`It should not return the same result twice when multiple indices match the query and the ranks are 0 and -1.`, async (assert) => {
    let blockManager = new blocks_1.BlockManager(new files_1.VirtualFile(0));
    let fields = {
        user_id: new records_1.StringField(""),
        firstname: new records_1.StringField(""),
        lastname: new records_1.StringField("")
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
    let indexOne = new stores_1.SearchIndexManager(recordManager, blockManager, "firstname");
    let indexTwo = new stores_1.SearchIndexManager(recordManager, blockManager, "lastname");
    let users = new stores_1.StoreManager(blockManager, fields, keys, {}, table, [], [indexOne, indexTwo]);
    users.insert({
        user_id: "User 1",
        firstname: "Name",
        lastname: "Name Additional"
    });
    let iterable = users.search("name");
    let observed = Array.from(iterable).map((record) => record.record.user_id);
    let expected = ["User 1"];
    assert.equals(observed, expected);
});
wtf.test(`It should support filtering of the records stored when there is an index on the key.`, async (assert) => {
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
        key: "AA"
    });
    let iterable = users.filter({
        key: new filters_1.EqualityFilter("A")
    });
    let observed = Array.from(iterable).map((entry) => entry.key);
    let expected = ["A"];
    assert.equals(observed, expected);
});
function createUsersStore(indices) {
    let blockManager = new blocks_1.BlockManager(new files_1.VirtualFile(0));
    let users = stores_1.StoreManager.construct(blockManager, {
        fields: {
            key: new records_1.StringField(""),
            value: new records_1.IntegerField(0)
        },
        keys: ["key"],
        indices: indices
    });
    users.insert({
        key: "A",
        value: 2
    });
    users.insert({
        key: "B",
        value: 1
    });
    users.insert({
        key: "C",
        value: 5
    });
    users.insert({
        key: "D",
        value: 3
    });
    users.insert({
        key: "E",
        value: 4
    });
    return users;
}
;
const USERS_INDICES = [
    [],
    [
        // Not technically a valid index since key is missing meaning that only a single record may be stored for each distinct value.
        new stores_1.Index(["value"])
    ],
    [
        new stores_1.Index(["key"])
    ],
    [
        new stores_1.Index(["value", "key"])
    ],
    [
        new stores_1.Index(["key", "value"])
    ]
];
for (let indices of USERS_INDICES) {
    wtf.test(`It should support filtering the records in increasing key order using a greater than filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
        let users = createUsersStore(indices);
        let iterable = users.filter({
            value: new filters_1.GreaterThanFilter(1)
        }, {
            key: new orders_1.IncreasingOrder()
        });
        let observed = Array.from(iterable).map((entry) => entry.key);
        let expected = ["A", "C", "D", "E"];
        assert.equals(observed, expected);
    });
    wtf.test(`It should support anchored filtering of the records in increasing key order using a greater than filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
        let users = createUsersStore(indices);
        let iterable = users.filter({
            value: new filters_1.GreaterThanFilter(1)
        }, {
            key: new orders_1.IncreasingOrder()
        }, {
            key: "A"
        });
        let observed = Array.from(iterable).map((entry) => entry.key);
        let expected = ["C", "D", "E"];
        assert.equals(observed, expected);
    });
    wtf.test(`It should support filtering the records in increasing value order using a greater than filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
        let users = createUsersStore(indices);
        let iterable = users.filter({
            value: new filters_1.GreaterThanFilter(1)
        }, {
            value: new orders_1.IncreasingOrder()
        });
        let observed = Array.from(iterable).map((entry) => entry.key);
        let expected = ["A", "D", "E", "C"];
        assert.equals(observed, expected);
    });
    wtf.test(`It should support anchored filtering of the records in increasing value order using a greater than filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
        let users = createUsersStore(indices);
        let iterable = users.filter({
            value: new filters_1.GreaterThanFilter(1)
        }, {
            value: new orders_1.IncreasingOrder()
        }, {
            key: "A"
        });
        let observed = Array.from(iterable).map((entry) => entry.key);
        let expected = ["D", "E", "C"];
        assert.equals(observed, expected);
    });
    wtf.test(`It should support filtering the records in decreasing key order using a greater than filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
        let users = createUsersStore(indices);
        let iterable = users.filter({
            value: new filters_1.GreaterThanFilter(1)
        }, {
            key: new orders_1.DecreasingOrder()
        });
        let observed = Array.from(iterable).map((entry) => entry.key);
        let expected = ["E", "D", "C", "A"];
        assert.equals(observed, expected);
    });
    wtf.test(`It should support anchored filtering of the records in decreasing key order using a greater than filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
        let users = createUsersStore(indices);
        let iterable = users.filter({
            value: new filters_1.GreaterThanFilter(1)
        }, {
            key: new orders_1.DecreasingOrder()
        }, {
            key: "E"
        });
        let observed = Array.from(iterable).map((entry) => entry.key);
        let expected = ["D", "C", "A"];
        assert.equals(observed, expected);
    });
    wtf.test(`It should support filtering the records in decreasing value order using a greater than filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
        let users = createUsersStore(indices);
        let iterable = users.filter({
            value: new filters_1.GreaterThanFilter(1)
        }, {
            value: new orders_1.DecreasingOrder()
        });
        let observed = Array.from(iterable).map((entry) => entry.key);
        let expected = ["C", "E", "D", "A"];
        assert.equals(observed, expected);
    });
    wtf.test(`It should support anchored filtering of the records in decreasing value order using a greater than filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
        let users = createUsersStore(indices);
        let iterable = users.filter({
            value: new filters_1.GreaterThanFilter(1)
        }, {
            value: new orders_1.DecreasingOrder()
        }, {
            key: "C"
        });
        let observed = Array.from(iterable).map((entry) => entry.key);
        let expected = ["E", "D", "A"];
        assert.equals(observed, expected);
    });
    wtf.test(`It should support filtering the records in increasing key order using a greater than or equal filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
        let users = createUsersStore(indices);
        let iterable = users.filter({
            value: new filters_1.GreaterThanOrEqualFilter(2)
        }, {
            key: new orders_1.IncreasingOrder()
        });
        let observed = Array.from(iterable).map((entry) => entry.key);
        let expected = ["A", "C", "D", "E"];
        assert.equals(observed, expected);
    });
    wtf.test(`It should support anchored filtering of the records in increasing key order using a greater than or equal filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
        let users = createUsersStore(indices);
        let iterable = users.filter({
            value: new filters_1.GreaterThanOrEqualFilter(2)
        }, {
            key: new orders_1.IncreasingOrder()
        }, {
            key: "A"
        });
        let observed = Array.from(iterable).map((entry) => entry.key);
        let expected = ["C", "D", "E"];
        assert.equals(observed, expected);
    });
    wtf.test(`It should support filtering the records in increasing value order using a greater than or equal filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
        let users = createUsersStore(indices);
        let iterable = users.filter({
            value: new filters_1.GreaterThanOrEqualFilter(2)
        }, {
            value: new orders_1.IncreasingOrder()
        });
        let observed = Array.from(iterable).map((entry) => entry.key);
        let expected = ["A", "D", "E", "C"];
        assert.equals(observed, expected);
    });
    wtf.test(`It should support anchored filtering of the records in increasing value order using a greater than or equal filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
        let users = createUsersStore(indices);
        let iterable = users.filter({
            value: new filters_1.GreaterThanOrEqualFilter(2)
        }, {
            value: new orders_1.IncreasingOrder()
        }, {
            key: "A"
        });
        let observed = Array.from(iterable).map((entry) => entry.key);
        let expected = ["D", "E", "C"];
        assert.equals(observed, expected);
    });
    wtf.test(`It should support filtering the records in decreasing key order using a greater than or equal filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
        let users = createUsersStore(indices);
        let iterable = users.filter({
            value: new filters_1.GreaterThanOrEqualFilter(2)
        }, {
            key: new orders_1.DecreasingOrder()
        });
        let observed = Array.from(iterable).map((entry) => entry.key);
        let expected = ["E", "D", "C", "A"];
        assert.equals(observed, expected);
    });
    wtf.test(`It should support anchored filtering of the records in decreasing key order using a greater than or equal filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
        let users = createUsersStore(indices);
        let iterable = users.filter({
            value: new filters_1.GreaterThanOrEqualFilter(2)
        }, {
            key: new orders_1.DecreasingOrder()
        }, {
            key: "E"
        });
        let observed = Array.from(iterable).map((entry) => entry.key);
        let expected = ["D", "C", "A"];
        assert.equals(observed, expected);
    });
    wtf.test(`It should support filtering the records in decreasing value order using a greater than or equal filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
        let users = createUsersStore(indices);
        let iterable = users.filter({
            value: new filters_1.GreaterThanOrEqualFilter(2)
        }, {
            value: new orders_1.DecreasingOrder()
        });
        let observed = Array.from(iterable).map((entry) => entry.key);
        let expected = ["C", "E", "D", "A"];
        assert.equals(observed, expected);
    });
    wtf.test(`It should support anchored filtering of the records in decreasing value order using a greater than or equal filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
        let users = createUsersStore(indices);
        let iterable = users.filter({
            value: new filters_1.GreaterThanOrEqualFilter(2)
        }, {
            value: new orders_1.DecreasingOrder()
        }, {
            key: "C"
        });
        let observed = Array.from(iterable).map((entry) => entry.key);
        let expected = ["E", "D", "A"];
        assert.equals(observed, expected);
    });
    wtf.test(`It should support filtering the records in increasing key order using a less than filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
        let users = createUsersStore(indices);
        let iterable = users.filter({
            value: new filters_1.LessThanFilter(5)
        }, {
            key: new orders_1.IncreasingOrder()
        });
        let observed = Array.from(iterable).map((entry) => entry.key);
        let expected = ["A", "B", "D", "E"];
        assert.equals(observed, expected);
    });
    wtf.test(`It should support anchored filtering of the records in increasing key order using a less than filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
        let users = createUsersStore(indices);
        let iterable = users.filter({
            value: new filters_1.LessThanFilter(5)
        }, {
            key: new orders_1.IncreasingOrder()
        }, {
            key: "A"
        });
        let observed = Array.from(iterable).map((entry) => entry.key);
        let expected = ["B", "D", "E"];
        assert.equals(observed, expected);
    });
    wtf.test(`It should support filtering the records in increasing value order using a less than filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
        let users = createUsersStore(indices);
        let iterable = users.filter({
            value: new filters_1.LessThanFilter(5)
        }, {
            value: new orders_1.IncreasingOrder()
        });
        let observed = Array.from(iterable).map((entry) => entry.key);
        let expected = ["B", "A", "D", "E"];
        assert.equals(observed, expected);
    });
    wtf.test(`It should support anchored filtering of the records in increasing value order using a less than filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
        let users = createUsersStore(indices);
        let iterable = users.filter({
            value: new filters_1.LessThanFilter(5)
        }, {
            value: new orders_1.IncreasingOrder()
        }, {
            key: "B"
        });
        let observed = Array.from(iterable).map((entry) => entry.key);
        let expected = ["A", "D", "E"];
        assert.equals(observed, expected);
    });
    wtf.test(`It should support filtering the records in decreasing key order using a less than filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
        let users = createUsersStore(indices);
        let iterable = users.filter({
            value: new filters_1.LessThanFilter(5)
        }, {
            key: new orders_1.DecreasingOrder()
        });
        let observed = Array.from(iterable).map((entry) => entry.key);
        let expected = ["E", "D", "B", "A"];
        assert.equals(observed, expected);
    });
    wtf.test(`It should support anchored filtering of the records in decreasing key order using a less than filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
        let users = createUsersStore(indices);
        let iterable = users.filter({
            value: new filters_1.LessThanFilter(5)
        }, {
            key: new orders_1.DecreasingOrder()
        }, {
            key: "E"
        });
        let observed = Array.from(iterable).map((entry) => entry.key);
        let expected = ["D", "B", "A"];
        assert.equals(observed, expected);
    });
    wtf.test(`It should support filtering the records in decreasing value order using a less than filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
        let users = createUsersStore(indices);
        let iterable = users.filter({
            value: new filters_1.LessThanFilter(5)
        }, {
            value: new orders_1.DecreasingOrder()
        });
        let observed = Array.from(iterable).map((entry) => entry.key);
        let expected = ["E", "D", "A", "B"];
        assert.equals(observed, expected);
    });
    wtf.test(`It should support anchored filtering of the records in decreasing value order using a less than filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
        let users = createUsersStore(indices);
        let iterable = users.filter({
            value: new filters_1.LessThanFilter(5)
        }, {
            value: new orders_1.DecreasingOrder()
        }, {
            key: "E"
        });
        let observed = Array.from(iterable).map((entry) => entry.key);
        let expected = ["D", "A", "B"];
        assert.equals(observed, expected);
    });
    wtf.test(`It should support filtering the records in increasing key order using a less than or equal filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
        let users = createUsersStore(indices);
        let iterable = users.filter({
            value: new filters_1.LessThanOrEqualFilter(4)
        }, {
            key: new orders_1.IncreasingOrder()
        });
        let observed = Array.from(iterable).map((entry) => entry.key);
        let expected = ["A", "B", "D", "E"];
        assert.equals(observed, expected);
    });
    wtf.test(`It should support anchored filtering of the records in increasing key order using a less than or equal filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
        let users = createUsersStore(indices);
        let iterable = users.filter({
            value: new filters_1.LessThanOrEqualFilter(4)
        }, {
            key: new orders_1.IncreasingOrder()
        }, {
            key: "A"
        });
        let observed = Array.from(iterable).map((entry) => entry.key);
        let expected = ["B", "D", "E"];
        assert.equals(observed, expected);
    });
    wtf.test(`It should support filtering the records in increasing value order using a less than or equal filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
        let users = createUsersStore(indices);
        let iterable = users.filter({
            value: new filters_1.LessThanOrEqualFilter(4)
        }, {
            value: new orders_1.IncreasingOrder()
        });
        let observed = Array.from(iterable).map((entry) => entry.key);
        let expected = ["B", "A", "D", "E"];
        assert.equals(observed, expected);
    });
    wtf.test(`It should support anchored filtering of the records in increasing value order using a less than or equal filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
        let users = createUsersStore(indices);
        let iterable = users.filter({
            value: new filters_1.LessThanOrEqualFilter(4)
        }, {
            value: new orders_1.IncreasingOrder()
        }, {
            key: "B"
        });
        let observed = Array.from(iterable).map((entry) => entry.key);
        let expected = ["A", "D", "E"];
        assert.equals(observed, expected);
    });
    wtf.test(`It should support filtering the records in decreasing key order using a less than or equal filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
        let users = createUsersStore(indices);
        let iterable = users.filter({
            value: new filters_1.LessThanOrEqualFilter(4)
        }, {
            key: new orders_1.DecreasingOrder()
        });
        let observed = Array.from(iterable).map((entry) => entry.key);
        let expected = ["E", "D", "B", "A"];
        assert.equals(observed, expected);
    });
    wtf.test(`It should support anchored filtering of the records in decreasing key order using a less than or equal filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
        let users = createUsersStore(indices);
        let iterable = users.filter({
            value: new filters_1.LessThanOrEqualFilter(4)
        }, {
            key: new orders_1.DecreasingOrder()
        }, {
            key: "E"
        });
        let observed = Array.from(iterable).map((entry) => entry.key);
        let expected = ["D", "B", "A"];
        assert.equals(observed, expected);
    });
    wtf.test(`It should support filtering the records in decreasing value order using a less than or equal filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
        let users = createUsersStore(indices);
        let iterable = users.filter({
            value: new filters_1.LessThanOrEqualFilter(4)
        }, {
            value: new orders_1.DecreasingOrder()
        });
        let observed = Array.from(iterable).map((entry) => entry.key);
        let expected = ["E", "D", "A", "B"];
        assert.equals(observed, expected);
    });
    wtf.test(`It should support anchored filtering of the records in decreasing value order using a less than or equal filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
        let users = createUsersStore(indices);
        let iterable = users.filter({
            value: new filters_1.LessThanOrEqualFilter(4)
        }, {
            value: new orders_1.DecreasingOrder()
        }, {
            key: "E"
        });
        let observed = Array.from(iterable).map((entry) => entry.key);
        let expected = ["D", "A", "B"];
        assert.equals(observed, expected);
    });
}
function createUsersStoreWithBinaryValues(indices) {
    let blockManager = new blocks_1.BlockManager(new files_1.VirtualFile(0));
    let users = stores_1.StoreManager.construct(blockManager, {
        fields: {
            key: new records_1.StringField(""),
            value: new records_1.BinaryField(Uint8Array.of())
        },
        keys: ["key"],
        indices: indices
    });
    users.insert({
        key: "A",
        value: Uint8Array.of(1)
    });
    users.insert({
        key: "B",
        value: Uint8Array.of(0)
    });
    users.insert({
        key: "C",
        value: Uint8Array.of(4, 0)
    });
    users.insert({
        key: "D",
        value: Uint8Array.of(2, 0)
    });
    users.insert({
        key: "E",
        value: Uint8Array.of(3)
    });
    users.insert({
        key: "F",
        value: Uint8Array.of(4)
    });
    return users;
}
;
for (let indices of USERS_INDICES) {
    wtf.test(`It should support anchored filtering of the records in increasing value order using a less than or equal filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}`, async (assert) => {
        let users = createUsersStoreWithBinaryValues(indices);
        let iterable = users.filter({
            value: new filters_1.LessThanOrEqualFilter(Uint8Array.of(4))
        }, {
            value: new orders_1.IncreasingOrder()
        }, {
            key: "B"
        });
        let observed = Array.from(iterable).map((entry) => entry.key);
        let expected = ["A", "D", "E", "F"];
        assert.equals(observed, expected);
    });
    wtf.test(`It should support anchored filtering of the records in decreasing value order using a greater than or equal filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}`, async (assert) => {
        let users = createUsersStoreWithBinaryValues(indices);
        let iterable = users.filter({
            value: new filters_1.GreaterThanOrEqualFilter(Uint8Array.of(1))
        }, {
            value: new orders_1.DecreasingOrder()
        }, {
            key: "C"
        });
        let observed = Array.from(iterable).map((entry) => entry.key);
        let expected = ["F", "E", "D", "A"];
        assert.equals(observed, expected);
    });
}
