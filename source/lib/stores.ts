import * as bedrock from "@joelek/bedrock";
import { StreamIterable } from "./streams";
import { EqualityFilter, FilterMap } from "./filters";
import { compareBuffers, Table } from "./tables";
import { IncreasingOrder, OrderMap, Orders } from "./orders";
import { Fields, Record, Keys, KeysRecord, RecordManager, RequiredKeys, Key } from "./records";
import { BlockManager } from "./blocks";
import { SubsetOf } from "./inference";
import { Direction, RadixTree, Relationship } from "./trees";
import { CompositeSorter, NumberSorter } from "../mod/sorters";
import { SeekableIterable, Tokenizer, union, intersection } from "./utils";

export type SearchResult<A extends Record> = {
	record: A;
	rank: number;
};

export interface StoreInterface<A extends Record, B extends RequiredKeys<A>> {
	filter(filters?: FilterMap<A>, orders?: OrderMap<A>, anchor?: KeysRecord<A, B>, limit?: number): Promise<Array<A>>;
	insert(record: A): Promise<void>;
	length(): Promise<number>;
	lookup(keysRecord: KeysRecord<A, B>): Promise<A>;
	remove(keysRecord: KeysRecord<A, B>): Promise<void>;
	search(query: string, anchor?: KeysRecord<A, B>, limit?: number): Promise<Array<SearchResult<A>>>;
	update(keysRecord: KeysRecord<A, B>): Promise<void>;
	vacate(): Promise<void>;
};

export type StoreInterfaces<A> = {
	[B in keyof A]: A[B] extends StoreInterface<infer C, infer D> ? StoreInterface<C, D> : A[B];
};

export type StoreInterfacesFromStores<A extends Stores<any>> = {
	[B in keyof A]: A[B] extends Store<infer C, infer D> ? StoreInterface<C, D> : never;
};

export type StoresFromStoreInterfaces<A extends StoreInterfaces<any>> = {
	[B in keyof A]: A[B] extends StoreInterface<infer C, infer D> ? Store<C, D> : never;
};

export class FilteredStore<A extends Record> {
	private recordManager: RecordManager<A>;
	private blockManager: BlockManager;
	private keys: Array<string>;
	private numberOfRecords: number;
	private bids: Iterable<number>;
	private filters: FilterMap<A>;
	private orders: OrderMap<A>;
	private anchor?: A;

	constructor(recordManager: RecordManager<A>, blockManager: BlockManager, keys: Array<string>, numberOfRecords: number, bids: Iterable<number>, filters?: FilterMap<A>, orders?: OrderMap<A>, anchor?: A) {
		this.recordManager = recordManager;
		this.blockManager = blockManager;
		this.keys = keys;
		this.numberOfRecords = numberOfRecords;
		this.bids = bids;
		this.filters = filters ?? {};
		this.orders = orders ?? {};
		this.anchor = anchor;
	}

	* [Symbol.iterator](): Iterator<A> {
		let iterable = StreamIterable.of(this.bids)
			.map((bid) => {
				let buffer = this.blockManager.readBlock(bid);
				let record = this.recordManager.decode(buffer);
				return record;
			})
			.filter((record) => {
				for (let key in this.filters) {
					let filter = this.filters[key];
					if (filter == null) {
						continue;
					}
					let filterValue = filter.getValue();
					let recordValue = record[key];
					// Links may request all records matching the value null in the child store.
					let encodedFilterValue = filterValue == null ? bedrock.codecs.Null.encodePayload(filterValue) : this.recordManager.encodeKeys([key], {
						[key]: filterValue
					} as any)[0];
					let encodedRecordValue = this.recordManager.encodeKeys([key], {
						[key]: recordValue
					} as any)[0];
					if (!filter.matches(encodedFilterValue, encodedRecordValue)) {
						return false;
					}
				}
				return true;
			});
		if (Object.keys(this.orders).length > 0) {
			iterable = iterable.sort((one, two) => {
				for (let key in this.orders) {
					let order = this.orders[key];
					if (order == null) {
						continue;
					}
					let comparison = order.compare(one[key], two[key]);
					if (comparison !== 0) {
						return comparison;
					}
				}
				return 0;
			});
		}
		if (this.anchor != null) {
			let encodedAnchor = this.recordManager.encode(this.anchor);
			let found = false;
			iterable = iterable.filter((record) => {
				if (!found) {
					let encodedRecord = this.recordManager.encode(record);
					if (compareBuffers([encodedAnchor], [encodedRecord]) === 0) {
						found = true;
						return false;
					}
				}
				return found;
			});
		}
		yield * iterable;
	}

