import { BlockManager } from "./blocks";
import { SubsetOf } from "./inference";
import { LinkManager, LinkManagers, Links, LinkInterface } from "./links";
import { Queries, QueryManager, QueryManagers, QueryInterface } from "./queries";
import { Record, Keys, RequiredKeys, KeysRecordMap } from "./records";
import { StoreManager, StoreManagers, Stores, StoreInterface } from "./stores";
import { Statistic } from "./utils";

export class DatabaseStore<A extends Record, B extends RequiredKeys<A>> implements StoreInterface<A, B> {
	private storeManager: StoreManager<A, B>;
	private overrides: Partial<StoreManager<A, B>>;

	constructor(storeManager: StoreManager<A, B>, overrides: Partial<StoreManager<A, B>>) {
		this.storeManager = storeManager;
		this.overrides = overrides;
	}

	async filter(...parameters: Parameters<StoreInterface<A, B>["filter"]>): ReturnType<StoreInterface<A, B>["filter"]> {
		return this.overrides.filter?.(...parameters) ?? this.storeManager.filter(...parameters);
	}

	async insert(...parameters: Parameters<StoreInterface<A, B>["insert"]>): ReturnType<StoreInterface<A, B>["insert"]> {
		return this.overrides.insert?.(...parameters) ?? this.storeManager.insert(...parameters);
	}

	async length(...parameters: Parameters<StoreInterface<A, B>["length"]>): ReturnType<StoreInterface<A, B>["length"]> {
		return this.overrides.length?.(...parameters) ?? this.storeManager.length(...parameters);
	}

	async lookup(...parameters: Parameters<StoreInterface<A, B>["lookup"]>): ReturnType<StoreInterface<A, B>["lookup"]> {
		return this.overrides.lookup?.(...parameters) ?? this.storeManager.lookup(...parameters);
	}

	async remove(...parameters: Parameters<StoreInterface<A, B>["remove"]>): ReturnType<StoreInterface<A, B>["remove"]> {
		return this.overrides.remove?.(...parameters) ?? this.storeManager.remove(...parameters);
	}

	async search(...parameters: Parameters<StoreInterface<A, B>["search"]>): ReturnType<StoreInterface<A, B>["search"]> {
		return this.overrides.search?.(...parameters) ?? this.storeManager.search(...parameters);
	}

	async update(...parameters: Parameters<StoreInterface<A, B>["update"]>): ReturnType<StoreInterface<A, B>["update"]> {
		return this.overrides.update?.(...parameters) ?? this.storeManager.update(...parameters);
	}

	async vacate(...parameters: Parameters<StoreInterface<A, B>["vacate"]>): ReturnType<StoreInterface<A, B>["vacate"]> {
		return this.overrides.vacate?.(...parameters) ?? this.storeManager.vacate(...parameters);
	}
};

export type DatabaseStores<A> = {
	[B in keyof A]: A[B] extends DatabaseStore<infer C, infer D> ? DatabaseStore<C, D> : A[B];
};

export type DatabaseStoresFromStorManagers<A extends StoreManagers<any>> = {
	[B in keyof A]: A[B] extends StoreManager<infer C, infer D> ? DatabaseStore<C, D> : never;
};

export class DatabaseLink<A extends Record, B extends RequiredKeys<A>, C extends Record, D extends RequiredKeys<C>, E extends KeysRecordMap<A, B, C>> implements LinkInterface<A, B, C, D, E> {
	private linkManager: LinkManager<A, B, C, D, E>;
	private overrides: Partial<LinkManager<A, B, C, D, E>>;

	constructor(linkManager: LinkManager<A, B, C, D, E>, overrides: Partial<LinkManager<A, B, C, D, E>>) {
		this.linkManager = linkManager;
		this.overrides = overrides;
	}

	async filter(...parameters: Parameters<LinkInterface<A, B, C, D, E>["filter"]>): ReturnType<LinkInterface<A, B, C, D, E>["filter"]> {
		return this.overrides.filter?.(...parameters) ?? this.linkManager.filter(...parameters);
	}

