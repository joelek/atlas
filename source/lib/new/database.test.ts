import { DatabaseManager } from "./database";
import { VirtualFile } from "./files";
import { test } from "../test";

async function delay(ms: number): Promise<void> {
	await new Promise((resolve, reject) => {
		setTimeout(resolve, ms);
	});
};

test(`It should wait for all read actions to complete before starting a write action.`, async (assert) => {
	let file = new VirtualFile(0);
	let database = new DatabaseManager(file, new Map(), new Map());
	let events = new Array<string>();
	let transactionOne = database.enqueueReadableTransaction(async (access) => {
		events.push("1S");
		await delay(0);
		events.push("1E");
		return 1;
	});
	let transactionTwo = database.enqueueReadableTransaction(async (access) => {
		events.push("2S");
		await delay(0);
		events.push("2E");
		return 2;
	});
	let transactionThree = database.enqueueWritableTransaction(async (access) => {
		events.push("3S");
		await delay(0);
		events.push("3E");
		return 3;
	});
	let transactionFour = database.enqueueWritableTransaction(async (access) => {
		events.push("4S");
		await delay(0);
		events.push("4E");
		return 4;
	});
	events.push("S");
	assert.true(await transactionOne === 1);
	assert.true(await transactionTwo === 2);
	assert.true(await transactionThree === 3);
	assert.true(await transactionFour === 4);
	events.push("E");
	assert.array.equals(events, ["S", "1S", "2S", "1E", "2E", "3S", "3E", "4S", "4E", "E"]);
});

test(`It should wait for all write actions to complete before starting a read action.`, async (assert) => {
	let file = new VirtualFile(0);
	let database = new DatabaseManager(file, new Map(), new Map());
	let events = new Array<string>();
	let transactionOne = database.enqueueWritableTransaction(async (access) => {
		events.push("1S");
		await delay(0);
		events.push("1E");
		return 1;
	});
	let transactionTwo = database.enqueueWritableTransaction(async (access) => {
		events.push("2S");
		await delay(0);
		events.push("2E");
		return 2;
	});
	let transactionThree = database.enqueueReadableTransaction(async (access) => {
		events.push("3S");
		await delay(0);
		events.push("3E");
		return 3;
	});
	let transactionFour = database.enqueueReadableTransaction(async (access) => {
		events.push("4S");
		await delay(0);
		events.push("4E");
		return 4;
	});
	events.push("S");
	assert.true(await transactionOne === 1);
	assert.true(await transactionTwo === 2);
	assert.true(await transactionThree === 3);
	assert.true(await transactionFour === 4);
	events.push("E");
	assert.array.equals(events, ["S", "1S", "1E", "2S", "2E", "3S", "4S", "3E", "4E", "E"]);
});

test(`It should recover from transactions that throw errors.`, async (assert) => {
	let file = new VirtualFile(0);
	let database = new DatabaseManager(file, new Map(), new Map());
	let events = new Array<string>();
	let transactionOne = database.enqueueWritableTransaction(async (access) => {
		events.push("1S");
		await delay(0);
		throw ``;
		events.push("1E");
		return 1;
	});
	let transactionTwo = database.enqueueWritableTransaction(async (access) => {
		events.push("2S");
		await delay(0);
		events.push("2E");
		return 2;
	});
	events.push("S");
	await assert.throws(async () => {
		await transactionOne;
	});
	assert.true(await transactionTwo === 2);
	events.push("E");
	assert.array.equals(events, ["S", "1S", "2S", "2E", "E"]);
});
