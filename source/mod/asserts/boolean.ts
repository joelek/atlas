export class BooleanAssert {
	private constructor() {}

	static true(value: boolean): boolean {
		if (value !== true) {
			throw `Expected ${value} to be true!`;
		}
		return value;
	}

	static false(value: boolean): boolean {
		if (value !== false) {
			throw `Expected ${value} to be false!`;
		}
		return value;
	}
};
