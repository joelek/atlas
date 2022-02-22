export function benchmark<A>(subject: () => A, times: number = 1): A {
	let start = process.hrtime.bigint();
	let result = subject();
	for (let i = 1; i < times; i++) {
		subject();
	}
	let duration_ms = (Number(process.hrtime.bigint() - start) / 1000 / 1000 / times);
	let ops_per_sec = 1000 / duration_ms;
	console.log(`${duration_ms.toFixed(6)} ms, ${ops_per_sec.toFixed(0)} ops/s`);
	return result;
};
