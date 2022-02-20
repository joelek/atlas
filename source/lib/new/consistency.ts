/*
link.consistencyCheck(...)
for all newly added or modified links
	loop through all entries in child store
	if child record points to parent record (consider nulls)
		lookup parent (throws if not found)
		if no parent
			add child record to deletion queue
run removal code


case 1: single parent is deleted from store
	add parent to deletion queue for parent store
	while deletion queues are non empty

	end

case 2: consistency check after schema change
	while deletion queues are non empty
		for each link that changed (link added or changed child store)
			if link forbids orphans
				for each child in link
					lookup parent based on child
					if parent is missing
						add child to deletion queue
					end
				end
			end
		end
		for each link that changed
			if link forbids orphans

			end
		end
	end
*/
import { LinkManager, LinkManagers, Links, WritableLink, WritableLinks } from "./link";
import { Record, Keys, KeysRecordMap } from "./records";
import { StoreManager, StoreManagers, Stores, WritableStore, WritableStores } from "./store";

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

export class ConsistencyManager<A, B> {
	private storeManagers: StoreManagers<Stores<A>>;
	private linkManagers: LinkManagers<Links<B>>;
	private linksWhereStoreIsParent: Map<StoreManager<any, any>, Set<LinkManager<any, any, any, any, any>>>;
	private linksWhereStoreIsChild: Map<StoreManager<any, any>, Set<LinkManager<any, any, any, any, any>>>;

	private doInsert<A extends Record, B extends Keys<A>>(storeManager: StoreManager<A, B>, records: Array<A>): void {
		for (let record of records) {
			for (let linkManager of this.getLinksWhereStoreIsChild(storeManager)) {
				linkManager.lookup(record);
			}
			storeManager.insert(record);
		}
	}

	private doRemove<A extends Record, B extends Keys<A>>(storeManager: StoreManager<A, B>, records: Array<A>): void {
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

	constructor(storeManagers: StoreManagers<Stores<A>>, linkManagers: LinkManagers<Links<B>>) {
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

	createWritableStores(): WritableStores<A> {
		let writableStores = {} as WritableStores<any>;
		for (let key in this.storeManagers) {
			let storeManager = this.storeManagers[key];
			writableStores[key] = new OverridableWritableStore(storeManager, {
				insert: async (record) => this.doInsert(storeManager, [record]),
				remove: async (record) => this.doRemove(storeManager, [record])
			});
		}
		return writableStores;
	}

	createWritableLinks(): WritableLinks<B> {
		let writableLinks = {} as WritableLinks<any>;
		for (let key in this.linkManagers) {
			writableLinks[key] = new OverridableWritableLink(this.linkManagers[key], {});
		}
		return writableLinks;
	}
};