import { test } from "./test";
import { StringField, NullableStringField } from "./records";
import { DatabaseManager } from "./databases";
import { BlockManager } from "./blocks";
import { VirtualFile } from "./files";
import { StoreManager } from "./stores";
import { LinkManager } from "./links";

function createUsersPostsAndComments() {
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
	let comments = StoreManager.construct(blockManager, {
		fields: {
			comment_id: new StringField(""),
			comment_user_id: new StringField(""),
			comment_post_id: new StringField("")
		},
		keys: ["comment_id"]
	});
	let metas = StoreManager.construct(blockManager, {
		fields: {
			meta_id: new StringField(""),
			meta_user_id: new NullableStringField(null)
		},
		keys: ["meta_id"]
	});
	let userPosts = LinkManager.construct(users, posts, {
		user_id: "post_user_id"
	});
	let postComments = LinkManager.construct(posts, comments, {
		post_id: "comment_post_id"
	});
	let userComments = LinkManager.construct(users, comments, {
		user_id: "comment_user_id"
	});
	let userMetas = LinkManager.construct(users, metas, {
		user_id: "meta_user_id"
	});
	let databaseManager = new DatabaseManager({
		users,
		posts,
		comments,
		metas
	}, {
		userPosts,
		postComments,
		userComments,
		userMetas
	}, {});
	return {
		storeManagers: {
			users,
			posts,
			comments,
			metas
		},
		storeInterfaces: databaseManager.createStoreInterfaces()
	};
};

test(`It should support vacating records for referencing links.`, async (assert) => {
	let { storeManagers, storeInterfaces } = createUsersPostsAndComments();
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
	storeManagers.metas.insert({
		meta_id: "Meta 0",
		meta_user_id: null
	});
	storeManagers.metas.insert({
		meta_id: "Meta 1",
		meta_user_id: "User 0"
	});
	await storeInterfaces.users.vacate();
	assert.array.equals(Array.from(storeManagers.users).map((record) => record.user_id), []);
	assert.array.equals(Array.from(storeManagers.posts).map((record) => record.post_id), []);
	assert.array.equals(Array.from(storeManagers.comments).map((record) => record.comment_id), []);
	assert.array.equals(Array.from(storeManagers.metas).map((record) => record.meta_id), ["Meta 0"]);
});

test(`It should support inserting records for referencing links.`, async (assert) => {
	let { storeManagers, storeInterfaces } = createUsersPostsAndComments();
	await storeInterfaces.users.insert({
		user_id: "User 0"
	});
	assert.array.equals(Array.from(storeManagers.users).map((record) => record.user_id), ["User 0"]);
});

test(`It should prevent inserting orphaned records for referencing links.`, async (assert) => {
	let { storeManagers, storeInterfaces } = createUsersPostsAndComments();
	await assert.throws(async () => {
		await storeInterfaces.posts.insert({
			post_id: "Post 0",
			post_user_id: "User 0"
		});
	});
});

test(`It should remove orphaned child records for referencing links.`, async (assert) => {
	let { storeManagers, storeInterfaces } = createUsersPostsAndComments();
	storeManagers.users.insert({
		user_id: "User 0"
	});
	storeManagers.posts.insert({
		post_id: "Post 0",
		post_user_id: "User 0"
	});
	await storeInterfaces.users.remove({
		user_id: "User 0"
	});
	assert.array.equals(Array.from(storeManagers.users).map((record) => record.user_id), []);
	assert.array.equals(Array.from(storeManagers.posts).map((record) => record.post_id), []);
});

test(`It should remove orphaned grandchild records for referencing links.`, async (assert) => {
	let { storeManagers, storeInterfaces } = createUsersPostsAndComments();
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
	await storeInterfaces.users.remove({
		user_id: "User 0"
	});
	assert.array.equals(Array.from(storeManagers.users).map((record) => record.user_id), []);
	assert.array.equals(Array.from(storeManagers.posts).map((record) => record.post_id), []);
	assert.array.equals(Array.from(storeManagers.comments).map((record) => record.comment_id), []);
});

