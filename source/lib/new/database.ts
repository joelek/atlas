import { File } from "./files";
import { LinkManagers, Links } from "./link";
import { DatabaseSchema } from "./schema";
import { StoreManagers, Stores } from "./store";
import { TransactionManager } from "./transaction";
import { BlockHandler } from "./vfs";

export class DatabaseManager {
	private constructor() {}

	static createTransactionManager<A, B>(file: File, stores: Stores<A>, links: Links<B>): TransactionManager<Stores<A>, Links<B>> {
		let blockHandler = new BlockHandler(file);
		let storeManagers = {} as StoreManagers<Stores<A>>;
		let linkManagers = {} as LinkManagers<Links<B>>;
		if (blockHandler.getBlockCount() === 0) {

		} else {
			let schema = DatabaseSchema.decode(blockHandler.readBlock(0));
			console.log(schema);
		}
		return new TransactionManager(file, storeManagers, linkManagers);
	}
};
