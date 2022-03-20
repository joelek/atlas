"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OverridableWritableLink = exports.Link = exports.LinkManager = exports.WritableLinkManager = void 0;
const filters_1 = require("./filters");
const stores_1 = require("./stores");
const streams_1 = require("./streams");
;
;
class WritableLinkManager {
    linkManager;
    constructor(linkManager) {
        this.linkManager = linkManager;
    }
    async filter(...parameters) {
        return streams_1.StreamIterable.of(this.linkManager.filter(...parameters))
            .map((entry) => {
            return entry.record();
        });
    }
    async lookup(...parameters) {
        return this.linkManager.lookup(...parameters);
    }
}
exports.WritableLinkManager = WritableLinkManager;
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
    filter(keysRecord) {
        let filters = {};
        for (let key in this.keysRecordMap) {
            let keyOne = key;
            let keyTwo = this.keysRecordMap[keyOne];
            filters[keyTwo] = new filters_1.EqualityFilter(keysRecord[keyOne]);
        }
        return this.child.filter(filters, this.orders);
    }
    lookup(record) {
        let keysRecord = {};
        for (let key in this.keysRecordMap) {
            let keyOne = key;
            let keyTwo = this.keysRecordMap[keyOne];
            if (record[keyTwo] === null) {
                return;
            }
            keysRecord[keyOne] = record[keyTwo];
        }
        return this.parent.lookup(keysRecord);
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
class OverridableWritableLink {
    linkManager;
    overrides;
    constructor(linkManager, overrides) {
        this.linkManager = linkManager;
        this.overrides = overrides;
    }
    async filter(...parameters) {
        return this.overrides.filter?.(...parameters) ?? streams_1.StreamIterable.of(this.linkManager.filter(...parameters))
            .map((entry) => {
            return entry.record();
        });
    }
    async lookup(...parameters) {
        return this.overrides.lookup?.(...parameters) ?? this.linkManager.lookup(...parameters);
    }
}
exports.OverridableWritableLink = OverridableWritableLink;
;
