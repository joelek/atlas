import * as bedrock from "@joelek/bedrock";
import * as asserts from "../mod/asserts";
import { DEBUG } from "./variables";

export type Encoding = "hex" | "base64" | "base64url" | "binary" | "utf-8";

export type Endian = "big" | "little";

export class Binary {
	private constructor() {}

	static string(buffer: Uint8Array, offset: number, length: number, encoding: Encoding, value?: string): string {
		if (DEBUG) asserts.IntegerAssert.between(0, offset, buffer.byteLength - 1);
		if (DEBUG) asserts.IntegerAssert.between(0, length, buffer.byteLength - offset);
		if (value == null) {
			let subarray = buffer.subarray(offset, offset + length);
			let value = bedrock.utils.Chunk.toString(subarray, encoding).replace(/[\0]*$/g, "");
			return value;
		} else {
			let encoded = bedrock.utils.Chunk.fromString(value, encoding);
			if (DEBUG) asserts.IntegerAssert.between(0, encoded.byteLength, length);
			buffer.set(encoded, offset);
			buffer.fill(0, offset + encoded.length, offset + length);
			return value;
		}
	}

	static boolean(buffer: Uint8Array, offset: number, bit: number, value?: boolean): boolean {
		if (DEBUG) asserts.IntegerAssert.between(0, bit, 7);
		if (DEBUG) asserts.IntegerAssert.between(0, offset, buffer.byteLength - 1);
		if (value == null) {
			let byte = buffer[offset];
			let value = ((byte >> bit) & 0x01) === 0x01;
			return value;
		} else {
			let byte = buffer[offset];
			buffer[offset] = (byte & ~(1 << bit)) | ((~~value) << bit);
			return value;
		}
	}

	static signed(buffer: Uint8Array, offset: number, length: number, value?: number, endian?: Endian): number {
		if (DEBUG) asserts.IntegerAssert.between(1, length, 6);
		let bias = 2 ** (length * 8 - 1);
		if (value == null) {
			let value = this.unsigned(buffer, offset, length, undefined, endian);
			if (value >= bias) {
				value -= bias + bias;
			}
			return value;
		} else {
			let copy = value;
			if (copy < 0) {
				copy += bias + bias;
			}
			this.unsigned(buffer, offset, length, copy, endian);
			return value;
		}
	}

	static unsigned(buffer: Uint8Array, offset: number, length: number, value?: number, endian?: Endian): number {
		if (DEBUG) asserts.IntegerAssert.between(1, length, 6);
		if (DEBUG) asserts.IntegerAssert.between(0, offset, buffer.byteLength - length);
		if (value == null) {
			let value = 0;
			for (let i = 0; i < length; i++) {
				value *= 256;
				if (endian === "little") {
					value += buffer[offset + length - 1 - i];
				} else {
					value += buffer[offset + i];
				}
			}
			return value;
		} else {
			if (DEBUG) asserts.IntegerAssert.between(0, value, 2 ** (8 * length) - 1);
			let copy = value;
			for (let i = 0; i < length; i++) {
				if (endian === "little") {
					buffer[offset + i] = copy % 256;
				} else {
					buffer[offset + length - 1 - i] = copy % 256;
				}
				copy = Math.floor(copy / 256);
			}
			return value;
		}
	}
};

export class PromiseQueue {
	private lock: Promise<any>;
	private open: boolean;

	constructor() {
		this.lock = Promise.resolve();
		this.open = true;
	}

	close(): void {
		this.open = false;
	}

	enqueue<A>(operation: Promise<A> | (() => Promise<A>) | (() => A)): Promise<A> {
		if (!this.open) {
			throw `Expected queue to be open!`;
		}
		try {
			return this.lock = this.lock
				.then(operation instanceof Promise ? () => operation : operation);
		} finally {
			this.lock = this.lock.catch(() => null);
		}
	}
};

export class Tokenizer {
	private constructor() {}

