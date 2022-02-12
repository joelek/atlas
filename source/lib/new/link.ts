import { EqualityFilter, FilterMap } from "./filters";
import { OrderMap } from "./orders";
import { Keys, KeysRecord, KeysRecordMap, Record } from "./records";
import { Entry, StoreManager } from "./store";

export class LinkManager<A extends Record, B extends Keys<A>, C extends Record, D extends Keys<C>, E extends KeysRecordMap<A, B, C>> {
	private parent: StoreManager<A, B>;
	private child: StoreManager<C, D>;
	private recordKeysMap: E;
	private orders: OrderMap<C>;

	constructor(parent: StoreManager<A, B>, child: StoreManager<C, D>, recordKeysMap: E, orders?: OrderMap<C>) {
		this.parent = parent;
		this.child = child;
		this.recordKeysMap = recordKeysMap;
		this.orders = orders ?? {};
	}

	filter(keysRecord: KeysRecord<A, B>): Iterable<Entry<C>> {
		let filters = {} as FilterMap<C>;
		for (let key in this.recordKeysMap) {
			let keyOne = key as B[number];
			let keyTwo = this.recordKeysMap[keyOne];
			filters[keyTwo] = new EqualityFilter(keysRecord[keyOne]) as any;
		}
		return this.child.filter(filters, this.orders);
	}

	lookup(record: C | Pick<C, E[B[number]]>): A {
		let keysRecord = {} as KeysRecord<A, B>;
		for (let key in this.recordKeysMap) {
			let keyOne = key as B[number];
			let keyTwo = this.recordKeysMap[keyOne];
			keysRecord[keyOne] = record[keyTwo] as any;
		}
		return this.parent.lookup(keysRecord);
	}
};
/*

export const LinkSchema = bedrock.codecs.Object.of({
	parent: bedrock.codecs.String,
	child: bedrock.codecs.String,
	keys: bedrock.codecs.Array.of(bedrock.codecs.String)
});

export type LinkSchema = ReturnType<typeof LinkSchema["decode"]>;


export type LinkManagers<A> = {
	[B in keyof A]: A[B] extends Link<infer C, infer D, infer E, infer F> ? LinkManager<C, D, E, F> : never;
};

export class Link<A extends Record, B extends Keys<A>, C extends Record, D extends Keys<C>> {
	parent: StoreReference<A, B>;
	child: StoreReference<C, D>;
	recordKeysMap: KeysRecordMap<A, B, C>;
	orders: OrderMap<C>;

	constructor(parent: StoreReference<A, B>, child: StoreReference<C, D>, recordKeysMap: KeysRecordMap<A, B, C>, orders: OrderMap<C>) {
		this.parent = parent;
		this.child = child;
		this.recordKeysMap = recordKeysMap;
		this.orders = orders;
	}

	createManager(blockHandler: BlockHandler, bid: number | null, ): LinkManager<A, B, C, D> {
		let parent = ;
		let child = ;
		let recordKeysMap = this.recordKeysMap;
		let orders = this.orders;
		return LinkManager.construct(blockHandler, bid, {
			parent,
			child,
			recordKeysMap,
			orders
		});
	}
};

export type Links<A> = {
	[B in keyof A]: A[B] extends LinkReference<infer C, infer D, infer E, infer F> ? Link<C, D, E, F> : never;
};

export class LinkReference<A extends Record, B extends Keys<A>, C extends Record, D extends Keys<C>> {
	private LinkReference!: "LinkReference";
};

export type LinkReferences<A> = {
	[B in keyof A]: A[B] extends LinkReference<infer C, infer D, infer E, infer F> ? LinkReference<C, D, E, F> : never;
};
 */
