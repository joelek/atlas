import { File } from "./files";
import { LinkManagers, Links } from "./link";
import { DatabaseSchema } from "./schema";
import { StoreManagers, Stores } from "./store";
import { TransactionManager } from "./transaction";
import { BlockHandler } from "./vfs";

export class DatabaseManager<A, B> {
	private file: File;
	private blockHandler: BlockHandler;
	private schema: DatabaseSchema;

	private constructor(file: File, blockHandler: BlockHandler, schema: DatabaseSchema) {
		this.file = file;
		this.blockHandler = blockHandler;
		this.schema = schema;
	}

	createTransactionManager(): TransactionManager<Stores<A>, Links<B>> {
		let storeManagers = {} as StoreManagers<Stores<A>>;
		let linkManagers = {} as LinkManagers<Links<B>>;
		// TODO: Create managers from schema.
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
