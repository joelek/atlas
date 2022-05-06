"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionManager = exports.TransactionalQuery = exports.TransactionalLink = exports.TransactionalStore = exports.WritableQueue = exports.ReadableQueue = void 0;
const utils_1 = require("./utils");
const caches_1 = require("./caches");
class ReadableQueue {
    queue;
    cache;
    constructor(queue, cache) {
        this.queue = queue;
        this.cache = cache;
    }
    enqueueReadableOperation(operation) {
        return this.queue.enqueue(operation);
    }
    getCache() {
        return this.cache;
    }
}
exports.ReadableQueue = ReadableQueue;
;
class WritableQueue extends ReadableQueue {
    constructor(queue, cache) {
        super(queue, cache);
    }
    enqueueWritableOperation(operation) {
        return this.queue.enqueue(operation);
    }
}
exports.WritableQueue = WritableQueue;
;
class TransactionalStore {
    store;
    constructor(store) {
        this.store = store;
    }
    filter(queue, ...parameters) {
        return queue.enqueueReadableOperation(() => this.store.filter(queue.getCache(), ...parameters));
    }
    insert(queue, ...parameters) {
        return queue.enqueueWritableOperation(() => this.store.insert(queue.getCache(), ...parameters));
    }
    length(queue, ...parameters) {
        return queue.enqueueReadableOperation(() => this.store.length(queue.getCache(), ...parameters));
    }
    lookup(queue, ...parameters) {
        return queue.enqueueReadableOperation(() => this.store.lookup(queue.getCache(), ...parameters));
    }
    remove(queue, ...parameters) {
        return queue.enqueueWritableOperation(() => this.store.remove(queue.getCache(), ...parameters));
    }
    search(queue, ...parameters) {
        return queue.enqueueReadableOperation(() => this.store.search(queue.getCache(), ...parameters));
    }
    update(queue, ...parameters) {
        return queue.enqueueWritableOperation(() => this.store.update(queue.getCache(), ...parameters));
    }
    vacate(queue, ...parameters) {
        return queue.enqueueWritableOperation(() => this.store.vacate(queue.getCache(), ...parameters));
    }
}
exports.TransactionalStore = TransactionalStore;
;
class TransactionalLink {
    link;
    constructor(link) {
        this.link = link;
    }
    filter(queue, ...parameters) {
        return queue.enqueueReadableOperation(() => this.link.filter(queue.getCache(), ...parameters));
    }
    lookup(queue, ...parameters) {
        return queue.enqueueReadableOperation(() => this.link.lookup(queue.getCache(), ...parameters));
    }
}
exports.TransactionalLink = TransactionalLink;
;
class TransactionalQuery {
    query;
    constructor(query) {
        this.query = query;
    }
    filter(queue, ...parameters) {
        return queue.enqueueReadableOperation(() => this.query.filter(queue.getCache(), ...parameters));
    }
}
exports.TransactionalQuery = TransactionalQuery;
;
;
class TransactionManager {
    file;
    readableTransactionLock;
    writableTransactionLock;
    cache;
    stores;
    links;
    queries;
    detail;
    createTransactionalStores(databaseStores) {
        let transactionalStores = {};
        for (let key in databaseStores) {
            transactionalStores[key] = new TransactionalStore(databaseStores[key]);
        }
        return transactionalStores;
    }
    createTransactionalLinks(databaseLinks) {
        let transactionalLinks = {};
        for (let key in databaseLinks) {
            transactionalLinks[key] = new TransactionalLink(databaseLinks[key]);
        }
        return transactionalLinks;
    }
    createTransactionalQueries(databaseQueries) {
        let transactionalQueries = {};
        for (let key in databaseQueries) {
            transactionalQueries[key] = new TransactionalQuery(databaseQueries[key]);
        }
        return transactionalQueries;
    }
    constructor(file, databaseStores, databaseLinks, databaseQueries, detail) {
        this.file = file;
        this.readableTransactionLock = Promise.resolve();
        this.writableTransactionLock = Promise.resolve();
        this.cache = new caches_1.Cache(undefined, 65536);
        this.stores = this.createTransactionalStores(databaseStores);
        this.links = this.createTransactionalLinks(databaseLinks);
        this.queries = this.createTransactionalQueries(databaseQueries);
        this.detail = detail;
    }
    async enqueueReadableTransaction(transaction) {
        let queue = new utils_1.PromiseQueue();
        let readableQueue = new ReadableQueue(queue, this.cache);
        let promise = this.readableTransactionLock
            .then(() => transaction(readableQueue))
            .then((value) => queue.enqueue(() => value));
        this.writableTransactionLock = this.writableTransactionLock
            .then(() => promise)
            .catch(() => { });
        try {
            let value = await promise;
            return value;
        }
        catch (error) {
            throw error;
        }
        finally {
            queue.close();
        }
    }
    async enqueueWritableTransaction(transaction) {
        let queue = new utils_1.PromiseQueue();
        let cache = new caches_1.Cache(undefined, 0);
        let writableQueue = new WritableQueue(queue, cache);
        let promise = this.writableTransactionLock
            .then(() => transaction(writableQueue))
            .then((value) => queue.enqueue(() => value));
        this.writableTransactionLock = this.readableTransactionLock = this.writableTransactionLock
            .then(() => promise)
            .catch(() => { });
        try {
            let value = await promise;
            this.file.persist();
            for (let { key, value } of cache) {
                this.cache.insert(key, value);
            }
            return value;
        }
        catch (error) {
            this.file.discard();
            this.detail?.onDiscard?.();
            throw error;
        }
        finally {
            queue.close();
        }
    }
}
exports.TransactionManager = TransactionManager;
;
