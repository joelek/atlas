import { IntegerAssert } from "../mod/asserts";
import { BlockManager } from "./blocks";
import { Chunk } from "./chunks";
import { Binary } from "./utils";
import { DEBUG } from "./variables";

export type Relationship = "^=" | "=" | ">" | ">=" | "<" | "<=";

export type Direction = "increasing" | "decreasing";

export function computeCommonPrefixLength(one: Array<number>, two: Array<number>): number {
	let length = Math.min(one.length, two.length);
	for (let i = 0; i < length; i++) {
		if (one[i] !== two[i]) {
			return i;
		}
	}
	return length;
};

export function getNibblesFromBytes(buffer: Uint8Array): Array<number> {
	let nibbles = new Array<number>();
	for (let byte of buffer) {
		let one = (byte >> 4) & 0x0F;
		let two = (byte >> 0) & 0x0F;
		nibbles.push(one, two);
	}
	return nibbles;
};

export function getBytesFromNibbles(nibbles: Array<number>): Uint8Array {
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
	return Uint8Array.from(bytes);
};

export class NodeHead extends Chunk {
	private nibbles(offset: number, length: number, value?: Array<number>): Array<number> {
		if (value != null) {
			if (DEBUG) IntegerAssert.between(0, value.length, (length - 1) * 2);
			let nibbles = [value.length, ...value];
			if ((nibbles.length % 2) === 1) {
				nibbles.push(0);
			}
			let bytes = getBytesFromNibbles(nibbles);
			if (DEBUG) IntegerAssert.between(0, bytes.length, length);
			this.buffer.set(bytes, offset);
			this.buffer.fill(0, offset + bytes.length, offset + length);
			return value;
		} else {
			let bytes = this.buffer.subarray(offset, offset + length);
			let nibbles = getNibblesFromBytes(bytes);
			return nibbles.slice(1, 1 + nibbles[0]);
		}
	}

	constructor(buffer?: Uint8Array) {
		super(buffer ?? new Uint8Array(NodeHead.LENGTH));
		if (DEBUG) IntegerAssert.exactly(this.buffer.length, NodeHead.LENGTH);
	}

	prefix(value?: Array<number>): Array<number> {
		return this.nibbles(0, 14, value);
	}

	resident(value?: number): number {
		return Binary.unsigned(this.buffer, 14, 6, value);
	}

	subtree(value?: number): number {
		return Binary.unsigned(this.buffer, 20, 6, value);
	}

	total(value?: number): number {
		return Binary.unsigned(this.buffer, 26, 6, value);
	}

	static readonly LENGTH = 32;
	static readonly MAX_PREFIX_NIBBLES = (14 - 1) * 2;
};

export class NodeBody extends Chunk {
	constructor(buffer?: Uint8Array) {
		super(buffer ?? new Uint8Array(NodeBody.LENGTH));
		if (DEBUG) IntegerAssert.exactly(this.buffer.length, NodeBody.LENGTH);
	}

	child(index: number, value?: number): number {
		if (DEBUG) IntegerAssert.between(0, index, 15);
		return Binary.unsigned(this.buffer, index * 6, 6, value);
	}

	static readonly OFFSET = NodeHead.LENGTH;
	static readonly LENGTH = 16 * 6;
};

export class RadixTreeWalker {
	private blockManager: BlockManager;
	private relationship: Relationship;
	private keys: Array<Array<number>>;
	private directions: Array<Direction>;

	private * doYield(bid: number, depth: number, relationship: Relationship, reverse: boolean, include: { resident: boolean, subtree: boolean, children: boolean }): Iterable<number> {
		let iterables = [] as Array<Iterable<number>>;
		if (include.resident || include.subtree) {
			let head = new NodeHead();
			this.blockManager.readBlock(bid, head.buffer, 0);
			if (include.resident) {
				let resident = head.resident();
				if (resident !== 0) {
					iterables.push([resident]);
				}
			}
			if (include.subtree) {
				let subtree = head.subtree();
				if (subtree !== 0) {
					let reverse = this.directions[depth + 1] === "decreasing";
					let relationship = this.relationship;
					if (reverse) {
						if (relationship === "<") {
							relationship = ">";
						} else if (relationship === "<=") {
							relationship = ">=";
						} else if (relationship === ">") {
							relationship = "<";
						} else if (relationship === ">=") {
							relationship = "<=";
						}
					}
					iterables.push(this.doYield(subtree, depth + 1, relationship, reverse, { resident: true, subtree: true, children: true }));
				}
			}
		}
		if (include.children) {
			if (this.blockManager.getBlockSize(bid) >= NodeHead.LENGTH + NodeBody.LENGTH) {
				let body = new NodeBody();
				this.blockManager.readBlock(bid, body.buffer, NodeBody.OFFSET);
				for (let i = 0; i < 16; i++) {
					let child = body.child(i);
					if (child !== 0) {
						iterables.push(this.doYield(child, depth, relationship, reverse, { resident: true, subtree: true, children: true }));
					}
				}
			}
		}
		for (let iterable of reverse ? iterables.reverse() : iterables) {
			yield * iterable;
		}
	}

