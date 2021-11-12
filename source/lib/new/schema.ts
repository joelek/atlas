import { Database } from "./database";
import { CachedFile, DurableFile, PhysicalFile } from "./files";
import { Record, Keys, KeysRecordMap, Fields } from "./records";
import { Link, Store } from "./store";

const CACHE_SIZE = 64 * 1024 * 1024;

export class Schema {
	private links: Array<Link<any, any, any, any>>;
	private stores: Map<string, Store<any, any>>;

	constructor() {
		this.links = new Array<Link<any, any, any, any>>();
		this.stores = new Map<string, Store<any, any>>();
	}

	createDatabase(path: string): Database {
		let bin = new PhysicalFile(`${path}.bin`);
		let log = new PhysicalFile(`${path}.log`);
		let file = new DurableFile(new CachedFile(bin, CACHE_SIZE), new CachedFile(log, CACHE_SIZE));
		return Database.create(file, this.links, this.stores);
	}

	createLink<A extends Record, B extends Keys<A>, C extends Record, D extends Keys<C>>(primary: Store<A, B>, secondary: Store<C, D>, keysRecordMap: KeysRecordMap<A, B, C>): Link<A, B, C, D> {
		let link = new Link<A, B, C, D>(primary, secondary, keysRecordMap);
		this.links.push(link);
		return link;
	}

	createStore<A extends Record, B extends Keys<A>>(name: string, fields: Fields<A>, key: [...B]): Store<A, B> {
		let store = this.stores.get(name);
		if (store != null) {
			throw `Expected store "${name}" to be defined exactly once!`;
		}
		store = new Store<A, B>(name, fields, key);
		this.stores.set(name, store);
		return store;
	}
};
