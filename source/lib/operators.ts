import { EqualityFilter, Filter, GreaterThanFilter, GreaterThanOrEqualFilter, LessThanFilter, LessThanOrEqualFilter } from "./filters";
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

export class GreaterThanOperator<A extends Value> extends Operator<A> {
	constructor() {
		super();
	}

	createFilter(value: A): GreaterThanFilter<A> {
		return new GreaterThanFilter(value);
	}
};

export class GreaterThanOrEqualOperator<A extends Value> extends Operator<A> {
	constructor() {
		super();
	}

	createFilter(value: A): GreaterThanOrEqualFilter<A> {
		return new GreaterThanOrEqualFilter(value);
	}
};

export class LessThanOperator<A extends Value> extends Operator<A> {
	constructor() {
		super();
	}

	createFilter(value: A): LessThanFilter<A> {
		return new LessThanFilter(value);
	}
};

export class LessThanOrEqualOperator<A extends Value> extends Operator<A> {
	constructor() {
		super();
	}

	createFilter(value: A): LessThanOrEqualFilter<A> {
		return new LessThanOrEqualFilter(value);
	}
};

export type OperatorMap<A extends Record> = {
	[B in keyof A]?: Operator<A[B]>;
};

export type Operators<A extends Record> = {
	[B in keyof A]: Operator<A[B]>;
};
