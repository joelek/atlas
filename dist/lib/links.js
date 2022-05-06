"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Link = exports.LinkManager = void 0;
const filters_1 = require("./filters");
const stores_1 = require("./stores");
;
class LinkManager {
    parent;
    child;
    keysRecordMap;
    orders;
    constructor(parent, child, keysRecordMap, orders) {
        this.parent = parent;
        this.child = child;
        this.keysRecordMap = keysRecordMap;
        this.orders = orders ?? {};
    }
    getParent() {
        return this.parent;
    }
    getChild() {
        return this.child;
    }
    filter(cache, keysRecord, anchorKeysRecord, limit) {
        let filters = {};
        for (let key in this.keysRecordMap) {
            let keyOne = key;
            let keyTwo = this.keysRecordMap[keyOne];
            filters[keyTwo] = new filters_1.EqualityFilter(keysRecord?.[keyOne] ?? null);
        }
        return this.child.filter(cache, filters, this.orders, anchorKeysRecord, limit);
    }
    lookup(cache, keysRecord) {
        let parentKeysRecord = {};
        for (let key in this.keysRecordMap) {
            let keyOne = key;
            let keyTwo = this.keysRecordMap[keyOne];
            if (keysRecord[keyTwo] === null) {
                return;
            }
            parentKeysRecord[keyOne] = keysRecord[keyTwo];
        }
        return this.parent.lookup(cache, parentKeysRecord);
    }
    static construct(parent, child, recordKeysMap, orders) {
        return new LinkManager(parent, child, recordKeysMap, orders);
    }
}
exports.LinkManager = LinkManager;
;
class Link {
    parent;
    child;
    recordKeysMap;
    orders;
    constructor(parent, child, recordKeysMap, orders) {
        this.parent = parent;
        this.child = child;
        this.recordKeysMap = recordKeysMap;
        this.orders = orders ?? {};
        this.child.index(this.createIndex());
    }
    createIndex() {
        let keys = [];
        for (let key in this.recordKeysMap) {
            let thatKey = this.recordKeysMap[key];
            if (!keys.includes(thatKey)) {
                keys.push(thatKey);
            }
        }
        for (let key in this.orders) {
            let order = this.orders[key];
            if (order == null) {
                continue;
            }
            if (!keys.includes(key)) {
                keys.push(key);
            }
        }
        for (let key of this.child.keys) {
            if (!keys.includes(key)) {
                keys.push(key);
            }
        }
        return new stores_1.Index(keys);
    }
}
exports.Link = Link;
;
