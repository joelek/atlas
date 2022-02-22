import { Link, LinkReference, LinkReferences, Links } from "./link";
import { Store, StoreReference, StoreReferences, Stores } from "./store";
import { Record, Fields, KeysRecordMap, BinaryField, BooleanField, StringField, NullableStringField, RequiredKeys } from "./records";
import { TransactionManager } from "./transaction";
import { OrderMap } from "./orders";
import { CachedFile, DurableFile, File, PhysicalFile, VirtualFile } from "./files";
import { DatabaseManager } from "./database";

export class FileReference {
	private FileReference!: "FileReference";
};

export class Context {
	private files: Map<FileReference, File>;
	private links: Map<LinkReference<any, any, any, any, any>, Link<any, any, any, any, any>>;
	private stores: Map<StoreReference<any, any>, Store<any, any>>;
	private databaseManagers: Map<FileReference, DatabaseManager<any, any>>;

	private getFile(reference: FileReference): File {
		let file = this.files.get(reference);
		if (file == null) {
			throw `Expected file to be defined in context!`;
		}
		return file;
	}

	private getLink<A extends Record, B extends RequiredKeys<A>, C extends Record, D extends RequiredKeys<C>, E extends KeysRecordMap<A, B, C>>(reference: LinkReference<A, B, C, D, E>): Link<A, B, C, D, E> {
		let link = this.links.get(reference);
		if (link == null) {
			throw `Expected link to be defined in context!`;
		}
		return link;
	}

	private getStore<A extends Record, B extends RequiredKeys<A>>(reference: StoreReference<A, B>): Store<A, B> {
		let store = this.stores.get(reference);
		if (store == null) {
			throw `Expected store to be defined in context!`;
		}
		return store;
	}

	constructor() {
		this.files = new Map();
		this.links = new Map();
		this.stores = new Map();
		this.databaseManagers = new Map();
	}

	createBinaryField(): BinaryField {
		return new BinaryField(Uint8Array.of());
	}

	createBooleanField(): BooleanField {
		return new BooleanField(false);
	}

	createStringField(): StringField {
		return new StringField("");
	}

	createNullableStringField(): NullableStringField {
		return new NullableStringField(null);
	}

	createLink<A extends Record, B extends RequiredKeys<A>, C extends Record, D extends RequiredKeys<C>, E extends KeysRecordMap<A, B, C>>(parent: StoreReference<A, B>, child: StoreReference<C, D>, recordKeysMap: KeysRecordMap<A, B, C>, orders?: OrderMap<C>): LinkReference<A, B, C, D, E> {
		let reference = new LinkReference<A, B, C, D, E>();
		let link = new Link(parent, child, recordKeysMap, orders);
		this.links.set(reference, link);
		return reference;
	}

	createStore<A extends Record, B extends RequiredKeys<A>>(fields: Fields<A>, keys: [...B]): StoreReference<A, B> {
		let reference = new StoreReference<A, B>();
		let store = new Store(fields, keys);
		this.stores.set(reference, store);
		return reference;
	}

	createDiskStorage(path: string): FileReference {
		let reference = new FileReference();
		let bin = new CachedFile(new PhysicalFile(`${path}.bin`), 64 * 1024 * 1024);
		let log = new CachedFile(new PhysicalFile(`${path}.log`), 64 * 1024 * 1024);
		let file = new DurableFile(bin, log);
		this.files.set(reference, file);
		return reference;
	}

	createMemoryStorage(): FileReference {
		let reference = new FileReference();
		let file = new VirtualFile(0);
		this.files.set(reference, file);
		return reference;
	}

	createTransactionManager<A extends StoreReferences<A>, B extends LinkReferences<B>>(fileReference: FileReference, storeReferences?: A, linkReferences?: B): TransactionManager<Stores<A>, Links<B>> {
		if (this.databaseManagers.has(fileReference)) {
			throw `Expected given storage to not be in use by another database!`;
		}
		storeReferences = storeReferences ?? {} as A;
		linkReferences = linkReferences ?? {} as B;
		let file = this.getFile(fileReference);
		let stores = {} as Stores<any>;
		for (let key in storeReferences) {
			stores[key] = this.getStore(storeReferences[key]);
		}
		let links = {} as Links<any>;
		for (let key in linkReferences) {
			links[key] = this.getLink(linkReferences[key]);
		}
		let databaseManager = new DatabaseManager(file).migrateSchema(stores, links);
		this.databaseManagers.set(fileReference, databaseManager);
		let transactionManager = databaseManager.createTransactionManager();
		return transactionManager;
	}
};
