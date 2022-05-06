import { File } from "./files";
import { Record, KeysRecordMap, RequiredKeys } from "./records";
import { LinkInterface, LinkInterfaces } from "./links";
import { StoreInterface, StoreInterfaces } from "./stores";
import { PromiseQueue } from "./utils";
import { QueryInterfaces, QueryInterface } from "./queries";
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
	protected store: StoreInterface<A, B>;

	constructor(store: StoreInterface<A, B>) {
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

export type TransactionalStoresFromStoreInterfaces<A extends StoreInterfaces<any>> = {
	[B in keyof A]: A[B] extends StoreInterface<infer C, infer D> ? TransactionalStore<C, D> : never;
};

export class TransactionalLink<A extends Record, B extends RequiredKeys<A>, C extends Record, D extends RequiredKeys<C>, E extends KeysRecordMap<A, B, C>> {
	protected link: LinkInterface<A, B, C, D, E>;

	constructor(link: LinkInterface<A, B, C, D, E>) {
		this.link = link;
	}

	filter(queue: ReadableQueue, ...parameters: Parameters<LinkInterface<A, B, C, D, E>["filter"]>): ReturnType<LinkInterface<A, B, C, D, E>["filter"]> {
		return queue.enqueueReadableOperation(() => this.link.filter(...parameters));
	}

	lookup(queue: ReadableQueue, ...parameters: Parameters<LinkInterface<A, B, C, D, E>["lookup"]>): ReturnType<LinkInterface<A, B, C, D, E>["lookup"]> {
		return queue.enqueueReadableOperation(() => this.link.lookup(...parameters));
	}
};

export type TransactionalLinksFromLinkInterfaces<A extends LinkInterfaces<any>> = {
	[B in keyof A]: A[B] extends LinkInterface<infer C, infer D, infer E, infer F, infer G> ? TransactionalLink<C, D, E, F, G> : never;
};

export class TransactionalQuery<A extends Record, B extends RequiredKeys<A>, C extends SubsetOf<A, C>, D extends SubsetOf<A, D>> {
	protected query: QueryInterface<A, B, C, D>;

	constructor(query: QueryInterface<A, B, C, D>) {
		this.query = query;
	}

	filter(queue: ReadableQueue, ...parameters: Parameters<QueryInterface<A, B, C, D>["filter"]>): ReturnType<QueryInterface<A, B, C, D>["filter"]> {
		return queue.enqueueReadableOperation(() => this.query.filter(...parameters));
	}
};

export type TransactionalQueriesFromQueryInterfaces<A extends QueryInterfaces<any>> = {
	[B in keyof A]: A[B] extends QueryInterface<infer C, infer D, infer E, infer F> ? TransactionalQuery<C, D, E, F> : never;
};

export type ReadableTransaction<A> = (queue: ReadableQueue) => Promise<A>;

export type WritableTransaction<A> = (queue: WritableQueue) => Promise<A>;

export class TransactionManager<A extends StoreInterfaces<any>, B extends LinkInterfaces<any>, C extends QueryInterfaces<any>> {
	private file: File;
	private readableTransactionLock: Promise<any>;
	private writableTransactionLock: Promise<any>;
	readonly stores: Readonly<TransactionalStoresFromStoreInterfaces<A>>;
	readonly links: Readonly<TransactionalLinksFromLinkInterfaces<B>>;
	readonly queries: Readonly<TransactionalQueriesFromQueryInterfaces<C>>;

	private createTransactionalStores(storeInterfaces: A): TransactionalStoresFromStoreInterfaces<A> {
		let transactionalStores = {} as TransactionalStoresFromStoreInterfaces<any>;
		for (let key in storeInterfaces) {
			transactionalStores[key] = new TransactionalStore(storeInterfaces[key]);
		}
		return transactionalStores;
	}

	private createTransactionalLinks(linkInterfaces: B): TransactionalLinksFromLinkInterfaces<B> {
		let transactionalLinks = {} as TransactionalLinksFromLinkInterfaces<any>;
		for (let key in linkInterfaces) {
			transactionalLinks[key] = new TransactionalLink(linkInterfaces[key]);
		}
		return transactionalLinks;
	}

	private createTransactionalQueries(queryInterfaces: C): TransactionalQueriesFromQueryInterfaces<C> {
		let transactionalQueries = {} as TransactionalQueriesFromQueryInterfaces<any>;
		for (let key in queryInterfaces) {
			transactionalQueries[key] = new TransactionalQuery(queryInterfaces[key]);
		}
		return transactionalQueries;
	}

	constructor(file: File, storeInterfaces: A, linkInterfaces: B, queryInterfaces: C) {
		this.file = file;
		this.readableTransactionLock = Promise.resolve();
		this.writableTransactionLock = Promise.resolve();
		this.stores = this.createTransactionalStores(storeInterfaces);
		this.links = this.createTransactionalLinks(linkInterfaces);
		this.queries = this.createTransactionalQueries(queryInterfaces);
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
