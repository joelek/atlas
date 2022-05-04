"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionManager = exports.TransactionalQuery = exports.TransactionalLink = exports.TransactionalStore = exports.WritableQueue = exports.ReadableQueue = void 0;
const utils_1 = require("./utils");
class ReadableQueue {
    queue;
    constructor(queue) {
        this.queue = queue;
    }
    enqueueReadableOperation(operation) {
        return this.queue.enqueue(operation);
    }
}
exports.ReadableQueue = ReadableQueue;
;
class WritableQueue extends ReadableQueue {
    constructor(queue) {
        super(queue);
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
        return queue.enqueueReadableOperation(() => this.store.filter(...parameters));
    }
    insert(queue, ...parameters) {
        return queue.enqueueWritableOperation(() => this.store.insert(...parameters));
    }
    length(queue, ...parameters) {
        return queue.enqueueReadableOperation(() => this.store.length(...parameters));
    }
    lookup(queue, ...parameters) {
        return queue.enqueueReadableOperation(() => this.store.lookup(...parameters));
    }
    remove(queue, ...parameters) {
        return queue.enqueueWritableOperation(() => this.store.remove(...parameters));
    }
    search(queue, ...parameters) {
        return queue.enqueueReadableOperation(() => this.store.search(...parameters));
    }
    update(queue, ...parameters) {
        return queue.enqueueWritableOperation(() => this.store.update(...parameters));
    }
    vacate(queue, ...parameters) {
        return queue.enqueueWritableOperation(() => this.store.vacate(...parameters));
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
        return queue.enqueueReadableOperation(() => this.link.filter(...parameters));
    }
    lookup(queue, ...parameters) {
        return queue.enqueueReadableOperation(() => this.link.lookup(...parameters));
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
        return queue.enqueueReadableOperation(() => this.query.filter(...parameters));
    }
}
exports.TransactionalQuery = TransactionalQuery;
;
class TransactionManager {
    file;
    readableTransactionLock;
    writableTransactionLock;
    stores;
    links;
    queries;
    createTransactionalStores(writableStores) {
        let transactionalStores = {};
        for (let key in writableStores) {
            transactionalStores[key] = new TransactionalStore(writableStores[key]);
        }
        return transactionalStores;
    }
    createTransactionalLinks(writableLinks) {
        let transactionalLinks = {};
        for (let key in writableLinks) {
            transactionalLinks[key] = new TransactionalLink(writableLinks[key]);
        }
        return transactionalLinks;
    }
    createTransactionalQueries(writableQueries) {
        let transactionalQueries = {};
        for (let key in writableQueries) {
            transactionalQueries[key] = new TransactionalQuery(writableQueries[key]);
        }
        return transactionalQueries;
    }
    constructor(file, writableStores, writableLinks, writableQueries) {
        this.file = file;
        this.readableTransactionLock = Promise.resolve();
        this.writableTransactionLock = Promise.resolve();
        this.stores = this.createTransactionalStores(writableStores);
        this.links = this.createTransactionalLinks(writableLinks);
        this.queries = this.createTransactionalQueries(writableQueries);
    }
    async enqueueReadableTransaction(transaction) {
        let queue = new utils_1.PromiseQueue();
        let readableQueue = new ReadableQueue(queue);
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
        let writableQueue = new WritableQueue(queue);
        let promise = this.writableTransactionLock
            .then(() => transaction(writableQueue))
            .then((value) => queue.enqueue(() => value));
        this.writableTransactionLock = this.readableTransactionLock = this.writableTransactionLock
            .then(() => promise)
            .catch(() => { });
        try {
            let value = await promise;
            this.file.persist();
            return value;
        }
        catch (error) {
            this.file.discard();
            throw error;
        }
        finally {
            queue.close();
        }
    }
}
exports.TransactionManager = TransactionManager;
;