	private * onKeyIsNodeKey(bid: number, depth: number, relationship: Relationship, reverse: boolean): Iterable<number> {
		let iterables = [] as Array<Iterable<number>>;
		if (relationship === "^=") {
			if (depth === this.keys.length - 1) {
				iterables.push(this.doYield(bid, depth, relationship, reverse, { resident: true, subtree: true, children: true }));
			} else {
				let head = new NodeHead();
				this.blockManager.readBlock(bid, head.buffer, 0);
				let subtree = head.subtree();
				if (subtree !== 0) {
					iterables.push(this.doTraverse(subtree, depth + 1));
				}
			}
		} else if (relationship === "=") {
			if (depth === this.keys.length - 1) {
				iterables.push(this.doYield(bid, depth, relationship, reverse, { resident: true, subtree: false, children: false }));
			} else {
				let head = new NodeHead();
				this.blockManager.readBlock(bid, head.buffer, 0);
				let subtree = head.subtree();
				if (subtree !== 0) {
					iterables.push(this.doTraverse(subtree, depth + 1));
				}
			}
		} else if (relationship === ">") {
			if (depth === this.keys.length - 1) {
				iterables.push(this.doYield(bid, depth, relationship, reverse, { resident: false, subtree: true, children: true }));
			} else {
				let head = new NodeHead();
				this.blockManager.readBlock(bid, head.buffer, 0);
				let subtree = head.subtree();
				if (subtree !== 0) {
					iterables.push(this.doTraverse(subtree, depth + 1));
				}
			}
		} else if (relationship === ">=") {
			if (depth === this.keys.length - 1) {
				iterables.push(this.doYield(bid, depth, relationship, reverse, { resident: true, subtree: true, children: true }));
			} else {
				let head = new NodeHead();
				this.blockManager.readBlock(bid, head.buffer, 0);
				let subtree = head.subtree();
				if (subtree !== 0) {
					iterables.push(this.doTraverse(subtree, depth + 1));
				}
			}
		} else if (relationship === "<") {
			if (depth === this.keys.length - 1) {
				iterables.push(this.doYield(bid, depth, relationship, reverse, { resident: false, subtree: false, children: false }));
			} else {
				let head = new NodeHead();
				this.blockManager.readBlock(bid, head.buffer, 0);
				let resident = head.resident();
				if (resident !== 0) {
					iterables.push([resident]);
				}
				let subtree = head.subtree();
				if (subtree !== 0) {
					iterables.push(this.doTraverse(subtree, depth + 1));
				}
			}
		} else if (relationship === "<=") {
			if (depth === this.keys.length - 1) {
				iterables.push(this.doYield(bid, depth, relationship, reverse, { resident: true, subtree: false, children: false }));
			} else {
				let head = new NodeHead();
				this.blockManager.readBlock(bid, head.buffer, 0);
				let resident = head.resident();
				if (resident !== 0) {
					iterables.push([resident]);
				}
				let subtree = head.subtree();
				if (subtree !== 0) {
					iterables.push(this.doTraverse(subtree, depth + 1));
				}
			}
		}
		for (let iterable of reverse ? iterables.reverse() : iterables) {
			yield * iterable;
		}
	}

