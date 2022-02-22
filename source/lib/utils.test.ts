import * as index from "./utils";
import { test } from "./test";

test(`It should decode strings.`, async (assert) => {
	let buffer = Uint8Array.of(0xFF, 0x00);
	let value = index.Binary.string(buffer, 0, 1, "hex");
	assert.true(value === "FF");
});

test(`It should encode strings.`, async (assert) => {
	let buffer = Uint8Array.of(0x00, 0x00);
	index.Binary.string(buffer, 0, 1, "hex", "FF");
	assert.true(buffer[0] === 0xFF);
	assert.true(buffer[1] === 0x00);
});

test(`It should decode boolean true.`, async (assert) => {
	let buffer = Uint8Array.of(0x80);
	let value = index.Binary.boolean(buffer, 0, 7);
	assert.true(value === true);
});

test(`It should encode boolean true.`, async (assert) => {
	let buffer = Uint8Array.of(0x01);
	index.Binary.boolean(buffer, 0, 7, true);
	assert.true(buffer[0] === 0x81);
});

test(`It should decode boolean false.`, async (assert) => {
	let buffer = Uint8Array.of(0x80);
	let value = index.Binary.boolean(buffer, 0, 0);
	assert.true(value === false);
});

test(`It should encode boolean false.`, async (assert) => {
	let buffer = Uint8Array.of(0x01);
	index.Binary.boolean(buffer, 0, 0, false);
	assert.true(buffer[0] === 0x00);
});

test(`It should decode max positive signed 4 byte big endian integers.`, async (assert) => {
	let buffer = Uint8Array.of(0x7F, 0xFF, 0xFF, 0xFF);
	let value = index.Binary.signed(buffer, 0, 4, undefined, "big");
	assert.true(value === 2147483647);
});

test(`It should encode max positive signed 4 byte big endian integers.`, async (assert) => {
	let buffer = Uint8Array.of(0x00, 0x00, 0x00, 0x00);
	index.Binary.signed(buffer, 0, 4, 2147483647, "big");
	assert.true(buffer[0] === 0x7F);
	assert.true(buffer[1] === 0xFF);
	assert.true(buffer[2] === 0xFF);
	assert.true(buffer[3] === 0xFF);
});

test(`It should decode max negative signed 4 byte big endian integers.`, async (assert) => {
	let buffer = Uint8Array.of(0x80, 0x00, 0x00, 0x00);
	let value = index.Binary.signed(buffer, 0, 4, undefined, "big");
	assert.true(value === -2147483648);
});

test(`It should encode max negative signed 4 byte big endian integers.`, async (assert) => {
	let buffer = Uint8Array.of(0x00, 0x00, 0x00, 0x00);
	index.Binary.signed(buffer, 0, 4, -2147483648, "big");
	assert.true(buffer[0] === 0x80);
	assert.true(buffer[1] === 0x00);
	assert.true(buffer[2] === 0x00);
	assert.true(buffer[3] === 0x00);
});

test(`It should decode unsigned 4 byte big endian integers.`, async (assert) => {
	let buffer = Uint8Array.of(0x01, 0x02, 0x03, 0x04);
	let value = index.Binary.unsigned(buffer, 0, 4, undefined, "big");
	assert.true(value === 0x01020304);
});

test(`It should encode unsigned 4 byte big endian integers.`, async (assert) => {
	let buffer = Uint8Array.of(0x00, 0x00, 0x00, 0x00);
	index.Binary.unsigned(buffer, 0, 4, 0x01020304, "big");
	assert.true(buffer[0] === 0x01);
	assert.true(buffer[1] === 0x02);
	assert.true(buffer[2] === 0x03);
	assert.true(buffer[3] === 0x04);
});

test(`It should decode max positive signed 4 byte little endian integers.`, async (assert) => {
	let buffer = Uint8Array.of(0xFF, 0xFF, 0xFF, 0x7F);
	let value = index.Binary.signed(buffer, 0, 4, undefined, "little");
	assert.true(value === 2147483647);
});

test(`It should encode max positive signed 4 byte little endian integers.`, async (assert) => {
	let buffer = Uint8Array.of(0x00, 0x00, 0x00, 0x00);
	index.Binary.signed(buffer, 0, 4, 2147483647, "little");
	assert.true(buffer[0] === 0xFF);
	assert.true(buffer[1] === 0xFF);
	assert.true(buffer[2] === 0xFF);
	assert.true(buffer[3] === 0x7F);
});

test(`It should decode max negative signed 4 byte little endian integers.`, async (assert) => {
	let buffer = Uint8Array.of(0x00, 0x00, 0x00, 0x80);
	let value = index.Binary.signed(buffer, 0, 4, undefined, "little");
	assert.true(value === -2147483648);
});

test(`It should encode max negative signed 4 byte little endian integers.`, async (assert) => {
	let buffer = Uint8Array.of(0x00, 0x00, 0x00, 0x00);
	index.Binary.signed(buffer, 0, 4, -2147483648, "little");
	assert.true(buffer[0] === 0x00);
	assert.true(buffer[1] === 0x00);
	assert.true(buffer[2] === 0x00);
	assert.true(buffer[3] === 0x80);
});

test(`It should decode unsigned 4 byte little endian integers.`, async (assert) => {
	let buffer = Uint8Array.of(0x01, 0x02, 0x03, 0x04);
	let value = index.Binary.unsigned(buffer, 0, 4, undefined, "little");
	assert.true(value === 0x04030201);
});

test(`It should encode unsigned 4 byte little endian integers.`, async (assert) => {
	let buffer = Uint8Array.of(0x00, 0x00, 0x00, 0x00);
	index.Binary.unsigned(buffer, 0, 4, 0x04030201, "little");
	assert.true(buffer[0] === 0x01);
	assert.true(buffer[1] === 0x02);
	assert.true(buffer[2] === 0x03);
	assert.true(buffer[3] === 0x04);
});

test(`It should support enqueing synchronous functions.`, async (assert) => {
	let queue = new index.PromiseQueue();
	let observed = await queue.enqueue(() => 1);
	assert.true(observed === 1);
});

test(`It should support enqueing promises.`, async (assert) => {
	let queue = new index.PromiseQueue();
	let observed = await queue.enqueue(Promise.resolve(1));
	assert.true(observed === 1);
});

test(`It should support enqueing asynchronous functions.`, async (assert) => {
	let queue = new index.PromiseQueue();
	let observed = await queue.enqueue(async () => 1);
	assert.true(observed === 1);
});

test(`It should throw if enqueueing after being closed.`, async (assert) => {
	let queue = new index.PromiseQueue();
	queue.close();
	await assert.throws(async () => {
		queue.enqueue(Promise.resolve(1));
	});
});
