"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("./test");
const files_1 = require("./files");
const link_1 = require("./link");
const orders_1 = require("./orders");
const records_1 = require("./records");
const store_1 = require("./store");
const vfs_1 = require("./vfs");
function createUsersAndPosts() {
    let blockHandler = new vfs_1.BlockHandler(new files_1.VirtualFile(0));
    let users = store_1.StoreManager.construct(blockHandler, null, {
        fields: {
            user_id: new records_1.StringField("")
        },
        keys: ["user_id"],
        indices: []
    });
    let posts = store_1.StoreManager.construct(blockHandler, null, {
        fields: {
            post_id: new records_1.StringField(""),
            post_user_id: new records_1.StringField("")
        },
        keys: ["post_id"],
        indices: []
    });
    return {
        users,
        posts
    };
}
;
(0, test_1.test)(`It should support filtering without explicit ordering for a referencing link.`, async (assert) => {
    let { users, posts } = { ...createUsersAndPosts() };
    let userPosts = link_1.LinkManager.construct(users, posts, {
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
    let observed = Array.from(iterable).map((entry) => entry.record().post_id).sort();
    let expected = ["Post 1", "Post 2"];
    assert.array.equals(observed, expected);
});
(0, test_1.test)(`It should support filtering with explicit ordering for a referencing link.`, async (assert) => {
    let { users, posts } = { ...createUsersAndPosts() };
    let userPosts = link_1.LinkManager.construct(users, posts, {
        user_id: "post_user_id"
    }, {
        post_id: new orders_1.IncreasingOrder()
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
(0, test_1.test)(`It should support looking up the corresponding parent for a referencing link.`, async (assert) => {
    let { users, posts } = { ...createUsersAndPosts() };
    let userPosts = link_1.LinkManager.construct(users, posts, {
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
    let blockHandler = new vfs_1.BlockHandler(new files_1.VirtualFile(0));
    let directories = store_1.StoreManager.construct(blockHandler, null, {
        fields: {
            directory_id: new records_1.StringField(""),
            parent_directory_id: new records_1.NullableStringField(null)
        },
        keys: ["directory_id"],
        indices: []
    });
    return {
        directories
    };
}
;
(0, test_1.test)(`It should support filtering without explicit ordering for a self-referencing link.`, async (assert) => {
    let { directories } = { ...createDirectories() };
    let childDirectories = link_1.LinkManager.construct(directories, directories, {
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
    let observed = Array.from(iterable).map((entry) => entry.record().directory_id).sort();
    let expected = ["Directory 2", "Directory 3"];
    assert.array.equals(observed, expected);
});
(0, test_1.test)(`It should support filtering with explicit ordering for a self-referencing link.`, async (assert) => {
    let { directories } = { ...createDirectories() };
    let childDirectories = link_1.LinkManager.construct(directories, directories, {
        directory_id: "parent_directory_id"
    }, {
        directory_id: new orders_1.IncreasingOrder()
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
(0, test_1.test)(`It should support looking up the corresponding parent for a self-referencing link.`, async (assert) => {
    let { directories } = { ...createDirectories() };
    let childDirectories = link_1.LinkManager.construct(directories, directories, {
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
    let childDirectories = link_1.LinkManager.construct(directories, directories, {
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
