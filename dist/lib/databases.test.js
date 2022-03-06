"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("./test");
const records_1 = require("./records");
const databases_1 = require("./databases");
const blocks_1 = require("./blocks");
const files_1 = require("./files");
const stores_1 = require("./stores");
const links_1 = require("./links");
function createUsersPostsAndComments() {
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
    let comments = stores_1.StoreManager.construct(blockManager, {
        fields: {
            comment_id: new records_1.StringField(""),
            comment_user_id: new records_1.StringField(""),
            comment_post_id: new records_1.StringField("")
        },
        keys: ["comment_id"]
    });
    let userPosts = links_1.LinkManager.construct(users, posts, {
        user_id: "post_user_id"
    });
    let postComments = links_1.LinkManager.construct(posts, comments, {
        post_id: "comment_post_id"
    });
    let userComments = links_1.LinkManager.construct(users, comments, {
        user_id: "comment_user_id"
    });
    let consistencyManager = new databases_1.DatabaseManager({
        users,
        posts,
        comments
    }, {
        userPosts,
        postComments,
        userComments
    }, {});
    return {
        storeManagers: {
            users,
            posts,
            comments
        },
        writableStores: consistencyManager.createWritableStores()
    };
}
;
(0, test_1.test)(`It should support inserting records for referencing links.`, async (assert) => {
    let { storeManagers, writableStores } = createUsersPostsAndComments();
    await writableStores.users.insert({
        user_id: "User 0"
    });
    assert.array.equals(Array.from(storeManagers.users).map((record) => record.record().user_id).sort(), ["User 0"]);
});
(0, test_1.test)(`It should prevent inserting orphaned records for referencing links.`, async (assert) => {
    let { storeManagers, writableStores } = createUsersPostsAndComments();
    await assert.throws(async () => {
        await writableStores.posts.insert({
            post_id: "Post 0",
            post_user_id: "User 0"
        });
    });
});
(0, test_1.test)(`It should remove orphaned child records for referencing links.`, async (assert) => {
    let { storeManagers, writableStores } = createUsersPostsAndComments();
    storeManagers.users.insert({
        user_id: "User 0"
    });
    storeManagers.posts.insert({
        post_id: "Post 0",
        post_user_id: "User 0"
    });
    await writableStores.users.remove({
        user_id: "User 0"
    });
    assert.array.equals(Array.from(storeManagers.users).map((record) => record.record().user_id).sort(), []);
    assert.array.equals(Array.from(storeManagers.posts).map((record) => record.record().post_id).sort(), []);
});
(0, test_1.test)(`It should remove orphaned grandchild records for referencing links.`, async (assert) => {
    let { storeManagers, writableStores } = createUsersPostsAndComments();
    storeManagers.users.insert({
        user_id: "User 0"
    });
    storeManagers.posts.insert({
        post_id: "Post 0",
        post_user_id: "User 0"
    });
    storeManagers.comments.insert({
        comment_id: "Comment 0",
        comment_post_id: "Post 0",
        comment_user_id: "User 0"
    });
    await writableStores.users.remove({
        user_id: "User 0"
    });
    assert.array.equals(Array.from(storeManagers.users).map((record) => record.record().user_id).sort(), []);
    assert.array.equals(Array.from(storeManagers.posts).map((record) => record.record().post_id).sort(), []);
    assert.array.equals(Array.from(storeManagers.comments).map((record) => record.record().comment_id).sort(), []);
});
(0, test_1.test)(`It should not remove records with parents for referencing links.`, async (assert) => {
    let { storeManagers, writableStores } = createUsersPostsAndComments();
    storeManagers.users.insert({
        user_id: "User 0"
    });
    storeManagers.posts.insert({
        post_id: "Post 0",
        post_user_id: "User 0"
    });
    storeManagers.comments.insert({
        comment_id: "Comment 0",
        comment_post_id: "Post 0",
        comment_user_id: "User 0"
    });
    await writableStores.posts.remove({
        post_id: "Post 0"
    });
    assert.array.equals(Array.from(storeManagers.users).map((record) => record.record().user_id).sort(), ["User 0"]);
    assert.array.equals(Array.from(storeManagers.posts).map((record) => record.record().post_id).sort(), []);
    assert.array.equals(Array.from(storeManagers.comments).map((record) => record.record().comment_id).sort(), []);
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
    let childDirectories = links_1.LinkManager.construct(directories, directories, {
        directory_id: "parent_directory_id"
    });
    let consistencyManager = new databases_1.DatabaseManager({
        directories
    }, {
        childDirectories
    }, {});
    return {
        storeManagers: {
            directories
        },
        consistencyManager,
        writableStores: consistencyManager.createWritableStores()
    };
}
;
(0, test_1.test)(`It should support inserting records for self-referencing links.`, async (assert) => {
    let { storeManagers, writableStores } = createDirectories();
    await writableStores.directories.insert({
        directory_id: "Directory 0",
        parent_directory_id: null
    });
    assert.array.equals(Array.from(storeManagers.directories).map((record) => record.record().directory_id).sort(), ["Directory 0"]);
});
(0, test_1.test)(`It should prevent inserting orphaned records for self-referencing links.`, async (assert) => {
    let { storeManagers, writableStores } = createDirectories();
    await assert.throws(async () => {
        await writableStores.directories.insert({
            directory_id: "Directory 1",
            parent_directory_id: "Directory 0"
        });
    });
});
(0, test_1.test)(`It should remove orphaned child records for self-referencing links.`, async (assert) => {
    let { storeManagers, writableStores } = createDirectories();
    storeManagers.directories.insert({
        directory_id: "Directory 0",
        parent_directory_id: null
    });
    storeManagers.directories.insert({
        directory_id: "Directory 1",
        parent_directory_id: "Directory 0"
    });
    await writableStores.directories.remove({
        directory_id: "Directory 0"
    });
    assert.array.equals(Array.from(storeManagers.directories).map((record) => record.record().directory_id).sort(), []);
});
(0, test_1.test)(`It should remove orphaned grandchild records for self-referencing links.`, async (assert) => {
    let { storeManagers, writableStores } = createDirectories();
    storeManagers.directories.insert({
        directory_id: "Directory 0",
        parent_directory_id: null
    });
    storeManagers.directories.insert({
        directory_id: "Directory 1",
        parent_directory_id: "Directory 0"
    });
    storeManagers.directories.insert({
        directory_id: "Directory 2",
        parent_directory_id: "Directory 1"
    });
    await writableStores.directories.remove({
        directory_id: "Directory 0"
    });
    assert.array.equals(Array.from(storeManagers.directories).map((record) => record.record().directory_id).sort(), []);
});
(0, test_1.test)(`It should not remove records with parents for self-referencing links.`, async (assert) => {
    let { storeManagers, writableStores } = createDirectories();
    storeManagers.directories.insert({
        directory_id: "Directory 0",
        parent_directory_id: null
    });
    storeManagers.directories.insert({
        directory_id: "Directory 1",
        parent_directory_id: "Directory 0"
    });
    storeManagers.directories.insert({
        directory_id: "Directory 2",
        parent_directory_id: "Directory 1"
    });
    await writableStores.directories.remove({
        directory_id: "Directory 1"
    });
    assert.array.equals(Array.from(storeManagers.directories).map((record) => record.record().directory_id).sort(), ["Directory 0"]);
});
(0, test_1.test)(`It should support enforcing link consistency for self-referencing links when there is an orphaned chain link.`, async (assert) => {
    let { storeManagers, consistencyManager, writableStores } = createDirectories();
    storeManagers.directories.insert({
        directory_id: "Directory 1",
        parent_directory_id: "Directory 0"
    });
    storeManagers.directories.insert({
        directory_id: "Directory 2",
        parent_directory_id: "Directory 1"
    });
    consistencyManager.enforceLinkConsistency(["childDirectories"]);
    assert.array.equals(Array.from(storeManagers.directories).map((record) => record.record().directory_id).sort(), []);
});
(0, test_1.test)(`It should support enforcing link consistency for self-referencing links when there is a cyclical link.`, async (assert) => {
    let { storeManagers, consistencyManager, writableStores } = createDirectories();
    storeManagers.directories.insert({
        directory_id: "Directory 0",
        parent_directory_id: "Directory 1"
    });
    storeManagers.directories.insert({
        directory_id: "Directory 1",
        parent_directory_id: "Directory 0"
    });
    consistencyManager.enforceLinkConsistency(["childDirectories"]);
    assert.array.equals(Array.from(storeManagers.directories).map((record) => record.record().directory_id).sort(), ["Directory 0", "Directory 1"]);
});
(0, test_1.test)(`It should support enforcing link consistency for self-referencing links when there is a chain link.`, async (assert) => {
    let { storeManagers, consistencyManager, writableStores } = createDirectories();
    storeManagers.directories.insert({
        directory_id: "Directory 0",
        parent_directory_id: null
    });
    storeManagers.directories.insert({
        directory_id: "Directory 1",
        parent_directory_id: "Directory 0"
    });
    consistencyManager.enforceLinkConsistency(["childDirectories"]);
    assert.array.equals(Array.from(storeManagers.directories).map((record) => record.record().directory_id).sort(), ["Directory 0", "Directory 1"]);
});
(0, test_1.test)(`It should support enforcing store consistency for self-referencing links when there is an orphaned chain link.`, async (assert) => {
    let { storeManagers, consistencyManager, writableStores } = createDirectories();
    storeManagers.directories.insert({
        directory_id: "Directory 1",
        parent_directory_id: "Directory 0"
    });
    storeManagers.directories.insert({
        directory_id: "Directory 2",
        parent_directory_id: "Directory 1"
    });
    consistencyManager.enforceStoreConsistency(["directories"]);
    assert.array.equals(Array.from(storeManagers.directories).map((record) => record.record().directory_id).sort(), []);
});
(0, test_1.test)(`It should support enforcing store consistency for self-referencing links when there is a cyclical link.`, async (assert) => {
    let { storeManagers, consistencyManager, writableStores } = createDirectories();
    storeManagers.directories.insert({
        directory_id: "Directory 0",
        parent_directory_id: "Directory 1"
    });
    storeManagers.directories.insert({
        directory_id: "Directory 1",
        parent_directory_id: "Directory 0"
    });
    consistencyManager.enforceStoreConsistency(["directories"]);
    assert.array.equals(Array.from(storeManagers.directories).map((record) => record.record().directory_id).sort(), ["Directory 0", "Directory 1"]);
});
(0, test_1.test)(`It should support enforcing store consistency for self-referencing links when there is a chain link.`, async (assert) => {
    let { storeManagers, consistencyManager, writableStores } = createDirectories();
    storeManagers.directories.insert({
        directory_id: "Directory 0",
        parent_directory_id: null
    });
    storeManagers.directories.insert({
        directory_id: "Directory 1",
        parent_directory_id: "Directory 0"
    });
    consistencyManager.enforceStoreConsistency(["directories"]);
    assert.array.equals(Array.from(storeManagers.directories).map((record) => record.record().directory_id).sort(), ["Directory 0", "Directory 1"]);
});