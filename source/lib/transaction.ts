import { File } from "./files";
import { Record, KeysRecordMap, RequiredKeys } from "./records";
import { Links, LinksFromWritableLinks, ReadableLink, ReadableLinksFromLinks, WritableLink, WritableLinks, WritableLinksFromLinks } from "./link";
import { ReadableStore, ReadableStoresFromStores, Stores, StoresFromWritableStores, WritableStore, WritableStores, WritableStoresFromStores } from "./store";
import { PromiseQueue } from "./utils";

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

export type ReadableTransaction<A extends Stores, B extends Links, C> = (stores: ReadableStoresFromStores<A>, links: ReadableLinksFromLinks<B>) => Promise<C>;

export type WritableTransaction<A extends Stores, B extends Links, C> = (stores: WritableStoresFromStores<A>, links: ReadableLinksFromLinks<B>) => Promise<C>;

export class TransactionManager<A extends WritableStores, B extends WritableLinks> {
	private file: File;
	private readableTransactionLock: Promise<any>;
	private writableTransactionLock: Promise<any>;
	private writableStores: A;
	private writableLinks: B;

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

	constructor(file: File, writableStores: A, writableLinks: B) {
		this.file = file;
		this.readableTransactionLock = Promise.resolve();
		this.writableTransactionLock = Promise.resolve();
		this.writableStores = writableStores;
		this.writableLinks = writableLinks;
	}

	async enqueueReadableTransaction<C>(transaction: ReadableTransaction<StoresFromWritableStores<A>, LinksFromWritableLinks<B>, C>): Promise<C> {
		let queue = new PromiseQueue();
		let stores = this.createReadableStores(queue);
		let links = this.createReadableLinks(queue);
		let promise = this.readableTransactionLock
			.then(() => transaction(stores, links))
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

	async enqueueWritableTransaction<C>(transaction: WritableTransaction<StoresFromWritableStores<A>, LinksFromWritableLinks<B>, C>): Promise<C> {
		let queue = new PromiseQueue();
		let stores = this.createWritableStores(queue);
		let links = this.createWritableLinks(queue);
		let promise = this.writableTransactionLock
			.then(() => transaction(stores, links))
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