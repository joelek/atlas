import * as wtf from "@joelek/wtf";
import { VirtualFile } from "./files";
import { Link, LinkManager } from "./links";
import { DecreasingOrder, IncreasingOrder } from "./orders";
import { NullableStringField, StringField } from "./records";
import { Store, StoreManager } from "./stores";
import { BlockManager } from "./blocks";
import { Cache } from "./caches";

function createUsersAndPosts() {
	let blockManager = new BlockManager(new VirtualFile(0));
	let users = StoreManager.construct(blockManager, {
		fields: {
			user_id: new StringField("")
		},
		keys: ["user_id"]
	});
	let posts = StoreManager.construct(blockManager, {
		fields: {
			post_id: new StringField(""),
			post_user_id: new StringField("")
		},
		keys: ["post_id"]
	});
	return {
		users,
		posts
	};
};

wtf.test(`It should support filtering without explicit ordering for a referencing link.`, async (assert) => {
	let { users, posts } = { ...createUsersAndPosts() };
	let userPosts = LinkManager.construct(users, posts, {
		user_id: "post_user_id"
	});
	users.insert(new Cache(), {
		user_id: "User 1"
	});
	users.insert(new Cache(), {
		user_id: "User 2"
	});
	posts.insert(new Cache(), {
		post_id: "Post 1",
		post_user_id: "User 1"
	});
	posts.insert(new Cache(), {
		post_id: "Post 2",
		post_user_id: "User 1"
	});
	posts.insert(new Cache(), {
		post_id: "Post 3",
		post_user_id: "User 2"
	});
	let iterable = userPosts.filter(new Cache(), {
		user_id: "User 1"
	});
	let observed = Array.from(iterable).map((entry) => entry.post_id);
	let expected = ["Post 1", "Post 2"];
	assert.equals(observed, expected);
});

wtf.test(`It should support filtering with explicit ordering for a referencing link.`, async (assert) => {
	let { users, posts } = { ...createUsersAndPosts() };
	let userPosts = LinkManager.construct(users, posts, {
		user_id: "post_user_id"
	}, {
		post_id: new DecreasingOrder()
	});
	users.insert(new Cache(), {
		user_id: "User 1"
	});
	users.insert(new Cache(), {
		user_id: "User 2"
	});
	posts.insert(new Cache(), {
		post_id: "Post 1",
		post_user_id: "User 1"
	});
	posts.insert(new Cache(), {
		post_id: "Post 2",
		post_user_id: "User 1"
	});
	posts.insert(new Cache(), {
		post_id: "Post 3",
		post_user_id: "User 2"
	});
	let iterable = userPosts.filter(new Cache(), {
		user_id: "User 1"
	});
	let observed = Array.from(iterable).map((entry) => entry.post_id);
	let expected = ["Post 2", "Post 1"];
	assert.equals(observed, expected);
});

wtf.test(`It should support looking up the corresponding parent for a referencing link.`, async (assert) => {
	let { users, posts } = { ...createUsersAndPosts() };
	let userPosts = LinkManager.construct(users, posts, {
		user_id: "post_user_id"
	});
	users.insert(new Cache(), {
		user_id: "User 1"
	});
	posts.insert(new Cache(), {
		post_id: "Post 1",
		post_user_id: "User 1"
	});
	let observed = userPosts.lookup(new Cache(), {
		post_user_id: "User 1"
	}) as any;
	let expected = {
		user_id: "User 1"
	};
	assert.equals(observed, expected);
});

function createDirectories() {
	let blockManager = new BlockManager(new VirtualFile(0));
	let directories = StoreManager.construct(blockManager, {
		fields: {
			directory_id: new StringField(""),
			parent_directory_id: new NullableStringField(null)
		},
		keys: ["directory_id"]
	});
	return {
		directories
	};
};

wtf.test(`It should support filtering without explicit ordering for a self-referencing link.`, async (assert) => {
	let { directories } = { ...createDirectories() };
	let childDirectories = LinkManager.construct(directories, directories, {
		directory_id: "parent_directory_id"
	});
	directories.insert(new Cache(), {
		directory_id: "Directory 1",
		parent_directory_id: null
	});
	directories.insert(new Cache(), {
		directory_id: "Directory 2",
		parent_directory_id: "Directory 1"
	});
	directories.insert(new Cache(), {
		directory_id: "Directory 3",
		parent_directory_id: "Directory 1"
	});
	let iterable = childDirectories.filter(new Cache(), {
		directory_id: "Directory 1"
	});
	let observed = Array.from(iterable).map((entry) => entry.directory_id);
	let expected = ["Directory 2", "Directory 3"];
	assert.equals(observed, expected);
});

wtf.test(`It should support filtering with explicit ordering for a self-referencing link.`, async (assert) => {
	let { directories } = { ...createDirectories() };
	let childDirectories = LinkManager.construct(directories, directories, {
		directory_id: "parent_directory_id"
	}, {
		directory_id: new DecreasingOrder()
	});
	directories.insert(new Cache(), {
		directory_id: "Directory 1",
		parent_directory_id: null
	});
	directories.insert(new Cache(), {
		directory_id: "Directory 2",
		parent_directory_id: "Directory 1"
	});
	directories.insert(new Cache(), {
		directory_id: "Directory 3",
		parent_directory_id: "Directory 1"
	});
	let iterable = childDirectories.filter(new Cache(), {
		directory_id: "Directory 1"
	});
	let observed = Array.from(iterable).map((entry) => entry.directory_id);
	let expected = ["Directory 3", "Directory 2"];
	assert.equals(observed, expected);
});

