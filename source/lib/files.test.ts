import * as wtf from "@joelek/wtf";
import * as files from "./files";

const constructors = {
	CachedFile: () => new files.CachedFile(new files.VirtualFile(0)),
	DurableFile: () => new files.DurableFile(new files.VirtualFile(0), new files.VirtualFile(0)),
	PagedDurableFile: () => new files.PagedDurableFile(new files.VirtualFile(0), new files.VirtualFile(0), Math.log2(2)),
	PagedFile: () => new files.PagedFile(new files.VirtualFile(0), Math.log2(2)),
	PhysicalFile: () => new files.PhysicalFile("./private/test.bin", true),
	VirtualFile: () => new files.VirtualFile(0)
};

for (let key in constructors) {
	let constructor = constructors[key as keyof typeof constructors];

	wtf.test(`It should support increasing in size (${key}).`, async (assert) => {
		let file = constructor();
		file.resize(0);
		file.write(Uint8Array.of(1), 0);
		assert.equals(file.size(), 1);
		file.resize(2);
		assert.equals(file.size(), 2);
		let buffer = file.read(new Uint8Array(2), 0);
		assert.equals(buffer[0], 1);
		assert.equals(buffer[1], 0);
	});

	wtf.test(`It should support decreasing in size (${key}).`, async (assert) => {
		let file = constructor();
		file.resize(0);
		file.write(Uint8Array.of(1, 2), 0);
		assert.equals(file.size(), 2);
		file.resize(1);
		assert.equals(file.size(), 1);
		let buffer = file.read(new Uint8Array(1), 0);
		assert.equals(buffer[0], 1);
	});

	wtf.test(`It should support writing before the end (${key}).`, async (assert) => {
		let file = constructor();
		file.resize(3);
		file.write(Uint8Array.of(2, 3), 1);
		assert.equals(file.size(), 3);
		let buffer = file.read(new Uint8Array(3), 0);
		assert.equals(buffer[0], 0);
		assert.equals(buffer[1], 2);
		assert.equals(buffer[2], 3);
	});

	wtf.test(`It should support writing at the end (${key}).`, async (assert) => {
		let file = constructor();
		file.resize(1);
		file.write(Uint8Array.of(2, 3), 1);
		assert.equals(file.size(), 3);
		let buffer = file.read(new Uint8Array(3), 0);
		assert.equals(buffer[0], 0);
		assert.equals(buffer[1], 2);
		assert.equals(buffer[2], 3);
	});

	wtf.test(`It should support writing past the end (${key}).`, async (assert) => {
		let file = constructor();
		file.resize(0);
		file.write(Uint8Array.of(2, 3), 1);
		assert.equals(file.size(), 3);
		let buffer = file.read(new Uint8Array(3), 0);
		assert.equals(buffer[0], 0);
		assert.equals(buffer[1], 2);
		assert.equals(buffer[2], 3);
	});

	wtf.test(`It should persist data written (${key}).`, async (assert) => {
		let file = constructor();
		file.write(Uint8Array.of(1), 1);
		file.persist();
		assert.equals(file.read(new Uint8Array(1), 1), Uint8Array.of(1));
	});

	wtf.test(`It should discard truncated data (${key}).`, async (assert) => {
		let file = constructor();
		file.write(Uint8Array.of(1), 1);
		file.persist();
		file.resize(0);
		file.resize(2);
		assert.equals(file.read(new Uint8Array(1), 1), Uint8Array.of(0));
	});
}

wtf.test(`It should behave consistently (PagedDurableFile).`, async (assert) => {
	let virtual = new files.VirtualFile(0);
	let file = new files.PagedDurableFile(new files.VirtualFile(0), new files.VirtualFile(0), Math.log2(2));
	for (let i = 0; i < 10000; i++) {
		let action = Math.floor(Math.random() * 4);
		if (action === 0) {
			let length = Math.floor(Math.random() * Math.min(file.size(), 2));
			let buffer1 = new Uint8Array(length);
			let offset = Math.floor(Math.random() * (file.size() - length));
			let buffer2 = new Uint8Array(length);
			file.read(buffer1, offset);
			virtual.read(buffer2, offset);
			assert.equals(buffer1, buffer2);
		} else if (action === 1) {
			let length = Math.floor(Math.random() * 2);
			let buffer1 = new Uint8Array(length);
			for (let i = 0; i < buffer1.length; i++) {
				buffer1[i] = Math.floor(Math.random() * 256);
			}
			let buffer2 = buffer1.slice();
			let offset = Math.floor(Math.random() * file.size());
			file.write(buffer1, offset);
			virtual.write(buffer2, offset);
		} else if (action === 2) {
			let size = Math.floor(Math.random() * 64);
			file.resize(size);
			virtual.resize(size);
		} else {
			if (!(file instanceof files.PhysicalFile)) {
				file.persist();
				virtual.persist();
			}
		}
		assert.equals(file.size(), virtual.size());
		let buffer1 = new Uint8Array(file.size());
		let buffer2 = new Uint8Array(virtual.size());
		file.read(buffer1, 0);
		file.read(buffer2, 0);
		assert.equals(buffer1, buffer2);
	}
});

