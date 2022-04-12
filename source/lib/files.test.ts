import * as files from "./files";
import { test } from "./test";

const constructors = {
	CachedFile: () => new files.CachedFile(new files.VirtualFile(0)),
	DurableFile: () => new files.DurableFile(new files.VirtualFile(0), new files.VirtualFile(0)),
	PagedFile: () => new files.PagedFile(new files.VirtualFile(0), Math.log2(4096)),
	PhysicalFile: () => new files.PhysicalFile("./private/test.bin", true),
	VirtualFile: () => new files.VirtualFile(0)
};

for (let key in constructors) {
	let constructor = constructors[key as keyof typeof constructors];

	test(`It should support increasing in size (${key}).`, async (assert) => {
		let file = constructor();
		file.resize(0);
		file.write(Uint8Array.of(1), 0);
		assert.true(file.size() === 1);
		file.resize(2);
		assert.true(file.size() === 2);
		let buffer = file.read(new Uint8Array(2), 0);
		assert.true(buffer[0] === 1);
		assert.true(buffer[1] === 0);
	});

	test(`It should support decreasing in size (${key}).`, async (assert) => {
		let file = constructor();
		file.resize(0);
		file.write(Uint8Array.of(1, 2), 0);
		assert.true(file.size() === 2);
		file.resize(1);
		assert.true(file.size() === 1);
		let buffer = file.read(new Uint8Array(1), 0);
		assert.true(buffer[0] === 1);
	});

	test(`It should support writing before the end (${key}).`, async (assert) => {
		let file = constructor();
		file.resize(3);
		file.write(Uint8Array.of(2, 3), 1);
		assert.true(file.size() === 3);
		let buffer = file.read(new Uint8Array(3), 0);
		assert.true(buffer[0] === 0);
		assert.true(buffer[1] === 2);
		assert.true(buffer[2] === 3);
	});

	test(`It should support writing at the end (${key}).`, async (assert) => {
		let file = constructor();
		file.resize(1);
		file.write(Uint8Array.of(2, 3), 1);
		assert.true(file.size() === 3);
		let buffer = file.read(new Uint8Array(3), 0);
		assert.true(buffer[0] === 0);
		assert.true(buffer[1] === 2);
		assert.true(buffer[2] === 3);
	});

	test(`It should support writing past the end (${key}).`, async (assert) => {
		let file = constructor();
		file.resize(0);
		file.write(Uint8Array.of(2, 3), 1);
		assert.true(file.size() === 3);
		let buffer = file.read(new Uint8Array(3), 0);
		assert.true(buffer[0] === 0);
		assert.true(buffer[1] === 2);
		assert.true(buffer[2] === 3);
	});
}

test(`It should not persist truncated data (DurableFile).`, async (assert) => {
	let bin = new files.VirtualFile(0);
	let log = new files.VirtualFile(0);
	let file = new files.DurableFile(bin, log);
	file.write(Uint8Array.of(1, 2), 0);
	file.resize(1);
	file.resize(2);
	file.persist();
	let buffer = bin.read(new Uint8Array(2), 0);
	assert.true(buffer[0] === 1);
	assert.true(buffer[1] === 0);
});

test(`It should support writing before a cached range (CachedFile).`, async (assert) => {
	let file = new files.VirtualFile(10);
	let cached = new files.CachedFile(file);
	cached.read(new Uint8Array(4), 3);
	file.write(Uint8Array.of(1, 1, 1, 1, 1, 1, 1, 1, 1, 1), 0);
	cached.write(Uint8Array.of(2, 2), 0);
	assert.binary.equals(cached.read(new Uint8Array(10), 0), Uint8Array.of(2, 2, 1, 0, 0, 0, 0, 1, 1, 1));
	assert.binary.equals(file.read(new Uint8Array(10), 0), Uint8Array.of(2, 2, 1, 1, 1, 1, 1, 1, 1, 1));
});

test(`It should support writing just before a cached range (CachedFile).`, async (assert) => {
	let file = new files.VirtualFile(10);
	let cached = new files.CachedFile(file);
	cached.read(new Uint8Array(4), 3);
	file.write(Uint8Array.of(1, 1, 1, 1, 1, 1, 1, 1, 1, 1), 0);
	cached.write(Uint8Array.of(2, 2), 1);
	assert.binary.equals(cached.read(new Uint8Array(10), 0), Uint8Array.of(1, 2, 2, 0, 0, 0, 0, 1, 1, 1));
	assert.binary.equals(file.read(new Uint8Array(10), 0), Uint8Array.of(1, 2, 2, 1, 1, 1, 1, 1, 1, 1));
});

test(`It should support writing overlapping the beginning of a cached range (CachedFile).`, async (assert) => {
	let file = new files.VirtualFile(10);
	let cached = new files.CachedFile(file);
	cached.read(new Uint8Array(4), 3);
	file.write(Uint8Array.of(1, 1, 1, 1, 1, 1, 1, 1, 1, 1), 0);
	cached.write(Uint8Array.of(2, 2), 2);
	assert.binary.equals(cached.read(new Uint8Array(10), 0), Uint8Array.of(1, 1, 2, 2, 0, 0, 0, 1, 1, 1));
	assert.binary.equals(file.read(new Uint8Array(10), 0), Uint8Array.of(1, 1, 2, 2, 1, 1, 1, 1, 1, 1));
});

