export async function benchmark<A>(subject: (() => A) | (() => Promise<A>), times: number = 1): Promise<A> {
	let start = process.hrtime.bigint();
	let result = await subject();
	for (let i = 1; i < times; i++) {
		await subject();
	}
	let duration_ms = (Number(process.hrtime.bigint() - start) / 1000 / 1000 / times);
	let ops_per_sec = 1000 / duration_ms;
	console.log(`${duration_ms.toFixed(6)} ms, ${ops_per_sec.toFixed(0)} ops/s`);
	return result;
};
