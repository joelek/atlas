"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = exports.DatabaseManager = void 0;
const link_1 = require("./link");
const store_1 = require("./store");
const transaction_1 = require("./transaction");
class DatabaseManager {
    storeManagers;
    linkManagers;
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
    constructor(storeManagers, linkManagers) {
        this.storeManagers = storeManagers;
        this.linkManagers = linkManagers;
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
        return new transaction_1.TransactionManager(file, writableStores, writableLinks);
    }
    createWritableStores() {
        let writableStores = {};
        for (let key in this.storeManagers) {
            let storeManager = this.storeManagers[key];
            writableStores[key] = new store_1.OverridableWritableStore(storeManager, {
                insert: async (record) => this.doInsert(storeManager, [record]),
                remove: async (record) => this.doRemove(storeManager, [record])
            });
        }
        return writableStores;
    }
    createWritableLinks() {
        let writableLinks = {};
        for (let key in this.linkManagers) {
            writableLinks[key] = new link_1.OverridableWritableLink(this.linkManagers[key], {});
        }
        return writableLinks;
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
    constructor(stores, links) {
        this.stores = stores ?? {};
        this.links = links ?? {};
    }
}
exports.Database = Database;
;
