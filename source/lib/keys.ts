import { IntegerAssert } from "./asserts";
import { DEBUG } from "./env";

export type KeyPart = Buffer;
export type Key = Array<KeyPart>;
export type PathPart = Array<number>;
export type Path = Array<PathPart>;

export function compareKeyPart(one: KeyPart, two: KeyPart): number {
	return one.compare(two);
};

export function compareKey(one: Key, two: Key): number {
	if (one.length < two.length) {
		return -1;
	}
	if (one.length > two.length) {
		return 1;
	}
	for (let i = 0; i < one.length; i++) {
		let comparison = compareKeyPart(one[i], two[i]);
		if (comparison !== 0) {
			return comparison;
		}
	}
	return 0;
};

export function comparePathPart(one: PathPart, two: PathPart): number {
	if (one.length < two.length) {
		return -1;
	}
	if (one.length > two.length) {
		return 1;
	}
	for (let i = 0; i < one.length; i++) {
		let comparison = one[i] - two[i];
		if (comparison !== 0) {
			return comparison;
		}
	}
	return 0;
};

export function comparePath(one: Path, two: Path): number {
	if (one.length < two.length) {
		return -1;
	}
	if (one.length > two.length) {
		return 1;
	}
	for (let i = 0; i < one.length; i++) {
		let comparison = comparePathPart(one[i], two[i]);
		if (comparison !== 0) {
			return comparison;
		}
	}
	return 0;
};

export function isPathPrefix(one: Path, two: Path): boolean {
	if (one.length > two.length) {
		return false;
	}
	for (let i = 0; i < one.length; i++) {
		if (i < one.length - 1) {
			if (comparePathPart(one[i], two[i]) !== 0) {
				return false;
			}
		} else {
			if (comparePathPart(one[i], two[i]) > 0) {
				return false;
			}
		}
	}
	return true;
};

export function computeCommonPrefixLength(one: PathPart, two: PathPart): number {
	let length = Math.min(one.length, two.length);
	for (let i = 0; i < length; i++) {
		if (one[i] !== two[i]) {
			return i;
		}
	}
	return length;
};

export function getNibblesFromBytes(buffer: Buffer): Array<number> {
	let nibbles = new Array<number>();
	for (let byte of buffer) {
		let one = (byte >> 4) & 0x0F;
		let two = (byte >> 0) & 0x0F;
		nibbles.push(one, two);
	}
	return nibbles;
};

export function getBytesFromNibbles(nibbles: Array<number>): Buffer {
	if (DEBUG) IntegerAssert.exactly(nibbles.length % 2, 0);
	let bytes = new Array<number>();
	for (let i = 0; i < nibbles.length; i += 2) {
		let one = nibbles[i + 0];
		if (DEBUG) IntegerAssert.between(0, one, 15);
		let two = nibbles[i + 1];
		if (DEBUG) IntegerAssert.between(0, two, 15);
		let byte = (one << 4) | (two << 0);
		bytes.push(byte);
	}
	return Buffer.from(bytes);
};

export function getKeyFromPath(path: Path): Key {
	return path.map(getBytesFromNibbles);
};
