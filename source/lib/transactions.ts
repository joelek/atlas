import { File } from "./files";
import { Record, KeysRecordMap, RequiredKeys } from "./records";
import { Links, LinksFromWritableLinks, ReadableLink, ReadableLinksFromLinks, WritableLink, WritableLinks, WritableLinksFromLinks } from "./links";
import { ReadableStore, ReadableStoresFromStores, Stores, StoresFromWritableStores, WritableStore, WritableStores, WritableStoresFromStores } from "./stores";
import { PromiseQueue } from "./utils";
import { Queries, QueriesFromWritableQueries, ReadableQueriesFromQueries, ReadableQuery, WritableQueries, WritableQueriesFromQueries, WritableQuery } from "./queries";
import { SubsetOf } from "./inference";

export class ReadableQueue {
	protected queue: PromiseQueue;

	constructor(queue: PromiseQueue) {
		this.queue = queue;
	}

	enqueueReadableOperation<A>(operation: Promise<A> | (() => Promise<A>) | (() => A)): Promise<A> {
		return this.queue.enqueue(operation);
	}
};

export class WritableQueue extends ReadableQueue {
	constructor(queue: PromiseQueue) {
		super(queue);
	}

	enqueueWritableOperation<A>(operation: Promise<A> | (() => Promise<A>) | (() => A)): Promise<A> {
		return this.queue.enqueue(operation);
	}
};

export class TransactionalStore<A extends Record, B extends RequiredKeys<A>> {
	protected store: WritableStore<A, B>;

	constructor(store: WritableStore<A, B>) {
		this.store = store;
	}

	filter(queue: ReadableQueue, ...parameters: Parameters<WritableStore<A, B>["filter"]>): ReturnType<WritableStore<A, B>["filter"]> {
		return queue.enqueueReadableOperation(() => this.store.filter(...parameters));
	}

	insert(queue: WritableQueue, ...parameters: Parameters<WritableStore<A, B>["insert"]>): ReturnType<WritableStore<A, B>["insert"]> {
		return queue.enqueueWritableOperation(() => this.store.insert(...parameters));
	}

	length(queue: ReadableQueue, ...parameters: Parameters<WritableStore<A, B>["length"]>): ReturnType<WritableStore<A, B>["length"]> {
		return queue.enqueueReadableOperation(() => this.store.length(...parameters));
	}

	lookup(queue: ReadableQueue, ...parameters: Parameters<WritableStore<A, B>["lookup"]>): ReturnType<WritableStore<A, B>["lookup"]> {
		return queue.enqueueReadableOperation(() => this.store.lookup(...parameters));
	}

	remove(queue: WritableQueue, ...parameters: Parameters<WritableStore<A, B>["remove"]>): ReturnType<WritableStore<A, B>["remove"]> {
		return queue.enqueueWritableOperation(() => this.store.remove(...parameters));
	}

	update(queue: WritableQueue, ...parameters: Parameters<WritableStore<A, B>["update"]>): ReturnType<WritableStore<A, B>["update"]> {
		return queue.enqueueWritableOperation(() => this.store.update(...parameters));
	}
};

export type TransactionalStoresFromWritableStores<A extends WritableStores<any>> = {
	[B in keyof A]: A[B] extends WritableStore<infer C, infer D> ? TransactionalStore<C, D> : never;
};

export class TransactionalLink<A extends Record, B extends RequiredKeys<A>, C extends Record, D extends RequiredKeys<C>, E extends KeysRecordMap<A, B, C>> {
	protected link: WritableLink<A, B, C, D, E>;

	constructor(link: WritableLink<A, B, C, D, E>) {
		this.link = link;
	}

	filter(queue: ReadableQueue, ...parameters: Parameters<WritableLink<A, B, C, D, E>["filter"]>): ReturnType<WritableLink<A, B, C, D, E>["filter"]> {
		return queue.enqueueReadableOperation(() => this.link.filter(...parameters));
	}

