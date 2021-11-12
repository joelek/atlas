import { Record, Keys, KeysRecordMap } from "./records";
import { test } from "../test";

type Store<A extends Record, B extends Keys<A>> = {
	records: Map<number, A>;
	keys: [...B];
};

function makeStore<A extends Record, B extends Keys<A>>(records: Map<number, A>, keys: [...B]): Store<A, B> {
	return {
		records,
		keys
	};
}

type Stores<A extends Stores<A>> = {
	[B in keyof A]: A[B] extends Store<infer C, infer D> ? Store<C, D> : never;
};

type Link<A extends Record, B extends Keys<A>, C extends Record, D extends Keys<C>> = {
	parent: Store<A, B>;
	child: Store<C, D>;
	keys: KeysRecordMap<A, B, C>;
};

function makeLink<A extends Record, B extends Keys<A>, C extends Record, D extends Keys<C>>(parent: Store<A, B>, child: Store<C, D>, keys: KeysRecordMap<A, B, C>): Link<A, B, C, D> {
	return {
		parent,
		child,
		keys
	};
}

type Links<A extends Links<A>> = {
	[B in keyof A]: A[B] extends Link<infer C, infer D, infer E, infer F> ? Link<C, D, E, F> : never;
};

function getStoreName<A extends Stores<A>, B extends Links<B>>(stores: A, store: Store<any, any>): string {
	for (let key in stores) {
		if (stores[key] === store) {
			return key;
		}
	}
	throw `Expected store to be in database!`;
}

function lookupChildren<A extends Record, B extends Keys<A>, C extends Record, D extends Keys<C>>(link: Link<A, B, C, D>, parent: A): Iterable<{ childId: number, child: C }> {
	let result = [] as Array<{ childId: number, child: C }>;
	outer: for (let [childId, child] of link.child.records) {
		inner: for (let parentKey in link.keys) {
			let childKey = link.keys[parentKey as B[number]];
			let value = child[childKey];
			if (parent[parentKey] !== value) {
				continue outer;
			}
		}
		result.push({
			childId,
			child
		});
	}
	return result;
}

function lookupParent<A extends Record, B extends Keys<A>, C extends Record, D extends Keys<C>>(link: Link<A, B, C, D>, child: C): { parentId: number, parent: A } {
	outer: for (let [parentId, parent] of link.parent.records) {
		inner: for (let parentKey in link.keys) {
			let childKey = link.keys[parentKey as B[number]];
			let value = child[childKey];
			if (parent[parentKey] !== value) {
				continue outer;
			}
		}
		return {
			parentId,
			parent
		};
	}
	throw `Not found!`;
}

function resolve<A extends Stores<A>, B extends Links<B>>(stores: A, links: B): void {
	let checkMaps = new Map<string, Map<number, Record>>();
	let deleteMaps = new Map<string, Map<number, Record>>();
	let loop = true;
	for (let i = 0; loop; i += 1) {
		console.log(`Beginning iteration ${i}`);
		loop = false;
		for (let key in links) {
			let link = links[key];
			let childName = getStoreName(stores, link.child);
			let parentName = getStoreName(stores, link.parent);
			let childCheckMap = checkMaps.get(childName);
			if (childCheckMap == null) {
				childCheckMap = new Map<number, Record>();
				checkMaps.set(childName, childCheckMap);
			}
			let parentCheckMap = checkMaps.get(parentName);
			if (parentCheckMap == null) {
				parentCheckMap = new Map<number, Record>();
				checkMaps.set(parentName, parentCheckMap);
			}
			let childDeleteMap = deleteMaps.get(childName);
			if (childDeleteMap == null) {
				childDeleteMap = new Map<number, Record>();
				deleteMaps.set(childName, childDeleteMap);
			}
			let parentDeleteMap = deleteMaps.get(parentName);
			if (parentDeleteMap == null) {
				parentDeleteMap = new Map<number, Record>();
				deleteMaps.set(parentName, parentDeleteMap);
			}
			for (let [childId, child] of i > 0 ? childCheckMap : link.child.records) {
				console.log(`Checking child ${childId}`);
				childCheckMap.delete(childId);
				if (childDeleteMap.has(childId)) {
					continue;
				}
				try {
					let { parentId, parent } = lookupParent(link, child);
					if (!parentDeleteMap.has(parentId)) {
						continue;
					}
				} catch (error) {}
				console.log(`\tChild ${childId} has no parent, queueing for deletion...`);
				childDeleteMap.set(childId, child);
				childCheckMap.set(childId, child);
				loop = true;
			}
		}
		for (let key in links) {
			let link = links[key];
			let childName = getStoreName(stores, link.child);
			let parentName = getStoreName(stores, link.parent);
			let childCheckMap = checkMaps.get(childName);
			if (childCheckMap == null) {
				childCheckMap = new Map<number, Record>();
				checkMaps.set(childName, childCheckMap);
			}
			let parentCheckMap = checkMaps.get(parentName);
			if (parentCheckMap == null) {
				parentCheckMap = new Map<number, Record>();
				checkMaps.set(parentName, parentCheckMap);
			}
			let childDeleteMap = deleteMaps.get(childName);
			if (childDeleteMap == null) {
				childDeleteMap = new Map<number, Record>();
				deleteMaps.set(childName, childDeleteMap);
			}
			let parentDeleteMap = deleteMaps.get(parentName);
			if (parentDeleteMap == null) {
				parentDeleteMap = new Map<number, Record>();
				deleteMaps.set(parentName, parentDeleteMap);
			}
			for (let [parentId, parent] of parentCheckMap) {
				console.log(`Checking parent ${parentId}`);
				parentCheckMap.delete(parentId);
				if (!parentDeleteMap.has(parentId)) {
					continue;
				}
				for (let { childId, child } of lookupChildren(link, parent)) {
					console.log(`\tParent ${parentId} has child ${childId}, queueing for deletion...`);
					childDeleteMap.set(childId, child);
					childCheckMap.set(childId, child);
					loop = true;
				}
			}
		}
	}
	for (let key in stores) {
		let store = stores[key];
		let storeName = getStoreName(stores, store);
		let deleteMap = deleteMaps.get(storeName);
		if (deleteMap != null) {
			for (let [id, record] of deleteMap) {
				store.records.delete(id);
			}
		}
	}
}

