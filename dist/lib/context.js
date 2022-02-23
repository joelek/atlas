"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Context = exports.FileReference = void 0;
const link_1 = require("./link");
const store_1 = require("./store");
const records_1 = require("./records");
const files_1 = require("./files");
const database_1 = require("./database");
const schema_1 = require("./schema");
class FileReference {
    FileReference;
}
exports.FileReference = FileReference;
;
class Context {
    files;
    links;
    stores;
    databaseManagers;
    getFile(reference) {
        let file = this.files.get(reference);
        if (file == null) {
            throw `Expected file to be defined in context!`;
        }
        return file;
    }
    getLink(reference) {
        let link = this.links.get(reference);
        if (link == null) {
            throw `Expected link to be defined in context!`;
        }
        return link;
    }
    getStore(reference) {
        let store = this.stores.get(reference);
        if (store == null) {
            throw `Expected store to be defined in context!`;
        }
        return store;
    }
    constructor() {
        this.files = new Map();
        this.links = new Map();
        this.stores = new Map();
        this.databaseManagers = new Map();
    }
    createBinaryField() {
        return new records_1.BinaryField(Uint8Array.of());
    }
    createBooleanField() {
        return new records_1.BooleanField(false);
    }
    createStringField() {
        return new records_1.StringField("");
    }
    createNullableStringField() {
        return new records_1.NullableStringField(null);
    }
    createLink(parent, child, recordKeysMap, orders) {
        let reference = new link_1.LinkReference();
        let link = new link_1.Link(this.getStore(parent), this.getStore(child), recordKeysMap, orders ?? {});
        this.links.set(reference, link);
        return reference;
    }
    createStore(fields, keys) {
        let reference = new store_1.StoreReference();
        let store = new store_1.Store(fields, keys);
        this.stores.set(reference, store);
        return reference;
    }
    createDiskStorage(path) {
        let reference = new FileReference();
        let bin = new files_1.CachedFile(new files_1.PhysicalFile(`${path}.bin`), 64 * 1024 * 1024);
        let log = new files_1.CachedFile(new files_1.PhysicalFile(`${path}.log`), 64 * 1024 * 1024);
        let file = new files_1.DurableFile(bin, log);
        this.files.set(reference, file);
        return reference;
    }
    createMemoryStorage() {
        let reference = new FileReference();
        let file = new files_1.VirtualFile(0);
        this.files.set(reference, file);
        return reference;
    }
    createTransactionManager(fileReference, storeReferences, linkReferences) {
        if (this.databaseManagers.has(fileReference)) {
            throw `Expected given storage to not be in use by another database!`;
        }
        storeReferences = storeReferences ?? {};
        linkReferences = linkReferences ?? {};
        let file = this.getFile(fileReference);
        let stores = {};
        for (let key in storeReferences) {
            stores[key] = this.getStore(storeReferences[key]);
        }
        let links = {};
        for (let key in linkReferences) {
            links[key] = this.getLink(linkReferences[key]);
        }
        let schemaManager = new schema_1.SchemaManager();
        let database = new database_1.Database(stores, links);
        let databaseManager = schemaManager.createDatabaseManager(file, database);
        this.databaseManagers.set(fileReference, databaseManager);
        let transactionManager = databaseManager.createTransactionManager(file);
        return transactionManager;
    }
}
exports.Context = Context;
;
