import { IntegerAssert } from "../mod/asserts";
import { BlockManager } from "./blocks";
import { Chunk } from "./chunks";
import { Binary, Statistic } from "./utils";
import { DEBUG, LOG } from "./variables";

export type Relationship = "^=" | "=" | ">" | ">=" | "<" | "<=";

export type Direction = "increasing" | "decreasing";

export function getKeyPermutations(keys: Array<Array<Uint8Array>>): Array<Array<Uint8Array>> {
	let permutations: Array<Array<Uint8Array>> = [];
	if (keys.length > 0) {
		let headPermutations = keys[0];
		if (keys.length > 1) {
			let tailPermutations = getKeyPermutations(keys.slice(1));
			for (let headPermutation of headPermutations) {
				for (let tailPermutation of tailPermutations) {
					permutations.push([headPermutation, ...tailPermutation]);
				}
			}
		} else {
			for (let headPermutation of headPermutations) {
				permutations.push([headPermutation]);
			}
		}
	}
	return permutations;
};

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
			if (DEBUG) IntegerAssert.between(0, value.length, length * 2);
			let bytes = getBytesFromNibbles(value.length % 2 === 1 ? [...value, 0] : value);
			this.prefixLength(value.length);
			this.buffer.set(bytes, offset);
			this.buffer.fill(0, offset + bytes.length, offset + length);
			return value;
		} else {
			let bytes = this.buffer.subarray(offset, offset + length);
			let nibbles = getNibblesFromBytes(bytes);
			return nibbles.slice(0, this.prefixLength());
		}
	}

	constructor(buffer?: Uint8Array) {
		super(buffer ?? new Uint8Array(NodeHead.LENGTH));
		if (DEBUG) IntegerAssert.exactly(this.buffer.length, NodeHead.LENGTH);
	}

	prefixLength(value?: number): number {
		return Binary.unsigned(this.buffer, 0, 1, value);
	}

	prefix(value?: Array<number>): Array<number> {
		return this.nibbles(1, NodeHead.MAX_PREFIX_BYTES, value);
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
	static readonly MAX_PREFIX_BYTES = 13;
	static readonly MAX_PREFIX_NIBBLES = NodeHead.MAX_PREFIX_BYTES * 2;
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
				iterables.push(this.doYield(bid, depth, relationship, reverse, { resident: false, subtree: false, children: true }));
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
				iterables.push(this.doYield(bid, depth, relationship, reverse, { resident: false, subtree: false, children: true }));
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

enum NodeKeyRelationship {
	KEY_IS_NODE_KEY,
	KEY_IS_PREFIX_TO_NODE_KEY,
	KEY_IS_BEFORE_NODE_KEY,
	KEY_IS_AFTER_NODE_KEY,
	NODE_KEY_IS_PREFIX_TO_KEY
};

const NOTHING_FLAG = 0;
const CHILD_FLAGS = new Array(16).fill(0).map((value, index) => {
	return (1 << index);
});
const CHILDREN_FLAG = (1 << 16) - 1;
const CURRENT_FLAG = 1 << 16;
const CHILDREN_BEFORE_FLAGS = new Array(16).fill(0).map((value, index) => {
	let flags = 0;
	for (let i = 0; i < index; i++) {
		flags |= (1 << i);
	}
	return flags;
});
const CHILDREN_AFTER_FLAGS = new Array(16).fill(0).map((value, index) => {
	let flags = 0;
	for (let i = index + 1; i < 16; i++) {
		flags |= (1 << i);
	}
	return flags;
});

type NodeVisitorOutcome = [yield_outcome: number, check_outcome: number];

const YIELD_NOTHING_CHECK_NOTHING: NodeVisitorOutcome = [NOTHING_FLAG, NOTHING_FLAG];
const YIELD_CURRENT_CHECK_NOTHING: NodeVisitorOutcome = [CURRENT_FLAG, NOTHING_FLAG];
const YIELD_CHILDREN_CHECK_NOTHING: NodeVisitorOutcome = [CHILDREN_FLAG, NOTHING_FLAG];
const YIELD_CURRENT_AND_CHILDREN_CHECK_NOTHING: NodeVisitorOutcome = [CURRENT_FLAG | CHILDREN_FLAG, NOTHING_FLAG];
const YIELD_NOTHING_CHECK_CHILD: Array<NodeVisitorOutcome> = new Array(16).fill(0).map((value, index) => {
	return [NOTHING_FLAG, CHILD_FLAGS[index]];
});
const YIELD_CHILDREN_AFTER_CHECK_CHILD: Array<NodeVisitorOutcome> = new Array(16).fill(0).map((value, index) => {
	return [CHILDREN_AFTER_FLAGS[index], CHILD_FLAGS[index]];
});
const YIELD_CHILDREN_AFTER_INCLUSIVE_CHECK_NOTHING: Array<NodeVisitorOutcome> = new Array(16).fill(0).map((value, index) => {
	return [CHILD_FLAGS[index] | CHILDREN_AFTER_FLAGS[index], NOTHING_FLAG];
});
const YIELD_CURRENT_AND_CHILDREN_BEFORE_CHECK_CHILD: Array<NodeVisitorOutcome> = new Array(16).fill(0).map((value, index) => {
	return [CURRENT_FLAG | CHILDREN_BEFORE_FLAGS[index], CHILD_FLAGS[index]];
});

export interface NodeVisitor {
	visit(node_nibbles: Array<number>): NodeVisitorOutcome;
};

export class NodeVisitorEqual implements NodeVisitor {
	protected key_nibbles: Array<number>;

	constructor(key_nibbles: Array<number>) {
		this.key_nibbles = key_nibbles;
	}

	visit(node_nibbles: Array<number>): NodeVisitorOutcome {
		let key_nibbles = this.key_nibbles;
		let common_prefix_length = computeCommonPrefixLength(node_nibbles, key_nibbles);
		let next_node_nibble = node_nibbles[common_prefix_length] as number | undefined;
		let next_key_nibble = key_nibbles[common_prefix_length] as number | undefined;
		if (next_key_nibble == null) {
			if (next_node_nibble == null) {
				// NodeKeyRelationship.KEY_IS_NODE_KEY
				return YIELD_CURRENT_CHECK_NOTHING;
			} else {
				// NodeKeyRelationship.KEY_IS_PREFIX_TO_NODE_KEY
				return YIELD_NOTHING_CHECK_NOTHING;
			}
		} else {
			if (next_node_nibble == null) {
				// NodeKeyRelationship.NODE_KEY_IS_PREFIX_TO_KEY
				return YIELD_NOTHING_CHECK_CHILD[next_key_nibble];
			} else {
				if (next_key_nibble < next_node_nibble) {
					// NodeKeyRelationship.KEY_IS_BEFORE_NODE_KEY
					return YIELD_NOTHING_CHECK_NOTHING;
				} else {
					// NodeKeyRelationship.KEY_IS_AFTER_NODE_KEY
					return YIELD_NOTHING_CHECK_NOTHING;
				}
			}
		}
	}
};

export class NodeVisitorPrefix implements NodeVisitor {
	protected key_nibbles: Array<number>;

	constructor(key_nibbles: Array<number>) {
		this.key_nibbles = key_nibbles;
	}

	visit(node_nibbles: Array<number>): NodeVisitorOutcome {
		let key_nibbles = this.key_nibbles;
		let common_prefix_length = computeCommonPrefixLength(node_nibbles, key_nibbles);
		let next_node_nibble = node_nibbles[common_prefix_length] as number | undefined;
		let next_key_nibble = key_nibbles[common_prefix_length] as number | undefined;
		if (next_key_nibble == null) {
			if (next_node_nibble == null) {
				// NodeKeyRelationship.KEY_IS_NODE_KEY
				return YIELD_CURRENT_AND_CHILDREN_CHECK_NOTHING;
			} else {
				// NodeKeyRelationship.KEY_IS_PREFIX_TO_NODE_KEY
				return YIELD_CURRENT_AND_CHILDREN_CHECK_NOTHING;
			}
		} else {
			if (next_node_nibble == null) {
				return YIELD_NOTHING_CHECK_CHILD[next_key_nibble];
			} else {
				if (next_key_nibble < next_node_nibble) {
					// NodeKeyRelationship.KEY_IS_BEFORE_NODE_KEY
					return YIELD_NOTHING_CHECK_NOTHING;
				} else {
					// NodeKeyRelationship.KEY_IS_AFTER_NODE_KEY
					return YIELD_NOTHING_CHECK_NOTHING;
				}
			}
		}
	}
};

export class NodeVisitorGreaterThan implements NodeVisitor {
	protected key_nibbles: Array<number>;

	constructor(key_nibbles: Array<number>) {
		this.key_nibbles = key_nibbles;
	}

	visit(node_nibbles: Array<number>): NodeVisitorOutcome {
		let key_nibbles = this.key_nibbles;
		let common_prefix_length = computeCommonPrefixLength(node_nibbles, key_nibbles);
		let next_node_nibble = node_nibbles[common_prefix_length] as number | undefined;
		let next_key_nibble = key_nibbles[common_prefix_length] as number | undefined;
		if (next_key_nibble == null) {
			if (next_node_nibble == null) {
				// NodeKeyRelationship.KEY_IS_NODE_KEY
				return YIELD_CHILDREN_CHECK_NOTHING;
			} else {
				// NodeKeyRelationship.KEY_IS_PREFIX_TO_NODE_KEY
				return YIELD_CURRENT_AND_CHILDREN_CHECK_NOTHING;
			}
		} else {
			if (next_node_nibble == null) {
				// NodeKeyRelationship.NODE_KEY_IS_PREFIX_TO_KEY
				return YIELD_CHILDREN_AFTER_CHECK_CHILD[next_key_nibble];
			} else {
				if (next_key_nibble < next_node_nibble) {
					// NodeKeyRelationship.KEY_IS_BEFORE_NODE_KEY
					return YIELD_CURRENT_AND_CHILDREN_CHECK_NOTHING;
				} else {
					// NodeKeyRelationship.KEY_IS_AFTER_NODE_KEY
					return YIELD_NOTHING_CHECK_NOTHING;
				}
			}
		}
	}
};

export class NodeVisitorGreaterThanOrEqual implements NodeVisitor {
	protected key_nibbles: Array<number>;

	constructor(key_nibbles: Array<number>) {
		this.key_nibbles = key_nibbles;
	}

	visit(node_nibbles: Array<number>): NodeVisitorOutcome {
		let key_nibbles = this.key_nibbles;
		let common_prefix_length = computeCommonPrefixLength(node_nibbles, key_nibbles);
		let next_node_nibble = node_nibbles[common_prefix_length] as number | undefined;
		let next_key_nibble = key_nibbles[common_prefix_length] as number | undefined;
		if (next_key_nibble == null) {
			if (next_node_nibble == null) {
				// NodeKeyRelationship.KEY_IS_NODE_KEY
				return YIELD_CURRENT_AND_CHILDREN_CHECK_NOTHING;
			} else {
				// NodeKeyRelationship.KEY_IS_PREFIX_TO_NODE_KEY
				return YIELD_CURRENT_AND_CHILDREN_CHECK_NOTHING;
			}
		} else {
			if (next_node_nibble == null) {
				// NodeKeyRelationship.NODE_KEY_IS_PREFIX_TO_KEY
				return YIELD_CHILDREN_AFTER_CHECK_CHILD[next_key_nibble];
			} else {
				if (next_key_nibble < next_node_nibble) {
					// NodeKeyRelationship.KEY_IS_BEFORE_NODE_KEY
					return YIELD_CURRENT_AND_CHILDREN_CHECK_NOTHING;
				} else {
					// NodeKeyRelationship.KEY_IS_AFTER_NODE_KEY
					return YIELD_NOTHING_CHECK_NOTHING;
				}
			}
		}
	}
};

export class NodeVisitorLessThan implements NodeVisitor {
	protected key_nibbles: Array<number>;

	constructor(key_nibbles: Array<number>) {
		this.key_nibbles = key_nibbles;
	}

	visit(node_nibbles: Array<number>): NodeVisitorOutcome {
		let key_nibbles = this.key_nibbles;
		let common_prefix_length = computeCommonPrefixLength(node_nibbles, key_nibbles);
		let next_node_nibble = node_nibbles[common_prefix_length] as number | undefined;
		let next_key_nibble = key_nibbles[common_prefix_length] as number | undefined;
		if (next_key_nibble == null) {
			if (next_node_nibble == null) {
				// NodeKeyRelationship.KEY_IS_NODE_KEY
				return YIELD_NOTHING_CHECK_NOTHING;
			} else {
				// NodeKeyRelationship.KEY_IS_PREFIX_TO_NODE_KEY
				return YIELD_NOTHING_CHECK_NOTHING;
			}
		} else {
			if (next_node_nibble == null) {
				// NodeKeyRelationship.NODE_KEY_IS_PREFIX_TO_KEY
				return YIELD_CURRENT_AND_CHILDREN_BEFORE_CHECK_CHILD[next_key_nibble];
			} else {
				if (next_key_nibble < next_node_nibble) {
					// NodeKeyRelationship.KEY_IS_BEFORE_NODE_KEY
					return YIELD_NOTHING_CHECK_NOTHING;
				} else {
					// NodeKeyRelationship.KEY_IS_AFTER_NODE_KEY
					return YIELD_CURRENT_AND_CHILDREN_CHECK_NOTHING;
				}
			}
		}
	}
};

export class NodeVisitorLessThanOrEqual implements NodeVisitor {
	protected key_nibbles: Array<number>;

	constructor(key_nibbles: Array<number>) {
		this.key_nibbles = key_nibbles;
	}

	visit(node_nibbles: Array<number>): NodeVisitorOutcome {
		let key_nibbles = this.key_nibbles;
		let common_prefix_length = computeCommonPrefixLength(node_nibbles, key_nibbles);
		let next_node_nibble = node_nibbles[common_prefix_length] as number | undefined;
		let next_key_nibble = key_nibbles[common_prefix_length] as number | undefined;
		if (next_key_nibble == null) {
			if (next_node_nibble == null) {
				// NodeKeyRelationship.KEY_IS_NODE_KEY
				return YIELD_CURRENT_CHECK_NOTHING;
			} else {
				// NodeKeyRelationship.KEY_IS_PREFIX_TO_NODE_KEY
				return YIELD_NOTHING_CHECK_NOTHING;
			}
		} else {
			if (next_node_nibble == null) {
				// NodeKeyRelationship.NODE_KEY_IS_PREFIX_TO_KEY
				return YIELD_CURRENT_AND_CHILDREN_BEFORE_CHECK_CHILD[next_key_nibble];
			} else {
				if (next_key_nibble < next_node_nibble) {
					// NodeKeyRelationship.KEY_IS_BEFORE_NODE_KEY
					return YIELD_NOTHING_CHECK_NOTHING;
				} else {
					// NodeKeyRelationship.KEY_IS_AFTER_NODE_KEY
					return YIELD_CURRENT_AND_CHILDREN_CHECK_NOTHING;
				}
			}
		}
	}
};

export class NodeVisitorOr implements NodeVisitor {
	protected visitor: NodeVisitor;
	protected visitors: Array<NodeVisitor>;

	constructor(visitor: NodeVisitor, ...vistors: Array<NodeVisitor>) {
		this.visitor = visitor;
		this.visitors = vistors;
	}

	visit(node_nibbles: Array<number>): NodeVisitorOutcome {
		let [combined_yield_outcome, combined_check_outcome] = this.visitor.visit(node_nibbles);
		for (let visitor of this.visitors) {
			let [yield_outcome, check_outcome] = visitor.visit(node_nibbles);
			combined_yield_outcome = combined_yield_outcome | yield_outcome;
			combined_check_outcome = combined_check_outcome | check_outcome;
		}
		return [combined_yield_outcome, combined_check_outcome];
	}
};

export class NodeVisitorAnd implements NodeVisitor {
	protected visitor: NodeVisitor;
	protected visitors: Array<NodeVisitor>;

	constructor(visitor: NodeVisitor, ...vistors: Array<NodeVisitor>) {
		this.visitor = visitor;
		this.visitors = vistors;
	}

	visit(node_nibbles: Array<number>): NodeVisitorOutcome {
		let [combined_yield_outcome, combined_check_outcome] = this.visitor.visit(node_nibbles);
		for (let visitor of this.visitors) {
			let [yield_outcome, check_outcome] = visitor.visit(node_nibbles);
			combined_check_outcome = (check_outcome & combined_yield_outcome) | (combined_check_outcome & yield_outcome) | (check_outcome & combined_check_outcome);
			combined_yield_outcome = combined_yield_outcome & yield_outcome;
		}
		return [combined_yield_outcome, combined_check_outcome];
	}
};

export class NodeVisitorNot implements NodeVisitor {
	protected visitor: NodeVisitor;

	constructor(visitor: NodeVisitor) {
		this.visitor = visitor;
	}

	visit(node_nibbles: Array<number>): NodeVisitorOutcome {
		let [yield_outcome, check_outcome] = this.visitor.visit(node_nibbles);
		yield_outcome = (~yield_outcome) >>> 0;
		check_outcome = check_outcome;
		return [yield_outcome, check_outcome];
	}
};

export class NodeVisitorBefore implements NodeVisitor {
	protected visitor: NodeVisitor;

	constructor(key_nibbles: Array<number>, direction: Direction | undefined) {
		this.visitor = direction === "decreasing" ? new NodeVisitorGreaterThan(key_nibbles) : new NodeVisitorLessThan(key_nibbles);
	}

	visit(node_nibbles: Array<number>): NodeVisitorOutcome {
		return this.visitor.visit(node_nibbles);
	}
};

export class NodeVisitorAfter implements NodeVisitor {
	protected visitor: NodeVisitor;

	constructor(key_nibbles: Array<number>, direction: Direction | undefined) {
		this.visitor = direction === "decreasing" ? new NodeVisitorLessThan(key_nibbles) : new NodeVisitorGreaterThan(key_nibbles);
	}

	visit(node_nibbles: Array<number>): NodeVisitorOutcome {
		return this.visitor.visit(node_nibbles);
	}
};

export class NodeVisitorIn implements NodeVisitor {
	protected visitor: NodeVisitor;

	constructor(key_nibbles_array: Array<Array<number>>) {
		let visitors = key_nibbles_array.map((key_nibbles) => new NodeVisitorEqual(key_nibbles));
		let visitor = visitors.shift();
		if (visitor == null) {
			throw new Error(`Expected a visitor!`);
		}
		this.visitor = new NodeVisitorOr(
			visitor,
			...visitors
		);
	}

	visit(node_nibbles: Array<number>): NodeVisitorOutcome {
		return this.visitor.visit(node_nibbles);
	}
};

export class RadixTreeIncreasingWalker {
	protected block_manager: BlockManager;
	protected node_visitor: NodeVisitor;

	protected * yieldChild(node_bid: number): Iterable<number> {
		yield node_bid;
		if (this.block_manager.getBlockSize(node_bid) >= NodeHead.LENGTH + NodeBody.LENGTH) {
			let body = new NodeBody();
			this.block_manager.readBlock(node_bid, body.buffer, NodeBody.OFFSET);
			for (let i = 0; i < 16; i++) {
				let child_node_bid = body.child(i);
				if (child_node_bid !== 0) {
					yield * this.yieldChild(child_node_bid);
				}
			}
		}
	}

	protected * visitNode(node_bid: number, previous_node_nibbles: Array<number>): Iterable<number> {
		let head = new NodeHead();
		this.block_manager.readBlock(node_bid, head.buffer, 0);
		let node_nibbles = head.prefix();
		let new_node_nibbles = [...previous_node_nibbles, ...node_nibbles];
		let [yield_outcome, check_outcome] = this.node_visitor.visit(new_node_nibbles);
		if (yield_outcome & CURRENT_FLAG) {
			yield node_bid;
		}
		if (this.block_manager.getBlockSize(node_bid) >= NodeHead.LENGTH + NodeBody.LENGTH) {
			let body = new NodeBody();
			this.block_manager.readBlock(node_bid, body.buffer, NodeBody.OFFSET);
			for (let i = 0; i < 16; i++) {
				if (yield_outcome & CHILD_FLAGS[i]) {
					let child_node_bid = body.child(i);
					if (child_node_bid !== 0) {
						yield * this.yieldChild(child_node_bid);
					}
					continue;
				}
				if (check_outcome & CHILD_FLAGS[i]) {
					let child_node_bid = body.child(i);
					if (child_node_bid !== 0) {
						yield * this.visitNode(child_node_bid, [...new_node_nibbles, i]);
					}
					continue;
				}
			}
		}
	}

	constructor(block_manager: BlockManager, node_visitor: NodeVisitor) {
		this.block_manager = block_manager;
		this.node_visitor = node_visitor;
	}

	* traverse(node_bid: number): Iterable<number> {
		yield * this.visitNode(node_bid, []);
	}
};

export class RadixTreeDecreasingWalker {
	protected block_manager: BlockManager;
	protected node_visitor: NodeVisitor;

	protected * yieldChild(node_bid: number): Iterable<number> {
		if (this.block_manager.getBlockSize(node_bid) >= NodeHead.LENGTH + NodeBody.LENGTH) {
			let body = new NodeBody();
			this.block_manager.readBlock(node_bid, body.buffer, NodeBody.OFFSET);
			for (let i = 16 - 1; i >= 0; i--) {
				let child_node_bid = body.child(i);
				if (child_node_bid !== 0) {
					yield * this.yieldChild(child_node_bid);
				}
			}
		}
		yield node_bid;
	}

	protected * visitNode(node_bid: number, previous_node_nibbles: Array<number>): Iterable<number> {
		let head = new NodeHead();
		this.block_manager.readBlock(node_bid, head.buffer, 0);
		let node_nibbles = head.prefix();
		let new_node_nibbles = [...previous_node_nibbles, ...node_nibbles];
		let [yield_outcome, check_outcome] = this.node_visitor.visit(new_node_nibbles);
		if (this.block_manager.getBlockSize(node_bid) >= NodeHead.LENGTH + NodeBody.LENGTH) {
			let body = new NodeBody();
			this.block_manager.readBlock(node_bid, body.buffer, NodeBody.OFFSET);
			for (let i = 16 - 1; i >= 0; i--) {
				if (yield_outcome & CHILD_FLAGS[i]) {
					let child_node_bid = body.child(i);
					if (child_node_bid !== 0) {
						yield * this.yieldChild(child_node_bid);
					}
					continue;
				}
				if (check_outcome & CHILD_FLAGS[i]) {
					let child_node_bid = body.child(i);
					if (child_node_bid !== 0) {
						yield * this.visitNode(child_node_bid, [...new_node_nibbles, i]);
					}
					continue;
				}
			}
		}
		if (yield_outcome & CURRENT_FLAG) {
			yield node_bid;
		}
	}

	constructor(block_manager: BlockManager, node_visitor: NodeVisitor) {
		this.block_manager = block_manager;
		this.node_visitor = node_visitor;
	}

	* traverse(node_bid: number): Iterable<number> {
		yield * this.visitNode(node_bid, []);
	}
};

export abstract class RadixTreeTraverser {
	protected blockManager: BlockManager;
	protected bid: number;

	protected abstract doTraverse(bid: number, keys: Array<Array<number>>, key: Array<number>): Iterable<number>;

	protected * traverseUnconditionally(bid: number): Iterable<number> {
		yield bid;
		yield * this.traverseChildrenUnconditionally(bid);
	}

	protected * traverseChildrenUnconditionally(bid: number): Iterable<number> {
		if (this.blockManager.getBlockSize(bid) >= NodeHead.LENGTH + NodeBody.LENGTH) {
			let body = new NodeBody();
			this.blockManager.readBlock(bid, body.buffer, NodeBody.OFFSET);
			for (let i = 0; i < 16; i++) {
				let child = body.child(i);
				if (child !== 0) {
					yield * this.traverseUnconditionally(child);
				}
			}
		}
	}

	constructor(blockManager: BlockManager, bid: number) {
		this.blockManager = blockManager;
		this.bid = bid;
	}

	traverse(keys: Array<Array<number>>): Iterable<number> {
		return this.doTraverse(this.bid, keys.slice(1), keys[0] ?? []);
	}
};

export class RadixTreeTraverserAt extends RadixTreeTraverser {
	protected * doTraverse(bid: number, keys: Array<Array<number>>, keyNibbles: Array<number>): Iterable<number> {
		let head = new NodeHead();
		this.blockManager.readBlock(bid, head.buffer, 0);
		let nodeNibbles = head.prefix();
		let commonPrefixLength = computeCommonPrefixLength(nodeNibbles, keyNibbles);
		let nextNodeNibble = nodeNibbles[commonPrefixLength] as number | undefined;
		let nextKeyNibble = keyNibbles[commonPrefixLength] as number | undefined;
		if (nextKeyNibble == null) {
			if (nextNodeNibble == null) {
				// Key ("ab") is identical to node ("ab").
				if (keys.length === 0) {
					yield bid;
				} else {
					let subtree = head.subtree();
					if (subtree !== 0) {
						yield * this.doTraverse(subtree, keys.slice(1), keys[0]);
					}
				}
			} else {
				// Key ("a") is prefix to node ("ab").
				return;
			}
		} else {
			if (nextNodeNibble == null) {
				// Node ("a") is prefix to key ("ab").
				if (this.blockManager.getBlockSize(bid) < NodeHead.LENGTH + NodeBody.LENGTH) {
					return;
				}
				let body = new NodeBody();
				this.blockManager.readBlock(bid, body.buffer, NodeBody.OFFSET);
				let child = body.child(nextKeyNibble);
				if (child !== 0) {
					yield * this.doTraverse(child, keys, keyNibbles.slice(commonPrefixLength + 1));
				}
			} else {
				if (nextKeyNibble < nextNodeNibble) {
					// Key ("aa") is sibling before node ("ab").
					return;
				} else {
					// Key ("ac") is sibling after node ("ab").
					return;
				}
			}
		}
	}

	constructor(blockManager: BlockManager, bid: number) {
		super(blockManager, bid);
	}
};

export class RadixTreeTraverserPrefix extends RadixTreeTraverser {
	protected * doTraverse(bid: number, keys: Array<Array<number>>, keyNibbles: Array<number>): Iterable<number> {
		let head = new NodeHead();
		this.blockManager.readBlock(bid, head.buffer, 0);
		let nodeNibbles = head.prefix();
		let commonPrefixLength = computeCommonPrefixLength(nodeNibbles, keyNibbles);
		let nextNodeNibble = nodeNibbles[commonPrefixLength] as number | undefined;
		let nextKeyNibble = keyNibbles[commonPrefixLength] as number | undefined;
		if (nextKeyNibble == null) {
			if (nextNodeNibble == null) {
				// Key ("ab") is identical to node ("ab").
				if (keys.length === 0) {
					yield * this.traverseUnconditionally(bid);
				} else {
					let subtree = head.subtree();
					if (subtree !== 0) {
						yield * this.doTraverse(subtree, keys.slice(1), keys[0]);
					}
				}
			} else {
				// Key ("a") is prefix to node ("ab").
				if (keys.length === 0) {
					yield * this.traverseUnconditionally(bid);
				} else {
					return;
				}
			}
		} else {
			if (nextNodeNibble == null) {
				// Node ("a") is prefix to key ("ab").
				if (this.blockManager.getBlockSize(bid) < NodeHead.LENGTH + NodeBody.LENGTH) {
					return;
				}
				let body = new NodeBody();
				this.blockManager.readBlock(bid, body.buffer, NodeBody.OFFSET);
				let child = body.child(nextKeyNibble);
				if (child !== 0) {
					yield * this.doTraverse(child, keys, keyNibbles.slice(commonPrefixLength + 1));
				}
			} else {
				if (nextKeyNibble < nextNodeNibble) {
					// Key ("aa") is sibling before node ("ab").
					return;
				} else {
					// Key ("ac") is sibling after node ("ab").
					return;
				}
			}
		}
	}

	constructor(blockManager: BlockManager, bid: number) {
		super(blockManager, bid);
	}
};

export class RadixTreeTraverserAtOrAfter extends RadixTreeTraverser {
	protected * doTraverse(bid: number, keys: Array<Array<number>>, keyNibbles: Array<number>): Iterable<number> {
		let head = new NodeHead();
		this.blockManager.readBlock(bid, head.buffer, 0);
		let nodeNibbles = head.prefix();
		let commonPrefixLength = computeCommonPrefixLength(nodeNibbles, keyNibbles);
		let nextNodeNibble = nodeNibbles[commonPrefixLength] as number | undefined;
		let nextKeyNibble = keyNibbles[commonPrefixLength] as number | undefined;
		if (nextKeyNibble == null) {
			if (nextNodeNibble == null) {
				// Key ("ab") is identical to node ("ab").
				if (keys.length === 0) {
					yield * this.traverseUnconditionally(bid);
				} else {
					let subtree = head.subtree();
					if (subtree !== 0) {
						yield * this.doTraverse(subtree, keys.slice(1), keys[0]);
					}
				}
			} else {
				// Key ("a") is prefix to node ("ab").
				if (keys.length === 0) {
					yield * this.traverseUnconditionally(bid);
				} else {
					yield * this.traverseUnconditionally(bid);
				}
			}
		} else {
			if (nextNodeNibble == null) {
				// Node ("a") is prefix to key ("ab").
				if (this.blockManager.getBlockSize(bid) < NodeHead.LENGTH + NodeBody.LENGTH) {
					return;
				}
				let body = new NodeBody();
				this.blockManager.readBlock(bid, body.buffer, NodeBody.OFFSET);
				let child = body.child(nextKeyNibble);
				if (child !== 0) {
					yield * this.doTraverse(child, keys, keyNibbles.slice(commonPrefixLength + 1));
				}
				for (let i = nextKeyNibble + 1; i < 16; i++) {
					let child = body.child(i);
					if (child !== 0) {
						yield * this.traverseUnconditionally(child);
					}
				}
			} else {
				if (nextKeyNibble < nextNodeNibble) {
					// Key ("aa") is sibling before node ("ab").
					yield * this.traverseUnconditionally(bid);
				} else {
					// Key ("ac") is sibling after node ("ab").
					return;
				}
			}
		}
	}

	constructor(blockManager: BlockManager, bid: number) {
		super(blockManager, bid);
	}
};

export class RadixTreeTraverserAfter extends RadixTreeTraverser {
	protected * doTraverse(bid: number, keys: Array<Array<number>>, keyNibbles: Array<number>): Iterable<number> {
		let head = new NodeHead();
		this.blockManager.readBlock(bid, head.buffer, 0);
		let nodeNibbles = head.prefix();
		let commonPrefixLength = computeCommonPrefixLength(nodeNibbles, keyNibbles);
		let nextNodeNibble = nodeNibbles[commonPrefixLength] as number | undefined;
		let nextKeyNibble = keyNibbles[commonPrefixLength] as number | undefined;
		if (nextKeyNibble == null) {
			if (nextNodeNibble == null) {
				// Key ("ab") is identical to node ("ab").
				if (keys.length === 0) {
					yield * this.traverseChildrenUnconditionally(bid);
				} else {
					let subtree = head.subtree();
					if (subtree !== 0) {
						yield * this.doTraverse(subtree, keys.slice(1), keys[0]);
					}
				}
			} else {
				// Key ("a") is prefix to node ("ab").
				if (keys.length === 0) {
					yield * this.traverseUnconditionally(bid);
				} else {
					yield * this.traverseUnconditionally(bid);
				}
			}
		} else {
			if (nextNodeNibble == null) {
				// Node ("a") is prefix to key ("ab").
				if (this.blockManager.getBlockSize(bid) < NodeHead.LENGTH + NodeBody.LENGTH) {
					return;
				}
				let body = new NodeBody();
				this.blockManager.readBlock(bid, body.buffer, NodeBody.OFFSET);
				let child = body.child(nextKeyNibble);
				if (child !== 0) {
					yield * this.doTraverse(child, keys, keyNibbles.slice(commonPrefixLength + 1));
				}
				for (let i = nextKeyNibble + 1; i < 16; i++) {
					let child = body.child(i);
					if (child !== 0) {
						yield * this.traverseUnconditionally(child);
					}
				}
			} else {
				if (nextKeyNibble < nextNodeNibble) {
					// Key ("aa") is sibling before node ("ab").
					yield * this.traverseUnconditionally(bid);
				} else {
					// Key ("ac") is sibling after node ("ab").
					return;
				}
			}
		}
	}

	constructor(blockManager: BlockManager, bid: number) {
		super(blockManager, bid);
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
						subtree = head.subtree(this.blockManager.createBlock(NodeHead.LENGTH, true));
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
				let bidTwo = this.blockManager.createBlock(NodeHead.LENGTH + NodeBody.LENGTH, true);
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
						child = body.child(index, this.blockManager.createBlock(NodeHead.LENGTH, true));
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
				let bidTwo = this.blockManager.createBlock(NodeHead.LENGTH + NodeBody.LENGTH, true);
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

	private doVacate(bid: number): void {
		let head = new NodeHead();
		this.blockManager.readBlock(bid, head.buffer, 0);
		if (this.blockManager.getBlockSize(bid) >= NodeHead.LENGTH + NodeBody.LENGTH) {
			let body = new NodeBody();
			this.blockManager.readBlock(bid, body.buffer, NodeBody.OFFSET);
			for (let i = 0; i < 16; i++) {
				let child = body.child(i);
				if (child !== 0) {
					this.doVacate(child);
				}
			}
		}
		let subtree = head.subtree();
		if (subtree !== 0) {
			this.doVacate(subtree);
		}
		if (bid === this.blockIndex) {
			this.blockManager.clearBlock(bid);
		} else {
			this.blockManager.deleteBlock(bid);
		}
	}

	private traverse(relationship: Relationship, keys: Array<Uint8Array>): Iterable<number> {
		let nibbles = keys.map(getNibblesFromBytes);
		if (relationship === "=") {
			return new RadixTreeTraverserAt(this.blockManager, this.blockIndex)
				.traverse(nibbles);
		}
		if (relationship === "^=") {
			return new RadixTreeTraverserPrefix(this.blockManager, this.blockIndex)
				.traverse(nibbles);
		}
		if (relationship === ">=") {
			return new RadixTreeTraverserAtOrAfter(this.blockManager, this.blockIndex)
				.traverse(nibbles);
		}
		if (relationship === ">") {
			return new RadixTreeTraverserAfter(this.blockManager, this.blockIndex)
				.traverse(nibbles);
		}
		throw new Error("Expected code to be unreachable!");
	}

	constructor(blockManager: BlockManager, blockIndex?: number) {
		this.blockManager = blockManager;
		this.blockIndex = blockIndex ?? blockManager.createBlock(RadixTree.INITIAL_SIZE, true);
	}

	* [Symbol.iterator](): Iterator<number> {
		yield * this.filter("^=", []);
	}

	* branch(relationship: Relationship, keys: Array<Uint8Array>): Iterable<RadixTree> {
		let bids = this.traverse(relationship, keys);
		for (let bid of bids) {
			let head = new NodeHead();
			this.blockManager.readBlock(bid, head.buffer, 0);
			let subtree = head.subtree();
			if (subtree === 0) {
				continue;
			}
			yield new RadixTree(this.blockManager, subtree);
		}
	}

	debug(indent = ""): void {
		let head = new NodeHead();
		this.blockManager.readBlock(this.blockIndex, head.buffer, 0);
		let prefix = head.prefix();
		let resident = head.resident();
		let subtree = head.subtree();
		let total = head.total();
		if (prefix.length > 0) {
			console.log(`${indent}prefix: ${prefix.map((nibble) => nibble.toString(16))}`);
		}
		if (resident !== 0) {
			console.log(`${indent}resident: (${resident})`);
		}
		if (subtree !== 0) {
			console.log(`${indent}subtree: (${subtree})`);
			new RadixTree(this.blockManager, subtree).debug(indent + "\t");
		}
		console.log(`${indent}total: ${total}`);
		if (this.blockManager.getBlockSize(this.blockIndex) >= NodeHead.LENGTH + NodeBody.LENGTH) {
			let body = new NodeBody();
			this.blockManager.readBlock(this.blockIndex, body.buffer, NodeBody.OFFSET);
			for (let i = 0; i < 16; i++) {
				let child = body.child(i);
				if (child !== 0) {
					console.log(`${indent}children[${i.toString(16)}]: (${child})`);
					new RadixTree(this.blockManager, child).debug(indent + "\t");
				}
			}
		}
	}

	delete(): void {
		this.doDelete(this.blockIndex);
	}

	* filter(relationship: Relationship, keys: Array<Uint8Array>, directions?: Array<Direction>): Iterable<number> {
		let nibbles = keys.map(getNibblesFromBytes);
		let treeWalker = new RadixTreeWalker(this.blockManager, relationship, nibbles, directions ?? []);
		yield * treeWalker.traverse(this.blockIndex);
	}

	* get_filtered_node_bids(nodeVisitor: NodeVisitor | undefined, direction: Direction | undefined): Iterable<number> {
		nodeVisitor = nodeVisitor ?? new NodeVisitorPrefix([]);
		let treeWalker = direction === "decreasing" ? new RadixTreeDecreasingWalker(this.blockManager, nodeVisitor) : new RadixTreeIncreasingWalker(this.blockManager, nodeVisitor);
		yield * treeWalker.traverse(this.blockIndex);
	}

	get_resident_bid(): number | undefined {
		let head = new NodeHead();
		this.blockManager.readBlock(this.blockIndex, head.buffer, 0);
		let resident = head.resident();
		if (resident === 0) {
			return;
		}
		return resident;
	}

	get_statistics(): Record<string, Statistic> {
		let statistics: Record<string, Statistic> = {};
		let compactNodes = statistics.compactNodes = {
			entries: 0,
			bytesPerEntry: NodeHead.LENGTH
		};
		let fullNodes = statistics.fullNodes = {
			entries: 0,
			bytesPerEntry: NodeHead.LENGTH + NodeBody.LENGTH
		};
		let blockManager = this.blockManager;
		function traverse(node_bid: number): void {
			let head = new NodeHead();
			blockManager.readBlock(node_bid, head.buffer, 0);
			if (blockManager.getBlockSize(node_bid) >= NodeHead.LENGTH + NodeBody.LENGTH) {
			let body = new NodeBody();
				fullNodes.entries += 1;
				blockManager.readBlock(node_bid, body.buffer, NodeBody.OFFSET);
				for (let i = 0; i < 16; i++) {
					let child = body.child(i);
					if (child !== 0) {
						traverse(child);
					}
				}
			} else {
				compactNodes.entries += 1;
			}
			let subtree = head.subtree();
			if (subtree !== 0) {
				traverse(subtree);
			}
		};
		traverse(this.blockIndex);
		return statistics;
	}

	get_subtree_bid(): number | undefined {
		let head = new NodeHead();
		this.blockManager.readBlock(this.blockIndex, head.buffer, 0);
		let subtree = head.subtree();
		if (subtree === 0) {
			return;
		}
		return subtree;
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
		let bids = this.traverse("=", keys);
		for (let bid of bids) {
			let head = new NodeHead();
			this.blockManager.readBlock(bid, head.buffer, 0);
			let resident = head.resident();
			if (resident === 0) {
				return;
			}
			return resident;
		}
	}

	remove(keys: Array<Uint8Array>): boolean {
		let nibbles = keys.map(getNibblesFromBytes);
		return this.doRemove(nibbles.slice(1), this.blockIndex, nibbles[0] ?? []) != null;
	}

	vacate(): void {
		this.doVacate(this.blockIndex);
	}

	static readonly INITIAL_SIZE = NodeHead.LENGTH;
};
