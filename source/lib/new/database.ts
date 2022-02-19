import * as bedrock from "@joelek/bedrock";
import { File } from "./files";
import { Table } from "./hash";
import { LinkManager, LinkManagers, Links } from "./link";
import { BinaryFieldManager, BooleanFieldManager, FieldManager, FieldManagers, KeysRecordMap, NullableStringFieldManager, RecordManager, StringFieldManager } from "./records";
import { BinaryFieldSchema, BooleanFieldSchema, DatabaseSchema, FieldSchema, LinkSchema, NullableStringFieldSchema, StoreSchema, StringFieldSchema } from "./schema";
import { StoreManager, StoreManagers, Stores } from "./store";
import { TransactionManager } from "./transaction";
import { BlockHandler } from "./vfs";

function isCompatible<V>(codec: bedrock.codecs.Codec<V>, subject: any): subject is V {
	try {
		codec.encode(subject);
		return true;
	} catch (error) {
		return false;
	}
}

export class DatabaseManager<A, B> {
	private file: File;
	private blockHandler: BlockHandler;

	private createFieldManager(schema: FieldSchema): FieldManager<any> {
		let blockHandler = this.blockHandler;
		if (isCompatible(BinaryFieldSchema, schema)) {
			return new BinaryFieldManager(blockHandler, 1337, schema.defaultValue);
		}
		if (isCompatible(BooleanFieldSchema, schema)) {
			return new BooleanFieldManager(blockHandler, 1337, schema.defaultValue);
		}
		if (isCompatible(StringFieldSchema, schema)) {
			return new StringFieldManager(blockHandler, 1337, schema.defaultValue);
		}
		if (isCompatible(NullableStringFieldSchema, schema)) {
			return new NullableStringFieldManager(blockHandler, 1337, schema.defaultValue);
		}
		throw `Expected code to be unreachable!`;
	}

	private createStoreManager(schema: StoreSchema): StoreManager<any, any> {
		let blockHandler = this.blockHandler;
		let fieldManagers = {} as FieldManagers<any>;
		for (let key in schema.fields) {
			fieldManagers[key] = this.createFieldManager(schema.fields[key]);
		}
		let keys = schema.keys;
		// TODO: Create index managers.
		let recordManager = new RecordManager(fieldManagers);
		let storage = new Table(blockHandler, {
			getKeyFromValue: (value) => {
				let buffer = blockHandler.readBlock(value);
				let record = recordManager.decode(buffer);
				return recordManager.encodeKeys(keys, record);
			}
		}, {
			bid: schema.storageBid
		});
		return new StoreManager(blockHandler, 1337, fieldManagers, keys, storage);
	}

	private createLinkManager(schema: LinkSchema, storeManagers: StoreManagers<any>): LinkManager<any, any, any, any, any> {
		let parent = storeManagers[schema.parent] as StoreManager<any, any> | undefined;
		if (parent == null) {
			throw `Expected store with name "${schema.parent}"!`;
		}
		let child = storeManagers[schema.child] as StoreManager<any, any> | undefined;
		if (child == null) {
			throw `Expected store with name "${schema.child}"!`;
		}
		let recordKeysMap = schema.keys as KeysRecordMap<any, any, any>;
		// TODO: Order.
		return new LinkManager(parent, child, recordKeysMap);
	}

	constructor(file: File) {
		this.file = file;
		this.blockHandler = new BlockHandler(file);
		if (this.blockHandler.getBlockCount() === 0) {
			let schema: DatabaseSchema = {
				stores: {},
				links: {}
			};
			let buffer = DatabaseSchema.encode(schema);
			this.blockHandler.createBlock(buffer.length);
			this.blockHandler.writeBlock(0, buffer);
		}
	}

	createTransactionManager(): TransactionManager<Stores<A>, Links<B>> {
		let schema = DatabaseSchema.decode(this.blockHandler.readBlock(0));
		let storeManagers = {} as StoreManagers<any>;
		for (let key in schema.stores) {
			storeManagers[key] = this.createStoreManager(schema.stores[key]);
		}
		let linkManagers = {} as LinkManagers<any>;
		for (let key in schema.links) {
			linkManagers[key] = this.createLinkManager(schema.links[key], storeManagers);
		}
		// ConsistencyManager
		return new TransactionManager(this.file, storeManagers, linkManagers);
	}

	migrateSchema<C, D>(stores: Stores<C>, links: Links<D>): DatabaseManager<C, D> {
		// TODO: Migrate.
		return this as any;
	}
};
