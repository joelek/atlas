import { Index, IndexManager, SearchIndexManager, Store, StoreManager } from "./stores";
import { IntegerField, RecordManager, StringField } from "./records";
import { BlockManager } from "./blocks";
import { VirtualFile } from "./files";
import { EqualityFilter } from "./filters";
import { IncreasingOrder, DecreasingOrder, Order } from "./orders";
import { benchmark, test } from "./test";
import { Table } from "./tables";

test(`It should support for-of iteration of the records stored.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	let users = StoreManager.construct(blockManager, {
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
	let observed = [] as Array<string>;
	for (let entry of users) {
		observed.push(entry.key);
	}
	let expected = ["A", "B"];
	assert.array.equals(observed, expected);
});

test(`It should support iteration of the records stored in increasing order.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	let users = StoreManager.construct(blockManager, {
		fields: {
			key: new StringField("")
		},
		keys: ["key"],
		orders: {
			key: new IncreasingOrder()
		}
	});
	users.insert({
		key: "A"
	});
	users.insert({
		key: "B"
	});
	let iterable = users;
	let observed = Array.from(iterable).map((entry) => entry.key);
	let expected = ["A", "B"];
	assert.array.equals(observed, expected);
});

test(`It should support iteration of the records stored in decreasing order.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	let users = StoreManager.construct(blockManager, {
		fields: {
			key: new StringField("")
		},
		keys: ["key"],
		orders: {
			key: new DecreasingOrder()
		}
	});
	users.insert({
		key: "A"
	});
	users.insert({
		key: "B"
	});
	let iterable = users;
	let observed = Array.from(iterable).map((entry) => entry.key);
	let expected = ["B", "A"];
	assert.array.equals(observed, expected);
});

test(`It should support filtering of the records stored.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	let users = StoreManager.construct(blockManager, {
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
	let observed = Array.from(iterable).map((entry) => entry.key);
	let expected = ["A"];
	assert.array.equals(observed, expected);
});

test(`It should support ordering of the records stored in increasing order.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	let users = StoreManager.construct(blockManager, {
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
	let observed = Array.from(iterable).map((entry) => entry.key);
	let expected = ["A", "B"];
	assert.array.equals(observed, expected);
});

test(`It should support ordering of the records stored in decreasing order.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	let users = StoreManager.construct(blockManager, {
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
	let observed = Array.from(iterable).map((entry) => entry.key);
	let expected = ["B", "A"];
	assert.array.equals(observed, expected);
});

test(`It should support ordering of the records stored in increasing order with an index.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	let users = StoreManager.construct(blockManager, {
		fields: {
			key: new StringField("")
		},
		keys: ["key"],
		indices: [
			new Index(["key"])
		]
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
	let observed = Array.from(iterable).map((entry) => entry.key);
	let expected = ["A", "B"];
	assert.array.equals(observed, expected);
});

test(`It should support ordering of the records stored in decreasing order with an index.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	let users = StoreManager.construct(blockManager, {
		fields: {
			key: new StringField("")
		},
		keys: ["key"],
		indices: [
			new Index(["key"])
		]
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
	let observed = Array.from(iterable).map((entry) => entry.key);
	let expected = ["B", "A"];
	assert.array.equals(observed, expected);
});

test(`It should support inserting a record previously inserted.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	let users = StoreManager.construct(blockManager, {
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
	let blockManager = new BlockManager(new VirtualFile(0));
	let users = StoreManager.construct(blockManager, {
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
	let blockManager = new BlockManager(new VirtualFile(0));
	let users = StoreManager.construct(blockManager, {
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
	let blockManager = new BlockManager(new VirtualFile(0));
	let users = StoreManager.construct(blockManager, {
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
	let blockManager = new BlockManager(new VirtualFile(0));
	let users = StoreManager.construct(blockManager, {
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
	let blockManager = new BlockManager(new VirtualFile(0));
	let users = StoreManager.construct(blockManager, {
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
	let blockManager = new BlockManager(new VirtualFile(0));
	let users = StoreManager.construct(blockManager, {
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
	let blockManager = new BlockManager(new VirtualFile(0));
	let users = StoreManager.construct(blockManager, {
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
	let blockManager = new BlockManager(new VirtualFile(0));
	let users = StoreManager.construct(blockManager, {
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

test(`It should support partially updating a record previously inserted.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	let users = StoreManager.construct(blockManager, {
		fields: {
			key: new StringField(""),
			name: new StringField("")
		},
		keys: ["key"]
	});
	users.update({
		key: "A"
	});
	assert.true(users.lookup({ key: "A" }).name === "");
	users.update({
		key: "A",
		name: "Two"
	});
	assert.true(users.lookup({ key: "A" }).name === "Two");
});

test(`It should support partially updating a record not previously inserted.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	let users = StoreManager.construct(blockManager, {
		fields: {
			key: new StringField(""),
			name: new StringField("")
		},
		keys: ["key"]
	});
	users.update({
		key: "A"
	});
	assert.true(users.lookup({ key: "A" }).name === "");
});

test(`It should create the correct index for a store without orders.`, async (assert) => {
	let users = new Store({
		user_id: new StringField(""),
		name: new StringField("")
	}, ["user_id"], {
		user_id: undefined as Order<string> | undefined,
		name: undefined as Order<string> | undefined
	});
	let index = users.createIndex();
	let observed = index.keys;
	let expected = ["user_id"];
	assert.array.equals(observed, expected);
});

test(`It should create the correct index for a store with metadata field orders.`, async (assert) => {
	let users = new Store({
		user_id: new StringField(""),
		name: new StringField("")
	}, ["user_id"], {
		user_id: undefined as Order<string> | undefined,
		name: new IncreasingOrder()
	});
	let index = users.createIndex();
	let observed = index.keys;
	let expected = ["name", "user_id"];
	assert.array.equals(observed, expected);
});

test(`It should create the correct index for a store with identifying field orders.`, async (assert) => {
	let users = new Store({
		user_id: new StringField(""),
		name: new StringField("")
	}, ["user_id"], {
		user_id: new IncreasingOrder(),
		name: undefined as Order<string> | undefined
	});
	let index = users.createIndex();
	let observed = index.keys;
	let expected = ["user_id"];
	assert.array.equals(observed, expected);
});

test(`It should update indices on insert.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	let fields = {
		user_id: new StringField(""),
		name: new StringField("")
	};
	let keys = ["user_id"] as ["user_id"];
	let recordManager = new RecordManager(fields);
	let table = new Table(blockManager, {
		getKeyFromValue: (value) => {
			let buffer = blockManager.readBlock(value);
			let record = recordManager.decode(buffer);
			return recordManager.encodeKeys(keys, record);
		}
	});
	let index = new IndexManager(recordManager, blockManager, ["name"]);
	let users = new StoreManager(blockManager, fields, keys, {}, table, [index], []);
	users.insert({
		user_id: "User 1",
		name: "Name 1"
	});
	let observed = Array.from(index).map((record) => record.name);
	let expected = ["Name 1"];
	assert.array.equals(observed, expected);
});

test(`It should update indices on update.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	let fields = {
		user_id: new StringField(""),
		name: new StringField("")
	};
	let keys = ["user_id"] as ["user_id"];
	let recordManager = new RecordManager(fields);
	let table = new Table(blockManager, {
		getKeyFromValue: (value) => {
			let buffer = blockManager.readBlock(value);
			let record = recordManager.decode(buffer);
			return recordManager.encodeKeys(keys, record);
		}
	});
	let index = new IndexManager(recordManager, blockManager, ["name"]);
	let users = new StoreManager(blockManager, fields, keys, {}, table, [index], []);
	users.insert({
		user_id: "User 1",
		name: "Name 1"
	});
	users.insert({
		user_id: "User 1",
		name: "Name 2"
	});
	let observed = Array.from(index).map((record) => record.name);
	let expected = ["Name 2"];
	assert.array.equals(observed, expected);
});

test(`It should update indices on remove.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	let fields = {
		user_id: new StringField(""),
		name: new StringField("")
	};
	let keys = ["user_id"] as ["user_id"];
	let recordManager = new RecordManager(fields);
	let table = new Table(blockManager, {
		getKeyFromValue: (value) => {
			let buffer = blockManager.readBlock(value);
			let record = recordManager.decode(buffer);
			return recordManager.encodeKeys(keys, record);
		}
	});
	let index = new IndexManager(recordManager, blockManager, ["name"]);
	let users = new StoreManager(blockManager, fields, keys, {}, table, [index], []);
	users.insert({
		user_id: "User 1",
		name: "Name 1"
	});
	users.remove({
		user_id: "User 1"
	});
	let observed = Array.from(index).map((record) => record.name);
	let expected = [] as Array<string>;
	assert.array.equals(observed, expected);
});

