export interface Readable {
	read(buffer: Uint8Array, offset: number): Uint8Array;
};

export interface Writable {
	write(buffer: Uint8Array, offset: number): Uint8Array;
};

export abstract class Chunk {
	protected buffer: Uint8Array;

	constructor(buffer: Uint8Array) {
		this.buffer = buffer;
	}

	read(readable: Readable, offset: number): void {
		readable.read(this.buffer, offset);
	}

	write(writable: Writable, offset: number): void {
		writable.write(this.buffer, offset);
	}
};
