import * as autoguard from "@joelek/ts-autoguard";
import * as guards from "./guards";
import { File } from "./files";
import { Record, Keys, KeysRecord } from "./records";
import { Link, LinkHandler, Store, StoreHandler } from "./Store";
import { BlockHandler } from "./vfs";

export interface ReadAccess {
	filter<A extends Record, B extends Keys<A>>(store: Store<A, B>): Iterable<A>;
	length<A extends Record, B extends Keys<A>>(store: Store<A, B>): number;
	linked<A extends Record, B extends Keys<A>, C extends Record, D extends Keys<C>>(link: Link<A, B, C, D>, keysRecord: KeysRecord<A, B>): Iterable<C>;
	lookup<A extends Record, B extends Keys<A>>(store: Store<A, B>, keysRecord: KeysRecord<A, B>): A;
};

export interface WriteAccess extends ReadAccess {
	insert<A extends Record, B extends Keys<A>>(store: Store<A, B>, record: A): void;
	remove<A extends Record, B extends Keys<A>>(store: Store<A, B>, keysRecord: KeysRecord<A, B>): void;
};

export class Database {
	static create(file: File, links: Array<Link<any, any, any, any>>, stores: Map<string, Store<any, any>>): Database {
		file.discard();
		let guard = guards.Database as autoguard.serialization.MessageGuardBase<guards.Database>;
		let blockHandler = new BlockHandler(file);
		if (blockHandler.getBlockCount() === 0) {
			let storeHandlers = new Map<Store<any, any>, StoreHandler<any, any>>();
			for (let [name, store] of stores) {
				let storeHandler = store.createHandler(blockHandler);
				storeHandlers.set(store, storeHandler);
			}
			let data = guard.encode(autoguard.codecs.bedrock.CODEC, database);
			blockHandler.createBlock(Math.min(64, data.length));
			blockHandler.writeBlock(0, data);
		}



/*


kommer behöva läsa gamla records från disk genom en storehandler




allocate block
run constructor
constructor checks block init
one block for database root => { stores, links }
one block for each store => { hashBlock }
one block for each link => {}
one block for each index => { treeBlock, keys }
one block for each field => { name, type }
export function for each object


migrateDataFrom(that: StoreHandler<any, any>): void {
	for (let entry of that.filter()) {

	}
}

{
	stores: [
		{
			name: "users",
			storageBlock: 1,
			fields: [
				{
					name: "user_id",
					type: "binary"
				},
				{
					name: "name",
					type: "string"
				}
			],
			keys: ["user_id"]
		},
		{
			name: "posts",
			storageBlock: 2,
			fields: [
				{
					name: "post_id",
					type: "binary"
				},
				{
					name: "user_id",
					type: "binary"
				},
				{
					name: "title",
					type: "string"
				}
			],
			keys: ["post_id"]
		}
	],
	links: [
		{
			parent: "users",
			child: "posts",
			keys: ["user_id"]
		}
	]
}

*/


		let data = blockHandler.readBlock(0);

		// load database from disk
		// run migration
		for (let [name, store] of stores) {
			let blockId = 0; // TODO: Get from loaded database.
			let storeHandler = store.createHandler(blockHandler, blockId);
			storeHandlers.set(store, storeHandler);
		}
		file.persist();
		return new Database(file, storeHandlers);
	}

	private file: File;
	private readSync: Promise<any>;
	private writeSync: Promise<any>;
	private linkHandlers: Map<Link<any, any, any, any>, LinkHandler<any, any, any, any>>;
	private storeHandlers: Map<Store<any, any>, StoreHandler<any, any>>;

	constructor(file: File, linkHandlers: Map<Link<any, any, any, any>, LinkHandler<any, any, any, any>>, storeHandlers: Map<Store<any, any>, StoreHandler<any, any>>) {
		this.file = file;
		this.readSync = Promise.resolve();
		this.writeSync = Promise.resolve();
		this.linkHandlers = linkHandlers;
		this.storeHandlers = storeHandlers;
	}

	private createReadAccess(): ReadAccess {
		return {
			filter: (store) => {
				return this.getStoreHandler(store).filter();
			},
			length: (store) => {
				return this.getStoreHandler(store).length();
			},
			linked: (link, keysRecord) => {
				return this.getLinkHandler(link).lookup(keysRecord);
			},
			lookup: (store, keysRecord) => {
				return this.getStoreHandler(store).lookup(keysRecord);
			}
		};
	}

	private createWriteAccess(): WriteAccess {
		return {
			...this.createReadAccess(),
			insert: (store, record) => {
				// TODO: Execute constraints based on information in links.
				return this.getStoreHandler(store).insert(record);
			},
			remove: (store, keysRecord) => {
				// TODO: Cascade deletes based on information in links.
				return this.getStoreHandler(store).remove(keysRecord);
			}
		};
	}

	private getLinkHandler<A extends Record, B extends Keys<A>, C extends Record, D extends Keys<C>>(link: Link<A, B, C, D>): LinkHandler<A, B, C, D> {
		let linkHandler = this.linkHandlers.get(link);
		if (linkHandler == null) {
			throw `Expected link to be present in database!`;
		}
		return linkHandler;
	}

	private getStoreHandler<A extends Record, B extends Keys<A>>(store: Store<A, B>): StoreHandler<A, B> {
		let storeHandler = this.storeHandlers.get(store);
		if (storeHandler == null) {
			throw `Expected store to be present in database!`;
		}
		return storeHandler;
	}

	async getReadAccess<A>(transaction: (access: ReadAccess) => Promise<A>): Promise<A> {
		let access = this.createReadAccess();
		let promise = this.readSync
			.then(() => transaction(access));
		this.writeSync = this.writeSync
			.then(() => promise)
			.catch(() => {});
		try {
			let value = await promise;
			return value;
		} catch (error) {
			throw error;
		}
	}

	async getWriteAccess<A>(transaction: (access: WriteAccess) => Promise<A>): Promise<A> {
		let access = this.createWriteAccess();
		let promise = this.writeSync
			.then(() => transaction(access));
		this.writeSync = this.readSync = this.writeSync
			.then(() => promise)
			.catch(() => {});
		try {
			let value = await promise;
			this.file.persist();
			return value;
		} catch (error) {
			this.file.discard();
			throw error;
		}
	}
};
