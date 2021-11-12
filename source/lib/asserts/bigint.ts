export class BigintAssert {
	private constructor() {}

	static atLeast(min: bigint, value: bigint): bigint {
		if (value < min) {
			throw `Expected ${value} to be at least ${min}!`;
		}
		return value;
	}

	static atMost(max: bigint, value: bigint): bigint {
		if (value > max) {
			throw `Expected ${value} to be at most ${max}!`;
		}
		return value;
	}

	static between(min: bigint, value: bigint, max: bigint): bigint {
		if (value < min || value > max) {
			throw `Expected ${value} to be between ${min} and ${max}!`;
		}
		return value;
	}

	static exactly(value: bigint, expected: bigint): bigint {
		if (value !== expected) {
			throw `Expected ${value} to be exactly ${expected}!`;
		}
		return value;
	}
};