	static getOptimal<A extends Record>(filteredStores: Array<FilteredStore<A>>): FilteredStore<A> | undefined {
		filteredStores.sort(CompositeSorter.of<FilteredStore<A>>(
			NumberSorter.decreasing((value) => Object.keys(value.orders).length),
			NumberSorter.decreasing((value) => Object.keys(value.filters).length * value.numberOfRecords)
		));
		return filteredStores.pop();
	}
};

export class IndexManager<A extends Record, B extends Keys<A>> {
	private recordManager: RecordManager<A>;
	private blockManager: BlockManager;
	private keys: [...B];
	private tree: RadixTree;

	constructor(recordManager: RecordManager<A>, blockManager: BlockManager, keys: [...B], options?: {
		bid?: number
	}) {
		this.recordManager = recordManager;
		this.blockManager = blockManager;
		this.keys = keys;
		this.tree = new RadixTree(blockManager, options?.bid);
	}

	* [Symbol.iterator](): Iterator<A> {
		yield * new FilteredStore(this.recordManager, this.blockManager, this.keys, this.tree.length(), this.tree, {}, {}, undefined);
	}

	delete(): void {
		this.tree.delete();
	}

	filter(filters?: FilterMap<A>, orders?: OrderMap<A>, anchor?: A): FilteredStore<A> | undefined {
		filters = filters ?? {};
		orders = orders ?? {};
		filters = { ...filters };
		orders = { ...orders };
		let keysConsumed = [] as Keys<A>;
		let keysRemaining = [...this.keys];
		let tree = this.tree;
		let relationship = "^=" as Relationship;
		let keys = [] as Array<Uint8Array>;
		for (let [index, indexedKey] of this.keys.entries()) {
			let filter = filters[indexedKey];
			if (filter == null) {
				break;
			}
			if (filter instanceof EqualityFilter) {
				let filterValue = filter.getValue();
				// Links may request all records matching the value null in the child store.
				let encodedFilterValue = filterValue == null ? bedrock.codecs.Null.encodePayload(filterValue) : this.recordManager.encodeKeys([indexedKey], {
					[indexedKey]: filterValue
				} as any)[0];
				let branch = StreamIterable.of(tree.branch("=", [encodedFilterValue])).shift();
				if (branch == null) {
					if (index < this.keys.length - 1) {
						return;
					} else {
						keys.push(encodedFilterValue);
						break;
					}
				}
				delete filters[indexedKey];
				delete orders[indexedKey];
				keysConsumed.push(keysRemaining.shift() as Key<A>);
				tree = branch;
			}
		}
		let directions = [] as Array<Direction>;
		let orderKeys = Object.keys(orders) as Keys<A>;
		for (let i = 0; i < orderKeys.length; i++) {
			if (keysRemaining[i] !== orderKeys[i]) {
				break;
			}
			let order = orders[orderKeys[i]];
			if (order == null) {
				break;
			}
			directions.push(order.getDirection());
			delete orders[orderKeys[i]];
		}
		if (anchor != null) {
			relationship = ">";
			keys.push(...this.recordManager.encodeKeys(keysRemaining, anchor));
		}
		let iterable = tree.filter(relationship, keys, directions);
		return new FilteredStore(this.recordManager, this.blockManager, this.keys, tree.length(), iterable, filters, orders, undefined);
	}

	insert(keysRecord: KeysRecord<A, B>, bid: number): void {
		let keys = this.recordManager.encodeKeys<Keys<A>>(this.keys, keysRecord);
		this.tree.insert(keys, bid);
	}

	remove(keysRecord: KeysRecord<A, B>): void {
		let keys = this.recordManager.encodeKeys<Keys<A>>(this.keys, keysRecord);
		this.tree.remove(keys);
	}

	update(oldKeysRecord: KeysRecord<A, B>, newKeysRecord: KeysRecord<A, B>, bid: number): void {
		let oldKeys = this.recordManager.encodeKeys<Keys<A>>(this.keys, oldKeysRecord);
		let newKeys = this.recordManager.encodeKeys<Keys<A>>(this.keys, newKeysRecord);
		if (compareBuffers(oldKeys, newKeys) === 0) {
			return;
		}
		this.tree.remove(oldKeys);
		this.tree.insert(newKeys, bid);
	}

