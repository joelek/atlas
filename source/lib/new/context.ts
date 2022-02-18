import { Link, LinkReference, LinkReferences, Links } from "./link";
import { Store, StoreReference, StoreReferences, Stores } from "./store";
import { Record, Keys, Fields, KeysRecordMap, BinaryField, BooleanField, StringField, NullableStringField } from "./records";
import { TransactionManager } from "./transaction";
import { OrderMap } from "./orders";

export class Context {
	private links: Map<LinkReference<any, any, any, any, any>, Link<any, any, any, any, any>>;
	private stores: Map<StoreReference<any, any>, Store<any, any>>;

	constructor() {
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

	createTransactionManager<A extends StoreReferences<A>, B extends LinkReferences<B>>(path: string, stores?: A, links?: B): TransactionManager<Stores<A>, Links<B>> {
		throw `TODO`;
	}
};
