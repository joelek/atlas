import * as bedrock from "@joelek/bedrock";
import { Record, Value } from "./records";

export abstract class Filter<A extends Value> {
	constructor() {}

	abstract matches(value: A): boolean;
};

export class EqualityFilter<A extends Value> extends Filter<A> {
	private value: A;

	constructor(value: A) {
		super();
		this.value = value;
	}

	getValue(): A {
		return this.value;
	}

	matches(value: A): boolean {
		let one = bedrock.codecs.Any.encodePayload(this.value);
		let two = bedrock.codecs.Any.encodePayload(value);
		return bedrock.utils.Chunk.comparePrefixes(one, two) === 0;
	}
};

export class RangeFilter<A extends Value> extends Filter<A> {
	private lower: A;
	private upper: A;

	constructor(lower: A, upper: A) {
		super();
		this.lower = lower;
		this.upper = upper;
	}

	getLower(): A {
		return this.lower;
	}

	getUpper(): A {
		return this.upper;
	}

	matches(value: A): boolean {
		let lower = bedrock.codecs.Any.encodePayload(this.lower);
		let upper = bedrock.codecs.Any.encodePayload(this.upper);
		let check = bedrock.codecs.Any.encodePayload(value);
		return bedrock.utils.Chunk.comparePrefixes(lower, check) <= 0 && bedrock.utils.Chunk.comparePrefixes(check, upper) <= 0;
	}
};

export type FilterMap<A extends Record> = {
	[C in keyof A]?: Filter<A[C]>;
};
