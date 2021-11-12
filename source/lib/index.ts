import * as autoguard from "@joelek/ts-autoguard";
import * as bedrock from "@joelek/bedrock";
import * as stdlib from "@joelek/ts-stdlib";
import * as storage from "./storage";
import * as guards from "./guards";
import * as keys from "./keys";
import * as is from "./is";
import * as collections from "./collections";
import { CompressedTrie } from "./collections";
import * as sorters from "./sorters";

export class Keys<A extends Record, B extends [...(keyof A)[]]> {
	private keys: [...B];

	constructor(keys: [...B]) {
		this.keys = keys;
	}

	getKeys(): [...B] {
		return this.keys;
	}
}

export abstract class Field<A extends Primitive> {
	constructor() {}

	abstract convertFrom(primitive: Primitive | undefined): A;

	abstract export(): guards.Field;

	abstract getCodec(): bedrock.codecs.Codec<A>;

	abstract getDefaultValue(): A;

	abstract getTokens(value: A): Array<string>;

	static create(serializedField: guards.Field): Field<any> {
		if (guards.BinaryField.is(serializedField)) {
			let field = new BinaryField();
			return serializedField.nullable ? new NullableField(field) : field;
		} else if (guards.BigIntField.is(serializedField)) {
			let field = new BigIntField();
			return serializedField.nullable ? new NullableField(field) : field;
		} else if (guards.BooleanField.is(serializedField)) {
			let field = new BooleanField();
			return serializedField.nullable ? new NullableField(field) : field;
		} else if (guards.NumberField.is(serializedField)) {
			let field = new NumberField();
			return serializedField.nullable ? new NullableField(field) : field;
		} else if (guards.StringField.is(serializedField)) {
			let field = new StringField({
				search: serializedField.search
			});
			return serializedField.nullable ? new NullableField(field) : field;
		}
		throw `Expected code to be unreachable!`;
	}
};

export class BinaryField extends Field<Uint8Array> {
	constructor() {
		super();
	}

	convertFrom(primitive: Primitive | undefined): Uint8Array {
		if (primitive instanceof Uint8Array) {
			return primitive;
		}
		return this.getDefaultValue();
	}

	export(): guards.BinaryField {
		return {
			type: "binary",
			nullable: false
		};
	}

	getCodec(): bedrock.codecs.Codec<Uint8Array> {
		return bedrock.codecs.Binary;
	}

	getDefaultValue(): Uint8Array {
		return Uint8Array.of();
	}

	getTokens(value: Uint8Array): Array<string> {
		return [];
	}
};

export class BigIntField extends Field<bigint> {
	constructor() {
		super();
	}

	convertFrom(primitive: Primitive | undefined): bigint {
		if (typeof primitive === "bigint") {
			return primitive;
		}
		return this.getDefaultValue();
	}

	export(): guards.BigIntField {
		return {
			type: "bigint",
			nullable: false
		};
	}

	getCodec(): bedrock.codecs.Codec<bigint> {
		return bedrock.codecs.BigInt;
	}

	getDefaultValue(): bigint {
		return 0n;
	}

	getTokens(value: bigint): Array<string> {
		return [];
	}
};

export class NumberField extends Field<number> {
	constructor() {
		super();
	}

	convertFrom(primitive: Primitive | undefined): number {
		if (typeof primitive === "number") {
			return primitive;
		}
		return this.getDefaultValue();
	}

	export(): guards.NumberField {
		return {
			type: "number",
			nullable: false
		};
	}

	getCodec(): bedrock.codecs.Codec<number> {
		return bedrock.codecs.Number;
	}

	getDefaultValue(): number {
		return 0;
	}

	getTokens(value: number): Array<string> {
		return [];
	}
};

export class BooleanField extends Field<boolean> {
	constructor() {
		super();
	}

	convertFrom(primitive: Primitive | undefined): boolean {
		if (typeof primitive === "boolean") {
			return primitive;
		}
		return this.getDefaultValue();
	}

	export(): guards.BooleanField {
		return {
			type: "boolean",
			nullable: false
		};
	}

	getCodec(): bedrock.codecs.Codec<boolean> {
		return bedrock.codecs.Boolean;
	}

	getDefaultValue(): boolean {
		return false;
	}

	getTokens(value: boolean): Array<string> {
		return [];
	}
};

export type StringFieldOptions = {
	search?: boolean;
};

export class StringField extends Field<string> {
	private search?: boolean;

	constructor(options?: StringFieldOptions) {
		super();
		this.search = options?.search;
	}

	convertFrom(primitive: Primitive | undefined): string {
		if (typeof primitive === "string") {
			return primitive;
		}
		return this.getDefaultValue();
	}

	export(): guards.StringField {
		return {
			type: "string",
			nullable: false,
			search: this.search
		};
	}

	getCodec(): bedrock.codecs.Codec<string> {
		return bedrock.codecs.String;
	}

	getDefaultValue(): string {
		return "";
	}