	private * onKeyIsPrefixForNodeKey(bid: number, depth: number, relationship: Relationship, reverse: boolean): Iterable<number> {
		let iterables = [] as Array<Iterable<number>>;
		if (relationship === "^=") {
			if (depth === this.keys.length - 1) {
				iterables.push(this.doYield(bid, depth, relationship, reverse, { resident: true, subtree: true, children: true }));
			}
		} else if (relationship === ">") {
			iterables.push(this.doYield(bid, depth, relationship, reverse, { resident: true, subtree: true, children: true }));
		} else if (relationship === ">=") {
			iterables.push(this.doYield(bid, depth, relationship, reverse, { resident: true, subtree: true, children: true }));
		}
		for (let iterable of reverse ? iterables.reverse() : iterables) {
			yield * iterable;
		}
	}

	private * onKeyIsBeforeNodeKey(bid: number, depth: number, relationship: Relationship, reverse: boolean): Iterable<number> {
		if (relationship === ">") {
			yield * this.doYield(bid, depth, relationship, reverse, { resident: true, subtree: true, children: true });
		} else if (relationship === ">=") {
			yield * this.doYield(bid, depth, relationship, reverse, { resident: true, subtree: true, children: true });
		}
	}

	private * onKeyIsAfterNodeKey(bid: number, depth: number, relationship: Relationship, reverse: boolean): Iterable<number> {
		if (relationship === "<") {
			yield * this.doYield(bid, depth, relationship, reverse, { resident: true, subtree: true, children: true });
		} else if (relationship === "<=") {
			yield * this.doYield(bid, depth, relationship, reverse, { resident: true, subtree: true, children: true });
		}
	}

	private * onNodeKeyIsPrefixForKey(bid: number, depth: number, relationship: Relationship, reverse: boolean, suffix: Array<number>): Iterable<number> {
		let iterables = [] as Array<Iterable<number>>;
		if (relationship === "<" || relationship === "<=") {
			let head = new NodeHead();
			this.blockManager.readBlock(bid, head.buffer, 0);
			let resident = head.resident();
			if (resident !== 0) {
				iterables.push([resident]);
			}
			let subtree = head.subtree();
			if (subtree !== 0) {
				iterables.push(this.doTraverse(subtree, depth + 1));
			}
		}
		if (this.blockManager.getBlockSize(bid) >= NodeHead.LENGTH + NodeBody.LENGTH) {
			let body = new NodeBody();
			this.blockManager.readBlock(bid, body.buffer, NodeBody.OFFSET);
			let index = suffix[0];
			if (relationship === "<" || relationship === "<=") {
				for (let i = 0; i < index; i++) {
					let child = body.child(i);
					if (child !== 0) {
						iterables.push(this.doYield(child, depth, relationship, reverse, { resident: true, subtree: true, children: true }));
					}
				}
			}
			let child = body.child(index);
			if (child !== 0) {
				iterables.push(this.visitNode(child, depth, relationship, reverse, suffix.slice(1)));
			}
			if (relationship === ">" || relationship === ">=") {
				for (let i = index + 1; i < 16; i++) {
					let child = body.child(i);
					if (child !== 0) {
						iterables.push(this.doYield(child, depth, relationship, reverse, { resident: true, subtree: true, children: true }));
					}
				}
			}
		}
		for (let iterable of reverse ? iterables.reverse() : iterables) {
			yield * iterable;
		}
	}

	private * visitNode(bid: number, depth: number, relationship: Relationship, reverse: boolean, suffix: Array<number>): Iterable<number> {
		let head = new NodeHead();
		this.blockManager.readBlock(bid, head.buffer, 0);
		let prefix = head.prefix();
		let commonPrefixLength = computeCommonPrefixLength(prefix, suffix);
		let nextPrefixNibble = prefix[commonPrefixLength] as number | undefined;
		let nextSuffixNibble = suffix[commonPrefixLength] as number | undefined;
		if (nextSuffixNibble == null) {
			if (nextPrefixNibble == null) {
				yield * this.onKeyIsNodeKey(bid, depth, relationship, reverse);
			} else {
				yield * this.onKeyIsPrefixForNodeKey(bid, depth, relationship, reverse);
			}
		} else {
			if (nextPrefixNibble == null) {
				yield * this.onNodeKeyIsPrefixForKey(bid, depth, relationship, reverse, suffix.slice(commonPrefixLength));
			} else {
				if (nextSuffixNibble < nextPrefixNibble) {
					yield * this.onKeyIsBeforeNodeKey(bid, depth, relationship, reverse);
				} else {
					yield * this.onKeyIsAfterNodeKey(bid, depth, relationship, reverse);
				}
			}
		}
	}

