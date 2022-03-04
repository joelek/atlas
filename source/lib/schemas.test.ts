import { Database } from "./database";
import { VirtualFile } from "./files";
import { StringField, BooleanField } from "./records";
import { SchemaManager } from "./schemas";
import { Store } from "./stores";
import { test } from "./test";

test(`It should be able to construct a new database manager.`, async (assert) => {
	let file = new VirtualFile(0);
	let schemaManager = new SchemaManager();
	let databaseManager = schemaManager.createDatabaseManager(file, new Database({
		users: new Store({
			key: new StringField(""),
			name: new StringField("")
		}, ["key"])
	}));
	let stores = databaseManager.createWritableStores();
	await stores.users.insert({
		key: "0",
		name: "A"
	});
	let observed = await stores.users.lookup({
		key: "0"
	});
	let expected = {
		key: "0",
		name: "A"
	};
	assert.record.equals(observed, expected);
});

test(`It should be able to construct an existing database manager with an identical schema.`, async (assert) => {
	let file = new VirtualFile(0);
	let schemaManager = new SchemaManager();
	let databaseManager1 = schemaManager.createDatabaseManager(file, new Database({
		users: new Store({
			key: new StringField(""),
			name: new StringField("")
		}, ["key"])
	}));
	let stores1 = databaseManager1.createWritableStores();
	await stores1.users.insert({
		key: "0",
		name: "A"
	});
	let databaseManager2 = schemaManager.createDatabaseManager(file, new Database({
		users: new Store({
			key: new StringField(""),
			name: new StringField("")
		}, ["key"])
	}));
	let stores2 = databaseManager2.createWritableStores();
	let observed = await stores2.users.lookup({
		key: "0"
	});
	let expected = {
		key: "0",
		name: "A"
	};
	assert.record.equals(observed, expected);
});

test(`It should be able to construct an existing database manager when one field is added to the schema.`, async (assert) => {
	let file = new VirtualFile(0);
	let schemaManager = new SchemaManager();
	let databaseManager1 = schemaManager.createDatabaseManager(file, new Database({
		users: new Store({
			key: new StringField(""),
			name: new StringField("")
		}, ["key"])
	}));
	let stores1 = databaseManager1.createWritableStores();
	await stores1.users.insert({
		key: "0",
		name: "A"
	});
	let databaseManager2 = schemaManager.createDatabaseManager(file, new Database({
		users: new Store({
			key: new StringField(""),
			name: new StringField(""),
			lastname: new StringField("")
		}, ["key"])
	}));
	let stores2 = databaseManager2.createWritableStores();
	let observed = await stores2.users.lookup({
		key: "0"
	});
	let expected = {
		key: "0",
		name: "A",
		lastname: ""
	};
	assert.record.equals(observed, expected);
});

test(`It should be able to construct an existing database manager when one field is removed from the schema.`, async (assert) => {
	let file = new VirtualFile(0);
	let schemaManager = new SchemaManager();
	let databaseManager1 = schemaManager.createDatabaseManager(file, new Database({
		users: new Store({
			key: new StringField(""),
			name: new StringField(""),
			lastname: new StringField("")
		}, ["key"])
	}));
	let stores1 = databaseManager1.createWritableStores();
	await stores1.users.insert({
		key: "0",
		name: "A",
		lastname: "B"
	});
	let databaseManager2 = schemaManager.createDatabaseManager(file, new Database({
		users: new Store({
			key: new StringField(""),
			name: new StringField("")
		}, ["key"])
	}));
	let stores2 = databaseManager2.createWritableStores();
	let observed = await stores2.users.lookup({
		key: "0"
	});
	let expected = {
		key: "0",
		name: "A"
	};
	assert.record.equals(observed, expected);
});

test(`It should be able to construct an existing database manager when one field is changed in the schema.`, async (assert) => {
	let file = new VirtualFile(0);
	let schemaManager = new SchemaManager();
	let databaseManager1 = schemaManager.createDatabaseManager(file, new Database({
		users: new Store({
			key: new StringField(""),
			name: new StringField("")
		}, ["key"])
	}));
	let stores1 = databaseManager1.createWritableStores();
	await stores1.users.insert({
		key: "0",
		name: "A"
	});
	let databaseManager2 = schemaManager.createDatabaseManager(file, new Database({
		users: new Store({
			key: new StringField(""),
			name: new BooleanField(false)
		}, ["key"])
	}));
	let stores2 = databaseManager2.createWritableStores();
	let observed = await stores2.users.lookup({
		key: "0"
	});
	let expected = {
		key: "0",
		name: false
	};
	assert.record.equals(observed, expected);
});

test(`It should be able to construct an existing database manager when the keys have changed in the schema.`, async (assert) => {
	let file = new VirtualFile(0);
	let schemaManager = new SchemaManager();
	let databaseManager1 = schemaManager.createDatabaseManager(file, new Database({
		users: new Store({
			key: new StringField(""),
			name: new StringField("")
		}, ["key"])
	}));
	let stores1 = databaseManager1.createWritableStores();
	await stores1.users.insert({
		key: "0",
		name: "A"
	});
	let databaseManager2 = schemaManager.createDatabaseManager(file, new Database({
		users: new Store({
			key: new StringField(""),
			name: new StringField("")
		}, ["name"])
	}));
	let stores2 = databaseManager2.createWritableStores();
	let observed = await stores2.users.lookup({
		name: "A"
	});
	let expected = {
		key: "0",
		name: "A"
	};
	assert.record.equals(observed, expected);
});
