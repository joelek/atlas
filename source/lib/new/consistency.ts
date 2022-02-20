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

export class ConsistentWritableStore<A extends Record, B extends Keys<A>> implements WritableStore<A, B> {
	private storeManager: StoreManager<A, B>;
	private linksWhereStoreIsParent: Set<LinkManager<any, any, any, any, any>>;
	private linksWhereStoreIsChild: Set<LinkManager<any, any, any, any, any>>;

	constructor(storeManager: StoreManager<A, B>, linksWhereStoreIsParent: Set<LinkManager<any, any, any, any, any>>, linksWhereStoreIsChild: Set<LinkManager<any, any, any, any, any>>) {
		this.storeManager = storeManager;
		this.linksWhereStoreIsParent = linksWhereStoreIsParent;
		this.linksWhereStoreIsChild = linksWhereStoreIsChild;
	}

	async filter(...parameters: Parameters<WritableStore<A, B>["filter"]>): ReturnType<WritableStore<A, B>["filter"]> {
		return this.storeManager.filter(...parameters);
	}

	async insert(...parameters: Parameters<WritableStore<A, B>["insert"]>): ReturnType<WritableStore<A, B>["insert"]> {
		for (let linkManager of this.linksWhereStoreIsChild) {
			// TODO: Handle valid nulls here?
			linkManager.lookup(parameters[0]);
		}
		return this.storeManager.insert(...parameters);
	}

	async length(...parameters: Parameters<WritableStore<A, B>["length"]>): ReturnType<WritableStore<A, B>["length"]> {
		return this.storeManager.length(...parameters);
	}

	async lookup(...parameters: Parameters<WritableStore<A, B>["lookup"]>): ReturnType<WritableStore<A, B>["lookup"]> {
		return this.storeManager.lookup(...parameters);
	}

	async remove(...parameters: Parameters<WritableStore<A, B>["remove"]>): ReturnType<WritableStore<A, B>["remove"]> {
		// TODO: Add record to deletion queue.
		for (let linkManager of this.linksWhereStoreIsParent) {
			let entries = linkManager.filter(parameters[0]);
			// TODO: Add entries to deletion queue.
		}
		return this.storeManager.remove(...parameters);
	}

	async update(...parameters: Parameters<WritableStore<A, B>["update"]>): ReturnType<WritableStore<A, B>["update"]> {
		return this.storeManager.update(...parameters);
	}
};

export class ConsistentWritableLink<A extends Record, B extends Keys<A>, C extends Record, D extends Keys<C>, E extends KeysRecordMap<A, B, C>> implements WritableLink<A, B, C, D, E> {
	private linkManager: LinkManager<A, B, C, D, E>;

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

export class ConsistencyManager<A, B> {
	private storeManagers: StoreManagers<Stores<A>>;
	private linkManagers: LinkManagers<Links<B>>;

	private getLinksWhereStoreIsParent(storeManager: StoreManager<any, any>): Set<LinkManager<any, any, any, any, any>> {
		let linksWhereStoreIsParent = new Set<LinkManager<any, any, any, any, any>>();
		for (let key in this.linkManagers) {
			if (storeManager === this.linkManagers[key].getParent()) {
				linksWhereStoreIsParent.add(this.linkManagers[key]);
			}
		}
		return linksWhereStoreIsParent;
	}

	private getLinksWhereStoreIsChild(storeManager: StoreManager<any, any>): Set<LinkManager<any, any, any, any, any>> {
		let linksWhereStoreIsChild = new Set<LinkManager<any, any, any, any, any>>();
		for (let key in this.linkManagers) {
			if (storeManager === this.linkManagers[key].getChild()) {
				linksWhereStoreIsChild.add(this.linkManagers[key]);
			}
		}
		return linksWhereStoreIsChild;
	}

	constructor(storeManagers: StoreManagers<Stores<A>>, linkManagers: LinkManagers<Links<B>>) {
		this.storeManagers = storeManagers;
		this.linkManagers = linkManagers;
	}

	createWritableStores(): WritableStores<A> {
		let writableStores = {} as WritableStores<any>;
		for (let key in this.storeManagers) {
			let linksWhereStoreIsParent = this.getLinksWhereStoreIsParent(this.storeManagers[key]);
			let linksWhereStoreIsChild = this.getLinksWhereStoreIsChild(this.storeManagers[key]);
			writableStores[key] = new ConsistentWritableStore(this.storeManagers[key], linksWhereStoreIsParent, linksWhereStoreIsChild);
		}
		return writableStores;
	}

	createWritableLinks(): WritableLinks<B> {
		let writableLinks = {} as WritableLinks<any>;
		for (let key in this.linkManagers) {
			writableLinks[key] = new ConsistentWritableLink(this.linkManagers[key]);
		}
		return writableLinks;
	}
};
