import { test } from "../test";
import { Context } from "./context";

test(`It should work.`, async (assert) => {
	let context = new Context();
	let users = context.createStore({
		user_id: context.createStringField(),
		name: context.createStringField()
	}, ["user_id"]);
	let posts = context.createStore({
		post_id: context.createStringField(),
		user_id: context.createStringField(),
		name: context.createStringField()
	}, ["post_id"]);
	let userPosts = context.createLink(users, posts, {
		user_id: "user_id"
	});
	let storage = context.createDiskStorage("./private/atlas");
	let manager = context.createTransactionManager(storage, {
		users,
		posts
	}, {
		userPosts
	});
	let observed = await benchmark(async () => {
		return await manager.enqueueWritableTransaction(async ({ users }, { userPosts }) => {
			return users.lookup({
				user_id: "User 1"
			});
		});
	}, 1);
	let expected = {
		user_id: "User 1",
		name: "Joel"
	};
	assert.record.equals(observed, expected);
});
