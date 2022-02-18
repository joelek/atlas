import { Link, LinkReference, LinkReferences, Links } from "./link";
import { Store, StoreReference, StoreReferences, Stores } from "./store";
import { Record, Keys, Fields, KeysRecordMap, BinaryField, BooleanField, StringField, NullableStringField } from "./records";
import { TransactionManager } from "./transaction";
import { OrderMap } from "./orders";
import { CachedFile, DurableFile, File, PhysicalFile, VirtualFile } from "./files";

export class FileReference {
	private FileReference!: "FileReference";
};

export class Context {
	private files: Map<FileReference, File>;
	private links: Map<LinkReference<any, any, any, any, any>, Link<any, any, any, any, any>>;
	private stores: Map<StoreReference<any, any>, Store<any, any>>;

	constructor() {
		this.files = new Map();
		this.links = new Map();
		this.stores = new Map();
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

	createLink<A extends Record, B extends Keys<A>, C extends Record, D extends Keys<C>, E extends KeysRecordMap<A, B, C>>(parent: StoreReference<A, B>, child: StoreReference<C, D>, recordKeysMap: KeysRecordMap<A, B, C>, orders?: OrderMap<C>): LinkReference<A, B, C, D, E> {
		let reference = new LinkReference<A, B, C, D, E>();
		let link = new Link(parent, child, recordKeysMap, orders);
		this.links.set(reference, link);
		return reference;
	}

	createStore<A extends Record, B extends Keys<A>>(fields: Fields<A>, keys: [...B]): StoreReference<A, B> {
		let reference = new StoreReference<A, B>();
		let store = new Store(fields, keys, []);
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

	createTransactionManager<A extends StoreReferences<A>, B extends LinkReferences<B>>(storage: FileReference, storeReferences?: A, linkReferences?: B): TransactionManager<Stores<A>, Links<B>> {
		storeReferences = storeReferences ?? {} as A;
		linkReferences = linkReferences ?? {} as B;
		let stores = {} as Stores<A>;
		for (let key in storeReferences) {
			let storeReference = storeReferences[key];
			let store = this.stores.get(storeReference);
			if (store == null) {
				throw `Expected store to be defined in context!`;
			}
			stores[key] = store as any;
		}
		let links = {} as Links<B>;
		for (let key in linkReferences) {
			let linkReference = linkReferences[key];
			let link = this.links.get(linkReference);
			if (link == null) {
				throw `Expected link to be defined in context!`;
			}
			links[key] = link as any;
		}


	}
};
