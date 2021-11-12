import * as atlas from "./index";
import { benchmark } from "./benchmark";

let context = atlas.createContext();
let users = context.createStore("users",
	{
		user_id: context.createBinaryField(),
		name: context.createStringField({ search: true })
	},
	["user_id"]
);
let posts = context.createStore("posts",
	{
		post_id: context.createBinaryField(),
		user_id: context.createBinaryField(),
		created: context.createBigIntField(),
		title: context.createStringField({ search: true })
	},
	["post_id"]
);
context.createLink(users, posts, {
	user_id: "user_id"
});
context.createIndex(posts, ["user_id"]);
let storage = context.createPersistentStorage("./private/test/");
context.useStorage(storage);






/*
users.insert({
	user_id: Uint8Array.of(11),
	name: "First User"
});
users.insert({
	user_id: Uint8Array.of(12),
	name: "Second User"
});
storage.commitTransaction();







posts.insert({
	post_id: Uint8Array.of(21),
	user_id: Uint8Array.of(11),
	created: 1n,
	title: "First post"
});
posts.insert({
	post_id: Uint8Array.of(22),
	user_id: Uint8Array.of(11),
	created: 2n,
	title: "Second post"
});
posts.insert({
	post_id: Uint8Array.of(23),
	user_id: Uint8Array.of(11),
	created: 3n,
	title: "Third post"
});
storage.commitTransaction(); */




/*

posts.debug();
users.debug();
 */
/*
benchmark(() => {
	let iterable = posts.filter();
	for (let entry of iterable) {
		console.log(entry.value());
	}
});

benchmark(() => {
	let iterable = users.filter();
	for (let entry of iterable) {
		console.log(entry.value());
	}
}); */














/*
benchmark(() => {
	let iterable = posts.search("post", { anchor: {
		post_id: Uint8Array.of(22)
	}});
	for (let user of iterable) {
		console.log(user.order(), user.value());
	}
});
 */

/*
benchmark(() => {
	return users.lookup({
		user_id: Uint8Array.of(11)
	});
});
 */
/*
benchmark(() => {
	let iterable = users.filter({
		name: context.createEqualityFilter("First User")
	});
	for (let user of iterable) {
		console.log(user.value());
	}
});
 */
