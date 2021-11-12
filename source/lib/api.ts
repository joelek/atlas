namespace atlas {
	export class StorageTransaction {
		private StorageTransaction!: "StorageTransaction";

		constructor() {

		}

		createBlock(minLength: number): number {

		}

		getRootIndex(): number | undefined {

		}

		readBlock(index: number, buffer?: Uint8Array, skipLength?: number): Uint8Array {

		}
	};

	export class Storage {
		private Storage!: "Storage";

		constructor() {}

		createTransaction(): StorageTransaction {
			return new StorageTransaction();
		}
	};

	export class Database {
		private Database!: "Database";
		private stores: Map<string, Store>;

		constructor(storage: Storage) {
			let transaction = storage.createTransaction();
			let index = transaction.getRootIndex();
			if (is.absent(index)) {
				index = transaction.createBlock(256);
			}
			let block = transaction.readBlock(index);
guards.Database
		}
	};

	export class Transaction {
		private Transaction!: "Transaction";

		constructor() {}

		cancel(): void {
			throw `Not yet implemented!`;
		}

		commit(): void {
			throw `Not yet implemented!`;
		}

		filter<A extends Record, A_PK extends PrimaryKeyFields<A>>(store: Store<A, A_PK>, filters?: FilterMap<A>, order?: OrderMap<A>, options?: FilterOptions<A, A_PK>): void {
			throw `Not yet implemented!`;
		}

		insert<A extends Record, A_PK extends PrimaryKeyFields<A>>(store: Store<A, A_PK>, next: A): void {
			throw `Not yet implemented!`;
		}

		lookup<A extends Record, A_PK extends PrimaryKeyFields<A>>(store: Store<A, A_PK>, key: PrimaryKey<A, A_PK>): void {
			throw `Not yet implemented!`;
		}

		remove<A extends Record, A_PK extends PrimaryKeyFields<A>>(store: Store<A, A_PK>, key: PrimaryKey<A, A_PK>): void {
			throw `Not yet implemented!`;
		}

		search<A extends Record, A_PK extends PrimaryKeyFields<A>>(store: Store<A, A_PK>, query: string): void {
			throw `Not yet implemented!`;
		}

		update<A extends Record, A_PK extends PrimaryKeyFields<A>>(store: Store<A, A_PK>, next: A): void {
			throw `Not yet implemented!`;
		}
	};

	export class Context {
		private Context!: "Context";

		createStorage(): Storage {
			return new Storage();
		}

		createDatabase(storage: Storage): Database {
			let database = new Database(storage);
			let storageTransaction = storage.createStorageTransaction();


			storageTransaction.commit();
			return database;
		}

		createTransaction(database: Database): Transaction {
			return new Transaction();
		}
	};

	export function createContext(): Context {
		return new Context();
	};
}







let context = atlas.createContext();
let storage = context.createStorage();
let database = context.createDatabase(storage);
let transaction = context.createTransaction(database);
transaction.lookup(users, {
	user_id: Uint8Array.of(1)
});
