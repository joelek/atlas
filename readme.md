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

### Fields

### Links

### Storage

### TransactionManagers

### Transactions

#### ReadableTransaction

#### WriteableTransaction









## Features

### Automated schema migration

Atlas performs automated schema migration since the database is embedded into its corresponding software.

###	Advanced subset retrieval

Atlas features native support for anchors and optimized subset retrieval, even when using numeric offsets.

### Bi-directional index traversal

Unlike most databases, Atlas does not require specific directional ordering for composite indices. All indices, composite or single-keyed, may be traversed in any combination of directions.

### Filter optimization

## Technology

### Transactional virtual file system

Atlas is built on top of a transactional virtual file system.

### Hierarchical Radix Tree

The features of Atlas are built using a hierarchical variant of the radix tree data structure.

## Roadmap

* Create implementation of StoreManager that handles constraints and cascades, pass to TransactionManager.
* Restrict Context from creating more than one TransactionManager per File.
* Allow BlockHandler to keep track of contained block data size.
* Optimize HashTable with minProbeDistance and maxProbeDistance.
* Implement sorting for index searches.
* Tokenize based on capitalization OneTwo => ["one", "two"].
* Ensure that all constraints are respected during migration.
