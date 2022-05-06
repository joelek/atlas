import { File } from "./files";
import { SubsetOf } from "./inference";
import { LinkManager, LinkManagers, Links, WritableLink, WritableLinksFromLinkManagers } from "./links";
import { Queries, QueryManager, QueryManagers, WritableQueriesFromQueryManagers, WritableQuery } from "./queries";
import { Record, Keys, RequiredKeys, KeysRecordMap } from "./records";
import { StoreManager, StoreManagers, Stores, WritableStore, WritableStoresFromStoreManagers } from "./stores";
import { TransactionManager } from "./transactions";

export class OverridableWritableStore<A extends Record, B extends RequiredKeys<A>> implements WritableStore<A, B> {
	private storeManager: StoreManager<A, B>;
	private overrides: Partial<WritableStore<A, B>>;

	constructor(storeManager: StoreManager<A, B>, overrides: Partial<WritableStore<A, B>>) {
		this.storeManager = storeManager;
		this.overrides = overrides;
	}

	async filter(...parameters: Parameters<WritableStore<A, B>["filter"]>): ReturnType<WritableStore<A, B>["filter"]> {
		return this.overrides.filter?.(...parameters) ?? this.storeManager.filter(...parameters);
	}

	async insert(...parameters: Parameters<WritableStore<A, B>["insert"]>): ReturnType<WritableStore<A, B>["insert"]> {
		return this.overrides.insert?.(...parameters) ?? this.storeManager.insert(...parameters);
	}

	async length(...parameters: Parameters<WritableStore<A, B>["length"]>): ReturnType<WritableStore<A, B>["length"]> {
		return this.overrides.length?.(...parameters) ?? this.storeManager.length(...parameters);
	}

	async lookup(...parameters: Parameters<WritableStore<A, B>["lookup"]>): ReturnType<WritableStore<A, B>["lookup"]> {
		return this.overrides.lookup?.(...parameters) ?? this.storeManager.lookup(...parameters);
	}

	async remove(...parameters: Parameters<WritableStore<A, B>["remove"]>): ReturnType<WritableStore<A, B>["remove"]> {
		return this.overrides.remove?.(...parameters) ?? this.storeManager.remove(...parameters);
	}

	async search(...parameters: Parameters<WritableStore<A, B>["search"]>): ReturnType<WritableStore<A, B>["search"]> {
		return this.overrides.search?.(...parameters) ?? this.storeManager.search(...parameters);
	}

	async update(...parameters: Parameters<WritableStore<A, B>["update"]>): ReturnType<WritableStore<A, B>["update"]> {
		return this.overrides.update?.(...parameters) ?? this.storeManager.update(...parameters);
	}

	async vacate(...parameters: Parameters<WritableStore<A, B>["vacate"]>): ReturnType<WritableStore<A, B>["vacate"]> {
		return this.overrides.vacate?.(...parameters) ?? this.storeManager.vacate(...parameters);
	}
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

export class OverridableWritableQuery<A extends Record, B extends RequiredKeys<A>, C extends SubsetOf<A, C>, D extends SubsetOf<A, D>> implements WritableQuery<A, B, C, D> {
	private queryManager: QueryManager<A, B, C, D>;
	private overrides: Partial<WritableQuery<A, B, C, D>>;

	constructor(queryManager: QueryManager<A, B, C, D>, overrides: Partial<WritableQuery<A, B, C, D>>) {
		this.queryManager = queryManager;
		this.overrides = overrides;
	}

	async filter(...parameters: Parameters<WritableQuery<A, B, C, D>["filter"]>): ReturnType<WritableQuery<A, B, C, D>["filter"]> {
		return this.overrides.filter?.(...parameters) ?? this.queryManager.filter(...parameters);
	}
};

export class DatabaseManager<A extends StoreManagers<any>, B extends LinkManagers<any>, C extends QueryManagers<any>> {
	private storeManagers: A;
	private linkManagers: B;
	private queryManagers: C;
	private linksWhereStoreIsParent: Map<StoreManager<any, any>, Set<LinkManager<any, any, any, any, any>>>;
	private linksWhereStoreIsChild: Map<StoreManager<any, any>, Set<LinkManager<any, any, any, any, any>>>;

	private doInsert<C extends Record, D extends RequiredKeys<C>>(storeManager: StoreManager<C, D>, records: Array<C>): void {
		for (let record of records) {
			for (let linkManager of this.getLinksWhereStoreIsChild(storeManager)) {
				linkManager.lookup(record);
			}
			storeManager.insert(record);
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

	constructor(storeManagers: A, linkManagers: B, queryManagers: C) {
		this.storeManagers = storeManagers;
		this.linkManagers = linkManagers;
		this.queryManagers = queryManagers;
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

	createTransactionManager(file: File): TransactionManager<WritableStoresFromStoreManagers<A>, WritableLinksFromLinkManagers<B>, WritableQueriesFromQueryManagers<C>> {
		let writableStores = this.createWritableStores();
		let writableLinks = this.createWritableLinks();
		let writableQueries = this.createWritableQueries();
		return new TransactionManager(file, writableStores, writableLinks, writableQueries);
	}

	createWritableStores(): WritableStoresFromStoreManagers<A> {
		let writableStores = {} as WritableStoresFromStoreManagers<any>;
		for (let key in this.storeManagers) {
			let storeManager = this.storeManagers[key];
			writableStores[key] = new OverridableWritableStore(storeManager, {
				insert: async (record) => this.doInsert(storeManager, [record]),
				remove: async (record) => this.doRemove(storeManager, [record]),
				vacate: async () => this.doVacate(storeManager, [])
			});
		}
		return writableStores;
	}

	createWritableLinks(): WritableLinksFromLinkManagers<B> {
		let writableLinks = {} as WritableLinksFromLinkManagers<any>;
		for (let key in this.linkManagers) {
			let linkManager = this.linkManagers[key];
			writableLinks[key] = new OverridableWritableLink(linkManager, {});
		}
		return writableLinks;
	}

	createWritableQueries(): WritableQueriesFromQueryManagers<C> {
		let writableQueries = {} as WritableQueriesFromQueryManagers<any>;
		for (let key in this.queryManagers) {
			let queryManager = this.queryManagers[key];
			writableQueries[key] = new OverridableWritableQuery(queryManager, {});
		}
		return writableQueries;
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
					linkManager.lookup(childRecord);
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
					linkManager.lookup(childRecord);
				} catch (error) {
					records.push(childRecord);
				}
			}
			this.doRemove(child, records);
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