test(`It should use the optimal index when filtering with filters.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	let fields = {
		user_id: new StringField(""),
		name: new StringField("")
	};
	let keys = ["user_id"] as ["user_id"];
	let recordManager = new RecordManager(fields);
	let table = new Table(blockManager, {
		getKeyFromValue: (value) => {
			let buffer = blockManager.readBlock(value);
			let record = recordManager.decode(buffer);
			return recordManager.encodeKeys(keys, record);
		}
	});
	let indexOne = new IndexManager(recordManager, blockManager, ["user_id"]);
	let usersOne = new StoreManager(blockManager, fields, keys, {}, table, [indexOne], []);
	usersOne.insert({
		user_id: "User 1",
		name: "Name"
	});
	let indexTwo = new IndexManager(recordManager, blockManager, ["name", "user_id"]);
	let usersTwo = new StoreManager(blockManager, fields, keys, {}, table, [indexTwo], []);
	usersTwo.insert({
		user_id: "User 2",
		name: "Name"
	});
	let users = new StoreManager(blockManager, fields, keys, {}, table, [indexOne, indexTwo], []);
	let iterable = users.filter({
		name: new EqualityFilter("Name")
	});
	let observed = Array.from(iterable).map((record) => record.user_id);
	let expected = ["User 2"] as Array<string>;
	assert.array.equals(observed, expected);
});

test(`It should use the optimal index when filtering with filters and orders`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	let fields = {
		user_id: new StringField(""),
		name: new StringField("")
	};
	let keys = ["user_id"] as ["user_id"];
	let recordManager = new RecordManager(fields);
	let table = new Table(blockManager, {
		getKeyFromValue: (value) => {
			let buffer = blockManager.readBlock(value);
			let record = recordManager.decode(buffer);
			return recordManager.encodeKeys(keys, record);
		}
	});
	let indexOne = new IndexManager(recordManager, blockManager, ["user_id"]);
	let usersOne = new StoreManager(blockManager, fields, keys, {}, table, [indexOne], []);
	usersOne.insert({
		user_id: "User 1",
		name: "Name"
	});
	let indexTwo = new IndexManager(recordManager, blockManager, ["name", "user_id"]);
	let usersTwo = new StoreManager(blockManager, fields, keys, {}, table, [indexTwo], []);
	usersTwo.insert({
		user_id: "User 2",
		name: "Name"
	});
	let users = new StoreManager(blockManager, fields, keys, {}, table, [indexOne, indexTwo], []);
	let iterable = users.filter({
		name: new EqualityFilter("Name")
	});
	let observed = Array.from(iterable).map((record) => record.user_id);
	let expected = ["User 2"] as Array<string>;
	assert.array.equals(observed, expected);
});

test(`It should support anchored filtering of the records stored in increasing order.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	let users = StoreManager.construct(blockManager, {
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
	users.insert({
		key: "C"
	});
	users.insert({
		key: "D"
	});
	let iterable = users.filter({}, {
		key: new IncreasingOrder()
	}, {
		key: "B"
	});
	let observed = Array.from(iterable).map((entry) => entry.key);
	let expected = ["C", "D"];
	assert.array.equals(observed, expected);
});

test(`It should support anchored filtering of the records stored in increasing order with an index.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	let users = StoreManager.construct(blockManager, {
		fields: {
			key: new StringField("")
		},
		keys: ["key"],
		indices: [
			new Index(["key"])
		]
	});
	users.insert({
		key: "A"
	});
	users.insert({
		key: "B"
	});
	users.insert({
		key: "C"
	});
	users.insert({
		key: "D"
	});
	let iterable = users.filter({}, {
		key: new IncreasingOrder()
	}, {
		key: "B"
	});
	let observed = Array.from(iterable).map((entry) => entry.key);
	let expected = ["C", "D"];
	assert.array.equals(observed, expected);
});

test(`It should support anchored filtering of the records stored in decreasing order.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	let users = StoreManager.construct(blockManager, {
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
	users.insert({
		key: "C"
	});
	users.insert({
		key: "D"
	});
	let iterable = users.filter({}, {
		key: new DecreasingOrder()
	}, {
		key: "C"
	});
	let observed = Array.from(iterable).map((entry) => entry.key);
	let expected = ["B", "A"];
	assert.array.equals(observed, expected);
});

test(`It should support anchored filtering of the records stored in decreasing order with an index.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	let users = StoreManager.construct(blockManager, {
		fields: {
			key: new StringField("")
		},
		keys: ["key"],
		indices: [
			new Index(["key"])
		]
	});
	users.insert({
		key: "A"
	});
	users.insert({
		key: "B"
	});
	users.insert({
		key: "C"
	});
	users.insert({
		key: "D"
	});
	let iterable = users.filter({}, {
		key: new DecreasingOrder()
	}, {
		key: "C"
	});
	let observed = Array.from(iterable).map((entry) => entry.key);
	let expected = ["B", "A"];
	assert.array.equals(observed, expected);
});

test(`It should perform significantly better with a suitable index.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	let storeOne = StoreManager.construct(blockManager, {
		fields: {
			key: new IntegerField(0)
		},
		keys: ["key"],
		indices: [
			new Index(["key"])
		]
	});
	let storeTwo = StoreManager.construct(blockManager, {
		fields: {
			key: new IntegerField(0)
		},
		keys: ["key"],
		indices: []
	});
	for (let key = 0; key < 1000; key++) {
		storeOne.insert({
			key
		});
		storeTwo.insert({
			key
		});
	}
	let averageOne = await benchmark(async () => {
		storeOne.filter(undefined, undefined, undefined, 10);
	});
	let averageTwo = await benchmark(async () => {
		storeTwo.filter(undefined, undefined, undefined, 10);
	});
	assert.true(averageOne * 100 < averageTwo);
});

test(`It should prevent identical records from being re-indexed.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	let fields = {
		user_id: new StringField(""),
		name: new StringField("")
	};
	let keys = ["user_id"] as ["user_id"];
	let recordManager = new RecordManager(fields);
	let table = new Table(blockManager, {
		getKeyFromValue: (value) => {
			let buffer = blockManager.readBlock(value);
			let record = recordManager.decode(buffer);
			return recordManager.encodeKeys(keys, record);
		}
	});
	let index = new IndexManager(recordManager, blockManager, ["user_id"]);
	let users = new StoreManager(blockManager, fields, keys, {}, table, [index], []);
	let record = {
		user_id: "User 1",
		name: "Name2"
	};
	assert.true(!Number.isInteger(Math.log2(recordManager.encode(record).length)));
	users.insert(record);
	assert.array.equals(Array.from(index).map((user) => user.user_id), ["User 1"]);
	index.remove(record);
	assert.array.equals(Array.from(index).map((user) => user.user_id), []);
	users.insert(record);
	assert.array.equals(Array.from(index).map((user) => user.user_id), []);
});

test(`It should support vacating.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	let users = StoreManager.construct(blockManager, {
		fields: {
			key: new StringField("")
		},
		keys: ["key"],
		indices: [
			new Index(["key"])
		]
	});
	users.insert({
		key: "A"
	});
	users.insert({
		key: "B"
	});
	users.vacate();
	let observed = Array.from(users).map((entry) => entry.key);
	let expected = [] as Array<string>;
	assert.array.equals(observed, expected);
});