	lookup(queue: ReadableQueue, ...parameters: Parameters<WritableLink<A, B, C, D, E>["lookup"]>): ReturnType<WritableLink<A, B, C, D, E>["lookup"]> {
		return queue.enqueueReadableOperation(() => this.link.lookup(...parameters));
	}
};

export type TransactionalLinksFromWritableLinks<A extends WritableLinks<any>> = {
	[B in keyof A]: A[B] extends WritableLink<infer C, infer D, infer E, infer F, infer G> ? TransactionalLink<C, D, E, F, G> : never;
};

export class TransactionalQuery<A extends Record, B extends RequiredKeys<A>, C extends SubsetOf<A, C>, D extends SubsetOf<A, D>> {
	protected query: WritableQuery<A, B, C, D>;

	constructor(query: WritableQuery<A, B, C, D>) {
		this.query = query;
	}

	filter(queue: ReadableQueue, ...parameters: Parameters<WritableQuery<A, B, C, D>["filter"]>): ReturnType<WritableQuery<A, B, C, D>["filter"]> {
		return queue.enqueueReadableOperation(() => this.query.filter(...parameters));
	}
};

export type TransactionalQueriesFromWritableQueries<A extends WritableQueries<any>> = {
	[B in keyof A]: A[B] extends WritableQuery<infer C, infer D, infer E, infer F> ? TransactionalQuery<C, D, E, F> : never;
};

export class QueuedReadableStore<A extends Record, B extends RequiredKeys<A>> implements ReadableStore<A, B> {
	protected writableStore: WritableStore<A, B>;
	protected queue: PromiseQueue;

	constructor(writableStore: WritableStore<A, B>, queue: PromiseQueue) {
		this.writableStore = writableStore;
		this.queue = queue;
	}

	filter(...parameters: Parameters<ReadableStore<A, B>["filter"]>): ReturnType<ReadableStore<A, B>["filter"]> {
		return this.queue.enqueue(() => this.writableStore.filter(...parameters));
	}

	length(...parameters: Parameters<ReadableStore<A, B>["length"]>): ReturnType<ReadableStore<A, B>["length"]> {
		return this.queue.enqueue(() => this.writableStore.length(...parameters));
	}

	lookup(...parameters: Parameters<ReadableStore<A, B>["lookup"]>): ReturnType<ReadableStore<A, B>["lookup"]> {
		return this.queue.enqueue(() => this.writableStore.lookup(...parameters));
	}
};

export class QueuedWritableStore<A extends Record, B extends RequiredKeys<A>> extends QueuedReadableStore<A, B> implements WritableStore<A, B> {
	constructor(writableStore: WritableStore<A, B>, queue: PromiseQueue) {
		super(writableStore, queue);
	}

	insert(...parameters: Parameters<WritableStore<A, B>["insert"]>): ReturnType<WritableStore<A, B>["insert"]> {
		return this.queue.enqueue(() => this.writableStore.insert(...parameters));
	}

	remove(...parameters: Parameters<WritableStore<A, B>["remove"]>): ReturnType<WritableStore<A, B>["remove"]> {
		return this.queue.enqueue(() => this.writableStore.remove(...parameters));
	}

	update(...parameters: Parameters<WritableStore<A, B>["update"]>): ReturnType<WritableStore<A, B>["update"]> {
		return this.queue.enqueue(() => this.writableStore.update(...parameters));
	}
};

export class QueuedReadableLink<A extends Record, B extends RequiredKeys<A>, C extends Record, D extends RequiredKeys<C>, E extends KeysRecordMap<A, B, C>> implements ReadableLink<A, B, C, D, E> {
	protected writableLink: WritableLink<A, B, C, D, E>;
	protected queue: PromiseQueue;

	constructor(writableLink: WritableLink<A, B, C, D, E>, queue: PromiseQueue) {
		this.writableLink = writableLink;
		this.queue = queue;
	}

	filter(...parameters: Parameters<ReadableLink<A, B, C, D, E>["filter"]>): ReturnType<ReadableLink<A, B, C, D, E>["filter"]> {
		return this.queue.enqueue(() => this.writableLink.filter(...parameters));
	}

