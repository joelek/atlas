import * as wtf from "@joelek/wtf";
import { Index, IndexManager, SearchIndexManager, Store, StoreManager } from "./stores";
import { IntegerField, NullableStringField, RecordManager, StringField } from "./records";
import { BlockManager } from "./blocks";
import { VirtualFile } from "./files";
import { EqualityFilter, GreaterThanFilter, LessThanFilter, LessThanOrEqualFilter } from "./filters";
import { IncreasingOrder, DecreasingOrder, Order } from "./orders";
import { benchmark } from "./test";
import { Table } from "./tables";
import { LinkManager } from "./links";

wtf.test(`It should support for-of iteration of the records stored.`, async (assert) => {
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
	assert.equals(observed, expected);
});

wtf.test(`It should support iteration of the records stored in increasing order.`, async (assert) => {
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
	assert.equals(observed, expected);
});

wtf.test(`It should support iteration of the records stored in decreasing order.`, async (assert) => {
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
	assert.equals(observed, expected);
});

wtf.test(`It should support filtering of the records stored.`, async (assert) => {
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
	assert.equals(observed, expected);
});

wtf.test(`It should support ordering of the records stored in increasing order.`, async (assert) => {
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
	assert.equals(observed, expected);
});

wtf.test(`It should support ordering of the records stored in decreasing order.`, async (assert) => {
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
	assert.equals(observed, expected);
});

wtf.test(`It should support ordering of the records stored in increasing order with an index.`, async (assert) => {
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
	assert.equals(observed, expected);
});

wtf.test(`It should support ordering of the records stored in decreasing order with an index.`, async (assert) => {
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
	assert.equals(observed, expected);
});

wtf.test(`It should support inserting a record previously inserted.`, async (assert) => {
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
	assert.equals(users.lookup({ key: "A" }).name, "One");
	users.insert({
		key: "A",
		name: "Two"
	});
	assert.equals(users.lookup({ key: "A" }).name, "Two");
});

wtf.test(`It should support inserting a record not previously inserted.`, async (assert) => {
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
	assert.equals(users.lookup({ key: "A" }).name, "One");
});

wtf.test(`It should keep track of the number of records stored.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	let users = StoreManager.construct(blockManager, {
		fields: {
			key: new StringField("")
		},
		keys: ["key"]
	});
	assert.equals(users.length(), 0);
	users.insert({
		key: "A"
	});
	assert.equals(users.length(), 1);
	users.insert({
		key: "B"
	});
	assert.equals(users.length(), 2);
	users.insert({
		key: "A"
	});
	assert.equals(users.length(), 2);
	users.remove({
		key: "B"
	});
	assert.equals(users.length(), 1);
	users.remove({
		key: "A"
	});
	assert.equals(users.length(), 0);
});

wtf.test(`It should support looking up records previously inserted.`, async (assert) => {
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
	assert.equals(users.lookup({ key: "A" }).key, "A");
});

wtf.test(`It should throw an error when looking up records not previously inserted.`, async (assert) => {
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

wtf.test(`It should support removing records previously inserted.`, async (assert) => {
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
	assert.equals(users.lookup({ key: "A" }).key, "A");
	users.remove({
		key: "A"
	});
	await assert.throws(async () => {
		users.lookup({
			key: "A"
		});
	});
});

wtf.test(`It should support removing records not previously inserted.`, async (assert) => {
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

wtf.test(`It should support updating a record previously inserted.`, async (assert) => {
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
	assert.equals(users.lookup({ key: "A" }).name, "One");
	users.update({
		key: "A",
		name: "Two"
	});
	assert.equals(users.lookup({ key: "A" }).name, "Two");
});

wtf.test(`It should support updating a record not previously inserted.`, async (assert) => {
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
	assert.equals(users.lookup({ key: "A" }).name, "One");
});

wtf.test(`It should support partially updating a record previously inserted.`, async (assert) => {
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
	assert.equals(users.lookup({ key: "A" }).name, "");
	users.update({
		key: "A",
		name: "Two"
	});
	assert.equals(users.lookup({ key: "A" }).name, "Two");
});

wtf.test(`It should support partially updating a record not previously inserted.`, async (assert) => {
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
	assert.equals(users.lookup({ key: "A" }).name, "");
});

wtf.test(`It should create the correct index for a store without orders.`, async (assert) => {
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
	assert.equals(observed, expected);
});

wtf.test(`It should create the correct index for a store with metadata field orders.`, async (assert) => {
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
	assert.equals(observed, expected);
});

wtf.test(`It should create the correct index for a store with identifying field orders.`, async (assert) => {
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
	assert.equals(observed, expected);
});

wtf.test(`It should create appropriate indices for a store with unique fields.`, async (assert) => {
	let users = new Store({
		user_id: new StringField(""),
		name: new StringField("", true)
	}, ["user_id"]);
	assert.equals(users.index(new Index(["name", "user_id"])), false);
});

wtf.test(`It should update indices on insert.`, async (assert) => {
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
	assert.equals(observed, expected);
});

wtf.test(`It should update indices on update.`, async (assert) => {
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
	assert.equals(observed, expected);
});

wtf.test(`It should update indices on remove.`, async (assert) => {
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
	assert.equals(observed, expected);
});

wtf.test(`It should not prevent unique fields from being stored with identical non-null values for the same record.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	let fields = {
		user_id: new StringField(""),
		name: new NullableStringField("", true)
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
	let users = new StoreManager(blockManager, fields, keys, {}, table, [], []);
	users.insert({
		user_id: "User 1",
		name: "Name 1"
	});
	users.insert({
		user_id: "User 1",
		name: "Name 1"
	});
});

