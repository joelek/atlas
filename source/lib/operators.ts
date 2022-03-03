import { EqualityFilter, Filter } from "./filters";
import { Record, Value } from "./records";

export abstract class Operator<A extends Value> {
	constructor() {}

	abstract createFilter(value: A): Filter<A>;
};

export class EqualityOperator<A extends Value> extends Operator<A> {
	constructor() {
		super();
	}

	createFilter(value: A): EqualityFilter<A> {
		return new EqualityFilter(value);
	}
};

export type OperatorMap<A extends Record> = {
	[B in keyof A]?: Operator<A[B]>;
};

export type Operators<A extends Record> = {
	[B in keyof A]: Operator<A[B]>;
};