	private * doTraverse(bid: number, depth: number): Iterable<number> {
		let suffix = this.keys[depth]?.slice() ?? [];
		let direction = this.directions[depth] ?? "increasing";
		let reverse = direction === "decreasing";
		let relationship = this.relationship;
		if (reverse) {
			if (relationship === "<") {
				relationship = ">";
			} else if (relationship === "<=") {
				relationship = ">=";
			} else if (relationship === ">") {
				relationship = "<";
			} else if (relationship === ">=") {
				relationship = "<=";
			}
		}
		yield * this.visitNode(bid, depth, relationship, reverse, suffix);
	}

	constructor(blockManager: BlockManager, relationship: Relationship, keys: Array<Array<number>>, directions: Array<Direction>) {
		this.blockManager = blockManager;
		this.relationship = relationship;
		this.keys = keys.length > 0 ? keys : [[]];
		this.directions = directions;
	}

	* traverse(bid: number): Iterable<number> {
		yield * this.doTraverse(bid, 0);
	}
};

export class RadixTree {
	private blockManager: BlockManager;
	private blockIndex: number;

	private doDelete(bid: number): void {
		let head = new NodeHead();
		this.blockManager.readBlock(bid, head.buffer, 0);
		if (this.blockManager.getBlockSize(bid) >= NodeHead.LENGTH + NodeBody.LENGTH) {
			let body = new NodeBody();
			this.blockManager.readBlock(bid, body.buffer, NodeBody.OFFSET);
			for (let i = 0; i < 16; i++) {
				let child = body.child(i);
				if (child !== 0) {
					this.doDelete(child);
				}
			}
		}
		let subtree = head.subtree();
		if (subtree !== 0) {
			this.doDelete(subtree);
		}
		this.blockManager.deleteBlock(bid);
	}

	private doInsert(keys: Array<Array<number>>, value: number, bid: number, suffix: Array<number>): number | undefined {
		let head = new NodeHead();
		this.blockManager.readBlock(bid, head.buffer, 0);
		let prefix = head.prefix();
		let total = head.total();
		let commonPrefixLength = computeCommonPrefixLength(prefix, suffix);
		let nextPrefixNibble = prefix[commonPrefixLength] as number | undefined;
		let nextSuffixNibble = suffix[commonPrefixLength] as number | undefined;
		if (nextSuffixNibble == null) {
			if (nextPrefixNibble == null) {
				// Key is identical to node.
				if (keys.length === 0) {
					let resident = head.resident();
					if (resident !== 0) {
						resident = head.resident(value);
						this.blockManager.writeBlock(bid, head.buffer, 0);
						return;
					}
					total = head.total(total + 1);
					resident = head.resident(value);
					this.blockManager.writeBlock(bid, head.buffer, 0);
					return total;
				} else {
					let subtree = head.subtree();
					if (subtree === 0) {
						subtree = head.subtree(this.blockManager.createBlock(NodeHead.LENGTH));
						this.blockManager.writeBlock(bid, head.buffer, 0);
					}
					let outcome = this.doInsert(keys.slice(1), value, subtree, keys[0]);
					if (outcome == null) {
						return;
					}
					total = head.total(total + 1);
					this.blockManager.writeBlock(bid, head.buffer, 0);
					return total;
				}
			} else {
				// Key is prefix to node.
				let index = nextPrefixNibble;
				head.prefix(prefix.slice(commonPrefixLength + 1));
				this.blockManager.writeBlock(bid, head.buffer, 0);
				let bidTwo = this.blockManager.createBlock(NodeHead.LENGTH + NodeBody.LENGTH);
				let headTwo = new NodeHead();
				headTwo.prefix(prefix.slice(0, commonPrefixLength));
				headTwo.total(total);
				this.blockManager.writeBlock(bidTwo, headTwo.buffer, 0);
				let bodyTwo = new NodeBody();
				bodyTwo.child(index, bidTwo);
				this.blockManager.writeBlock(bidTwo, bodyTwo.buffer, NodeBody.OFFSET);
				this.blockManager.swapBlocks(bid, bidTwo);
				return this.doInsert(keys, value, bid, suffix);
			}
		} else {
			if (nextPrefixNibble == null) {
				// Node is prefix to key.
				if (commonPrefixLength === 0 && total === 0) {
					head.prefix(suffix.slice(0, NodeHead.MAX_PREFIX_NIBBLES));
					this.blockManager.writeBlock(bid, head.buffer, 0);
					return this.doInsert(keys, value, bid, suffix);
				} else {
					if (this.blockManager.getBlockSize(bid) < NodeHead.LENGTH + NodeBody.LENGTH) {
						this.blockManager.resizeBlock(bid, NodeHead.LENGTH + NodeBody.LENGTH);
					}
					let index = nextSuffixNibble;
					let body = new NodeBody();
					this.blockManager.readBlock(bid, body.buffer, NodeBody.OFFSET);
					let child = body.child(index);
					if (child === 0) {
						child = body.child(index, this.blockManager.createBlock(NodeHead.LENGTH));
						this.blockManager.writeBlock(bid, body.buffer, NodeBody.OFFSET);
					}
					let outcome = this.doInsert(keys, value, child, suffix.slice(commonPrefixLength + 1));
					if (outcome == null) {
						return;
					}
					total = head.total(total + 1);
					this.blockManager.writeBlock(bid, head.buffer, 0);
					return total;
				}
			} else {
				// Key is sibling to node.
				let index = nextPrefixNibble;
				head.prefix(prefix.slice(commonPrefixLength + 1));
				this.blockManager.writeBlock(bid, head.buffer, 0);
				let bidTwo = this.blockManager.createBlock(NodeHead.LENGTH + NodeBody.LENGTH);
				let headTwo = new NodeHead();
				headTwo.prefix(prefix.slice(0, commonPrefixLength));
				headTwo.total(total);
				this.blockManager.writeBlock(bidTwo, headTwo.buffer, 0);
				let bodyTwo = new NodeBody();
				bodyTwo.child(index, bidTwo);
				this.blockManager.writeBlock(bidTwo, bodyTwo.buffer, NodeBody.OFFSET);
				this.blockManager.swapBlocks(bid, bidTwo);
				return this.doInsert(keys, value, bid, suffix);
			}
		}
	}

