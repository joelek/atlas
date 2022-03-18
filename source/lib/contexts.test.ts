import { test } from "./test";
import { Context } from "./contexts";

test(`It should work.`, async (assert) => {
	let context = new Context();
	let users = context.createStore({
		user_id: context.createStringField(),
		name: context.createStringField(),
		age: context.createIntegerField()
	}, ["user_id"], {
		name: context.createIncreasingOrder()
	});
	let posts = context.createStore({
		post_id: context.createStringField(),
		user_id: context.createStringField(),
		title: context.createStringField()
	}, ["post_id"]);
	let userPosts = context.createLink(users, posts, {
		user_id: "user_id"
	}, {
		title: context.createIncreasingOrder()
	});
	let query = context.createQuery(users, {
		name: context.createEqualityOperator(),
		age: context.createEqualityOperator()
	});
	let manager = context.createTransactionManager("./private/atlas", {
		users,
		posts
	}, {
		userPosts
	}, {
		query
	});
	await manager.enqueueWritableTransaction(async ({ users, posts }, { userPosts }, { query }) => {
		users.insert({
			user_id: "User 1",
			name: "Joel Ek",
			age: 38
		});
		posts.insert({
			post_id: "Post 1",
			user_id: "User 1",
			title: "Some title."
		});
	});
	let observed = await manager.enqueueReadableTransaction(async ({ users, posts }, { userPosts }, { query }) => {
		let allUserPosts = await userPosts.filter({
			user_id: "User 1"
		});
		return users.lookup({
			user_id: "User 1"
		});
	});
	let expected = {
		user_id: "User 1",
		name: "Joel Ek",
		age: 38
	};
	assert.record.equals(observed, expected);
});
