"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("./test");
const test_2 = require("./test");
const context_1 = require("./context");
(0, test_2.test)(`It should work.`, async (assert) => {
    let context = new context_1.Context();
    let users = context.createStore({
        user_id: context.createStringField(),
        name: context.createStringField(),
        age: context.createNumberField()
    }, ["user_id"], {
        name: context.createIncreasingOrder()
    });
    let posts = context.createStore({
        post_id: context.createStringField(),
        user_id: context.createStringField(),
        name: context.createStringField()
    }, ["post_id"]);
    let userPosts = context.createLink(users, posts, {
        user_id: "user_id"
    }, {
        name: context.createIncreasingOrder()
    });
    let query = context.createQuery(users, {
        name: context.createEqualityOperator(),
        age: context.createEqualityOperator()
    });
    let storage = context.createMemoryStorage();
    let manager = context.createTransactionManager(storage, {
        users,
        posts
    }, {
        userPosts
    });
    await (0, test_1.benchmark)(async () => {
        return manager.enqueueWritableTransaction(async ({ users }, { userPosts }) => {
            users.insert({
                user_id: "User 1",
                name: "Joel Ek",
                age: 38
            });
        });
    }, 1);
    let observed = await (0, test_1.benchmark)(async () => {
        return await manager.enqueueReadableTransaction(async ({ users }, { userPosts }) => {
            return users.lookup({
                user_id: "User 1"
            });
        });
    }, 10000);
    let expected = {
        user_id: "User 1",
        name: "Joel Ek",
        age: 38
    };
    assert.record.equals(observed, expected);
});
