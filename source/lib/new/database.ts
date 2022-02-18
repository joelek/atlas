import { File } from "./files";
import { LinkManagers, Links } from "./link";
import { StoreManagers, Stores } from "./store";
import { TransactionManager } from "./transaction";
import { BlockHandler } from "./vfs";

export class DatabaseManager<A, B> {
	private file: File;
	private storeManagers: StoreManagers<Stores<A>>;
	private linkManagers: LinkManagers<Stores<B>>;

	constructor(file: File, stores: Stores<A>, links: Links<B>) {
		let blockHandler = new BlockHandler(file);
	}

	createTransactionManager(): TransactionManager<Stores<A>, Links<B>> {
		return new TransactionManager(this.file, this.storeManagers, this.linkManagers);
	}
};
