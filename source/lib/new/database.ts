import * as bedrock from "@joelek/bedrock";
import { File } from "./files";
import { Table } from "./hash";
import { LinkManagers, Links } from "./link";
import { BinaryFieldManager, BooleanFieldManager, FieldManager, FieldManagers, NullableStringFieldManager, RecordManager, StringFieldManager } from "./records";
import { BinaryFieldSchema, BooleanFieldSchema, DatabaseSchema, FieldSchema, NullableStringFieldSchema, StoreSchema, StringFieldSchema } from "./schema";
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
	private schema: DatabaseSchema;

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

	private constructor(file: File, blockHandler: BlockHandler, schema: DatabaseSchema) {
		this.file = file;
		this.blockHandler = blockHandler;
		this.schema = schema;
	}

	createTransactionManager(): TransactionManager<Stores<A>, Links<B>> {
		let storeManagers = {} as StoreManagers<Stores<A>>;
		let linkManagers = {} as LinkManagers<Links<B>>;
		for (let key in this.schema.stores) {
			let storeSchema = this.schema.stores[key];

		}
		return new TransactionManager(this.file, storeManagers, linkManagers);
	}

	migrateSchema<C, D>(stores: Stores<C>, links: Links<D>): DatabaseManager<C, D> {
		// TODO: Migrate.
		return this as any;
	}

	static construct(file: File): DatabaseManager<any, any> {
		let blockHandler = new BlockHandler(file);
		if (blockHandler.getBlockCount() === 0) {
			let schema: DatabaseSchema = {
				stores: {},
				links: {}
			};
			let buffer = DatabaseSchema.encode(schema);
			blockHandler.createBlock(buffer.length);
			blockHandler.writeBlock(0, buffer);
		}
		let buffer = blockHandler.readBlock(0);
		let schema = DatabaseSchema.decode(buffer);
		return new DatabaseManager(file, blockHandler, schema);
	}
};
