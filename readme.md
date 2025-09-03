# @joelek/atlas

Lightweight embedded database manager for NodeJS with advanced type inference and compile-time type checking. Written completely in TypeScript.

```ts
import * as atlas from "@joelek/atlas";

let tm = atlas.createTransactionManager("./private/db", (context) => {
	let users = context.createStore({
		user_id: context.createBinaryField(),
		name: context.createStringField(),
		age: context.createIntegerField()
	}, ["user_id"]);

	return {
		stores: {
			users
		}
	};
});

await tm.enqueueWritableTransaction(async (queue) => {
	return tm.stores.users.insert(queue, {
		user_id: Uint8Array.of(1),
		name: "Joel Ek",
		age: 38
	});
});

let user = await tm.enqueueReadableTransaction(async (queue) => {
	return tm.stores.users.lookup(queue, {
		user_id: Uint8Array.of(1)
	});
});
```

## Background

Databases are used when structured and frequently changing data needs to be stored persistently. Databases can be used by single applications or, when using adequate management software, as a component shared by multiple applications in a system.

Database mangement software is implemented using either an embedded architecture or a client/server architecture. Embedded management software is, just as the name suggests, embedded into the application in contrast to separate from the application in the client/server architecture.

While the client/server architecture enables the database to be shared by multiple applications, the architecture does come with a set of drawbacks. Since the database is shared, all applications must be updated whenever the structure of the database changes in a significant way. Conversely, the database must be updated whenever either of the applications change in a significant way. These problems are exacerbated for distributed applications and for applications with separate environments for its different development stages.

For management software using the client/server architecture, the interconnectedness can act as a limiting factor on the development of a single application in the system. For complex systems, there is also the issue of not knowing which applications use which parts of the data, often resulting in data being kept around in case some application still uses it.

Embedded management software provides mitigation for these issues with the trade-off of only allowing the database to be used by a single application. The database may be tightly integrated which reduces the risk of unforseen errors. It may also be updated as needed when the requirements of the application change.

Applications using embedded management software also benefit from not depending on an external dependency to provide the application with the database. Since there is no external dependency, the risk of unforseen errors is minimized.

The future of the Internet will be built on decentralized and distributed applications that require robust embedded database software. Atlas is a lightweight embedded database manager that enables the development of robust, database-driven applications. It provides advanced type inference and compile-time type checking through the TypeScript compiler.

## Overview

An Atlas database is managed through the transaction manager created via `atlas.createTransactionManager(path, schemaProvider)`.

* The `path` argument is used to specify the path to the directory where the database files are to be stored.
* The `schemaProvider` argument is used to specify the desired database schema using a callback to which a context will be provided. The context is used to define the database entities and the way in which they relate to each other.

```ts
import * as atlas from "@joelek/atlas";

let tm = atlas.createTransactionManager("./private/db", (context) => {
	let users = context.createStore({
		user_id: context.createBinaryField(),
		name: context.createStringField(),
		age: context.createIntegerField()
	}, ["user_id"]);

	return {
		stores: {
			users
		}
	};
});
```

All database operations are executed as part of an associated transaction. Transactions are short-lived constructs with either read or write access and should be created with the minimum access required for the desired operations. Transactions are enqueued through the transaction manager.

A writable transaction will be provided with a queue that grants write access to all entities in the database. The writable queue will persist all changes made to the database if and only if all operations complete successfully.

```ts
await tm.enqueueWritableTransaction(async (queue) => {
	return tm.stores.users.insert(queue, {
		user_id: Uint8Array.of(1),
		name: "Joel Ek",
		age: 38
	});
});
```

A readable transaction will be provided with a queue that grants read access to all entities in the database.

```ts
let user = await tm.enqueueReadableTransaction(async (queue) => {
	return tm.stores.users.lookup(queue, {
		user_id: Uint8Array.of(1)
	});
});
```

Readable transactions are executed in parallel whereas writable transactions are executed in serial. Only create writable transactions when absolutely needed as write access reduces transaction throughput!

## Schemas

The context is used to define the desired database schema. Atlas will use the desired schema to perform automatic schema migration when a transaction manager is created with a path where a database already is stored. This is done by determining the differences between the desired and the existing schema.

