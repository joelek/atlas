import * as wtf from "@joelek/wtf";
import { StringField, NullableStringField } from "./records";
import { DatabaseManager } from "./databases";
import { BlockManager } from "./blocks";
import { VirtualFile } from "./files";
import { StoreManager } from "./stores";
import { LinkManager } from "./links";
import { Cache } from "./caches";

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
		databaseStores: databaseManager.createDatabaseStores()
	};
};

wtf.test(`It should support vacating records for referencing links.`, async (assert) => {
	let { storeManagers, databaseStores } = createUsersPostsAndComments();
	storeManagers.users.insert(new Cache(), {
		user_id: "User 0"
	});
	storeManagers.posts.insert(new Cache(), {
		post_id: "Post 0",
		post_user_id: "User 0"
	});
	storeManagers.comments.insert(new Cache(), {
		comment_id: "Comment 0",
		comment_post_id: "Post 0",
		comment_user_id: "User 0"
	});
	storeManagers.metas.insert(new Cache(), {
		meta_id: "Meta 0",
		meta_user_id: null
	});
	storeManagers.metas.insert(new Cache(), {
		meta_id: "Meta 1",
		meta_user_id: "User 0"
	});
	await databaseStores.users.vacate(new Cache());
	assert.equals(Array.from(storeManagers.users).map((record) => record.user_id), []);
	assert.equals(Array.from(storeManagers.posts).map((record) => record.post_id), []);
	assert.equals(Array.from(storeManagers.comments).map((record) => record.comment_id), []);
	assert.equals(Array.from(storeManagers.metas).map((record) => record.meta_id), ["Meta 0"]);
});

wtf.test(`It should support inserting records for referencing links.`, async (assert) => {
	let { storeManagers, databaseStores } = createUsersPostsAndComments();
	await databaseStores.users.insert(new Cache(), {
		user_id: "User 0"
	});
	assert.equals(Array.from(storeManagers.users).map((record) => record.user_id), ["User 0"]);
});

wtf.test(`It should prevent inserting orphaned records for referencing links.`, async (assert) => {
	let { storeManagers, databaseStores } = createUsersPostsAndComments();
	await assert.throws(async () => {
		await databaseStores.posts.insert(new Cache(), {
			post_id: "Post 0",
			post_user_id: "User 0"
		});
	});
});

wtf.test(`It should remove orphaned child records for referencing links.`, async (assert) => {
	let { storeManagers, databaseStores } = createUsersPostsAndComments();
	storeManagers.users.insert(new Cache(), {
		user_id: "User 0"
	});
	storeManagers.posts.insert(new Cache(), {
		post_id: "Post 0",
		post_user_id: "User 0"
	});
	await databaseStores.users.remove(new Cache(), {
		user_id: "User 0"
	});
	assert.equals(Array.from(storeManagers.users).map((record) => record.user_id), []);
	assert.equals(Array.from(storeManagers.posts).map((record) => record.post_id), []);
});

wtf.test(`It should remove orphaned grandchild records for referencing links.`, async (assert) => {
	let { storeManagers, databaseStores } = createUsersPostsAndComments();
	storeManagers.users.insert(new Cache(), {
		user_id: "User 0"
	});
	storeManagers.posts.insert(new Cache(), {
		post_id: "Post 0",
		post_user_id: "User 0"
	});
	storeManagers.comments.insert(new Cache(), {
		comment_id: "Comment 0",
		comment_post_id: "Post 0",
		comment_user_id: "User 0"
	});
	await databaseStores.users.remove(new Cache(), {
		user_id: "User 0"
	});
	assert.equals(Array.from(storeManagers.users).map((record) => record.user_id), []);
	assert.equals(Array.from(storeManagers.posts).map((record) => record.post_id), []);
	assert.equals(Array.from(storeManagers.comments).map((record) => record.comment_id), []);
});