	getTokens(value: string): Array<string> {
		if (this.search) {
			let normalized = value;
			normalized = normalized.toLowerCase();
			normalized = normalized.normalize("NFC");
			normalized = normalized.replace(/['"`´]+/g, "");
			let tokens = Array.from(normalized.match(/(\p{L}+|\p{N}+)/gu) ?? []);
			return tokens;
		} else {
			return [];
		}
	}
};

export class NullableField<A extends Primitive> extends Field<A | null> {
	private field: Field<A>;

	constructor(field: Field<A>) {
		super();
		this.field = field;
	}

	convertFrom(primitive: Primitive | undefined): A | null {
		if (primitive === null) {
			return primitive;
		}
		return this.field.getDefaultValue();
	}

	export(): guards.Field {
		return {
			...this.field.export(),
			nullable: true
		};
	}

	getCodec(): bedrock.codecs.Codec<A | null> {
		return bedrock.codecs.Union.of(this.field.getCodec(), bedrock.codecs.Null);
	}

	getDefaultValue(): A | null {
		return null;
	}

	getTokens(value: A | null): Array<string> {
		return value === null ? [] : this.field.getTokens(value);
	}
};

export type Primitive = Uint8Array | bigint | boolean | null | number | string;

export type Record = globalThis.Record<string, Primitive>;

export type Fields<A extends Record> = {
	[B in keyof A]: Field<A[B]>;
};













export abstract class Order<A extends Primitive> {
	constructor() {}

	abstract getDirection(): collections.Direction;
};

export class IncreasingOrder<A extends Primitive> extends Order<A> {
	constructor() {
		super();
	}

	getDirection(): collections.Direction {
		return "increasing";
	}
}

export class DecreasingOrder<A extends Primitive> extends Order<A> {
	constructor() {
		super();
	}

	getDirection(): collections.Direction {
		return "decreasing";
	}
}

export type OrderMap<A extends Record> = {
	[C in keyof A]?: Order<A[C]>;
};


export abstract class Operator<A extends Primitive> {
	constructor() {}
};

export class EqualityOperator<A extends Primitive> extends Operator<A> {
	constructor() {
		super();
	}
}

export type OperatorMap<A extends Record> = {
	[C in keyof A]?: Operator<A[C]>;
};







export abstract class Filter<A extends Primitive> {
	constructor() {}

	abstract matches(value: A): boolean;
};

export class EqualityFilter<A extends Primitive> extends Filter<A> {
	private value: A;

	constructor(value: A) {
		super();
		this.value = value;
	}

	getValue(): A {
		return this.value;
	}

	matches(value: A): boolean {
		// TODO: Pass encoded value.
		let one = bedrock.codecs.Any.encodePayload(this.value);
		let two = bedrock.codecs.Any.encodePayload(value);
		return bedrock.utils.Chunk.comparePrefixes(one, two) === 0;
	}
};

export type FilterMap<A extends Record> = {
	[C in keyof A]?: Filter<A[C]>;
};










export interface StoreEntry<A extends Record, B extends [keyof A, ...(keyof A)[]]> {
	block(): number;
	value(): A;
};

export type PrimaryKeyFields<A extends Record> = [keyof A, ...(keyof A)[]];
export type KeyFields<A extends Record> = [...(keyof A)[]];

export type StoreEventMap<A extends Record, B extends [keyof A, ...(keyof A)[]]> = {
	"insert": {
		index: number,
		next: A
	},
	"remove": {
		index: number,
		last: A
	},
	"update": {
		index: number,
		last: A,
		next: A
	}
};

export type Constraint<A extends Record> = (record: A) => void;

export type PrimaryKey<A extends Record, A_PK extends PrimaryKeyFields<A>> = A | Pick<A, A_PK[number]>;

export type FilterOptions<A extends Record, A_PK extends PrimaryKeyFields<A>> = {
	anchor?: PrimaryKey<A, A_PK>,
	offset?: number,
	length?: number
};

export type SearchOptions<A extends Record, A_PK extends PrimaryKeyFields<A>> = {
	anchor?: PrimaryKey<A, A_PK>
};

export type SearchResult<A extends Record, A_PK extends PrimaryKeyFields<A>> = {
	block(): number;
	order(): number;
	value(): A;
};

export interface Store<A extends Record, A_PK extends PrimaryKeyFields<A>> {
	filter(filters?: FilterMap<A>, order?: OrderMap<A>, options?: FilterOptions<A, A_PK>): Iterable<StoreEntry<A, A_PK>>;
	insert(next: A): void;
	length(): number;
	debug(): void;
	lookup(pk: PrimaryKey<A, A_PK>): A;
	remove(pk: PrimaryKey<A, A_PK>): void;
	search(query: string, options?: SearchOptions<A, A_PK>): Iterable<SearchResult<A, A_PK>>;
	update(next: A): void;
};

export type IndexEntry<A extends Record> = { keys: Array<keyof A>, blockIndex: number, tree: collections.CompressedTrie };

export class StoreHandler<A extends Record, A_PK extends PrimaryKeyFields<A>> extends stdlib.routing.MessageRouter<StoreEventMap<A, A_PK>> implements Store<A, A_PK> {
	public blockHandler: storage.BlockHandler;
	public blockIndex: number;
	public searchBlockIndex: number;
	public collection: collections.CompressedTrie;
	public searchTree: collections.CompressedTrie;
	private constraints: Array<Constraint<A>>;
	private name: string;
	public fields: Fields<A>;
	private keys: Keys<A, A_PK>;
	public indices: Array<IndexEntry<A>>;

	debug(): void {
		this.collection.debug();
	}

	private tokenizeRecord(record: A): Array<string> {
		let set = new Set<string>();
		for (let key in this.fields) {
			let field = this.fields[key];
			let value = record[key];
			let tokens = field.getTokens(value);
			for (let token of tokens) {
				set.add(token);
			}
		}
		return Array.from(set);
	}

	getKey(record: A, keys: Array<keyof A>): keys.Key {
		return keys.map((key) => {
			return Buffer.from(bedrock.codecs.Any.encodePayload(record[key]));
		});
	}

	private getPrimaryKey(pk: Pick<A, A_PK[number]>): keys.Key {
		return this.keys.getKeys().map((keyField) => {
			let value = pk[keyField];
			return Buffer.from(this.fields[keyField].getCodec().encodePayload(value instanceof Buffer ? Uint8Array.from(value) as A[A_PK[number]] : value));
		});
	}

	private decodeRecord(buffer: Uint8Array): A {
		let parser = new bedrock.utils.Parser(buffer);
		let record = {} as A;
		let keys = Object.keys(this.fields).sort() as Array<keyof A>;
		for (let key of keys) {
			let field = this.fields[key];
			let value = field.getCodec().decode(parser);
			record[key] = value;
		}
		return record;
	}

	private encodeRecord(record: A): Uint8Array {
		let buffers = new Array<Uint8Array>();
		let keys = Object.keys(this.fields).sort() as Array<keyof A>;
		for (let key of keys) {
			let field = this.fields[key];
			let value = record[key];
			let buffer = field.getCodec().encode(value);
			buffers.push(buffer);
		}
		let buffer = bedrock.utils.Chunk.concat(buffers);
		return buffer;
	}

	private getDirectionsFromOrders(orders?: OrderMap<A>): Array<collections.Direction> {
		let directions = [] as Array<collections.Direction>;
		for (let key in orders) {
			let order = orders[key];
			if (order == null) {
				continue;
			}
			directions.push(order.getDirection());
		}
		return directions;
	}

	constructor(blockHandler: storage.BlockHandler, blockIndex: number, searchBlockIndex: number, name: string, fields: Fields<A>, keys: Keys<A, A_PK>) {
		super();
		this.blockHandler = blockHandler;
		this.blockIndex = blockIndex;
		this.searchBlockIndex = searchBlockIndex;
		this.collection = new CompressedTrie(this.blockHandler, this.blockIndex);
		this.searchTree = new CompressedTrie(this.blockHandler, this.searchBlockIndex);
		this.constraints = [];
		this.name = name;
		this.fields = fields;
		this.keys = keys;
		this.indices = [];
	}

	allocateStorage(storage: storage.BlockHandler): void {
		this.blockHandler = storage;
		this.blockIndex = storage.createBlock(CompressedTrie.INITIAL_SIZE);
		this.searchBlockIndex = storage.createBlock(CompressedTrie.INITIAL_SIZE);
		this.collection = new CompressedTrie(this.blockHandler, this.blockIndex);
		this.searchTree = new CompressedTrie(this.blockHandler, this.searchBlockIndex);
		for (let entry of this.indices) {
			entry.blockIndex = storage.createBlock(CompressedTrie.INITIAL_SIZE);
			entry.tree = new CompressedTrie(this.blockHandler, entry.blockIndex);
		}
	}

	createIndex<I extends KeyFields<A>>(keys: [...I]): void {
		let entry = this.indices.find((index) => index.keys.join(":") === [...keys, ...this.keys.getKeys()].join(":"));
		if (entry != null) {
			return;
		}
		let blockIndex = this.blockHandler.createBlock(32);
		let tree = new CompressedTrie(this.blockHandler, blockIndex);
		entry = {
			keys: [...keys, ...this.keys.getKeys()],
			blockIndex: blockIndex,
			tree: tree
		};
		this.indices.push(entry);
	}

	addConstraint(constraint: Constraint<A>): void {
		this.constraints.push(constraint);
	}

	removeConstraint(constraint: Constraint<A>): void {
		let index = this.constraints.lastIndexOf(constraint);
		if (index >= 0) {
			this.constraints.splice(index, 1);
		}
	}

	export(): guards.Store {
		let fields = {} as { [key: string]: guards.Field };
		for (let key in this.fields) {
			let field = this.fields[key];
			fields[key] = field.export();
		}
		let indices = {} as { [key: string]: guards.Index };
		for (let index of this.indices) {
			indices[index.keys.join(":")] = {
				block: index.blockIndex,
				keys: index.keys as string[]
			};
		}
		return {
			block: this.blockIndex,
			search: this.searchBlockIndex,
			fields: fields,
			keys: this.keys.getKeys() as string[],
			indices: indices
		};
	}

	getName(): string {
		return this.name;
	}

	* filter(filters?: FilterMap<A>, orders?: OrderMap<A>, options?: FilterOptions<A, A_PK>): Iterable<StoreEntry<A, A_PK>> {
		filters = { ...filters } as FilterMap<A>;
		let candidates = [] as {
			filtersRemaining: FilterMap<A>,
			ordersRemaining: OrderMap<A>,
			keysConsumed: (keyof A)[],
			keysRemaining: (keyof A)[],
			tree: CompressedTrie,
			isPipelined: boolean,
			filterCount: number,
			branchTotal: number
		}[];
		outer: for (let index of [{ keys: this.keys.getKeys(), tree: this.collection }, ...this.indices]) {
			let filtersRemaining = { ...filters } as FilterMap<A>;
			let ordersRemaining = { ...orders } as OrderMap<A>;
			let keysConsumed = [] as Array<keyof A>;
			let keysRemaining = [...index.keys];
			let tree = index.tree;
			inner: for (let indexKey of index.keys) {
				let filter = filtersRemaining[indexKey];
				if (is.absent(filter)) {
					break;
				}
				if (filter instanceof EqualityFilter) {
					let key = bedrock.codecs.Any.encodePayload(filter.getValue());
					let branch = tree.branch([Buffer.from(key)]);
					if (is.absent(branch)) {
						return;
					}
					delete filtersRemaining[indexKey];
					keysConsumed.push(keysRemaining.shift() as keyof A);
					tree = branch;
					continue inner;
				}
				break;
			}
			let orderKeys = Object.keys(orders ?? {}) as (keyof A)[];
			for (let i = 0; i < orderKeys.length; i++) {
				if (keysRemaining[i] !== orderKeys[i]) {
					break;
				}
				delete ordersRemaining[orderKeys[i]];
			}
			let branchTotal = tree.length();
			let isPipelined = Object.entries(ordersRemaining).length === 0 || branchTotal <= 1;
			let filterCount = Object.entries(filtersRemaining).length;
			candidates.push({
				filtersRemaining,
				ordersRemaining,
				keysConsumed,
				keysRemaining,
				tree,
				isPipelined,
				filterCount,
				branchTotal
			});
		}
		candidates.sort(sorters.CombinedSort.of(
			sorters.CustomSort.increasing((value) => value.isPipelined),
			sorters.NumericSort.decreasing((value) => value.filterCount),
			sorters.NumericSort.decreasing((value) => value.branchTotal)
		));
		let candidate = candidates.pop();
		if (is.absent(candidate)) {
			throw `Expected an index!`;
		}
/* console.log(candidate);
candidate.tree.debug() */
		let anchorPk = options?.anchor;
		let anchorKey: keys.Key | undefined;
		if (is.present(anchorPk)) {
			try {
				let record = this.lookup(anchorPk);
				let buffers = [] as Array<Buffer>;
				for (let key of candidate.keysRemaining) {
					let field = record[key];
					let buffer = this.fields[key].getCodec().encodePayload(field instanceof Buffer ? Uint8Array.from(field) as A[keyof A] : field);
					buffers.push(Buffer.from(buffer));
				}
				anchorKey = buffers;
			} catch (error) {}
		}
		let branch = candidate.tree;
		let entries = branch.search([], "^=", {
			directions: this.getDirectionsFromOrders(orders),
			anchor: anchorKey,
			offset: options?.offset, // This won't work with filters remaining.
			length: options?.length
		});
		outer: for (let entry of entries) {
			let block = entry.value();
			let record = this.decodeRecord(Uint8Array.from(this.blockHandler.readBlock(block)));
			inner: for (let key in filters) {
				let filter = filters[key];
				if (filter == null) {
					continue inner;
				}
				let value = record[key];
				if (!filter.matches(value)) {
					continue outer;
				}
			}
			yield {
				block: () => block,
				value: () => record
			};
		}
	}

	insert(next: A): void {
		for (let constraint of this.constraints) {
			constraint(next);
		}
		let key = this.getPrimaryKey(next);
		let buffer = this.encodeRecord(next);
		let index = this.collection.lookup(key);
		if (is.absent(index)) {
			index = this.blockHandler.createBlock(buffer.length);
			this.blockHandler.writeBlock(index, Buffer.from(buffer));
			this.collection.insert(key, index);
			{
				let tokens = this.tokenizeRecord(next);
				let tokensKey = Buffer.from(bedrock.codecs.Number.encodePayload(tokens.length));
				for (let token of tokens) {
					let tokenKey = Buffer.from(bedrock.codecs.String.encodePayload(token));
					this.searchTree.insert([tokenKey, tokensKey, ...key], index);
				}
			}
			this.route("insert", {
				index,
				next
			});
		} else {
			let last = this.decodeRecord(this.blockHandler.readBlock(index));
			this.blockHandler.resizeBlock(index, buffer.length);
			this.blockHandler.writeBlock(index, Buffer.from(buffer));
			{
				let tokens = this.tokenizeRecord(last);
				let tokensKey = Buffer.from(bedrock.codecs.Number.encodePayload(tokens.length));
				for (let token of tokens) {
					let tokenKey = Buffer.from(bedrock.codecs.String.encodePayload(token));
					this.searchTree.remove([tokenKey, tokensKey, ...key]);
				}
			}
			{
				let tokens = this.tokenizeRecord(next);
				let tokensKey = Buffer.from(bedrock.codecs.Number.encodePayload(tokens.length));
				for (let token of tokens) {
					let tokenKey = Buffer.from(bedrock.codecs.String.encodePayload(token));
					this.searchTree.insert([tokenKey, tokensKey, ...key], index);
				}
			}
			this.route("update", {
				index,
				last,
				next
			});
		}
		for (let entry of this.indices) {
			let key = this.getKey(next, entry.keys);
			entry.tree.insert(key, index);
		}
	}

	length(): number {
		return this.collection.length();
	}

	lookup(pk: PrimaryKey<A, A_PK>): A {
		let key = this.getPrimaryKey(pk);
		let index = this.collection.lookup(key);
		if (is.present(index)) {
			let buffer = this.blockHandler.readBlock(index);
			let record = this.decodeRecord(buffer);
			return record;
		}
		throw `Expected a record for key ${pk}!`;
	}

	remove(pk: PrimaryKey<A, A_PK>): void {
		let key = this.getPrimaryKey(pk);
		let index = this.collection.lookup(key);
		if (is.present(index)) {
			let last = this.decodeRecord(this.blockHandler.readBlock(index));
			this.collection.remove(key);
			this.blockHandler.deleteBlock(index);
			{
				let tokens = this.tokenizeRecord(last);
				let tokensKey = Buffer.from(bedrock.codecs.Number.encodePayload(tokens.length));
				for (let token of tokens) {
					let tokenKey = Buffer.from(bedrock.codecs.String.encodePayload(token));
					this.searchTree.remove([tokenKey, tokensKey, ...key]);
				}
			}
			this.route("remove", {
				index,
				last
			});
			for (let entry of this.indices) {
				let key = this.getKey(last, entry.keys);
				entry.tree.remove(key);
			}
		}
	}

	// TODO: Treat last token as a prefix token.
	* search(query: string, options?: SearchOptions<A, A_PK>): Iterable<SearchResult<A, A_PK>> {
		let anchor = options?.anchor;
		let tokens = tokenize(query);
		if (tokens.length === 0) {
			return;
		}
		let roots = [] as Array<collections.CompressedTrie>;
		for (let token of tokens) {
			let key = [Buffer.from(bedrock.codecs.String.encodePayload(token))];
			let root = this.searchTree.branch(key);
			if (is.absent(root) || root.length() === 0) {
				return;
			}
			roots.push(root);
		}
		let last: A | undefined;
		let branch = tokens.length;
		if (is.present(anchor)) {
			last = this.lookup(anchor);
			let tokens = this.tokenizeRecord(last);
			if (tokens.length < branch) {
				throw `Expected anchor to be in range of results!`;
			}
			branch = tokens.length;
		}
		let maxBranch = tokens.length + 5; // TODO: Improve.
		outer: for (; branch < maxBranch; branch++) {
			let rank = branch - tokens.length; // TODO: Improve.
			let branches = [] as Array<collections.CompressedTrie>;
			{
				let key = [Buffer.from(bedrock.codecs.Number.encodePayload(branch))];
				for (let root of roots) {
					let branch = root.branch(key);
					if (is.absent(branch) || branch.length() === 0) {
						continue outer;
					}
					branches.push(branch);
				};
			}
			let iterators = [] as Array<Iterator<collections.Entry<number>, collections.Entry<number>>>;
			{
				let key = is.present(last) ? this.getPrimaryKey(last) : [Buffer.of()];
				for (let branch of branches) {
					let result = branch.search(key, ">");
					if (result.total() === 0) {
						continue outer;
					}
					iterators.push(result[Symbol.iterator]());
				}
			}
			let entries = [] as collections.Entry<number>[];
			while (true) {
				{
					for (let [index, iterator] of iterators.entries()) {
						let entry = entries[index];
						if (is.absent(entry)) {
							entry = iterator.next().value;
							if (is.absent(entry)) {
								continue outer;
							}
							entries[index] = entry;
						}
					}
				}
				let max = entries[0].key();
				for (let entry of entries) {
					let key = entry.key();
					if (keys.compareKey(key, max) > 0) {
						max = key;
					}
				}
				let equal = true;
				for (let [index, entry] of entries.entries()) {
					let key = entry.key();
					if (keys.compareKey(key, max) < 0) {
						let result = branches[index].search(max, ">=");
						if (result.total() === 0) {
							continue outer;
						}
						let iterator = result[Symbol.iterator]();
						iterators[index] = iterator;
						entry = iterator.next().value;
						if (is.absent(entry)) {
							continue outer;
						}
						entries[index] = entry;
						equal = false;
					}
				}
				if (equal) {
					let block = entries[0].value();
					let record = this.decodeRecord(Uint8Array.from(this.blockHandler.readBlock(block)));
					yield {
						block: () => block,
						order: () => rank,
						value: () => ({ ...record })
					};
					entries[0] = undefined as any;
				}
			}
		}
	}

	update(next: A): void {
		this.insert(next);
	}
};

function tokenize(value: string): Array<string> {
	let normalized = String(value);
	normalized = normalized.toLowerCase();
	normalized = normalized.normalize("NFC");
	normalized = normalized.replace(/['"`´]+/g, "");
	return Array.from(normalized.match(/(\p{L}+|\p{N}+)/gu) ?? []);
};

type KeysMap<A extends Record, A_PK extends (keyof A)[], C extends Record, C_PK extends (keyof C)[]> = {
	[E in A_PK[number]]: {
		[F in keyof C]: A[E] extends C[F] ? F : never;
	}[keyof C];
};

export interface Link<A extends Record, A_PK extends PrimaryKeyFields<A>, C extends Record, C_PK extends PrimaryKeyFields<C>> {
	lookup(pk: PrimaryKey<A, A_PK>): Iterable<StoreEntry<C, C_PK>>;
};

export class LinkHandler<A extends Record, A_PK extends PrimaryKeyFields<A>, C extends Record, C_PK extends PrimaryKeyFields<C>> implements Link<A, A_PK, C, C_PK> {
	private one: StoreHandler<A, A_PK>;
	private two: StoreHandler<C, C_PK>;
	private keysMap: KeysMap<A, A_PK, C, C_PK>;
	private order?: OrderMap<C>;

	private onRemove: stdlib.routing.MessageObserver<StoreEventMap<A, A_PK>["remove"]> = (message) => {
		for (let entry of this.lookup(message.last)) {
			this.two.remove(entry.value()); // TODO: May break iteration through index.
		}
	};

	private constraint: Constraint<C> = (record) => {
		let pk = {} as PrimaryKey<A, A_PK>;
		for (let key in this.keysMap) {
			let keyOne = key as A_PK[number];
			let keyTwo = this.keysMap[keyOne];
			pk[keyOne] = record[keyTwo] as any;
		}
		this.one.lookup(pk);
	};

	 activate(): void {
		this.one.addObserver("remove", this.onRemove); // Only listener used. Not deferred. Executed directly.
		this.two.addConstraint(this.constraint);
	}

	 deactivate(): void {
		this.one.removeObserver("remove", this.onRemove);
		this.two.removeConstraint(this.constraint);
	}

	constructor(one: StoreHandler<A, A_PK>, two: StoreHandler<C, C_PK>, keysMap: KeysMap<A, A_PK, C, C_PK>, order?: OrderMap<C>) {
		this.one = one;
		this.two = two;
		this.keysMap = keysMap;
		this.order = order;
		this.activate();
	}

	export(): guards.Link {
		return {
			parent: this.one.getName(),
			child: this.two.getName(),
			keys: this.keysMap as any
		};
	}

	lookup(pk: PrimaryKey<A, A_PK>, options?: FilterOptions<C, C_PK>): Iterable<StoreEntry<C, C_PK>> {
		let filters = {} as FilterMap<C>;
		for (let key in this.keysMap) {
			let keyOne = key as A_PK[number];
			let keyTwo = this.keysMap[keyOne];
			filters[keyTwo] = new EqualityFilter(pk[keyOne]) as any;
		}
		return this.two.filter(filters, this.order, options);
	}
};

export function getIndexIdentifier<A extends Record, A_PK extends [keyof A, ...(keyof A)[]], I extends (keyof A)[]>(store: StoreHandler<A, A_PK>, keys: [...I]): string {
	return [getStoreIdentifier(store), ...keys].join(":");
};

export function getLinkIdentifier<A extends Record, A_PK extends [keyof A, ...(keyof A)[]], C extends Record, C_PK extends [keyof C, ...(keyof C)[]]>(one: StoreHandler<A, A_PK>, two: StoreHandler<C, C_PK>, keysMap: KeysMap<A, A_PK, C, C_PK>): string {
	let parts = [] as Array<string>;
	parts.push(one.getName());
	for (let key in keysMap) {
		parts.push(key);
	}
	parts.push(two.getName());
	for (let key in keysMap) {
		parts.push(keysMap[key as A_PK[number]] as any);
	}
	return parts.join(":");
};

export function getStoreIdentifier<A extends Record, A_PK extends [keyof A, ...(keyof A)[]]>(store: StoreHandler<A, A_PK>): string {
	return store.getName();
};

export class Context {
	private blockHandler: storage.BlockHandler;
	private stores: { [key: string]: StoreHandler<any, any> };
	private links: { [key: string]: LinkHandler<any, any, any, any> };

	private export(): guards.Database {
		let json: guards.Database = {
			stores: {},
			links: {}
		};
		for (let key in this.stores) {
			json.stores[key] = this.stores[key].export();
		}
		for (let key in this.links) {
			json.links[key] = this.links[key].export();
		}
		return json;
	}

	constructor() {
		this.blockHandler = new storage.InMemoryBlockHandler();
		this.stores = {};
		this.links = {};
	}

	createEqualityOperator<A extends Primitive>(): EqualityOperator<A> {
		return new EqualityOperator();
	}

	createEqualityFilter<A extends Primitive>(value: A): EqualityFilter<A> {
		return new EqualityFilter(value);
	}

	createIncreasingOrder<A extends Primitive>(): IncreasingOrder<A> {
		return new IncreasingOrder();
	}

	createDecreasingOrder<A extends Primitive>(): DecreasingOrder<A> {
		return new DecreasingOrder();
	}

	createBinaryField(): BinaryField {
		return new BinaryField();
	}

	createBooleanField(): BooleanField {
		return new BooleanField();
	}

	createBigIntField(): BigIntField {
		return new BigIntField();
	}

	createNumberField(): NumberField {
		return new NumberField();
	}

	createStringField(options?: StringFieldOptions): StringField {
		return new StringField(options);
	}

	createNullableField<A extends Primitive>(field: Field<A>): NullableField<A> {
		return new NullableField(field);
	}

	createConstraint<A extends Record, A_PK extends PrimaryKeyFields<A>>(store: Store<A, A_PK>, constraint: Constraint<A>): void {
		if (!(store instanceof StoreHandler)) {
			throw `Expected store!`;
		}
		store.addConstraint(constraint);
	}

	createIndex<A extends Record, A_PK extends PrimaryKeyFields<A>, I extends KeyFields<A>>(store: Store<A, A_PK>, keys: [...I]): void {
		if (!(store instanceof StoreHandler)) {
			throw `Expected store!`;
		}
		(store as StoreHandler<A, A_PK>).createIndex(keys);
	}

	createLink<
		A extends Record,
		A_PK extends [keyof A, ...(keyof A)[]],
		C extends Record,
		C_PK extends [keyof C, ...(keyof C)[]]
	>(
		one: Store<A, A_PK>,
		two: Store<C, C_PK>,
		keysMap: KeysMap<A, A_PK, C, C_PK>,
		order?: OrderMap<C>
	): Link<A, A_PK, C, C_PK> {
		if (!(one instanceof StoreHandler)) {
			throw `Expected store!`;
		}
		if (!(two instanceof StoreHandler)) {
			throw `Expected store!`;
		}
		let name = getLinkIdentifier(one, two, keysMap);
		let link = this.links[name] as LinkHandler<A, A_PK, C, C_PK>;
		if (link != null) {
			throw `Expected link name "${name}" to be available!"`;
		}
		link = new LinkHandler(one, two, keysMap, order);
		this.links[name] = link;
		let keys = [] as [...(keyof C)[]];
		for (let key in keysMap) {
			let keyOne = key as keyof A;
			let value = keysMap[keyOne];
			keys.push(value);
		}
		for (let key in order) {
			keys.push(key);
		}
		this.createIndex(two, keys);
		return link;
	}

	createQuery<A extends Record, A_PK extends PrimaryKeyFields<A>>(
		store: Store<A, A_PK>,
		operators: OperatorMap<A>,
		order: OrderMap<A>
	): void {

	}

	createStore<A extends Record, A_PK extends [keyof A, ...(keyof A)[]]>(
		name: string,
		fields: Fields<A>,
		keys: [...A_PK]
	): Store<A, A_PK> {
		let store = this.stores[name] as StoreHandler<A, A_PK>;
		if (store != null) {
			throw `Expected store name "${name}" to be available!`;
		}
		let blockIndex = this.blockHandler.createBlock(32);
		let searchBlockIndex = this.blockHandler.createBlock(32);
		store = new StoreHandler<A, A_PK>(this.blockHandler, blockIndex, searchBlockIndex, name, fields, new Keys(keys));
		this.stores[name] = store;
		return store;
	}

	useStorage(storage: storage.BlockHandler): void {
		let guard = guards.Database as autoguard.serialization.MessageGuardBase<guards.Database>;
		storage.discardTransaction();
		let rootBlock = storage.getRootBlock();
		if (is.absent(rootBlock)) {
			rootBlock = storage.createBlock(1024);
			for (let storeKey in this.stores) {
				let store = this.stores[storeKey];
				console.log(`Creating store "${storeKey}"...`);
				store.allocateStorage(storage);
			}
		} else {
			let recreated = [] as Array<string>;
			for (let linkKey in this.links) {
				let link = this.links[linkKey];
				link.deactivate();
			}
			let oldDatabase = guard.decode(autoguard.codecs.bedrock.CODEC, Uint8Array.from(storage.readBlock(rootBlock)));
			let newDatabase = this.export();
			for (let storeKey in oldDatabase.stores) {
				let oldStore = oldDatabase.stores[storeKey] as guards.Store;
				let newStore = newDatabase.stores[storeKey];
				let oldFields = {} as Fields<Record>;
				for (let fieldKey in oldStore.fields) {
					let field = oldStore.fields[fieldKey] as guards.Field;
					oldFields[fieldKey] = Field.create(field);
				}
				let oldStoreHandler = new StoreHandler(storage, oldStore.block, oldStore.search, "", oldFields, new Keys(oldStore.keys) as any);
				if (is.absent(newStore)) {
					console.log(`Removing store "${storeKey}"...`);
					for (let entry of oldStoreHandler.filter()) {
						console.log(`Removing record ${entry.block()}...`);
						this.blockHandler.deleteBlock(entry.block());
					}
					for (let indexKey in oldStore.indices) {
						let oldIndex = oldStore.indices[indexKey] as guards.Index;
						console.log(`Removing index "${indexKey}"...`);
						new CompressedTrie(storage, oldIndex.block).delete();
					}
					new CompressedTrie(storage, oldStore.block).delete();
					new CompressedTrie(storage, oldStore.search).delete();
				} else {
					console.log(`Updating store "${storeKey}"...`);
					let recreate = false;
					if (newStore.keys.join(":") !== oldStore.keys.join(":")) {
						console.log(`Primary key changed.`);
						recreate = true;
					} else {
						for (let fieldKey in newStore.fields) {
							let newField = newStore.fields[fieldKey] as guards.Field;
							let oldField = oldStore.fields[fieldKey];
							if (is.absent(oldField)) {
								console.log(`Field "${fieldKey}" was added.`);
								recreate = true;
							} else {
								if (newField.type !== oldField.type) {
									console.log(`Field "${fieldKey}" changed type.`);
									recreate = true;
								} else if (!newField.nullable && oldField.nullable) {
									console.log(`Field "${fieldKey}" was made non-nullable.`);
									recreate = true;
								} else if (!(newField as any).search && (oldField as any).search) {
									console.log(`Field "${fieldKey}" was excluded from search index.`);
									recreate = true;
								} else if ((newField as any).search && !(oldField as any).search) {
									console.log(`Field "${fieldKey}" was included in search index.`);
									recreate = true;
								}
							}
						}
						for (let fieldKey in oldStore.fields) {
							let newField = newStore.fields[fieldKey];
							if (is.absent(newField)) {
								console.log(`Field "${fieldKey}" was removed.`);
								recreate = true;
							}
						}
					}
					if (recreate) {
						this.stores[storeKey].allocateStorage(storage);
						for (let storeEntry of oldStoreHandler.filter()) {
							console.log(`Inserting record into store...`);
							let next = {} as Record;
							let last = storeEntry.value();
							for (let fieldKey in newStore.fields) {
								let newField = this.stores[storeKey].fields[fieldKey];
								next[fieldKey] = newField.convertFrom(last[fieldKey]);
							}
							this.stores[storeKey].insert(next);
							storage.deleteBlock(storeEntry.block());
						}
						oldStoreHandler.collection.delete();
						oldStoreHandler.searchTree.delete();
						for (let indexKey in oldStore.indices) {
							let oldIndex = oldStore.indices[indexKey] as guards.Index;
							new CompressedTrie(storage, oldIndex.block).delete();
						}
						recreated.push(storeKey);
					} else {
						this.stores[storeKey].blockHandler = storage;
						this.stores[storeKey].blockIndex = oldStore.block;
						this.stores[storeKey].searchBlockIndex = oldStore.search;
						this.stores[storeKey].collection = new CompressedTrie(storage, oldStore.block);
						this.stores[storeKey].searchTree = new CompressedTrie(storage, oldStore.search);
						for (let indexKey in oldStore.indices) {
							let oldIndex = oldStore.indices[indexKey] as guards.Index;
							let newIndex = newStore.indices[indexKey];
							if (is.absent(newIndex)) {
								console.log(`Removing index "${indexKey}"...`);
								new CompressedTrie(storage, oldIndex.block).delete();
							}
						}
						for (let indexKey in newStore.indices) {
							let newIndex = newStore.indices[indexKey] as guards.Index;
							let oldIndex = oldStore.indices[indexKey];
							let entry = this.stores[storeKey].indices.find((index) => {
								return index.keys.join(":") === indexKey;
							});
							if (is.absent(entry)) {
								throw `Expected index entry!`;
							}
							if (is.absent(oldIndex)) {
								console.log(`Creating index "${indexKey}"...`);
								entry.blockIndex = storage.createBlock(CompressedTrie.INITIAL_SIZE);
								entry.tree = new CompressedTrie(storage, entry.blockIndex);
								for (let storeEntry of oldStoreHandler.filter()) {
									console.log(`Inserting ${storeEntry.block()} into index...`);
									let key = oldStoreHandler.getKey(storeEntry.value(), newIndex.keys);
									entry.tree.insert(key, storeEntry.block());
								}
							} else {
								console.log(`Re-using index "${indexKey}"...`);
								entry.blockIndex = oldIndex.block;
								entry.tree = new CompressedTrie(storage, oldIndex.block);
							}
						}
					}
				}
			}
			for (let storeKey in newDatabase.stores) {
				let oldStore = oldDatabase.stores[storeKey];
				if (is.absent(oldStore)) {
					console.log(`Creating store "${storeKey}"...`);
					this.stores[storeKey].allocateStorage(storage);
				}
			}
			for (let linkKey in this.links) {
				let link = this.links[linkKey];
				link.activate();
			}
			for (let storKey of recreated) {
				let store = this.stores[storKey];
				for (let f of store.filter()) {
					try {
						store.insert(f.value());
					} catch (error) {
						store.remove(f.value());
					}
				}
			}
		}
		let json = this.export();
		let buffer = guard.encode(autoguard.codecs.bedrock.CODEC, json);
		storage.resizeBlock(rootBlock, buffer.length);
		storage.writeBlock(rootBlock, Buffer.from(buffer));
		storage.commitTransaction();
	}

	createPersistentStorage(path: string): storage.DiskBlockHandler {
		return new storage.DiskBlockHandler(path);
	}

	createVolatileStorage(): storage.InMemoryBlockHandler {
		return new storage.InMemoryBlockHandler();
	}
};

export function createContext(): Context {
	return new Context();
};
