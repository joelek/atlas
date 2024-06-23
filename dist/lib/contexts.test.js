"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const wtf = require("@joelek/wtf");
const contexts_1 = require("./contexts");
wtf.test(`It should work.`, async (assert) => {
    let context = new contexts_1.Context();
    let users = context.createStore({
        user_id: context.createStringField(),
        name: context.createStringField(),
        age: context.createIntegerField()
    }, ["user_id"], {
        name: context.createIncreasingOrder()
    });
    let posts = context.createStore({
        post_id: context.createStringField(),
        user_id: context.createStringField(),
        title: context.createStringField(),
        user_age: context.createNullableIntegerField()
    }, ["post_id"]);
    let userPosts = context.createLink(users, posts, {
        user_id: "user_id"
    }, {
        title: context.createIncreasingOrder()
    }, {
        age: "user_age"
    });
    let query = context.createQuery(users, {
        name: context.createEqualityOperator(),
        age: context.createEqualityOperator()
    });
    let transactionManager = context.createTransactionManager("./private/atlas", {
        users,
        posts
    }, {
        userPosts
    }, {
        query
    });
    let { stores, links, queries } = { ...transactionManager };
    await transactionManager.enqueueWritableTransaction(async (queue) => {
        stores.users.insert(queue, {
            user_id: "User 1",
            name: "Joel Ek",
            age: 38
        });
        stores.posts.insert(queue, {
            post_id: "Post 1",
            user_id: "User 1",
            title: "Some title.",
            user_age: null
        });
    });
    let observed = await transactionManager.enqueueReadableTransaction(async (queue) => {
        let allUserPosts = await links.userPosts.filter(queue, {
            user_id: "User 1"
        });
        return stores.users.lookup(queue, {
            user_id: "User 1"
        });
    });
    let expected = {
        user_id: "User 1",
        name: "Joel Ek",
        age: 38
    };
    assert.equals(observed, expected);
});