	vacate(): void {
		this.tree.vacate();
	}
};

export function getFirstCompletion(prefix: string, tokens: Array<string>): string | undefined {
	return tokens
		.filter((token) => token.startsWith(prefix))
		.map((token) => bedrock.codecs.String.encodePayload(token))
		.sort(bedrock.utils.Chunk.comparePrefixes)
		.map((buffer) => bedrock.codecs.String.decodePayload(buffer))
		.shift();
};

export function getFirstTokenBefore(prefix: string, tokens: Array<string>): string | undefined {
	let encodedPrefix = bedrock.codecs.String.encodePayload(prefix);
	return tokens
		.map((token) => bedrock.codecs.String.encodePayload(token))
		.filter((token) => bedrock.utils.Chunk.comparePrefixes(token, encodedPrefix) < 0)
		.sort(bedrock.utils.Chunk.comparePrefixes)
		.map((buffer) => bedrock.codecs.String.decodePayload(buffer))
		.shift();
};

export function makeSeekableIterable(tree: RadixTree, value: number): SeekableIterable<number> {
	function makeIterable(value: number | undefined, skip: boolean): Iterable<number> {
		if (value != null) {
			if (skip) {
				return tree.filter(">", [
					bedrock.codecs.Integer.encodePayload(value)
				]);
			} else {
				return tree.filter(">=", [
					bedrock.codecs.Integer.encodePayload(value)
				]);
			}
		} else {
			return tree;
		}
	}
	let iterable = makeIterable(value, true);
	let iterator = iterable[Symbol.iterator]();
	return {
		[Symbol.iterator]() {
			return iterable[Symbol.iterator]();
		},
		next() {
			return iterator.next().value;
		},
		seek(value) {
			iterable = makeIterable(value, false);
			iterator = iterable[Symbol.iterator]();
			return this.next();
		}
	};
};

export class SearchIndexManager<A extends Record, B extends Key<A>> {
	private recordManager: RecordManager<A>;
	private blockManager: BlockManager;
	private key: B;
	private tree: RadixTree;

	private computeRank(recordTokens: Array<string>, queryTokens: Array<string>): number {
		return queryTokens.length - recordTokens.length;
	}

	private computeRecordRank(record: A, query: string): number | undefined {
		let recordTokens = this.tokenizeRecord(record);
		let queryTokens = Tokenizer.tokenize(query);
		let lastQueryToken = queryTokens.pop() ?? "";
		for (let queryToken of queryTokens) {
			if (recordTokens.find((recordToken) => recordToken === queryToken) == null) {
				return;
			}
		}
		if (recordTokens.find((recordToken) => recordToken.startsWith(lastQueryToken)) == null) {
			return;
		}
		return this.computeRank(recordTokens, [...queryTokens, lastQueryToken]);
	}

	private insertToken(token: string, category: number, bid: number): void {
		this.tree.insert([
			bedrock.codecs.Integer.encodePayload(category),
			bedrock.codecs.String.encodePayload(token),
			bedrock.codecs.Integer.encodePayload(bid)
		], bid);
	}

	private removeToken(token: string, category: number, bid: number): void {
		this.tree.remove([
			bedrock.codecs.Integer.encodePayload(category),
			bedrock.codecs.String.encodePayload(token),
			bedrock.codecs.Integer.encodePayload(bid)
		]);
	}

	private readRecord(bid: number): A {
		let buffer = this.blockManager.readBlock(bid);
		let record = this.recordManager.decode(buffer);
		return record;
	}

	private tokenizeRecord(record: A): Array<string> {
		let value = record[this.key];
		if (typeof value === "string") {
			return Tokenizer.tokenize(value);
		}
		return [];
	}

	constructor(recordManager: RecordManager<A>, blockManager: BlockManager, key: B, options?: {
		bid?: number
	}) {
		this.recordManager = recordManager;
		this.blockManager = blockManager;
		this.key = key;
		this.tree = new RadixTree(blockManager, options?.bid);
	}

	* [Symbol.iterator](): Iterator<SearchResult<A>> {
		yield * StreamIterable.of(this.search(""));
	}

	delete(): void {
		this.tree.delete();
	}

