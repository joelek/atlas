import * as atlas from "../lib";
import * as libfs from "fs";
import { benchmark } from "../lib/test";

let json = JSON.parse(libfs.readFileSync("./private/testdata.json", "utf-8")) as Array<{ id: string, title: string }>;
let context = atlas.createContext();
let records = context.createStore({
	id: context.createStringField(),
	title: context.createStringField({ searchable: true })
}, ["id"]);
let transactionManager = context.createTransactionManager("./private/search", {
	records
});
let { stores } = { ...transactionManager };
let n = 10000;
transactionManager.enqueueWritableTransaction(async (queue) => {
	let t0 = process.hrtime.bigint();
	for (let i = 0; i < n; i++) {
		await stores.records.insert(queue, {
			id: "" + i,
			title: json[i % json.length].title
		});
	}
	let t1 = process.hrtime.bigint();
	console.log("insertion", (Number(t1 - t0)/1000/1000/n).toFixed(2), "ms/entry");
});
transactionManager.enqueueReadableTransaction(async (queue) => {
	let words = "hopeless case of a kid in denial".split(" ");
	for (let i = 1; i < words.length + 1; i++) {
		let query = words.slice(0, i).join(" ");
		let ms = await benchmark(() => stores.records.search(queue, query, undefined, 1));
		console.log(`query "${query}"`, ms.toFixed(2), "ms");
		console.log(await stores.records.search(queue, query, undefined, 1));
	}
	for (let limit of [1, 10]) {
		{
			let query = "the for of an a in";
			let ms = await benchmark(() => stores.records.search(queue, query, undefined, limit));
			console.log(`query "${query}"`, ms.toFixed(2), "ms");
			console.log(await stores.records.search(queue, query, undefined, limit));
		}
		{
			let query = "s";
			let ms = await benchmark(() => stores.records.search(queue, query, undefined, limit));
			console.log(`query "${query}"`, ms.toFixed(2), "ms");
			console.log(await stores.records.search(queue, query, undefined, limit));
		}
		{
			let query = "the s";
			let ms = await benchmark(() => stores.records.search(queue, query, undefined, limit));
			console.log(`query "${query}"`, ms.toFixed(2), "ms");
			console.log(await stores.records.search(queue, query, undefined, limit));
		}
	}
});
