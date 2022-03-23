"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionManager = exports.QueuedWritableQuery = exports.QueuedReadableQuery = exports.QueuedWritableLink = exports.QueuedReadableLink = exports.QueuedWritableStore = exports.QueuedReadableStore = exports.WritableQueue = exports.ReadableQueue = void 0;
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
class QueuedReadableStore {
    writableStore;
    queue;
    constructor(writableStore, queue) {
        this.writableStore = writableStore;
        this.queue = queue;
    }
    filter(...parameters) {
        return this.queue.enqueue(() => this.writableStore.filter(...parameters));
    }
    length(...parameters) {
        return this.queue.enqueue(() => this.writableStore.length(...parameters));
    }
    lookup(...parameters) {
        return this.queue.enqueue(() => this.writableStore.lookup(...parameters));
    }
}
exports.QueuedReadableStore = QueuedReadableStore;
;
class QueuedWritableStore extends QueuedReadableStore {
    constructor(writableStore, queue) {
        super(writableStore, queue);
    }
    insert(...parameters) {
        return this.queue.enqueue(() => this.writableStore.insert(...parameters));
    }
    remove(...parameters) {
        return this.queue.enqueue(() => this.writableStore.remove(...parameters));
    }
    update(...parameters) {
        return this.queue.enqueue(() => this.writableStore.update(...parameters));
    }
}
exports.QueuedWritableStore = QueuedWritableStore;
;
class QueuedReadableLink {
    writableLink;
    queue;
    constructor(writableLink, queue) {
        this.writableLink = writableLink;
        this.queue = queue;
    }
    filter(...parameters) {
        return this.queue.enqueue(() => this.writableLink.filter(...parameters));
    }
    lookup(...parameters) {
        return this.queue.enqueue(() => this.writableLink.lookup(...parameters));
    }
}
exports.QueuedReadableLink = QueuedReadableLink;
;
class QueuedWritableLink extends QueuedReadableLink {
    constructor(writableLink, queue) {
        super(writableLink, queue);
    }
}
exports.QueuedWritableLink = QueuedWritableLink;
;
class QueuedReadableQuery {
    writableQuery;
    queue;
    constructor(writableQuery, queue) {
        this.writableQuery = writableQuery;
        this.queue = queue;
    }
    filter(...parameters) {
        return this.queue.enqueue(() => this.writableQuery.filter(...parameters));
    }
}
exports.QueuedReadableQuery = QueuedReadableQuery;
;
class QueuedWritableQuery extends QueuedReadableQuery {
    constructor(writableQuery, queue) {
        super(writableQuery, queue);
    }
}
exports.QueuedWritableQuery = QueuedWritableQuery;
;
class TransactionManager {
    file;
    readableTransactionLock;
    writableTransactionLock;
    writableStores;
    writableLinks;
    writableQueries;
    createReadableLinks(queue) {
        let readableLinks = {};
        for (let key in this.writableLinks) {
            readableLinks[key] = new QueuedReadableLink(this.writableLinks[key], queue);
        }
        return readableLinks;
    }
    createReadableStores(queue) {
        let readableStores = {};
        for (let key in this.writableStores) {
            readableStores[key] = new QueuedReadableStore(this.writableStores[key], queue);
        }
        return readableStores;
    }
    createReadableQueries(queue) {
        let readableQueries = {};
        for (let key in this.writableQueries) {
            readableQueries[key] = new QueuedReadableQuery(this.writableQueries[key], queue);
        }
        return readableQueries;
    }
    createWritableLinks(queue) {
        let writableLinks = {};
        for (let key in this.writableLinks) {
            writableLinks[key] = new QueuedWritableLink(this.writableLinks[key], queue);
        }
        return writableLinks;
    }
    createWritableStores(queue) {
        let writableStores = {};
        for (let key in this.writableStores) {
            writableStores[key] = new QueuedWritableStore(this.writableStores[key], queue);
        }
        return writableStores;
    }
    createWritableQueries(queue) {
        let writableQueries = {};
        for (let key in this.writableQueries) {
            writableQueries[key] = new QueuedWritableQuery(this.writableQueries[key], queue);
        }
        return writableQueries;
    }
    constructor(file, writableStores, writableLinks, writableQueries) {
        this.file = file;
        this.readableTransactionLock = Promise.resolve();
        this.writableTransactionLock = Promise.resolve();
        this.writableStores = writableStores;
        this.writableLinks = writableLinks;
        this.writableQueries = writableQueries;
    }
    async enqueueReadableTransaction(transaction) {
        let queue = new utils_1.PromiseQueue();
        let readableQueue = new ReadableQueue(queue);
        let stores = this.createReadableStores(queue);
        let links = this.createReadableLinks(queue);
        let queries = this.createReadableQueries(queue);
        let promise = this.readableTransactionLock
            .then(() => transaction(readableQueue, stores, links, queries))
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
        let stores = this.createWritableStores(queue);
        let links = this.createWritableLinks(queue);
        let queries = this.createWritableQueries(queue);
        let promise = this.writableTransactionLock
            .then(() => transaction(writableQueue, stores, links, queries))
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
