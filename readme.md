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

let { transactionManager } = context.createTransactionManager("./private/db", {
	users
});

await transactionManager.enqueueWritableTransaction(async (queue, { users }) => {
	return users.insert({
		user_id: Uint8Array.of(1),
		name: "Joel Ek",
		age: 38
	});
});

let user = await transactionManager.enqueueReadableTransaction(async (queue, { users }) => {
	return users.lookup({
		user_id: Uint8Array.of(1)
	});
});
```

## Background

Databases are used when structured and frequently changing data needs to be persistently stored. They can be used by single applications or, when using adequate management software, as a component shared by multiple applications in a system.

Database mangement software is implemented using either an embedded architecture or a client/server architecture. Embedded management software is, just as the name suggests, embedded in the application in contrast to separate from the application in the client/server architecture.

While the client/server architecture enables the database to be shared by multiple applications, the architecture does come with a set of drawbacks. Since the database is shared, all applications must be updated whenever the structure of the database changes in a significant way. Conversely, the database must be updated whenever either of the applications change in a significant way. These problems are exacerbated for distributed applications and for applications with separate environments for its different development stages.

For management software using the client/server architecture, the interconnectedness can act as a limiting factor on the development of a single application in the system. For complex systems, there is also the issue of not knowing which applications use which parts of the data, often resulting in data being kept around in case some application still uses it.

Embedded management software provides mitigation for these issues at the trade-off of only allowing the database to be used by a single application. The database may be tightly integrated which reduces the risk of unforseen errors. It may also be updated as needed as the requirements of the application change.

Applications using embedded management software also benefit from not depending on an external dependency to provide the application with the database. Since there is no external dependency, the risk of unforseen errors is minimized.

The future of the Internet will be built on decentralized and distributed applications that require robust embedded database software. Atlas is a lightweight embedded database manager that enables the development of robust, database-driven applications. It provides advanced type inference and compile-time type checking through the TypeScript compiler.

## Overview

Atlas is initialized by creating a context for the database using `atlas.createContext()`. The context is subsequently used to define all database entities and the way in which they connect to each other.

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

### Orders

Atlas defines the order entity as an ordering scheme using the sort-order provided by [Bedrock](https://github.com/joelek/bedrock).

```ts
context.createDecreasingOrder();
context.createIncreasingOrder();
```

### Stores

Atlas defines the store entity as an associative collection of fields coupled with a tuple of keys specifying which of those fields identify a unique record. The tuple may specify zero, one or several identifying fields and they must all be non-nullable. All fields not specified as identifying are considered metadata fields.

```ts
let users = context.createStore({
	user_id: context.createBinaryField(),
	name: context.createStringField(),
	age: context.createIntegerField()
}, ["user_id"]);
```

Stores will be ordered by the identifying fields in increasing order unless explicitly specified when creating the store.

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

Atlas defines the link entity as a link between a parent and a child store as well as how the keys of the parent store map to the keys of the child store. Links may be used to filter child stores for the corresponding records linked to a specific record in the parent store. Links may also be used to to lookup the parent record corresponding to a specific record in the child store.

Links are used to maintain data-consistency and can be configured to allow or forbid `orphans`. Orphans are allowed only when the keys of the parent store map to nullable fields in the child store.

A record that is about to be inserted into a child store is checked against its links. Insertion will be prevented whenever there is at least one link not allowing orphans and when there is no corresponding parent record in the parent store. Conversely, a record that is about to be removed from a parent store is checked against its links. Links that do not allow orphans will cause removal of all child records linked to the parent record in question. This behaviour is referred to as `cascading delete` in database terminology. Please make sure that you understand the implications of this behaviour before using Atlas in production environments.

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

A link is `self-referencing` when the parent and child stores correspond to the same store. Self-referencing links must allow orphaned child records through the use of a nullable field in order not to restrict the database from inserting any records at all into the store.

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

### Operators

Atlas defines the operator entity as a logical operator that subsequently may be used to create a filter entity using a parameter value.

```ts
context.createEqualityOperator();
```

### Filters

Atlas defines the filter entity as a logical operator coupled with a parameter value. Filters are commonly not defined explicitly but rather implicitly through links and queries.

### Queries

Atlas defines the query entity as a store coupled with an associative collection of operators where each operator is assigned a specific key corresponding to one of the keys in the store. Queries can be used to filter the corresponding store for records matching all operators specified.

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

Atlas defines the index entity as a store coupled with a list of keys specifying the indexed fields. It is used to ensure that database operations are executed optimally at the cost of requiring additional storage space. Indices are not defined explicitly but rather implicitly through the store, link and query entities.

## API

All database operations are performed in the context of an associated transaction. Transactions are short-lived constructs with either read or write access that should be created with the minimum access required for the desired operations. Transactions are enqueued through the transaction manager.

The transaction manager is created with a path specifying where the database files should be stored as well as all stores, links and queries that should be present in the database.

```ts
let { transactionManager } = context.createTransactionManager("./private/db", {
	users,
	posts
}, {
	userPosts
}, {
	getUsersByName
});
```

A transaction with write access will be provided with write access objects for all stores, links and queries that are present in the database. All operations are performed through a transaction-specific queue that persist all changes to the underlying file if and only if all operations complete successfully.

```ts
await transactionManager.enqueueWritableTransaction(async (queue, {
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

A transaction with read access will be provided with read access objects for all stores, links and queries that are present in the database. All operations are performed through a transaction-specific queue.

```ts
let user = await transactionManager.enqueueReadableTransaction(async (queue, {
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

Transactions with read access are executed in `parallel` whereas transactions with write access are executed in `serial`. Only create transactions with write access when absolutely needed as write access reduces transaction throughput!

### Stores

#### Insert

Records may be inserted using the `insert()` method.

```ts
insert(
	record: A
): Promise<void>;
```

* The `record` argument must be used to specify the record in question.

#### Filter

Records matching certain criteria may be retrieved using the `filter()` method. The method will return all records inserted into the store when invoked without arguments. Stores are usually not filtered directly but instead through the corresponding `filter()` methods for links and queries.

```ts
filter(
	filters?: FilterMap<A>,
	orders?: OrderMap<A>,
	anchor?: KeysRecord<A, B>,
	limit?: number
): Promise<Array<A>>;
```

* The `filters` argument may be used to specify conditions that must be met for the records returned.
* The `orders` argument may be used to specify the desired order of the records returned.
* The `anchor` argument may be used to specify the identifying fields of the last record seen. The first record returned will be the record located directly after the anchor.
* The `limit` argument may be used to specify the maximum batch of records to return.

#### Length

The number of records inserted into a store may be checked using the `length()` method.

```ts
length(

): Promise<number>;
```

#### Lookup

Records may be looked up using the `lookup()` method. The method will throw an error if the corresponding record cannot be found.

```ts
lookup(
	keysRecord: KeysRecord<A, B>
): Promise<A>;
```

* The `keysRecord` argument must be used to specify the identifying fields of the record in question.

#### Remove

Records may be removed using the `remove()` method.

```ts
remove(
	keysRecord: KeysRecord<A, B>
): Promise<void>;
```

* The `keysRecord` argument must be used to specify the identifying fields of the record in question.

#### Update

Records may be updated using the `update()` method.

```ts
update(
	record: A
): Promise<void>;
```

* The `record` argument must be used to specify the record in question.

### Links

#### Filter

Child records matching certain criteria may be retrieved using the `filter()` method. The method will return all orphaned child records when invoked without arguments.

```ts
filter(
	keysRecord?: KeysRecord<A, B>,
	anchor?: KeysRecord<C, D>,
	limit?: number
): Promise<Array<C>>;
```

* The `keysRecord` argument may be used to specify the identifying fields of the parent record in question.
* The `anchor` argument may be used to specify the identifying fields of the last child record seen. The first record returned will be the record located directly after the anchor.
* The `limit` argument may be used to specify the maximum batch of records to return.

#### Lookup

Parent records may be looked up using the `lookup()` method. The method will return undefined if the corresponding child record is orphaned.

```ts
lookup(
	keysRecord: C | Pick<C, E[B[number]]>
): Promise<A | undefined>;
```

* The `keysRecord` argument must be used to specify the identifying fields of the child record in question.

### Queries

#### Filter

Records matching certain criteria may be retrieved using the `filter()` method.

```ts
filter(
	parameters: C,
	anchor?: KeysRecord<A, B>,
	limit?: number
): Promise<Array<A>>;
```

* The `parameters` argument must be used to specify the parameter values for the query.
* The `anchor` argument may be used to specify the identifying fields of the last record seen. The first record returned will be the record located directly after the anchor.
* The `limit` argument may be used to specify the maximum batch of records to return.

## Schema migration

Atlas performs automatic schema migration when a transaction manager is created with a path where a database already is stored. Atlas will ensure that the existing schema is migrated to the schema implied by the stores, links and queries specified when creating the transaction manager. This is done by determining the differences between the new and the existing schema.

Please make sure that you understand how Atlas handles automatic schema migration before you use Atlas in production environments.

* Atlas removes all existing stores not referenced in the new schema. All records of the corresponding stores are removed.
* Atlas creates new stores for all stores not referenced in the existing schema.
* Atlas updates all stores referenced both in the new and in the existing schemas. All records of the corresponding stores are updated.
* Atlas removes all existing fields not referenced in the new schema of a given store. All records of the corresponding store will have their correponding values removed.
* Atlas creates new fields for all fields not referenced in the existing schema of a given store. All records of the corresponding store will have their corresponding values set to a default value.
* Atlas updates all fields referenced both in the new and in the existing schemas of a given store. All records of the corresponding store will have their corresponding values set to either a default value or the existing value. The existing value is always used when the value is considered compatible with the new field. This is always the case when changing a non-nullable field into a nullable field but not guaranteed to be the case when changing a nullable field into a non-nullable field. A default value is always used when the fundamental type of a field changes.

In addition to this, Atlas will enforce data-consistency for all links not referenced in the existing schema.

## Technical details

### Performance

The performance of Atlas will utimately depend on the general performance of the underlying hardware, most notably the hardware used to store the database.

The table shown below gives a rough estimate of the performance of Atlas in fully ACID-compliant transactions per second. Please note how write performance drops significantly when the database is stored using mechanical storage. This is a direct result of the transaction model employed by Atlas and due to the high latency of synchronizing mechanical storage.

| Device                        | Read (T/s) | Write (T/s) |
| ----------------------------- | ---------- | ----------- |
| WD Black SN750 1TB M.2 SSD    | 12 192     | 520         |
| Seagate IronWolf 8TB 3.5" HDD | 11 350     | 12          |

Storing the database on a Solid State Drive (SSD) is highly recommended for optimal performance, especially for write-heavy applications.

### Limits and overheads

Atlas implements a virtual block system in which all database entities are stored. Each block is allocated as a contiguous array of 2^k bytes where k is the smallest non-negative number able to store the complete block. This allows blocks to shrink and grow as needed without unnecessary reallocation and simplifies block reuse as there are fewer distinct block sizes in the system. It does however imply that each block is stored with an overhead of between 0% and 100%. A 256 byte block will be stored in an array of 256 bytes with an overhead of 0 bytes. A 257 byte block will be stored in an array of 512 bytes with an overhead of 255 bytes.

Each block is assigned a sequential id in the block allocation table (BAT) where each 64-bit entry stores the block address using 48 bits, its category (k) using 8 bits as well as 8 bits of metadata. The 48-bit address space implies a maximum database size of 281 474 976 710 656 bytes (256 TiB). Each entry constitutes an additional overhead of 8 bytes which allows for storing roughly 3*10<sup>13</sup> unique blocks.

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
npm install joelek/atlas#semver:^0.4
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
* Implement search support using RadixTree.
* Defer decoding of records until record is filtered and ordered.
* Consider implementing fsync batching for transactions.
* Improve heuristic for index selector.
* Allow undefined values instead of nulls.
* Implement enum types.
