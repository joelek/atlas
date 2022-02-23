"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OverridableWritableStore = exports.Store = exports.Index = exports.StoreManager = exports.WritableStoreManager = void 0;
const streams_1 = require("./streams");
const hash_1 = require("./hash");
const records_1 = require("./records");
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
// TODO: Handle indices.
// TODO: Implement interface WritableStore directly.
class StoreManager {
    blockHandler;
    fieldManagers;
    keys;
    recordManager;
    table;
    filterIterable(bids, filters, orders) {
        return streams_1.StreamIterable.of(bids)
            .map((bid) => {
            let buffer = this.blockHandler.readBlock(bid);
            let record = this.recordManager.decode(buffer);
            return {
                bid: () => bid,
                record: () => record
            };
        })
            .filter((entry) => {
            for (let key in filters) {
                let filter = filters[key];
                if (filter == null) {
                    continue;
                }
                let value = entry.record()[key];
                if (!filter.matches(value)) {
                    return false;
                }
            }
            return true;
        })
            .sort((one, two) => {
            for (let key in orders) {
                let order = orders[key];
                if (order == null) {
                    continue;
                }
                let comparison = order.compare(one.record()[key], two.record()[key]);
                if (comparison !== 0) {
                    return comparison;
                }
            }
            return 0;
        });
    }
    constructor(blockHandler, fieldManagers, keys, table) {
        this.blockHandler = blockHandler;
        this.fieldManagers = fieldManagers;
        this.keys = keys;
        this.recordManager = new records_1.RecordManager(fieldManagers);
        this.table = table;
    }
    *[Symbol.iterator]() {
        yield* this.filter();
    }
    delete() {
        for (let entry of this) {
            this.blockHandler.deleteBlock(entry.bid());
        }
        this.table.delete();
    }
    filter(filters, orders) {
        // TODO: Use indices.
        let filtersRemaining = { ...filters };
        let ordersRemaining = { ...orders };
        let iterable = streams_1.StreamIterable.of(this.table)
            .map((entry) => entry.value());
        return this.filterIterable(iterable, filtersRemaining, ordersRemaining);
    }
    insert(record) {
        let key = this.recordManager.encodeKeys(this.keys, record);
        let encoded = this.recordManager.encode(record);
        let index = this.table.lookup(key);
        if (index == null) {
            index = this.blockHandler.createBlock(encoded.length);
            this.blockHandler.writeBlock(index, encoded);
            this.table.insert(key, index);
        }
        else {
            let buffer = this.blockHandler.readBlock(index);
            let oldRecord = this.recordManager.decode(buffer);
            this.blockHandler.resizeBlock(index, encoded.length);
            this.blockHandler.writeBlock(index, encoded);
            // TODO: Remove old record from indices.
        }
        // TODO: Insert record into indices.
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
        let buffer = this.blockHandler.readBlock(index);
        let record = this.recordManager.decode(buffer);
        return record;
    }
    remove(keysRecord) {
        let key = this.recordManager.encodeKeys(this.keys, keysRecord);
        let index = this.table.lookup(key);
        if (index != null) {
            let buffer = this.blockHandler.readBlock(index);
            let oldRecord = this.recordManager.decode(buffer);
            this.table.remove(key);
            this.blockHandler.deleteBlock(index);
            // TODO: Remove old record from indices.
        }
    }
    update(record) {
        return this.insert(record);
    }
    static construct(blockHandler, options) {
        let fieldManagers = {};
        for (let key in options.fields) {
            fieldManagers[key] = options.fields[key].createManager(blockHandler, null);
        }
        let keys = options.keys;
        let recordManager = new records_1.RecordManager(fieldManagers);
        let storage = new hash_1.Table(blockHandler, {
            getKeyFromValue: (value) => {
                let buffer = blockHandler.readBlock(value);
                let record = recordManager.decode(buffer);
                return recordManager.encodeKeys(keys, record);
            }
        });
        let manager = new StoreManager(blockHandler, fieldManagers, keys, storage);
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
}
exports.Index = Index;
;
class Store {
    fields;
    keys;
    indices;
    constructor(fields, keys) {
        this.fields = fields;
        this.keys = keys;
        this.indices = [];
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
