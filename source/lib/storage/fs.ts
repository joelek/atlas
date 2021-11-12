import * as libfs from "fs";
import * as libpath from "path";

export function open(filename: string): number {
	let exists = libfs.existsSync(filename);
	libfs.mkdirSync(libpath.dirname(filename), { recursive: true });
	let fd = libfs.openSync(filename, exists ? "r+" : "w+");
	return fd;
};

export function read(fd: number, buffer: Buffer, offset: number): Buffer {
	let length = buffer.length;
	let bytes = libfs.readSync(fd, buffer, {
		position: offset
	});
	if (bytes !== length) {
		throw `Expected to read ${length} bytes but read ${bytes}!`;
	}
	return buffer;
};

export function size(fd: number): number {
	return libfs.fstatSync(fd).size;
};

export function sync(fd: number): void {
	libfs.fsyncSync(fd);
};

export function truncate(fd: number, length: number): void {
	libfs.ftruncateSync(fd, length);
};

export function write(fd: number, buffer: Buffer, offset: number): Buffer {
	let length = buffer.length;
	let bytes = libfs.writeSync(fd, buffer, 0, length, offset);
	if (bytes !== length) {
		throw `Expected to write ${length} bytes but wrote ${bytes}!`;
	}
	return buffer;
};
