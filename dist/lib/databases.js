"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = exports.DatabaseManager = void 0;
const links_1 = require("./links");
const queries_1 = require("./queries");
const stores_1 = require("./stores");
const streams_1 = require("./streams");
const transactions_1 = require("./transactions");
const MAX_LIMIT = 100;
class DatabaseManager {
    storeManagers;
    linkManagers;
    queryManagers;
    linksWhereStoreIsParent;
    linksWhereStoreIsChild;
    doInsert(storeManager, records) {
        for (let record of records) {
            for (let linkManager of this.getLinksWhereStoreIsChild(storeManager)) {
                linkManager.lookup(record);
            }
            storeManager.insert(record);
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
                    for (let entry of linkManager.filter(record)) {
                        records.push(entry.record());
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
    createTransactionManager(file) {
        let writableStores = this.createWritableStores();
        let writableLinks = this.createWritableLinks();
        let writableQueries = this.createWritableQueries();
        return new transactions_1.TransactionManager(file, writableStores, writableLinks, writableQueries);
    }
    createWritableStores() {
        let writableStores = {};
        for (let key in this.storeManagers) {
            let storeManager = this.storeManagers[key];
            writableStores[key] = new stores_1.OverridableWritableStore(storeManager, {
                filter: async (filters, orders) => {
                    return streams_1.StreamIterable.of(storeManager.filter(filters, orders))
                        .limit(MAX_LIMIT)
                        .collect();
                },
                insert: async (record) => this.doInsert(storeManager, [record]),
                remove: async (record) => this.doRemove(storeManager, [record])
            });
        }
        return writableStores;
    }
    createWritableLinks() {
        let writableLinks = {};
        for (let key in this.linkManagers) {
            let linkManager = this.linkManagers[key];
            writableLinks[key] = new links_1.OverridableWritableLink(linkManager, {
                filter: async (keysRecord) => {
                    return streams_1.StreamIterable.of(linkManager.filter(keysRecord))
                        .limit(MAX_LIMIT)
                        .collect();
                }
            });
        }
        return writableLinks;
    }
    createWritableQueries() {
        let writableQueries = {};
        for (let key in this.queryManagers) {
            let queryManager = this.queryManagers[key];
            writableQueries[key] = new queries_1.OverridableWritableQuery(queryManager, {
                filter: async (parameters) => {
                    return streams_1.StreamIterable.of(queryManager.filter(parameters))
                        .limit(MAX_LIMIT)
                        .collect();
                }
            });
        }
        return writableQueries;
    }
    enforceStoreConsistency(storeNames) {
        for (let key of storeNames) {
            let storeManager = this.storeManagers[key];
            for (let linkManager of this.getLinksWhereStoreIsParent(storeManager)) {
                let child = linkManager.getChild();
                let records = [];
                for (let entry of child) {
                    let record = entry.record();
                    try {
                        linkManager.lookup(record);
                    }
                    catch (error) {
                        records.push(record);
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
            for (let entry of child) {
                let record = entry.record();
                try {
                    linkManager.lookup(record);
                }
                catch (error) {
                    records.push(record);
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
            for (let entry of child) {
                let record = entry.record();
                try {
                    linkManager.lookup(record);
                }
                catch (error) {
                    records.push(record);
                }
            }
            this.doRemove(child, records);
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
