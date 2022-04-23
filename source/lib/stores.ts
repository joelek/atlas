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
import { Tokenizer } from "./utils";

export interface WritableStore<A extends Record, B extends RequiredKeys<A>> {
	filter(filters?: FilterMap<A>, orders?: OrderMap<A>, anchor?: KeysRecord<A, B>, limit?: number): Promise<Array<A>>;
	insert(record: A): Promise<void>;
	length(): Promise<number>;
	lookup(keysRecord: KeysRecord<A, B>): Promise<A>;
	remove(keysRecord: KeysRecord<A, B>): Promise<void>;
	search(query: string, anchor?: KeysRecord<A, B>, limit?: number): Promise<Array<A>>;
	update(keysRecord: KeysRecord<A, B>): Promise<void>;
	vacate(): Promise<void>;
};

export type WritableStores<A> = {
	[B in keyof A]: A[B] extends WritableStore<infer C, infer D> ? WritableStore<C, D> : A[B];
};

export type WritableStoresFromStores<A extends Stores<any>> = {
	[B in keyof A]: A[B] extends Store<infer C, infer D> ? WritableStore<C, D> : never;
};

export type StoresFromWritableStores<A extends WritableStores<any>> = {
	[B in keyof A]: A[B] extends WritableStore<infer C, infer D> ? Store<C, D> : never;
};

export class WritableStoreManager<A extends Record, B extends RequiredKeys<A>> implements WritableStore<A, B> {
	private storeManager: StoreManager<A, B>;

	constructor(storeManager: StoreManager<A, B>) {
		this.storeManager = storeManager;
	}

	async filter(...parameters: Parameters<WritableStore<A, B>["filter"]>): ReturnType<WritableStore<A, B>["filter"]> {
		return this.storeManager.filter(...parameters);
	}

	async insert(...parameters: Parameters<WritableStore<A, B>["insert"]>): ReturnType<WritableStore<A, B>["insert"]> {
		return this.storeManager.insert(...parameters);
	}

	async length(...parameters: Parameters<WritableStore<A, B>["length"]>): ReturnType<WritableStore<A, B>["length"]> {
		return this.storeManager.length(...parameters);
	}

	async lookup(...parameters: Parameters<WritableStore<A, B>["lookup"]>): ReturnType<WritableStore<A, B>["lookup"]> {
		return this.storeManager.lookup(...parameters);
	}

	async remove(...parameters: Parameters<WritableStore<A, B>["remove"]>): ReturnType<WritableStore<A, B>["remove"]> {
		return this.storeManager.remove(...parameters);
	}

	async search(...parameters: Parameters<WritableStore<A, B>["search"]>): ReturnType<WritableStore<A, B>["search"]> {
		return this.storeManager.search(...parameters).map((entry) => entry.record);
	}

	async update(...parameters: Parameters<WritableStore<A, B>["update"]>): ReturnType<WritableStore<A, B>["update"]> {
		return this.storeManager.update(...parameters);
	}

	async vacate(...parameters: Parameters<WritableStore<A, B>["vacate"]>): ReturnType<WritableStore<A, B>["vacate"]> {
		return this.storeManager.vacate(...parameters);
	}
};

export class FilteredStore<A extends Record> {
	private recordManager: RecordManager<A>;
	private blockManager: BlockManager;
	private bids: Iterable<number>;
	private filters: FilterMap<A>;
	private orders: OrderMap<A>;
	private anchor?: A;

