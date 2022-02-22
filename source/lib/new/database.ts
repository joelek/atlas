import { Links } from "./link";
import { Stores } from "./store";

export class Database<A extends Stores, B extends Links> {
	stores: A;
	links: B;

	constructor(stores: A, links: B) {
		this.stores = stores;
		this.links = links;
	}
};
