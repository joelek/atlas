"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionManager = exports.QueuedWritableLink = exports.QueuedReadableLink = exports.QueuedWritableStore = exports.QueuedReadableStore = void 0;
const utils_1 = require("./utils");
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
class TransactionManager {
    file;
    readableTransactionLock;
    writableTransactionLock;
    writableStores;
    writableLinks;
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
    constructor(file, writableStores, writableLinks) {
        this.file = file;
        this.readableTransactionLock = Promise.resolve();
        this.writableTransactionLock = Promise.resolve();
        this.writableStores = writableStores;
        this.writableLinks = writableLinks;
    }
    async enqueueReadableTransaction(transaction) {
        let queue = new utils_1.PromiseQueue();
        let stores = this.createReadableStores(queue);
        let links = this.createReadableLinks(queue);
        let promise = this.readableTransactionLock
            .then(() => transaction(stores, links))
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
        let stores = this.createWritableStores(queue);
        let links = this.createWritableLinks(queue);
        let promise = this.writableTransactionLock
            .then(() => transaction(stores, links))
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
