"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OverridableWritableStore = exports.Store = exports.Index = exports.StoreManager = exports.IndexManager = exports.FilteredStore = exports.WritableStoreManager = void 0;
const streams_1 = require("./streams");
const filters_1 = require("./filters");
const tables_1 = require("./tables");
const orders_1 = require("./orders");
const records_1 = require("./records");
const trees_1 = require("./trees");
const sorters_1 = require("../mod/sorters");
;
;
class WritableStoreManager {
    storeManager;
    constructor(storeManager) {
        this.storeManager = storeManager;
    }
    async filter(...parameters) {
        return this.storeManager.filter(...parameters);
    }
    async insert(...parameters) {
        return this.storeManager.insert(...parameters);
    }
    async length(...parameters) {
        return this.storeManager.length(...parameters);
    }
    async lookup(...parameters) {
        return this.storeManager.lookup(...parameters);
    }
    async remove(...parameters) {
        return this.storeManager.remove(...parameters);
    }
    async update(...parameters) {
        return this.storeManager.update(...parameters);
    }
}
exports.WritableStoreManager = WritableStoreManager;
;
class FilteredStore {
    recordManager;
    blockManager;
    bids;
    filters;
    orders;
    anchor;
    constructor(recordManager, blockManager, bids, filters, orders, anchor) {
        this.recordManager = recordManager;
        this.blockManager = blockManager;
        this.bids = bids;
        this.filters = filters ?? {};
        this.orders = orders ?? {};
        this.anchor = anchor;
    }
    *[Symbol.iterator]() {
        let iterable = streams_1.StreamIterable.of(this.bids)
            .map((bid) => {
            let buffer = this.blockManager.readBlock(bid);
            let record = this.recordManager.decode(buffer);
            return record;
        })
            .filter((record) => {
            for (let key in this.filters) {
                let filter = this.filters[key];
                if (filter == null) {
                    continue;
                }
                let value = record[key];
                if (!filter.matches(value)) {
                    return false;
                }
            }
            return true;
        });
        if (Object.keys(this.orders).length > 0) {
            iterable = iterable.sort((one, two) => {
                for (let key in this.orders) {
                    let order = this.orders[key];
                    if (order == null) {
                        continue;
                    }
                    let comparison = order.compare(one[key], two[key]);
                    if (comparison !== 0) {
                        return comparison;
                    }
                }
                return 0;
            });
        }
        if (this.anchor != null) {
            let encodedAnchor = this.recordManager.encode(this.anchor);
            let found = false;
            iterable = iterable.filter((record) => {
                if (!found) {
                    let encodedRecord = this.recordManager.encode(record);
                    if ((0, tables_1.compareBuffers)([encodedAnchor], [encodedRecord]) === 0) {
                        found = true;
                        return false;
                    }
                }
                return found;
            });
        }
        yield* iterable;
    }
    static getOptimal(filteredStores) {
        filteredStores.sort(sorters_1.CompositeSorter.of(sorters_1.NumberSorter.decreasing((value) => Object.keys(value.orders).length), sorters_1.NumberSorter.decreasing((value) => Object.keys(value.filters).length)));
        return filteredStores.pop();
    }
}
exports.FilteredStore = FilteredStore;
;
class IndexManager {
    recordManager;
    blockManager;
    bid;
    keys;
    tree;
    constructor(recordManager, blockManager, keys, options) {
        let bid = options?.bid ?? blockManager.createBlock(trees_1.RadixTree.INITIAL_SIZE);
        this.recordManager = recordManager;
        this.blockManager = blockManager;
        this.bid = bid;
        this.keys = keys;
        this.tree = new trees_1.RadixTree(blockManager, bid);
    }
    *[Symbol.iterator]() {
        yield* new FilteredStore(this.recordManager, this.blockManager, this.tree, {}, {});
    }
    delete() {
        this.tree.delete();
    }
    filter(filters, orders, anchor) {
        filters = filters ?? {};
        orders = orders ?? {};
        filters = { ...filters };
        orders = { ...orders };
        let keysConsumed = [];
        let keysRemaining = [...this.keys];
        let tree = this.tree;
        for (let indexKey of this.keys) {
            let filter = filters[indexKey];
            if (filter == null) {
                break;
            }
            if (filter instanceof filters_1.EqualityFilter) {
                let encodedValue = filter.getEncodedValue();
                let branch = tree.branch([encodedValue]);
                if (branch == null) {
                    return [];
                }
                delete filters[indexKey];
                keysConsumed.push(keysRemaining.shift());
                tree = branch;
            }
        }
        let directions = [];
        let orderKeys = Object.keys(orders);
        for (let i = 0; i < orderKeys.length; i++) {
            if (keysRemaining[i] !== orderKeys[i]) {
                break;
            }
            let order = orders[orderKeys[i]];
            if (order == null) {
                break;
            }
            directions.push(order.getDirection());
            delete orders[orderKeys[i]];
        }
        let relationship = "^=";
        let keys = [];
        if (anchor != null) {
            relationship = ">";
            keys = this.recordManager.encodeKeys(keysRemaining, anchor);
        }
        let iterable = tree.filter(relationship, keys, directions);
        return [
            new FilteredStore(this.recordManager, this.blockManager, iterable, filters, orders)
        ];
    }
    insert(keysRecord, bid) {
        let keys = this.recordManager.encodeKeys(this.keys, keysRecord);
        this.tree.insert(keys, bid);
    }
    remove(keysRecord) {
        let keys = this.recordManager.encodeKeys(this.keys, keysRecord);
        this.tree.remove(keys);
    }
}
exports.IndexManager = IndexManager;
;
class StoreManager {
    blockManager;
    fields;
    keys;
    orders;
    recordManager;
    table;
    indexManagers;
    constructor(blockManager, fields, keys, orders, table, indexManagers) {
        this.blockManager = blockManager;
        this.fields = fields;
        this.keys = keys;
        this.orders = orders;
        this.recordManager = new records_1.RecordManager(fields);
        this.table = table;
        this.indexManagers = indexManagers;
    }
    *[Symbol.iterator]() {
        yield* this.filter();
    }
    delete() {
        for (let bid of this.table) {
            this.blockManager.deleteBlock(bid);
        }
        for (let indexManager of this.indexManagers) {
            indexManager.delete();
        }
        this.table.delete();
    }
    filter(filters, orders, anchorKeysRecord, limit) {
        orders = orders ?? this.orders;
        for (let key of this.keys) {
            if (!(key in orders)) {
                orders[key] = new orders_1.IncreasingOrder();
            }
        }
        let anchor = anchorKeysRecord != null ? this.lookup(anchorKeysRecord) : undefined;
        let filteredStores = this.indexManagers.flatMap((indexManager) => {
            return indexManager.filter(filters, orders, anchor);
        });
        filteredStores.push(new FilteredStore(this.recordManager, this.blockManager, this.table, filters, orders, anchor));
        let filteredStore = FilteredStore.getOptimal(filteredStores);
        let iterable = streams_1.StreamIterable.of(filteredStore);
        if (limit != null) {
            iterable = iterable.limit(limit);
        }
        return iterable.collect();
    }
    insert(record) {
        let key = this.recordManager.encodeKeys(this.keys, record);
        let encoded = this.recordManager.encode(record);
        let index = this.table.lookup(key);
        if (index == null) {
            index = this.blockManager.createBlock(encoded.length);
            this.blockManager.writeBlock(index, encoded);
            this.table.insert(key, index);
        }
        else {
            let buffer = this.blockManager.readBlock(index);
            let oldRecord = this.recordManager.decode(buffer);
            this.blockManager.resizeBlock(index, encoded.length);
            this.blockManager.writeBlock(index, encoded);
            for (let indexManager of this.indexManagers) {
                indexManager.remove(oldRecord);
            }
        }
        for (let indexManager of this.indexManagers) {
            indexManager.insert(record, index);
        }
    }
    length() {
        return this.table.length();
    }
    lookup(keysRecord) {
        let key = this.recordManager.encodeKeys(this.keys, keysRecord);
        let index = this.table.lookup(key);
        if (index == null) {
            let key = this.keys.map((key) => keysRecord[key]).join(", ");
            throw `Expected a matching record for key ${key}!`;
        }
        let buffer = this.blockManager.readBlock(index);
        let record = this.recordManager.decode(buffer);
        return record;
    }
    remove(keysRecord) {
        let key = this.recordManager.encodeKeys(this.keys, keysRecord);
        let index = this.table.lookup(key);
        if (index != null) {
            let buffer = this.blockManager.readBlock(index);
            let oldRecord = this.recordManager.decode(buffer);
            this.table.remove(key);
            this.blockManager.deleteBlock(index);
            for (let indexManager of this.indexManagers) {
                indexManager.remove(oldRecord);
            }
        }
    }
    update(record) {
        return this.insert(record);
    }
    static construct(blockManager, options) {
        let fields = options.fields;
        let keys = options.keys;
        let orders = options.orders ?? {};
        let indices = options.indices ?? [];
        let recordManager = new records_1.RecordManager(fields);
        let storage = new tables_1.Table(blockManager, {
            getKeyFromValue: (value) => {
                let buffer = blockManager.readBlock(value);
                let record = recordManager.decode(buffer);
                return recordManager.encodeKeys(keys, record);
            }
        });
        let indexManagers = indices.map((index) => new IndexManager(recordManager, blockManager, index.keys));
        let manager = new StoreManager(blockManager, fields, keys, orders, storage, indexManagers);
        return manager;
    }
}
exports.StoreManager = StoreManager;
;
class Index {
    keys;
    constructor(keys) {
        this.keys = keys;
    }
    equals(that) {
        if (this.keys.length !== that.keys.length) {
            return false;
        }
        for (let i = 0; i < this.keys.length; i++) {
            if (this.keys[i] !== that.keys[i]) {
                return false;
            }
        }
        return true;
    }
}
exports.Index = Index;
;
class Store {
    fields;
    keys;
    orders;
    indices;
    constructor(fields, keys, orders) {
        this.fields = fields;
        this.keys = keys;
        this.orders = orders ?? {};
        this.indices = [];
        this.index(this.createIndex());
    }
    createIndex() {
        let keys = [];
        for (let key in this.orders) {
            let order = this.orders[key];
            if (order == null) {
                continue;
            }
            if (!keys.includes(key)) {
                keys.push(key);
            }
        }
        for (let key of this.keys) {
            if (!keys.includes(key)) {
                keys.push(key);
            }
        }
        return new Index(keys);
    }
    index(that) {
        for (let index of this.indices) {
            if (index.equals(that)) {
                return;
            }
        }
        this.indices.push(that);
    }
}
exports.Store = Store;
;
class OverridableWritableStore {
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
    async update(...parameters) {
        return this.overrides.update?.(...parameters) ?? this.storeManager.update(...parameters);
    }
}
exports.OverridableWritableStore = OverridableWritableStore;
;
