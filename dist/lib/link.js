"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OverridableWritableLink = exports.Link = exports.LinkReference = exports.LinkManager = exports.WritableLinkManager = void 0;
const filters_1 = require("./filters");
;
;
class WritableLinkManager {
    linkManager;
    constructor(linkManager) {
        this.linkManager = linkManager;
    }
    async filter(...parameters) {
        return this.linkManager.filter(...parameters);
    }
    async lookup(...parameters) {
        return this.linkManager.lookup(...parameters);
    }
}
exports.WritableLinkManager = WritableLinkManager;
;
// TODO: Implement interface WritableLink directly.
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
class LinkReference {
    LinkReference;
}
exports.LinkReference = LinkReference;
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
        this.orders = orders;
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
        return this.overrides.filter?.(...parameters) ?? this.linkManager.filter(...parameters);
    }
    async lookup(...parameters) {
        return this.overrides.lookup?.(...parameters) ?? this.linkManager.lookup(...parameters);
    }
}
exports.OverridableWritableLink = OverridableWritableLink;
;
