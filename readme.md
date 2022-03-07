# @joelek/atlas

Lightweight embedded database manager for NodeJS with advanced type inference and compile-time type checking. Written completely in TypeScript.

```ts
import * as atlas from "@joelek/atlas";
let context = atlas.createContext();
let users = context.createStore({
	user_id: context.createBinaryField(),
	name: context.createStringField(),
	age: context.createIntegerField()
}, ["user_id"]);
let manager = context.createTransactionManager("./private/db", {
	users
});
await manager.enqueueWritableTransaction(async ({ users }) => {
	return users.insert({
		user_id: Uint8Array.of(1),
		name: "Joel Ek",
		age: 38
	});
});
let user = await manager.enqueueReadableTransaction(async ({ users }) => {
	return users.lookup({
		user_id: Uint8Array.of(1)
	});
});
```

## Background

Databases are used when structured and frequently changing data needs to be persistently stored. They can be used by single applications or, when using adequate management software, used as a component shared by multiple applications in a system.

Database mangement software is implemented using either an embedded architecture or a client/server architecture. Embedded management software is, just as the name suggests, embedded in the application in contrast to separate from the application in the client/server architecture.

While the client/server architecture enables the database to be shared by multiple applications which is inherently more scalable, the architecture does come with a set of drawbacks. Since the database is shared, all applications must be updated whenever the structure of the database changes in a significant way. Conversely, the database must be updated whenever either of the applications change in a significant way. These problems are exacerbated for distributed applications and for applications with separate environments for its different development stages.

For management software using the client/server architecture, the interconnectedness can act as a limiting factor on the development of a single application in the system. For complex systems, there is also the issue of not knowing which applications use which parts of the data, often resulting in data being kept around just in case some application might still use it.

Embedded management software provides mitigation for these issues at the trade-off of only allowing the database be used by a single application. The database may be tightly integrated which reduces the risk of unforseen errors. It may also be updated as needed as the requirements of the application change and does not depend on an external dependency in the form of another server, often running on another machine, providing the application with the database.

The future of the Internet will be built on decentralized and distributed applications that require robust embedded database software. Atlas is a lightweight embedded database manager that enables the development of robust, database-driven applications. It provides advanced type inference and compile-time type checking through the TypeScript compiler.

## Overview

Atlas is initialized by creating a context for the database using `atlas.createContext()`. The context is subsequently used to define all database entities and the way in which they relate to each other.

```ts
import * as atlas from "@joelek/atlas";
let context = atlas.createContext();
```

The context will utimately produce a transaction manager that is used to transact with the database.

### Data types

