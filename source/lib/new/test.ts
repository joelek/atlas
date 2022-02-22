export const Assert = {
	false(condition: boolean): void {
		if (condition) {
			throw ``;
		}
	},
	true(condition: boolean): void {
		if (!condition) {
			throw ``;
		}
	},
	async throws(cb: () => Promise<void>): Promise<void> {
		try {
			await cb();
		} catch (error) {
			return;
		}
		throw `Expected to throw!`;
	},
	array: {
		equals<A>(one: Array<A>, two: Array<A>, message: string = ""): void {
			if (one.length !== two.length) {
				throw message;
			}
			for (let i = 0; i < one.length; i++) {
				if (one[i] !== two[i]) {
					throw message;
				}
			}
		}
	},
	binary: {
		equals(one: Uint8Array, two: Uint8Array, message: string = ""): void {
			if (one.length !== two.length) {
				throw message;
			}
			for (let i = 0; i < one.length; i++) {
				if (one[i] !== two[i]) {
					throw message;
				}
			}
		}
	},
	record: {
		equals(one: Record<string, any>, two: Record<string, any>, message: string = ""): void {
			for (let key in one) {
				if (!(key in two)) {
					throw message;
				}
			}
			for (let key in two) {
				if (!(key in one)) {
					throw message;
				}
			}
			for (let key in one) {
				if (one[key] !== two[key]) {
					throw message;
				}
			}
		}
	}
};

export function test(name: string, cb: (assert: typeof Assert) => Promise<any>): void {
	cb(Assert).catch((error) => {
		console.log(name);
		console.log(error);
	});
};
