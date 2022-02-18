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
let manager = context.createTransactionManager("./private/db/", {
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

### Managers

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

* Allow BlockHandler to keep track of contained block data size.
* Improve iterators for RobinHoodHash.
* Optimize RobinHoodHash with minProbeDistance and maxProbeDistance.
* Optimize CompressedTrie by storing leaf residents at parent node.
* Improve iterators for CompressedTrie.
* Investigate possibility of removing parent pointers from CompressedTrie through recursive calls.
* Rename CompressedTrie to RadixTree.
* Rename RobinHoodHash to HashTable.
* Implement sorting for index searches.
* Tokenize based on capitalization OneTwo => ["one", "two"].
* Perform migration in two passes. First remove unused data and then migrate.
* Ensure that all constraints are respected during migration.