function makeUsersSearchIndex() {
	let blockManager = new BlockManager(new VirtualFile(0));
	let fields = {
		user_id: new StringField(""),
		name: new StringField("")
	};
	let keys = ["user_id"] as ["user_id"];
	let recordManager = new RecordManager(fields);
	let table = new Table(blockManager, {
		getKeyFromValue: (value) => {
			let buffer = blockManager.readBlock(value);
			let record = recordManager.decode(buffer);
			return recordManager.encodeKeys(keys, record);
		}
	});
	let index = new SearchIndexManager(recordManager, blockManager, "name");
	let users = new StoreManager(blockManager, fields, keys, {}, table, [], [index]);
	return {
		users,
		index
	};
};

test(`It should update search indices on insert.`, async (assert) => {
	let { users, index } = { ...makeUsersSearchIndex() };
	users.insert({
		user_id: "User 1",
		name: "Name 1"
	});
	let observed = Array.from(index).map((record) => record.record.name);
	let expected = ["Name 1"];
	assert.array.equals(observed, expected);
});

test(`It should update search indices on update.`, async (assert) => {
	let { users, index } = { ...makeUsersSearchIndex() };
	users.insert({
		user_id: "User 1",
		name: "Name 1"
	});
	users.insert({
		user_id: "User 1",
		name: "Name 2"
	});
	let observed = Array.from(index).map((record) => record.record.name);
	let expected = ["Name 2"];
	assert.array.equals(observed, expected);
});