wtf.test(`It should not remove records with parents for referencing links.`, async (assert) => {
	let { storeManagers, databaseStores } = createUsersPostsAndComments();
	storeManagers.users.insert(new Cache(), {
		user_id: "User 0"
	});
	storeManagers.posts.insert(new Cache(), {
		post_id: "Post 0",
		post_user_id: "User 0"
	});
	storeManagers.comments.insert(new Cache(), {
		comment_id: "Comment 0",
		comment_post_id: "Post 0",
		comment_user_id: "User 0"
	});
	await databaseStores.posts.remove(new Cache(), {
		post_id: "Post 0"
	});
	assert.equals(Array.from(storeManagers.users).map((record) => record.user_id), ["User 0"]);
	assert.equals(Array.from(storeManagers.posts).map((record) => record.post_id), []);
	assert.equals(Array.from(storeManagers.comments).map((record) => record.comment_id), []);
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
		databaseStores: databaseManager.createDatabaseStores()
	};
};

wtf.test(`It should support vacating records for self-referencing links.`, async (assert) => {
	let { storeManagers, databaseStores } = createDirectories();
	await databaseStores.directories.insert(new Cache(), {
		directory_id: "Directory 0",
		parent_directory_id: null
	});
	await databaseStores.directories.insert(new Cache(), {
		directory_id: "Directory 1",
		parent_directory_id: "Directory 0"
	});
	await databaseStores.directories.vacate(new Cache());
	assert.equals(Array.from(storeManagers.directories).map((record) => record.directory_id), []);
});

wtf.test(`It should support inserting records for self-referencing links.`, async (assert) => {
	let { storeManagers, databaseStores } = createDirectories();
	await databaseStores.directories.insert(new Cache(), {
		directory_id: "Directory 0",
		parent_directory_id: null
	});
	assert.equals(Array.from(storeManagers.directories).map((record) => record.directory_id), ["Directory 0"]);
});

wtf.test(`It should prevent inserting orphaned records for self-referencing links.`, async (assert) => {
	let { storeManagers, databaseStores } = createDirectories();
	await assert.throws(async () => {
		await databaseStores.directories.insert(new Cache(), {
			directory_id: "Directory 1",
			parent_directory_id: "Directory 0"
		});
	});
});

wtf.test(`It should remove orphaned child records for self-referencing links.`, async (assert) => {
	let { storeManagers, databaseStores } = createDirectories();
	storeManagers.directories.insert(new Cache(), {
		directory_id: "Directory 0",
		parent_directory_id: null
	});
	storeManagers.directories.insert(new Cache(), {
		directory_id: "Directory 1",
		parent_directory_id: "Directory 0"
	});
	await databaseStores.directories.remove(new Cache(), {
		directory_id: "Directory 0"
	});
	assert.equals(Array.from(storeManagers.directories).map((record) => record.directory_id), []);
});

wtf.test(`It should remove orphaned grandchild records for self-referencing links.`, async (assert) => {
	let { storeManagers, databaseStores } = createDirectories();
	storeManagers.directories.insert(new Cache(), {
		directory_id: "Directory 0",
		parent_directory_id: null
	});
	storeManagers.directories.insert(new Cache(), {
		directory_id: "Directory 1",
		parent_directory_id: "Directory 0"
	});
	storeManagers.directories.insert(new Cache(), {
		directory_id: "Directory 2",
		parent_directory_id: "Directory 1"
	});
	await databaseStores.directories.remove(new Cache(), {
		directory_id: "Directory 0"
	});
	assert.equals(Array.from(storeManagers.directories).map((record) => record.directory_id), []);
});

wtf.test(`It should not remove records with parents for self-referencing links.`, async (assert) => {
	let { storeManagers, databaseStores } = createDirectories();
	storeManagers.directories.insert(new Cache(), {
		directory_id: "Directory 0",
		parent_directory_id: null
	});
	storeManagers.directories.insert(new Cache(), {
		directory_id: "Directory 1",
		parent_directory_id: "Directory 0"
	});
	storeManagers.directories.insert(new Cache(), {
		directory_id: "Directory 2",
		parent_directory_id: "Directory 1"
	});
	await databaseStores.directories.remove(new Cache(), {
		directory_id: "Directory 1"
	});
	assert.equals(Array.from(storeManagers.directories).map((record) => record.directory_id), ["Directory 0"]);
});

