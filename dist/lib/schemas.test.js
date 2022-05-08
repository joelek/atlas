"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const databases_1 = require("./databases");
const files_1 = require("./files");
const records_1 = require("./records");
const schemas_1 = require("./schemas");
const stores_1 = require("./stores");
const test_1 = require("./test");
(0, test_1.test)(`It should be able to construct a new database manager.`, async (assert) => {
    let file = new files_1.VirtualFile(0);
    let schemaManager = new schemas_1.SchemaManager();
    let databaseManager = schemaManager.createDatabaseManager(file, new databases_1.Database({
        users: new stores_1.Store({
            key: new records_1.StringField(""),
            name: new records_1.StringField("")
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
    assert.record.equals(observed, expected);
});
(0, test_1.test)(`It should be able to construct an existing database manager with an identical schema.`, async (assert) => {
    let file = new files_1.VirtualFile(0);
    let schemaManager = new schemas_1.SchemaManager();
    let databaseManager1 = schemaManager.createDatabaseManager(file, new databases_1.Database({
        users: new stores_1.Store({
            key: new records_1.StringField(""),
            name: new records_1.StringField("")
        }, ["key"], {})
    }));
    let stores1 = databaseManager1.createDatabaseStores();
    await stores1.users.insert({
        key: "0",
        name: "A"
    });
    let databaseManager2 = schemaManager.createDatabaseManager(file, new databases_1.Database({
        users: new stores_1.Store({
            key: new records_1.StringField(""),
            name: new records_1.StringField("")
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
    assert.record.equals(observed, expected);
});
(0, test_1.test)(`It should be able to construct an existing database manager when one field is added to the schema.`, async (assert) => {
    let file = new files_1.VirtualFile(0);
    let schemaManager = new schemas_1.SchemaManager();
    let databaseManager1 = schemaManager.createDatabaseManager(file, new databases_1.Database({
        users: new stores_1.Store({
            key: new records_1.StringField(""),
            name: new records_1.StringField("")
        }, ["key"], {})
    }));
    let stores1 = databaseManager1.createDatabaseStores();
    await stores1.users.insert({
        key: "0",
        name: "A"
    });
    let databaseManager2 = schemaManager.createDatabaseManager(file, new databases_1.Database({
        users: new stores_1.Store({
            key: new records_1.StringField(""),
            name: new records_1.StringField(""),
            lastname: new records_1.StringField("")
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
    assert.record.equals(observed, expected);
});
(0, test_1.test)(`It should be able to construct an existing database manager when one field is removed from the schema.`, async (assert) => {
    let file = new files_1.VirtualFile(0);
    let schemaManager = new schemas_1.SchemaManager();
    let databaseManager1 = schemaManager.createDatabaseManager(file, new databases_1.Database({
        users: new stores_1.Store({
            key: new records_1.StringField(""),
            name: new records_1.StringField(""),
            lastname: new records_1.StringField("")
        }, ["key"], {})
    }));
    let stores1 = databaseManager1.createDatabaseStores();
    await stores1.users.insert({
        key: "0",
        name: "A",
        lastname: "B"
    });
    let databaseManager2 = schemaManager.createDatabaseManager(file, new databases_1.Database({
        users: new stores_1.Store({
            key: new records_1.StringField(""),
            name: new records_1.StringField("")
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
    assert.record.equals(observed, expected);
});
(0, test_1.test)(`It should be able to construct an existing database manager when one field is changed in the schema.`, async (assert) => {
    let file = new files_1.VirtualFile(0);
    let schemaManager = new schemas_1.SchemaManager();
    let databaseManager1 = schemaManager.createDatabaseManager(file, new databases_1.Database({
        users: new stores_1.Store({
            key: new records_1.StringField(""),
            name: new records_1.StringField("")
        }, ["key"], {})
    }));
    let stores1 = databaseManager1.createDatabaseStores();
    await stores1.users.insert({
        key: "0",
        name: "A"
    });
    let databaseManager2 = schemaManager.createDatabaseManager(file, new databases_1.Database({
        users: new stores_1.Store({
            key: new records_1.StringField(""),
            name: new records_1.BooleanField(false)
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
    assert.record.equals(observed, expected);
});
(0, test_1.test)(`It should be able to construct an existing database manager when the keys have changed in the schema.`, async (assert) => {
    let file = new files_1.VirtualFile(0);
    let schemaManager = new schemas_1.SchemaManager();
    let databaseManager1 = schemaManager.createDatabaseManager(file, new databases_1.Database({
        users: new stores_1.Store({
            key: new records_1.StringField(""),
            name: new records_1.StringField("")
        }, ["key"], {})
    }));
    let stores1 = databaseManager1.createDatabaseStores();
    await stores1.users.insert({
        key: "0",
        name: "A"
    });
    let databaseManager2 = schemaManager.createDatabaseManager(file, new databases_1.Database({
        users: new stores_1.Store({
            key: new records_1.StringField(""),
            name: new records_1.StringField("")
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
    assert.record.equals(observed, expected);
});