wtf.test(`It should not prevent unique fields from being stored with null values for two different records.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	let fields = {
		user_id: new StringField(""),
		name: new NullableStringField("", true)
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
	let users = new StoreManager(blockManager, fields, keys, {}, table, [], []);
	users.insert({
		user_id: "User 1",
		name: null
	});
	users.insert({
		user_id: "User 2",
		name: null
	});
});

wtf.test(`It should prevent unique fields from being stored with identical non-null values for two different records.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	let fields = {
		user_id: new StringField(""),
		name: new NullableStringField("", true)
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
	let users = new StoreManager(blockManager, fields, keys, {}, table, [], []);
	users.insert({
		user_id: "User 1",
		name: "Name 1"
	});
	await assert.throws(async () => {
		users.insert({
			user_id: "User 2",
			name: "Name 1"
		});
	});
});

wtf.test(`It should use the optimal index when filtering with filters.`, async (assert) => {
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
		name: "Right Name"
	});
	usersOne.insert({
		user_id: "User 2",
		name: "Wrong Name"
	});
	let indexTwo = new IndexManager(recordManager, blockManager, ["name", "user_id"]);
	let usersTwo = new StoreManager(blockManager, fields, keys, {}, table, [indexTwo], []);
	usersTwo.insert({
		user_id: "User 1",
		name: "Wrong Name"
	});
	usersTwo.insert({
		user_id: "User 2",
		name: "Right Name"
	});
	let users = new StoreManager(blockManager, fields, keys, {}, table, [indexOne, indexTwo], []);
	let iterable = users.filter({
		name: new EqualityFilter("Right Name")
	});
	let observed = Array.from(iterable).map((record) => record.user_id);
	let expected = ["User 2"] as Array<string>;
	assert.equals(observed, expected);
});

wtf.test(`It should use the optimal index when filtering with filters and orders`, async (assert) => {
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
		name: "Right Name"
	});
	usersOne.insert({
		user_id: "User 2",
		name: "Wrong Name"
	});
	let indexTwo = new IndexManager(recordManager, blockManager, ["name", "user_id"]);
	let usersTwo = new StoreManager(blockManager, fields, keys, {}, table, [indexTwo], []);
	usersTwo.insert({
		user_id: "User 1",
		name: "Wrong Name"
	});
	usersTwo.insert({
		user_id: "User 2",
		name: "Right Name"
	});
	let users = new StoreManager(blockManager, fields, keys, {}, table, [indexOne, indexTwo], []);
	let iterable = users.filter({
		name: new EqualityFilter("Right Name")
	});
	let observed = Array.from(iterable).map((record) => record.user_id);
	let expected = ["User 2"] as Array<string>;
	assert.equals(observed, expected);
});