test(`It should update search indices on remove.`, async (assert) => {
	let { users, index } = { ...makeUsersSearchIndex() };
	users.insert({
		user_id: "User 1",
		name: "Name 1"
	});
	users.remove({
		user_id: "User 1"
	});
	let observed = Array.from(index).map((record) => record.record.name);
	let expected = [] as Array<string>;
	assert.array.equals(observed, expected);
});

test(`It should return the correct search results when names are ["Ek"] and query is "".`, async (assert) => {
	let { users, index } = { ...makeUsersSearchIndex() };
	users.insert({
		user_id: "User 1",
		name: "Ek"
	});
	let observed = users.search("").map((record) => record.record.user_id);
	let expected = ["User 1"];
	assert.array.equals(observed, expected);
});

test(`It should return the correct search results when names are ["Ek"] and query is "e".`, async (assert) => {
	let { users, index } = { ...makeUsersSearchIndex() };
	users.insert({
		user_id: "User 1",
		name: "Ek"
	});
	let observed = users.search("e").map((record) => record.record.user_id);
	let expected = ["User 1"];
	assert.array.equals(observed, expected);
});

test(`It should return the correct search results when names are ["Ek"] and query is "ek".`, async (assert) => {
	let { users, index } = { ...makeUsersSearchIndex() };
	users.insert({
		user_id: "User 1",
		name: "Ek"
	});
	let observed = users.search("ek").map((record) => record.record.user_id);
	let expected = ["User 1"];
	assert.array.equals(observed, expected);
});