test(`It should not remove records with parents for referencing links.`, async (assert) => {
	let { storeManagers, storeInterfaces } = createUsersPostsAndComments();
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
	await storeInterfaces.posts.remove({
		post_id: "Post 0"
	});
	assert.array.equals(Array.from(storeManagers.users).map((record) => record.user_id), ["User 0"]);
	assert.array.equals(Array.from(storeManagers.posts).map((record) => record.post_id), []);
	assert.array.equals(Array.from(storeManagers.comments).map((record) => record.comment_id), []);
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
	let childDirectories = LinkManager.construct(directories, directories, {
		directory_id: "parent_directory_id"
	});
	let databaseManager = new DatabaseManager({
		directories
	}, {
		childDirectories
	}, {});
	return {
		storeManagers: {
			directories
		},
		databaseManager: databaseManager,
		storeInterfaces: databaseManager.createStoreInterfaces()
	};
};

test(`It should support vacating records for self-referencing links.`, async (assert) => {
	let { storeManagers, storeInterfaces } = createDirectories();
	await storeInterfaces.directories.insert({
		directory_id: "Directory 0",
		parent_directory_id: null
	});
	await storeInterfaces.directories.insert({
		directory_id: "Directory 1",
		parent_directory_id: "Directory 0"
	});
	await storeInterfaces.directories.vacate();
	assert.array.equals(Array.from(storeManagers.directories).map((record) => record.directory_id), []);
});

test(`It should support inserting records for self-referencing links.`, async (assert) => {
	let { storeManagers, storeInterfaces } = createDirectories();
	await storeInterfaces.directories.insert({
		directory_id: "Directory 0",
		parent_directory_id: null
	});
	assert.array.equals(Array.from(storeManagers.directories).map((record) => record.directory_id), ["Directory 0"]);
});

test(`It should prevent inserting orphaned records for self-referencing links.`, async (assert) => {
	let { storeManagers, storeInterfaces } = createDirectories();
	await assert.throws(async () => {
		await storeInterfaces.directories.insert({
			directory_id: "Directory 1",
			parent_directory_id: "Directory 0"
		});
	});
});

test(`It should remove orphaned child records for self-referencing links.`, async (assert) => {
	let { storeManagers, storeInterfaces } = createDirectories();
	storeManagers.directories.insert({
		directory_id: "Directory 0",
		parent_directory_id: null
	});
	storeManagers.directories.insert({
		directory_id: "Directory 1",
		parent_directory_id: "Directory 0"
	});
	await storeInterfaces.directories.remove({
		directory_id: "Directory 0"
	});
	assert.array.equals(Array.from(storeManagers.directories).map((record) => record.directory_id), []);
});

test(`It should remove orphaned grandchild records for self-referencing links.`, async (assert) => {
	let { storeManagers, storeInterfaces } = createDirectories();
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
	await storeInterfaces.directories.remove({
		directory_id: "Directory 0"
	});
	assert.array.equals(Array.from(storeManagers.directories).map((record) => record.directory_id), []);
});

test(`It should not remove records with parents for self-referencing links.`, async (assert) => {
	let { storeManagers, storeInterfaces } = createDirectories();
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
	await storeInterfaces.directories.remove({
		directory_id: "Directory 1"
	});
	assert.array.equals(Array.from(storeManagers.directories).map((record) => record.directory_id), ["Directory 0"]);
});

test(`It should support enforcing link consistency for self-referencing links when there is an orphaned chain link.`, async (assert) => {
	let { storeManagers, databaseManager, storeInterfaces } = createDirectories();
	storeManagers.directories.insert({
		directory_id: "Directory 1",
		parent_directory_id: "Directory 0"
	});
	storeManagers.directories.insert({
		directory_id: "Directory 2",
		parent_directory_id: "Directory 1"
	});
	databaseManager.enforceLinkConsistency(["childDirectories"]);
	assert.array.equals(Array.from(storeManagers.directories).map((record) => record.directory_id), []);
});

test(`It should support enforcing link consistency for self-referencing links when there is a cyclical link.`, async (assert) => {
	let { storeManagers, databaseManager, storeInterfaces } = createDirectories();
	storeManagers.directories.insert({
		directory_id: "Directory 0",
		parent_directory_id: "Directory 1"
	});
	storeManagers.directories.insert({
		directory_id: "Directory 1",
		parent_directory_id: "Directory 0"
	});
	databaseManager.enforceLinkConsistency(["childDirectories"]);
	assert.array.equals(Array.from(storeManagers.directories).map((record) => record.directory_id), ["Directory 0", "Directory 1"]);
});

test(`It should support enforcing link consistency for self-referencing links when there is a chain link.`, async (assert) => {
	let { storeManagers, databaseManager, storeInterfaces } = createDirectories();
	storeManagers.directories.insert({
		directory_id: "Directory 0",
		parent_directory_id: null
	});
	storeManagers.directories.insert({
		directory_id: "Directory 1",
		parent_directory_id: "Directory 0"
	});
	databaseManager.enforceLinkConsistency(["childDirectories"]);
	assert.array.equals(Array.from(storeManagers.directories).map((record) => record.directory_id), ["Directory 0", "Directory 1"]);
});

test(`It should support enforcing store consistency for self-referencing links when there is an orphaned chain link.`, async (assert) => {
	let { storeManagers, databaseManager, storeInterfaces } = createDirectories();
	storeManagers.directories.insert({
		directory_id: "Directory 1",
		parent_directory_id: "Directory 0"
	});
	storeManagers.directories.insert({
		directory_id: "Directory 2",
		parent_directory_id: "Directory 1"
	});
	databaseManager.enforceStoreConsistency(["directories"]);
	assert.array.equals(Array.from(storeManagers.directories).map((record) => record.directory_id), []);
});

test(`It should support enforcing store consistency for self-referencing links when there is a cyclical link.`, async (assert) => {
	let { storeManagers, databaseManager, storeInterfaces } = createDirectories();
	storeManagers.directories.insert({
		directory_id: "Directory 0",
		parent_directory_id: "Directory 1"
	});
	storeManagers.directories.insert({
		directory_id: "Directory 1",
		parent_directory_id: "Directory 0"
	});
	databaseManager.enforceStoreConsistency(["directories"]);
	assert.array.equals(Array.from(storeManagers.directories).map((record) => record.directory_id), ["Directory 0", "Directory 1"]);
});

test(`It should support enforcing store consistency for self-referencing links when there is a chain link.`, async (assert) => {
	let { storeManagers, databaseManager, storeInterfaces } = createDirectories();
	storeManagers.directories.insert({
		directory_id: "Directory 0",
		parent_directory_id: null
	});
	storeManagers.directories.insert({
		directory_id: "Directory 1",
		parent_directory_id: "Directory 0"
	});
	databaseManager.enforceStoreConsistency(["directories"]);
	assert.array.equals(Array.from(storeManagers.directories).map((record) => record.directory_id), ["Directory 0", "Directory 1"]);
});
