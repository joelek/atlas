import { StoreManager } from "./store";
import { StringField } from "./records";
import { BlockHandler } from "./vfs";
import { VirtualFile } from "./files";
import { EqualityFilter } from "./filters";
import { IncreasingOrder, DecreasingOrder } from "./orders";
import { test } from "./test";

test(`It should support iteration of the records stored.`, async (assert) => {
	let blockHandler = new BlockHandler(new VirtualFile(0));
	let users = StoreManager.construct(blockHandler, {
		fields: {
			key: new StringField("")
		},
		keys: ["key"]
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
	let users = StoreManager.construct(blockHandler, {
		fields: {
			key: new StringField("")
		},
		keys: ["key"]
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
	let users = StoreManager.construct(blockHandler, {
		fields: {
			key: new StringField("")
		},
		keys: ["key"]
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
	let users = StoreManager.construct(blockHandler, {
		fields: {
			key: new StringField("")
		},
		keys: ["key"]
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
	let users = StoreManager.construct(blockHandler, {
		fields: {
			key: new StringField(""),
			name: new StringField("")
		},
		keys: ["key"]
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
	let users = StoreManager.construct(blockHandler, {
		fields: {
			key: new StringField(""),
			name: new StringField("")
		},
		keys: ["key"]
	});
	users.insert({
		key: "A",
		name: "One"
	});
	assert.true(users.lookup({ key: "A" }).name === "One");
});

test(`It should keep track of the number of records stored.`, async (assert) => {
	let blockHandler = new BlockHandler(new VirtualFile(0));
	let users = StoreManager.construct(blockHandler, {
		fields: {
			key: new StringField("")
		},
		keys: ["key"]
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
	let users = StoreManager.construct(blockHandler, {
		fields: {
			key: new StringField("")
		},
		keys: ["key"]
	});
	users.insert({
		key: "A"
	});
	assert.true(users.lookup({ key: "A" }).key === "A");
});

test(`It should throw an error when looking up records not previously inserted.`, async (assert) => {
	let blockHandler = new BlockHandler(new VirtualFile(0));
	let users = StoreManager.construct(blockHandler, {
		fields: {
			key: new StringField("")
		},
		keys: ["key"]
	});
	await assert.throws(async () => {
		users.lookup({
			key: "A"
		});
	});
});

test(`It should support removing records previously inserted.`, async (assert) => {
	let blockHandler = new BlockHandler(new VirtualFile(0));
	let users = StoreManager.construct(blockHandler, {
		fields: {
			key: new StringField("")
		},
		keys: ["key"]
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
	let users = StoreManager.construct(blockHandler, {
		fields: {
			key: new StringField("")
		},
		keys: ["key"]
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
	let users = StoreManager.construct(blockHandler, {
		fields: {
			key: new StringField(""),
			name: new StringField("")
		},
		keys: ["key"]
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
	let users = StoreManager.construct(blockHandler, {
		fields: {
			key: new StringField(""),
			name: new StringField("")
		},
		keys: ["key"]
	});
	users.update({
		key: "A",
		name: "One"
	});
	assert.true(users.lookup({ key: "A" }).name === "One");
});