wtf.test(`It should not persist truncated data (DurableFile).`, async (assert) => {
	let bin = new files.VirtualFile(0);
	let log = new files.VirtualFile(0);
	let file = new files.DurableFile(bin, log);
	file.write(Uint8Array.of(1, 2), 0);
	file.resize(1);
	file.persist();
	file.resize(2);
	file.persist();
	let buffer = bin.read(new Uint8Array(2), 0);
	assert.equals(buffer[0], 1);
	assert.equals(buffer[1], 0);
});

wtf.test(`It should not persist truncated data (PagedDurableFile).`, async (assert) => {
	let bin = new files.VirtualFile(0);
	let log = new files.VirtualFile(0);
	let file = new files.PagedDurableFile(bin, log, 2);
	file.write(Uint8Array.of(1, 2), 0);
	file.resize(1);
	file.persist();
	file.resize(2);
	file.persist();
	let buffer = bin.read(new Uint8Array(2), 0);
	assert.equals(buffer[0], 1);
	assert.equals(buffer[1], 0);
});

wtf.test(`It should support writing before a cached range (CachedFile).`, async (assert) => {
	let file = new files.VirtualFile(10);
	let cached = new files.CachedFile(file);
	cached.read(new Uint8Array(4), 3);
	file.write(Uint8Array.of(1, 1, 1, 1, 1, 1, 1, 1, 1, 1), 0);
	cached.write(Uint8Array.of(2, 2), 0);
	assert.equals(cached.read(new Uint8Array(10), 0), Uint8Array.of(2, 2, 1, 0, 0, 0, 0, 1, 1, 1));
	assert.equals(file.read(new Uint8Array(10), 0), Uint8Array.of(2, 2, 1, 1, 1, 1, 1, 1, 1, 1));
});

wtf.test(`It should support writing just before a cached range (CachedFile).`, async (assert) => {
	let file = new files.VirtualFile(10);
	let cached = new files.CachedFile(file);
	cached.read(new Uint8Array(4), 3);
	file.write(Uint8Array.of(1, 1, 1, 1, 1, 1, 1, 1, 1, 1), 0);
	cached.write(Uint8Array.of(2, 2), 1);
	assert.equals(cached.read(new Uint8Array(10), 0), Uint8Array.of(1, 2, 2, 0, 0, 0, 0, 1, 1, 1));
	assert.equals(file.read(new Uint8Array(10), 0), Uint8Array.of(1, 2, 2, 1, 1, 1, 1, 1, 1, 1));
});

wtf.test(`It should support writing overlapping the beginning of a cached range (CachedFile).`, async (assert) => {
	let file = new files.VirtualFile(10);
	let cached = new files.CachedFile(file);
	cached.read(new Uint8Array(4), 3);
	file.write(Uint8Array.of(1, 1, 1, 1, 1, 1, 1, 1, 1, 1), 0);
	cached.write(Uint8Array.of(2, 2), 2);
	assert.equals(cached.read(new Uint8Array(10), 0), Uint8Array.of(1, 1, 2, 2, 0, 0, 0, 1, 1, 1));
	assert.equals(file.read(new Uint8Array(10), 0), Uint8Array.of(1, 1, 2, 2, 1, 1, 1, 1, 1, 1));
});

