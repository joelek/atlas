import { EqualityFilter, Filter, RangeFilter } from "./filters";
import { Record, Value } from "./records";

export abstract class Operator<A extends Value, B extends A | A[]> {
	constructor() {}

	abstract createFilter(value: B): Filter<A>;
};

export type Operators<A extends Record> = {
	[B in keyof A]?: A[B] extends Operator<infer C, infer D> ? Operator<C, D> : never;
};

export class EqualityOperator<A extends Value> extends Operator<A, A> {
	constructor() {
		super();
	}

	createFilter(value: A): EqualityFilter<A> {
		return new EqualityFilter(value);
	}
};

export class RangeOperator<A extends Value> extends Operator<A, [A, A]> {
	constructor() {
		super();
	}

	createFilter(value: [A, A]): RangeFilter<A> {
		return new RangeFilter(value[0], value[1]);
	}
};
