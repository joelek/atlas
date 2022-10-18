import * as wtf from "@joelek/wtf";
import * as index from "./utils";

async function delay(ms: number): Promise<void> {
	await new Promise((resolve, reject) => {
		setTimeout(resolve, ms);
	});
};

wtf.test(`It should decode strings.`, async (assert) => {
	let buffer = Uint8Array.of(0xFF, 0x00);
	let value = index.Binary.string(buffer, 0, 1, "hex");
	assert.equals(value, "FF");
});

wtf.test(`It should encode strings.`, async (assert) => {
	let buffer = Uint8Array.of(0x00, 0x00);
	index.Binary.string(buffer, 0, 1, "hex", "FF");
	assert.equals(buffer[0], 0xFF);
	assert.equals(buffer[1], 0x00);
});

wtf.test(`It should decode boolean true.`, async (assert) => {
	let buffer = Uint8Array.of(0x80);
	let value = index.Binary.boolean(buffer, 0, 7);
	assert.equals(value, true);
});

wtf.test(`It should encode boolean true.`, async (assert) => {
	let buffer = Uint8Array.of(0x01);
	index.Binary.boolean(buffer, 0, 7, true);
	assert.equals(buffer[0], 0x81);
});

wtf.test(`It should decode boolean false.`, async (assert) => {
	let buffer = Uint8Array.of(0x80);
	let value = index.Binary.boolean(buffer, 0, 0);
	assert.equals(value, false);
});

wtf.test(`It should encode boolean false.`, async (assert) => {
	let buffer = Uint8Array.of(0x01);
	index.Binary.boolean(buffer, 0, 0, false);
	assert.equals(buffer[0], 0x00);
});

wtf.test(`It should decode max positive signed 4 byte big endian integers.`, async (assert) => {
	let buffer = Uint8Array.of(0x7F, 0xFF, 0xFF, 0xFF);
	let value = index.Binary.signed(buffer, 0, 4, undefined, "big");
	assert.equals(value, 2147483647);
});

wtf.test(`It should encode max positive signed 4 byte big endian integers.`, async (assert) => {
	let buffer = Uint8Array.of(0x00, 0x00, 0x00, 0x00);
	index.Binary.signed(buffer, 0, 4, 2147483647, "big");
	assert.equals(buffer[0], 0x7F);
	assert.equals(buffer[1], 0xFF);
	assert.equals(buffer[2], 0xFF);
	assert.equals(buffer[3], 0xFF);
});

wtf.test(`It should decode max negative signed 4 byte big endian integers.`, async (assert) => {
	let buffer = Uint8Array.of(0x80, 0x00, 0x00, 0x00);
	let value = index.Binary.signed(buffer, 0, 4, undefined, "big");
	assert.equals(value, -2147483648);
});

wtf.test(`It should encode max negative signed 4 byte big endian integers.`, async (assert) => {
	let buffer = Uint8Array.of(0x00, 0x00, 0x00, 0x00);
	index.Binary.signed(buffer, 0, 4, -2147483648, "big");
	assert.equals(buffer[0], 0x80);
	assert.equals(buffer[1], 0x00);
	assert.equals(buffer[2], 0x00);
	assert.equals(buffer[3], 0x00);
});

wtf.test(`It should decode unsigned 4 byte big endian integers.`, async (assert) => {
	let buffer = Uint8Array.of(0x01, 0x02, 0x03, 0x04);
	let value = index.Binary.unsigned(buffer, 0, 4, undefined, "big");
	assert.equals(value, 0x01020304);
});

wtf.test(`It should encode unsigned 4 byte big endian integers.`, async (assert) => {
	let buffer = Uint8Array.of(0x00, 0x00, 0x00, 0x00);
	index.Binary.unsigned(buffer, 0, 4, 0x01020304, "big");
	assert.equals(buffer[0], 0x01);
	assert.equals(buffer[1], 0x02);
	assert.equals(buffer[2], 0x03);
	assert.equals(buffer[3], 0x04);
});

wtf.test(`It should decode max positive signed 4 byte little endian integers.`, async (assert) => {
	let buffer = Uint8Array.of(0xFF, 0xFF, 0xFF, 0x7F);
	let value = index.Binary.signed(buffer, 0, 4, undefined, "little");
	assert.equals(value, 2147483647);
});

wtf.test(`It should encode max positive signed 4 byte little endian integers.`, async (assert) => {
	let buffer = Uint8Array.of(0x00, 0x00, 0x00, 0x00);
	index.Binary.signed(buffer, 0, 4, 2147483647, "little");
	assert.equals(buffer[0], 0xFF);
	assert.equals(buffer[1], 0xFF);
	assert.equals(buffer[2], 0xFF);
	assert.equals(buffer[3], 0x7F);
});