wtf.test(`It should support writing at the beginning of a cached range (CachedFile).`, async (assert) => {
	let file = new files.VirtualFile(10);
	let cached = new files.CachedFile(file);
	cached.read(new Uint8Array(4), 3);
	file.write(Uint8Array.of(1, 1, 1, 1, 1, 1, 1, 1, 1, 1), 0);
	cached.write(Uint8Array.of(2, 2), 3);
	assert.equals(cached.read(new Uint8Array(10), 0), Uint8Array.of(1, 1, 1, 2, 2, 0, 0, 1, 1, 1));
	assert.equals(file.read(new Uint8Array(10), 0), Uint8Array.of(1, 1, 1, 2, 2, 1, 1, 1, 1, 1));
});

wtf.test(`It should support writing embedding into a cached range (CachedFile).`, async (assert) => {
	let file = new files.VirtualFile(10);
	let cached = new files.CachedFile(file);
	cached.read(new Uint8Array(4), 3);
	file.write(Uint8Array.of(1, 1, 1, 1, 1, 1, 1, 1, 1, 1), 0);
	cached.write(Uint8Array.of(2, 2), 4);
	assert.equals(cached.read(new Uint8Array(10), 0), Uint8Array.of(1, 1, 1, 0, 2, 2, 0, 1, 1, 1));
	assert.equals(file.read(new Uint8Array(10), 0), Uint8Array.of(1, 1, 1, 1, 2, 2, 1, 1, 1, 1));
});

wtf.test(`It should support writing at the end of a cached range (CachedFile).`, async (assert) => {
	let file = new files.VirtualFile(10);
	let cached = new files.CachedFile(file);
	cached.read(new Uint8Array(4), 3);
	file.write(Uint8Array.of(1, 1, 1, 1, 1, 1, 1, 1, 1, 1), 0);
	cached.write(Uint8Array.of(2, 2), 5);
	assert.equals(cached.read(new Uint8Array(10), 0), Uint8Array.of(1, 1, 1, 0, 0, 2, 2, 1, 1, 1));
	assert.equals(file.read(new Uint8Array(10), 0), Uint8Array.of(1, 1, 1, 1, 1, 2, 2, 1, 1, 1));
});

wtf.test(`It should support writing overlapping the end of a cached range (CachedFile).`, async (assert) => {
	let file = new files.VirtualFile(10);
	let cached = new files.CachedFile(file);
	cached.read(new Uint8Array(4), 3);
	file.write(Uint8Array.of(1, 1, 1, 1, 1, 1, 1, 1, 1, 1), 0);
	cached.write(Uint8Array.of(2, 2), 6);
	assert.equals(cached.read(new Uint8Array(10), 0), Uint8Array.of(1, 1, 1, 0, 0, 0, 2, 2, 1, 1));
	assert.equals(file.read(new Uint8Array(10), 0), Uint8Array.of(1, 1, 1, 1, 1, 1, 2, 2, 1, 1));
});

wtf.test(`It should support writing just after a cached range (CachedFile).`, async (assert) => {
	let file = new files.VirtualFile(10);
	let cached = new files.CachedFile(file);
	cached.read(new Uint8Array(4), 3);
	file.write(Uint8Array.of(1, 1, 1, 1, 1, 1, 1, 1, 1, 1), 0);
	cached.write(Uint8Array.of(2, 2), 7);
	assert.equals(cached.read(new Uint8Array(10), 0), Uint8Array.of(1, 1, 1, 0, 0, 0, 0, 2, 2, 1));
	assert.equals(file.read(new Uint8Array(10), 0), Uint8Array.of(1, 1, 1, 1, 1, 1, 1, 2, 2, 1));
});

wtf.test(`It should support writing after a cached range (CachedFile).`, async (assert) => {
	let file = new files.VirtualFile(10);
	let cached = new files.CachedFile(file);
	cached.read(new Uint8Array(4), 3);
	file.write(Uint8Array.of(1, 1, 1, 1, 1, 1, 1, 1, 1, 1), 0);
	cached.write(Uint8Array.of(2, 2), 8);
	assert.equals(cached.read(new Uint8Array(10), 0), Uint8Array.of(1, 1, 1, 0, 0, 0, 0, 1, 2, 2));
	assert.equals(file.read(new Uint8Array(10), 0), Uint8Array.of(1, 1, 1, 1, 1, 1, 1, 1, 2, 2));
});

