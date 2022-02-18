import * as stdlib from "@joelek/ts-stdlib";
import * as libfs from "fs";
import * as libpath from "path";
import * as asserts from "../asserts";
import { Cache } from "../storage";
import { DEBUG } from "../env";
import { LogDeltaHeader, LogHeader } from "./chunks";

export abstract class File {
	constructor() {}

	clear(): void {
		this.resize(0);
	}

	abstract discard(): void;
	abstract persist(): void;
	abstract read(buffer: Uint8Array, offset: number): Uint8Array;
	abstract resize(size: number): void;
	abstract size(): number;
	abstract write(buffer: Uint8Array, offset: number): Uint8Array;
};

export class CachedFile extends File {
	private file: File;
	private tree: stdlib.collections.avl.Tree<Uint8Array>;
	private cache: Cache<number, Uint8Array>;

	constructor(file: File, maxWeight?: number) {
		super();
		this.file = file;
		this.tree = new stdlib.collections.avl.Tree<Uint8Array>();
		this.cache = new Cache<number, Uint8Array>({
			getWeightForValue: (value) => 64 + value.length,
			onInsert: (key, value) => this.tree.insert(key, value),
			onRemove: (key) => this.tree.remove(key)
		}, maxWeight);
	}

	discard(): void {
		this.file.discard();
		this.tree.clear();
		this.cache.clear();
	}

	persist(): void {
		this.file.persist();
	}

	read(buffer: Uint8Array, offset: number): Uint8Array {
		if (DEBUG) asserts.IntegerAssert.atLeast(0, offset);
		let current = offset;
		let bytes = 0;
		let end = offset + buffer.length;
		let entry = this.tree.locate({ operator: "<=", key: offset });
		if (entry != null) {
			let distance = current - entry.key;
			let overlap = Math.min(entry.value.length - distance, buffer.length);
			if (overlap > 0) {
				buffer.set(entry.value.subarray(distance, distance + overlap), bytes);
				current += overlap;
				bytes += overlap;
			}
		}
		if (current >= end) {
			return buffer;
		}
		let entries = Array.from(this.tree.filter({ operator: ">", key: offset }, { operator: "<", key: end }));
		for (let entry of entries) {
			let gap = entry.key - current;
			if (gap > 0) {
				let value = buffer.subarray(bytes, bytes + gap);
				let distance = this.file.size() - current;
				if (distance > 0) {
					this.file.read(value.subarray(0, distance), current);
				}
				this.cache.insert(current, value);
				current += gap;
				bytes += gap;
			}
			let overlap = Math.min(entry.value.length, end - current);
			buffer.set(entry.value.subarray(0, overlap), bytes);
			current += overlap;
			bytes += overlap;
		}
		let gap = end - current;
		if (gap > 0) {
			let value = buffer.subarray(bytes, bytes + gap);
			let distance = this.file.size() - current;
			if (distance > 0) {
				this.file.read(value.subarray(0, distance), current);
			}
			this.cache.insert(current, value);
			current += gap;
			bytes += gap;
		}
		return buffer;
	}

	resize(size: number): void {
		if (DEBUG) asserts.IntegerAssert.atLeast(0, size);
		this.file.resize(size);
		let entry = this.tree.locate({ operator: "<", key: size });
		if (entry != null) {
			let distance = size - entry.key;
			let overlap = entry.value.length - distance;
			if (overlap > 0) {
				let value = entry.value.subarray(0, distance);
				this.cache.insert(entry.key, value);
			}
		}
		let entries = Array.from(this.tree.filter({ operator: ">=", key: size }));
		for (let entry of entries) {
			this.cache.remove(entry.key);
		}
	}

	size(): number {
		return this.file.size();
	}

