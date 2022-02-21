# @joelek/atlas

Embedded relational database for NodeJS written completely in TypeScript.

CAUTION: This software is experimental and under heavy development. Breaking changes and force pushes to master may occur until the first release has been made.

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

#### WriteableTransaction

## Roadmap

* Make memory limit configurable for Cache.
* Restrict Context from creating more than one TransactionManager per File.
* Allow BlockHandler to keep track of contained buffer size.
* Optimize HashTable with minProbeDistance and maxProbeDistance.
* Tokenize based on capitalization OneTwo => ["one", "two"].
