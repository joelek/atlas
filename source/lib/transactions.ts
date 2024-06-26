import { File } from "./files";
import { Record, KeysRecordMap, RequiredKeys } from "./records";
import { LinkInterface } from "./links";
import { StoreInterface } from "./stores";
import { PromiseQueue, Statistic } from "./utils";
import { QueryInterface } from "./queries";
import { SubsetOf } from "./inference";
import { DatabaseLink, DatabaseLinks, DatabaseQueries, DatabaseQuery, DatabaseStore, DatabaseStores } from "./databases";

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
	protected store: DatabaseStore<A, B>;

	constructor(store: DatabaseStore<A, B>) {
		this.store = store;
	}

	filter(queue: ReadableQueue, ...parameters: Parameters<StoreInterface<A, B>["filter"]>): ReturnType<StoreInterface<A, B>["filter"]> {
		return queue.enqueueReadableOperation(() => this.store.filter(...parameters));
	}

	insert(queue: WritableQueue, ...parameters: Parameters<StoreInterface<A, B>["insert"]>): ReturnType<StoreInterface<A, B>["insert"]> {
		return queue.enqueueWritableOperation(() => this.store.insert(...parameters));
	}

	length(queue: ReadableQueue, ...parameters: Parameters<StoreInterface<A, B>["length"]>): ReturnType<StoreInterface<A, B>["length"]> {
		return queue.enqueueReadableOperation(() => this.store.length(...parameters));
	}

	lookup(queue: ReadableQueue, ...parameters: Parameters<StoreInterface<A, B>["lookup"]>): ReturnType<StoreInterface<A, B>["lookup"]> {
		return queue.enqueueReadableOperation(() => this.store.lookup(...parameters));
	}

	remove(queue: WritableQueue, ...parameters: Parameters<StoreInterface<A, B>["remove"]>): ReturnType<StoreInterface<A, B>["remove"]> {
		return queue.enqueueWritableOperation(() => this.store.remove(...parameters));
	}

	search(queue: ReadableQueue, ...parameters: Parameters<StoreInterface<A, B>["search"]>): ReturnType<StoreInterface<A, B>["search"]> {
		return queue.enqueueReadableOperation(() => this.store.search(...parameters));
	}

	update(queue: WritableQueue, ...parameters: Parameters<StoreInterface<A, B>["update"]>): ReturnType<StoreInterface<A, B>["update"]> {
		return queue.enqueueWritableOperation(() => this.store.update(...parameters));
	}

	vacate(queue: WritableQueue, ...parameters: Parameters<StoreInterface<A, B>["vacate"]>): ReturnType<StoreInterface<A, B>["vacate"]> {
		return queue.enqueueWritableOperation(() => this.store.vacate(...parameters));
	}
};

export type TransactionalStoresFromDatabaseStores<A extends DatabaseStores<any>> = {
	[B in keyof A]: A[B] extends DatabaseStore<infer C, infer D> ? TransactionalStore<C, D> : never;
};

export class TransactionalLink<A extends Record, B extends RequiredKeys<A>, C extends Record, D extends RequiredKeys<C>, E extends KeysRecordMap<A, B, C>> {
	protected link: DatabaseLink<A, B, C, D, E>;

	constructor(link: DatabaseLink<A, B, C, D, E>) {
		this.link = link;
	}

	filter(queue: ReadableQueue, ...parameters: Parameters<LinkInterface<A, B, C, D, E>["filter"]>): ReturnType<LinkInterface<A, B, C, D, E>["filter"]> {
		return queue.enqueueReadableOperation(() => this.link.filter(...parameters));
	}

	lookup(queue: ReadableQueue, ...parameters: Parameters<LinkInterface<A, B, C, D, E>["lookup"]>): ReturnType<LinkInterface<A, B, C, D, E>["lookup"]> {
		return queue.enqueueReadableOperation(() => this.link.lookup(...parameters));
	}
};

export type TransactionalLinksFromDatabaseLinks<A extends DatabaseLinks<any>> = {
	[B in keyof A]: A[B] extends DatabaseLink<infer C, infer D, infer E, infer F, infer G> ? TransactionalLink<C, D, E, F, G> : never;
};

export class TransactionalQuery<A extends Record, B extends RequiredKeys<A>, C extends SubsetOf<A, C>, D extends SubsetOf<A, D>> {
	protected query: DatabaseQuery<A, B, C, D>;

	constructor(query: DatabaseQuery<A, B, C, D>) {
		this.query = query;
	}

	filter(queue: ReadableQueue, ...parameters: Parameters<QueryInterface<A, B, C, D>["filter"]>): ReturnType<QueryInterface<A, B, C, D>["filter"]> {
		return queue.enqueueReadableOperation(() => this.query.filter(...parameters));
	}
};

export type TransactionalQueriesFromDatabaseQueries<A extends DatabaseQueries<any>> = {
	[B in keyof A]: A[B] extends DatabaseQuery<infer C, infer D, infer E, infer F> ? TransactionalQuery<C, D, E, F> : never;
};

export type ReadableTransaction<A> = (queue: ReadableQueue) => Promise<A>;

export type WritableTransaction<A> = (queue: WritableQueue) => Promise<A>;

export interface TransactionManagerDetail {
	onDiscard?(): void;
	getStatistics?(): globalThis.Record<string, Statistic>;
};

export class TransactionManager<A extends DatabaseStores<any>, B extends DatabaseLinks<any>, C extends DatabaseQueries<any>> {
	private file: File;
	private readableTransactionLock: Promise<any>;
	private writableTransactionLock: Promise<any>;
	readonly stores: Readonly<TransactionalStoresFromDatabaseStores<A>>;
	readonly links: Readonly<TransactionalLinksFromDatabaseLinks<B>>;
	readonly queries: Readonly<TransactionalQueriesFromDatabaseQueries<C>>;
	private detail?: TransactionManagerDetail;

	private createTransactionalStores(databaseStores: A): TransactionalStoresFromDatabaseStores<A> {
		let transactionalStores = {} as TransactionalStoresFromDatabaseStores<any>;
		for (let key in databaseStores) {
			transactionalStores[key] = new TransactionalStore(databaseStores[key]);
		}
		return transactionalStores;
	}

	private createTransactionalLinks(databaseLinks: B): TransactionalLinksFromDatabaseLinks<B> {
		let transactionalLinks = {} as TransactionalLinksFromDatabaseLinks<any>;
		for (let key in databaseLinks) {
			transactionalLinks[key] = new TransactionalLink(databaseLinks[key]);
		}
		return transactionalLinks;
	}

	private createTransactionalQueries(databaseQueries: C): TransactionalQueriesFromDatabaseQueries<C> {
		let transactionalQueries = {} as TransactionalQueriesFromDatabaseQueries<any>;
		for (let key in databaseQueries) {
			transactionalQueries[key] = new TransactionalQuery(databaseQueries[key]);
		}
		return transactionalQueries;
	}

	constructor(file: File, databaseStores: A, databaseLinks: B, databaseQueries: C, detail?: TransactionManagerDetail) {
		this.file = file;
		this.readableTransactionLock = Promise.resolve();
		this.writableTransactionLock = Promise.resolve();
		this.stores = this.createTransactionalStores(databaseStores);
		this.links = this.createTransactionalLinks(databaseLinks);
		this.queries = this.createTransactionalQueries(databaseQueries);
		this.detail = detail;
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
			this.detail?.onDiscard?.();
			throw error;
		} finally {
			queue.close();
		}
	}

	getStatistics(): globalThis.Record<string, Statistic> {
		return this.detail?.getStatistics?.() ?? {};
	}
};