	async lookup(...parameters: Parameters<LinkInterface<A, B, C, D, E>["lookup"]>): ReturnType<LinkInterface<A, B, C, D, E>["lookup"]> {
		return this.overrides.lookup?.(...parameters) ?? this.linkManager.lookup(...parameters);
	}
};

export type DatabaseLinks<A> = {
	[B in keyof A]: A[B] extends DatabaseLink<infer C, infer D, infer E, infer F, infer G> ? DatabaseLink<C, D, E, F, G> : A[B];
};

export type DatabaseLinksFromLinkManagers<A extends LinkManagers<any>> = {
	[B in keyof A]: A[B] extends LinkManager<infer C, infer D, infer E, infer F, infer G> ? DatabaseLink<C, D, E, F, G> : never;
};

export class DatabaseQuery<A extends Record, B extends RequiredKeys<A>, C extends SubsetOf<A, C>, D extends SubsetOf<A, D>> implements QueryInterface<A, B, C, D> {
	private queryManager: QueryManager<A, B, C, D>;
	private overrides: Partial<QueryManager<A, B, C, D>>;

	constructor(queryManager: QueryManager<A, B, C, D>, overrides: Partial<QueryManager<A, B, C, D>>) {
		this.queryManager = queryManager;
		this.overrides = overrides;
	}

	async filter(...parameters: Parameters<QueryInterface<A, B, C, D>["filter"]>): ReturnType<QueryInterface<A, B, C, D>["filter"]> {
		return this.overrides.filter?.(...parameters) ?? this.queryManager.filter(...parameters);
	}
};

export type DatabaseQueries<A> = {
	[B in keyof A]: A[B] extends DatabaseQuery<infer C, infer D, infer E, infer F> ? DatabaseQuery<C, D, E, F> : A[B];
};

export type DatabaseQueriesFromQueryManagers<A extends QueryManagers<any>> = {
	[B in keyof A]: A[B] extends QueryManager<infer C, infer D, infer E, infer F> ? DatabaseQuery<C, D, E, F> : never;
};

export class DatabaseManager<A extends StoreManagers<any>, B extends LinkManagers<any>, C extends QueryManagers<any>> {
	private storeManagers: A;
	private linkManagers: B;
	private queryManagers: C;
	private blockManager: BlockManager;
	private linksWhereStoreIsParent: Map<StoreManager<any, any>, Set<LinkManager<any, any, any, any, any>>>;
	private linksWhereStoreIsChild: Map<StoreManager<any, any>, Set<LinkManager<any, any, any, any, any>>>;

	private doInsert<C extends Record, D extends RequiredKeys<C>>(storeManager: StoreManager<C, D>, records: Array<C>): void {
		for (let record of records) {
			for (let linkManager of this.getLinksWhereStoreIsChild(storeManager)) {
				let parentRecord = linkManager.lookup(record);
				let partialChild = linkManager.createPartialChild(parentRecord);
				if (partialChild != null) {
					record = {
						...record,
						...partialChild
					};
				}
			}
			storeManager.insert(record);
			for (let linkManager of this.getLinksWhereStoreIsParent(storeManager)) {
				let partialChild = linkManager.createPartialChild(record);
				if (partialChild != null) {
					let childStoreManager = linkManager.getChild();
					let records = linkManager.filter(record);
					for (let record of records) {
						childStoreManager.update({
							...record,
							...partialChild
						});
					}
				}
			}
		}
	}

	private doRemove<C extends Record, D extends RequiredKeys<C>>(storeManager: StoreManager<C, D>, records: Array<C>): void {
		let queue = new Array<{ storeManager: StoreManager<any, any>, records: Array<Record> }>();
		queue.push({
			storeManager,
			records
		});
		while (queue.length > 0) {
			let queueEntry = queue.splice(0, 1)[0];
			for (let record of queueEntry.records) {
				queueEntry.storeManager.remove(record);
			}
			for (let linkManager of this.getLinksWhereStoreIsParent(queueEntry.storeManager)) {
				let storeManager = linkManager.getChild();
				let records = new Array<Record>();
				for (let record of queueEntry.records) {
					for (let childRecord of linkManager.filter(record)) {
						records.push(childRecord);
					}
				}
				if (records.length > 0) {
					queue.push({
						storeManager,
						records
					});
				}
			}
		}
	}