wtf.test(`It should decode max negative signed 4 byte little endian integers.`, async (assert) => {
	let buffer = Uint8Array.of(0x00, 0x00, 0x00, 0x80);
	let value = index.Binary.signed(buffer, 0, 4, undefined, "little");
	assert.equals(value, -2147483648);
});

wtf.test(`It should encode max negative signed 4 byte little endian integers.`, async (assert) => {
	let buffer = Uint8Array.of(0x00, 0x00, 0x00, 0x00);
	index.Binary.signed(buffer, 0, 4, -2147483648, "little");
	assert.equals(buffer[0], 0x00);
	assert.equals(buffer[1], 0x00);
	assert.equals(buffer[2], 0x00);
	assert.equals(buffer[3], 0x80);
});

wtf.test(`It should decode unsigned 4 byte little endian integers.`, async (assert) => {
	let buffer = Uint8Array.of(0x01, 0x02, 0x03, 0x04);
	let value = index.Binary.unsigned(buffer, 0, 4, undefined, "little");
	assert.equals(value, 0x04030201);
});

wtf.test(`It should encode unsigned 4 byte little endian integers.`, async (assert) => {
	let buffer = Uint8Array.of(0x00, 0x00, 0x00, 0x00);
	index.Binary.unsigned(buffer, 0, 4, 0x04030201, "little");
	assert.equals(buffer[0], 0x01);
	assert.equals(buffer[1], 0x02);
	assert.equals(buffer[2], 0x03);
	assert.equals(buffer[3], 0x04);
});

wtf.test(`It should support enqueing synchronous functions.`, async (assert) => {
	let queue = new index.PromiseQueue();
	let observed = await queue.enqueue(() => 1);
	assert.equals(observed, 1);
});

wtf.test(`It should support enqueing promises.`, async (assert) => {
	let queue = new index.PromiseQueue();
	let observed = await queue.enqueue(Promise.resolve(1));
	assert.equals(observed, 1);
});

wtf.test(`It should support enqueing asynchronous functions.`, async (assert) => {
	let queue = new index.PromiseQueue();
	let observed = await queue.enqueue(async () => 1);
	assert.equals(observed, 1);
});

wtf.test(`It should throw if enqueueing after being closed.`, async (assert) => {
	let queue = new index.PromiseQueue();
	queue.close();
	await assert.throws(async () => {
		queue.enqueue(Promise.resolve(1));
	});
});

wtf.test(`It should not recover when errors are uncaught.`, async (assert) => {
	let queue = new index.PromiseQueue();
	await assert.throws(async () => {
		await queue.enqueue(() => {
			throw "";
		});
	});
});

wtf.test(`It should recover when errors are caught.`, async (assert) => {
	let queue = new index.PromiseQueue();
	try {
		await queue.enqueue(() => {
			throw "";
		});
	} catch (error) {}
	let observed = await queue.enqueue(async () => 1);
	assert.equals(observed, 1);
});

wtf.test(`It should execute operations in order.`, async (assert) => {
	let queue = new index.PromiseQueue();
	let events = new Array<string>();
	let operationOne = queue.enqueue(async () => {
		events.push("1S");
		await delay(0);
		events.push("1E");
		return 1;
	});
	let operationTwo = queue.enqueue(async () => {
		events.push("2S");
		await delay(0);
		events.push("2E");
		return 2;
	});
	events.push("S");
	assert.equals(await operationOne, 1);
	assert.equals(await operationTwo, 2);
	events.push("E");
	assert.equals(events, ["S", "1S", "1E", "2S", "2E", "E"]);
});

wtf.test(`It should generate unions.`, async (assert) => {
	let a = index.makeSeekableIterable([100, 101], (one, two) => one - two);
	let b = index.makeSeekableIterable([99, 100, 101], (one, two) => one - two);
	let c = index.makeSeekableIterable([99, 100], (one, two) => one - two);
	let union = index.union([a, b, c], (one, two) => one - two);
	let observed = Array.from(union);
	let expected = [99, 100, 101];
	assert.equals(observed, expected);
});

wtf.test(`It should generate intersections.`, async (assert) => {
	let a = index.makeSeekableIterable([100, 101], (one, two) => one - two);
	let b = index.makeSeekableIterable([99, 100, 101], (one, two) => one - two);
	let c = index.makeSeekableIterable([99, 100], (one, two) => one - two);
	let intersection = index.intersection([a, b, c], (one, two) => one - two);
	let observed = Array.from(intersection);
	let expected = [100];
	assert.equals(observed, expected);
});
