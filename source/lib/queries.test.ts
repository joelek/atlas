import { BlockManager } from "./blocks";
import { VirtualFile } from "./files";
import { EqualityOperator } from "./operators";
import { IncreasingOrder } from "./orders";
import { QueryManager } from "./queries";
import { StringField } from "./records";
import { StoreManager } from "./stores";
import { test } from "./test";

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

test(`It should support filtering without explicit ordering.`, async (assert) => {
	let { users } = { ...createUsers() };
	let queryManager = new QueryManager(users, {
		name: new EqualityOperator()
	}, {});
	let iterable = queryManager.filter({
		name: "B"
	});
	let observed = Array.from(iterable).map((user) => user.record().key).sort();
	let expected = ["User 2", "User 3"];
	assert.array.equals(observed, expected);
});

test(`It should support filtering with explicit ordering.`, async (assert) => {
	let { users } = { ...createUsers() };
	let queryManager = new QueryManager(users, {
		name: new EqualityOperator()
	}, {
		key: new IncreasingOrder()
	});
	let iterable = queryManager.filter({
		name: "B"
	});
	let observed = Array.from(iterable).map((user) => user.record().key);
	let expected = ["User 2", "User 3"];
	assert.array.equals(observed, expected);
});