	write(buffer: Uint8Array, offset: number): Uint8Array {
		if (DEBUG) asserts.IntegerAssert.atLeast(0, offset);
		this.file.write(buffer, offset);
		let current = offset;
		let bytes = 0;
		let end = offset + buffer.length;
		let entry = this.tree.locate({ operator: "<=", key: offset });
		if (entry != null) {
			let distance = current - entry.key;
			let overlap = Math.min(entry.value.length - distance, buffer.length);
			if (overlap > 0) {
				entry.value.set(buffer.subarray(bytes, bytes + overlap), distance);
				current += overlap;
				bytes += overlap;
			}
		}
		if (current >= end) {
			return buffer;
		}
		let entries = Array.from(this.tree.filter({ operator: ">", key: offset }, { operator: "<", key: end }));
		for (let entry of entries) {
			let gap = entry.key - current;
			if (gap > 0) {
				let value = buffer.slice(bytes, bytes + gap);
				this.cache.insert(current, value);
				current += gap;
				bytes += gap;
			}
			let overlap = Math.min(entry.value.length, end - current);
			entry.value.set(buffer.subarray(bytes, bytes + overlap), 0);
			current += overlap;
			bytes += overlap;
		}
		let gap = end - current;
		if (gap > 0) {
			let value = buffer.slice(bytes, bytes + gap);
			this.cache.insert(current, value);
			current += gap;
			bytes += gap;
		}
		return buffer;
	}
};

type LogDelta = {
	header: LogDeltaHeader;
	redo: Uint8Array;
	undo: Uint8Array;
};

export class DurableFile extends File {
	private bin: File;
	private log: File;
	private header: LogHeader;
	private tree: stdlib.collections.avl.Tree<number>;

	private readDelta(offset: number): LogDelta {
		let header = new LogDeltaHeader();
		header.read(this.log, offset);
		offset += LogDeltaHeader.LENGTH;
		let length = header.length();
		let redo = new Uint8Array(length);
		this.log.read(redo, offset);
		offset += length;
		let undo = new Uint8Array(length);
		this.log.read(undo, offset);
		offset += length;
		let delta: LogDelta = {
			header,
			redo,
			undo
		};
		return delta;
	}

	private writeDelta(delta: LogDelta, offset: number): void {
		delta.header.write(this.log, offset);
		offset += LogDeltaHeader.LENGTH;
		this.log.write(delta.redo, offset);
		offset += delta.redo.length;
		this.log.write(delta.undo, offset);
		offset += delta.undo.length;
	}

	private appendRedo(redo: Uint8Array, offset: number): void {
		let header = new LogDeltaHeader();
		header.offset(offset);
		header.length(redo.length);
		let undo = new Uint8Array(redo.length);
		let distance = this.bin.size() - offset;
		if (distance > 0) {
			this.bin.read(undo.subarray(0, distance), offset);
		}
		let delta: LogDelta = {
			header,
			undo,
			redo
		};
		this.tree.insert(offset, this.log.size());
		this.writeDelta(delta, this.log.size());
		this.header.redoSize(Math.max(this.header.redoSize(), offset + redo.length));
		this.header.write(this.log, 0);
	}

	private redo(): void {
		let redoSize = this.header.redoSize();
		let entries = this.tree.filter({ operator: "<", key: redoSize });
		for (let entry of entries) {
			let delta = this.readDelta(entry.value);
			this.bin.write(delta.redo, entry.key);
		}
		this.bin.resize(redoSize);
		this.bin.persist();
		this.discard();
	}

	private undo(): void {
		let undoSize = this.header.undoSize();
		let entries = this.tree.filter({ operator: "<", key: undoSize });
		for (let entry of entries) {
			let delta = this.readDelta(entry.value);
			this.bin.write(delta.undo, entry.key);
		}
		this.bin.resize(undoSize);
		this.bin.persist();
		this.discard();
	}

	constructor(bin: File, log: File) {
		super();
		this.bin = bin;
		this.log = log;
		this.header = new LogHeader();
		this.header.redoSize(this.bin.size());
		this.header.undoSize(this.bin.size());
		this.tree = new stdlib.collections.avl.Tree<number>();
		if (log.size() === 0) {
			this.header.write(this.log, 0);
		} else {
			let offset = 0;
			this.header.read(this.log, offset);
			offset += LogHeader.LENGTH;
			// A corrupted log should be discarded since it is persisted before and after bin is persisted.
			try {
				while (offset < this.log.size()) {
					let header = new LogDeltaHeader();
					header.read(this.log, offset);
					this.tree.insert(header.offset(), offset);
					let length = header.length();
					offset += LogDeltaHeader.LENGTH + length + length;
				}
				this.undo();
			} catch (error) {
				this.discard();
			}
		}
	}