wtf.test(`It should support enforcing link consistency for self-referencing links when there is an orphaned chain link.`, async (assert) => {
	let { storeManagers, databaseManager, databaseStores } = createDirectories();
	storeManagers.directories.insert(new Cache(), {
		directory_id: "Directory 1",
		parent_directory_id: "Directory 0"
	});
	storeManagers.directories.insert(new Cache(), {
		directory_id: "Directory 2",
		parent_directory_id: "Directory 1"
	});
	databaseManager.enforceLinkConsistency(["childDirectories"]);
	assert.equals(Array.from(storeManagers.directories).map((record) => record.directory_id), []);
});

wtf.test(`It should support enforcing link consistency for self-referencing links when there is a cyclical link.`, async (assert) => {
	let { storeManagers, databaseManager, databaseStores } = createDirectories();
	storeManagers.directories.insert(new Cache(), {
		directory_id: "Directory 0",
		parent_directory_id: "Directory 1"
	});
	storeManagers.directories.insert(new Cache(), {
		directory_id: "Directory 1",
		parent_directory_id: "Directory 0"
	});
	databaseManager.enforceLinkConsistency(["childDirectories"]);
	assert.equals(Array.from(storeManagers.directories).map((record) => record.directory_id), ["Directory 0", "Directory 1"]);
});

wtf.test(`It should support enforcing link consistency for self-referencing links when there is a chain link.`, async (assert) => {
	let { storeManagers, databaseManager, databaseStores } = createDirectories();
	storeManagers.directories.insert(new Cache(), {
		directory_id: "Directory 0",
		parent_directory_id: null
	});
	storeManagers.directories.insert(new Cache(), {
		directory_id: "Directory 1",
		parent_directory_id: "Directory 0"
	});
	databaseManager.enforceLinkConsistency(["childDirectories"]);
	assert.equals(Array.from(storeManagers.directories).map((record) => record.directory_id), ["Directory 0", "Directory 1"]);
});

wtf.test(`It should support enforcing store consistency for self-referencing links when there is an orphaned chain link.`, async (assert) => {
	let { storeManagers, databaseManager, databaseStores } = createDirectories();
	storeManagers.directories.insert(new Cache(), {
		directory_id: "Directory 1",
		parent_directory_id: "Directory 0"
	});
	storeManagers.directories.insert(new Cache(), {
		directory_id: "Directory 2",
		parent_directory_id: "Directory 1"
	});
	databaseManager.enforceStoreConsistency(["directories"]);
	assert.equals(Array.from(storeManagers.directories).map((record) => record.directory_id), []);
});

wtf.test(`It should support enforcing store consistency for self-referencing links when there is a cyclical link.`, async (assert) => {
	let { storeManagers, databaseManager, databaseStores } = createDirectories();
	storeManagers.directories.insert(new Cache(), {
		directory_id: "Directory 0",
		parent_directory_id: "Directory 1"
	});
	storeManagers.directories.insert(new Cache(), {
		directory_id: "Directory 1",
		parent_directory_id: "Directory 0"
	});
	databaseManager.enforceStoreConsistency(["directories"]);
	assert.equals(Array.from(storeManagers.directories).map((record) => record.directory_id), ["Directory 0", "Directory 1"]);
});

wtf.test(`It should support enforcing store consistency for self-referencing links when there is a chain link.`, async (assert) => {
	let { storeManagers, databaseManager, databaseStores } = createDirectories();
	storeManagers.directories.insert(new Cache(), {
		directory_id: "Directory 0",
		parent_directory_id: null
	});
	storeManagers.directories.insert(new Cache(), {
		directory_id: "Directory 1",
		parent_directory_id: "Directory 0"
	});
	databaseManager.enforceStoreConsistency(["directories"]);
	assert.equals(Array.from(storeManagers.directories).map((record) => record.directory_id), ["Directory 0", "Directory 1"]);
});