Please make sure that you understand how Atlas handles automatic schema migration by studying the migration rules before you use Atlas in production environments.

### Data types

Atlas supports all non-composite data types defined by [Bedrock](https://github.com/joelek/bedrock).

* The `bigint` data type may be used to store big integers of arbitrary length.
* The `binary` data type may be used to store binary chunks of arbitrary length.
* The `boolean` data type may be used to store booleans.
* The `integer` data type may be used to store integers with a maximum magnitude of `9 007 199 254 740 991` (2<sup>53</sup> - 1).
* The `number` data type may be used to store numbers.
* The `string` data type may be used to store unicode strings of arbitrary length.

### Fields

Atlas defines the field entity as one of the data types supported by Atlas coupled with data related to its specific instance such as constraints or default values. Fields may be created as non-nullable or nullable as shown below.

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

The default value may be configured for all fields, nullable and non-nullable alike.

```ts
context.createStringField({ defaultValue: "" });
context.createNullableStringField({ defaultValue: null });
```

All fields may be created with a "unique" hint that instructs Atlas to prevent two different records from storing identical non-nullable values for the field in question.

```ts
context.createStringField({ unique: true });
context.createNullableStringField({ unique: true });
```

String fields may be created with a "searchable" hint that instructs Atlas to include the corresponding fields when performing searches in the database.

```ts
context.createStringField({ searchable: true });
context.createNullableStringField({ searchable: true });
```

### Orders

Atlas defines the order entity as an ordering scheme using the sort-order provided by [Bedrock](https://github.com/joelek/bedrock).

```ts
context.createDecreasingOrder();
context.createIncreasingOrder();
```

### Stores

Atlas defines the store entity as an associative collection of fields coupled with a sequence of keys specifying which of those fields identify a unique record. The sequence may specify zero, one or several `identifying fields` and they must all be non-nullable. All fields not specified as identifying are considered `metadata fields`.

```ts
let users = context.createStore({
	user_id: context.createBinaryField(),
	name: context.createStringField(),
	age: context.createIntegerField()
}, ["user_id"]);
```

In the example above, a store for storing user objects is created. Unique user objects will be identified through the "user_id" field whereas the "name" and "age" fields are considered metadata fields.

The default order of the records in a store may be specified when the store is created.

```ts
let users = context.createStore({
	user_id: context.createBinaryField(),
	name: context.createStringField(),
	age: context.createIntegerField()
}, ["user_id"], {
	name: context.createIncreasingOrder()
});
```

In the example above, the default order is specified as the "name" metadata field in increasing order.

The default order of the records in a store will be set to the identifying fields in increasing order when left unspecified. Custom orders may be used during operation but can result in reduced performance when involving other fields. It is advised to use the default order whenever possible.

### Links

Atlas defines the link entity as a link between a parent and a child store as well as how the keys of the parent store map to the keys of the child store. Links may be used to filter child stores for the corresponding records linked to a specific record in the parent store. Links may also be used to to lookup the parent record corresponding to a specific record in the child store.

Links are used to maintain data-consistency for `one to many` relationships and can be configured to allow or forbid `orphans`. Orphans are allowed only when the keys of the parent store map to nullable fields in the child store.

A record that is about to be inserted into a child store is checked against the links specified for the child store. Insertion will be prevented whenever there is at least one link not allowing orphans and when there is no corresponding parent record in the parent store. Conversely, a record that is about to be removed from a parent store is checked against the links specified for the parent store. Links that do not allow orphans will cause removal of all child records linked to the parent record in question. This behaviour is referred to as `cascading delete` in database terminology. Please make sure that you understand the implications of this behaviour before using Atlas in production environments.

#### Referencing links

A link is `referencing` when the parent and child stores correspond to separate stores.

```ts
import * as atlas from "@joelek/atlas";

let tm = atlas.createTransactionManager("./private/db", (context) => {
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

	return {
		stores: {
			users,
			posts
		},
		links: {
			userPosts
		}
	};
});
```

In the example above, three entities are created. A store for storing user objects, a store for storing post objects and a referencing link between the two stores.

A referencing link is created between the two stores as there is a one to many relationship where every user object may be linked to multiple post objects. The "users" store acts as the parent store and the "posts" store acts as the child store. The "user_id" field in the "users" store is mapped to the "post_user_id" field in the "posts" store.

The link will forbid orphans as the "post_user_id" field is specified as non-nullable in the "posts" store. This implies that post objects may not be stored in the "posts" store unless there is a corresponding user object already stored in the "users" store. Furthermore, all post objects linked to a specific user object will be removed when the user object in question is removed. The removal of post objects will in turn trigger subsequent removals in stores acting as child stores with respect to the "posts" store.

The default order of the child records in a link may be specified when the link is created.

```ts
let userPosts = context.createLink(users, posts, {
	user_id: "post_user_id"
}, {
	title: context.createIncreasingOrder()
});
```

In the example above, the default order is specified as the "title" metadata field in increasing order.

The default order of the child records in a link will be set to the identifying fields of the child store in increasing order when left unspecified. Custom orders may be used during operation but can result in reduced performance when involving other fields. It is advised to use the default order whenever possible.

#### Self-referencing links

A link is `self-referencing` when the parent and child stores correspond to the same store. Self-referencing links must allow orphaned child records through the use of a nullable field in order not to restrict the database from inserting any records at all into the store.

```ts
import * as atlas from "@joelek/atlas";

let tm = atlas.createTransactionManager("./private/db", (context) => {
	let directories = context.createStore({
		directory_id: context.createBinaryField(),
		parent_directory_id: context.createNullableBinaryField()
	}, ["directory_id"]);

	let childDirectories = context.createLink(directories, directories, {
		directory_id: "parent_directory_id"
	});

	return {
		stores: {
			directories
		},
		links: {
			childDirectories
		}
	};
});
```

In the example above, two entities are created. A store for storing directory objects and a self-referencing link for the store.

A self-referencing link is created for the store as there is a one to many relationship where every directory object may be linked to multiple directory objects. The "directory_id" field is mapped to the "parent_directory_id" field.

#### Many to many relationships

Atlas can be configured to maintain data-consistency for `many to many` relationships through clever use of the link entity.

```ts
import * as atlas from "@joelek/atlas";

let tm = atlas.createTransactionManager("./private/db", (context) => {
	let users = context.createStore({
		user_id: context.createBinaryField(),
		name: context.createStringField(),
		age: context.createIntegerField()
	}, ["user_id"]);

	let groups = context.createStore({
		group_id: context.createBinaryField(),
		name: context.createStringField()
	}, ["group_id"]);

	let userGroupMemberships = context.createStore({
		user_id: context.createBinaryField(),
		group_id: context.createBinaryField()
	}, ["user_id", "group_id"]);

	let userGroups = context.createLink(users, userGroupMemberships, {
		user_id: "user_id"
	});

	let groupUsers = context.createLink(groups, userGroupMemberships, {
		group_id: "group_id"
	});

	return {
		stores: {
			users,
			posts,
			userGroupMemberships
		},
		links: {
			userGroups,
			groupUsers
		}
	};
});
```

#### Synchronized fields

Metadata fields may be automatically synchronized between stores by specifying the way in which the fields should map from the parent store to the child store when a link is created. Synchronized fields may be used in the same way as normal fields when filtering and ordering the store.

```ts
import * as atlas from "@joelek/atlas";

let tm = atlas.createTransactionManager("./private/db", (context) => {
	let users = context.createStore({
		user_id: context.createBinaryField(),
		name: context.createStringField(),
		age: context.createIntegerField()
	}, ["user_id"]);

	let posts = context.createStore({
		post_id: context.createBinaryField(),
		post_user_id: context.createBinaryField(),
		title: context.createStringField(),
		post_user_name: context.createStringField() // Create a field in the child store (posts).
	}, ["post_id"]);

	let userPosts = context.createLink(users, posts, {
		user_id: "post_user_id"
	}, { /* orders */ }, {
		name: "post_user_name" // Specify that the field should be synchronized from the parent store (users).
	});

	return {
		stores: {
			users,
			posts
		},
		links: {
			userPosts
		}
	};
});
```

### Operators

Atlas defines the operator entity as a logical operator that subsequently may be used to create a filter entity using a parameter value.

```ts
context.createEqualityOperator();
context.createGreaterThanOperator();
context.createGreaterThanOrEqualOperator();
context.createLessThanOperator();
context.createLessThanOrEqualOperator();
```

### Filters

Atlas defines the filter entity as a logical operator coupled with a parameter value. Filters are commonly not defined explicitly but rather implicitly through links and queries.

### Queries

Atlas defines the query entity as a store coupled with an associative collection of operators where each operator is assigned a specific key corresponding to one of the keys in the store. Queries can be used to filter the corresponding store for records matching all operators specified.

```ts
import * as atlas from "@joelek/atlas";

let tm = atlas.createTransactionManager("./private/db", (context) => {
	let users = context.createStore({
		user_id: context.createBinaryField(),
		name: context.createStringField(),
		age: context.createIntegerField()
	}, ["user_id"]);

	let getUsersByName = context.createQuery(users, {
		name: context.createEqualityOperator()
	});

	return {
		stores: {
			users
		},
		queries: {
			getUsersByName
		}
	};
});
```

The default order of the records in a query may be specified when the query is created.

```ts
let getUserByName = context.createQuery(users, {
	name: context.createEqualityOperator()
}, {
	age: context.createIncreasingOrder()
});
```

In the example above, the default order is specified as the "age" metadata field in increasing order.

The default order of the records in a query will be set to the identifying fields of the store in increasing order when left unspecified. Custom orders may be used during operation but can result in reduced performance when involving other fields. It is advised to use the default order whenever possible.

### Indices

Atlas defines the index entity as a store coupled with a list of keys specifying the indexed fields. It is used to ensure that database operations are executed optimally at the cost of requiring additional storage space. Indices are not defined explicitly but rather implicitly through the store, link and query entities.

### Search Indices

Atlas defines the search index entity as a store coupled with a key specifying the indexed field. It is used to ensure that database operations are executed optimally at the cost of requiring additional storage space. Search indices are not defined explicitly but rather implicitly through the store itself.

## Migration Rules

* Atlas removes all existing stores not referenced in the new schema. All records of the corresponding stores are removed.
* Atlas creates new stores for all stores not referenced in the existing schema.
* Atlas updates all stores referenced both in the new and in the existing schemas. All records of the corresponding stores are updated.
* Atlas removes all existing fields not referenced in the new schema of a given store. All records of the corresponding store will have their correponding values removed.
* Atlas creates new fields for all fields not referenced in the existing schema of a given store. All records of the corresponding store will have their corresponding values set to a default value.
* Atlas updates all fields referenced both in the new and in the existing schemas of a given store. All records of the corresponding store will have their corresponding values set to either a default value or the existing value. The existing value is always used when the value is considered compatible with the new field. This is always the case when changing a non-nullable field into a nullable field but not guaranteed to be the case when changing a nullable field into a non-nullable field. A default value is always used when the fundamental type of a field changes.

In addition to this, Atlas will enforce data-consistency for all links not referenced in the existing schema. Atlas will also enforce all constraints not referenced in the existing schema.

When a non-unique field is made unique, at most one record from the set of records having identical values for the field in question is retained. The record retained is the first record in the default order for the given store.

## API

### Stores

#### Insert

Records may be inserted using the `insert(queue, record)` method.

* The `queue` argument must be used to specify the queue to which the operation is enqueued.
* The `record` argument must be used to specify the full record in question.

#### Filter

Records matching certain criteria may be retrieved using the `filter(queue, filters, orders, anchorKeysRecord, limit)` method. The method will return all records inserted into the store when invoked without arguments.

* The `queue` argument must be used to specify the queue to which the operation is enqueued.
* The `filters` argument may be used to specify conditions that must be met for the records returned.
* The `orders` argument may be used to specify the desired order of the records returned.
* The `anchorKeysRecord` argument may be used to specify the identifying fields of the last record seen at minimum. The first record returned will be the record located directly after the anchor.
* The `limit` argument may be used to specify the maximum number of records to return.

Stores are usually not filtered directly but rather indirectly through links and queries.

#### Length

The number of records inserted into a store may be checked using the `length(queue)` method.

* The `queue` argument must be used to specify the queue to which the operation is enqueued.

#### Lookup

Records may be looked up using the `lookup(queue, keysRecord)` method.

* The `queue` argument must be used to specify the queue to which the operation is enqueued.
* The `keysRecord` argument must be used to specify the identifying fields of the record in question at minimum.

The method will throw an error if the corresponding record cannot be found.

#### Remove

Records may be removed using the `remove(queue, keysRecord)` method.

* The `queue` argument must be used to specify the queue to which the operation is enqueued.
* The `keysRecord` argument must be used to specify the identifying fields of the record in question at minimum.

#### Search

Records may be searched using the `search(queue, query, anchorKeysRecord, limit)` method. The method efficiently searches the store for matching records and returns the results ordered by relevance with respect to the given query. Fields must be created with the "searchable" hint to be considered by the search algorithm.

* The `queue` argument must be used to specify the queue to which the operation is enqueued.
* The `query` argument must be used to specify the search query.
* The `anchorKeysRecord` argument may be used to specify the identifying fields of the last record seen at minimum. The first record returned will be the record located directly after the anchor.
* The `limit` argument may be used to specify the maximum number of records to return.

#### Update

Records may be updated using the `update(queue, keysRecord)` method. The method will insert a default record if the corresponding record cannot be found. Metadata fields not specified in the update will retain their previously stored values.

* The `queue` argument must be used to specify the queue to which the operation is enqueued.
* The `keysRecord` argument must be used to specify the identifying fields of the record at minimum.

#### Vacate

All records inserted into a store may be vacated using the `vacate(queue)` method.

* The `queue` argument must be used to specify the queue to which the operation is enqueued.

### Links

#### Filter

Child records matching certain criteria may be retrieved using the `filter(queue, keysRecord, anchorKeysRecord, limit)` method. The method will return all orphaned child records when invoked without arguments.

* The `queue` argument must be used to specify the queue to which the operation is enqueued.
* The `keysRecord` argument may be used to specify the identifying fields of the parent record in question at minimum.
* The `anchorKeysRecord` argument may be used to specify the identifying fields of the last child record seen at minimum. The first record returned will be the record located directly after the anchor.
* The `limit` argument may be used to specify the maximum number of records to return.

#### Lookup

Parent records may be looked up using the `lookup(queue, keysRecord)` method. The method will return undefined if the corresponding child record is orphaned.

* The `queue` argument must be used to specify the queue to which the operation is enqueued.
* The `keysRecord` argument must be used to specify the identifying fields of the child record in question at minimum.

### Queries

#### Filter

Records matching certain criteria may be retrieved using the `filter(queue, parameters, anchorKeysRecord, limit)` method.

* The `queue` argument must be used to specify the queue to which the operation is enqueued.
* The `parameters` argument must be used to specify the parameter values for the query.
* The `anchorKeysRecord` argument may be used to specify the identifying fields of the last record seen at minimum. The first record returned will be the record located directly after the anchor.
* The `limit` argument may be used to specify the maximum number of records to return.

## Technical details

### Performance

The performance of Atlas will utimately depend on the general performance of the hardware utilized, most notably the hardware used to store the database.

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
npm install joelek/atlas#semver:^1.4
```

Use the following command to install the very latest build. The very latest build may include breaking changes and should not be used in production environments.

```
npm install joelek/atlas#master
```

NB: This project targets TypeScript 4 in strict mode.

## Roadmap

* Make memory limit configurable for Cache.
* Optimize HashTable with minProbeDistance and maxProbeDistance.
* Add type-safety checks for keys during schema deserialization.
* Defer decoding of records until record is filtered and ordered.
* Consider implementing fsync batching for transactions.
* Only recreate stores when referenced fields are altered, else update records.
* Only recreate indices when referenced fields are altered.
* Retain last block when resizing PagedFile and only clear affected bytes.
* Create EntityManagers in SchemaManager.
* Restrict filters and orders into proper record subsets.
* Cache statistics for Stores.
* Investigate adding object, array and tuple fields.