	private doLocate(keys: Array<Array<number>>, bid: number, suffix: Array<number>): number | undefined {
		let head = new NodeHead();
		this.blockManager.readBlock(bid, head.buffer, 0);
		let prefix = head.prefix();
		let total = head.total();
		let commonPrefixLength = computeCommonPrefixLength(prefix, suffix);
		let nextPrefixNibble = prefix[commonPrefixLength] as number | undefined;
		let nextSuffixNibble = suffix[commonPrefixLength] as number | undefined;
		if (nextSuffixNibble == null) {
			if (nextPrefixNibble == null) {
				// Key is identical to node.
				if (keys.length === 0) {
					return bid;
				} else {
					let subtree = head.subtree();
					if (subtree === 0) {
						return;
					}
					return this.doLocate(keys.slice(1), subtree, keys[0]);
				}
			} else {
				// Key is prefix to node.
				return;
			}
		} else {
			if (nextPrefixNibble == null) {
				// Node is prefix to key.
				if (commonPrefixLength === 0 && total === 0) {
					return;
				} else {
					if (this.blockManager.getBlockSize(bid) < NodeHead.LENGTH + NodeBody.LENGTH) {
						return;
					}
					let index = nextSuffixNibble;
					let body = new NodeBody();
					this.blockManager.readBlock(bid, body.buffer, NodeBody.OFFSET);
					let child = body.child(index);
					if (child === 0) {
						return;
					}
					return this.doLocate(keys, child, suffix.slice(commonPrefixLength + 1));
				}
			} else {
				// Key is sibling to node.
				return;
			}
		}
	}