test(`It should return the correct search results when names are ["Ek"] and query is "eks".`, async (assert) => {
	let { users, index } = { ...makeUsersSearchIndex() };
	users.insert({
		user_id: "User 1",
		name: "Ek"
	});
	let observed = users.search("eks").map((record) => record.record.user_id);
	let expected = [] as Array<string>;
	assert.array.equals(observed, expected);
});

test(`It should return the correct search results when names are ["Joel Ek"] and query is "".`, async (assert) => {
	let { users, index } = { ...makeUsersSearchIndex() };
	users.insert({
		user_id: "User 1",
		name: "Joel Ek"
	});
	let observed = users.search("").map((record) => record.record.user_id);
	let expected = ["User 1"] as Array<string>;
	assert.array.equals(observed, expected);
});

test(`It should return the correct search results when names are ["Joel Ek"] and query is "e".`, async (assert) => {
	let { users, index } = { ...makeUsersSearchIndex() };
	users.insert({
		user_id: "User 1",
		name: "Joel Ek"
	});
	let observed = users.search("e").map((record) => record.record.user_id);
	let expected = ["User 1"] as Array<string>;
	assert.array.equals(observed, expected);
});

test(`It should return the correct search results when names are ["Joel Ek"] and query is "ek".`, async (assert) => {
	let { users, index } = { ...makeUsersSearchIndex() };
	users.insert({
		user_id: "User 1",
		name: "Joel Ek"
	});
	let observed = users.search("ek").map((record) => record.record.user_id);
	let expected = ["User 1"] as Array<string>;
	assert.array.equals(observed, expected);
});

