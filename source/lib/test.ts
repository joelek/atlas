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

export async function benchmark<A>(subject: (() => A) | (() => Promise<A>)): Promise<A> {
	let start = process.hrtime.bigint();
	let result: A;
	let times = 0;
	while (true) {
		result = await subject();
		times += 1;
		let duration_ms = Number(process.hrtime.bigint() - start) / 1000 / 1000;
		if (duration_ms >= 1000) {
			break;
		}
	}
	let ms_per_op = (Number(process.hrtime.bigint() - start) / 1000 / 1000 / times);
	let ops_per_sec = 1000 / ms_per_op;
	console.log(`${ms_per_op.toFixed(6)} ms/op, ${ops_per_sec.toFixed(0)} ops/s`);
	return result;
};
