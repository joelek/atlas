"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = exports.DatabaseManager = exports.DatabaseQuery = exports.DatabaseLink = exports.DatabaseStore = void 0;
const blocks_1 = require("./blocks");
class DatabaseStore {
    storeManager;
    overrides;
    constructor(storeManager, overrides) {
        this.storeManager = storeManager;
        this.overrides = overrides;
    }
    async filter(...parameters) {
        return this.overrides.filter?.(...parameters) ?? this.storeManager.filter(...parameters);
    }
    async insert(...parameters) {
        return this.overrides.insert?.(...parameters) ?? this.storeManager.insert(...parameters);
    }
    async length(...parameters) {
        return this.overrides.length?.(...parameters) ?? this.storeManager.length(...parameters);
    }
    async lookup(...parameters) {
        return this.overrides.lookup?.(...parameters) ?? this.storeManager.lookup(...parameters);
    }
    async remove(...parameters) {
        return this.overrides.remove?.(...parameters) ?? this.storeManager.remove(...parameters);
    }
    async search(...parameters) {
        return this.overrides.search?.(...parameters) ?? this.storeManager.search(...parameters);
    }
    async update(...parameters) {
        return this.overrides.update?.(...parameters) ?? this.storeManager.update(...parameters);
    }
    async vacate(...parameters) {
        return this.overrides.vacate?.(...parameters) ?? this.storeManager.vacate(...parameters);
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
    async filter(...parameters) {
        return this.overrides.filter?.(...parameters) ?? this.linkManager.filter(...parameters);
    }
    async lookup(...parameters) {
        return this.overrides.lookup?.(...parameters) ?? this.linkManager.lookup(...parameters);
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
    async filter(...parameters) {
        return this.overrides.filter?.(...parameters) ?? this.queryManager.filter(...parameters);
    }
}
exports.DatabaseQuery = DatabaseQuery;
;
class DatabaseManager {
    storeManagers;
    linkManagers;
    queryManagers;
    blockManager;
    linksWhereStoreIsParent;
    linksWhereStoreIsChild;
    doInsert(storeManager, records) {
        for (let record of records) {
            for (let linkManager of this.getLinksWhereStoreIsChild(storeManager)) {
                let parentRecord = linkManager.lookup(record);
                let partialChild = linkManager.createPartialChild(parentRecord);
                if (partialChild != null) {
                    record = {
                        ...record,
                        ...partialChild
                    };
                }
            }
            storeManager.insert(record);
            for (let linkManager of this.getLinksWhereStoreIsParent(storeManager)) {
                let partialChild = linkManager.createPartialChild(record);
                if (partialChild != null) {
                    let childStoreManager = linkManager.getChild();
                    let records = linkManager.filter(record);
                    for (let record of records) {
                        childStoreManager.update({
                            ...record,
                            ...partialChild
                        });
                    }
                }
            }
        }
    }
    doRemove(storeManager, records) {
        let queue = new Array();
        queue.push({
            storeManager,
            records
        });
        while (queue.length > 0) {
            let queueEntry = queue.splice(0, 1)[0];
            for (let record of queueEntry.records) {
                queueEntry.storeManager.remove(record);
            }
            for (let linkManager of this.getLinksWhereStoreIsParent(queueEntry.storeManager)) {
                let storeManager = linkManager.getChild();
                let records = new Array();
                for (let record of queueEntry.records) {
                    for (let childRecord of linkManager.filter(record)) {
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
    doUpdate(storeManager, records) {
        for (let record of records) {
            record = storeManager.getCompleteRecord(record);
            for (let linkManager of this.getLinksWhereStoreIsChild(storeManager)) {
                let parentRecord = linkManager.lookup(record);
                let partialChild = linkManager.createPartialChild(parentRecord);
                if (partialChild != null) {
                    record = {
                        ...record,
                        ...partialChild
                    };
                }
            }
            storeManager.update(record);
            for (let linkManager of this.getLinksWhereStoreIsParent(storeManager)) {
                let partialChild = linkManager.createPartialChild(record);
                if (partialChild != null) {
                    let childStoreManager = linkManager.getChild();
                    let records = linkManager.filter(record);
                    for (let record of records) {
                        childStoreManager.update({
                            ...record,
                            ...partialChild
                        });
                    }
                }
            }
        }
    }
    doVacate(storeManager, orphans) {
        if (storeManager.length() > 0) {
            storeManager.vacate();
            for (let linkManager of this.getLinksWhereStoreIsParent(storeManager)) {
                this.doVacate(linkManager.getChild(), linkManager.filter());
            }
        }
        for (let orphan of orphans) {
            storeManager.insert(orphan);
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
    constructor(storeManagers, linkManagers, queryManagers, blockManager) {
        this.storeManagers = storeManagers;
        this.linkManagers = linkManagers;
        this.queryManagers = queryManagers;
        this.blockManager = blockManager;
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
                insert: async (record) => this.doInsert(storeManager, [record]),
                remove: async (record) => this.doRemove(storeManager, [record]),
                update: async (record) => this.doUpdate(storeManager, [record]),
                vacate: async () => this.doVacate(storeManager, [])
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
        for (let key of storeNames) {
            let storeManager = this.storeManagers[key];
            for (let linkManager of this.getLinksWhereStoreIsParent(storeManager)) {
                let child = linkManager.getChild();
                let records = [];
                for (let childRecord of child) {
                    try {
                        linkManager.lookup(childRecord);
                    }
                    catch (error) {
                        records.push(childRecord);
                    }
                }
                this.doRemove(child, records);
            }
        }
    }
    enforceLinkConsistency(linkNames) {
        for (let key of linkNames) {
            let linkManager = this.linkManagers[key];
            let child = linkManager.getChild();
            let records = [];
            for (let childRecord of child) {
                try {
                    let parentRecord = linkManager.lookup(childRecord);
                    let partialChild = linkManager.createPartialChild(parentRecord);
                    if (partialChild != null) {
                        childRecord = {
                            ...childRecord,
                            ...partialChild
                        };
                    }
                    child.update(childRecord);
                }
                catch (error) {
                    records.push(childRecord);
                }
            }
            this.doRemove(child, records);
        }
    }
    enforceConsistency(storeNames, linkNames) {
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
                    let parentRecord = linkManager.lookup(childRecord);
                    let partialChild = linkManager.createPartialChild(parentRecord);
                    if (partialChild != null) {
                        childRecord = {
                            ...childRecord,
                            ...partialChild
                        };
                    }
                    child.update(childRecord);
                }
                catch (error) {
                    records.push(childRecord);
                }
            }
            this.doRemove(child, records);
        }
    }
    getStatistics() {
        let statistics = {};
        statistics.databaseSchema = {
            entries: 1,
            bytesPerEntry: this.blockManager.getBlockSize(blocks_1.BlockManager.RESERVED_BLOCK_DATABASE_SCHEMA)
        };
        statistics.blockManager = this.blockManager.getStatistics();
        let storeManagers = statistics.storeManagers = {};
        for (let key in this.storeManagers) {
            storeManagers[key] = this.storeManagers[key].getStatistics();
        }
        return statistics;
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