	constructor(recordManager: RecordManager<A>, blockManager: BlockManager, bids: Iterable<number>, filters?: FilterMap<A>, orders?: OrderMap<A>, anchor?: A) {
		this.recordManager = recordManager;
		this.blockManager = blockManager;
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
					let value = record[key];
					if (!filter.matches(value)) {
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
			NumberSorter.decreasing((value) => Object.keys(value.filters).length)
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
		yield * new FilteredStore(this.recordManager, this.blockManager, this.tree, {}, {});
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
		for (let indexKey of this.keys) {
			let filter = filters[indexKey];
			if (filter == null) {
				break;
			}
			if (filter instanceof EqualityFilter) {
				let encodedValue = filter.getEncodedValue();
				let branch = tree.branch([encodedValue]);
				if (branch == null) {
					return;
				}
				delete filters[indexKey];
				delete orders[indexKey];
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
		let relationship = "^=" as Relationship;
		let keys = [] as Array<Uint8Array>;
		if (anchor != null) {
			relationship = ">";
			keys = this.recordManager.encodeKeys(keysRemaining, anchor);
		}
		let iterable = tree.filter(relationship, keys, directions);
		return new FilteredStore(this.recordManager, this.blockManager, iterable, filters, orders);
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

export type SearchResult<A extends Record> = {
	bid: number;
	record: A;
	tokens: Array<string>;
	rank: number;
};

export function getFirstCompletion(prefix: string, tokens: Array<string>): string | undefined {
	return tokens
		.filter((token) => token.startsWith(prefix))
		.map((token) => bedrock.codecs.String.encodePayload(token))
		.sort(bedrock.utils.Chunk.comparePrefixes)
		.map((buffer) => bedrock.codecs.String.decodePayload(buffer))
		.shift();
};

export class SearchIndexManagerV1<A extends Record, B extends Key<A>> {
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

	private getNextPrefixMatch(prefix: string, relationship: Relationship, previousResult?: SearchResult<A>): SearchResult<A> | undefined {
		let keys = [
			bedrock.codecs.Integer.encodePayload(1),
			bedrock.codecs.String.encodePayload(prefix)
		];
		if (previousResult != null) {
			// Prefix tokens need to be completed in order to correctly locate the previous entry in the tree.
			let firstCompletion = getFirstCompletion(prefix, previousResult.tokens);
			if (firstCompletion == null) {
				keys = [
					bedrock.codecs.Integer.encodePayload(previousResult.tokens.length + 1),
					bedrock.codecs.String.encodePayload(prefix)
				];
			} else {
				keys = [
					bedrock.codecs.Integer.encodePayload(previousResult.tokens.length),
					bedrock.codecs.String.encodePayload(firstCompletion),
					bedrock.codecs.Integer.encodePayload(previousResult.bid)
				];
			}
		}
		let bids = this.tree.filter(relationship, keys);
		outer: while (true) {
			inner: for (let bid of bids) {
				let record = this.readRecord(bid);
				let tokens = this.tokenizeRecord(record);
				// False matches will eventually be produced when traversing the tree.
				let firstCompletion = getFirstCompletion(prefix, tokens);
				if (firstCompletion == null) {
					keys = [
						bedrock.codecs.Integer.encodePayload(tokens.length + 1),
						bedrock.codecs.String.encodePayload(prefix)
					];
					bids = this.tree.filter(relationship, keys);
					continue outer;
				}
				let recordKeys = [
					bedrock.codecs.Integer.encodePayload(tokens.length),
					bedrock.codecs.String.encodePayload(firstCompletion),
					bedrock.codecs.Integer.encodePayload(bid)
				];
				let comparison = compareBuffers(recordKeys, keys);
				// Prefix tokens may produce duplicate matches when traversing the tree.
				if ((relationship === ">" && comparison <= 0) || (relationship === ">=" && comparison < 0)) {
					continue inner;
				}
				let rank = 1;
				return {
					bid,
					record,
					tokens,
					rank
				};
			}
			break;
		}
	}

	private getNextTokenMatch(token: string, relationship: Relationship, previousResult?: SearchResult<A>): SearchResult<A> | undefined {
		let keys = [] as Array<Uint8Array>;
		if (previousResult != null) {
			keys = [
				bedrock.codecs.Integer.encodePayload(previousResult.tokens.length),
				bedrock.codecs.String.encodePayload(token),
				bedrock.codecs.Integer.encodePayload(previousResult.bid)
			];
		} else {
			keys = [
				bedrock.codecs.Integer.encodePayload(0),
				bedrock.codecs.String.encodePayload(token)
			];
		}
		let bids = this.tree.filter(relationship, keys);
		outer: while (true) {
			inner: for (let bid of bids) {
				let record = this.readRecord(bid);
				let tokens = this.tokenizeRecord(record);
				// False matches will eventually be produced when traversing the tree.
				if (!tokens.includes(token)) {
					keys = [
						bedrock.codecs.Integer.encodePayload(tokens.length + 1),
						bedrock.codecs.String.encodePayload(token)
					];
					bids = this.tree.filter(relationship, keys);
					continue outer;
				}
				if (relationship === ">" && bid === previousResult?.bid) {
					continue inner;
				}
				let rank = 1;
				return {
					bid,
					record,
					tokens,
					rank
				};
			}
			break;
		}
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
		let previousResult: SearchResult<A> | undefined;
		if (bid != null) {
			let record = this.readRecord(bid);
			let tokens = this.tokenizeRecord(record);
			let rank = 0;
			previousResult = {
				bid,
				record,
				tokens,
				rank
			};
		}
		let queryTokens = Tokenizer.tokenize(query);
		let lastQueryToken = queryTokens.pop() ?? "";
		if (queryTokens.length === 0) {
			while (true) {
				let prefixCandidate = this.getNextPrefixMatch(lastQueryToken, ">", previousResult);
				if (prefixCandidate == null) {
					return;
				}
				yield prefixCandidate;
				previousResult = prefixCandidate;
			}
		} else {
			let relationship = bid != null ? ">" : ">=" as Relationship;
			while (true) {
				let tokenCandidates = [] as Array<SearchResult<A>>;
				for (let queryToken of queryTokens) {
					let nextTokenResult = this.getNextTokenMatch(queryToken, relationship, previousResult);
					if (nextTokenResult == null) {
						return;
					}
					tokenCandidates.push(nextTokenResult);
				}
				tokenCandidates = tokenCandidates.sort(CompositeSorter.of(
					NumberSorter.increasing((entry) => entry.tokens.length),
					NumberSorter.increasing((entry) => entry.bid)
				));
				let minimumTokenCandidate = tokenCandidates[0];
				let maximumTokenCandidate = tokenCandidates[tokenCandidates.length - 1];
				previousResult = maximumTokenCandidate;
				if (minimumTokenCandidate.bid === maximumTokenCandidate.bid) {
					let prefixCandidate = this.getNextPrefixMatch(lastQueryToken, ">=", maximumTokenCandidate);
					if (prefixCandidate == null) {
						return;
					}
					if (prefixCandidate.bid === maximumTokenCandidate.bid) {
						let { bid, record, tokens } = { ...maximumTokenCandidate };
						let rank = this.computeRank(tokens, [...queryTokens, lastQueryToken]);
						yield {
							bid,
							record,
							tokens,
							rank
						};
					}
					relationship = ">";
				} else {
					relationship = ">=";
				}
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

	static * search<A extends Record>(searchIndexManagers: Array<SearchIndexManagerV1<A, Key<A>>>, query: string, bid?: number): Iterable<SearchResult<A>> {
		let iterables = searchIndexManagers.map((searchIndexManager) => searchIndexManager.search(query, bid));
		let iterators = iterables.map((iterable) => iterable[Symbol.iterator]());
		let searchResults = iterators.map((iterator) => iterator.next().value as SearchResult<A> | undefined);
		outer: while (true) {
			let candidates = searchResults
				.map((searchResult, index) => ({ searchResult, index }))
				.filter((candidate): candidate is { searchResult: SearchResult<A>, index: number } => candidate.searchResult != null)
				.sort((one, two) => {
					return one.searchResult.rank - two.searchResult.rank;
				});
			let candidate = candidates.pop();
			if (candidate == null) {
				break;
			}
			inner: for (let searchIndexManager of searchIndexManagers) {
				let rank = searchIndexManager.computeRecordRank(candidate.searchResult.record, query);
				if (rank != null && rank > candidate.searchResult.rank) {
					searchResults[candidate.index] = iterators[candidate.index].next().value as SearchResult<A> | undefined;
					continue outer;
				}
			}
			yield candidate.searchResult;
			searchResults[candidate.index] = iterators[candidate.index].next().value as SearchResult<A> | undefined;
		}
	}
};

export class SearchIndexManagerV2<A extends Record, B extends Key<A>> {
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
			bedrock.codecs.Boolean.encodePayload(false),
			bedrock.codecs.String.encodePayload(token),
			bedrock.codecs.Integer.encodePayload(category),
			bedrock.codecs.Integer.encodePayload(bid)
		], bid);
		let codePoints = [...token];
		for (let i = 0; i < codePoints.length + 1; i++) {
			this.tree.insert([
				bedrock.codecs.Boolean.encodePayload(true),
				bedrock.codecs.String.encodePayload(codePoints.slice(0, i).join("")),
				bedrock.codecs.Integer.encodePayload(category),
				bedrock.codecs.Integer.encodePayload(bid)
			], bid);
		}
	}

	private removeToken(token: string, category: number, bid: number): void {
		this.tree.remove([
			bedrock.codecs.Boolean.encodePayload(false),
			bedrock.codecs.String.encodePayload(token),
			bedrock.codecs.Integer.encodePayload(category),
			bedrock.codecs.Integer.encodePayload(bid)
		]);
		let codePoints = [...token];
		for (let i = 0; i < codePoints.length + 1; i++) {
			this.tree.remove([
				bedrock.codecs.Boolean.encodePayload(true),
				bedrock.codecs.String.encodePayload(codePoints.slice(0, i).join("")),
				bedrock.codecs.Integer.encodePayload(category),
				bedrock.codecs.Integer.encodePayload(bid)
			]);
		}
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
		let previousResult: SearchResult<A> | undefined;
		if (bid != null) {
			let record = this.readRecord(bid);
			let tokens = this.tokenizeRecord(record);
			let rank = 0;
			previousResult = {
				bid,
				record,
				tokens,
				rank
			};
		}
		let queryTokens = Tokenizer.tokenize(query);
		let lastQueryToken = queryTokens.pop() ?? "";
		let relationship = previousResult != null ? ">" : ">=" as Relationship;
		let trees = [] as Array<RadixTree>;
		for (let queryToken of queryTokens) {
			let tree = this.tree.branch([
				bedrock.codecs.Boolean.encodePayload(false),
				bedrock.codecs.String.encodePayload(queryToken)
			]);
			if (tree == null) {
				return;
			}
			trees.push(tree);
		}
		let tree = this.tree.branch([
			bedrock.codecs.Boolean.encodePayload(true),
			bedrock.codecs.String.encodePayload(lastQueryToken)
		]);
		if (tree == null) {
			return;
		}
		trees.push(tree);
		while (true) {
			let keys = [] as Array<Uint8Array>;
			if (previousResult != null) {
				keys = [
					bedrock.codecs.Integer.encodePayload(previousResult.tokens.length),
					bedrock.codecs.Integer.encodePayload(previousResult.bid)
				];
			} else {
				keys = [
					bedrock.codecs.Integer.encodePayload(queryTokens.length + 1)
				];
			}
			let iterables = trees.map((tree) => tree.filter(relationship, keys));
			let iterators = iterables.map((iterable) => iterable[Symbol.iterator]());
			let results = [] as Array<SearchResult<A>>;
			for (let iterator of iterators) {
				let bid = iterator.next().value as number | undefined;
				if (bid == null) {
					return;
				}
				let record = this.readRecord(bid);
				let tokens = this.tokenizeRecord(record);
				let rank = 1;
				results.push({
					bid,
					record,
					tokens,
					rank
				});
			}
			results = results.sort(CompositeSorter.of(
				NumberSorter.increasing((entry) => entry.tokens.length),
				NumberSorter.increasing((entry) => entry.bid)
			));
			let minimumResult = results[0];
			let maximumResult = results[results.length - 1];
			previousResult = maximumResult;
			if (minimumResult.bid === maximumResult.bid) {
				let { bid, record, tokens } = { ...previousResult };
				let rank = this.computeRank(tokens, [...queryTokens, lastQueryToken]);
				yield {
					bid,
					record,
					tokens,
					rank
				};
				relationship = ">";
			} else {
				relationship = ">=";
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

	static * search<A extends Record>(searchIndexManagers: Array<SearchIndexManagerV2<A, Key<A>>>, query: string, bid?: number): Iterable<SearchResult<A>> {
		let iterables = searchIndexManagers.map((searchIndexManager) => searchIndexManager.search(query, bid));
		let iterators = iterables.map((iterable) => iterable[Symbol.iterator]());
		let searchResults = iterators.map((iterator) => iterator.next().value as SearchResult<A> | undefined);
		outer: while (true) {
			let candidates = searchResults
				.map((searchResult, index) => ({ searchResult, index }))
				.filter((candidate): candidate is { searchResult: SearchResult<A>, index: number } => candidate.searchResult != null)
				.sort((one, two) => {
					return one.searchResult.rank - two.searchResult.rank;
				});
			let candidate = candidates.pop();
			if (candidate == null) {
				break;
			}
			inner: for (let searchIndexManager of searchIndexManagers) {
				let rank = searchIndexManager.computeRecordRank(candidate.searchResult.record, query);
				if (rank != null && rank > candidate.searchResult.rank) {
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
	private searchIndexManagers: Array<SearchIndexManagerV1<A, Key<A>>>;

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

	constructor(blockManager: BlockManager, fields: Fields<A>, keys: [...B], orders: OrderMap<A>, table: Table, indexManagers: Array<IndexManager<A, Keys<A>>>, searchIndexManagers: Array<SearchIndexManagerV1<A, Key<A>>>) {
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
		filteredStores.push(new FilteredStore<any>(this.recordManager, this.blockManager, this.table, filters, orders, anchor));
		let filteredStore = FilteredStore.getOptimal(filteredStores);
		let iterable = StreamIterable.of(filteredStore)
		if (limit != null) {
			iterable = iterable.limit(limit);
		}
		return iterable.collect();
	}

	insert(record: A): void {
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
		let anchorBid = anchorKeysRecord != null ? this.lookupBlockIndex(anchorKeysRecord) : undefined;
		let iterable = StreamIterable.of(SearchIndexManagerV1.search(this.searchIndexManagers, query, anchorBid));
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
		let searchIndexManagers = searchIndices.map((index) => new SearchIndexManagerV1<A, Key<A>>(recordManager, blockManager, index.key));
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

export type WritableStoresFromStoreManagers<A extends StoreManagers<any>> = {
	[B in keyof A]: A[B] extends StoreManager<infer C, infer D> ? WritableStore<C, D> : never;
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

	index(that: Index<A>): void {
		for (let index of this.indices) {
			if (index.equals(that)) {
				return;
			}
		}
		this.indices.push(that);
	}
};

export type Stores<A> = {
	[B in keyof A]: A[B] extends Store<infer C, infer D> ? Store<C, D> : A[B];
};

export class OverridableWritableStore<A extends Record, B extends RequiredKeys<A>> implements WritableStore<A, B> {
	private storeManager: StoreManager<A, B>;
	private overrides: Partial<WritableStore<A, B>>;

	constructor(storeManager: StoreManager<A, B>, overrides: Partial<WritableStore<A, B>>) {
		this.storeManager = storeManager;
		this.overrides = overrides;
	}

	async filter(...parameters: Parameters<WritableStore<A, B>["filter"]>): ReturnType<WritableStore<A, B>["filter"]> {
		return this.overrides.filter?.(...parameters) ?? this.storeManager.filter(...parameters);
	}

	async insert(...parameters: Parameters<WritableStore<A, B>["insert"]>): ReturnType<WritableStore<A, B>["insert"]> {
		return this.overrides.insert?.(...parameters) ?? this.storeManager.insert(...parameters);
	}

	async length(...parameters: Parameters<WritableStore<A, B>["length"]>): ReturnType<WritableStore<A, B>["length"]> {
		return this.overrides.length?.(...parameters) ?? this.storeManager.length(...parameters);
	}

	async lookup(...parameters: Parameters<WritableStore<A, B>["lookup"]>): ReturnType<WritableStore<A, B>["lookup"]> {
		return this.overrides.lookup?.(...parameters) ?? this.storeManager.lookup(...parameters);
	}

	async remove(...parameters: Parameters<WritableStore<A, B>["remove"]>): ReturnType<WritableStore<A, B>["remove"]> {
		return this.overrides.remove?.(...parameters) ?? this.storeManager.remove(...parameters);
	}

	async search(...parameters: Parameters<WritableStore<A, B>["search"]>): ReturnType<WritableStore<A, B>["search"]> {
		return this.overrides.search?.(...parameters) ?? this.storeManager.search(...parameters).map((entry) => entry.record);
	}

	async update(...parameters: Parameters<WritableStore<A, B>["update"]>): ReturnType<WritableStore<A, B>["update"]> {
		return this.overrides.update?.(...parameters) ?? this.storeManager.update(...parameters);
	}

	async vacate(...parameters: Parameters<WritableStore<A, B>["vacate"]>): ReturnType<WritableStore<A, B>["vacate"]> {
		return this.overrides.vacate?.(...parameters) ?? this.storeManager.vacate(...parameters);
	}
};