Atlas supports all non-composite data types defined by [Bedrock](https://github.com/joelek/bedrock).

* The `bigint` data type may be used to store big integers of arbitrary length.
* The `binary` data type may be used to store binary chunks of arbitrary length.
* The `boolean` data type may be used to store booleans.
* The `integer` data type may be used to store integers.
* The `number` data type may be used to store numbers.
* The `string` data type may be used to store unicode strings of arbitrary length.

### Fields

Atlas defines the field entity as one of the data types supported by Atlas coupled with data related to its specific occurence such as constraints or default values. Fields may be created as non-nullable or nullable as shown below.

```ts
context.createBigIntField();
context.createNullableBigIntField();
context.createBinaryField();
context.createNullableBinaryField();
context.createBooleanField();
context.createNullableBooleanField();
context.createIntegerField();
context.createNullableIntegerField();
context.createNumberField();
context.createNullableNumberField();
context.createStringField();
context.createNullableStringField();
```

### Records

Atlas defines the record entity as an associative collection of fields where each field is assigned a specific key. Records are not created explicitly but rather implicitly through the store entity.

### Orders

Atlas defines the order entity as an ordering scheme using the sort-order provided by [Bedrock](https://github.com/joelek/bedrock).

```ts
context.createDecreasingOrder();
context.createIncreasingOrder();
```

### Stores

Atlas defines the store entity as a record coupled with a sequence of keys specifying the uniquely identifying fields of the implicitly defined record. Stores are created as shown below where the uniquely identifying fields must be non-nullable.

```ts
let users = context.createStore({
	user_id: context.createBinaryField(),
	name: context.createStringField(),
	age: context.createIntegerField()
}, ["user_id"]);
```

Stores will be ordered by the uniquely identifying fields in increasing order unless explicitly specified when creating the store.

```ts
let users = context.createStore({
	user_id: context.createBinaryField(),
	name: context.createStringField(),
	age: context.createIntegerField()
}, ["user_id"], {
	name: context.createIncreasingOrder()
});
```

### Links

Atlas defines the link entity as a link between a parent and a child store as well as how the keys of the parent store map to keys of the child store. It can be used to filter the child store for records linked to a given record in the parent store as well as to lookup the parent record linked to a given record in the child store.

Links are used to enforce data-consistency in the database. All records that are inserted are required to adhere to the constraints enforced by all links specified in the database.

A link is `referencing` when the parent and child stores correspond to separate stores. A referencing link is created as shown below.

```ts
let users = context.createStore({
	user_id: context.createBinaryField(),
	name: context.createStringField(),
	age: context.createIntegerField()
}, ["user_id"]);
let posts = context.createStore({
	post_id: context.createBinaryField(),
	post_user_id: context.createBinaryField(),
	title: context.createStringField()
}, ["post_id"]);
let userPosts = context.createLink(users, posts, {
	user_id: "post_user_id"
});
```

A link is `self-referencing` when the parent and child stores correspond to the same store. A self-referencing link is created as shown below. Self-referencing links must allow orphaned child records through the use of a nullable field in order not to restrict the database from inserting any records.

```ts
let directories = context.createStore({
	directory_id: context.createBinaryField(),
	parent_directory_id: context.createNullableBinaryField()
}, ["directory_id"]);
let childDirectories = context.createLink(directories, directories, {
	directory_id: "parent_directory_id"
});
```

The records retrieved when filtering a link will be ordered by the order of the child store unless explicitly specified.

```ts
let userPosts = context.createLink(users, posts, {
	user_id: "post_user_id"
}, {
	title: context.createIncreasingOrder()
});
```

### Filters

Atlas defines the filter entity as a logical operator coupled with a parameter value. Filters are commonly not defined explicitly but rather implicitly through the operator entity.

### Operators

Atlas defines the operator entity as a logical operator that subsequently may be used to create a filter entity using a parameter value.

```ts
context.createEqualityOperator();
```

### Queries

Atlas defines the query entity as a store coupled with an associative collection of operators. It can be used to filter the store for records matching all given operators.

```ts
let getUsersByName = context.createQuery(users, {
	name: context.createEqualityOperator()
});
```

The records retrieved when filtering a query will be ordered by the order of the store unless explicitly specified.

```ts
let getUserByName = context.createQuery(users, {
	name: context.createEqualityOperator()
}, {
	age: context.createIncreasingOrder()
});
```

### Indices

Atlas defines the index entity as a store coupled with a sequence of keys specifying the indexed fields. It is used to ensure that database operations are executed optimally at the cost of requiring additional storage space. Indices are not defined explicitly but rather implicitly through the store, link and query entities.

## Transactions

All database operations are performed in the context of an associated transaction. Transactions are `short-lived` constructs with either read or write access that should be created with the access required for the corresponding operations. Transactions with read access are executed in `parallel` whereas transactions with write access are executed in `serial`. Only create transactions with write access when absolutely needed as write access reduces transaction throughput!

The transaction manager is created with a path that defines where the database will be stored as well as all stores, links and queries that should exist in the schema of the database.

```ts
let manager = context.createTransactionManager("./private/db", {
	users,
	posts
}, {
	userPosts
}, {
	getUsersByName
});
```
Transactions are enqueued through the transaction manager.

A transaction with write access will be provided with write access to all stores, links and queries that exist in the database. All operations are performed through a transaction-specific queue that persist all changes to the underlying file only if all operations complete successfully.

```ts
await manager.enqueueWritableTransaction(async ({
	users,
	posts
}, {
	userPosts
}, {
	getUsersByName
}) => {
	return users.insert({
		user_id: Uint8Array.of(1),
		name: "Joel Ek",
		age: 38
	});
});
```

A transaction with read access will be provided with read access to all stores, links and queries that exist in the database. All operations are performed through a transaction-specific queue.

```ts
let user = await manager.enqueueReadableTransaction(async ({
	users,
	posts
}, {
	userPosts
}, {
	getUsersByName
}) => {
	return users.lookup({
		user_id: Uint8Array.of(1)
	});
});
```

## Schema migration

Atlas performs automatic schema migration when a transaction manager is created with a path where a database already is stored. Atlas will ensure that the existing schema is migrated to the schema specified by the stores, links and queries when creating the transaction manager by determining the differences between the two schemas.

Please make sure that you understand how Atlas handles schema migration before you use Atlas in production environments.

* Atlas removes all existing stores not referenced in the new schema. All records of the corresponding stores are removed.
* Atlas creates new stores for all stores not referenced in the existing schema.
* Atlas updates all stores referenced both in the new and in the existing schemas. All records of the corresponding stores are updated.
* Atlas removes all existing fields not referenced in the new schema of a given store. All records of the corresponding store will have their correponding field values removed.
* Atlas creates new fields for all fields not referenced in the existing schema of a given store. All records of the corresponding store will have their corresponding field values set to a default field value.
* Atlas updates all fields referenced both in the new and in the existing schemas of a given store. All records of the corresponding store will have their corresponding field values changed to either a default field value or the existing field value. The existing field value is always used when the value of the corresponding field is considered compatible with the updated field. This is always the case when changing a non-nullable field into a nullable field but not guaranteed to be the case when changing a nullable field into a non-nullable field.

In addition to this, Atlas will enforce the data-consistency for all links not referenced in the existing schema.

## Performance

The performance of Atlas will utimately depend on the general performance of the underlying hardware, most notably the hardware used to store the database.

Storing the database on a Solid State Drive (SSD) is highly recommended for optimal performance, especially for write-heavy applications.

### Benchmark

The table shown below gives a rough estimate of the performance of Atlas in fully ACID-compliant transactions per second.

| Device                        | Read (T/s) | Write (T/s) |
| ----------------------------- | ---------- | ----------- |
| WD Black SN750 1TB M.2 SSD    | 12 192     | 520         |
| Seagate IronWolf 8TB 3.5" HDD | 11 350     | 12          |

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
* Consider implementing fsync batching for transactions.
