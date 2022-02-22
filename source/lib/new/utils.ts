import * as bedrock from "@joelek/bedrock";
import * as asserts from "../../mod/asserts";
import { DEBUG } from "./env";

export type Encoding = "hex" | "base64" | "base64url" | "binary" | "utf-8";

export type Endian = "big" | "little";

export class Binary {
	private constructor() {}

	static string(buffer: Uint8Array, offset: number, length: number, encoding: Encoding, value?: string): string {
		if (DEBUG) asserts.IntegerAssert.between(0, offset, buffer.byteLength - 1);
		if (DEBUG) asserts.IntegerAssert.between(0, length, buffer.byteLength - offset);
		if (value == null) {
			let subarray = buffer.subarray(offset, offset + length);
			let value = bedrock.utils.Chunk.toString(subarray, encoding).replace(/[\0]*$/g, "");
			return value;
		} else {
			let encoded = bedrock.utils.Chunk.fromString(value, encoding);
			if (DEBUG) asserts.IntegerAssert.between(0, encoded.byteLength, length);
			buffer.set(encoded, offset);
			buffer.fill(0, offset + encoded.length, offset + length);
			return value;
		}
	}

	static boolean(buffer: Uint8Array, offset: number, bit: number, value?: boolean): boolean {
		if (DEBUG) asserts.IntegerAssert.between(0, bit, 7);
		if (DEBUG) asserts.IntegerAssert.between(0, offset, buffer.byteLength - 1);
		if (value == null) {
			let byte = buffer[offset];
			let value = ((byte >> bit) & 0x01) === 0x01;
			return value;
		} else {
			let byte = buffer[offset];
			buffer[offset] = (byte & ~(1 << bit)) | ((~~value) << bit);
			return value;
		}
	}

	static signed(buffer: Uint8Array, offset: number, length: number, value?: number, endian?: Endian): number {
		if (DEBUG) asserts.IntegerAssert.between(1, length, 6);
		let bias = 2 ** (length * 8 - 1);
		if (value == null) {
			let value = this.unsigned(buffer, offset, length, undefined, endian);
			if (value >= bias) {
				value -= bias + bias;
			}
			return value;
		} else {
			let copy = value;
			if (copy < 0) {
				copy += bias + bias;
			}
			this.unsigned(buffer, offset, length, copy, endian);
			return value;
		}
	}

	static unsigned(buffer: Uint8Array, offset: number, length: number, value?: number, endian?: Endian): number {
		if (DEBUG) asserts.IntegerAssert.between(1, length, 6);
		if (DEBUG) asserts.IntegerAssert.between(0, offset, buffer.byteLength - length);
		if (value == null) {
			let value = 0;
			for (let i = 0; i < length; i++) {
				value *= 256;
				if (endian === "little") {
					value += buffer[offset + length - 1 - i];
				} else {
					value += buffer[offset + i];
				}
			}
			return value;
		} else {
			if (DEBUG) asserts.IntegerAssert.between(0, value, 2 ** (8 * length) - 1);
			let copy = value;
			for (let i = 0; i < length; i++) {
				if (endian === "little") {
					buffer[offset + i] = copy % 256;
				} else {
					buffer[offset + length - 1 - i] = copy % 256;
				}
				copy = Math.floor(copy / 256);
			}
			return value;
		}
	}
};

export class PromiseQueue {
	private lock: Promise<any>;
	private open: boolean;

	constructor() {
		this.lock = Promise.resolve();
		this.open = true;
	}

	close(): void {
		this.open = false;
	}

	enqueue<A>(operation: Promise<A> | (() => Promise<A>) | (() => A)): Promise<A> {
		if (!this.open) {
			throw `Expected queue to be open!`;
		}
		return this.lock = this.lock
			.then(operation instanceof Promise ? () => operation : operation);
	}
};
