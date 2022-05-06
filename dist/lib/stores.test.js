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
const caches_1 = require("./caches");
wtf.test(`It should support for-of iteration of the records stored.`, async (assert) => {
    let blockManager = new blocks_1.BlockManager(new files_1.VirtualFile(0));
    let users = stores_1.StoreManager.construct(blockManager, {
        fields: {
            key: new records_1.StringField("")
        },
        keys: ["key"]
    });
    users.insert(new caches_1.Cache(), {
        key: "A"
    });
    users.insert(new caches_1.Cache(), {
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
    users.insert(new caches_1.Cache(), {
        key: "A"
    });
    users.insert(new caches_1.Cache(), {
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
    users.insert(new caches_1.Cache(), {
        key: "A"
    });
    users.insert(new caches_1.Cache(), {
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
    users.insert(new caches_1.Cache(), {
        key: "A"
    });
    users.insert(new caches_1.Cache(), {
        key: "B"
    });
    let iterable = users.filter(new caches_1.Cache(), {
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
    users.insert(new caches_1.Cache(), {
        key: "A"
    });
    users.insert(new caches_1.Cache(), {
        key: "B"
    });
    let iterable = users.filter(new caches_1.Cache(), {}, {
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
    users.insert(new caches_1.Cache(), {
        key: "A"
    });
    users.insert(new caches_1.Cache(), {
        key: "B"
    });
    let iterable = users.filter(new caches_1.Cache(), {}, {
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
    users.insert(new caches_1.Cache(), {
        key: "A"
    });
    users.insert(new caches_1.Cache(), {
        key: "B"
    });
    let iterable = users.filter(new caches_1.Cache(), {}, {
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
    users.insert(new caches_1.Cache(), {
        key: "A"
    });
    users.insert(new caches_1.Cache(), {
        key: "B"
    });
    let iterable = users.filter(new caches_1.Cache(), {}, {
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
    users.insert(new caches_1.Cache(), {
        key: "A",
        name: "One"
    });
    assert.equals(users.lookup(new caches_1.Cache(), { key: "A" }).name, "One");
    users.insert(new caches_1.Cache(), {
        key: "A",
        name: "Two"
    });
    assert.equals(users.lookup(new caches_1.Cache(), { key: "A" }).name, "Two");
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
    users.insert(new caches_1.Cache(), {
        key: "A",
        name: "One"
    });
    assert.equals(users.lookup(new caches_1.Cache(), { key: "A" }).name, "One");
});
wtf.test(`It should keep track of the number of records stored.`, async (assert) => {
    let blockManager = new blocks_1.BlockManager(new files_1.VirtualFile(0));
    let users = stores_1.StoreManager.construct(blockManager, {
        fields: {
            key: new records_1.StringField("")
        },
        keys: ["key"]
    });
    assert.equals(users.length(new caches_1.Cache()), 0);
    users.insert(new caches_1.Cache(), {
        key: "A"
    });
    assert.equals(users.length(new caches_1.Cache()), 1);
    users.insert(new caches_1.Cache(), {
        key: "B"
    });
    assert.equals(users.length(new caches_1.Cache()), 2);
    users.insert(new caches_1.Cache(), {
        key: "A"
    });
    assert.equals(users.length(new caches_1.Cache()), 2);
    users.remove(new caches_1.Cache(), {
        key: "B"
    });
    assert.equals(users.length(new caches_1.Cache()), 1);
    users.remove(new caches_1.Cache(), {
        key: "A"
    });
    assert.equals(users.length(new caches_1.Cache()), 0);
});
wtf.test(`It should support looking up records previously inserted.`, async (assert) => {
    let blockManager = new blocks_1.BlockManager(new files_1.VirtualFile(0));
    let users = stores_1.StoreManager.construct(blockManager, {
        fields: {
            key: new records_1.StringField("")
        },
        keys: ["key"]
    });
    users.insert(new caches_1.Cache(), {
        key: "A"
    });
    assert.equals(users.lookup(new caches_1.Cache(), { key: "A" }).key, "A");
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
        users.lookup(new caches_1.Cache(), {
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
    users.insert(new caches_1.Cache(), {
        key: "A"
    });
    assert.equals(users.lookup(new caches_1.Cache(), { key: "A" }).key, "A");
    users.remove(new caches_1.Cache(), {
        key: "A"
    });
    await assert.throws(async () => {
        users.lookup(new caches_1.Cache(), {
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
    users.remove(new caches_1.Cache(), {
        key: "A"
    });
    await assert.throws(async () => {
        users.lookup(new caches_1.Cache(), {
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
    users.update(new caches_1.Cache(), {
        key: "A",
        name: "One"
    });
    assert.equals(users.lookup(new caches_1.Cache(), { key: "A" }).name, "One");
    users.update(new caches_1.Cache(), {
        key: "A",
        name: "Two"
    });
    assert.equals(users.lookup(new caches_1.Cache(), { key: "A" }).name, "Two");
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
    users.update(new caches_1.Cache(), {
        key: "A",
        name: "One"
    });
    assert.equals(users.lookup(new caches_1.Cache(), { key: "A" }).name, "One");
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
    users.update(new caches_1.Cache(), {
        key: "A"
    });
    assert.equals(users.lookup(new caches_1.Cache(), { key: "A" }).name, "");
    users.update(new caches_1.Cache(), {
        key: "A",
        name: "Two"
    });
    assert.equals(users.lookup(new caches_1.Cache(), { key: "A" }).name, "Two");
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
    users.update(new caches_1.Cache(), {
        key: "A"
    });
    assert.equals(users.lookup(new caches_1.Cache(), { key: "A" }).name, "");
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
    users.insert(new caches_1.Cache(), {
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
    users.insert(new caches_1.Cache(), {
        user_id: "User 1",
        name: "Name 1"
    });
    users.insert(new caches_1.Cache(), {
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
    users.insert(new caches_1.Cache(), {
        user_id: "User 1",
        name: "Name 1"
    });
    users.remove(new caches_1.Cache(), {
        user_id: "User 1"
    });
    let observed = Array.from(index).map((record) => record.name);
    let expected = [];
    assert.equals(observed, expected);
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
    usersOne.insert(new caches_1.Cache(), {
        user_id: "User 1",
        name: "Name"
    });
    let indexTwo = new stores_1.IndexManager(recordManager, blockManager, ["name", "user_id"]);
    let usersTwo = new stores_1.StoreManager(blockManager, fields, keys, {}, table, [indexTwo], []);
    usersTwo.insert(new caches_1.Cache(), {
        user_id: "User 2",
        name: "Name"
    });
    let users = new stores_1.StoreManager(blockManager, fields, keys, {}, table, [indexOne, indexTwo], []);
    let iterable = users.filter(new caches_1.Cache(), {
        name: new filters_1.EqualityFilter("Name")
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
    usersOne.insert(new caches_1.Cache(), {
        user_id: "User 1",
        name: "Name"
    });
    let indexTwo = new stores_1.IndexManager(recordManager, blockManager, ["name", "user_id"]);
    let usersTwo = new stores_1.StoreManager(blockManager, fields, keys, {}, table, [indexTwo], []);
    usersTwo.insert(new caches_1.Cache(), {
        user_id: "User 2",
        name: "Name"
    });
    let users = new stores_1.StoreManager(blockManager, fields, keys, {}, table, [indexOne, indexTwo], []);
    let iterable = users.filter(new caches_1.Cache(), {
        name: new filters_1.EqualityFilter("Name")
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
    users.insert(new caches_1.Cache(), {
        key: "A"
    });
    users.insert(new caches_1.Cache(), {
        key: "B"
    });
    users.insert(new caches_1.Cache(), {
        key: "C"
    });
    users.insert(new caches_1.Cache(), {
        key: "D"
    });
    let iterable = users.filter(new caches_1.Cache(), {}, {
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
    users.insert(new caches_1.Cache(), {
        key: "A"
    });
    users.insert(new caches_1.Cache(), {
        key: "B"
    });
    users.insert(new caches_1.Cache(), {
        key: "C"
    });
    users.insert(new caches_1.Cache(), {
        key: "D"
    });
    let iterable = users.filter(new caches_1.Cache(), {}, {
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
    users.insert(new caches_1.Cache(), {
        key: "A"
    });
    users.insert(new caches_1.Cache(), {
        key: "B"
    });
    users.insert(new caches_1.Cache(), {
        key: "C"
    });
    users.insert(new caches_1.Cache(), {
        key: "D"
    });
    let iterable = users.filter(new caches_1.Cache(), {}, {
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
    users.insert(new caches_1.Cache(), {
        key: "A"
    });
    users.insert(new caches_1.Cache(), {
        key: "B"
    });
    users.insert(new caches_1.Cache(), {
        key: "C"
    });
    users.insert(new caches_1.Cache(), {
        key: "D"
    });
    let iterable = users.filter(new caches_1.Cache(), {}, {
        key: new orders_1.DecreasingOrder()
    }, {
        key: "C"
    });
    let observed = Array.from(iterable).map((entry) => entry.key);
    let expected = ["B", "A"];
    assert.equals(observed, expected);
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
        storeOne.insert(new caches_1.Cache(), {
            key
        });
        storeTwo.insert(new caches_1.Cache(), {
            key
        });
    }
    let averageOne = await (0, test_1.benchmark)(async () => {
        storeOne.filter(new caches_1.Cache(), undefined, undefined, undefined, 10);
    });
    let averageTwo = await (0, test_1.benchmark)(async () => {
        storeTwo.filter(new caches_1.Cache(), undefined, undefined, undefined, 10);
    });
    assert.equals(averageOne * 100 < averageTwo, true);
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
    users.insert(new caches_1.Cache(), record);
    assert.equals(Array.from(index).map((user) => user.user_id), ["User 1"]);
    index.remove(record);
    assert.equals(Array.from(index).map((user) => user.user_id), []);
    users.insert(new caches_1.Cache(), record);
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
    users.insert(new caches_1.Cache(), {
        key: "A"
    });
    users.insert(new caches_1.Cache(), {
        key: "B"
    });
    users.vacate(new caches_1.Cache());
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
    users.insert(new caches_1.Cache(), {
        user_id: "User 1",
        name: "Name 1"
    });
    let observed = Array.from(index).map((record) => record.record.name);
    let expected = ["Name 1"];
    assert.equals(observed, expected);
});
wtf.test(`It should update search indices on update.`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert(new caches_1.Cache(), {
        user_id: "User 1",
        name: "Name 1"
    });
    users.insert(new caches_1.Cache(), {
        user_id: "User 1",
        name: "Name 2"
    });
    let observed = Array.from(index).map((record) => record.record.name);
    let expected = ["Name 2"];
    assert.equals(observed, expected);
});
wtf.test(`It should update search indices on remove.`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert(new caches_1.Cache(), {
        user_id: "User 1",
        name: "Name 1"
    });
    users.remove(new caches_1.Cache(), {
        user_id: "User 1"
    });
    let observed = Array.from(index).map((record) => record.record.name);
    let expected = [];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Ek"] and query is "".`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert(new caches_1.Cache(), {
        user_id: "User 1",
        name: "Ek"
    });
    let observed = users.search(new caches_1.Cache(), "").map((record) => record.record.user_id);
    let expected = ["User 1"];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Ek"] and query is "e".`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert(new caches_1.Cache(), {
        user_id: "User 1",
        name: "Ek"
    });
    let observed = users.search(new caches_1.Cache(), "e").map((record) => record.record.user_id);
    let expected = ["User 1"];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Ek"] and query is "ek".`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert(new caches_1.Cache(), {
        user_id: "User 1",
        name: "Ek"
    });
    let observed = users.search(new caches_1.Cache(), "ek").map((record) => record.record.user_id);
    let expected = ["User 1"];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Ek"] and query is "eks".`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert(new caches_1.Cache(), {
        user_id: "User 1",
        name: "Ek"
    });
    let observed = users.search(new caches_1.Cache(), "eks").map((record) => record.record.user_id);
    let expected = [];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Joel Ek"] and query is "".`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert(new caches_1.Cache(), {
        user_id: "User 1",
        name: "Joel Ek"
    });
    let observed = users.search(new caches_1.Cache(), "").map((record) => record.record.user_id);
    let expected = ["User 1"];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Joel Ek"] and query is "e".`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert(new caches_1.Cache(), {
        user_id: "User 1",
        name: "Joel Ek"
    });
    let observed = users.search(new caches_1.Cache(), "e").map((record) => record.record.user_id);
    let expected = ["User 1"];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Joel Ek"] and query is "ek".`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert(new caches_1.Cache(), {
        user_id: "User 1",
        name: "Joel Ek"
    });
    let observed = users.search(new caches_1.Cache(), "ek").map((record) => record.record.user_id);
    let expected = ["User 1"];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Joel Ek"] and query is "eks".`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert(new caches_1.Cache(), {
        user_id: "User 1",
        name: "Joel Ek"
    });
    let observed = users.search(new caches_1.Cache(), "eks").map((record) => record.record.user_id);
    let expected = [];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Joel Ek"] and query is "joel".`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert(new caches_1.Cache(), {
        user_id: "User 1",
        name: "Joel Ek"
    });
    let observed = users.search(new caches_1.Cache(), "joel").map((record) => record.record.user_id);
    let expected = ["User 1"];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Joel Ek"] and query is "joel ek".`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert(new caches_1.Cache(), {
        user_id: "User 1",
        name: "Joel Ek"
    });
    let observed = users.search(new caches_1.Cache(), "joel ek").map((record) => record.record.user_id);
    let expected = ["User 1"];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Joel Ek"] and query is "ek joel".`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert(new caches_1.Cache(), {
        user_id: "User 1",
        name: "Joel Ek"
    });
    let observed = users.search(new caches_1.Cache(), "ek joel").map((record) => record.record.user_id);
    let expected = ["User 1"];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Joel Ek"] and query is "joel eks".`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert(new caches_1.Cache(), {
        user_id: "User 1",
        name: "Joel Ek"
    });
    let observed = users.search(new caches_1.Cache(), "joel eks").map((record) => record.record.user_id);
    let expected = [];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Joel Ek"] and query is "joels ek".`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert(new caches_1.Cache(), {
        user_id: "User 1",
        name: "Joel Ek"
    });
    let observed = users.search(new caches_1.Cache(), "joels ek").map((record) => record.record.user_id);
    let expected = [];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Joel A Z", "Joel Ek", "Joel A Z"] and query is "".`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert(new caches_1.Cache(), {
        user_id: "User 0",
        name: "Joel A Z"
    });
    users.insert(new caches_1.Cache(), {
        user_id: "User 1",
        name: "Joel Ek"
    });
    users.insert(new caches_1.Cache(), {
        user_id: "User 2",
        name: "Joel A Z"
    });
    let observed = users.search(new caches_1.Cache(), "").map((record) => record.record.user_id);
    let expected = ["User 0", "User 1", "User 2"];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Joel A Z", "Joel Ek", "Joel A Z"] and query is "e".`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert(new caches_1.Cache(), {
        user_id: "User 0",
        name: "Joel A Z"
    });
    users.insert(new caches_1.Cache(), {
        user_id: "User 1",
        name: "Joel Ek"
    });
    users.insert(new caches_1.Cache(), {
        user_id: "User 2",
        name: "Joel A Z"
    });
    let observed = users.search(new caches_1.Cache(), "e").map((record) => record.record.user_id);
    let expected = ["User 1"];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Joel A Z", "Joel Ek", "Joel A Z"] and query is "ek".`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert(new caches_1.Cache(), {
        user_id: "User 0",
        name: "Joel A Z"
    });
    users.insert(new caches_1.Cache(), {
        user_id: "User 1",
        name: "Joel Ek"
    });
    users.insert(new caches_1.Cache(), {
        user_id: "User 2",
        name: "Joel A Z"
    });
    let observed = users.search(new caches_1.Cache(), "ek").map((record) => record.record.user_id);
    let expected = ["User 1"];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Joel A Z", "Joel Ek", "Joel A Z"] and query is "eks".`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert(new caches_1.Cache(), {
        user_id: "User 0",
        name: "Joel A Z"
    });
    users.insert(new caches_1.Cache(), {
        user_id: "User 1",
        name: "Joel Ek"
    });
    users.insert(new caches_1.Cache(), {
        user_id: "User 2",
        name: "Joel A Z"
    });
    let observed = users.search(new caches_1.Cache(), "eks").map((record) => record.record.user_id);
    let expected = [];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Joel A Z", "Joel Ek", "Joel A Z"] and query is "joel".`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert(new caches_1.Cache(), {
        user_id: "User 0",
        name: "Joel A Z"
    });
    users.insert(new caches_1.Cache(), {
        user_id: "User 1",
        name: "Joel Ek"
    });
    users.insert(new caches_1.Cache(), {
        user_id: "User 2",
        name: "Joel A Z"
    });
    let observed = users.search(new caches_1.Cache(), "joel").map((record) => record.record.user_id);
    let expected = ["User 1", "User 0", "User 2"];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Joel A Z", "Joel Ek", "Joel A Z"] and query is "joel e".`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert(new caches_1.Cache(), {
        user_id: "User 0",
        name: "Joel A Z"
    });
    users.insert(new caches_1.Cache(), {
        user_id: "User 1",
        name: "Joel Ek"
    });
    users.insert(new caches_1.Cache(), {
        user_id: "User 2",
        name: "Joel A Z"
    });
    let observed = users.search(new caches_1.Cache(), "joel e").map((record) => record.record.user_id);
    let expected = ["User 1"];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Joel A Z", "Joel Ek", "Joel A Z"] and query is "joel ek".`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert(new caches_1.Cache(), {
        user_id: "User 0",
        name: "Joel A Z"
    });
    users.insert(new caches_1.Cache(), {
        user_id: "User 1",
        name: "Joel Ek"
    });
    users.insert(new caches_1.Cache(), {
        user_id: "User 2",
        name: "Joel A Z"
    });
    let observed = users.search(new caches_1.Cache(), "joel ek").map((record) => record.record.user_id);
    let expected = ["User 1"];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Joel A Z", "Joel Ek", "Joel A Z"] and query is "joel eks".`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert(new caches_1.Cache(), {
        user_id: "User 0",
        name: "Joel A Z"
    });
    users.insert(new caches_1.Cache(), {
        user_id: "User 1",
        name: "Joel Ek"
    });
    users.insert(new caches_1.Cache(), {
        user_id: "User 2",
        name: "Joel A Z"
    });
    let observed = users.search(new caches_1.Cache(), "joel eks").map((record) => record.record.user_id);
    let expected = [];
    assert.equals(observed, expected);
});
wtf.test(`It should support anchored searches.`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert(new caches_1.Cache(), {
        user_id: "User 0",
        name: "A"
    });
    users.insert(new caches_1.Cache(), {
        user_id: "User 1",
        name: "B"
    });
    users.insert(new caches_1.Cache(), {
        user_id: "User 2",
        name: "C"
    });
    let observed = users.search(new caches_1.Cache(), "", { user_id: "User 1" }).map((record) => record.record.user_id);
    let expected = ["User 2"];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Aa Ab", "Aa"] and query is "a"`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert(new caches_1.Cache(), {
        user_id: "User 0",
        name: "Aa Ab"
    });
    users.insert(new caches_1.Cache(), {
        user_id: "User 1",
        name: "Aa"
    });
    let observed = users.search(new caches_1.Cache(), "a").map((record) => record.record.user_id);
    let expected = ["User 1", "User 0"];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Aa Az", "Aa"] and query is "a"`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert(new caches_1.Cache(), {
        user_id: "User 0",
        name: "Aa Az"
    });
    users.insert(new caches_1.Cache(), {
        user_id: "User 1",
        name: "Aa"
    });
    let observed = users.search(new caches_1.Cache(), "a").map((record) => record.record.user_id);
    let expected = ["User 1", "User 0"];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Aa Ab", "Ab"] and query is "a"`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert(new caches_1.Cache(), {
        user_id: "User 0",
        name: "Aa Ab"
    });
    users.insert(new caches_1.Cache(), {
        user_id: "User 1",
        name: "Ab"
    });
    let observed = users.search(new caches_1.Cache(), "a").map((record) => record.record.user_id);
    let expected = ["User 1", "User 0"];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Aa Az", "Ab"] and query is "a"`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert(new caches_1.Cache(), {
        user_id: "User 0",
        name: "Aa Az"
    });
    users.insert(new caches_1.Cache(), {
        user_id: "User 1",
        name: "Ab"
    });
    let observed = users.search(new caches_1.Cache(), "a").map((record) => record.record.user_id);
    let expected = ["User 1", "User 0"];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Aa Ab", "Az"] and query is "a"`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert(new caches_1.Cache(), {
        user_id: "User 0",
        name: "Aa Ab"
    });
    users.insert(new caches_1.Cache(), {
        user_id: "User 1",
        name: "Az"
    });
    let observed = users.search(new caches_1.Cache(), "a").map((record) => record.record.user_id);
    let expected = ["User 1", "User 0"];
    assert.equals(observed, expected);
});
wtf.test(`It should return the correct search results when names are ["Aa Az", "Az"] and query is "a"`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert(new caches_1.Cache(), {
        user_id: "User 0",
        name: "Aa Az"
    });
    users.insert(new caches_1.Cache(), {
        user_id: "User 1",
        name: "Az"
    });
    let observed = users.search(new caches_1.Cache(), "a").map((record) => record.record.user_id);
    let expected = ["User 1", "User 0"];
    assert.equals(observed, expected);
});
wtf.test(`It should not skip the entire category branch when the first candidate occurs before the first result in the same category.`, async (assert) => {
    let { users, index } = { ...makeUsersSearchIndex() };
    users.insert(new caches_1.Cache(), {
        user_id: "User 0",
        name: "a c"
    });
    users.insert(new caches_1.Cache(), {
        user_id: "User 1",
        name: "a b"
    });
    users.insert(new caches_1.Cache(), {
        user_id: "User 2",
        name: "a c"
    });
    let observed = users.search(new caches_1.Cache(), "b").map((record) => record.record.user_id);
    let expected = ["User 1"];
    assert.equals(observed, expected);
});
/*
wtf.test(`It should not return the same result twice when multiple indices match the query.`, async (assert) => {
    let blockManager = new BlockManager(new VirtualFile(0));
    let fields = {
        user_id: new StringField(""),
        firstname: new StringField(""),
        lastname: new StringField("")
    };
    let keys = ["user_id"] as ["user_id"];
    let recordManager = new RecordManager(fields);
    let table = new Table(blockManager, {
        getKeyFromValue: (value) => {
            let buffer = blockManager.readBlock(value);
            let record = recordManager.decode(buffer);
            return recordManager.encodeKeys(keys, record);
        }
    });
    let indexOne = new SearchIndexManager(recordManager, blockManager, "firstname");
    let indexTwo = new SearchIndexManager(recordManager, blockManager, "lastname");
    let users = new StoreManager(blockManager, fields, keys, {}, table, [], [indexOne, indexTwo]);
    users.insert(new Cache(), {
        user_id: "User 1",
        firstname: "Name",
        lastname: "Name"
    });
    let iterable = users.search(new Cache(), "name");
    let observed = Array.from(iterable).map((record) => record.record.user_id);
    let expected = ["User 1"] as Array<string>;
    assert.equals(observed, expected);
});
 */