wtf.test(`It should support writing overlapping the beginning and the end of a cached range (CachedFile).`, async (assert) => {
	let file = new files.VirtualFile(10);
	let cached = new files.CachedFile(file);
	cached.read(new Uint8Array(4), 3);
	file.write(Uint8Array.of(1, 1, 1, 1, 1, 1, 1, 1, 1, 1), 0);
	cached.write(Uint8Array.of(2, 2, 2, 2, 2, 2), 2);
	assert.equals(cached.read(new Uint8Array(10), 0), Uint8Array.of(1, 1, 2, 2, 2, 2, 2, 2, 1, 1));
	assert.equals(file.read(new Uint8Array(10), 0), Uint8Array.of(1, 1, 2, 2, 2, 2, 2, 2, 1, 1));
});

wtf.test(`It should not store shallow copies when reading from the file (CachedFile).`, async (assert) => {
	let file = new files.VirtualFile(3);
	let cached = new files.CachedFile(file);
	cached.read(new Uint8Array(1), 1);
	let buffer = new Uint8Array(3);
	cached.read(buffer, 0);
	buffer.set(Uint8Array.of(1, 1, 1), 0);
	assert.equals(cached.read(buffer, 0), Uint8Array.of(0, 0, 0));
});

wtf.test(`It should not store shallow copies when writing to the file (CachedFile).`, async (assert) => {
	let file = new files.VirtualFile(3);
	let cached = new files.CachedFile(file);
	cached.read(new Uint8Array(1), 1);
	let buffer = new Uint8Array(3);
	cached.write(buffer, 0);
	buffer.set(Uint8Array.of(1, 1, 1), 0);
	assert.equals(cached.read(buffer, 0), Uint8Array.of(0, 0, 0));
});

wtf.test(`It should fill the entire buffer when reading from the file (CachedFile).`, async (assert) => {
	let file = new files.VirtualFile(3);
	let cached = new files.CachedFile(file);
	cached.resize(4);
	cached.write(Uint8Array.of(1), 1);
	let buffer = new Uint8Array(1);
	assert.equals(cached.read(buffer, 0), Uint8Array.of(0));
	assert.equals(cached.read(buffer, 1), Uint8Array.of(1));
	assert.equals(cached.read(buffer, 2), Uint8Array.of(0));
	assert.equals(cached.read(buffer, 3), Uint8Array.of(0));
});

wtf.test(`It should fill the entire buffer when reading from the file (DurableFile).`, async (assert) => {
	let bin = new files.VirtualFile(0);
	let log = new files.VirtualFile(0);
	let durable = new files.DurableFile(bin, log);
	durable.resize(4);
	durable.write(Uint8Array.of(1), 1);
	let buffer = new Uint8Array(1);
	assert.equals(durable.read(buffer, 0), Uint8Array.of(0));
	assert.equals(durable.read(buffer, 1), Uint8Array.of(1));
	assert.equals(durable.read(buffer, 2), Uint8Array.of(0));
	assert.equals(durable.read(buffer, 3), Uint8Array.of(0));
});

wtf.test(`It should fill the entire buffer when reading from the file (PagedDurableFile).`, async (assert) => {
	let bin = new files.VirtualFile(0);
	let log = new files.VirtualFile(0);
	let durable = new files.PagedDurableFile(bin, log, 4);
	durable.resize(4);
	durable.write(Uint8Array.of(1), 1);
	let buffer = new Uint8Array(1);
	assert.equals(durable.read(buffer, 0), Uint8Array.of(0));
	assert.equals(durable.read(buffer, 1), Uint8Array.of(1));
	assert.equals(durable.read(buffer, 2), Uint8Array.of(0));
	assert.equals(durable.read(buffer, 3), Uint8Array.of(0));
});

wtf.test(`It should endure through multiple transactions and thousands of operations (DurableFile).`, async (assert) => {
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
	//console.log(`Read: ${(readTime/timesRead).toFixed(3)} ms`);
	//console.log(`Write: ${(writeTime/timesWritten).toFixed(3)} ms`);
	//console.log(`Resize: ${(resizeTime/timesResized).toFixed(3)} ms`);
	//console.log(`Persist: ${(persistTime/timesPersisted).toFixed(3)} ms`);
});

