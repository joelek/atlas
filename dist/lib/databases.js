"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = exports.DatabaseManager = exports.DatabaseQuery = exports.DatabaseLink = exports.DatabaseStore = void 0;
const caches_1 = require("./caches");
class DatabaseStore {
    storeManager;
    overrides;
    constructor(storeManager, overrides) {
        this.storeManager = storeManager;
        this.overrides = overrides;
    }
    async filter(cache, ...parameters) {
        return this.overrides.filter?.(cache, ...parameters) ?? this.storeManager.filter(cache, ...parameters);
    }
    async insert(cache, ...parameters) {
        return this.overrides.insert?.(cache, ...parameters) ?? this.storeManager.insert(cache, ...parameters);
    }
    async length(cache, ...parameters) {
        return this.overrides.length?.(cache, ...parameters) ?? this.storeManager.length(cache, ...parameters);
    }
    async lookup(cache, ...parameters) {
        return this.overrides.lookup?.(cache, ...parameters) ?? this.storeManager.lookup(cache, ...parameters);
    }
    async remove(cache, ...parameters) {
        return this.overrides.remove?.(cache, ...parameters) ?? this.storeManager.remove(cache, ...parameters);
    }
    async search(cache, ...parameters) {
        return this.overrides.search?.(cache, ...parameters) ?? this.storeManager.search(cache, ...parameters);
    }
    async update(cache, ...parameters) {
        return this.overrides.update?.(cache, ...parameters) ?? this.storeManager.update(cache, ...parameters);
    }
    async vacate(cache, ...parameters) {
        return this.overrides.vacate?.(cache, ...parameters) ?? this.storeManager.vacate(cache, ...parameters);
    }
}
exports.DatabaseStore = DatabaseStore;
;
class DatabaseLink {
    linkManager;
    overrides;
    constructor(linkManager, overrides) {
        this.linkManager = linkManager;
        this.overrides = overrides;
    }
    async filter(cache, ...parameters) {
        return this.overrides.filter?.(cache, ...parameters) ?? this.linkManager.filter(cache, ...parameters);
    }
    async lookup(cache, ...parameters) {
        return this.overrides.lookup?.(cache, ...parameters) ?? this.linkManager.lookup(cache, ...parameters);
    }
}
exports.DatabaseLink = DatabaseLink;
;
class DatabaseQuery {
    queryManager;
    overrides;
    constructor(queryManager, overrides) {
        this.queryManager = queryManager;
        this.overrides = overrides;
    }
    async filter(cache, ...parameters) {
        return this.overrides.filter?.(cache, ...parameters) ?? this.queryManager.filter(cache, ...parameters);
    }
}
exports.DatabaseQuery = DatabaseQuery;
;
class DatabaseManager {
    storeManagers;
    linkManagers;
    queryManagers;
    linksWhereStoreIsParent;
    linksWhereStoreIsChild;
    doInsert(cache, storeManager, records) {
        for (let record of records) {
            for (let linkManager of this.getLinksWhereStoreIsChild(storeManager)) {
                linkManager.lookup(cache, record);
            }
            storeManager.insert(cache, record);
        }
    }
    doRemove(cache, storeManager, records) {
        let queue = new Array();
        queue.push({
            storeManager,
            records
        });
        while (queue.length > 0) {
            let queueEntry = queue.splice(0, 1)[0];
            for (let record of queueEntry.records) {
                queueEntry.storeManager.remove(cache, record);
            }
            for (let linkManager of this.getLinksWhereStoreIsParent(queueEntry.storeManager)) {
                let storeManager = linkManager.getChild();
                let records = new Array();
                for (let record of queueEntry.records) {
                    for (let childRecord of linkManager.filter(cache, record)) {
                        records.push(childRecord);
                    }
                }
                if (records.length > 0) {
                    queue.push({
                        storeManager,
                        records
                    });
                }
            }
        }
    }
    doVacate(cache, storeManager, orphans) {
        if (storeManager.length(cache) > 0) {
            storeManager.vacate(cache);
            for (let linkManager of this.getLinksWhereStoreIsParent(storeManager)) {
                this.doVacate(cache, linkManager.getChild(), linkManager.filter(cache));
            }
        }
        for (let orphan of orphans) {
            storeManager.insert(cache, orphan);
        }
    }
    getLinksWhereStoreIsParent(storeManager) {
        let set = this.linksWhereStoreIsParent.get(storeManager);
        if (set == null) {
            throw `Expected link set!`;
        }
        return set;
    }
    getLinksWhereStoreIsChild(storeManager) {
        let set = this.linksWhereStoreIsChild.get(storeManager);
        if (set == null) {
            throw `Expected link set!`;
        }
        return set;
    }
    constructor(storeManagers, linkManagers, queryManagers) {
        this.storeManagers = storeManagers;
        this.linkManagers = linkManagers;
        this.queryManagers = queryManagers;
        this.linksWhereStoreIsParent = new Map();
        this.linksWhereStoreIsChild = new Map();
        for (let key in storeManagers) {
            let storeManager = storeManagers[key];
            let linksWhereStoreIsChild = new Set();
            let linksWhereStoreIsParent = new Set();
            for (let key in this.linkManagers) {
                let linkManager = this.linkManagers[key];
                if (storeManager === linkManager.getParent()) {
                    linksWhereStoreIsParent.add(linkManager);
                }
                if (storeManager === linkManager.getChild()) {
                    linksWhereStoreIsChild.add(linkManager);
                }
            }
            this.linksWhereStoreIsParent.set(storeManager, linksWhereStoreIsParent);
            this.linksWhereStoreIsChild.set(storeManager, linksWhereStoreIsChild);
        }
    }
    createDatabaseStores() {
        let databaseStores = {};
        for (let key in this.storeManagers) {
            let storeManager = this.storeManagers[key];
            databaseStores[key] = new DatabaseStore(storeManager, {
                insert: async (cache, record) => this.doInsert(cache, storeManager, [record]),
                remove: async (cache, record) => this.doRemove(cache, storeManager, [record]),
                vacate: async (cache) => this.doVacate(cache, storeManager, [])
            });
        }
        return databaseStores;
    }
    createDatabaseLinks() {
        let databaseLinks = {};
        for (let key in this.linkManagers) {
            let linkManager = this.linkManagers[key];
            databaseLinks[key] = new DatabaseLink(linkManager, {});
        }
        return databaseLinks;
    }
    createDatabaseQueries() {
        let databaseQueries = {};
        for (let key in this.queryManagers) {
            let queryManager = this.queryManagers[key];
            databaseQueries[key] = new DatabaseQuery(queryManager, {});
        }
        return databaseQueries;
    }
    enforceStoreConsistency(storeNames) {
        let cache = new caches_1.Cache(undefined, 0);
        for (let key of storeNames) {
            let storeManager = this.storeManagers[key];
            for (let linkManager of this.getLinksWhereStoreIsParent(storeManager)) {
                let child = linkManager.getChild();
                let records = [];
                for (let childRecord of child) {
                    try {
                        linkManager.lookup(cache, childRecord);
                    }
                    catch (error) {
                        records.push(childRecord);
                    }
                }
                this.doRemove(cache, child, records);
            }
        }
    }
    enforceLinkConsistency(linkNames) {
        let cache = new caches_1.Cache(undefined, 0);
        for (let key of linkNames) {
            let linkManager = this.linkManagers[key];
            let child = linkManager.getChild();
            let records = [];
            for (let childRecord of child) {
                try {
                    linkManager.lookup(cache, childRecord);
                }
                catch (error) {
                    records.push(childRecord);
                }
            }
            this.doRemove(cache, child, records);
        }
    }
    enforceConsistency(storeNames, linkNames) {
        let cache = new caches_1.Cache(undefined, 0);
        let linkManagers = new Set();
        for (let key of storeNames) {
            for (let linkManager of this.getLinksWhereStoreIsParent(this.storeManagers[key])) {
                linkManagers.add(linkManager);
            }
        }
        for (let key of linkNames) {
            let linkManager = this.linkManagers[key];
            linkManagers.add(linkManager);
        }
        for (let linkManager of linkManagers) {
            let child = linkManager.getChild();
            let records = [];
            for (let childRecord of child) {
                try {
                    linkManager.lookup(cache, childRecord);
                }
                catch (error) {
                    records.push(childRecord);
                }
            }
            this.doRemove(cache, child, records);
        }
    }
    reload() {
        for (let key in this.storeManagers) {
            this.storeManagers[key].reload();
        }
    }
}
exports.DatabaseManager = DatabaseManager;
;
class Database {
    stores;
    links;
    queries;
    constructor(stores, links, queries) {
        this.stores = stores ?? {};
        this.links = links ?? {};
        this.queries = queries ?? {};
    }
}
exports.Database = Database;
;