	insert(record: A, bid: number): void {
		let tokens = this.tokenizeRecord(record);
		for (let token of tokens) {
			this.insertToken(token, tokens.length, bid);
		}
	}

	remove(record: A, bid: number): void {
		let tokens = this.tokenizeRecord(record);
		for (let token of tokens) {
			this.removeToken(token, tokens.length, bid);
		}
	}

	* search(query: string, bid?: number): Iterable<SearchResult<A>> {
		let queryTokens = Tokenizer.tokenize(query);
		if (queryTokens.length === 0) {
			queryTokens.push("");
		}
		let queryCategory = queryTokens.length;
		let lastQueryToken = queryTokens.pop() as string;
		let firstCategory = queryCategory;
		let firstTokenInCategory = lastQueryToken;
		if (bid != null) {
			let record = this.readRecord(bid);
			let recordTokens = this.tokenizeRecord(record);
			let recordCategory = recordTokens.length;
			if (recordCategory < queryCategory) {
				return;
			}
			firstCategory = recordCategory;
			let firstCompletion = getFirstCompletion(lastQueryToken, recordTokens);
			if (firstCompletion == null) {
				return;
			}
			firstTokenInCategory = firstCompletion;
		}
		let categoryBranches = this.tree.branch(">=", [
			bedrock.codecs.Integer.encodePayload(firstCategory)
		]);
		if (queryTokens.length === 0) {
			let firstBidInCategory = bid ?? 0;
			for (let categoryBranch of categoryBranches) {
				let keys = [
					bedrock.codecs.String.encodePayload(firstTokenInCategory),
					bedrock.codecs.Integer.encodePayload(firstBidInCategory)
				];
				let bids = categoryBranch.filter(">", keys);
				for (let bid of bids) {
					let record = this.readRecord(bid);
					let recordTokens = this.tokenizeRecord(record);
					let firstCompletion = getFirstCompletion(lastQueryToken, recordTokens);
					if (firstCompletion == null) {
						break;
					}
					let recordKeys = [
						bedrock.codecs.String.encodePayload(firstCompletion),
						bedrock.codecs.Integer.encodePayload(bid)
					];
					if (compareBuffers(recordKeys, keys) <= 0) {
						continue;
					}
					keys = recordKeys;
					let rank = this.computeRank(recordTokens, [...queryTokens, lastQueryToken]);
					yield {
						record,
						rank
					};
				}
				firstTokenInCategory = lastQueryToken;
				firstBidInCategory = 0;
			}
		} else {
			let firstBidInCategory = bid ?? 0;
			let encodedQueryTokens = queryTokens.map((queryToken) => {
				return bedrock.codecs.String.encodePayload(queryToken);
			});
			for (let categoryBranch of categoryBranches) {
				let tokenBranches = encodedQueryTokens.map((encodedQueryToken) => {
					return categoryBranch.branch("=", [
						encodedQueryToken
					]);
				});
				let iterables = tokenBranches.map((tokenBranch) => {
					let iterables = Array.from(tokenBranch)
						.map((tree) => makeSeekableIterable(tree, firstBidInCategory));
					return union(iterables, (one, two) => one - two);
				});
				let iterable = intersection(iterables, (one, two) => one - two);
				for (let bid of iterable) {
					let record = this.readRecord(bid);
					let recordTokens = this.tokenizeRecord(record);
					let tokensLeft = recordTokens.filter((recordToken) => !queryTokens.includes(recordToken));
					if (tokensLeft.find((token) => token.startsWith(lastQueryToken)) == null) {
						continue;
					}
					let rank = this.computeRank(recordTokens, [...queryTokens, lastQueryToken]);
					yield {
						record,
						rank
					};
				}
				firstBidInCategory = 0;
			}
		}
	}

	update(oldRecord: A, newRecord: A, bid: number): void {
		this.remove(oldRecord, bid);
		this.insert(newRecord, bid);
	}

	vacate(): void {
		this.tree.vacate();
	}

