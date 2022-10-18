export async function benchmark<A>(subject: (() => A) | (() => Promise<A>)): Promise<number> {
	let start = process.hrtime.bigint();
	let times = 0;
	while (true) {
		await subject();
		times += 1;
		let duration = Number(process.hrtime.bigint() - start) / 1000 / 1000;
		if (duration >= 1000) {
			break;
		}
	}
	let averageDuration = (Number(process.hrtime.bigint() - start) / 1000 / 1000 / times);
	return averageDuration;
};
