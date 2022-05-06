"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const wtf = require("@joelek/wtf");
const blocks_1 = require("./blocks");
const caches_1 = require("./caches");
const files_1 = require("./files");
const operators_1 = require("./operators");
const orders_1 = require("./orders");
const queries_1 = require("./queries");
const records_1 = require("./records");
const stores_1 = require("./stores");
function createUsers() {
    let blockManager = new blocks_1.BlockManager(new files_1.VirtualFile(0));
    let users = stores_1.StoreManager.construct(blockManager, {
        fields: {
            key: new records_1.StringField(""),
            name: new records_1.StringField("")
        },
        keys: ["key"]
    });
    users.insert(new caches_1.Cache(), {
        key: "User 0",
        name: "A"
    });
    users.insert(new caches_1.Cache(), {
        key: "User 1",
        name: "A"
    });
    users.insert(new caches_1.Cache(), {
        key: "User 2",
        name: "B"
    });
    users.insert(new caches_1.Cache(), {
        key: "User 3",
        name: "B"
    });
    return {
        users
    };
}
;
wtf.test(`It should support filtering without explicit ordering.`, async (assert) => {
    let { users } = { ...createUsers() };
    let queryManager = new queries_1.QueryManager(users, {
        name: new operators_1.EqualityOperator()
    }, {});
    let iterable = queryManager.filter(new caches_1.Cache(), {
        name: "B"
    });
    let observed = Array.from(iterable).map((user) => user.key);
    let expected = ["User 2", "User 3"];
    assert.equals(observed, expected);
});
wtf.test(`It should support filtering with explicit ordering.`, async (assert) => {
    let { users } = { ...createUsers() };
    let queryManager = new queries_1.QueryManager(users, {
        name: new operators_1.EqualityOperator()
    }, {
        key: new orders_1.DecreasingOrder()
    });
    let iterable = queryManager.filter(new caches_1.Cache(), {
        name: "B"
    });
    let observed = Array.from(iterable).map((user) => user.key);
    let expected = ["User 3", "User 2"];
    assert.equals(observed, expected);
});
wtf.test(`It should create the correct index for a query without orders.`, async (assert) => {
    let users = new stores_1.Store({
        user_id: new records_1.StringField(""),
        name: new records_1.StringField("")
    }, ["user_id"]);
    let query = new queries_1.Query(users, {
        name: new operators_1.EqualityOperator()
    }, {});
    let index = query.createIndex();
    let observed = index.keys;
    let expected = ["name", "user_id"];
    assert.equals(observed, expected);
});
wtf.test(`It should create the correct index for a query with metadata field orders.`, async (assert) => {
    let users = new stores_1.Store({
        user_id: new records_1.StringField(""),
        name: new records_1.StringField("")
    }, ["user_id"]);
    let query = new queries_1.Query(users, {
        name: new operators_1.EqualityOperator()
    }, {
        name: new orders_1.IncreasingOrder()
    });
    let index = query.createIndex();
    let observed = index.keys;
    let expected = ["name", "user_id"];
    assert.equals(observed, expected);
});
wtf.test(`It should create the correct index for a query with identifying field orders.`, async (assert) => {
    let users = new stores_1.Store({
        user_id: new records_1.StringField(""),
        name: new records_1.StringField("")
    }, ["user_id"]);
    let query = new queries_1.Query(users, {
        name: new operators_1.EqualityOperator()
    }, {
        user_id: new orders_1.IncreasingOrder()
    });
    let index = query.createIndex();
    let observed = index.keys;
    let expected = ["name", "user_id"];
    assert.equals(observed, expected);
});
