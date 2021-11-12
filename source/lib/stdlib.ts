export function * permute<A>(array: Array<A>): Iterable<Array<A>> {
	if (array.length <= 1) {
		yield [...array];
	} else {
		for (let i = 0; i < array.length; i++) {
			let subarray = [...array.slice(0, i), ...array.slice(i + 1)];
			for (let permutation of permute(subarray)) {
				yield [array[i], ...permutation];
			}
		}
	}
};
