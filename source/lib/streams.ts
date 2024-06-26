function * filter<A>(iterable: Iterable<A>, predicate: (value: A, index: number) => boolean): Iterable<A> {
	let index = 0;
	for (let value of iterable) {
		if (predicate(value, index++)) {
			yield value;
		}
	}
};

type FlattenType<A> = A extends Iterable<infer B> ? B : A;

function * flatten<A>(iterable: Iterable<A>): Iterable<FlattenType<A>> {
	for (let value of iterable as Iterable<any>) {
		if (typeof value[Symbol.iterator] === "function") {
			yield * value;
		} else {
			yield value;
		}
	}
};

function * include<A, B extends A>(iterable: Iterable<A>, predicate: (value: A, index: number) => value is B): Iterable<B> {
	let index = 0;
	for (let value of iterable) {
		if (predicate(value, index++)) {
			yield value;
		}
	}
};

function * limit<A>(iterable: Iterable<A>, length: number): Iterable<A> {
	if (length > 0) {
		let index = 0;
		for (let value of iterable) {
			yield value;
			index += 1;
			if (index >= length) {
				break;
			}
		}
	}
};

function * map<A, B>(iterable: Iterable<A>, transform: (value: A, index: number) => B): Iterable<B> {
	let index = 0;
	for (let value of iterable) {
		yield transform(value, index++);
	}
};

export class StreamIterable<A> {
	private values: Iterable<A>;

	private constructor(values: Iterable<A>) {
		this.values = values;
	}

	* [Symbol.iterator](): Iterator<A> {
		for (let value of this.values) {
			yield value;
		}
	}

	collect(): Array<A> {
		return Array.from(this.values);
	}

	filter(predicate: (value: A, index: number) => boolean): StreamIterable<A> {
		return new StreamIterable<A>(filter(this.values, predicate));
	}

	find(predicate: (value: A, index: number) => boolean): A | undefined {
		let index = 0;
		for (let value of this.values) {
			if (predicate(value, index++)) {
				return value;
			}
		}
	}

	flatten(): StreamIterable<FlattenType<A>> {
		return new StreamIterable(flatten(this.values));
	}

	include<B extends A>(predicate: (value: A, index: number) => value is B): StreamIterable<B> {
		return new StreamIterable<B>(include(this.values, predicate));
	}

	includes(predicate: (value: A, index: number) => boolean): boolean {
		let index = 0;
		for (let value of this.values) {
			if (predicate(value, index++)) {
				return true;
			}
		}
		return false;
	}

	limit(length: number): StreamIterable<A> {
		return new StreamIterable(limit(this.values, length));
	}

	map<B>(transform: (value: A, index: number) => B): StreamIterable<B> {
		return new StreamIterable(map(this.values, transform));
	}

	peek(): A | undefined {
		let iterator = this.values[Symbol.iterator]();
		let result = iterator.next();
		if (!result.done) {
			this.values = flatten([[result.value], new class implements Iterable<A> {
				[Symbol.iterator](): Iterator<A, any, undefined> {
					return iterator;
				}
			}]);
		}
		return result.value;
	}

	shift(): A | undefined {
		for (let value of this.values) {
			return value;
		}
	}

	slice(start?: number, end?: number): StreamIterable<A> {
		let array = this.collect().slice(start, end);
		return new StreamIterable(array);
	}

	sort(comparator?: (one: A, two: A) => number): StreamIterable<A> {
		let array = this.collect().sort(comparator);
		return new StreamIterable(array);
	}

	unique(): StreamIterable<A> {
		return new StreamIterable(new Set(this.values));
	}

	static of<A>(values: Iterable<A> | undefined): StreamIterable<A> {
		return new StreamIterable<A>(values ?? new Array<A>());
	}
};