test(`It should support writing at the beginning of a cached range (CachedFile).`, async (assert) => {
	let file = new files.VirtualFile(10);
	let cached = new files.CachedFile(file);
	cached.read(new Uint8Array(4), 3);
	file.write(Uint8Array.of(1, 1, 1, 1, 1, 1, 1, 1, 1, 1), 0);
	cached.write(Uint8Array.of(2, 2), 3);
	assert.binary.equals(cached.read(new Uint8Array(10), 0), Uint8Array.of(1, 1, 1, 2, 2, 0, 0, 1, 1, 1));
	assert.binary.equals(file.read(new Uint8Array(10), 0), Uint8Array.of(1, 1, 1, 2, 2, 1, 1, 1, 1, 1));
});

test(`It should support writing embedding into a cached range (CachedFile).`, async (assert) => {
	let file = new files.VirtualFile(10);
	let cached = new files.CachedFile(file);
	cached.read(new Uint8Array(4), 3);
	file.write(Uint8Array.of(1, 1, 1, 1, 1, 1, 1, 1, 1, 1), 0);
	cached.write(Uint8Array.of(2, 2), 4);
	assert.binary.equals(cached.read(new Uint8Array(10), 0), Uint8Array.of(1, 1, 1, 0, 2, 2, 0, 1, 1, 1));
	assert.binary.equals(file.read(new Uint8Array(10), 0), Uint8Array.of(1, 1, 1, 1, 2, 2, 1, 1, 1, 1));
});

test(`It should support writing at the end of a cached range (CachedFile).`, async (assert) => {
	let file = new files.VirtualFile(10);
	let cached = new files.CachedFile(file);
	cached.read(new Uint8Array(4), 3);
	file.write(Uint8Array.of(1, 1, 1, 1, 1, 1, 1, 1, 1, 1), 0);
	cached.write(Uint8Array.of(2, 2), 5);
	assert.binary.equals(cached.read(new Uint8Array(10), 0), Uint8Array.of(1, 1, 1, 0, 0, 2, 2, 1, 1, 1));
	assert.binary.equals(file.read(new Uint8Array(10), 0), Uint8Array.of(1, 1, 1, 1, 1, 2, 2, 1, 1, 1));
});

test(`It should support writing overlapping the end of a cached range (CachedFile).`, async (assert) => {
	let file = new files.VirtualFile(10);
	let cached = new files.CachedFile(file);
	cached.read(new Uint8Array(4), 3);
	file.write(Uint8Array.of(1, 1, 1, 1, 1, 1, 1, 1, 1, 1), 0);
	cached.write(Uint8Array.of(2, 2), 6);
	assert.binary.equals(cached.read(new Uint8Array(10), 0), Uint8Array.of(1, 1, 1, 0, 0, 0, 2, 2, 1, 1));
	assert.binary.equals(file.read(new Uint8Array(10), 0), Uint8Array.of(1, 1, 1, 1, 1, 1, 2, 2, 1, 1));
});

test(`It should support writing just after a cached range (CachedFile).`, async (assert) => {
	let file = new files.VirtualFile(10);
	let cached = new files.CachedFile(file);
	cached.read(new Uint8Array(4), 3);
	file.write(Uint8Array.of(1, 1, 1, 1, 1, 1, 1, 1, 1, 1), 0);
	cached.write(Uint8Array.of(2, 2), 7);
	assert.binary.equals(cached.read(new Uint8Array(10), 0), Uint8Array.of(1, 1, 1, 0, 0, 0, 0, 2, 2, 1));
	assert.binary.equals(file.read(new Uint8Array(10), 0), Uint8Array.of(1, 1, 1, 1, 1, 1, 1, 2, 2, 1));
});

test(`It should support writing after a cached range (CachedFile).`, async (assert) => {
	let file = new files.VirtualFile(10);
	let cached = new files.CachedFile(file);
	cached.read(new Uint8Array(4), 3);
	file.write(Uint8Array.of(1, 1, 1, 1, 1, 1, 1, 1, 1, 1), 0);
	cached.write(Uint8Array.of(2, 2), 8);
	assert.binary.equals(cached.read(new Uint8Array(10), 0), Uint8Array.of(1, 1, 1, 0, 0, 0, 0, 1, 2, 2));
	assert.binary.equals(file.read(new Uint8Array(10), 0), Uint8Array.of(1, 1, 1, 1, 1, 1, 1, 1, 2, 2));
});

test(`It should support writing overlapping the beginning and the end of a cached range (CachedFile).`, async (assert) => {
	let file = new files.VirtualFile(10);
	let cached = new files.CachedFile(file);
	cached.read(new Uint8Array(4), 3);
	file.write(Uint8Array.of(1, 1, 1, 1, 1, 1, 1, 1, 1, 1), 0);
	cached.write(Uint8Array.of(2, 2, 2, 2, 2, 2), 2);
	assert.binary.equals(cached.read(new Uint8Array(10), 0), Uint8Array.of(1, 1, 2, 2, 2, 2, 2, 2, 1, 1));
	assert.binary.equals(file.read(new Uint8Array(10), 0), Uint8Array.of(1, 1, 2, 2, 2, 2, 2, 2, 1, 1));
});