test(`It should return the correct search results when names are ["Joel Ek"] and query is "eks".`, async (assert) => {
	let { users, index } = { ...makeUsersSearchIndex() };
	users.insert({
		user_id: "User 1",
		name: "Joel Ek"
	});
	let observed = users.search("eks").map((record) => record.record.user_id);
	let expected = [] as Array<string>;
	assert.array.equals(observed, expected);
});

test(`It should return the correct search results when names are ["Joel Ek"] and query is "joel".`, async (assert) => {
	let { users, index } = { ...makeUsersSearchIndex() };
	users.insert({
		user_id: "User 1",
		name: "Joel Ek"
	});
	let observed = users.search("joel").map((record) => record.record.user_id);
	let expected = ["User 1"] as Array<string>;
	assert.array.equals(observed, expected);
});

test(`It should return the correct search results when names are ["Joel Ek"] and query is "joel ek".`, async (assert) => {
	let { users, index } = { ...makeUsersSearchIndex() };
	users.insert({
		user_id: "User 1",
		name: "Joel Ek"
	});
	let observed = users.search("joel ek").map((record) => record.record.user_id);
	let expected = ["User 1"] as Array<string>;
	assert.array.equals(observed, expected);
});

test(`It should return the correct search results when names are ["Joel Ek"] and query is "ek joel".`, async (assert) => {
	let { users, index } = { ...makeUsersSearchIndex() };
	users.insert({
		user_id: "User 1",
		name: "Joel Ek"
	});
	let observed = users.search("ek joel").map((record) => record.record.user_id);
	let expected = ["User 1"] as Array<string>;
	assert.array.equals(observed, expected);
});

test(`It should return the correct search results when names are ["Joel Ek"] and query is "joel eks".`, async (assert) => {
	let { users, index } = { ...makeUsersSearchIndex() };
	users.insert({
		user_id: "User 1",
		name: "Joel Ek"
	});
	let observed = users.search("joel eks").map((record) => record.record.user_id);
	let expected = [] as Array<string>;
	assert.array.equals(observed, expected);
});

test(`It should return the correct search results when names are ["Joel Ek"] and query is "joels ek".`, async (assert) => {
	let { users, index } = { ...makeUsersSearchIndex() };
	users.insert({
		user_id: "User 1",
		name: "Joel Ek"
	});
	let observed = users.search("joels ek").map((record) => record.record.user_id);
	let expected = [] as Array<string>;
	assert.array.equals(observed, expected);
});

test(`It should return the correct search results when names are ["Joel A Z", "Joel Ek", "Joel A Z"] and query is "".`, async (assert) => {
	let { users, index } = { ...makeUsersSearchIndex() };
	users.insert({
		user_id: "User 0",
		name: "Joel A Z"
	});
	users.insert({
		user_id: "User 1",
		name: "Joel Ek"
	});
	users.insert({
		user_id: "User 2",
		name: "Joel A Z"
	});
	let observed = users.search("").map((record) => record.record.user_id);
	let expected = ["User 0", "User 1", "User 2"] as Array<string>;
	assert.array.equals(observed, expected);
});

test(`It should return the correct search results when names are ["Joel A Z", "Joel Ek", "Joel A Z"] and query is "e".`, async (assert) => {
	let { users, index } = { ...makeUsersSearchIndex() };
	users.insert({
		user_id: "User 0",
		name: "Joel A Z"
	});
	users.insert({
		user_id: "User 1",
		name: "Joel Ek"
	});
	users.insert({
		user_id: "User 2",
		name: "Joel A Z"
	});
	let observed = users.search("e").map((record) => record.record.user_id);
	let expected = ["User 1"] as Array<string>;
	assert.array.equals(observed, expected);
});

test(`It should return the correct search results when names are ["Joel A Z", "Joel Ek", "Joel A Z"] and query is "ek".`, async (assert) => {
	let { users, index } = { ...makeUsersSearchIndex() };
	users.insert({
		user_id: "User 0",
		name: "Joel A Z"
	});
	users.insert({
		user_id: "User 1",
		name: "Joel Ek"
	});
	users.insert({
		user_id: "User 2",
		name: "Joel A Z"
	});
	let observed = users.search("ek").map((record) => record.record.user_id);
	let expected = ["User 1"] as Array<string>;
	assert.array.equals(observed, expected);
});