	private doUpdate<C extends Record, D extends RequiredKeys<C>>(storeManager: StoreManager<C, D>, records: Array<C>): void {
		for (let record of records) {
			record = storeManager.getCompleteRecord(record);
			for (let linkManager of this.getLinksWhereStoreIsChild(storeManager)) {
				let parentRecord = linkManager.lookup(record);
				let partialChild = linkManager.createPartialChild(parentRecord);
				if (partialChild != null) {
					record = {
						...record,
						...partialChild
					};
				}
			}
			storeManager.update(record);
			for (let linkManager of this.getLinksWhereStoreIsParent(storeManager)) {
				let partialChild = linkManager.createPartialChild(record);
				if (partialChild != null) {
					let childStoreManager = linkManager.getChild();
					let records = linkManager.filter(record);
					for (let record of records) {
						childStoreManager.update({
							...record,
							...partialChild
						});
					}
				}
			}
		}
	}

	private doVacate<C extends Record, D extends RequiredKeys<C>>(storeManager: StoreManager<C, D>, orphans: Array<C>): void {
		if (storeManager.length() > 0) {
			storeManager.vacate();
			for (let linkManager of this.getLinksWhereStoreIsParent(storeManager)) {
				this.doVacate(linkManager.getChild(), linkManager.filter());
			}
		}
		for (let orphan of orphans) {
			storeManager.insert(orphan);
		}
	}

	private getLinksWhereStoreIsParent(storeManager: StoreManager<any, any>): Set<LinkManager<any, any, any, any, any>> {
		let set = this.linksWhereStoreIsParent.get(storeManager);
		if (set == null) {
			throw `Expected link set!`;
		}
		return set;
	}

	private getLinksWhereStoreIsChild(storeManager: StoreManager<any, any>): Set<LinkManager<any, any, any, any, any>> {
		let set = this.linksWhereStoreIsChild.get(storeManager);
		if (set == null) {
			throw `Expected link set!`;
		}
		return set;
	}

	constructor(storeManagers: A, linkManagers: B, queryManagers: C, blockManager: BlockManager) {
		this.storeManagers = storeManagers;
		this.linkManagers = linkManagers;
		this.queryManagers = queryManagers;
		this.blockManager = blockManager;
		this.linksWhereStoreIsParent = new Map();
		this.linksWhereStoreIsChild = new Map();
		for (let key in storeManagers) {
			let storeManager = storeManagers[key];
			let linksWhereStoreIsChild = new Set<LinkManager<any, any, any, any, any>>();
			let linksWhereStoreIsParent = new Set<LinkManager<any, any, any, any, any>>();
			for (let key in this.linkManagers) {
				let linkManager = this.linkManagers[key];
				if (storeManager === linkManager.getParent()) {
					linksWhereStoreIsParent.add(linkManager);
				}
				if (storeManager === linkManager.getChild()) {
					linksWhereStoreIsChild.add(linkManager);
				}
			}
			this.linksWhereStoreIsParent.set(storeManager, linksWhereStoreIsParent);
			this.linksWhereStoreIsChild.set(storeManager, linksWhereStoreIsChild);
		}
	}

	createDatabaseStores(): DatabaseStoresFromStorManagers<A> {
		let databaseStores = {} as DatabaseStoresFromStorManagers<any>;
		for (let key in this.storeManagers) {
			let storeManager = this.storeManagers[key];
			databaseStores[key] = new DatabaseStore(storeManager, {
				insert: async (record) => this.doInsert(storeManager, [record]),
				remove: async (record) => this.doRemove(storeManager, [record]),
				update: async (record) => this.doUpdate(storeManager, [record]),
				vacate: async () => this.doVacate(storeManager, [])
			});
		}
		return databaseStores;
	}

