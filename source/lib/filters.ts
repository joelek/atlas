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

	getEncodedValue(): Uint8Array {
		return bedrock.codecs.Any.encodePayload(this.value);
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

export type FilterMap<A extends Record> = {
	[C in keyof A]?: Filter<A[C]>;
};

export type Filters<A extends Record> = {
	[C in keyof A]: Filter<A[C]>;
};