	static * search<A extends Record>(searchIndexManagers: Array<SearchIndexManager<A, Key<A>>>, query: string, bid?: number): Iterable<SearchResult<A>> {
		let iterables = searchIndexManagers.map((searchIndexManager) => searchIndexManager.search(query, bid));
		let iterators = iterables.map((iterable) => iterable[Symbol.iterator]());
		let searchResults = iterators.map((iterator) => iterator.next().value as SearchResult<A> | undefined);
		outer: while (true) {
			let candidates = searchResults
				.map((searchResult, index) => ({ searchResult, index }))
				.filter((candidate): candidate is { searchResult: SearchResult<A>, index: number } => candidate.searchResult != null)
				.sort(CompositeSorter.of(
					NumberSorter.increasing((record) => record.searchResult.rank),
					NumberSorter.decreasing((record) => record.index)
				));
			let candidate = candidates.pop();
			if (candidate == null) {
				break;
			}
			inner: for (let [index, searchIndexManager] of searchIndexManagers.entries()) {
				if (index === candidate.index) {
					continue;
				}
				let rank = searchIndexManager.computeRecordRank(candidate.searchResult.record, query);
				if (rank == null) {
					continue;
				}
				// The candidate has already been yielded since it is ranked higher by the current SearchIndexManager.
				if (rank > candidate.searchResult.rank) {
					searchResults[candidate.index] = iterators[candidate.index].next().value as SearchResult<A> | undefined;
					continue outer;
				}
				// The candidate has already been yielded since it is ranked equally by the current SearchIndexManager which has precedence.
				if (rank === candidate.searchResult.rank && index < candidate.index) {
					searchResults[candidate.index] = iterators[candidate.index].next().value as SearchResult<A> | undefined;
					continue outer;
				}
			}
			yield candidate.searchResult;
			searchResults[candidate.index] = iterators[candidate.index].next().value as SearchResult<A> | undefined;
		}
	}
};

export class StoreManager<A extends Record, B extends RequiredKeys<A>> {
	private blockManager: BlockManager;
	private fields: Fields<A>;
	private keys: [...B];
	private orders: OrderMap<A>;
	private recordManager: RecordManager<A>;
	private table: Table;
	private indexManagers: Array<IndexManager<A, Keys<A>>>;
	private searchIndexManagers: Array<SearchIndexManager<A, Key<A>>>;

	private getDefaultRecord(): A {
		let record = {} as A;
		for (let key in this.fields) {
			record[key] = this.fields[key].getDefaultValue();
		}
		return record;
	}

	private lookupBlockIndex(keysRecord: KeysRecord<A, B>): number {
		let key = this.recordManager.encodeKeys(this.keys, keysRecord);
		let index = this.table.lookup(key);
		if (index == null) {
			let key = this.keys.map((key) => keysRecord[key]).join(", ");
			throw `Expected a matching record for key ${key}!`;
		}
		return index;
	}

	private checkConstraints(record: A): void {
		let recordKey = this.recordManager.encodeKeys(this.keys, record);
		for (let fieldKey in this.fields) {
			let field = this.fields[fieldKey];
			if (!field.getUnique()) {
				continue;
			}
			if (record[fieldKey] == null) {
				continue;
			}
			let existingRecord = this.filter({
				[fieldKey]: new EqualityFilter(record[fieldKey])
			} as any as FilterMap<A>, undefined, undefined, 1).pop();
			if (existingRecord == null) {
				continue;
			}
			let existingRecordKey = this.recordManager.encodeKeys(this.keys, existingRecord);
			if (compareBuffers(recordKey, existingRecordKey) === 0) {
				continue;
			}
			throw new Error(`Expected value of field "${fieldKey}" to be unique!`);
		}
	}

	constructor(blockManager: BlockManager, fields: Fields<A>, keys: [...B], orders: OrderMap<A>, table: Table, indexManagers: Array<IndexManager<A, Keys<A>>>, searchIndexManagers: Array<SearchIndexManager<A, Key<A>>>) {
		this.blockManager = blockManager;
		this.fields = fields;
		this.keys = keys;
		this.orders = orders;
		this.recordManager = new RecordManager(fields);
		this.table = table;
		this.indexManagers = indexManagers;
		this.searchIndexManagers = searchIndexManagers;
	}

	* [Symbol.iterator](): Iterator<A> {
		yield * this.filter();
	}

	delete(): void {
		for (let bid of this.table) {
			this.blockManager.deleteBlock(bid);
		}
		for (let indexManager of this.indexManagers) {
			indexManager.delete();
		}
		for (let searchIndexManager of this.searchIndexManagers) {
			searchIndexManager.delete();
		}
		this.table.delete();
	}