test(`It should return the correct search results when names are ["Joel A Z", "Joel Ek", "Joel A Z"] and query is "eks".`, async (assert) => {
	let { users, index } = { ...makeUsersSearchIndex() };
	users.insert({
		user_id: "User 0",
		name: "Joel A Z"
	});
	users.insert({
		user_id: "User 1",
		name: "Joel Ek"
	});
	users.insert({
		user_id: "User 2",
		name: "Joel A Z"
	});
	let observed = users.search("eks").map((record) => record.record.user_id);
	let expected = [] as Array<string>;
	assert.array.equals(observed, expected);
});

test(`It should return the correct search results when names are ["Joel A Z", "Joel Ek", "Joel A Z"] and query is "joel".`, async (assert) => {
	let { users, index } = { ...makeUsersSearchIndex() };
	users.insert({
		user_id: "User 0",
		name: "Joel A Z"
	});
	users.insert({
		user_id: "User 1",
		name: "Joel Ek"
	});
	users.insert({
		user_id: "User 2",
		name: "Joel A Z"
	});
	let observed = users.search("joel").map((record) => record.record.user_id);
	let expected = ["User 1", "User 0", "User 2"] as Array<string>;
	assert.array.equals(observed, expected);
});

test(`It should return the correct search results when names are ["Joel A Z", "Joel Ek", "Joel A Z"] and query is "joel e".`, async (assert) => {
	let { users, index } = { ...makeUsersSearchIndex() };
	users.insert({
		user_id: "User 0",
		name: "Joel A Z"
	});
	users.insert({
		user_id: "User 1",
		name: "Joel Ek"
	});
	users.insert({
		user_id: "User 2",
		name: "Joel A Z"
	});
	let observed = users.search("joel e").map((record) => record.record.user_id);
	let expected = ["User 1"] as Array<string>;
	assert.array.equals(observed, expected);
});

test(`It should return the correct search results when names are ["Joel A Z", "Joel Ek", "Joel A Z"] and query is "joel ek".`, async (assert) => {
	let { users, index } = { ...makeUsersSearchIndex() };
	users.insert({
		user_id: "User 0",
		name: "Joel A Z"
	});
	users.insert({
		user_id: "User 1",
		name: "Joel Ek"
	});
	users.insert({
		user_id: "User 2",
		name: "Joel A Z"
	});
	let observed = users.search("joel ek").map((record) => record.record.user_id);
	let expected = ["User 1"] as Array<string>;
	assert.array.equals(observed, expected);
});

test(`It should return the correct search results when names are ["Joel A Z", "Joel Ek", "Joel A Z"] and query is "joel eks".`, async (assert) => {
	let { users, index } = { ...makeUsersSearchIndex() };
	users.insert({
		user_id: "User 0",
		name: "Joel A Z"
	});
	users.insert({
		user_id: "User 1",
		name: "Joel Ek"
	});
	users.insert({
		user_id: "User 2",
		name: "Joel A Z"
	});
	let observed = users.search("joel eks").map((record) => record.record.user_id);
	let expected = [] as Array<string>;
	assert.array.equals(observed, expected);
});

test(`It should support anchored searches.`, async (assert) => {
	let { users, index } = { ...makeUsersSearchIndex() };
	users.insert({
		user_id: "User 0",
		name: "A"
	});
	users.insert({
		user_id: "User 1",
		name: "B"
	});
	users.insert({
		user_id: "User 2",
		name: "C"
	});
	let observed = users.search("", { user_id: "User 1" }).map((record) => record.record.user_id);
	let expected = ["User 2"] as Array<string>;
	assert.array.equals(observed, expected);
});

test(`It should return the correct search results when names are ["Aa Ab", "Aa"] and query is "a"`, async (assert) => {
	let { users, index } = { ...makeUsersSearchIndex() };
	users.insert({
		user_id: "User 0",
		name: "Aa Ab"
	});
	users.insert({
		user_id: "User 1",
		name: "Aa"
	});
	let observed = users.search("a").map((record) => record.record.user_id);
	let expected = ["User 1", "User 0"] as Array<string>;
	assert.array.equals(observed, expected);
});