	lookup(...parameters: Parameters<ReadableLink<A, B, C, D, E>["lookup"]>): ReturnType<ReadableLink<A, B, C, D, E>["lookup"]> {
		return this.queue.enqueue(() => this.writableLink.lookup(...parameters));
	}
};

export class QueuedWritableLink<A extends Record, B extends RequiredKeys<A>, C extends Record, D extends RequiredKeys<C>, E extends KeysRecordMap<A, B, C>> extends QueuedReadableLink<A, B, C, D, E> implements WritableLink<A, B, C, D, E> {
	constructor(writableLink: WritableLink<A, B, C, D, E>, queue: PromiseQueue) {
		super(writableLink, queue);
	}
};

export class QueuedReadableQuery<A extends Record, B extends RequiredKeys<A>, C extends SubsetOf<A, C>, D extends SubsetOf<A, D>> implements ReadableQuery<A, B, C, D> {
	protected writableQuery: WritableQuery<A, B, C, D>;
	protected queue: PromiseQueue;

	constructor(writableQuery: WritableQuery<A, B, C, D>, queue: PromiseQueue) {
		this.writableQuery = writableQuery;
		this.queue = queue;
	}

	filter(...parameters: Parameters<ReadableQuery<A, B, C, D>["filter"]>): ReturnType<ReadableQuery<A, B, C, D>["filter"]> {
		return this.queue.enqueue(() => this.writableQuery.filter(...parameters));
	}
};

export class QueuedWritableQuery<A extends Record, B extends RequiredKeys<A>, C extends SubsetOf<A, C>, D extends SubsetOf<A, D>> extends QueuedReadableQuery<A, B, C, D> implements WritableQuery<A, B, C, D> {
	constructor(writableQuery: WritableQuery<A, B, C, D>, queue: PromiseQueue) {
		super(writableQuery, queue);
	}
};

export type ReadableTransaction<A extends Stores<any>, B extends Links<any>, C extends Queries<any>, D> = (queue: ReadableQueue, stores: ReadableStoresFromStores<A>, links: ReadableLinksFromLinks<B>, queries: ReadableQueriesFromQueries<C>) => Promise<D>;

export type WritableTransaction<A extends Stores<any>, B extends Links<any>, C extends Queries<any>, D> = (queue: WritableQueue, stores: WritableStoresFromStores<A>, links: WritableLinksFromLinks<B>, queries: WritableQueriesFromQueries<C>) => Promise<D>;

export class TransactionManager<A extends WritableStores<any>, B extends WritableLinks<any>, C extends WritableQueries<any>> {
	private file: File;
	private readableTransactionLock: Promise<any>;
	private writableTransactionLock: Promise<any>;
	private writableStores: A;
	private writableLinks: B;
	private writableQueries: C;

	private createReadableLinks(queue: PromiseQueue): ReadableLinksFromLinks<LinksFromWritableLinks<B>> {
		let readableLinks = {} as ReadableLinksFromLinks<any>;
		for (let key in this.writableLinks) {
			readableLinks[key] = new QueuedReadableLink(this.writableLinks[key], queue);
		}
		return readableLinks;
	}

	private createReadableStores(queue: PromiseQueue): ReadableStoresFromStores<StoresFromWritableStores<A>> {
		let readableStores = {} as ReadableStoresFromStores<any>;
		for (let key in this.writableStores) {
			readableStores[key] = new QueuedReadableStore(this.writableStores[key], queue);
		}
		return readableStores;
	}

	private createReadableQueries(queue: PromiseQueue): ReadableQueriesFromQueries<QueriesFromWritableQueries<C>> {
		let readableQueries = {} as ReadableQueriesFromQueries<any>;
		for (let key in this.writableQueries) {
			readableQueries[key] = new QueuedReadableQuery(this.writableQueries[key], queue);
		}
		return readableQueries;
	}