	filter(filters?: FilterMap<A>, orders?: OrderMap<A>, anchorKeysRecord?: KeysRecord<A, B>, limit?: number): Array<A> {
		orders = orders ?? this.orders;
		for (let key of this.keys) {
			if (!(key in orders)) {
				orders[key] = new IncreasingOrder();
			}
		}
		let anchor = anchorKeysRecord != null ? this.lookup(anchorKeysRecord) : undefined;
		let filteredStores = [] as Array<FilteredStore<A>>;
		for (let indexManager of this.indexManagers) {
			let filteredStore = indexManager.filter(filters, orders, anchor);
			if (filteredStore == null) {
				// We can exit early as the index manager has signaled that there are no matching records.
				return [];
			}
			filteredStores.push(filteredStore);
		}
		let fullTableScan = new FilteredStore<any>(this.recordManager, this.blockManager, [], this.table.length(), this.table, filters, orders, anchor);
		filteredStores.push(fullTableScan);
		let filteredStore = FilteredStore.getOptimal(filteredStores);
		if (filteredStore === fullTableScan) {
			// There should be an option to prevent this.
		}
		let iterable = StreamIterable.of(filteredStore)
		if (limit != null) {
			iterable = iterable.limit(limit);
		}
		return iterable.collect();
	}

	insert(record: A): void {
		this.checkConstraints(record);
		let key = this.recordManager.encodeKeys(this.keys, record);
		let encoded = this.recordManager.encode(record);
		let index = this.table.lookup(key);
		if (index == null) {
			index = this.blockManager.createBlock(encoded.length);
			this.blockManager.writeBlock(index, encoded);
			this.table.insert(key, index);
			for (let indexManager of this.indexManagers) {
				indexManager.insert(record, index);
			}
			for (let searchIndexManager of this.searchIndexManagers) {
				searchIndexManager.insert(record, index);
			}
		} else {
			let buffer = this.blockManager.readBlock(index);
			// Bedrock encodes records with a payload length prefix making it sufficient to compare the encoded record to the prefix of the block.
			if (compareBuffers([encoded], [buffer.subarray(0, encoded.length)]) === 0) {
				return;
			}
			let oldRecord = this.recordManager.decode(buffer);
			this.blockManager.resizeBlock(index, encoded.length);
			this.blockManager.writeBlock(index, encoded);
			for (let indexManager of this.indexManagers) {
				indexManager.update(oldRecord, record, index);
			}
			for (let searchIndexManager of this.searchIndexManagers) {
				searchIndexManager.update(oldRecord, record, index);
			}
		}
	}

	length(): number {
		return this.table.length();
	}

	lookup(keysRecord: KeysRecord<A, B>): A {
		let index = this.lookupBlockIndex(keysRecord);
		let buffer = this.blockManager.readBlock(index);
		let record = this.recordManager.decode(buffer);
		return record;
	}

	reload(): void {
		this.table.reload();
	}

	remove(keysRecord: KeysRecord<A, B>): void {
		let key = this.recordManager.encodeKeys(this.keys, keysRecord);
		let index = this.table.lookup(key);
		if (index != null) {
			let buffer = this.blockManager.readBlock(index);
			let oldRecord = this.recordManager.decode(buffer);
			this.table.remove(key);
			this.blockManager.deleteBlock(index);
			for (let indexManager of this.indexManagers) {
				indexManager.remove(oldRecord);
			}
			for (let searchIndexManager of this.searchIndexManagers) {
				searchIndexManager.remove(oldRecord, index);
			}
		}
	}

	search(query: string, anchorKeysRecord?: KeysRecord<A, B>, limit?: number): Array<SearchResult<A>> {
		if (query === "") {
			return StreamIterable.of(this.filter(undefined, undefined, anchorKeysRecord, limit))
				.map((record) => ({
					record,
					rank: 0
				}))
				.collect();
		}
		let anchorBid = anchorKeysRecord != null ? this.lookupBlockIndex(anchorKeysRecord) : undefined;
		let iterable = StreamIterable.of(SearchIndexManager.search(this.searchIndexManagers, query, anchorBid));
		if (limit != null) {
			iterable = iterable.limit(limit);
		}
		return iterable.collect();
	}

	update(keysRecord: KeysRecord<A, B>): void {
		let record = {
			...this.getDefaultRecord(),
			...keysRecord
		};
		try {
			record = {
				...this.lookup(keysRecord),
				...keysRecord
			};
		} catch (error) {}
		return this.insert(record);
	}

