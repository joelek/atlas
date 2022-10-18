import * as wtf from "@joelek/wtf";
import { BlockManager } from "./blocks";
import { VirtualFile } from "./files";
import { EqualityOperator } from "./operators";
import { DecreasingOrder, IncreasingOrder } from "./orders";
import { Query, QueryManager } from "./queries";
import { StringField } from "./records";
import { Store, StoreManager } from "./stores";

function createUsers() {
	let blockManager = new BlockManager(new VirtualFile(0));
	let users = StoreManager.construct(blockManager, {
		fields: {
			key: new StringField(""),
			name: new StringField("")
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
};

wtf.test(`It should support filtering without explicit ordering.`, async (assert) => {
	let { users } = { ...createUsers() };
	let queryManager = new QueryManager(users, {
		name: new EqualityOperator()
	}, {});
	let iterable = queryManager.filter({
		name: "B"
	});
	let observed = Array.from(iterable).map((user) => user.key);
	let expected = ["User 2", "User 3"];
	assert.equals(observed, expected);
});

wtf.test(`It should support filtering with explicit ordering.`, async (assert) => {
	let { users } = { ...createUsers() };
	let queryManager = new QueryManager(users, {
		name: new EqualityOperator()
	}, {
		key: new DecreasingOrder()
	});
	let iterable = queryManager.filter({
		name: "B"
	});
	let observed = Array.from(iterable).map((user) => user.key);
	let expected = ["User 3", "User 2"];
	assert.equals(observed, expected);
});

wtf.test(`It should create the correct index for a query without orders.`, async (assert) => {
	let users = new Store({
		user_id: new StringField(""),
		name: new StringField("")
	}, ["user_id"]);
	let query = new Query(users, {
		name: new EqualityOperator()
	}, {});
	let index = query.createIndex();
	let observed = index.keys;
	let expected = ["name", "user_id"];
	assert.equals(observed, expected);
});

wtf.test(`It should create the correct index for a query with metadata field orders.`, async (assert) => {
	let users = new Store({
		user_id: new StringField(""),
		name: new StringField("")
	}, ["user_id"]);
	let query = new Query(users, {
		name: new EqualityOperator()
	}, {
		name: new IncreasingOrder()
	});
	let index = query.createIndex();
	let observed = index.keys;
	let expected = ["name", "user_id"];
	assert.equals(observed, expected);
});

wtf.test(`It should create the correct index for a query with identifying field orders.`, async (assert) => {
	let users = new Store({
		user_id: new StringField(""),
		name: new StringField("")
	}, ["user_id"]);
	let query = new Query(users, {
		name: new EqualityOperator()
	}, {
		user_id: new IncreasingOrder()
	});
	let index = query.createIndex();
	let observed = index.keys;
	let expected = ["name", "user_id"];
	assert.equals(observed, expected);
});
