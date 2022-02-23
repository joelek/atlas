import { test } from "./test";
import { VirtualFile } from "./files";
import { LinkManager } from "./link";
import { IncreasingOrder } from "./orders";
import { NullableStringField, StringField } from "./records";
import { StoreManager } from "./store";
import { BlockHandler } from "./vfs";

function createUsersAndPosts() {
	let blockHandler = new BlockHandler(new VirtualFile(0));
	let users = StoreManager.construct(blockHandler, {
		fields: {
			user_id: new StringField("")
		},
		keys: ["user_id"]
	});
	let posts = StoreManager.construct(blockHandler, {
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

test(`It should support filtering without explicit ordering for a referencing link.`, async (assert) => {
	let { users, posts } = { ...createUsersAndPosts() };
	let userPosts = LinkManager.construct(users, posts, {
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

test(`It should support filtering with explicit ordering for a referencing link.`, async (assert) => {
	let { users, posts } = { ...createUsersAndPosts() };
	let userPosts = LinkManager.construct(users, posts, {
		user_id: "post_user_id"
	}, {
		post_id: new IncreasingOrder()
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

test(`It should support looking up the corresponding parent for a referencing link.`, async (assert) => {
	let { users, posts } = { ...createUsersAndPosts() };
	let userPosts = LinkManager.construct(users, posts, {
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
	}) as any;
	let expected = {
		user_id: "User 1"
	};
	assert.record.equals(observed, expected);
});

function createDirectories() {
	let blockHandler = new BlockHandler(new VirtualFile(0));
	let directories = StoreManager.construct(blockHandler, {
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

test(`It should support filtering without explicit ordering for a self-referencing link.`, async (assert) => {
	let { directories } = { ...createDirectories() };
	let childDirectories = LinkManager.construct(directories, directories, {
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

test(`It should support filtering with explicit ordering for a self-referencing link.`, async (assert) => {
	let { directories } = { ...createDirectories() };
	let childDirectories = LinkManager.construct(directories, directories, {
		directory_id: "parent_directory_id"
	}, {
		directory_id: new IncreasingOrder()
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

test(`It should support looking up the corresponding parent for a self-referencing link.`, async (assert) => {
	let { directories } = { ...createDirectories() };
	let childDirectories = LinkManager.construct(directories, directories, {
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
	}) as any;
	let expected = {
		directory_id: "Directory 1",
		parent_directory_id: null
	};
	assert.record.equals(observed, expected);
});

test(`It should support looking up absent parents for a self-referencing link.`, async (assert) => {
	let { directories } = { ...createDirectories() };
	let childDirectories = LinkManager.construct(directories, directories, {
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
