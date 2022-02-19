import { test } from "../test";
import { Context } from "./context";

test(``, async () => {
	let context = new Context();
	let users = context.createStore({
		user_id: context.createBinaryField(),
		name: context.createStringField()
	}, ["user_id"]);
	let posts = context.createStore({
		post_id: context.createBinaryField(),
		user_id: context.createBinaryField(),
		name: context.createStringField()
	}, ["post_id"]);
	let userPosts = context.createLink(users, posts, {
		user_id: "user_id"
	});
	let storage = context.createMemoryStorage();
	let manager = context.createTransactionManager(storage, {
		users
	}, {
		userPosts
	});
	manager.enqueueWritableTransaction(async ({ users }, { userPosts }) => {
		return users.insert({
			user_id: Uint8Array.of(1),
			name: "Joel"
		});
	});
});
