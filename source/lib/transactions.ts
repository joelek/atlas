import { File } from "./files";
import { Record, KeysRecordMap, RequiredKeys } from "./records";
import { WritableLink, WritableLinks } from "./links";
import { WritableStore, WritableStores } from "./stores";
import { PromiseQueue } from "./utils";
import { WritableQueries, WritableQuery } from "./queries";
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

	search(queue: ReadableQueue, ...parameters: Parameters<WritableStore<A, B>["search"]>): ReturnType<WritableStore<A, B>["search"]> {
		return queue.enqueueReadableOperation(() => this.store.search(...parameters));
	}

	update(queue: WritableQueue, ...parameters: Parameters<WritableStore<A, B>["update"]>): ReturnType<WritableStore<A, B>["update"]> {
		return queue.enqueueWritableOperation(() => this.store.update(...parameters));
	}

	vacate(queue: WritableQueue, ...parameters: Parameters<WritableStore<A, B>["vacate"]>): ReturnType<WritableStore<A, B>["vacate"]> {
		return queue.enqueueWritableOperation(() => this.store.vacate(...parameters));
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

export type ReadableTransaction<A> = (queue: ReadableQueue) => Promise<A>;

export type WritableTransaction<A> = (queue: WritableQueue) => Promise<A>;

export class TransactionManager<A extends WritableStores<any>, B extends WritableLinks<any>, C extends WritableQueries<any>> {
	private file: File;
	private readableTransactionLock: Promise<any>;
	private writableTransactionLock: Promise<any>;
	private writableStores: A;
	private writableLinks: B;
	private writableQueries: C;

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

	async enqueueReadableTransaction<D>(transaction: ReadableTransaction<D>): Promise<D> {
		let queue = new PromiseQueue();
		let readableQueue = new ReadableQueue(queue);
		let promise = this.readableTransactionLock
			.then(() => transaction(readableQueue))
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

	async enqueueWritableTransaction<D>(transaction: WritableTransaction<D>): Promise<D> {
		let queue = new PromiseQueue();
		let writableQueue = new WritableQueue(queue);
		let promise = this.writableTransactionLock
			.then(() => transaction(writableQueue))
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
