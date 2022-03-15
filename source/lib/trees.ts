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
			if (DEBUG) IntegerAssert.between(0, value.length, length * 2 - 1);
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
		return this.nibbles(0, 8, value);
	}

	resident(value?: number): number {
		return Binary.unsigned(this.buffer, 8, 6, value);
	}

	parent(value?: number): number {
		return Binary.unsigned(this.buffer, 14, 6, value);
	}

	subtree(value?: number): number {
		return Binary.unsigned(this.buffer, 20, 6, value);
	}

	total(value?: number): number {
		return Binary.unsigned(this.buffer, 26, 6, value);
	}

	static readonly LENGTH = 32;
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
			let nextSuffixNibble = suffix.shift() as number;
			if (relationship === "<" || relationship === "<=") {
				for (let i = 0; i < nextSuffixNibble; i++) {
					let child = body.child(i);
					if (child !== 0) {
						iterables.push(this.doYield(child, depth, relationship, reverse, { resident: true, subtree: true, children: true }));
					}
				}
			}
			let child = body.child(nextSuffixNibble);
			if (child !== 0) {
				iterables.push(this.visitNode(child, depth, relationship, reverse, suffix));
			}
			if (relationship === ">" || relationship === ">=") {
				for (let i = nextSuffixNibble + 1; i < 16; i++) {
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
				// Key is an exact match for the current node.
				yield * this.onKeyIsNodeKey(bid, depth, relationship, reverse);
			} else {
				// Key is a prefix match for the current node.
				yield * this.onKeyIsPrefixForNodeKey(bid, depth, relationship, reverse);
			}
		} else {
			if (nextPrefixNibble == null) {
				// Key potentially matches a node located at a greater depth.
				yield * this.onNodeKeyIsPrefixForKey(bid, depth, relationship, reverse, suffix.slice(commonPrefixLength));
			} else {
				if (nextSuffixNibble < nextPrefixNibble) {
					// Key matches a non-existant node before the current node.
					yield * this.onKeyIsBeforeNodeKey(bid, depth, relationship, reverse);
				} else {
					// Key matches a non-existant node after the current node.
					yield * this.onKeyIsAfterNodeKey(bid, depth, relationship, reverse);
				}
			}
		}
	}

	private * doTraverse(bid: number, depth: number): Iterable<number> {
		let suffix = this.keys[depth] ?? [];
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
		yield * this.visitNode(bid, depth, relationship, reverse, suffix.slice());
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

	private updateChildParents(blockIndex: number): void {
		let head = new NodeHead();
		let body = new NodeBody();
		let temp = new NodeHead();
		this.blockManager.readBlock(blockIndex, head.buffer, 0);
		let subtree = head.subtree();
		if (subtree !== 0) {
			this.blockManager.readBlock(subtree, temp.buffer, 0);
			temp.parent(blockIndex);
			this.blockManager.writeBlock(subtree, temp.buffer, 0);
		}
		if (this.blockManager.getBlockSize(blockIndex) >= NodeHead.LENGTH + NodeBody.LENGTH) {
			this.blockManager.readBlock(blockIndex, body.buffer, NodeBody.OFFSET);
			for (let i = 0; i < 16; i++) {
				let child =	body.child(i);
				if (child !== 0) {
					this.blockManager.readBlock(child, temp.buffer, 0);
					temp.parent(blockIndex);
					this.blockManager.writeBlock(child, temp.buffer, 0);
				}
			}
		}
	}

	private createNodes(key: Array<Uint8Array>): number {
		let head = new NodeHead();
		let body = new NodeBody();
		let temp = new NodeHead();
		let blockIndex = this.blockIndex;
		for (let [keyIndex, keyPart] of key.entries()) {
			let keyNibbles = getNibblesFromBytes(keyPart);
			while (true) {
				this.blockManager.readBlock(blockIndex, head.buffer, 0);
				if (keyNibbles.length > 0) {
					if (head.total() === 0) {
						let prefixLength = Math.min(15, keyNibbles.length);
						head.prefix(keyNibbles.slice(0, prefixLength));
						this.blockManager.writeBlock(blockIndex, head.buffer, 0);
						keyNibbles = keyNibbles.slice(prefixLength);
					} else {
						let nodeNibbles = head.prefix();
						let commonPrefixLength = computeCommonPrefixLength(nodeNibbles, keyNibbles);
						if (commonPrefixLength < nodeNibbles.length) {
							let tempIndex = this.blockManager.cloneBlock(blockIndex);
							this.blockManager.readBlock(tempIndex, temp.buffer, 0);
							temp.prefix(nodeNibbles.slice(commonPrefixLength + 1));
							temp.parent(blockIndex);
							this.blockManager.writeBlock(tempIndex, temp.buffer, 0);
							this.updateChildParents(tempIndex);
							this.blockManager.resizeBlock(blockIndex, NodeHead.LENGTH + NodeBody.LENGTH);
							let parent = head.parent();
							let total = head.total();
							head.buffer.fill(0);
							head.prefix(nodeNibbles.slice(0, commonPrefixLength));
							head.parent(parent);
							head.total(total);
							this.blockManager.writeBlock(blockIndex, head.buffer, 0);
							body.buffer.fill(0);
							body.child(nodeNibbles[commonPrefixLength], tempIndex);
							this.blockManager.writeBlock(blockIndex, body.buffer, NodeBody.OFFSET);
						}
						keyNibbles = keyNibbles.slice(commonPrefixLength);
					}
				}
				let keyNibble = keyNibbles.shift();
				if (keyNibble == null) {
					break;
				}
				if (this.blockManager.getBlockSize(blockIndex) < NodeHead.LENGTH + NodeBody.LENGTH) {
					this.blockManager.resizeBlock(blockIndex, NodeHead.LENGTH + NodeBody.LENGTH);
				}
				this.blockManager.readBlock(blockIndex, body.buffer, NodeBody.OFFSET);
				if (body.child(keyNibble) === 0) {
					let tempIndex = this.blockManager.createBlock(NodeHead.LENGTH);
					temp.buffer.fill(0);
					temp.parent(blockIndex);
					this.blockManager.writeBlock(tempIndex, temp.buffer, 0);
					body.child(keyNibble, tempIndex);
					this.blockManager.writeBlock(blockIndex, body.buffer, NodeBody.OFFSET);
				}
				blockIndex = body.child(keyNibble);
			}
			if (keyIndex + 1 < key.length) {
				if (head.subtree() === 0) {
					let tempIndex = this.blockManager.createBlock(NodeHead.LENGTH);
					temp.buffer.fill(0);
					temp.parent(blockIndex);
					this.blockManager.writeBlock(tempIndex, temp.buffer, 0);
					head.subtree(tempIndex);
					this.blockManager.writeBlock(blockIndex, head.buffer, 0);
				}
				blockIndex = head.subtree();
			}
		}
		return blockIndex;
	}

	private locateNode(key: Array<Uint8Array>): number | undefined {
		let head = new NodeHead();
		let body = new NodeBody();
		let blockIndex = this.blockIndex;
		for (let [keyIndex, keyPart] of key.entries()) {
			let keyNibbles = getNibblesFromBytes(keyPart);
			while (true) {
				this.blockManager.readBlock(blockIndex, head.buffer);
				let nodeNibbles = head.prefix();
				let commonPrefixLength = computeCommonPrefixLength(nodeNibbles, keyNibbles);
				if (commonPrefixLength < nodeNibbles.length) {
					return;
				}
				keyNibbles.splice(0, commonPrefixLength);
				let keyNibble = keyNibbles.shift();
				if (keyNibble == null) {
					break;
				}
				if (this.blockManager.getBlockSize(blockIndex) < NodeHead.LENGTH + NodeBody.LENGTH) {
					return;
				}
				this.blockManager.readBlock(blockIndex, body.buffer, NodeBody.OFFSET);
				let child = body.child(keyNibble);
				if (child === 0) {
					return;
				}
				blockIndex = child;
			}
			if (keyIndex + 1 < key.length) {
				let subtree = head.subtree();
				if (subtree === 0) {
					return;
				}
				blockIndex = subtree;
			}
		}
		return blockIndex;
	}

	private updateTotal(blockIndex: number, delta: number): void {
		let head = new NodeHead();
		let body = new NodeBody();
		let deletedIndex: number | undefined;
		let lastIndex: number | undefined;
		while (blockIndex !== 0) {
			this.blockManager.readBlock(blockIndex, head.buffer, 0);
			head.total(head.total() + delta);
			if (head.total() > 0 || blockIndex === this.blockIndex) {
				if (head.subtree() === deletedIndex) {
					head.subtree(0);
				}
				if (this.blockManager.getBlockSize(blockIndex) >= NodeHead.LENGTH + NodeBody.LENGTH) {
					this.blockManager.readBlock(blockIndex, body.buffer, NodeBody.OFFSET);
					for (let i = 0; i < 16; i++) {
						if (body.child(i) === deletedIndex) {
							body.child(i, 0);
						}
					}
					this.blockManager.writeBlock(blockIndex, body.buffer, NodeBody.OFFSET);
				}
				this.blockManager.writeBlock(blockIndex, head.buffer, 0);
				deletedIndex = undefined;
			} else {
				this.blockManager.deleteBlock(blockIndex);
				deletedIndex = blockIndex;
			}
			lastIndex = blockIndex;
			blockIndex = head.parent();
		}
	}

	private doDelete(index: number): void {
		let head = new NodeHead();
		this.blockManager.readBlock(index, head.buffer, 0);
		let subtree = head.subtree();
		if (this.blockManager.getBlockSize(index) >= NodeHead.LENGTH + NodeBody.LENGTH) {
			let body = new NodeBody();
			this.blockManager.readBlock(index, body.buffer, NodeBody.OFFSET);
			for (let i = 0; i < 16; i++) {
				let child = body.child(i);
				if (child !== 0) {
					this.doDelete(child);
				}
			}
		}
		if (subtree !== 0) {
			this.doDelete(subtree);
		}
		this.blockManager.deleteBlock(index);
	}

	constructor(blockManager: BlockManager, blockIndex: number) {
		this.blockManager = blockManager;
		this.blockIndex = blockIndex;
	}

	* [Symbol.iterator](): Iterator<number> {
		yield * this.filter("^=", []);
	}

	branch(key: Array<Uint8Array>): RadixTree | undefined {
		let blockIndex = this.locateNode(key);
		if (blockIndex == null) {
			return;
		}
		let head = new NodeHead();
		this.blockManager.readBlock(blockIndex, head.buffer, 0);
		let subtree = head.subtree();
		if (subtree === 0) {
			return;
		}
		return new RadixTree(this.blockManager, subtree);
	}

	delete(): void {
		this.doDelete(this.blockIndex);
	}

	* filter(relationship: Relationship, key: Array<Uint8Array>, directions?: Array<Direction>): Iterable<number> {
		let treeWalker = new RadixTreeWalker(this.blockManager, relationship, key.map(getNibblesFromBytes), directions ?? []);
		yield * treeWalker.traverse(this.blockIndex);
	}

	insert(key: Array<Uint8Array>, value: number): boolean {
		let head = new NodeHead();
		let blockIndex = this.createNodes(key);
		this.blockManager.readBlock(blockIndex, head.buffer, 0);
		if (head.resident() === 0) {
			head.resident(value);
			this.blockManager.writeBlock(blockIndex, head.buffer, 0);
			this.updateTotal(blockIndex, 1);
			return true;
		} else {
			head.resident(value);
			this.blockManager.writeBlock(blockIndex, head.buffer, 0);
			return false;
		}
	}

	length(): number {
		let head = new NodeHead();
		this.blockManager.readBlock(this.blockIndex, head.buffer, 0);
		return head.total();
	}

	lookup(key: Array<Uint8Array>): number | undefined {
		let blockIndex = this.locateNode(key);
		if (blockIndex == null) {
			return;
		}
		let head = new NodeHead();
		this.blockManager.readBlock(blockIndex, head.buffer, 0);
		let resident = head.resident();
		if (resident === 0) {
			return;
		}
		return resident;
	}

	remove(key: Array<Uint8Array>): boolean {
		let blockIndex = this.locateNode(key);
		if (blockIndex == null) {
			return false;
		}
		let head = new NodeHead();
		this.blockManager.readBlock(blockIndex, head.buffer, 0);
		if (head.resident() === 0) {
			return false;
		}
		head.resident(0);
		this.blockManager.writeBlock(blockIndex, head.buffer, 0);
		this.updateTotal(blockIndex, -1);
		return true;
	}

	static readonly INITIAL_SIZE = NodeHead.LENGTH;
};