test(`It should return the correct search results when names are ["Aa Az", "Aa"] and query is "a"`, async (assert) => {
	let { users, index } = { ...makeUsersSearchIndex() };
	users.insert({
		user_id: "User 0",
		name: "Aa Az"
	});
	users.insert({
		user_id: "User 1",
		name: "Aa"
	});
	let observed = users.search("a").map((record) => record.record.user_id);
	let expected = ["User 1", "User 0"] as Array<string>;
	assert.array.equals(observed, expected);
});

test(`It should return the correct search results when names are ["Aa Ab", "Ab"] and query is "a"`, async (assert) => {
	let { users, index } = { ...makeUsersSearchIndex() };
	users.insert({
		user_id: "User 0",
		name: "Aa Ab"
	});
	users.insert({
		user_id: "User 1",
		name: "Ab"
	});
	let observed = users.search("a").map((record) => record.record.user_id);
	let expected = ["User 1", "User 0"] as Array<string>;
	assert.array.equals(observed, expected);
});

test(`It should return the correct search results when names are ["Aa Az", "Ab"] and query is "a"`, async (assert) => {
	let { users, index } = { ...makeUsersSearchIndex() };
	users.insert({
		user_id: "User 0",
		name: "Aa Az"
	});
	users.insert({
		user_id: "User 1",
		name: "Ab"
	});
	let observed = users.search("a").map((record) => record.record.user_id);
	let expected = ["User 1", "User 0"] as Array<string>;
	assert.array.equals(observed, expected);
});

test(`It should return the correct search results when names are ["Aa Ab", "Az"] and query is "a"`, async (assert) => {
	let { users, index } = { ...makeUsersSearchIndex() };
	users.insert({
		user_id: "User 0",
		name: "Aa Ab"
	});
	users.insert({
		user_id: "User 1",
		name: "Az"
	});
	let observed = users.search("a").map((record) => record.record.user_id);
	let expected = ["User 1", "User 0"] as Array<string>;
	assert.array.equals(observed, expected);
});

test(`It should return the correct search results when names are ["Aa Az", "Az"] and query is "a"`, async (assert) => {
	let { users, index } = { ...makeUsersSearchIndex() };
	users.insert({
		user_id: "User 0",
		name: "Aa Az"
	});
	users.insert({
		user_id: "User 1",
		name: "Az"
	});
	let observed = users.search("a").map((record) => record.record.user_id);
	let expected = ["User 1", "User 0"] as Array<string>;
	assert.array.equals(observed, expected);
});

test(`It should not skip the entire category branch when the first candidate occurs before the first result in the same category.`, async (assert) => {
	let { users, index } = { ...makeUsersSearchIndex() };
	users.insert({
		user_id: "User 0",
		name: "a c"
	});
	users.insert({
		user_id: "User 1",
		name: "a b"
	});
	users.insert({
		user_id: "User 2",
		name: "a c"
	});
	let observed = users.search("b").map((record) => record.record.user_id);
	let expected = ["User 1"] as Array<string>;
	assert.array.equals(observed, expected);
});
/*
test(`It should not return the same result twice when multiple indices match the query.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	let fields = {
		user_id: new StringField(""),
		firstname: new StringField(""),
		lastname: new StringField("")
	};
	let keys = ["user_id"] as ["user_id"];
	let recordManager = new RecordManager(fields);
	let table = new Table(blockManager, {
		getKeyFromValue: (value) => {
			let buffer = blockManager.readBlock(value);
			let record = recordManager.decode(buffer);
			return recordManager.encodeKeys(keys, record);
		}
	});
	let indexOne = new SearchIndexManager(recordManager, blockManager, "firstname");
	let indexTwo = new SearchIndexManager(recordManager, blockManager, "lastname");
	let users = new StoreManager(blockManager, fields, keys, {}, table, [], [indexOne, indexTwo]);
	users.insert({
		user_id: "User 1",
		firstname: "Name",
		lastname: "Name"
	});
	let iterable = users.search("name");
	let observed = Array.from(iterable).map((record) => record.record.user_id);
	let expected = ["User 1"] as Array<string>;
	assert.array.equals(observed, expected);
});
 */
