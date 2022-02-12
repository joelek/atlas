import { StoreManager } from "./store";
import { BooleanField, StringField } from "./records";
import { BlockHandler } from "./vfs";
import { VirtualFile } from "./files";
import { EqualityFilter } from "./filters";
import { IncreasingOrder, DecreasingOrder } from "./orders";
import { test } from "../test";

test(`It should support iteration of the records stored.`, async (assert) => {
	let blockHandler = new BlockHandler(new VirtualFile(0));
	let users = StoreManager.construct(blockHandler, null, {
		fields: {
			key: new StringField("")
		},
		keys: ["key"],
		indices: []
	});
	users.insert({
		key: "A"
	});
	users.insert({
		key: "B"
	});
	let iterable = users;
	let observed = Array.from(iterable).map((entry) => entry.record().key).sort();
	let expected = ["A", "B"];
	assert.array.equals(observed, expected);
});

test(`It should support filtering of the records stored.`, async (assert) => {
	let blockHandler = new BlockHandler(new VirtualFile(0));
	let users = StoreManager.construct(blockHandler, null, {
		fields: {
			key: new StringField("")
		},
		keys: ["key"],
		indices: []
	});
	users.insert({
		key: "A"
	});
	users.insert({
		key: "B"
	});
	let iterable = users.filter({
		key: new EqualityFilter("A")
	});
	let observed = Array.from(iterable).map((entry) => entry.record().key).sort();
	let expected = ["A"];
	assert.array.equals(observed, expected);
});

test(`It should support ordering of the records stored in increasing order.`, async (assert) => {
	let blockHandler = new BlockHandler(new VirtualFile(0));
	let users = StoreManager.construct(blockHandler, null, {
		fields: {
			key: new StringField("")
		},
		keys: ["key"],
		indices: []
	});
	users.insert({
		key: "A"
	});
	users.insert({
		key: "B"
	});
	let iterable = users.filter({}, {
		key: new IncreasingOrder()
	});
	let observed = Array.from(iterable).map((entry) => entry.record().key);
	let expected = ["A", "B"];
	assert.array.equals(observed, expected);
});

test(`It should support ordering of the records stored in decreasing order.`, async (assert) => {
	let blockHandler = new BlockHandler(new VirtualFile(0));
	let users = StoreManager.construct(blockHandler, null, {
		fields: {
			key: new StringField("")
		},
		keys: ["key"],
		indices: []
	});
	users.insert({
		key: "A"
	});
	users.insert({
		key: "B"
	});
	let iterable = users.filter({}, {
		key: new DecreasingOrder()
	});
	let observed = Array.from(iterable).map((entry) => entry.record().key);
	let expected = ["B", "A"];
	assert.array.equals(observed, expected);
});

test(`It should support inserting a record previously inserted.`, async (assert) => {
	let blockHandler = new BlockHandler(new VirtualFile(0));
	let users = StoreManager.construct(blockHandler, null, {
		fields: {
			key: new StringField(""),
			name: new StringField("")
		},
		keys: ["key"],
		indices: []
	});
	users.insert({
		key: "A",
		name: "One"
	});
	assert.true(users.lookup({ key: "A" }).name === "One");
	users.insert({
		key: "A",
		name: "Two"
	});
	assert.true(users.lookup({ key: "A" }).name === "Two");
});

test(`It should support inserting a record not previously inserted.`, async (assert) => {
	let blockHandler = new BlockHandler(new VirtualFile(0));
	let users = StoreManager.construct(blockHandler, null, {
		fields: {
			key: new StringField(""),
			name: new StringField("")
		},
		keys: ["key"],
		indices: []
	});
	users.insert({
		key: "A",
		name: "One"
	});
	assert.true(users.lookup({ key: "A" }).name === "One");
});

test(`It should keep track of the number of records stored.`, async (assert) => {
	let blockHandler = new BlockHandler(new VirtualFile(0));
	let users = StoreManager.construct(blockHandler, null, {
		fields: {
			key: new StringField("")
		},
		keys: ["key"],
		indices: []
	});
	assert.true(users.length() === 0);
	users.insert({
		key: "A"
	});
	assert.true(users.length() === 1);
	users.insert({
		key: "B"
	});
	assert.true(users.length() === 2);
	users.insert({
		key: "A"
	});
	assert.true(users.length() === 2);
	users.remove({
		key: "B"
	});
	assert.true(users.length() === 1);
	users.remove({
		key: "A"
	});
	assert.true(users.length() === 0);
});

test(`It should support looking up records previously inserted.`, async (assert) => {
	let blockHandler = new BlockHandler(new VirtualFile(0));
	let users = StoreManager.construct(blockHandler, null, {
		fields: {
			key: new StringField("")
		},
		keys: ["key"],
		indices: []
	});
	users.insert({
		key: "A"
	});
	assert.true(users.lookup({ key: "A" }).key === "A");
});

test(`It should throw an error when looking up records not previously inserted.`, async (assert) => {
	let blockHandler = new BlockHandler(new VirtualFile(0));
	let users = StoreManager.construct(blockHandler, null, {
		fields: {
			key: new StringField("")
		},
		keys: ["key"],
		indices: []
	});
	await assert.throws(async () => {
		users.lookup({
			key: "A"
		});
	});
});

test(`It should support removing records previously inserted.`, async (assert) => {
	let blockHandler = new BlockHandler(new VirtualFile(0));
	let users = StoreManager.construct(blockHandler, null, {
		fields: {
			key: new StringField("")
		},
		keys: ["key"],
		indices: []
	});
	users.insert({
		key: "A"
	});
	assert.true(users.lookup({ key: "A" }).key === "A");
	users.remove({
		key: "A"
	});
	await assert.throws(async () => {
		users.lookup({
			key: "A"
		});
	});
});

