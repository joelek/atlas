"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Store = exports.SearchIndex = exports.Index = exports.StoreManager = exports.SearchIndexManager = exports.makeSeekableIterable = exports.getFirstTokenBefore = exports.getFirstCompletion = exports.IndexManager = exports.FilteredStore = void 0;
const bedrock = require("@joelek/bedrock");
const streams_1 = require("./streams");
const filters_1 = require("./filters");
const tables_1 = require("./tables");
const orders_1 = require("./orders");
const records_1 = require("./records");
const trees_1 = require("./trees");
const sorters_1 = require("../mod/sorters");
const utils_1 = require("./utils");
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
    keys;
    tree;
    constructor(recordManager, blockManager, keys, options) {
        this.recordManager = recordManager;
        this.blockManager = blockManager;
        this.keys = keys;
        this.tree = new trees_1.RadixTree(blockManager, options?.bid);
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
                let branch = streams_1.StreamIterable.of(tree.branch("=", [encodedValue])).shift();
                if (branch == null) {
                    return;
                }
                delete filters[indexKey];
                delete orders[indexKey];
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
        return new FilteredStore(this.recordManager, this.blockManager, iterable, filters, orders);
    }
    insert(keysRecord, bid) {
        let keys = this.recordManager.encodeKeys(this.keys, keysRecord);
        this.tree.insert(keys, bid);
    }
    remove(keysRecord) {
        let keys = this.recordManager.encodeKeys(this.keys, keysRecord);
        this.tree.remove(keys);
    }
    update(oldKeysRecord, newKeysRecord, bid) {
        let oldKeys = this.recordManager.encodeKeys(this.keys, oldKeysRecord);
        let newKeys = this.recordManager.encodeKeys(this.keys, newKeysRecord);
        if ((0, tables_1.compareBuffers)(oldKeys, newKeys) === 0) {
            return;
        }
        this.tree.remove(oldKeys);
        this.tree.insert(newKeys, bid);
    }
    vacate() {
        this.tree.vacate();
    }
}
exports.IndexManager = IndexManager;
;
function getFirstCompletion(prefix, tokens) {
    return tokens
        .filter((token) => token.startsWith(prefix))
        .map((token) => bedrock.codecs.String.encodePayload(token))
        .sort(bedrock.utils.Chunk.comparePrefixes)
        .map((buffer) => bedrock.codecs.String.decodePayload(buffer))
        .shift();
}
exports.getFirstCompletion = getFirstCompletion;
;
function getFirstTokenBefore(prefix, tokens) {
    let encodedPrefix = bedrock.codecs.String.encodePayload(prefix);
    return tokens
        .map((token) => bedrock.codecs.String.encodePayload(token))
        .filter((token) => bedrock.utils.Chunk.comparePrefixes(token, encodedPrefix) < 0)
        .sort(bedrock.utils.Chunk.comparePrefixes)
        .map((buffer) => bedrock.codecs.String.decodePayload(buffer))
        .shift();
}
exports.getFirstTokenBefore = getFirstTokenBefore;
;
function makeSeekableIterable(tree, value) {
    function makeIterable(value, skip) {
        if (value != null) {
            if (skip) {
                return tree.filter(">", [
                    bedrock.codecs.Integer.encodePayload(value)
                ]);
            }
            else {
                return tree.filter(">=", [
                    bedrock.codecs.Integer.encodePayload(value)
                ]);
            }
        }
        else {
            return tree;
        }
    }
    let iterable = makeIterable(value, true);
    let iterator = iterable[Symbol.iterator]();
    return {
        [Symbol.iterator]() {
            return iterable[Symbol.iterator]();
        },
        next() {
            return iterator.next().value;
        },
        seek(value) {
            iterable = makeIterable(value, false);
            iterator = iterable[Symbol.iterator]();
            return this.next();
        }
    };
}
exports.makeSeekableIterable = makeSeekableIterable;
;
class SearchIndexManager {
    recordManager;
    blockManager;
    key;
    tree;
    computeRank(recordTokens, queryTokens) {
        return queryTokens.length - recordTokens.length;
    }
    computeRecordRank(record, query) {
        let recordTokens = this.tokenizeRecord(record);
        let queryTokens = utils_1.Tokenizer.tokenize(query);
        let lastQueryToken = queryTokens.pop() ?? "";
        for (let queryToken of queryTokens) {
            if (recordTokens.find((recordToken) => recordToken === queryToken) == null) {
                return;
            }
        }
        if (recordTokens.find((recordToken) => recordToken.startsWith(lastQueryToken)) == null) {
            return;
        }
        return this.computeRank(recordTokens, [...queryTokens, lastQueryToken]);
    }
    insertToken(token, category, bid) {
        this.tree.insert([
            bedrock.codecs.Integer.encodePayload(category),
            bedrock.codecs.String.encodePayload(token),
            bedrock.codecs.Integer.encodePayload(bid)
        ], bid);
    }
    removeToken(token, category, bid) {
        this.tree.remove([
            bedrock.codecs.Integer.encodePayload(category),
            bedrock.codecs.String.encodePayload(token),
            bedrock.codecs.Integer.encodePayload(bid)
        ]);
    }
    readRecord(bid) {
        let buffer = this.blockManager.readBlock(bid);
        let record = this.recordManager.decode(buffer);
        return record;
    }
    tokenizeRecord(record) {
        let value = record[this.key];
        if (typeof value === "string") {
            return utils_1.Tokenizer.tokenize(value);
        }
        return [];
    }
    constructor(recordManager, blockManager, key, options) {
        this.recordManager = recordManager;
        this.blockManager = blockManager;
        this.key = key;
        this.tree = new trees_1.RadixTree(blockManager, options?.bid);
    }
    *[Symbol.iterator]() {
        yield* streams_1.StreamIterable.of(this.search(""));
    }
    delete() {
        this.tree.delete();
    }
    insert(record, bid) {
        let tokens = this.tokenizeRecord(record);
        for (let token of tokens) {
            this.insertToken(token, tokens.length, bid);
        }
    }
    remove(record, bid) {
        let tokens = this.tokenizeRecord(record);
        for (let token of tokens) {
            this.removeToken(token, tokens.length, bid);
        }
    }
    *search(query, bid) {
        let queryTokens = utils_1.Tokenizer.tokenize(query);
        if (queryTokens.length === 0) {
            queryTokens.push("");
        }
        let queryCategory = queryTokens.length;
        let lastQueryToken = queryTokens.pop();
        let firstCategory = queryCategory;
        let firstTokenInCategory = lastQueryToken;
        if (bid != null) {
            let record = this.readRecord(bid);
            let recordTokens = this.tokenizeRecord(record);
            let recordCategory = recordTokens.length;
            if (recordCategory < queryCategory) {
                return;
            }
            firstCategory = recordCategory;
            let firstCompletion = getFirstCompletion(lastQueryToken, recordTokens);
            if (firstCompletion == null) {
                return;
            }
            firstTokenInCategory = firstCompletion;
        }
        let categoryBranches = this.tree.branch(">=", [
            bedrock.codecs.Integer.encodePayload(firstCategory)
        ]);
        if (queryTokens.length === 0) {
            let firstBidInCategory = bid ?? 0;
            for (let categoryBranch of categoryBranches) {
                let keys = [
                    bedrock.codecs.String.encodePayload(firstTokenInCategory),
                    bedrock.codecs.Integer.encodePayload(firstBidInCategory)
                ];
                let bids = categoryBranch.filter(">", keys);
                for (let bid of bids) {
                    let record = this.readRecord(bid);
                    let recordTokens = this.tokenizeRecord(record);
                    let firstCompletion = getFirstCompletion(lastQueryToken, recordTokens);
                    if (firstCompletion == null) {
                        break;
                    }
                    let recordKeys = [
                        bedrock.codecs.String.encodePayload(firstCompletion),
                        bedrock.codecs.Integer.encodePayload(bid)
                    ];
                    if ((0, tables_1.compareBuffers)(recordKeys, keys) <= 0) {
                        continue;
                    }
                    keys = recordKeys;
                    let rank = this.computeRank(recordTokens, [...queryTokens, lastQueryToken]);
                    yield {
                        record,
                        rank
                    };
                }
                firstTokenInCategory = lastQueryToken;
                firstBidInCategory = 0;
            }
        }
        else {
            let firstBidInCategory = bid ?? 0;
            let encodedQueryTokens = queryTokens.map((queryToken) => {
                return bedrock.codecs.String.encodePayload(queryToken);
            });
            for (let categoryBranch of categoryBranches) {
                let tokenBranches = encodedQueryTokens.map((encodedQueryToken) => {
                    return categoryBranch.branch("=", [
                        encodedQueryToken
                    ]);
                });
                let iterables = tokenBranches.map((tokenBranch) => {
                    let iterables = Array.from(tokenBranch)
                        .map((tree) => makeSeekableIterable(tree, firstBidInCategory));
                    return (0, utils_1.union)(iterables, (one, two) => one - two);
                });
                let iterable = (0, utils_1.intersection)(iterables, (one, two) => one - two);
                for (let bid of iterable) {
                    let record = this.readRecord(bid);
                    let recordTokens = this.tokenizeRecord(record);
                    let tokensLeft = recordTokens.filter((recordToken) => !queryTokens.includes(recordToken));
                    if (tokensLeft.find((token) => token.startsWith(lastQueryToken)) == null) {
                        continue;
                    }
                    let rank = this.computeRank(recordTokens, [...queryTokens, lastQueryToken]);
                    yield {
                        record,
                        rank
                    };
                }
                firstBidInCategory = 0;
            }
        }
    }
    update(oldRecord, newRecord, bid) {
        this.remove(oldRecord, bid);
        this.insert(newRecord, bid);
    }
    vacate() {
        this.tree.vacate();
    }
    static *search(searchIndexManagers, query, bid) {
        let iterables = searchIndexManagers.map((searchIndexManager) => searchIndexManager.search(query, bid));
        let iterators = iterables.map((iterable) => iterable[Symbol.iterator]());
        let searchResults = iterators.map((iterator) => iterator.next().value);
        outer: while (true) {
            let candidates = searchResults
                .map((searchResult, index) => ({ searchResult, index }))
                .filter((candidate) => candidate.searchResult != null)
                .sort(sorters_1.CompositeSorter.of(sorters_1.NumberSorter.increasing((record) => record.searchResult.rank), sorters_1.NumberSorter.decreasing((record) => record.index)));
            let candidate = candidates.pop();
            if (candidate == null) {
                break;
            }
            inner: for (let [index, searchIndexManager] of searchIndexManagers.entries()) {
                if (index === candidate.index) {
                    continue;
                }
                let rank = searchIndexManager.computeRecordRank(candidate.searchResult.record, query);
                if (rank == null) {
                    continue;
                }
                // The candidate has already been yielded since it is ranked higher by the current SearchIndexManager.
                if (rank > candidate.searchResult.rank) {
                    searchResults[candidate.index] = iterators[candidate.index].next().value;
                    continue outer;
                }
                // The candidate has already been yielded since it is ranked equally by the current SearchIndexManager which has precedence.
                if (rank === candidate.searchResult.rank && index < candidate.index) {
                    searchResults[candidate.index] = iterators[candidate.index].next().value;
                    continue outer;
                }
            }
            yield candidate.searchResult;
            searchResults[candidate.index] = iterators[candidate.index].next().value;
        }
    }
}
exports.SearchIndexManager = SearchIndexManager;
;
class StoreManager {
    blockManager;
    fields;
    keys;
    orders;
    recordManager;
    table;
    indexManagers;
    searchIndexManagers;
    getDefaultRecord() {
        let record = {};
        for (let key in this.fields) {
            record[key] = this.fields[key].getDefaultValue();
        }
        return record;
    }
    lookupBlockIndex(keysRecord) {
        let key = this.recordManager.encodeKeys(this.keys, keysRecord);
        let index = this.table.lookup(key);
        if (index == null) {
            let key = this.keys.map((key) => keysRecord[key]).join(", ");
            throw `Expected a matching record for key ${key}!`;
        }
        return index;
    }
    checkConstraints(record) {
        let recordKey = this.recordManager.encodeKeys(this.keys, record);
        for (let fieldKey in this.fields) {
            let field = this.fields[fieldKey];
            if (!field.getUnique()) {
                continue;
            }
            if (record[fieldKey] == null) {
                continue;
            }
            let existingRecord = this.filter({
                [fieldKey]: new filters_1.EqualityFilter(record[fieldKey])
            }, undefined, undefined, 1).pop();
            if (existingRecord == null) {
                continue;
            }
            let existingRecordKey = this.recordManager.encodeKeys(this.keys, existingRecord);
            if ((0, tables_1.compareBuffers)(recordKey, existingRecordKey) === 0) {
                continue;
            }
            throw new Error(`Expected value of field "${fieldKey}" to be unique!`);
        }
    }
    constructor(blockManager, fields, keys, orders, table, indexManagers, searchIndexManagers) {
        this.blockManager = blockManager;
        this.fields = fields;
        this.keys = keys;
        this.orders = orders;
        this.recordManager = new records_1.RecordManager(fields);
        this.table = table;
        this.indexManagers = indexManagers;
        this.searchIndexManagers = searchIndexManagers;
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
        for (let searchIndexManager of this.searchIndexManagers) {
            searchIndexManager.delete();
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
        let filteredStores = [];
        for (let indexManager of this.indexManagers) {
            let filteredStore = indexManager.filter(filters, orders, anchor);
            if (filteredStore == null) {
                // We can exit early as the index manager has signaled that there are no matching records.
                return [];
            }
            filteredStores.push(filteredStore);
        }
        filteredStores.push(new FilteredStore(this.recordManager, this.blockManager, this.table, filters, orders, anchor));
        let filteredStore = FilteredStore.getOptimal(filteredStores);
        let iterable = streams_1.StreamIterable.of(filteredStore);
        if (limit != null) {
            iterable = iterable.limit(limit);
        }
        return iterable.collect();
    }
    insert(record) {
        this.checkConstraints(record);
        let key = this.recordManager.encodeKeys(this.keys, record);
        let encoded = this.recordManager.encode(record);
        let index = this.table.lookup(key);
        if (index == null) {
            index = this.blockManager.createBlock(encoded.length);
            this.blockManager.writeBlock(index, encoded);
            this.table.insert(key, index);
            for (let indexManager of this.indexManagers) {
                indexManager.insert(record, index);
            }
            for (let searchIndexManager of this.searchIndexManagers) {
                searchIndexManager.insert(record, index);
            }
        }
        else {
            let buffer = this.blockManager.readBlock(index);
            // Bedrock encodes records with a payload length prefix making it sufficient to compare the encoded record to the prefix of the block.
            if ((0, tables_1.compareBuffers)([encoded], [buffer.subarray(0, encoded.length)]) === 0) {
                return;
            }
            let oldRecord = this.recordManager.decode(buffer);
            this.blockManager.resizeBlock(index, encoded.length);
            this.blockManager.writeBlock(index, encoded);
            for (let indexManager of this.indexManagers) {
                indexManager.update(oldRecord, record, index);
            }
            for (let searchIndexManager of this.searchIndexManagers) {
                searchIndexManager.update(oldRecord, record, index);
            }
        }
    }
    length() {
        return this.table.length();
    }
    lookup(keysRecord) {
        let index = this.lookupBlockIndex(keysRecord);
        let buffer = this.blockManager.readBlock(index);
        let record = this.recordManager.decode(buffer);
        return record;
    }
    reload() {
        this.table.reload();
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
            for (let searchIndexManager of this.searchIndexManagers) {
                searchIndexManager.remove(oldRecord, index);
            }
        }
    }
    search(query, anchorKeysRecord, limit) {
        if (query === "") {
            return streams_1.StreamIterable.of(this.filter(undefined, undefined, anchorKeysRecord, limit))
                .map((record) => ({
                record,
                rank: 0
            }))
                .collect();
        }
        let anchorBid = anchorKeysRecord != null ? this.lookupBlockIndex(anchorKeysRecord) : undefined;
        let iterable = streams_1.StreamIterable.of(SearchIndexManager.search(this.searchIndexManagers, query, anchorBid));
        if (limit != null) {
            iterable = iterable.limit(limit);
        }
        return iterable.collect();
    }
    update(keysRecord) {
        let record = {
            ...this.getDefaultRecord(),
            ...keysRecord
        };
        try {
            record = {
                ...this.lookup(keysRecord),
                ...keysRecord
            };
        }
        catch (error) { }
        return this.insert(record);
    }
    vacate() {
        for (let bid of this.table) {
            this.blockManager.deleteBlock(bid);
        }
        for (let indexManager of this.indexManagers) {
            indexManager.vacate();
        }
        for (let searchIndexManager of this.searchIndexManagers) {
            searchIndexManager.vacate();
        }
        this.table.vacate();
    }
    static construct(blockManager, options) {
        let fields = options.fields;
        let keys = options.keys;
        let orders = options.orders ?? {};
        let indices = options.indices ?? [];
        let searchIndices = options.searchIndices ?? [];
        let recordManager = new records_1.RecordManager(fields);
        let storage = new tables_1.Table(blockManager, {
            getKeyFromValue: (value) => {
                let buffer = blockManager.readBlock(value);
                let record = recordManager.decode(buffer);
                return recordManager.encodeKeys(keys, record);
            }
        });
        let indexManagers = indices.map((index) => new IndexManager(recordManager, blockManager, index.keys));
        let searchIndexManagers = searchIndices.map((index) => new SearchIndexManager(recordManager, blockManager, index.key));
        let manager = new StoreManager(blockManager, fields, keys, orders, storage, indexManagers, searchIndexManagers);
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
class SearchIndex {
    key;
    constructor(key) {
        this.key = key;
    }
    equals(that) {
        return this.key === that.key;
    }
}
exports.SearchIndex = SearchIndex;
;
class Store {
    fields;
    keys;
    orders;
    indices;
    searchIndices;
    constructor(fields, keys, orders) {
        this.fields = fields;
        this.keys = keys;
        this.orders = orders ?? {};
        this.indices = [];
        this.searchIndices = [];
        this.index(this.createIndex());
        for (let key in fields) {
            if (fields[key].getSearchable()) {
                this.searchIndices.push(new SearchIndex(key));
            }
            if (fields[key].getUnique()) {
                this.index(new Index([key, ...this.keys]));
            }
        }
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
                return false;
            }
        }
        this.indices.push(that);
        return true;
    }
}
exports.Store = Store;
;
