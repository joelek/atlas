import * as bedrock from "@joelek/bedrock";
import { Record, Value } from "./records";

export abstract class Filter<A extends Value> {
	constructor() {}

	abstract getValue(): A;
	abstract matches(encodedFilterValue: Uint8Array, encodedRecordValue: Uint8Array): boolean;
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

	matches(encodedFilterValue: Uint8Array, encodedRecordValue: Uint8Array): boolean {
		return bedrock.utils.Chunk.comparePrefixes(encodedFilterValue, encodedRecordValue) === 0;
	}
};

export class GreaterThanFilter<A extends Value> extends Filter<A> {
	private value: A;

	constructor(value: A) {
		super();
		this.value = value;
	}

	getValue(): A {
		return this.value;
	}

	matches(encodedFilterValue: Uint8Array, encodedRecordValue: Uint8Array): boolean {
		return bedrock.utils.Chunk.comparePrefixes(encodedFilterValue, encodedRecordValue) < 0;
	}
};

export type FilterMap<A extends Record> = {
	[C in keyof A]?: Filter<A[C]>;
};

export type Filters<A extends Record> = {
	[C in keyof A]: Filter<A[C]>;
};