	private doRemove(keys: Array<Array<number>>, bid: number, suffix: Array<number>): number | undefined {
		let head = new NodeHead();
		this.blockManager.readBlock(bid, head.buffer, 0);
		let prefix = head.prefix();
		let total = head.total();
		let commonPrefixLength = computeCommonPrefixLength(prefix, suffix);
		let nextPrefixNibble = prefix[commonPrefixLength] as number | undefined;
		let nextSuffixNibble = suffix[commonPrefixLength] as number | undefined;
		if (nextSuffixNibble == null) {
			if (nextPrefixNibble == null) {
				// Key is identical to node.
				if (keys.length === 0) {
					let resident = head.resident();
					if (resident === 0) {
						return;
					}
					resident = head.resident(0);
					total = head.total(total - 1);
					this.blockManager.writeBlock(bid, head.buffer, 0);
					return total;
				} else {
					let subtree = head.subtree();
					if (subtree === 0) {
						return;
					}
					let outcome = this.doRemove(keys.slice(1), subtree, keys[0]);
					if (outcome == null) {
						return;
					}
					if (outcome === 0) {
						this.blockManager.deleteBlock(subtree);
						subtree = head.subtree(0);
						this.blockManager.writeBlock(bid, head.buffer, 0);
					}
					total = head.total(total - 1);
					this.blockManager.writeBlock(bid, head.buffer, 0);
					return total;
				}
			} else {
				// Key is prefix to node.
				return;
			}
		} else {
			if (nextPrefixNibble == null) {
				// Node is prefix to key.
				if (commonPrefixLength === 0 && total === 0) {
					return;
				} else {
					if (this.blockManager.getBlockSize(bid) < NodeHead.LENGTH + NodeBody.LENGTH) {
						return;
					}
					let index = nextSuffixNibble;
					let body = new NodeBody();
					this.blockManager.readBlock(bid, body.buffer, NodeBody.OFFSET);
					let child = body.child(index);
					if (child === 0) {
						return;
					}
					let outcome = this.doRemove(keys, child, suffix.slice(commonPrefixLength + 1));
					if (outcome == null) {
						return;
					}
					if (outcome === 0) {
						this.blockManager.deleteBlock(child);
						child = body.child(index, 0);
						this.blockManager.writeBlock(bid, body.buffer, NodeBody.OFFSET);
					}
					total = head.total(total - 1);
					this.blockManager.writeBlock(bid, head.buffer, 0);
					return total;
				}
			} else {
				// Key is sibling to node.
				return;
			}
		}
	}

	private locate(keys: Array<Uint8Array>): number | undefined {
		let nibbles = keys.map(getNibblesFromBytes);
		return this.doLocate(nibbles.slice(1), this.blockIndex, nibbles[0] ?? []);
	}

	constructor(blockManager: BlockManager, blockIndex: number) {
		this.blockManager = blockManager;
		this.blockIndex = blockIndex;
	}

	* [Symbol.iterator](): Iterator<number> {
		yield * this.filter("^=", []);
	}

	branch(keys: Array<Uint8Array>): RadixTree | undefined {
		let bid = this.locate(keys);
		if (bid == null) {
			return;
		}
		let head = new NodeHead();
		this.blockManager.readBlock(bid, head.buffer, 0);
		let subtree = head.subtree();
		if (subtree === 0) {
			return;
		}
		return new RadixTree(this.blockManager, subtree);
	}

	delete(): void {
		this.doDelete(this.blockIndex);
	}

	* filter(relationship: Relationship, keys: Array<Uint8Array>, directions?: Array<Direction>): Iterable<number> {
		let nibbles = keys.map(getNibblesFromBytes);
		let treeWalker = new RadixTreeWalker(this.blockManager, relationship, nibbles, directions ?? []);
		yield * treeWalker.traverse(this.blockIndex);
	}

	insert(keys: Array<Uint8Array>, value: number): boolean {
		if (DEBUG) IntegerAssert.atLeast(1, value);
		let nibbles = keys.map(getNibblesFromBytes);
		return this.doInsert(nibbles.slice(1), value, this.blockIndex, nibbles[0] ?? []) != null;
	}

	length(): number {
		let head = new NodeHead();
		this.blockManager.readBlock(this.blockIndex, head.buffer, 0);
		return head.total();
	}

	lookup(keys: Array<Uint8Array>): number | undefined {
		let bid = this.locate(keys);
		if (bid == null) {
			return;
		}
		let head = new NodeHead();
		this.blockManager.readBlock(bid, head.buffer, 0);
		let resident = head.resident();
		if (resident === 0) {
			return;
		}
		return resident;
	}

	remove(keys: Array<Uint8Array>): boolean {
		let nibbles = keys.map(getNibblesFromBytes);
		return this.doRemove(nibbles.slice(1), this.blockIndex, nibbles[0] ?? []) != null;
	}

	static readonly INITIAL_SIZE = NodeHead.LENGTH;
};
