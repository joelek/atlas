import { EqualityFilter, FilterMap } from "./filters";
import { OrderMap } from "./orders";
import { KeysRecord, KeysRecordMap, Record, RequiredKeys } from "./records";
import { Entry, Store, StoreManager } from "./store";

export interface ReadableLink<A extends Record, B extends RequiredKeys<A>, C extends Record, D extends RequiredKeys<C>, E extends KeysRecordMap<A, B, C>> {
	filter(keysRecord: KeysRecord<A, B>): Promise<Iterable<Entry<C>>>;
	lookup(record: C | Pick<C, E[B[number]]>): Promise<A | undefined>;
};

export type ReadableLinks = {
	[key: string]: ReadableLink<any, any, any, any, any>;
};

export type ReadableLinksFromLinks<A extends Links> = {
	[B in keyof A]: A[B] extends Link<infer C, infer D, infer E, infer F, infer G> ? ReadableLink<C, D, E, F, G> : never;
};

export type LinksFromReadableLinks<A extends ReadableLinks> = {
	[B in keyof A]: A[B] extends ReadableLink<infer C, infer D, infer E, infer F, infer G> ? Link<C, D, E, F, G> : never;
};

export interface WritableLink<A extends Record, B extends RequiredKeys<A>, C extends Record, D extends RequiredKeys<C>, E extends KeysRecordMap<A, B, C>> extends ReadableLink<A, B, C, D, E> {

};

export type WritableLinks = {
	[key: string]: WritableLink<any, any, any, any, any>;
};

export type WritableLinksFromLinks<A extends Links> = {
	[B in keyof A]: A[B] extends Link<infer C, infer D, infer E, infer F, infer G> ? WritableLink<C, D, E, F, G> : never;
};

export type LinksFromWritableLinks<A extends WritableLinks> = {
	[B in keyof A]: A[B] extends WritableLink<infer C, infer D, infer E, infer F, infer G> ? Link<C, D, E, F, G> : never;
};

export class WritableLinkManager<A extends Record, B extends RequiredKeys<A>, C extends Record, D extends RequiredKeys<C>, E extends KeysRecordMap<A, B, C>> implements WritableLink<A, B, C, D, E> {
	protected linkManager: LinkManager<A, B, C, D, E>;

	constructor(linkManager: LinkManager<A, B, C, D, E>) {
		this.linkManager = linkManager;
	}

	async filter(...parameters: Parameters<WritableLink<A, B, C, D, E>["filter"]>): ReturnType<WritableLink<A, B, C, D, E>["filter"]> {
		return this.linkManager.filter(...parameters);
	}

	async lookup(...parameters: Parameters<WritableLink<A, B, C, D, E>["lookup"]>): ReturnType<WritableLink<A, B, C, D, E>["lookup"]> {
		return this.linkManager.lookup(...parameters);
	}
};

// TODO: Implement interface WritableLink directly.
export class LinkManager<A extends Record, B extends RequiredKeys<A>, C extends Record, D extends RequiredKeys<C>, E extends KeysRecordMap<A, B, C>> {
	private parent: StoreManager<A, B>;
	private child: StoreManager<C, D>;
	private keysRecordMap: E;
	private orders: OrderMap<C>;

	constructor(parent: StoreManager<A, B>, child: StoreManager<C, D>, keysRecordMap: E, orders?: OrderMap<C>) {
		this.parent = parent;
		this.child = child;
		this.keysRecordMap = keysRecordMap;
		this.orders = orders ?? {};
	}

	getParent(): StoreManager<A, B> {
		return this.parent;
	}

	getChild(): StoreManager<C, D> {
		return this.child;
	}

	filter(keysRecord: KeysRecord<A, B>): Iterable<Entry<C>> {
		let filters = {} as FilterMap<C>;
		for (let key in this.keysRecordMap) {
			let keyOne = key as any as B[number];
			let keyTwo = this.keysRecordMap[keyOne];
			filters[keyTwo] = new EqualityFilter(keysRecord[keyOne]) as any;
		}
		return this.child.filter(filters, this.orders);
	}