	private createWritableLinks(queue: PromiseQueue): WritableLinksFromLinks<LinksFromWritableLinks<B>> {
		let writableLinks = {} as WritableLinksFromLinks<any>;
		for (let key in this.writableLinks) {
			writableLinks[key] = new QueuedWritableLink(this.writableLinks[key], queue);
		}
		return writableLinks;
	}

	private createWritableStores(queue: PromiseQueue): WritableStoresFromStores<StoresFromWritableStores<A>> {
		let writableStores = {} as WritableStoresFromStores<any>;
		for (let key in this.writableStores) {
			writableStores[key] = new QueuedWritableStore(this.writableStores[key], queue);
		}
		return writableStores;
	}

	private createWritableQueries(queue: PromiseQueue): WritableQueriesFromQueries<QueriesFromWritableQueries<C>> {
		let writableQueries = {} as WritableQueriesFromQueries<any>;
		for (let key in this.writableQueries) {
			writableQueries[key] = new QueuedWritableQuery(this.writableQueries[key], queue);
		}
		return writableQueries;
	}

	constructor(file: File, writableStores: A, writableLinks: B, writableQueries: C) {
		this.file = file;
		this.readableTransactionLock = Promise.resolve();
		this.writableTransactionLock = Promise.resolve();
		this.writableStores = writableStores;
		this.writableLinks = writableLinks;
		this.writableQueries = writableQueries;
	}

	createTransactionalStores(): TransactionalStoresFromWritableStores<A> {
		let transactionalStores = {} as TransactionalStoresFromWritableStores<any>;
		for (let key in this.writableStores) {
			transactionalStores[key] = new TransactionalStore(this.writableStores[key]);
		}
		return transactionalStores;
	}

	createTransactionalLinks(): TransactionalLinksFromWritableLinks<B> {
		let transactionalLinks = {} as TransactionalLinksFromWritableLinks<any>;
		for (let key in this.writableLinks) {
			transactionalLinks[key] = new TransactionalLink(this.writableLinks[key]);
		}
		return transactionalLinks;
	}

	createTransactionalQueries(): TransactionalQueriesFromWritableQueries<C> {
		let transactionalQueries = {} as TransactionalQueriesFromWritableQueries<any>;
		for (let key in this.writableQueries) {
			transactionalQueries[key] = new TransactionalQuery(this.writableQueries[key]);
		}
		return transactionalQueries;
	}

	async enqueueReadableTransaction<D>(transaction: ReadableTransaction<StoresFromWritableStores<A>, LinksFromWritableLinks<B>, QueriesFromWritableQueries<C>, D>): Promise<D> {
		let queue = new PromiseQueue();
		let readableQueue = new ReadableQueue(queue);
		let stores = this.createReadableStores(queue);
		let links = this.createReadableLinks(queue);
		let queries = this.createReadableQueries(queue);
		let promise = this.readableTransactionLock
			.then(() => transaction(readableQueue, stores, links, queries))
			.then((value) => queue.enqueue(() => value));
		this.writableTransactionLock = this.writableTransactionLock
			.then(() => promise)
			.catch(() => {});
		try {
			let value = await promise;
			return value;
		} catch (error) {
			throw error;
		} finally {
			queue.close();
		}
	}

	async enqueueWritableTransaction<D>(transaction: WritableTransaction<StoresFromWritableStores<A>, LinksFromWritableLinks<B>, QueriesFromWritableQueries<C>, D>): Promise<D> {
		let queue = new PromiseQueue();
		let writableQueue = new WritableQueue(queue);
		let stores = this.createWritableStores(queue);
		let links = this.createWritableLinks(queue);
		let queries = this.createWritableQueries(queue);
		let promise = this.writableTransactionLock
			.then(() => transaction(writableQueue, stores, links, queries))
			.then((value) => queue.enqueue(() => value));
		this.writableTransactionLock = this.readableTransactionLock = this.writableTransactionLock
			.then(() => promise)
			.catch(() => {});
		try {
			let value = await promise;
			this.file.persist();
			return value;
		} catch (error) {
			this.file.discard();
			throw error;
		} finally {
			queue.close();
		}
	}
};