	static tokenize(value: string, maxTokenCount = 20): Array<string> {
		let normalized = value;
		normalized = normalized.toLowerCase();
		normalized = normalized.normalize("NFC");
		normalized = normalized.replace(/['"`´]+/g, "");
		return Array.from(new Set(normalized.match(/(\p{L}+|\p{N}+)/gu) ?? [])).slice(0, maxTokenCount);
	}
};

export interface SeekableIterable<A> extends Iterable<A> {
	next(): A | undefined;
	seek(value: A | undefined): A | undefined;
};

export type Collator<A> = (one: A, two: A) => number;

export function makeSeekableIterable<A>(source: Iterable<A>, collator: Collator<A>): SeekableIterable<A> {
	let array = Array.from(source).sort(collator);
	function makeIterable(value: A | undefined): Iterable<A> {
		if (value != null) {
			return array.filter((item) => collator(item, value) >= 0);
		} else {
			return array;
		}
	}
	let iterable = makeIterable(undefined);
	let iterator = iterable[Symbol.iterator]();
	return {
		[Symbol.iterator]() {
			return iterable[Symbol.iterator]();
		},
		next() {
			return iterator.next().value;
		},
		seek(value) {
			iterable = makeIterable(value);
			iterator = iterable[Symbol.iterator]();
			return this.next();
		}
	};
};

export function intersection<A>(iterables: Iterable<SeekableIterable<A>>, collator: Collator<A>): SeekableIterable<A> {
	function * makeIterable(value: A | undefined): Iterable<A> {
		let entries = [] as Array<{ iterable: SeekableIterable<A>, candidate: A }>;
		let maxCandidate = value;
		for (let iterable of iterables) {
			let candidate = value != null ? iterable.seek(value) : iterable.next();
			if (candidate == null) {
				return;
			}
			if (maxCandidate == null || collator(candidate, maxCandidate) > 0) {
				maxCandidate = candidate;
			}
			entries.push({
				iterable,
				candidate
			});
		}
		while (true) {
			let minEntry: { iterable: SeekableIterable<A>, candidate: A } | undefined;
			let maxEntry: { iterable: SeekableIterable<A>, candidate: A } | undefined;
			for (let entry of entries) {
				if (minEntry == null || collator(entry.candidate, minEntry.candidate) < 0) {
					minEntry = entry;
				}
				if (maxEntry == null || collator(entry.candidate, maxEntry.candidate) > 0) {
					maxEntry = entry;
				}
			}
			if (maxEntry == null || minEntry == null) {
				break;
			}
			let match = collator(minEntry.candidate, maxEntry.candidate) === 0;
			let maxCandidate = maxEntry.candidate;
			if (match) {
				yield maxCandidate;
			}
			let nextEntries = [] as Array<{ iterable: SeekableIterable<A>, candidate: A }>;
			for (let entry of entries) {
				let candidate = entry.candidate as A | undefined;
				if (match) {
					candidate = entry.iterable.next();
				} else {
					if (collator(entry.candidate, maxCandidate) < 0) {
						candidate = entry.iterable.seek(maxCandidate);
					}
				}
				if (candidate == null) {
					return;
				}
				if (maxCandidate == null || collator(candidate, maxCandidate) > 0) {
					maxCandidate = candidate;
				}
				entry.candidate = candidate;
				nextEntries.push(entry);
			}
			entries = nextEntries;
		}
	}
	let iterable = makeIterable(undefined);
	let iterator = iterable[Symbol.iterator]();
	return {
		[Symbol.iterator]() {
			return iterable[Symbol.iterator]();
		},
		next() {
			return iterator.next().value;
		},
		seek(value) {
			iterable = makeIterable(value);
			iterator = iterable[Symbol.iterator]();
			return this.next();
		}
	};
};

export function union<A>(iterables: Iterable<SeekableIterable<A>>, collator: Collator<A>): SeekableIterable<A> {
	function * makeIterable(value: A | undefined): Iterable<A> {
		let entries = [] as Array<{ iterable: SeekableIterable<A>, candidate: A }>;
		for (let iterable of iterables) {
			let candidate = value != null ? iterable.seek(value) : iterable.next();
			if (candidate == null) {
				continue;
			}
			entries.push({
				iterable,
				candidate
			});
		}
		while (true) {
			let minEntry: { iterable: SeekableIterable<A>, candidate: A } | undefined;
			for (let entry of entries) {
				if (minEntry == null || collator(entry.candidate, minEntry.candidate) < 0) {
					minEntry = entry;
				}
			}
			if (minEntry == null) {
				break;
			}
			let minCandidate = minEntry.candidate;
			yield minCandidate;
			let nextEntries = [] as Array<{ iterable: SeekableIterable<A>, candidate: A }>;
			for (let entry of entries) {
				let candidate = entry.candidate as A | undefined;
				if (collator(entry.candidate, minCandidate) === 0) {
					candidate = entry.iterable.next();
				}
				if (candidate == null) {
					continue;
				}
				entry.candidate = candidate;
				nextEntries.push(entry);
			}
			entries = nextEntries;
		}
	}
	let iterable = makeIterable(undefined);
	let iterator = iterable[Symbol.iterator]();
	return {
		[Symbol.iterator]() {
			return iterable[Symbol.iterator]();
		},
		next() {
			return iterator.next().value;
		},
		seek(value) {
			iterable = makeIterable(value);
			iterator = iterable[Symbol.iterator]();
			return this.next();
		}
	};
};
