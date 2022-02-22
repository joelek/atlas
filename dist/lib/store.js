"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OverridableWritableStore = exports.Store = exports.Index = exports.StoreReference = exports.StoreManager = exports.WritableStoreManager = exports.StoreSchema = void 0;
const bedrock = require("@joelek/bedrock");
const streams_1 = require("./streams");
const hash_1 = require("./hash");
const records_1 = require("./records");
exports.StoreSchema = bedrock.codecs.Object.of({
    fieldBids: bedrock.codecs.Record.of(bedrock.codecs.Integer),
    keys: bedrock.codecs.Array.of(bedrock.codecs.String),
    tableBid: bedrock.codecs.Integer,
    indexBids: bedrock.codecs.Record.of(bedrock.codecs.Integer)
});
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
    bid;
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
    saveSchema() {
        let fieldBids = {};
        for (let key in this.fieldManagers) {
            fieldBids[key] = this.fieldManagers[key].getBid();
        }
        let keys = this.keys;
        let tableBid = this.table.getBid();
        let indexBids = {};
        let schema = {
            fieldBids,
            keys,
            tableBid,
            indexBids
        };
        let buffer = exports.StoreSchema.encode(schema);
        this.blockHandler.resizeBlock(this.bid, buffer.length);
        this.blockHandler.writeBlock(this.bid, buffer);
    }
    constructor(blockHandler, bid, fieldManagers, keys, table) {
        this.blockHandler = blockHandler;
        this.bid = bid;
        this.fieldManagers = fieldManagers;
        this.keys = keys;
        this.recordManager = new records_1.RecordManager(fieldManagers);
        this.table = table;
    }
    *[Symbol.iterator]() {
        yield* this.filter();
    }
    getBid() {
        return this.bid;
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
    static compareFields(oldFields, newFields) {
        let create = [];
        let remove = [];
        let update = [];
        for (let key in newFields) {
            if (oldFields[key] == null) {
                create.push(key);
            }
        }
        for (let key in oldFields) {
            if (newFields[key] == null) {
                remove.push(key);
            }
        }
        for (let key in newFields) {
            if (oldFields[key] != null) {
                if (!newFields[key].isCompatibleWith(oldFields[key])) {
                    update.push(key);
                }
            }
        }
        let equal = create.length === 0 && remove.length === 0 && update.length === 0;
        return {
            create,
            remove,
            update,
            equal
        };
    }
    static compareIndices(oldIndices, newIndices) {
        let create = [];
        let remove = [];
        newIndices: for (let newIndex of newIndices) {
            oldIndices: for (let oldIndex of oldIndices) {
                if (this.compareKeys(oldIndex, newIndex)) {
                    continue newIndices;
                }
            }
            create.push(newIndex);
        }
        oldIndices: for (let oldIndex of oldIndices) {
            newIndices: for (let newIndex of newIndices) {
                if (this.compareKeys(oldIndex, newIndex)) {
                    continue oldIndices;
                }
            }
            remove.push(oldIndex);
        }
        let equal = create.length === 0 && remove.length === 0;
        return {
            create,
            remove,
            equal
        };
    }
    static compareKeys(oldKeys, newKeys) {
        if (oldKeys.length !== newKeys.length) {
            return { equal: false };
        }
        for (let i = 0; i < oldKeys.length; i++) {
            if (oldKeys[i] !== newKeys[i]) {
                return { equal: false };
            }
        }
        return { equal: true };
    }
    static migrate(oldManager, options) {
        let keyComparison = StoreManager.compareKeys(oldManager.keys, options.keys);
        let fieldComparison = StoreManager.compareFields(oldManager.fieldManagers, options.fields);
        if (keyComparison.equal && fieldComparison.equal) {
            let indexComparison = StoreManager.compareIndices([], options.indices);
            // TODO: Handle migration of indices.
            return oldManager;
        }
        else {
            let newManager = StoreManager.construct(oldManager.blockHandler, null, options);
            for (let entry of oldManager) {
                try {
                    let oldRecord = entry.record();
                    let newRecord = {};
                    for (let key in options.fields) {
                        newRecord[key] = options.fields[key].convertValue(oldRecord[key]);
                    }
                    newManager.insert(newRecord);
                }
                catch (error) { }
            }
            let bid = oldManager.bid;
            oldManager.bid = newManager.bid;
            newManager.bid = bid;
            oldManager.delete();
            newManager.saveSchema();
            return newManager;
        }
    }
    static construct(blockHandler, bid, options) {
        if (bid == null) {
            if (options == null) {
                return StoreManager.construct(blockHandler, null, {
                    fields: {},
                    keys: [],
                    indices: []
                });
            }
            else {
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
                bid = blockHandler.createBlock(64);
                let manager = new StoreManager(blockHandler, bid, fieldManagers, keys, storage);
                manager.saveSchema();
                return manager;
            }
        }
        else {
            if (options == null) {
                let schema = exports.StoreSchema.decode(blockHandler.readBlock(bid));
                let fieldManagers = {};
                for (let key in schema.fieldBids) {
                    fieldManagers[key] = records_1.FieldManager.construct(blockHandler, schema.fieldBids[key]);
                }
                let keys = schema.keys;
                let recordManager = new records_1.RecordManager(fieldManagers);
                let storage = new hash_1.Table(blockHandler, {
                    getKeyFromValue: (value) => {
                        let buffer = blockHandler.readBlock(value);
                        let record = recordManager.decode(buffer);
                        return recordManager.encodeKeys(keys, record);
                    }
                }, {
                    bid: schema.tableBid
                });
                let manager = new StoreManager(blockHandler, bid, fieldManagers, keys, storage);
                return manager;
            }
            else {
                return StoreManager.migrate(StoreManager.construct(blockHandler, bid), options);
            }
        }
    }
}
exports.StoreManager = StoreManager;
;
class StoreReference {
    StoreReference;
}
exports.StoreReference = StoreReference;
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
    createManager(blockHandler, bid) {
        return StoreManager.construct(blockHandler, bid, {
            fields: this.fields,
            keys: this.keys,
            indices: this.indices.map((index) => index.keys)
        });
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
