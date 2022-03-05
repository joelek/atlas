# @joelek/atlas

Embedded database for NodeJS with advanced type inference and compile-time type checking. Written completely in TypeScript.

```ts
import * as atlas from "@joelek/atlas";
let context = atlas.createContext();
let users = context.createStore({
	user_id: context.createBinaryField(),
	name: context.createStringField()
}, ["user_id"]);
let file = context.createDurableFile("./private/db");
let manager = context.createTransactionManager(file, {
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

## Background

## Overview

* Context
* Store
* Field
* Link
* Operator
* Order
* Index
* File
* TransactionManager
* Transaction

## Sponsorship

The continued development of this software depends on your sponsorship. Please consider sponsoring this project if you find that the software creates value for you and your organization.

The sponsor button can be used to view the different sponsoring options. Contributions of all sizes are welcome.

Thank you for your support!

### Ethereum

Ethereum contributions can be made to address `0xf1B63d95BEfEdAf70B3623B1A4Ba0D9CE7F2fE6D`.

![](./eth.png)

## Installation

Releases follow semantic versioning and release packages are published using the GitHub platform. Use the following command to install the latest release.

```
npm install joelek/atlas#semver:^0.0
```

Use the following command to install the very latest build. The very latest build may include breaking changes and should not be used in production environments.

```
npm install joelek/atlas#master
```

NB: This project targets TypeScript 4 in strict mode.

## Roadmap

* Consider implementing file locks.
* Make memory limit configurable for Cache.
* Allow BlockManager to keep track of the exact stored size.
* Optimize HashTable with minProbeDistance and maxProbeDistance.
* Add type-safety checks for keys during schema deserialization.
* Implement index support using legacy RadixTree.
* Implement search support using legacy RadixTree.
* Defer decoding of records until record is filtered and ordered.
* Write unit tests for caches module.
* Write unit tests for queries in the databases and transactions modules.
