"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const wtf = require("@joelek/wtf");
const blocks_1 = require("./blocks");
const databases_1 = require("./databases");
const files_1 = require("./files");
const records_1 = require("./records");
const schemas_1 = require("./schemas");
const stores_1 = require("./stores");
wtf.test(`It should be able to construct a new database manager.`, async (assert) => {
    let file = new files_1.VirtualFile(0);
    let blockManager = new blocks_1.BlockManager(file);
    let schemaManager = new schemas_1.SchemaManager();
    let databaseManager = schemaManager.createDatabaseManager(file, blockManager, new databases_1.Database({
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
    assert.equals(observed, expected);
});
wtf.test(`It should be able to construct an existing database manager with an identical schema.`, async (assert) => {
    let file = new files_1.VirtualFile(0);
    let blockManager = new blocks_1.BlockManager(file);
    let schemaManager = new schemas_1.SchemaManager();
    let databaseManager1 = schemaManager.createDatabaseManager(file, blockManager, new databases_1.Database({
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
    let databaseManager2 = schemaManager.createDatabaseManager(file, blockManager, new databases_1.Database({
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
    assert.equals(observed, expected);
});
wtf.test(`It should be able to construct an existing database manager when one field is added to the schema.`, async (assert) => {
    let file = new files_1.VirtualFile(0);
    let blockManager = new blocks_1.BlockManager(file);
    let schemaManager = new schemas_1.SchemaManager();
    let databaseManager1 = schemaManager.createDatabaseManager(file, blockManager, new databases_1.Database({
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
    let databaseManager2 = schemaManager.createDatabaseManager(file, blockManager, new databases_1.Database({
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
    assert.equals(observed, expected);
});
wtf.test(`It should be able to construct an existing database manager when one field is removed from the schema.`, async (assert) => {
    let file = new files_1.VirtualFile(0);
    let blockManager = new blocks_1.BlockManager(file);
    let schemaManager = new schemas_1.SchemaManager();
    let databaseManager1 = schemaManager.createDatabaseManager(file, blockManager, new databases_1.Database({
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
    let databaseManager2 = schemaManager.createDatabaseManager(file, blockManager, new databases_1.Database({
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
    assert.equals(observed, expected);
});
wtf.test(`It should be able to construct an existing database manager when one field is changed in the schema.`, async (assert) => {
    let file = new files_1.VirtualFile(0);
    let blockManager = new blocks_1.BlockManager(file);
    let schemaManager = new schemas_1.SchemaManager();
    let databaseManager1 = schemaManager.createDatabaseManager(file, blockManager, new databases_1.Database({
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
    let databaseManager2 = schemaManager.createDatabaseManager(file, blockManager, new databases_1.Database({
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
    assert.equals(observed, expected);
});
wtf.test(`It should be able to construct an existing database manager when the keys have changed in the schema.`, async (assert) => {
    let file = new files_1.VirtualFile(0);
    let blockManager = new blocks_1.BlockManager(file);
    let schemaManager = new schemas_1.SchemaManager();
    let databaseManager1 = schemaManager.createDatabaseManager(file, blockManager, new databases_1.Database({
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
    let databaseManager2 = schemaManager.createDatabaseManager(file, blockManager, new databases_1.Database({
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
    assert.equals(observed, expected);
});
wtf.test(`It should be able to construct an existing database manager when one field is changed to unique in the schema.`, async (assert) => {
    let file = new files_1.VirtualFile(0);
    let blockManager = new blocks_1.BlockManager(file);
    let schemaManager = new schemas_1.SchemaManager();
    let databaseManager1 = schemaManager.createDatabaseManager(file, blockManager, new databases_1.Database({
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
    await stores1.users.insert({
        key: "1",
        name: "A"
    });
    let databaseManager2 = schemaManager.createDatabaseManager(file, blockManager, new databases_1.Database({
        users: new stores_1.Store({
            key: new records_1.StringField(""),
            name: new records_1.StringField("", true)
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
    await assert.throws(async () => {
        await stores2.users.lookup({
            key: "1"
        });
    });
});