wtf.test(`It should support reading with different overlaps (PagedFile).`, async (assert) => {
	let virtual = new files.VirtualFile(0);
	virtual.write(Uint8Array.of(1, 2, 3, 4, 5), 0);
	for (let i = 0; i < 3; i++) {
		let paged = new files.PagedFile(virtual, 2, i);
		assert.equals(paged.read(new Uint8Array(1), 0), Uint8Array.of(1));
		assert.equals(paged.read(new Uint8Array(1), 1), Uint8Array.of(2));
		assert.equals(paged.read(new Uint8Array(1), 2), Uint8Array.of(3));
		assert.equals(paged.read(new Uint8Array(1), 3), Uint8Array.of(4));
		assert.equals(paged.read(new Uint8Array(1), 4), Uint8Array.of(5));
		assert.equals(paged.read(new Uint8Array(2), 0), Uint8Array.of(1, 2));
		assert.equals(paged.read(new Uint8Array(2), 1), Uint8Array.of(2, 3));
		assert.equals(paged.read(new Uint8Array(2), 2), Uint8Array.of(3, 4));
		assert.equals(paged.read(new Uint8Array(2), 3), Uint8Array.of(4, 5));
		assert.equals(paged.read(new Uint8Array(3), 0), Uint8Array.of(1, 2, 3));
		assert.equals(paged.read(new Uint8Array(3), 1), Uint8Array.of(2, 3, 4));
		assert.equals(paged.read(new Uint8Array(3), 2), Uint8Array.of(3, 4, 5));
		assert.equals(paged.read(new Uint8Array(4), 0), Uint8Array.of(1, 2, 3, 4));
		assert.equals(paged.read(new Uint8Array(4), 1), Uint8Array.of(2, 3, 4, 5));
		assert.equals(paged.read(new Uint8Array(5), 0), Uint8Array.of(1, 2, 3, 4, 5));
	}
});

wtf.test(`It should support writing with different overlaps (PagedFile).`, async (assert) => {
	let virtual = new files.VirtualFile(0);
	virtual.write(Uint8Array.of(1, 2, 3, 4, 5), 0);
	for (let i = 0; i < 3; i++) {
		let paged = new files.PagedFile(virtual, 2, i);
		paged.write(Uint8Array.of(11), 0);
		assert.equals(paged.read(new Uint8Array(1), 0), Uint8Array.of(11));
		paged.write(Uint8Array.of(12), 1);
		assert.equals(paged.read(new Uint8Array(1), 1), Uint8Array.of(12));
		paged.write(Uint8Array.of(13), 2);
		assert.equals(paged.read(new Uint8Array(1), 2), Uint8Array.of(13));
		paged.write(Uint8Array.of(14), 3);
		assert.equals(paged.read(new Uint8Array(1), 3), Uint8Array.of(14));
		paged.write(Uint8Array.of(15), 4);
		assert.equals(paged.read(new Uint8Array(1), 4), Uint8Array.of(15));
		paged.write(Uint8Array.of(21, 22), 0);
		assert.equals(paged.read(new Uint8Array(2), 0), Uint8Array.of(21, 22));
		paged.write(Uint8Array.of(22, 23), 1);
		assert.equals(paged.read(new Uint8Array(2), 1), Uint8Array.of(22, 23));
		paged.write(Uint8Array.of(23, 24), 2);
		assert.equals(paged.read(new Uint8Array(2), 2), Uint8Array.of(23, 24));
		paged.write(Uint8Array.of(24, 25), 3);
		assert.equals(paged.read(new Uint8Array(2), 3), Uint8Array.of(24, 25));
		paged.write(Uint8Array.of(31, 32, 33), 0);
		assert.equals(paged.read(new Uint8Array(3), 0), Uint8Array.of(31, 32, 33));
		paged.write(Uint8Array.of(32, 33, 34), 1);
		assert.equals(paged.read(new Uint8Array(3), 1), Uint8Array.of(32, 33, 34));
		paged.write(Uint8Array.of(33, 34, 35), 2);
		assert.equals(paged.read(new Uint8Array(3), 2), Uint8Array.of(33, 34, 35));
		paged.write(Uint8Array.of(41, 42, 43, 44), 0);
		assert.equals(paged.read(new Uint8Array(4), 0), Uint8Array.of(41, 42, 43, 44));
		paged.write(Uint8Array.of(42, 43, 44, 45), 1);
		assert.equals(paged.read(new Uint8Array(4), 1), Uint8Array.of(42, 43, 44, 45));
		paged.write(Uint8Array.of(51, 52, 53, 54, 55), 0);
		assert.equals(paged.read(new Uint8Array(5), 0), Uint8Array.of(51, 52, 53, 54, 55));
	}
});
