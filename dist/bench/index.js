"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atlas = require("../lib");
const libfs = require("fs");
const test_1 = require("../lib/test");
let json = JSON.parse(libfs.readFileSync("./private/test.json", "utf-8"));
let context = atlas.createContext();
let records = context.createStore({
    id: context.createStringField(),
    title: context.createStringField({ searchable: true })
}, ["id"]);
let { transactionManager } = context.createTransactionManager("./private/test", {
    records
});
let stores = transactionManager.createTransactionalStores();
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
    console.log("insertion", (Number(t1 - t0) / 1000 / 1000 / n).toFixed(2), "ms/entry");
});
transactionManager.enqueueReadableTransaction(async (queue) => {
    let words = "hopeless case of a kid in denial".split(" ");
    for (let i = 1; i < words.length + 1; i++) {
        let query = words.slice(0, i).join(" ");
        let ms = await (0, test_1.benchmark)(() => stores.records.search(queue, query, undefined, 1));
        console.log(`top result for "${query}"`, ms.toFixed(2), "ms");
    }
    let query = "the for of an a in";
    let ms = await (0, test_1.benchmark)(() => stores.records.search(queue, query, undefined, 1));
    console.log(`stop words "${query}"`, ms.toFixed(2), "ms");
});