test(`It should remove orphaned records iteratively.`, async (assert) => {
	let users = makeStore(new Map<number, { user_id: number, parent_user_id: number | null }>(), ["user_id"]);
	let userChildren = makeLink(users, users, {
		user_id: "parent_user_id"
	});
	users.records.set(0, {
		user_id: 0,
		parent_user_id: 1
	});
	users.records.set(1, {
		user_id: 1,
		parent_user_id: 2
	});
	resolve({
		users
	}, {
		userChildren
	});
	assert.array.equals(Array.from(users.records.keys()).sort(), []);
});

test(`It should support validating cyclically linked records.`, async (assert) => {
	let users = makeStore(new Map<number, { user_id: number, parent_user_id: number | null }>(), ["user_id"]);
	let userChildren = makeLink(users, users, {
		user_id: "parent_user_id"
	});
	users.records.set(0, {
		user_id: 0,
		parent_user_id: 1
	});
	users.records.set(1, {
		user_id: 1,
		parent_user_id: 0
	});
	resolve({
		users
	}, {
		userChildren
	});
	assert.array.equals(Array.from(users.records.keys()).sort(), [0, 1]);
});

test(`It should not remove records explicitly allowed to be orphaned.`, async (assert) => {
	let users = makeStore(new Map<number, { user_id: number, parent_user_id: number | null }>(), ["user_id"]);
	let userChildren = makeLink(users, users, {
		user_id: "parent_user_id"
	});
	users.records.set(0, {
		user_id: 0,
		parent_user_id: 1
	});
	users.records.set(1, {
		user_id: 1,
		parent_user_id: null
	});
	resolve({
		users
	}, {
		userChildren
	});
	assert.array.equals(Array.from(users.records.keys()).sort(), [0, 1]);
});

test(`It should remove orphaned records for linked records in different stores.`, async (assert) => {
	let users = makeStore(new Map<number, { user_id: number }>(), ["user_id"]);
	let posts = makeStore(new Map<number, { post_id: number, user_id: number }>(), ["post_id"]);
	let userPosts = makeLink(users, posts, {
		user_id: "user_id"
	});
	users.records.set(0, {
		user_id: 0
	});
	posts.records.set(0, {
		post_id: 0,
		user_id: 1
	});
	posts.records.set(1, {
		post_id: 1,
		user_id: 0
	});
	resolve({
		users,
		posts
	}, {
		userPosts
	});
	assert.array.equals(Array.from(users.records.keys()).sort(), [0]);
	assert.array.equals(Array.from(posts.records.keys()).sort(), [1]);
});
/*




case 1: single parent is deleted from store
	add parent to deletion queue for parent store
	while deletion queues are non empty

	end


case 2: consistency check after schema change
	while deletion queues are non empty
		for each link that changed (link added or changed child store)
			if link forbids orphans
				for each child in link
					lookup parent based on child
					if parent is missing
						add child to deletion queue
					end
				end
			end
		end
		for each link that changed
			if link forbids orphans

			end
		end
	end

functionality needed:
	get all links from given store

*/
