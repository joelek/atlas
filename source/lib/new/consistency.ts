import { LinkManager, LinkManagers, WritableLink } from "./link";
import { Record, Keys, KeysRecordMap } from "./records";
import { StoreManager, StoreManagers, WritableStore } from "./store";

export class OverridableWritableStore<A extends Record, B extends Keys<A>> implements WritableStore<A, B> {
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

	async update(...parameters: Parameters<WritableStore<A, B>["update"]>): ReturnType<WritableStore<A, B>["update"]> {
		return this.overrides.update?.(...parameters) ?? this.storeManager.update(...parameters);
	}
};

export class OverridableWritableLink<A extends Record, B extends Keys<A>, C extends Record, D extends Keys<C>, E extends KeysRecordMap<A, B, C>> implements WritableLink<A, B, C, D, E> {
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

export type WritableStoresFromStoreManagers<A extends StoreManagers<A>> = {
	[B in keyof A]: A[B] extends StoreManager<infer C, infer D> ? WritableStore<C, D> : never;
};

export type WritableLinksFromLinkManagers<A extends LinkManagers<A>> = {
	[B in keyof A]: A[B] extends LinkManager<infer C, infer D, infer E, infer F, infer G> ? WritableLink<C, D, E, F, G> : never;
};

export class ConsistencyManager<A extends StoreManagers<A>, B extends LinkManagers<B>> {
	private storeManagers: A;
	private linkManagers: B;
	private linksWhereStoreIsParent: Map<StoreManager<any, any>, Set<LinkManager<any, any, any, any, any>>>;
	private linksWhereStoreIsChild: Map<StoreManager<any, any>, Set<LinkManager<any, any, any, any, any>>>;

	private doInsert<C extends Record, D extends Keys<C>>(storeManager: StoreManager<C, D>, records: Array<C>): void {
		for (let record of records) {
			for (let linkManager of this.getLinksWhereStoreIsChild(storeManager)) {
				linkManager.lookup(record);
			}
			storeManager.insert(record);
		}
	}

	private doRemove<C extends Record, D extends Keys<C>>(storeManager: StoreManager<C, D>, records: Array<C>): void {
		let queue = new Array<{ storeManager: StoreManager<Record, Keys<Record>>, records: Array<Record> }>();
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
					for (let entry of linkManager.filter(record)) {
						records.push(entry.record());
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

	constructor(storeManagers: A, linkManagers: B) {
		this.storeManagers = storeManagers;
		this.linkManagers = linkManagers;
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

	createWritableStores(): WritableStoresFromStoreManagers<A> {
		let writableStores = {} as WritableStoresFromStoreManagers<any>;
		for (let key in this.storeManagers) {
			let storeManager = this.storeManagers[key];
			writableStores[key] = new OverridableWritableStore(storeManager, {
				insert: async (record) => this.doInsert(storeManager, [record]),
				remove: async (record) => this.doRemove(storeManager, [record])
			});
		}
		return writableStores;
	}

	createWritableLinks(): WritableLinksFromLinkManagers<B> {
		let writableLinks = {} as WritableLinksFromLinkManagers<any>;
		for (let key in this.linkManagers) {
			writableLinks[key] = new OverridableWritableLink(this.linkManagers[key], {});
		}
		return writableLinks;
	}
};