wtf.test(`It should support anchored filtering of the records stored in increasing order.`, async (assert) => {
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
	assert.equals(observed, expected);
});

wtf.test(`It should support anchored filtering of the records stored in increasing order with an index.`, async (assert) => {
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
	assert.equals(observed, expected);
});

wtf.test(`It should support anchored filtering of the records stored in decreasing order.`, async (assert) => {
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
	assert.equals(observed, expected);
});

wtf.test(`It should support anchored filtering of the records stored in decreasing order with an index.`, async (assert) => {
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
	assert.equals(observed, expected);
});

wtf.test(`It should support anchored filtering of the records through a self-referencing link in increasing order with an index.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	let directories = StoreManager.construct(blockManager, {
		fields: {
			directory_id: new StringField(""),
			parent_directory_id: new NullableStringField(""),
			name: new StringField("")
		},
		keys: ["directory_id"],
		indices: [
			new Index(["parent_directory_id", "name", "directory_id"])
		]
	});
	let directory_directories = LinkManager.construct(directories, directories, {
		directory_id: "parent_directory_id"
	}, {
		name: new IncreasingOrder()
	});
	directories.insert({
		directory_id: "2",
		parent_directory_id: null,
		name: "A"
	});
	directories.insert({
		directory_id: "3",
		parent_directory_id: null,
		name: "B"
	});
	directories.insert({
		directory_id: "1",
		parent_directory_id: null,
		name: "C"
	});
	let records = [] as ReturnType<typeof directory_directories["filter"]>;
	while (true) {
		let batch = directory_directories.filter(undefined, records[records.length - 1], 1);
		if (batch.length === 0) {
			break;
		}
		records.push(...batch);
	}
	assert.equals(records.map((record) => record.name), ["A", "B", "C"]);
});

wtf.test(`It should perform significantly better with a suitable index.`, async (assert) => {
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
	assert.equals(averageOne * 100 < averageTwo, true);
});

wtf.test(`It should perform equally good when there are two suitable indices.`, async (assert) => {
	let blockManager = new BlockManager(new VirtualFile(0));
	let tracks = StoreManager.construct(blockManager, {
		fields: {
			track_id: new StringField("")
		},
		keys: ["track_id"],
		indices: [
			new Index(["track_id"])
		]
	});
	let files = StoreManager.construct(blockManager, {
		fields: {
			file_id: new StringField("")
		},
		keys: ["file_id"],
		indices: [
			new Index(["file_id"])
		]
	});
	let track_files = StoreManager.construct(blockManager, {
		fields: {
			track_id: new StringField(""),
			file_id: new StringField("")
		},
		keys: ["track_id", "file_id"],
		indices: [
			new Index(["track_id", "file_id"]),
			new Index(["file_id", "track_id"])
		]
	});
	let track_track_files = LinkManager.construct(tracks, track_files, {
		track_id: "track_id"
	});
	let file_track_files = LinkManager.construct(files, track_files, {
		file_id: "file_id"
	});
	for (let i = 0; i < 1000; i++) {
		tracks.insert({
			track_id: `Track ${i}`
		});
		files.insert({
			file_id: `File ${i}`
		});
		track_files.insert({
			track_id: `Track ${i}`,
			file_id: `File ${i}`
		});
	}
	let averageOne = await benchmark(() => {
		track_track_files.filter({
			track_id: "Track 500"
		});
	});
	let averageTwo = await benchmark(() => {
		file_track_files.filter({
			file_id: "File 500"
		});
	});
	let min = Math.min(averageOne, averageTwo);
	let max = Math.max(averageOne, averageTwo);
	assert.equals(min * 2 >= max, true);
});

wtf.test(`It should prevent identical records from being re-indexed.`, async (assert) => {
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
	assert.equals(Number.isInteger(Math.log2(recordManager.encode(record).length)), false);
	users.insert(record);
	assert.equals(Array.from(index).map((user) => user.user_id), ["User 1"]);
	index.remove(record);
	assert.equals(Array.from(index).map((user) => user.user_id), []);
	users.insert(record);
	assert.equals(Array.from(index).map((user) => user.user_id), []);
});

wtf.test(`It should support vacating.`, async (assert) => {
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
	assert.equals(observed, expected);
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

wtf.test(`It should update search indices on insert.`, async (assert) => {
	let { users, index } = { ...makeUsersSearchIndex() };
	users.insert({
		user_id: "User 1",
		name: "Name 1"
	});
	let observed = Array.from(index).map((record) => record.record.name);
	let expected = ["Name 1"];
	assert.equals(observed, expected);
});

wtf.test(`It should update search indices on update.`, async (assert) => {
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
	assert.equals(observed, expected);
});

wtf.test(`It should update search indices on remove.`, async (assert) => {
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
	assert.equals(observed, expected);
});

wtf.test(`It should return the correct search results when names are ["Ek"] and query is "".`, async (assert) => {
	let { users, index } = { ...makeUsersSearchIndex() };
	users.insert({
		user_id: "User 1",
		name: "Ek"
	});
	let observed = users.search("").map((record) => record.record.user_id);
	let expected = ["User 1"];
	assert.equals(observed, expected);
});

wtf.test(`It should return the correct search results when names are ["Ek"] and query is "e".`, async (assert) => {
	let { users, index } = { ...makeUsersSearchIndex() };
	users.insert({
		user_id: "User 1",
		name: "Ek"
	});
	let observed = users.search("e").map((record) => record.record.user_id);
	let expected = ["User 1"];
	assert.equals(observed, expected);
});

wtf.test(`It should return the correct search results when names are ["Ek"] and query is "ek".`, async (assert) => {
	let { users, index } = { ...makeUsersSearchIndex() };
	users.insert({
		user_id: "User 1",
		name: "Ek"
	});
	let observed = users.search("ek").map((record) => record.record.user_id);
	let expected = ["User 1"];
	assert.equals(observed, expected);
});

wtf.test(`It should return the correct search results when names are ["Ek"] and query is "eks".`, async (assert) => {
	let { users, index } = { ...makeUsersSearchIndex() };
	users.insert({
		user_id: "User 1",
		name: "Ek"
	});
	let observed = users.search("eks").map((record) => record.record.user_id);
	let expected = [] as Array<string>;
	assert.equals(observed, expected);
});

wtf.test(`It should return the correct search results when names are ["Joel Ek"] and query is "".`, async (assert) => {
	let { users, index } = { ...makeUsersSearchIndex() };
	users.insert({
		user_id: "User 1",
		name: "Joel Ek"
	});
	let observed = users.search("").map((record) => record.record.user_id);
	let expected = ["User 1"] as Array<string>;
	assert.equals(observed, expected);
});

wtf.test(`It should return the correct search results when names are ["Joel Ek"] and query is "e".`, async (assert) => {
	let { users, index } = { ...makeUsersSearchIndex() };
	users.insert({
		user_id: "User 1",
		name: "Joel Ek"
	});
	let observed = users.search("e").map((record) => record.record.user_id);
	let expected = ["User 1"] as Array<string>;
	assert.equals(observed, expected);
});

wtf.test(`It should return the correct search results when names are ["Joel Ek"] and query is "ek".`, async (assert) => {
	let { users, index } = { ...makeUsersSearchIndex() };
	users.insert({
		user_id: "User 1",
		name: "Joel Ek"
	});
	let observed = users.search("ek").map((record) => record.record.user_id);
	let expected = ["User 1"] as Array<string>;
	assert.equals(observed, expected);
});

wtf.test(`It should return the correct search results when names are ["Joel Ek"] and query is "eks".`, async (assert) => {
	let { users, index } = { ...makeUsersSearchIndex() };
	users.insert({
		user_id: "User 1",
		name: "Joel Ek"
	});
	let observed = users.search("eks").map((record) => record.record.user_id);
	let expected = [] as Array<string>;
	assert.equals(observed, expected);
});

wtf.test(`It should return the correct search results when names are ["Joel Ek"] and query is "joel".`, async (assert) => {
	let { users, index } = { ...makeUsersSearchIndex() };
	users.insert({
		user_id: "User 1",
		name: "Joel Ek"
	});
	let observed = users.search("joel").map((record) => record.record.user_id);
	let expected = ["User 1"] as Array<string>;
	assert.equals(observed, expected);
});

wtf.test(`It should return the correct search results when names are ["Joel Ek"] and query is "joel ek".`, async (assert) => {
	let { users, index } = { ...makeUsersSearchIndex() };
	users.insert({
		user_id: "User 1",
		name: "Joel Ek"
	});
	let observed = users.search("joel ek").map((record) => record.record.user_id);
	let expected = ["User 1"] as Array<string>;
	assert.equals(observed, expected);
});

wtf.test(`It should return the correct search results when names are ["Joel Ek"] and query is "ek joel".`, async (assert) => {
	let { users, index } = { ...makeUsersSearchIndex() };
	users.insert({
		user_id: "User 1",
		name: "Joel Ek"
	});
	let observed = users.search("ek joel").map((record) => record.record.user_id);
	let expected = ["User 1"] as Array<string>;
	assert.equals(observed, expected);
});

wtf.test(`It should return the correct search results when names are ["Joel Ek"] and query is "joel eks".`, async (assert) => {
	let { users, index } = { ...makeUsersSearchIndex() };
	users.insert({
		user_id: "User 1",
		name: "Joel Ek"
	});
	let observed = users.search("joel eks").map((record) => record.record.user_id);
	let expected = [] as Array<string>;
	assert.equals(observed, expected);
});

wtf.test(`It should return the correct search results when names are ["Joel Ek"] and query is "joels ek".`, async (assert) => {
	let { users, index } = { ...makeUsersSearchIndex() };
	users.insert({
		user_id: "User 1",
		name: "Joel Ek"
	});
	let observed = users.search("joels ek").map((record) => record.record.user_id);
	let expected = [] as Array<string>;
	assert.equals(observed, expected);
});

wtf.test(`It should return the correct search results when names are ["Joel A Z", "Joel Ek", "Joel A Z"] and query is "".`, async (assert) => {
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
	assert.equals(observed, expected);
});

wtf.test(`It should return the correct search results when names are ["Joel A Z", "Joel Ek", "Joel A Z"] and query is "e".`, async (assert) => {
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
	assert.equals(observed, expected);
});

wtf.test(`It should return the correct search results when names are ["Joel A Z", "Joel Ek", "Joel A Z"] and query is "ek".`, async (assert) => {
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
	assert.equals(observed, expected);
});

wtf.test(`It should return the correct search results when names are ["Joel A Z", "Joel Ek", "Joel A Z"] and query is "eks".`, async (assert) => {
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
	assert.equals(observed, expected);
});

wtf.test(`It should return the correct search results when names are ["Joel A Z", "Joel Ek", "Joel A Z"] and query is "joel".`, async (assert) => {
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
	assert.equals(observed, expected);
});

wtf.test(`It should return the correct search results when names are ["Joel A Z", "Joel Ek", "Joel A Z"] and query is "joel e".`, async (assert) => {
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
	assert.equals(observed, expected);
});

wtf.test(`It should return the correct search results when names are ["Joel A Z", "Joel Ek", "Joel A Z"] and query is "joel ek".`, async (assert) => {
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
	assert.equals(observed, expected);
});

wtf.test(`It should return the correct search results when names are ["Joel A Z", "Joel Ek", "Joel A Z"] and query is "joel eks".`, async (assert) => {
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
	assert.equals(observed, expected);
});

wtf.test(`It should support anchored searches.`, async (assert) => {
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
	assert.equals(observed, expected);
});

wtf.test(`It should return the correct search results when names are ["Aa Ab", "Aa"] and query is "a"`, async (assert) => {
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
	assert.equals(observed, expected);
});

wtf.test(`It should return the correct search results when names are ["Aa Az", "Aa"] and query is "a"`, async (assert) => {
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
	assert.equals(observed, expected);
});

wtf.test(`It should return the correct search results when names are ["Aa Ab", "Ab"] and query is "a"`, async (assert) => {
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
	assert.equals(observed, expected);
});

wtf.test(`It should return the correct search results when names are ["Aa Az", "Ab"] and query is "a"`, async (assert) => {
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
	assert.equals(observed, expected);
});

wtf.test(`It should return the correct search results when names are ["Aa Ab", "Az"] and query is "a"`, async (assert) => {
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
	assert.equals(observed, expected);
});

wtf.test(`It should return the correct search results when names are ["Aa Az", "Az"] and query is "a"`, async (assert) => {
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
	assert.equals(observed, expected);
});

wtf.test(`It should not skip the entire category branch when the first candidate occurs before the first result in the same category.`, async (assert) => {
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
	assert.equals(observed, expected);
});

wtf.test(`It should not return the same result twice when multiple indices match the query and the ranks are 0 and 0.`, async (assert) => {
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
	assert.equals(observed, expected);
});

wtf.test(`It should not return the same result twice when multiple indices match the query and the ranks are -1 and 0.`, async (assert) => {
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
		firstname: "Name Additional",
		lastname: "Name"
	});
	let iterable = users.search("name");
	let observed = Array.from(iterable).map((record) => record.record.user_id);
	let expected = ["User 1"] as Array<string>;
	assert.equals(observed, expected);
});

wtf.test(`It should not return the same result twice when multiple indices match the query and the ranks are 0 and -1.`, async (assert) => {
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
		lastname: "Name Additional"
	});
	let iterable = users.search("name");
	let observed = Array.from(iterable).map((record) => record.record.user_id);
	let expected = ["User 1"] as Array<string>;
	assert.equals(observed, expected);
});

wtf.test(`It should support filtering of the records stored when there is an index on the key.`, async (assert) => {
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
		key: "AA"
	});
	let iterable = users.filter({
		key: new EqualityFilter("A")
	});
	let observed = Array.from(iterable).map((entry) => entry.key);
	let expected = ["A"];
	assert.equals(observed, expected);
});

function createUsersStore(indices: Array<Index<{ key: string, value: number }>>) {
	let blockManager = new BlockManager(new VirtualFile(0));
	let users = StoreManager.construct(blockManager, {
		fields: {
			key: new StringField(""),
			value: new IntegerField(0)
		},
		keys: ["key"],
		indices: indices
	});
	users.insert({
		key: "A",
		value: 2
	});
	users.insert({
		key: "B",
		value: 1
	});
	users.insert({
		key: "C",
		value: 5
	});
	users.insert({
		key: "D",
		value: 3
	});
	users.insert({
		key: "E",
		value: 4
	});
	return users;
};

const USERS_INDICES: Array<Array<Index<{ key: string, value: number }>>> = [
	[],
	[
		// Not technically a valid index since key is missing meaning that only a single record may be stored for each distinct value.
		new Index(["value"])
	],
	[
		new Index(["key"])
	],
	[
		new Index(["value", "key"])
	],
	[
		new Index(["key", "value"])
	]
];

for (let indices of USERS_INDICES) {
	wtf.test(`It should support filtering the records in increasing key order using a greater than filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
		let users = createUsersStore(indices);
		let iterable = users.filter({
			value: new GreaterThanFilter(1)
		}, {
			key: new IncreasingOrder()
		});
		let observed = Array.from(iterable).map((entry) => entry.key);
		let expected = ["A", "C", "D", "E"];
		assert.equals(observed, expected);
	});

	wtf.test(`It should support anchored filtering of the records in increasing key order using a greater than filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
		let users = createUsersStore(indices);
		let iterable = users.filter({
			value: new GreaterThanFilter(1)
		}, {
			key: new IncreasingOrder()
		}, {
			key: "A"
		});
		let observed = Array.from(iterable).map((entry) => entry.key);
		let expected = ["C", "D", "E"];
		assert.equals(observed, expected);
	});

	wtf.test(`It should support filtering the records in increasing value order using a greater than filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
		let users = createUsersStore(indices);
		let iterable = users.filter({
			value: new GreaterThanFilter(1)
		}, {
			value: new IncreasingOrder()
		});
		let observed = Array.from(iterable).map((entry) => entry.key);
		let expected = ["A", "D", "E", "C"];
		assert.equals(observed, expected);
	});

	wtf.test(`It should support anchored filtering of the records in increasing value order using a greater than filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
		let users = createUsersStore(indices);
		let iterable = users.filter({
			value: new GreaterThanFilter(1)
		}, {
			value: new IncreasingOrder()
		}, {
			key: "A"
		});
		let observed = Array.from(iterable).map((entry) => entry.key);
		let expected = ["D", "E", "C"];
		assert.equals(observed, expected);
	});

	wtf.test(`It should support filtering the records in decreasing key order using a greater than filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
		let users = createUsersStore(indices);
		let iterable = users.filter({
			value: new GreaterThanFilter(1)
		}, {
			key: new DecreasingOrder()
		});
		let observed = Array.from(iterable).map((entry) => entry.key);
		let expected = ["E", "D", "C", "A"];
		assert.equals(observed, expected);
	});

	wtf.test(`It should support anchored filtering of the records in decreasing key order using a greater than filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
		let users = createUsersStore(indices);
		let iterable = users.filter({
			value: new GreaterThanFilter(1)
		}, {
			key: new DecreasingOrder()
		}, {
			key: "E"
		});
		let observed = Array.from(iterable).map((entry) => entry.key);
		let expected = ["D", "C", "A"];
		assert.equals(observed, expected);
	});

	wtf.test(`It should support filtering the records in decreasing value order using a greater than filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
		let users = createUsersStore(indices);
		let iterable = users.filter({
			value: new GreaterThanFilter(1)
		}, {
			value: new DecreasingOrder()
		});
		let observed = Array.from(iterable).map((entry) => entry.key);
		let expected = ["C", "E", "D", "A"];
		assert.equals(observed, expected);
	});

	wtf.test(`It should support anchored filtering of the records in decreasing value order using a greater than filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
		let users = createUsersStore(indices);
		let iterable = users.filter({
			value: new GreaterThanFilter(1)
		}, {
			value: new DecreasingOrder()
		}, {
			key: "C"
		});
		let observed = Array.from(iterable).map((entry) => entry.key);
		let expected = ["E", "D", "A"];
		assert.equals(observed, expected);
	});

	wtf.test(`It should support filtering the records in increasing key order using a less than filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
		let users = createUsersStore(indices);
		let iterable = users.filter({
			value: new LessThanFilter(5)
		}, {
			key: new IncreasingOrder()
		});
		let observed = Array.from(iterable).map((entry) => entry.key);
		let expected = ["A", "B", "D", "E"];
		assert.equals(observed, expected);
	});

	wtf.test(`It should support anchored filtering of the records in increasing key order using a less than filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
		let users = createUsersStore(indices);
		let iterable = users.filter({
			value: new LessThanFilter(5)
		}, {
			key: new IncreasingOrder()
		}, {
			key: "A"
		});
		let observed = Array.from(iterable).map((entry) => entry.key);
		let expected = ["B", "D", "E"];
		assert.equals(observed, expected);
	});

	wtf.test(`It should support filtering the records in increasing value order using a less than filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
		let users = createUsersStore(indices);
		let iterable = users.filter({
			value: new LessThanFilter(5)
		}, {
			value: new IncreasingOrder()
		});
		let observed = Array.from(iterable).map((entry) => entry.key);
		let expected = ["B", "A", "D", "E"];
		assert.equals(observed, expected);
	});

	wtf.test(`It should support anchored filtering of the records in increasing value order using a less than filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
		let users = createUsersStore(indices);
		let iterable = users.filter({
			value: new LessThanFilter(5)
		}, {
			value: new IncreasingOrder()
		}, {
			key: "B"
		});
		let observed = Array.from(iterable).map((entry) => entry.key);
		let expected = ["A", "D", "E"];
		assert.equals(observed, expected);
	});

	wtf.test(`It should support filtering the records in decreasing key order using a less than filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
		let users = createUsersStore(indices);
		let iterable = users.filter({
			value: new LessThanFilter(5)
		}, {
			key: new DecreasingOrder()
		});
		let observed = Array.from(iterable).map((entry) => entry.key);
		let expected = ["E", "D", "B", "A"];
		assert.equals(observed, expected);
	});

	wtf.test(`It should support anchored filtering of the records in decreasing key order using a less than filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
		let users = createUsersStore(indices);
		let iterable = users.filter({
			value: new LessThanFilter(5)
		}, {
			key: new DecreasingOrder()
		}, {
			key: "E"
		});
		let observed = Array.from(iterable).map((entry) => entry.key);
		let expected = ["D", "B", "A"];
		assert.equals(observed, expected);
	});

	wtf.test(`It should support filtering the records in decreasing value order using a less than filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
		let users = createUsersStore(indices);
		let iterable = users.filter({
			value: new LessThanFilter(5)
		}, {
			value: new DecreasingOrder()
		});
		let observed = Array.from(iterable).map((entry) => entry.key);
		let expected = ["E", "D", "A", "B"];
		assert.equals(observed, expected);
	});

	wtf.test(`It should support anchored filtering of the records in decreasing value order using a less than filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
		let users = createUsersStore(indices);
		let iterable = users.filter({
			value: new LessThanFilter(5)
		}, {
			value: new DecreasingOrder()
		}, {
			key: "E"
		});
		let observed = Array.from(iterable).map((entry) => entry.key);
		let expected = ["D", "A", "B"];
		assert.equals(observed, expected);
	});

	wtf.test(`It should support filtering the records in increasing key order using a less than or equal filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
		let users = createUsersStore(indices);
		let iterable = users.filter({
			value: new LessThanOrEqualFilter(4)
		}, {
			key: new IncreasingOrder()
		});
		let observed = Array.from(iterable).map((entry) => entry.key);
		let expected = ["A", "B", "D", "E"];
		assert.equals(observed, expected);
	});

	wtf.test(`It should support anchored filtering of the records in increasing key order using a less than or equal filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
		let users = createUsersStore(indices);
		let iterable = users.filter({
			value: new LessThanOrEqualFilter(4)
		}, {
			key: new IncreasingOrder()
		}, {
			key: "A"
		});
		let observed = Array.from(iterable).map((entry) => entry.key);
		let expected = ["B", "D", "E"];
		assert.equals(observed, expected);
	});

	wtf.test(`It should support filtering the records in increasing value order using a less than or equal filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
		let users = createUsersStore(indices);
		let iterable = users.filter({
			value: new LessThanOrEqualFilter(4)
		}, {
			value: new IncreasingOrder()
		});
		let observed = Array.from(iterable).map((entry) => entry.key);
		let expected = ["B", "A", "D", "E"];
		assert.equals(observed, expected);
	});

	wtf.test(`It should support anchored filtering of the records in increasing value order using a less than or equal filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
		let users = createUsersStore(indices);
		let iterable = users.filter({
			value: new LessThanOrEqualFilter(4)
		}, {
			value: new IncreasingOrder()
		}, {
			key: "B"
		});
		let observed = Array.from(iterable).map((entry) => entry.key);
		let expected = ["A", "D", "E"];
		assert.equals(observed, expected);
	});

	wtf.test(`It should support filtering the records in decreasing key order using a less than or equal filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
		let users = createUsersStore(indices);
		let iterable = users.filter({
			value: new LessThanOrEqualFilter(4)
		}, {
			key: new DecreasingOrder()
		});
		let observed = Array.from(iterable).map((entry) => entry.key);
		let expected = ["E", "D", "B", "A"];
		assert.equals(observed, expected);
	});

	wtf.test(`It should support anchored filtering of the records in decreasing key order using a less than or equal filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
		let users = createUsersStore(indices);
		let iterable = users.filter({
			value: new LessThanOrEqualFilter(4)
		}, {
			key: new DecreasingOrder()
		}, {
			key: "E"
		});
		let observed = Array.from(iterable).map((entry) => entry.key);
		let expected = ["D", "B", "A"];
		assert.equals(observed, expected);
	});

	wtf.test(`It should support filtering the records in decreasing value order using a less than or equal filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
		let users = createUsersStore(indices);
		let iterable = users.filter({
			value: new LessThanOrEqualFilter(4)
		}, {
			value: new DecreasingOrder()
		});
		let observed = Array.from(iterable).map((entry) => entry.key);
		let expected = ["E", "D", "A", "B"];
		assert.equals(observed, expected);
	});

	wtf.test(`It should support anchored filtering of the records in decreasing value order using a less than or equal filter when indices are ${JSON.stringify(indices.map((index) => index.keys))}.`, async (assert) => {
		let users = createUsersStore(indices);
		let iterable = users.filter({
			value: new LessThanOrEqualFilter(4)
		}, {
			value: new DecreasingOrder()
		}, {
			key: "E"
		});
		let observed = Array.from(iterable).map((entry) => entry.key);
		let expected = ["D", "A", "B"];
		assert.equals(observed, expected);
	});
}
