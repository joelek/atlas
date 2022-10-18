import * as wtf from "@joelek/wtf";
import { BlockManager } from "./blocks";
import { Database } from "./databases";
import { VirtualFile } from "./files";
import { StringField, BooleanField } from "./records";
import { SchemaManager } from "./schemas";
import { Store } from "./stores";

wtf.test(`It should be able to construct a new database manager.`, async (assert) => {
	let file = new VirtualFile(0);
	let blockManager = new BlockManager(file);
	let schemaManager = new SchemaManager();
	let databaseManager = schemaManager.createDatabaseManager(file, blockManager, new Database({
		users: new Store({
			key: new StringField(""),
			name: new StringField("")
		}, ["key"], {})
	}));
	let stores = databaseManager.createDatabaseStores();
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
	assert.equals(observed, expected);
});

wtf.test(`It should be able to construct an existing database manager with an identical schema.`, async (assert) => {
	let file = new VirtualFile(0);
	let blockManager = new BlockManager(file);
	let schemaManager = new SchemaManager();
	let databaseManager1 = schemaManager.createDatabaseManager(file, blockManager, new Database({
		users: new Store({
			key: new StringField(""),
			name: new StringField("")
		}, ["key"], {})
	}));
	let stores1 = databaseManager1.createDatabaseStores();
	await stores1.users.insert({
		key: "0",
		name: "A"
	});
	let databaseManager2 = schemaManager.createDatabaseManager(file, blockManager, new Database({
		users: new Store({
			key: new StringField(""),
			name: new StringField("")
		}, ["key"], {})
	}));
	let stores2 = databaseManager2.createDatabaseStores();
	let observed = await stores2.users.lookup({
		key: "0"
	});
	let expected = {
		key: "0",
		name: "A"
	};
	assert.equals(observed, expected);
});

wtf.test(`It should be able to construct an existing database manager when one field is added to the schema.`, async (assert) => {
	let file = new VirtualFile(0);
	let blockManager = new BlockManager(file);
	let schemaManager = new SchemaManager();
	let databaseManager1 = schemaManager.createDatabaseManager(file, blockManager, new Database({
		users: new Store({
			key: new StringField(""),
			name: new StringField("")
		}, ["key"], {})
	}));
	let stores1 = databaseManager1.createDatabaseStores();
	await stores1.users.insert({
		key: "0",
		name: "A"
	});
	let databaseManager2 = schemaManager.createDatabaseManager(file, blockManager, new Database({
		users: new Store({
			key: new StringField(""),
			name: new StringField(""),
			lastname: new StringField("")
		}, ["key"], {})
	}));
	let stores2 = databaseManager2.createDatabaseStores();
	let observed = await stores2.users.lookup({
		key: "0"
	});
	let expected = {
		key: "0",
		name: "A",
		lastname: ""
	};
	assert.equals(observed, expected);
});

wtf.test(`It should be able to construct an existing database manager when one field is removed from the schema.`, async (assert) => {
	let file = new VirtualFile(0);
	let blockManager = new BlockManager(file);
	let schemaManager = new SchemaManager();
	let databaseManager1 = schemaManager.createDatabaseManager(file, blockManager, new Database({
		users: new Store({
			key: new StringField(""),
			name: new StringField(""),
			lastname: new StringField("")
		}, ["key"], {})
	}));
	let stores1 = databaseManager1.createDatabaseStores();
	await stores1.users.insert({
		key: "0",
		name: "A",
		lastname: "B"
	});
	let databaseManager2 = schemaManager.createDatabaseManager(file, blockManager, new Database({
		users: new Store({
			key: new StringField(""),
			name: new StringField("")
		}, ["key"], {})
	}));
	let stores2 = databaseManager2.createDatabaseStores();
	let observed = await stores2.users.lookup({
		key: "0"
	});
	let expected = {
		key: "0",
		name: "A"
	};
	assert.equals(observed, expected);
});

wtf.test(`It should be able to construct an existing database manager when one field is changed in the schema.`, async (assert) => {
	let file = new VirtualFile(0);
	let blockManager = new BlockManager(file);
	let schemaManager = new SchemaManager();
	let databaseManager1 = schemaManager.createDatabaseManager(file, blockManager, new Database({
		users: new Store({
			key: new StringField(""),
			name: new StringField("")
		}, ["key"], {})
	}));
	let stores1 = databaseManager1.createDatabaseStores();
	await stores1.users.insert({
		key: "0",
		name: "A"
	});
	let databaseManager2 = schemaManager.createDatabaseManager(file, blockManager, new Database({
		users: new Store({
			key: new StringField(""),
			name: new BooleanField(false)
		}, ["key"], {})
	}));
	let stores2 = databaseManager2.createDatabaseStores();
	let observed = await stores2.users.lookup({
		key: "0"
	});
	let expected = {
		key: "0",
		name: false
	};
	assert.equals(observed, expected);
});

wtf.test(`It should be able to construct an existing database manager when the keys have changed in the schema.`, async (assert) => {
	let file = new VirtualFile(0);
	let blockManager = new BlockManager(file);
	let schemaManager = new SchemaManager();
	let databaseManager1 = schemaManager.createDatabaseManager(file, blockManager, new Database({
		users: new Store({
			key: new StringField(""),
			name: new StringField("")
		}, ["key"], {})
	}));
	let stores1 = databaseManager1.createDatabaseStores();
	await stores1.users.insert({
		key: "0",
		name: "A"
	});
	let databaseManager2 = schemaManager.createDatabaseManager(file, blockManager, new Database({
		users: new Store({
			key: new StringField(""),
			name: new StringField("")
		}, ["name"], {})
	}));
	let stores2 = databaseManager2.createDatabaseStores();
	let observed = await stores2.users.lookup({
		name: "A"
	});
	let expected = {
		key: "0",
		name: "A"
	};
	assert.equals(observed, expected);
});
