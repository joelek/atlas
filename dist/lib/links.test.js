"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("./test");
const files_1 = require("./files");
const links_1 = require("./links");
const orders_1 = require("./orders");
const records_1 = require("./records");
const stores_1 = require("./stores");
const blocks_1 = require("./blocks");
function createUsersAndPosts() {
    let blockManager = new blocks_1.BlockManager(new files_1.VirtualFile(0));
    let users = stores_1.StoreManager.construct(blockManager, {
        fields: {
            user_id: new records_1.StringField("")
        },
        keys: ["user_id"]
    });
    let posts = stores_1.StoreManager.construct(blockManager, {
        fields: {
            post_id: new records_1.StringField(""),
            post_user_id: new records_1.StringField("")
        },
        keys: ["post_id"]
    });
    return {
        users,
        posts
    };
}
;
(0, test_1.test)(`It should support filtering without explicit ordering for a referencing link.`, async (assert) => {
    let { users, posts } = { ...createUsersAndPosts() };
    let userPosts = links_1.LinkManager.construct(users, posts, {
        user_id: "post_user_id"
    });
    users.insert({
        user_id: "User 1"
    });
    users.insert({
        user_id: "User 2"
    });
    posts.insert({
        post_id: "Post 1",
        post_user_id: "User 1"
    });
    posts.insert({
        post_id: "Post 2",
        post_user_id: "User 1"
    });
    posts.insert({
        post_id: "Post 3",
        post_user_id: "User 2"
    });
    let iterable = userPosts.filter({
        user_id: "User 1"
    });
    let observed = Array.from(iterable).map((entry) => entry.record().post_id);
    let expected = ["Post 1", "Post 2"];
    assert.array.equals(observed, expected);
});
(0, test_1.test)(`It should support filtering with explicit ordering for a referencing link.`, async (assert) => {
    let { users, posts } = { ...createUsersAndPosts() };
    let userPosts = links_1.LinkManager.construct(users, posts, {
        user_id: "post_user_id"
    }, {
        post_id: new orders_1.DecreasingOrder()
    });
    users.insert({
        user_id: "User 1"
    });
    users.insert({
        user_id: "User 2"
    });
    posts.insert({
        post_id: "Post 1",
        post_user_id: "User 1"
    });
    posts.insert({
        post_id: "Post 2",
        post_user_id: "User 1"
    });
    posts.insert({
        post_id: "Post 3",
        post_user_id: "User 2"
    });
    let iterable = userPosts.filter({
        user_id: "User 1"
    });
    let observed = Array.from(iterable).map((entry) => entry.record().post_id);
    let expected = ["Post 2", "Post 1"];
    assert.array.equals(observed, expected);
});
(0, test_1.test)(`It should support looking up the corresponding parent for a referencing link.`, async (assert) => {
    let { users, posts } = { ...createUsersAndPosts() };
    let userPosts = links_1.LinkManager.construct(users, posts, {
        user_id: "post_user_id"
    });
    users.insert({
        user_id: "User 1"
    });
    posts.insert({
        post_id: "Post 1",
        post_user_id: "User 1"
    });
    let observed = userPosts.lookup({
        post_user_id: "User 1"
    });
    let expected = {
        user_id: "User 1"
    };
    assert.record.equals(observed, expected);
});
function createDirectories() {
    let blockManager = new blocks_1.BlockManager(new files_1.VirtualFile(0));
    let directories = stores_1.StoreManager.construct(blockManager, {
        fields: {
            directory_id: new records_1.StringField(""),
            parent_directory_id: new records_1.NullableStringField(null)
        },
        keys: ["directory_id"]
    });
    return {
        directories
    };
}
;
(0, test_1.test)(`It should support filtering without explicit ordering for a self-referencing link.`, async (assert) => {
    let { directories } = { ...createDirectories() };
    let childDirectories = links_1.LinkManager.construct(directories, directories, {
        directory_id: "parent_directory_id"
    });
    directories.insert({
        directory_id: "Directory 1",
        parent_directory_id: null
    });
    directories.insert({
        directory_id: "Directory 2",
        parent_directory_id: "Directory 1"
    });
    directories.insert({
        directory_id: "Directory 3",
        parent_directory_id: "Directory 1"
    });
    let iterable = childDirectories.filter({
        directory_id: "Directory 1"
    });
    let observed = Array.from(iterable).map((entry) => entry.record().directory_id);
    let expected = ["Directory 2", "Directory 3"];
    assert.array.equals(observed, expected);
});
(0, test_1.test)(`It should support filtering with explicit ordering for a self-referencing link.`, async (assert) => {
    let { directories } = { ...createDirectories() };
    let childDirectories = links_1.LinkManager.construct(directories, directories, {
        directory_id: "parent_directory_id"
    }, {
        directory_id: new orders_1.DecreasingOrder()
    });
    directories.insert({
        directory_id: "Directory 1",
        parent_directory_id: null
    });
    directories.insert({
        directory_id: "Directory 2",
        parent_directory_id: "Directory 1"
    });
    directories.insert({
        directory_id: "Directory 3",
        parent_directory_id: "Directory 1"
    });
    let iterable = childDirectories.filter({
        directory_id: "Directory 1"
    });
    let observed = Array.from(iterable).map((entry) => entry.record().directory_id);
    let expected = ["Directory 3", "Directory 2"];
    assert.array.equals(observed, expected);
});
(0, test_1.test)(`It should support looking up the corresponding parent for a self-referencing link.`, async (assert) => {
    let { directories } = { ...createDirectories() };
    let childDirectories = links_1.LinkManager.construct(directories, directories, {
        directory_id: "parent_directory_id"
    });
    directories.insert({
        directory_id: "Directory 1",
        parent_directory_id: null
    });
    directories.insert({
        directory_id: "Directory 2",
        parent_directory_id: "Directory 1"
    });
    let observed = childDirectories.lookup({
        parent_directory_id: "Directory 1"
    });
    let expected = {
        directory_id: "Directory 1",
        parent_directory_id: null
    };
    assert.record.equals(observed, expected);
});
(0, test_1.test)(`It should support looking up absent parents for a self-referencing link.`, async (assert) => {
    let { directories } = { ...createDirectories() };
    let childDirectories = links_1.LinkManager.construct(directories, directories, {
        directory_id: "parent_directory_id"
    });
    directories.insert({
        directory_id: "Directory 1",
        parent_directory_id: null
    });
    directories.insert({
        directory_id: "Directory 2",
        parent_directory_id: "Directory 1"
    });
    let observed = childDirectories.lookup({
        parent_directory_id: null
    });
    let expected = undefined;
    assert.true(observed === expected);
});
(0, test_1.test)(`It should create the correct index for a referencing link without orders.`, async (assert) => {
    let users = new stores_1.Store({
        user_id: new records_1.StringField(""),
        name: new records_1.StringField("")
    }, ["user_id"]);
    let posts = new stores_1.Store({
        post_id: new records_1.StringField(""),
        post_user_id: new records_1.StringField(""),
        title: new records_1.StringField("")
    }, ["post_id"]);
    let userPosts = new links_1.Link(users, posts, {
        user_id: "post_user_id"
    }, {
        post_id: undefined,
        post_user_id: undefined,
        title: undefined
    });
    let index = userPosts.createIndex();
    let observed = index.keys;
    let expected = ["post_user_id", "post_id"];
    assert.array.equals(observed, expected);
});
(0, test_1.test)(`It should create the correct index for a referencing link with metadata field orders.`, async (assert) => {
    let users = new stores_1.Store({
        user_id: new records_1.StringField(""),
        name: new records_1.StringField("")
    }, ["user_id"]);
    let posts = new stores_1.Store({
        post_id: new records_1.StringField(""),
        post_user_id: new records_1.StringField(""),
        title: new records_1.StringField("")
    }, ["post_id"]);
    let userPosts = new links_1.Link(users, posts, {
        user_id: "post_user_id"
    }, {
        title: new orders_1.IncreasingOrder()
    });
    let index = userPosts.createIndex();
    let observed = index.keys;
    let expected = ["post_user_id", "title", "post_id"];
    assert.array.equals(observed, expected);
});
(0, test_1.test)(`It should create the correct index for a referencing link with identifying field orders.`, async (assert) => {
    let users = new stores_1.Store({
        user_id: new records_1.StringField(""),
        name: new records_1.StringField("")
    }, ["user_id"]);
    let posts = new stores_1.Store({
        post_id: new records_1.StringField(""),
        post_user_id: new records_1.StringField(""),
        title: new records_1.StringField("")
    }, ["post_id"]);
    let userPosts = new links_1.Link(users, posts, {
        user_id: "post_user_id"
    }, {
        post_id: new orders_1.IncreasingOrder(),
        post_user_id: new orders_1.IncreasingOrder()
    });
    let index = userPosts.createIndex();
    let observed = index.keys;
    let expected = ["post_user_id", "post_id"];
    assert.array.equals(observed, expected);
});
(0, test_1.test)(`It should create the correct index for a self-referencing link without orders.`, async (assert) => {
    let directories = new stores_1.Store({
        directory_id: new records_1.StringField(""),
        parent_directory_id: new records_1.NullableStringField(null),
        name: new records_1.StringField("")
    }, ["directory_id"]);
    let childDirectories = new links_1.Link(directories, directories, {
        directory_id: "parent_directory_id"
    }, {
        directory_id: undefined,
        parent_directory_id: undefined,
        name: undefined
    });
    let index = childDirectories.createIndex();
    let observed = index.keys;
    let expected = ["parent_directory_id", "directory_id"];
    assert.array.equals(observed, expected);
});
(0, test_1.test)(`It should create the correct index for a self-referencing link with metadata field orders.`, async (assert) => {
    let directories = new stores_1.Store({
        directory_id: new records_1.StringField(""),
        parent_directory_id: new records_1.NullableStringField(null),
        name: new records_1.StringField("")
    }, ["directory_id"]);
    let childDirectories = new links_1.Link(directories, directories, {
        directory_id: "parent_directory_id"
    }, {
        name: new orders_1.IncreasingOrder()
    });
    let index = childDirectories.createIndex();
    let observed = index.keys;
    let expected = ["parent_directory_id", "name", "directory_id"];
    assert.array.equals(observed, expected);
});
(0, test_1.test)(`It should create the correct index for a self-referencing link with identifying field orders.`, async (assert) => {
    let directories = new stores_1.Store({
        directory_id: new records_1.StringField(""),
        parent_directory_id: new records_1.NullableStringField(null),
        name: new records_1.StringField("")
    }, ["directory_id"]);
    let childDirectories = new links_1.Link(directories, directories, {
        directory_id: "parent_directory_id"
    }, {
        directory_id: new orders_1.IncreasingOrder(),
        parent_directory_id: new orders_1.IncreasingOrder()
    });
    let index = childDirectories.createIndex();
    let observed = index.keys;
    let expected = ["parent_directory_id", "directory_id"];
    assert.array.equals(observed, expected);
});