wtf.test(`It should support looking up the corresponding parent for a self-referencing link.`, async (assert) => {
	let { directories } = { ...createDirectories() };
	let childDirectories = LinkManager.construct(directories, directories, {
		directory_id: "parent_directory_id"
	});
	directories.insert(new Cache(), {
		directory_id: "Directory 1",
		parent_directory_id: null
	});
	directories.insert(new Cache(), {
		directory_id: "Directory 2",
		parent_directory_id: "Directory 1"
	});
	let observed = childDirectories.lookup(new Cache(), {
		parent_directory_id: "Directory 1"
	}) as any;
	let expected = {
		directory_id: "Directory 1",
		parent_directory_id: null
	};
	assert.equals(observed, expected);
});

wtf.test(`It should support looking up absent parents for a self-referencing link.`, async (assert) => {
	let { directories } = { ...createDirectories() };
	let childDirectories = LinkManager.construct(directories, directories, {
		directory_id: "parent_directory_id"
	});
	directories.insert(new Cache(), {
		directory_id: "Directory 1",
		parent_directory_id: null
	});
	directories.insert(new Cache(), {
		directory_id: "Directory 2",
		parent_directory_id: "Directory 1"
	});
	let observed = childDirectories.lookup(new Cache(), {
		parent_directory_id: null
	});
	let expected = undefined;
	assert.equals(observed, expected);
});

wtf.test(`It should create the correct index for a referencing link without orders.`, async (assert) => {
	let users = new Store({
		user_id: new StringField(""),
		name: new StringField("")
	}, ["user_id"]);
	let posts = new Store({
		post_id: new StringField(""),
		post_user_id: new StringField(""),
		title: new StringField("")
	}, ["post_id"]);
	let userPosts = new Link(users, posts, {
		user_id: "post_user_id"
	}, {
		post_id: undefined,
		post_user_id: undefined,
		title: undefined
	});
	let index = userPosts.createIndex();
	let observed = index.keys;
	let expected = ["post_user_id", "post_id"];
	assert.equals(observed, expected);
});

wtf.test(`It should create the correct index for a referencing link with metadata field orders.`, async (assert) => {
	let users = new Store({
		user_id: new StringField(""),
		name: new StringField("")
	}, ["user_id"]);
	let posts = new Store({
		post_id: new StringField(""),
		post_user_id: new StringField(""),
		title: new StringField("")
	}, ["post_id"]);
	let userPosts = new Link(users, posts, {
		user_id: "post_user_id"
	}, {
		title: new IncreasingOrder()
	});
	let index = userPosts.createIndex();
	let observed = index.keys;
	let expected = ["post_user_id", "title", "post_id"];
	assert.equals(observed, expected);
});

wtf.test(`It should create the correct index for a referencing link with identifying field orders.`, async (assert) => {
	let users = new Store({
		user_id: new StringField(""),
		name: new StringField("")
	}, ["user_id"]);
	let posts = new Store({
		post_id: new StringField(""),
		post_user_id: new StringField(""),
		title: new StringField("")
	}, ["post_id"]);
	let userPosts = new Link(users, posts, {
		user_id: "post_user_id"
	}, {
		post_id: new IncreasingOrder(),
		post_user_id: new IncreasingOrder()
	});
	let index = userPosts.createIndex();
	let observed = index.keys;
	let expected = ["post_user_id", "post_id"];
	assert.equals(observed, expected);
});

wtf.test(`It should create the correct index for a self-referencing link without orders.`, async (assert) => {
	let directories = new Store({
		directory_id: new StringField(""),
		parent_directory_id: new NullableStringField(null),
		name: new StringField("")
	}, ["directory_id"]);
	let childDirectories = new Link(directories, directories, {
		directory_id: "parent_directory_id"
	}, {
		directory_id: undefined,
		parent_directory_id: undefined,
		name: undefined
	});
	let index = childDirectories.createIndex();
	let observed = index.keys;
	let expected = ["parent_directory_id", "directory_id"];
	assert.equals(observed, expected);
});

wtf.test(`It should create the correct index for a self-referencing link with metadata field orders.`, async (assert) => {
	let directories = new Store({
		directory_id: new StringField(""),
		parent_directory_id: new NullableStringField(null),
		name: new StringField("")
	}, ["directory_id"]);
	let childDirectories = new Link(directories, directories, {
		directory_id: "parent_directory_id"
	}, {
		name: new IncreasingOrder()
	});
	let index = childDirectories.createIndex();
	let observed = index.keys;
	let expected = ["parent_directory_id", "name", "directory_id"];
	assert.equals(observed, expected);
});

wtf.test(`It should create the correct index for a self-referencing link with identifying field orders.`, async (assert) => {
	let directories = new Store({
		directory_id: new StringField(""),
		parent_directory_id: new NullableStringField(null),
		name: new StringField("")
	}, ["directory_id"]);
	let childDirectories = new Link(directories, directories, {
		directory_id: "parent_directory_id"
	}, {
		directory_id: new IncreasingOrder(),
		parent_directory_id: new IncreasingOrder()
	});
	let index = childDirectories.createIndex();
	let observed = index.keys;
	let expected = ["parent_directory_id", "directory_id"];
	assert.equals(observed, expected);
});
