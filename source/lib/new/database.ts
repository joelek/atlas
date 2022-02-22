import { File } from "./files";
import { LinkManager, LinkManagers, Links, OverridableWritableLink, WritableLinksFromLinkManagers } from "./link";
import { Record, Keys, RequiredKeys } from "./records";
import { OverridableWritableStore, StoreManager, StoreManagers, Stores, WritableStoresFromStoreManagers } from "./store";
import { TransactionManager } from "./transaction";

export class DatabaseManager<A extends StoreManagers, B extends LinkManagers> {
	private storeManagers: A;
	private linkManagers: B;
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

	createTransactionManager(file: File): TransactionManager<WritableStoresFromStoreManagers<A>, WritableLinksFromLinkManagers<B>> {
		let writableStores = this.createWritableStores();
		let writableLinks = this.createWritableLinks();
		return new TransactionManager(file, writableStores, writableLinks);
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

	enforceStoreConsistency<C extends Keys<A>>(storeNames: [...C]): void {
		for (let key of storeNames) {
			let storeManager = this.storeManagers[key];
			for (let linkManager of this.getLinksWhereStoreIsParent(storeManager)) {
				let child = linkManager.getChild();
				let records = [] as Array<Record>;
				for (let entry of child) {
					let record = entry.record();
					try {
						linkManager.lookup(record);
					} catch (error) {
						records.push(record);
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
			for (let entry of child) {
				let record = entry.record();
				try {
					linkManager.lookup(record);
				} catch (error) {
					records.push(record);
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
			for (let entry of child) {
				let record = entry.record();
				try {
					linkManager.lookup(record);
				} catch (error) {
					records.push(record);
				}
			}
			this.doRemove(child, records);
		}
	}
};

export class Database<A extends Stores, B extends Links> {
	stores: A;
	links: B;

	constructor(stores: A, links: B) {
		this.stores = stores;
		this.links = links;
	}
};
