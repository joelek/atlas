"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const blocks_1 = require("./blocks");
const files_1 = require("./files");
const operators_1 = require("./operators");
const orders_1 = require("./orders");
const queries_1 = require("./queries");
const records_1 = require("./records");
const stores_1 = require("./stores");
const test_1 = require("./test");
function createUsers() {
    let blockManager = new blocks_1.BlockManager(new files_1.VirtualFile(0));
    let users = stores_1.StoreManager.construct(blockManager, {
        fields: {
            key: new records_1.StringField(""),
            name: new records_1.StringField("")
        },
        keys: ["key"]
    });
    users.insert({
        key: "User 0",
        name: "A"
    });
    users.insert({
        key: "User 1",
        name: "A"
    });
    users.insert({
        key: "User 2",
        name: "B"
    });
    users.insert({
        key: "User 3",
        name: "B"
    });
    return {
        users
    };
}
;
(0, test_1.test)(`It should support filtering without explicit ordering.`, async (assert) => {
    let { users } = { ...createUsers() };
    let queryManager = new queries_1.QueryManager(users, {
        name: new operators_1.EqualityOperator()
    }, {});
    let iterable = queryManager.filter({
        name: "B"
    });
    let observed = Array.from(iterable).map((user) => user.record().key).sort();
    let expected = ["User 2", "User 3"];
    assert.array.equals(observed, expected);
});
(0, test_1.test)(`It should support filtering with explicit ordering.`, async (assert) => {
    let { users } = { ...createUsers() };
    let queryManager = new queries_1.QueryManager(users, {
        name: new operators_1.EqualityOperator()
    }, {
        key: new orders_1.IncreasingOrder()
    });
    let iterable = queryManager.filter({
        name: "B"
    });
    let observed = Array.from(iterable).map((user) => user.record().key);
    let expected = ["User 2", "User 3"];
    assert.array.equals(observed, expected);
});
