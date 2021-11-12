import { AllocatedStore, Store } from "./store";
import { test } from "../test";
import { BinaryField, StringField } from "./records";
import { BlockHandler } from "./vfs";
import { VirtualFile } from "./files";

test(``, async (assert) => {
	let blockHandler = new BlockHandler(new VirtualFile(0));
	let users = new Store({
		user_id: new BinaryField(),
		name: new StringField()
	}, ["user_id"]);
	let allocatedUsers = users.allocate(blockHandler);
	let usersManager = allocatedUsers.createManager();
	usersManager.insert({
		user_id: Uint8Array.of(1),
		name: "Joel Ek"
	});
	let bid = allocatedUsers.getBid();
	{
		let allocatedUsers2 = AllocatedStore.loadFromBid(blockHandler, bid)
			.migrateData(allocatedUsers);
		let usersManager2 = allocatedUsers2.createManager();
		console.log(usersManager2.lookup({
			user_id: Uint8Array.of(1)
		}));
	}
});
