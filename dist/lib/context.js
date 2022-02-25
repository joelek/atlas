"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Context = exports.LinkReference = exports.StoreReference = exports.FieldReference = exports.FileReference = void 0;
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
class FieldReference {
    FieldReference;
}
exports.FieldReference = FieldReference;
;
class StoreReference {
    StoreReference;
}
exports.StoreReference = StoreReference;
;
class LinkReference {
    LinkReference;
}
exports.LinkReference = LinkReference;
;
class Context {
    files;
    fields;
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
    getField(reference) {
        let field = this.fields.get(reference);
        if (field == null) {
            throw `Expected field to be defined in context!`;
        }
        return field;
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
        this.fields = new Map();
        this.links = new Map();
        this.stores = new Map();
        this.databaseManagers = new Map();
    }
    createBinaryField() {
        let reference = new FieldReference();
        let field = new records_1.BinaryField(Uint8Array.of());
        this.fields.set(reference, field);
        return reference;
    }
    createBooleanField() {
        let reference = new FieldReference();
        let field = new records_1.BooleanField(false);
        this.fields.set(reference, field);
        return reference;
    }
    createStringField() {
        let reference = new FieldReference();
        let field = new records_1.StringField("");
        this.fields.set(reference, field);
        return reference;
    }
    createNullableStringField() {
        let reference = new FieldReference();
        let field = new records_1.NullableStringField(null);
        this.fields.set(reference, field);
        return reference;
    }
    createLink(parent, child, recordKeysMap, orders) {
        let reference = new LinkReference();
        let link = new link_1.Link(this.getStore(parent), this.getStore(child), recordKeysMap, orders ?? {});
        this.links.set(reference, link);
        return reference;
    }
    createStore(fieldReferences, keys) {
        let reference = new StoreReference();
        let fields = {};
        for (let key in fieldReferences) {
            fields[key] = this.getField(fieldReferences[key]);
        }
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
