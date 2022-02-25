# @joelek/atlas

Embedded database for NodeJS with automatic schema migration and type-inferrence written completely in TypeScript.

```ts
import * as atlas from "@joelek/atlas";
let context = atlas.createContext();
let users = context.createStore({
	user_id: context.createBinaryField(),
	name: context.createStringField()
}, ["user_id"]);
let storage = context.createDiskStorage("./private/db");
let manager = context.createTransactionManager(storage, {
	users
});
await manager.enqueueWritableTransaction(async ({ users }) => {
	return users.insert({
		user_id: Uint8Array.of(1),
		name: "Joel Ek"
	});
});
let user = await manager.enqueueReadableTransaction(async ({ users }) => {
	return users.lookup({
		user_id: Uint8Array.of(1)
	});
});
```

## Overview

### Contexts

### Stores

#### Fields

#### Keys

### Links

### Storage

#### DiskStorage

#### MemoryStorage

### TransactionManagers

### Transactions

#### ReadableTransaction

#### WritableTransaction

## Roadmap

* Decide on how to migrate records when the primary key changes.
* Consider implementing file locks.
* Make memory limit configurable for Cache.
* Allow BlockHandler to keep track of contained buffer size.
* Optimize HashTable with minProbeDistance and maxProbeDistance.
* Tokenize based on capitalization OneTwo => ["one", "two"].
* Improve type-safety checks for serialized keys.
* Implement index support.
* Implement search support.