test(`It should support removing records not previously inserted.`, async (assert) => {
	let blockHandler = new BlockHandler(new VirtualFile(0));
	let users = StoreManager.construct(blockHandler, null, {
		fields: {
			key: new StringField("")
		},
		keys: ["key"],
		indices: []
	});
	users.remove({
		key: "A"
	});
	await assert.throws(async () => {
		users.lookup({
			key: "A"
		});
	});
});

test(`It should support updating a record previously inserted.`, async (assert) => {
	let blockHandler = new BlockHandler(new VirtualFile(0));
	let users = StoreManager.construct(blockHandler, null, {
		fields: {
			key: new StringField(""),
			name: new StringField("")
		},
		keys: ["key"],
		indices: []
	});
	users.update({
		key: "A",
		name: "One"
	});
	assert.true(users.lookup({ key: "A" }).name === "One");
	users.update({
		key: "A",
		name: "Two"
	});
	assert.true(users.lookup({ key: "A" }).name === "Two");
});

test(`It should support updating a record not previously inserted.`, async (assert) => {
	let blockHandler = new BlockHandler(new VirtualFile(0));
	let users = StoreManager.construct(blockHandler, null, {
		fields: {
			key: new StringField(""),
			name: new StringField("")
		},
		keys: ["key"],
		indices: []
	});
	users.update({
		key: "A",
		name: "One"
	});
	assert.true(users.lookup({ key: "A" }).name === "One");
});

test(`It should be able to construct a new manager.`, async (assert) => {
	let blockHandler = new BlockHandler(new VirtualFile(0));
	let users = StoreManager.construct(blockHandler, null);
});

test(`It should be able to construct a new manager with a given schema.`, async (assert) => {
	let blockHandler = new BlockHandler(new VirtualFile(0));
	let users = StoreManager.construct(blockHandler, null, {
		fields: {
			key: new StringField("")
		},
		keys: ["key"],
		indices: []
	});
});

test(`It should be able to construct an existing manager.`, async (assert) => {
	let blockHandler = new BlockHandler(new VirtualFile(0));
	let users = StoreManager.construct(blockHandler, null, {
		fields: {
			key: new StringField("")
		},
		keys: ["key"],
		indices: []
	});
	let users2 = StoreManager.construct(blockHandler, users.getBid());
	let blocks = blockHandler.getBlockCount();
	let users3 = StoreManager.construct(blockHandler, users.getBid());
	assert.true(blockHandler.getBlockCount() === blocks);
});

test(`It should be able to construct an existing manager with a given schema.`, async (assert) => {
	let blockHandler = new BlockHandler(new VirtualFile(0));
	let users = StoreManager.construct(blockHandler, null, {
		fields: {
			key: new StringField("")
		},
		keys: ["key"],
		indices: []
	});
	let users2 = StoreManager.construct(blockHandler, users.getBid(), {
		fields: {
			key: new StringField("")
		},
		keys: ["key"],
		indices: []
	});
	let blocks = blockHandler.getBlockCount();
	let users3 = StoreManager.construct(blockHandler, users.getBid(), {
		fields: {
			key: new StringField("")
		},
		keys: ["key"],
		indices: []
	});
	assert.true(blockHandler.getBlockCount() === blocks);
});

test(`It should be able to migrate a manager when one field is added to the schema.`, async (assert) => {
	let blockHandler = new BlockHandler(new VirtualFile(0));
	let users = StoreManager.construct(blockHandler, null, {
		fields: {
			key: new StringField("")
		},
		keys: ["key"],
		indices: []
	});
	users.insert({
		key: "A"
	});
	let users2 = StoreManager.migrate(users, {
		fields: {
			key: new StringField(""),
			name: new StringField("")
		},
		keys: ["key"],
		indices: []
	});
	assert.true(users2.lookup({ key: "A" }).name === "");
});

test(`It should be able to migrate a manager when one field is removed from the schema.`, async (assert) => {
	let blockHandler = new BlockHandler(new VirtualFile(0));
	let users = StoreManager.construct(blockHandler, null, {
		fields: {
			key: new StringField(""),
			name: new StringField("")
		},
		keys: ["key"],
		indices: []
	});
	users.insert({
		key: "A",
		name: "One"
	});
	let users2 = StoreManager.migrate(users, {
		fields: {
			key: new StringField("")
		},
		keys: ["key"],
		indices: []
	});
	assert.true(users2.lookup({ key: "A" }).key === "A");
});

test(`It should be able to migrate a manager when one field is changed in the schema.`, async (assert) => {
	let blockHandler = new BlockHandler(new VirtualFile(0));
	let users = StoreManager.construct(blockHandler, null, {
		fields: {
			key: new StringField(""),
			name: new StringField("")
		},
		keys: ["key"],
		indices: []
	});
	users.insert({
		key: "A",
		name: "One"
	});
	let users2 = StoreManager.migrate(users, {
		fields: {
			key: new StringField(""),
			name: new BooleanField(false)
		},
		keys: ["key"],
		indices: []
	});
	assert.true(users2.lookup({ key: "A" }).name === false);
});

test(`It should be able to migrate a manager when the keys have changed in the schema.`, async (assert) => {
	let blockHandler = new BlockHandler(new VirtualFile(0));
	let users = StoreManager.construct(blockHandler, null, {
		fields: {
			key1: new StringField(""),
			key2: new StringField("")
		},
		keys: ["key1"],
		indices: []
	});
	users.insert({
		key1: "A",
		key2: "B"
	});
	let users2 = StoreManager.migrate(users, {
		fields: {
			key1: new StringField(""),
			key2: new StringField("")
		},
		keys: ["key2"],
		indices: []
	});
	assert.true(users2.lookup({ key2: "B" }).key1 === "A");
});