	vacate(): void {
		for (let bid of this.table) {
			this.blockManager.deleteBlock(bid);
		}
		for (let indexManager of this.indexManagers) {
			indexManager.vacate();
		}
		for (let searchIndexManager of this.searchIndexManagers) {
			searchIndexManager.vacate();
		}
		this.table.vacate();
	}

	static construct<A extends Record, B extends RequiredKeys<A>, C extends SubsetOf<A, C>>(blockManager: BlockManager, options: {
		fields: Fields<A>,
		keys: [...B],
		orders?: Orders<C>,
		indices?: Array<Index<any>>,
		searchIndices?: Array<SearchIndex<any>>
	}): StoreManager<A, B> {
		let fields = options.fields;
		let keys = options.keys;
		let orders = options.orders ?? {};
		let indices = options.indices ?? [];
		let searchIndices = options.searchIndices ?? [];
		let recordManager = new RecordManager(fields);
		let storage = new Table(blockManager, {
			getKeyFromValue: (value) => {
				let buffer = blockManager.readBlock(value);
				let record = recordManager.decode(buffer);
				return recordManager.encodeKeys(keys, record);
			}
		});
		let indexManagers = indices.map((index) => new IndexManager<A, Keys<A>>(recordManager, blockManager, index.keys));
		let searchIndexManagers = searchIndices.map((index) => new SearchIndexManager<A, Key<A>>(recordManager, blockManager, index.key));
		let manager = new StoreManager(blockManager, fields, keys, orders, storage, indexManagers, searchIndexManagers);
		return manager;
	}
};

export type StoreManagers<A> = {
	[B in keyof A]: A[B] extends StoreManager<infer C, infer D> ? StoreManager<C, D> : A[B];
};

export type StoreManagersFromStores<A extends Stores<any>> = {
	[B in keyof A]: A[B] extends Store<infer C, infer D> ? StoreManager<C, D> : never;
};

export type StoreInterfacesFromStoreManagers<A extends StoreManagers<any>> = {
	[B in keyof A]: A[B] extends StoreManager<infer C, infer D> ? StoreInterface<C, D> : never;
};

export class Index<A extends Record> {
	keys: Keys<A>;

	constructor(keys: Keys<A>) {
		this.keys = keys;
	}

	equals(that: Index<A>): boolean {
		if (this.keys.length !== that.keys.length) {
			return false;
		}
		for (let i = 0; i < this.keys.length; i++) {
			if (this.keys[i] !== that.keys[i]) {
				return false;
			}
		}
		return true;
	}
};

export class SearchIndex<A extends Record> {
	key: Key<A>;

	constructor(key: Key<A>) {
		this.key = key;
	}

	equals(that: SearchIndex<A>): boolean {
		return this.key === that.key;
	}
};

export class Store<A extends Record, B extends RequiredKeys<A>> {
	fields: Fields<A>;
	keys: [...B];
	orders: OrderMap<A>;
	indices: Array<Index<A>>;
	searchIndices: Array<SearchIndex<A>>;

	constructor(fields: Fields<A>, keys: [...B], orders?: OrderMap<A>) {
		this.fields = fields;
		this.keys = keys;
		this.orders = orders ?? {};
		this.indices = [];
		this.searchIndices = [];
		this.index(this.createIndex());
		for (let key in fields) {
			if (fields[key].getSearchable()) {
				this.searchIndices.push(new SearchIndex(key));
			}
			if (fields[key].getUnique()) {
				this.index(new Index([key, ...this.keys]));
			}
		}
	}

	createIndex(): Index<A> {
		let keys = [] as Keys<A>;
		for (let key in this.orders) {
			let order = this.orders[key];
			if (order == null) {
				continue;
			}
			if (!keys.includes(key)) {
				keys.push(key);
			}
		}
		for (let key of this.keys) {
			if (!keys.includes(key)) {
				keys.push(key);
			}
		}
		return new Index(keys);
	}

	index(that: Index<A>): boolean {
		for (let index of this.indices) {
			if (index.equals(that)) {
				return false;
			}
		}
		this.indices.push(that);
		return true;
	}
};

export type Stores<A> = {
	[B in keyof A]: A[B] extends Store<infer C, infer D> ? Store<C, D> : A[B];
};
