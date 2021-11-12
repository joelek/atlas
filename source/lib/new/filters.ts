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
		throw `TODO`;
	}
};

export type FilterMap<A extends Record> = {
	[C in keyof A]?: Filter<A[C]>;
};
