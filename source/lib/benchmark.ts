export function benchmark<A>(subject: () => A, times: number = 1): A {
	let start = process.hrtime.bigint();
	let result = subject();
	for (let i = 1; i < times; i++) {
		subject();
	}
	let duration = (Number(process.hrtime.bigint() - start) / 1000000 / times);
	console.log(`${duration.toFixed(6)} ms`, result);
	return result;
};
