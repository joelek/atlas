export class BufferTooShortError extends Error {
	readonly length: number;

	constructor(length: number) {
		super();
		this.length = length;
	}

	toString(): string {
		return `Expected buffer with length ${this.length} to contain additional bytes!`;
	}
};

export class BufferOverflowError extends Error {
	readonly length: number;

	constructor(length: number) {
		super();
		this.length = length;
	}

	toString(): string {
		return `Expected buffer with length ${this.length} to not overflow!`;
	}
};

export class InvalidBitLengthError extends Error {
	readonly length: number;

	constructor(length: number) {
		super();
		this.length = length;
	}

	toString(): string {
		return `Expected the bit length of ${this.length} to be between 1 and 32!`;
	}
};

export class BitReader {
	protected buffer: Uint8Array;
	protected offset: number;
	protected current_byte: number;
	protected mask: number;

	constructor(buffer: Uint8Array) {
		this.buffer = buffer;
		this.offset = 0;
		this.current_byte = 0;
		this.mask = 0b00000000;
	}

	decode_bits(width: number): number {
		let value = 0;
		for (let bit = 0; bit < width; bit += 1) {
			if (this.mask === 0b00000000) {
				let current_byte = this.buffer.at(this.offset);
				if (current_byte == null) {
					throw new BufferTooShortError(this.buffer.length);
				}
				this.current_byte = current_byte;
				this.offset += 1;
				this.mask = 0b10000000;
			}
			value = (value << 1) | ((this.current_byte & this.mask) ? 1 : 0);
			this.mask >>>= 1;
		}
		return value;
	}

	get_bit_count(): number {
		return this.buffer.length * 8;
	}
};

export class BitWriter {
	protected buffer: Uint8Array;
	protected offset: number;
	protected current_byte: number;
	protected bits_in_byte: number;

	constructor(max_length: number) {
		this.buffer = new Uint8Array(max_length);
		this.offset = 0;
		this.current_byte = 0;
		this.bits_in_byte = 0;
	}

	append_bits(value: number, width: number): void {
		if (width < 0 || width > 32) {
			throw new InvalidBitLengthError(width);
		}
		let mask = (1 << (width - 1));
		for (let bit = 0; bit < width; bit += 1) {
			this.current_byte |= ((value & mask) ? 1 : 0) << (8 - this.bits_in_byte - 1);
			this.bits_in_byte += 1;
			if (this.bits_in_byte === 8) {
				this.flush_bits();
			}
			mask >>>= 1;
		}
	}

	append_one(): void {
		this.current_byte |= 1 << (8 - this.bits_in_byte - 1);
		this.bits_in_byte += 1;
		if (this.bits_in_byte === 8) {
			this.flush_bits();
		}
	}

	append_zero(): void {
		this.bits_in_byte += 1;
		if (this.bits_in_byte == 8) {
			this.flush_bits();
		}
	}

	flush_bits(): void {
		if (this.bits_in_byte > 0) {
			if (this.offset >= this.buffer.length) {
				throw new BufferOverflowError(this.buffer.length);
			}
			this.buffer[this.offset] = this.current_byte;
			this.offset += 1;
			this.current_byte = 0;
			this.bits_in_byte = 0;
		}
	}

	get_bit_count(): number {
		return this.offset * 8 + this.bits_in_byte;
	}

	get_buffer(): Uint8Array {
		this.flush_bits();
		return this.buffer.subarray(0, this.offset);
	}
};

function encode_value_using_exponential_golomb_coding(value: number, k: number, bitwriter: BitWriter) {
	let power = 1 << k;
	let exponential_value = value + power;
	let width = 32 - Math.clz32(exponential_value);
	bitwriter.append_bits(0, width - 1 - k);
	bitwriter.append_bits(exponential_value, width);
};

function decode_value_using_exponential_golomb_coding(k: number, bitreader: BitReader): number {
	let power = 1 << k;
	let width = k + 1;
	let exponential_value = 0;
	while (true) {
		exponential_value = bitreader.decode_bits(1);
		if (exponential_value !== 0) {
			break;
		}
		width += 1;
	}
	width -= 1;
	if (width > 0) {
		exponential_value = (exponential_value << width) | bitreader.decode_bits(width);
	}
	let value = exponential_value - power;
	return value;
};

function compress_data_using_rle_coding(buffer: Uint8Array): Uint8Array | undefined {
	try {
		let bitwriter = new BitWriter(buffer.length);
		let offset = 0;
		while (offset < buffer.length) {
			let raw_length = 1;
			for (let byte_index = offset + 1; byte_index < buffer.length; byte_index += 1) {
				if (buffer[byte_index] !== buffer[byte_index - 1]) {
					raw_length += 1;
				} else {
					raw_length -= 1;
					break;
				}
			}
			if (raw_length > 0) {
				bitwriter.append_zero();
				encode_value_using_exponential_golomb_coding(raw_length - 1, 0, bitwriter);
				for (let byte_index = offset; byte_index < offset + raw_length; byte_index += 1) {
					bitwriter.append_bits(buffer[byte_index], 8);
				}
				offset += raw_length;
			}
			let run_length = 1;
			for (let byte_index = offset + 1; byte_index < buffer.length; byte_index += 1) {
				if (buffer[byte_index] === buffer[byte_index - 1]) {
					run_length += 1;
				} else {
					break;
				}
			}
			if (run_length > 1) {
				bitwriter.append_one();
				encode_value_using_exponential_golomb_coding(run_length - 2, 0, bitwriter);
				bitwriter.append_bits(buffer[offset], 8);
				offset += run_length;
			}
		}
		bitwriter.flush_bits();
		return bitwriter.get_buffer();
	} catch (error) {
		if (error instanceof BufferOverflowError) {
			return;
		}
		throw error;
	}
};

function decompress_data_using_rle_coding(buffer: Uint8Array): Uint8Array | undefined {
	try {
		let bitreader = new BitReader(buffer);
		let offset = 0;
		let chunks = [] as Array<Uint8Array>;
		while (offset < buffer.length) {
			let control = bitreader.decode_bits(1);
			if (control) {
				let run_length = 2 + decode_value_using_exponential_golomb_coding(0, bitreader);
				let byte = bitreader.decode_bits(8);
				for (let byte_count = 0; byte_count < run_length; byte_count += 1) {
					let chunk_index = offset >>> 8;
					let byte_index = offset & 255;
					if (chunk_index >= chunks.length) {
						chunks.push(new Uint8Array(256));
					}
					chunks[chunk_index][byte_index] = byte;
					offset += 1;
				}
			} else {
				let raw_length = 1 + decode_value_using_exponential_golomb_coding(0, bitreader);
				for (let byte_count = 0; byte_count < raw_length; byte_count += 1) {
					let byte = bitreader.decode_bits(8);
					let chunk_index = offset >>> 8;
					let byte_index = offset & 255;
					if (chunk_index >= chunks.length) {
						chunks.push(new Uint8Array(256));
					}
					chunks[chunk_index][byte_index] = byte;
					offset += 1;
				}
			}
		}
		let combined_chunks = new Uint8Array(chunks.length * 256);
		for (let chunk_index = 0; chunk_index < chunks.length; chunk_index += 1) {
			combined_chunks.set(chunks[chunk_index], chunk_index * 256);
		}
		return combined_chunks.subarray(0, offset);
	} catch (error) {
		if (error instanceof BufferTooShortError) {
			return;
		}
		throw error;
	}
};

export const RLECompressor = {
	compress: compress_data_using_rle_coding,
	decompress: decompress_data_using_rle_coding
};