test(`It should not store shallow copies when reading from the file (CachedFile).`, async (assert) => {
	let file = new files.VirtualFile(3);
	let cached = new files.CachedFile(file);
	cached.read(new Uint8Array(1), 1);
	let buffer = new Uint8Array(3);
	cached.read(buffer, 0);
	buffer.set(Uint8Array.of(1, 1, 1), 0);
	assert.binary.equals(cached.read(buffer, 0), Uint8Array.of(0, 0, 0));
});

test(`It should not store shallow copies when writing to the file (CachedFile).`, async (assert) => {
	let file = new files.VirtualFile(3);
	let cached = new files.CachedFile(file);
	cached.read(new Uint8Array(1), 1);
	let buffer = new Uint8Array(3);
	cached.write(buffer, 0);
	buffer.set(Uint8Array.of(1, 1, 1), 0);
	assert.binary.equals(cached.read(buffer, 0), Uint8Array.of(0, 0, 0));
});

test(`It should fill the entire buffer when reading from the file (CachedFile).`, async (assert) => {
	let file = new files.VirtualFile(3);
	let cached = new files.CachedFile(file);
	cached.resize(4);
	cached.write(Uint8Array.of(1), 1);
	let buffer = new Uint8Array(1);
	assert.binary.equals(cached.read(buffer, 0), Uint8Array.of(0));
	assert.binary.equals(cached.read(buffer, 1), Uint8Array.of(1));
	assert.binary.equals(cached.read(buffer, 2), Uint8Array.of(0));
	assert.binary.equals(cached.read(buffer, 3), Uint8Array.of(0));
});

test(`It should fill the entire buffer when reading from the file (DurableFile).`, async (assert) => {
	let bin = new files.VirtualFile(0);
	let log = new files.VirtualFile(0);
	let durable = new files.DurableFile(bin, log);
	durable.resize(4);
	durable.write(Uint8Array.of(1), 1);
	let buffer = new Uint8Array(1);
	assert.binary.equals(durable.read(buffer, 0), Uint8Array.of(0));
	assert.binary.equals(durable.read(buffer, 1), Uint8Array.of(1));
	assert.binary.equals(durable.read(buffer, 2), Uint8Array.of(0));
	assert.binary.equals(durable.read(buffer, 3), Uint8Array.of(0));
});

test(`It should endure through multiple transactions and thousands of operations (DurableFile).`, async (assert) => {
	let bin = new files.PagedFile(new files.PhysicalFile("./private/endurance.bin"), Math.log2(4096), 4);
	let log = new files.PagedFile(new files.PhysicalFile("./private/endurance.log"), Math.log2(4096), 4);
	let durable = new files.DurableFile(bin, log);
	let readTime = 0;
	let timesRead = 0;
	let writeTime = 0;
	let timesWritten = 0;
	let resizeTime = 0;
	let timesResized = 0;
	let persistTime = 0;
	let timesPersisted = 0;
	for (let i = 0; i < 2; i++) {
		for (let j = 0; j < 10000; j++) {
			let action = Math.floor(Math.random() * 3);
			if (action === 0) {
				let length = Math.floor(Math.random() * Math.min(durable.size(), 128));
				let buffer = new Uint8Array(length);
				let offset = Math.floor(Math.random() * (durable.size() - length));
				let t0 = process.hrtime.bigint();
				durable.read(buffer, offset);
				let t1 = process.hrtime.bigint();
				readTime += Number(t1 - t0) / 1000 / 1000;
				timesRead += 1;
			} else if (action === 1) {
				let length = Math.floor(Math.random() * 128);
				let buffer = new Uint8Array(length);
				let offset = Math.floor(Math.random() * durable.size());
				let t0 = process.hrtime.bigint();
				durable.write(buffer, offset);
				let t1 = process.hrtime.bigint();
				writeTime += Number(t1 - t0) / 1000 / 1000;
				timesWritten += 1;
			} else {
				let size = Math.floor(Math.random() * 65536);
				let t0 = process.hrtime.bigint();
				durable.resize(size);
				let t1 = process.hrtime.bigint();
				resizeTime += Number(t1 - t0) / 1000 / 1000;
				timesResized += 1;
			}
		}
		let t0 = process.hrtime.bigint();
		durable.persist();
		let t1 = process.hrtime.bigint();
		persistTime += Number(t1 - t0) / 1000 / 1000;
		timesPersisted += 1;
	}
/* 	console.log(`Read: ${(readTime/timesRead).toFixed(3)} ms`);
	console.log(`Write: ${(writeTime/timesWritten).toFixed(3)} ms`);
	console.log(`Resize: ${(resizeTime/timesResized).toFixed(3)} ms`);
	console.log(`Persist: ${(persistTime/timesPersisted).toFixed(3)} ms`); */
});