	discard(): void {
		if (this.tree.length() > 0) {
			this.log.clear();
			this.header.redoSize(this.bin.size());
			this.header.undoSize(this.bin.size());
			this.header.write(this.log, 0);
			this.log.persist();
			this.tree.clear();
		}
	}

	persist(): void {
		if (this.tree.length() > 0) {
			this.log.persist();
			this.redo();
		}
	}

	read(buffer: Uint8Array, offset: number): Uint8Array {
		if (DEBUG) asserts.IntegerAssert.atLeast(0, offset);
		let current = offset;
		let bytes = 0;
		let end = offset + buffer.length;
		let entry = this.tree.locate({ operator: "<=", key: offset });
		if (entry != null) {
			let delta = this.readDelta(entry.value);
			let distance = current - delta.header.offset();
			let overlap = Math.min(delta.header.length() - distance, buffer.length);
			if (overlap > 0) {
				buffer.set(delta.redo.subarray(distance, distance + overlap), bytes);
				current += overlap;
				bytes += overlap;
			}
		}
		if (current >= end) {
			return buffer;
		}
		let entries = this.tree.filter({ operator: ">", key: offset }, { operator: "<", key: end });
		for (let entry of entries) {
			let gap = entry.key - current;
			if (gap > 0) {
				let redo = buffer.subarray(bytes, bytes + gap);
				let distance = this.bin.size() - current;
				if (distance > 0) {
					this.bin.read(redo.subarray(0, distance), current);
				}
				current += gap;
				bytes += gap;
			}
			let delta = this.readDelta(entry.value);
			let overlap = Math.min(delta.header.length(), end - current);
			buffer.set(delta.redo.subarray(0, overlap), bytes);
			current += overlap;
			bytes += overlap;
		}
		let gap = end - current;
		if (gap > 0) {
			let redo = buffer.subarray(bytes, bytes + gap);
			let distance = this.bin.size() - current;
			if (distance > 0) {
				this.bin.read(redo.subarray(0, distance), current);
			}
			current += gap;
			bytes += gap;
		}
		return buffer;
	}

	resize(size: number): void {
		if (DEBUG) asserts.IntegerAssert.atLeast(0, size);
		let entry = this.tree.locate({ operator: "<", key: size });
		if (entry != null) {
			let delta = this.readDelta(entry.value);
			let distance = size - delta.header.offset();
			let overlap = delta.header.length() - distance;
			if (overlap > 0) {
				this.tree.remove(entry.key);
				let redo = delta.redo.subarray(0, distance);
				this.appendRedo(redo, entry.key);
			}
		}
		let entries = Array.from(this.tree.filter({ operator: ">=", key: size }));
		for (let entry of entries) {
			this.tree.remove(entry.key);
		}
		this.header.redoSize(size);
		this.header.write(this.log, 0);
	}

	size(): number {
		return this.header.redoSize();
	}

	write(buffer: Uint8Array, offset: number): Uint8Array {
		if (DEBUG) asserts.IntegerAssert.atLeast(0, offset);
		let current = offset;
		let bytes = 0;
		let end = offset + buffer.length;
		let entry = this.tree.locate({ operator: "<=", key: offset });
		if (entry != null) {
			let delta = this.readDelta(entry.value);
			let distance = current - delta.header.offset();
			let overlap = Math.min(delta.header.length() - distance, buffer.length);
			if (overlap > 0) {
				delta.redo.set(buffer.subarray(bytes, bytes + overlap), distance);
				this.writeDelta(delta, entry.value);
				current += overlap;
				bytes += overlap;
			}
		}
		if (current >= end) {
			return buffer;
		}
		let entries = Array.from(this.tree.filter({ operator: ">", key: offset }, { operator: "<", key: end }));
		for (let entry of entries) {
			let gap = entry.key - current;
			if (gap > 0) {
				let redo = buffer.subarray(bytes, bytes + gap);
				this.appendRedo(redo, current);
				current += gap;
				bytes += gap;
			}
			let delta = this.readDelta(entry.value);
			let overlap = Math.min(delta.header.length(), end - current);
			delta.redo.set(buffer.subarray(bytes, bytes + overlap), 0);
			this.writeDelta(delta, entry.value);
			current += overlap;
			bytes += overlap;
		}
		let gap = end - current;
		if (gap > 0) {
			let redo = buffer.subarray(bytes, bytes + gap);
			this.appendRedo(redo, current);
			current += gap;
			bytes += gap;
		}
		return buffer;
	}
};

