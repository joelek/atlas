export class SchemaManager {
	constructor() {

	}
};

/*
	static saveSchema(): void {
		let storeBids = {} as DatabaseSchema["storeBids"];
		for (let key in this.storeManagers) {
			storeBids[key] = this.storeManagers[key].getBid();
		}
		let links = {} as DatabaseSchema["links"];
		for (let key in this.linkManagers) {
			links[key] = this.linkManagers[key].getBid();
		}
		let schema: DatabaseSchema = {
			storeBids,
			links
		};
		let buffer = DatabaseSchema.encode(schema);
		this.blockHandler.resizeBlock(this.bid, buffer.length);
		this.blockHandler.writeBlock(this.bid, buffer);
	}
 */
	static migrate<A extends Stores<A>, B extends Links<B>>(oldDatabase: TransactionManager<any, any>, options: {
		stores: A,
		links: B
	}): TransactionManager<A, B> {
		let migratedStores = [] as Array<keyof A>;
		for (let key in options.stores) {
			if (oldDatabase.storeManagers[key] == null) {

			}
		}
		for (let key in oldDatabase.storeManagers) {
			if (options.stores[key as string as keyof A] == null) {
				// remove store
			}
		}
	}

	// TODO: Handle schema outside.
	static construct<A extends Stores<A>, B extends Links<B>>(blockHandler: BlockHandler, bid: number | null, file: File, options?: {
		stores: A,
		links: B
	}): TransactionManager<A, B> {
		if (bid == null) {
			if (options == null) {
				return TransactionManager.construct<any, any>(blockHandler, null, file, {
					stores: {},
					links: {}
				});
			} else {
				let storeManagers = {} as StoreManagers<A>;
				for (let key in options.stores) {
					storeManagers[key] = options.stores[key].createManager(blockHandler, null) as any;
				}
				let linkManagers = {} as LinkManagers<B>;
				for (let key in options.links) {
					linkManagers[key] = options.links[key].createManager(blockHandler, null) as any;
				}
				bid = blockHandler.createBlock(64);
				let manager = new TransactionManager(blockHandler, bid, file, storeManagers, linkManagers);
				manager.saveSchema();
				return manager;
			}
		} else {
			if (options == null) {
				let schema = DatabaseSchema.decode(blockHandler.readBlock(bid));
				let storeManagers = {} as StoreManagers<A>;
				for (let key in schema.storeBids) {
					storeManagers[key as keyof A] = StoreManager.construct(blockHandler, schema.storeBids[key]) as any;
				}
				let linkManagers = {} as LinkManagers<B>;
				for (let key in schema.linkBids) {
					linkManagers[key as keyof A] = LinkManager.construct(blockHandler, schema.linkBids[key]) as any;
				}
				let manager = new TransactionManager(blockHandler, bid, file, storeManagers, linkManagers);
				return manager;
			} else {
				return TransactionManager.migrate(TransactionManager.construct(blockHandler, bid, file), options);
			}
		}
	}
};











export const LinkSchema = bedrock.codecs.Object.of({
	parent: bedrock.codecs.String,
	child: bedrock.codecs.String,
	keys: bedrock.codecs.Array.of(bedrock.codecs.String)
});

export type LinkSchema = ReturnType<typeof LinkSchema["decode"]>;

export const DatabaseSchema = bedrock.codecs.Object.of({
	storeBids: bedrock.codecs.Record.of(bedrock.codecs.Integer),
	links: bedrock.codecs.Record.of(LinkSchema)
});

export type DatabaseSchema = ReturnType<typeof DatabaseSchema["decode"]>;