	lookup(record: C | Pick<C, E[B[number]]>): A | undefined {
		let keysRecord = {} as KeysRecord<A, B>;
		for (let key in this.keysRecordMap) {
			let keyOne = key as any as B[number];
			let keyTwo = this.keysRecordMap[keyOne];
			if (record[keyTwo] === null) {
				return;
			}
			keysRecord[keyOne] = record[keyTwo] as any;
		}
		return this.parent.lookup(keysRecord);
	}

	static construct<A extends Record, B extends RequiredKeys<A>, C extends Record, D extends RequiredKeys<C>, E extends KeysRecordMap<A, B, C>>(parent: StoreManager<A, B>, child: StoreManager<C, D>, recordKeysMap: E, orders?: OrderMap<C>): LinkManager<A, B, C, D, E> {
		return new LinkManager(parent, child, recordKeysMap, orders);
	}
};

export type LinkManagers = {
	[key: string]: LinkManager<any, any, any, any, any>;
};

export type LinkManagersFromLinks<A extends Links> = {
	[B in keyof A]: A[B] extends Link<infer C, infer D, infer E, infer F, infer G> ? LinkManager<C, D, E, F, G> : never;
};

export type WritableLinksFromLinkManagers<A extends LinkManagers> = {
	[B in keyof A]: A[B] extends LinkManager<infer C, infer D, infer E, infer F, infer G> ? WritableLink<C, D, E, F, G> : never;
};

export class LinkReference<A extends Record, B extends RequiredKeys<A>, C extends Record, D extends RequiredKeys<C>, E extends KeysRecordMap<A, B, C>> {
	private LinkReference!: "LinkReference";
};

export type LinkReferences = {
	[key: string]: LinkReference<any, any, any, any, any>;
};

export class Link<A extends Record, B extends RequiredKeys<A>, C extends Record, D extends RequiredKeys<C>, E extends KeysRecordMap<A, B, C>> {
	parent: Store<A, B>;
	child: Store<C, D>;
	recordKeysMap: E;
	orders: OrderMap<C>;

	constructor(parent: Store<A, B>, child: Store<C, D>, recordKeysMap: E, orders: OrderMap<C>) {
		this.parent = parent;
		this.child = child;
		this.recordKeysMap = recordKeysMap;
		this.orders = orders;
	}
};

export type LinksFromLinkReferences<A extends LinkReferences> = {
	[B in keyof A]: A[B] extends LinkReference<infer C, infer D, infer E, infer F, infer G> ? Link<C, D, E, F, G> : never;
};

export type Links = {
	[key: string]: Link<any, any, any, any, any>;
};

export class OverridableWritableLink<A extends Record, B extends RequiredKeys<A>, C extends Record, D extends RequiredKeys<C>, E extends KeysRecordMap<A, B, C>> implements WritableLink<A, B, C, D, E> {
	private linkManager: LinkManager<A, B, C, D, E>;
	private overrides: Partial<WritableLink<A, B, C, D, E>>;

	constructor(linkManager: LinkManager<A, B, C, D, E>, overrides: Partial<WritableLink<A, B, C, D, E>>) {
		this.linkManager = linkManager;
		this.overrides = overrides;
	}

	async filter(...parameters: Parameters<WritableLink<A, B, C, D, E>["filter"]>): ReturnType<WritableLink<A, B, C, D, E>["filter"]> {
		return this.overrides.filter?.(...parameters) ?? this.linkManager.filter(...parameters);
	}

	async lookup(...parameters: Parameters<WritableLink<A, B, C, D, E>["lookup"]>): ReturnType<WritableLink<A, B, C, D, E>["lookup"]> {
		return this.overrides.lookup?.(...parameters) ?? this.linkManager.lookup(...parameters);
	}
};