export class PhysicalFile extends File {
	private fd: number;

	constructor(filename: string, clear?: boolean) {
		super();
		libfs.mkdirSync(libpath.dirname(filename), { recursive: true });
		this.fd = libfs.openSync(filename, libfs.existsSync(filename) ? "r+" : "w+");
		if (clear) {
			this.clear();
		}
	}

	discard(): void {
		throw `Expected discard() to be delegated to another implementation!`;
	}

	persist(): void {
		return libfs.fsyncSync(this.fd);
	}

	read(buffer: Uint8Array, offset: number): Uint8Array {
		if (DEBUG) asserts.IntegerAssert.atLeast(0, offset);
		let bytesRead = libfs.readSync(this.fd, buffer, {
			position: offset
		});
		if (bytesRead !== buffer.length) {
			throw `Expected to read ${buffer.length} bytes but ${bytesRead} bytes were read!`;
		}
		return buffer;
	}

	resize(size: number): void {
		if (DEBUG) asserts.IntegerAssert.atLeast(0, size);
		return libfs.ftruncateSync(this.fd, size);
	}

	size(): number {
		return libfs.fstatSync(this.fd).size;
	}

	write(buffer: Uint8Array, offset: number): Uint8Array {
		if (DEBUG) asserts.IntegerAssert.atLeast(0, offset);
		let bytesWritten = libfs.writeSync(this.fd, buffer, 0, buffer.length, offset);
		if (bytesWritten !== buffer.length) {
			throw `Expected to write ${buffer.length} bytes but ${bytesWritten} bytes were written!`;
		}
		return buffer;
	}
};

export class VirtualFile extends File {
	private backup: Uint8Array;
	private buffer: Uint8Array;

	constructor(size: number) {
		super();
		if (DEBUG) asserts.IntegerAssert.atLeast(0, size);
		this.backup = new Uint8Array(size);
		this.buffer = new Uint8Array(size);
	}

	discard(): void {
		this.buffer = new Uint8Array(this.backup.length);
		this.buffer.set(this.backup, 0);
	}

	persist(): void {
		this.backup = new Uint8Array(this.buffer.length);
		this.backup.set(this.buffer, 0);
	}

	read(buffer: Uint8Array, offset: number): Uint8Array {
		if (DEBUG) asserts.IntegerAssert.atLeast(0, offset);
		let minSize = offset + buffer.length;
		let size = this.size();
		if (size < minSize) {
			throw `Expected to read ${buffer.length} bytes at offset ${offset} from a total of ${size}!`;
		}
		buffer.set(this.buffer.subarray(offset, offset + buffer.length), 0);
		return buffer;
	}

	resize(size: number): void {
		if (DEBUG) asserts.IntegerAssert.atLeast(0, size);
		let buffer = new Uint8Array(size);
		buffer.set(this.buffer.subarray(0, Math.min(size, this.size())), 0);
		this.buffer = buffer;
	}

	size(): number {
		return this.buffer.length;
	}

	write(buffer: Uint8Array, offset: number): Uint8Array {
		if (DEBUG) asserts.IntegerAssert.atLeast(0, offset);
		let minSize = offset + buffer.length;
		let size = this.size();
		if (size < minSize) {
			this.resize(minSize);
		}
		this.buffer.set(buffer, offset);
		return buffer;
	}
};