	createDatabaseLinks(): DatabaseLinksFromLinkManagers<B> {
		let databaseLinks = {} as DatabaseLinksFromLinkManagers<any>;
		for (let key in this.linkManagers) {
			let linkManager = this.linkManagers[key];
			databaseLinks[key] = new DatabaseLink(linkManager, {});
		}
		return databaseLinks;
	}

	createDatabaseQueries(): DatabaseQueriesFromQueryManagers<C> {
		let databaseQueries = {} as DatabaseQueriesFromQueryManagers<any>;
		for (let key in this.queryManagers) {
			let queryManager = this.queryManagers[key];
			databaseQueries[key] = new DatabaseQuery(queryManager, {});
		}
		return databaseQueries;
	}

	enforceStoreConsistency<C extends Keys<A>>(storeNames: [...C]): void {
		for (let key of storeNames) {
			let storeManager = this.storeManagers[key];
			for (let linkManager of this.getLinksWhereStoreIsParent(storeManager)) {
				let child = linkManager.getChild();
				let records = [] as Array<Record>;
				for (let childRecord of child) {
					try {
						linkManager.lookup(childRecord);
					} catch (error) {
						records.push(childRecord);
					}
				}
				this.doRemove(child, records);
			}
		}
	}

	enforceLinkConsistency<D extends Keys<B>>(linkNames: [...D]): void {
		for (let key of linkNames) {
			let linkManager = this.linkManagers[key];
			let child = linkManager.getChild();
			let records = [] as Array<Record>;
			for (let childRecord of child) {
				try {
					let parentRecord = linkManager.lookup(childRecord);
					let partialChild = linkManager.createPartialChild(parentRecord);
					if (partialChild != null) {
						childRecord = {
							...childRecord,
							...partialChild
						};
					}
					child.update(childRecord);
				} catch (error) {
					records.push(childRecord);
				}
			}
			this.doRemove(child, records);
		}
	}

	enforceConsistency<C extends Keys<A>, D extends Keys<B>>(storeNames: [...C], linkNames: [...D]): void {
		let linkManagers = new Set<LinkManager<any, any, any, any, any>>();
		for (let key of storeNames) {
			for (let linkManager of this.getLinksWhereStoreIsParent(this.storeManagers[key])) {
				linkManagers.add(linkManager);
			}
		}
		for (let key of linkNames) {
			let linkManager = this.linkManagers[key];
			linkManagers.add(linkManager);
		}
		for (let linkManager of linkManagers) {
			let child = linkManager.getChild();
			let records = [] as Array<Record>;
			for (let childRecord of child) {
				try {
					let parentRecord = linkManager.lookup(childRecord);
					let partialChild = linkManager.createPartialChild(parentRecord);
					if (partialChild != null) {
						childRecord = {
							...childRecord,
							...partialChild
						};
					}
					child.update(childRecord);
				} catch (error) {
					records.push(childRecord);
				}
			}
			this.doRemove(child, records);
		}
	}

	getStatistics(): globalThis.Record<string, Statistic> {
		let statistics: globalThis.Record<string, Statistic> = {};
		statistics.databaseSchema = {
			entries: 1,
			bytesPerEntry: this.blockManager.getBlockSize(BlockManager.RESERVED_BLOCK_DATABASE_SCHEMA)
		};
		statistics.blockManager = this.blockManager.getStatistics();
		let storeManagers: globalThis.Record<string, Statistic> = statistics.storeManagers = {};
		for (let key in this.storeManagers) {
			storeManagers[key] = this.storeManagers[key].getStatistics();
		}
		return statistics;
	}

	reload(): void {
		for (let key in this.storeManagers) {
			this.storeManagers[key].reload();
		}
	}
};

export class Database<A extends Stores<any>, B extends Links<any>, C extends Queries<any>> {
	stores: A;
	links: B;
	queries: C;

	constructor(stores?: A, links?: B, queries?: C) {
		this.stores = stores ?? {} as A;
		this.links = links ?? {} as B;
		this.queries = queries ?? {} as C;
	}
};
