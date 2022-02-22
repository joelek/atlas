import { BlockHandler } from "../storage";
import { IntegerAssert } from "../asserts";
import { DEBUG } from "../new/env";
import * as is from "../is";
import * as keys from "../keys";
import * as shared from "./shared";

export type Relationship = "^=" | "=" | ">" | ">=" | "<" | "<=";

export type Direction = "increasing" | "decreasing";

export interface SearchResults<A> extends Iterable<A> {
	total(): number;
};

class NodeHead {
	readonly buffer: Buffer;

	private nibbles(offset: number, value?: keys.PathPart): keys.PathPart {
		if (is.present(value)) {
			let length = value.length;
			if (DEBUG) IntegerAssert.between(0, length, 15);
			let nibbles = [length, ...value];
			if ((nibbles.length % 2) === 1) {
				nibbles.push(0);
			}
			let bytes = keys.getBytesFromNibbles(nibbles);
			this.buffer.set(bytes, offset);
			this.buffer.fill(0, offset + bytes.length, offset + 8);
			return value;
		} else {
			let bytes = this.buffer.slice(offset, offset + 8);
			let nibbles = keys.getNibblesFromBytes(bytes);
			let length = nibbles[0];
			return nibbles.slice(1, 1 + length);
		}
	}

	private integer(offset: number, value?: number): number {
		if (is.present(value)) {
			if (DEBUG) IntegerAssert.between(0, value, 0xFFFFFFFFFFFF);
			this.buffer.writeUIntBE(value, offset, 6);
			return value;
		} else {
			return this.buffer.readUIntBE(offset, 6);
		}
	}

	constructor(buffer?: Buffer) {
		buffer = buffer ?? Buffer.alloc(NodeHead.LENGTH);
		if (DEBUG) IntegerAssert.exactly(buffer.length, NodeHead.LENGTH);
		this.buffer = buffer;
	}

	prefix(value?: Array<number>): Array<number> {
		return this.nibbles(0, value);
	}

	resident(value?: number): number {
		return this.integer(8, value);
	}

	parent(value?: number): number {
		return this.integer(14, value);
	}

	subtree(value?: number): number {
		return this.integer(20, value);
	}

	total(value?: number): number {
		return this.integer(26, value);
	}

	static readonly LENGTH = 32;
};

class NodeBody {
	readonly buffer: Buffer;

	private integer(offset: number, value?: number): number {
		if (is.present(value)) {
			if (DEBUG) IntegerAssert.between(0, value, 0xFFFFFFFFFFFF);
			this.buffer.writeUIntBE(value, offset, 6);
			return value;
		} else {
			return this.buffer.readUIntBE(offset, 6);
		}
	}

	constructor(buffer?: Buffer) {
		buffer = buffer ?? Buffer.alloc(NodeBody.LENGTH);
		if (DEBUG) IntegerAssert.exactly(buffer.length, NodeBody.LENGTH);
		this.buffer = buffer;
	}

	child(index: number, value?: number): number {
		if (DEBUG) IntegerAssert.between(0, index, 15);
		return this.integer(index * 6, value);
	}

	static readonly OFFSET = NodeHead.LENGTH;
	static readonly LENGTH = 16 * 6;
};

type NodePath = {
	path: keys.Path,
	blockIndex: number
};

export class CompressedTrie {
	private blockHandler: BlockHandler;
	private blockIndex: number;

	private * createDecreasingIterable(nodePath: NodePath, cursor: { offset: number, length: number }, directions: Array<Direction>): Iterable<shared.Entry<number>> {
		let head = new NodeHead();
		let { path, blockIndex } = nodePath;
		if (DEBUG) IntegerAssert.atLeast(1, path.length);
		this.blockHandler.readBlock(blockIndex, head.buffer, 0);
		let total = head.total();
		if (cursor.offset >= total) {
			cursor.offset -= total;
			return;
		}
		if (cursor.length <= 0) {
			return;
		}
		let prefix = head.prefix();
		if (this.blockHandler.getBlockSize(blockIndex) >= NodeHead.LENGTH + NodeBody.LENGTH) {
			let body = new NodeBody();
			this.blockHandler.readBlock(blockIndex, body.buffer, NodeBody.OFFSET);
			for (let i = 16 - 1; i >= 0; i--) {
				let child = body.child(i);
				if (child !== 0) {
					yield * this.createDecreasingIterable({
						path: [...path.slice(0, -1), [...path[path.length - 1], ...prefix, i]],
						blockIndex: child
					}, cursor, directions);
					if (cursor.length <= 0) {
						return;
					}
				}
			}
		}
		let subtree = head.subtree();
		if (subtree !== 0) {
			yield * this.createIterable({
				path: [...path.slice(0, -1), [...path[path.length - 1], ...prefix], []],
				blockIndex: subtree
			}, cursor, directions);
			if (cursor.length <= 0) {
				return;
			}
		}
		let resident = head.resident();
		if (resident !== 0) {
			if (cursor.offset === 0) {
				yield {
					key: () => keys.getKeyFromPath([...path.slice(0, -1), [...path[path.length - 1], ...prefix]]),
					value: () => resident
				};
				cursor.length -= 1;
				if (cursor.length <= 0) {
					return;
				}
			} else {
				cursor.offset -= 1;
			}
		}
	}

	private * createIncreasingIterable(nodePath: NodePath, cursor: { offset: number, length: number }, directions: Array<Direction>): Iterable<shared.Entry<number>> {
		let head = new NodeHead();
		let { path, blockIndex } = nodePath;
		if (DEBUG) IntegerAssert.atLeast(1, path.length);
		this.blockHandler.readBlock(blockIndex, head.buffer, 0);
		let total = head.total();
		if (cursor.offset >= total) {
			cursor.offset -= total;
			return;
		}
		if (cursor.length <= 0) {
			return;
		}
		let prefix = head.prefix();
		let resident = head.resident();
		if (resident !== 0) {
			if (cursor.offset === 0) {
				yield {
					key: () => keys.getKeyFromPath([...path.slice(0, -1), [...path[path.length - 1], ...prefix]]),
					value: () => resident
				};
				cursor.length -= 1;
				if (cursor.length <= 0) {
					return;
				}
			} else {
				cursor.offset -= 1;
			}
		}
		let subtree = head.subtree();
		if (subtree !== 0) {
			yield * this.createIterable({
				path: [...path.slice(0, -1), [...path[path.length - 1], ...prefix], []],
				blockIndex: subtree
			}, cursor, directions);
			if (cursor.length <= 0) {
				return;
			}
		}
		if (this.blockHandler.getBlockSize(blockIndex) >= NodeHead.LENGTH + NodeBody.LENGTH) {
			let body = new NodeBody();
			this.blockHandler.readBlock(blockIndex, body.buffer, NodeBody.OFFSET);
			for (let i = 0; i < 16; i++) {
				let child = body.child(i);
				if (child !== 0) {
					yield * this.createIncreasingIterable({
						path: [...path.slice(0, -1), [...path[path.length - 1], ...prefix, i]],
						blockIndex: child
					}, cursor, directions);
					if (cursor.length <= 0) {
						return;
					}
				}
			}
		}
	}

	private * createIterable(nodePath: NodePath, cursor: { offset: number, length: number }, directions: Array<Direction>): Iterable<shared.Entry<number>> {
		directions = [...directions];
		let direction = directions.shift() ?? "increasing";
		if (direction === "increasing") {
			yield * this.createIncreasingIterable(nodePath, cursor, directions);
		} else {
			yield * this.createDecreasingIterable(nodePath, cursor, directions);
		}
	}

	private * createNodeIterable(nodePath: NodePath): Iterable<NodePath> {
		let head = new NodeHead();
		let { path, blockIndex } = nodePath;
		this.blockHandler.readBlock(blockIndex, head.buffer, 0);
		let prefix = head.prefix();
		yield {
			path: [...path.slice(0, -1), [...path[path.length - 1], ...prefix]],
			blockIndex: blockIndex
		};
		let subtree = head.subtree();
		if (subtree !== 0) {
			yield * this.createNodeIterable({
				path: [...path.slice(0, -1), [...path[path.length - 1], ...prefix], []],
				blockIndex: subtree
			});
		}
		if (this.blockHandler.getBlockSize(blockIndex) >= NodeHead.LENGTH + NodeBody.LENGTH) {
			let body = new NodeBody();
			this.blockHandler.readBlock(blockIndex, body.buffer, NodeBody.OFFSET);
			for (let i = 0; i < 16; i++) {
				let child = body.child(i);
				if (child !== 0) {
					yield * this.createNodeIterable({
						path: [...path.slice(0, -1), [...path[path.length - 1], ...prefix, i]],
						blockIndex: child
					});
				}
			}
		}
	}

	private updateChildParents(blockIndex: number): void {
		let head = new NodeHead();
		let body = new NodeBody();
		let temp = new NodeHead();
		this.blockHandler.readBlock(blockIndex, head.buffer, 0);
		let subtree = head.subtree();
		if (subtree !== 0) {
			this.blockHandler.readBlock(subtree, temp.buffer, 0);
			temp.parent(blockIndex);
			this.blockHandler.writeBlock(subtree, temp.buffer, 0);
		}
		if (this.blockHandler.getBlockSize(blockIndex) >= NodeHead.LENGTH + NodeBody.LENGTH) {
			this.blockHandler.readBlock(blockIndex, body.buffer, NodeBody.OFFSET);
			for (let i = 0; i < 16; i++) {
				let child =	body.child(i);
				if (child !== 0) {
					this.blockHandler.readBlock(child, temp.buffer, 0);
					temp.parent(blockIndex);
					this.blockHandler.writeBlock(child, temp.buffer, 0);
				}
			}
		}
	}

	private createNodes(key: keys.Key): number {
		let head = new NodeHead();
		let body = new NodeBody();
		let temp = new NodeHead();
		let blockIndex = this.blockIndex;
		for (let [keyIndex, keyPart] of key.entries()) {
			let keyNibbles = keys.getNibblesFromBytes(keyPart);
			while (true) {
				this.blockHandler.readBlock(blockIndex, head.buffer, 0);
				if (keyNibbles.length > 0) {
					if (head.total() === 0) {
						let prefixLength = Math.min(15, keyNibbles.length);
						head.prefix(keyNibbles.slice(0, prefixLength));
						this.blockHandler.writeBlock(blockIndex, head.buffer, 0);
						keyNibbles = keyNibbles.slice(prefixLength);
					} else {
						let nodeNibbles = head.prefix();
						let commonPrefixLength = keys.computeCommonPrefixLength(nodeNibbles, keyNibbles);
						if (commonPrefixLength < nodeNibbles.length) {
							let tempIndex = this.blockHandler.cloneBlock(blockIndex);
							this.blockHandler.readBlock(tempIndex, temp.buffer, 0);
							temp.prefix(nodeNibbles.slice(commonPrefixLength + 1));
							temp.parent(blockIndex);
							this.blockHandler.writeBlock(tempIndex, temp.buffer, 0);
							this.updateChildParents(tempIndex);
							this.blockHandler.resizeBlock(blockIndex, NodeHead.LENGTH + NodeBody.LENGTH);
							let parent = head.parent();
							let total = head.total();
							head.buffer.fill(0);
							head.prefix(nodeNibbles.slice(0, commonPrefixLength));
							head.parent(parent);
							head.total(total);
							this.blockHandler.writeBlock(blockIndex, head.buffer, 0);
							body.buffer.fill(0);
							body.child(nodeNibbles[commonPrefixLength], tempIndex);
							this.blockHandler.writeBlock(blockIndex, body.buffer, NodeBody.OFFSET);
						}
						keyNibbles = keyNibbles.slice(commonPrefixLength);
					}
				}
				let keyNibble = keyNibbles.shift();
				if (is.absent(keyNibble)) {
					break;
				}
				if (this.blockHandler.getBlockSize(blockIndex) < NodeHead.LENGTH + NodeBody.LENGTH) {
					this.blockHandler.resizeBlock(blockIndex, NodeHead.LENGTH + NodeBody.LENGTH);
				}
				this.blockHandler.readBlock(blockIndex, body.buffer, NodeBody.OFFSET);
				if (body.child(keyNibble) === 0) {
					let tempIndex = this.blockHandler.createBlock(NodeHead.LENGTH);
					temp.buffer.fill(0);
					temp.parent(blockIndex);
					this.blockHandler.writeBlock(tempIndex, temp.buffer, 0);
					body.child(keyNibble, tempIndex);
					this.blockHandler.writeBlock(blockIndex, body.buffer, NodeBody.OFFSET);
				}
				blockIndex = body.child(keyNibble);
			}
			if (keyIndex + 1 < key.length) {
				if (head.subtree() === 0) {
					let tempIndex = this.blockHandler.createBlock(NodeHead.LENGTH);
					temp.buffer.fill(0);
					temp.parent(blockIndex);
					this.blockHandler.writeBlock(tempIndex, temp.buffer, 0);
					head.subtree(tempIndex);
					this.blockHandler.writeBlock(blockIndex, head.buffer, 0);
				}
				blockIndex = head.subtree();
			}
		}
		return blockIndex;
	}

	private getMatchingRange2(key: keys.Key, relationship: Relationship): { offset: number, length: number } | undefined {
		let head = new NodeHead();
		this.blockHandler.readBlock(this.blockIndex, head.buffer);
		let total = head.total();
		let traversion = this.traverse(key);
		this.blockHandler.readBlock(traversion.nodePath.blockIndex, head.buffer, 0);
		let resident = head.resident();
		let isPrefix = keys.isPathPrefix(key.map(keys.getNibblesFromBytes), traversion.nodePath.path);
		if (relationship === "=") {
			if (traversion.keyOrderRelativeToNode === 0) {
				return {
					offset: traversion.skipped,
					length: (resident !== 0 ? 1 : 0)
				};
			}
		} else if (relationship === "^=") {
			if (traversion.keyOrderRelativeToNode === 0) {
				return {
					offset: traversion.skipped,
					length: head.total()
				};
			} else if (traversion.keyOrderRelativeToNode < 0) {
				return {
					offset: traversion.skipped,
					length: isPrefix ? head.total() : 0
				};
			}
		} else if (relationship === "<") {
			if (traversion.keyOrderRelativeToNode === 0) {
				return {
					offset: 0,
					length: traversion.skipped
				};
			} else if (traversion.keyOrderRelativeToNode < 0) {
				return {
					offset: 0,
					length: traversion.skipped
				};
			}
		} else if (relationship === "<=") {
			if (traversion.keyOrderRelativeToNode === 0) {
				return {
					offset: 0,
					length: traversion.skipped + (resident !== 0 ? 1 : 0)
				};
			} else {
				return {
					offset: 0,
					length: traversion.skipped
				};
			}
		} else if (relationship === ">") {
			if (traversion.keyOrderRelativeToNode === 0) {
				return {
					offset: traversion.skipped + (resident !== 0 ? 1 : 0),
					length: total - traversion.skipped - (resident !== 0 ? 1 : 0)
				};
			} else {
				return {
					offset: traversion.skipped,
					length: total - traversion.skipped
				};
			}
		} else if (relationship === ">=") {
			if (traversion.keyOrderRelativeToNode === 0) {
				return {
					offset: traversion.skipped,
					length: total - traversion.skipped
				};
			} else {
				return {
					offset: traversion.skipped,
					length: total - traversion.skipped
				};
			}
		}
	}

	private getMatchingRange(key: keys.Key, relationship: Relationship): { offset: number, length: number } | undefined {
		let head = new NodeHead();
		let next = new NodeHead();
		let body = new NodeBody();
		let blockIndex = this.blockIndex;
		this.blockHandler.readBlock(blockIndex, head.buffer);
		let count = 0;
		let total = head.total();
		for (let [keyIndex, keyPart] of key.entries()) {
			let keyNibbles = keys.getNibblesFromBytes(keyPart);
			while (true) {
				this.blockHandler.readBlock(blockIndex, head.buffer);
				let nodeNibbles = head.prefix();
				if (keyNibbles.length > 0) {
					let commonPrefixLength = keys.computeCommonPrefixLength(nodeNibbles, keyNibbles);
					if (commonPrefixLength < nodeNibbles.length) {
						if (relationship === "^=") {
							if (!(keyIndex + 1 < key.length)) {
								return {
									offset: count,
									length: head.total()
								};
							}
						} else if (relationship === "<") {
							return {
								offset: 0,
								length: count
							};
						} else if (relationship === "<=") {
							return {
								offset: 0,
								length: count
							};
						} else if (relationship === ">") {
							return {
								offset: count,
								length: total - count
							};
						} else if (relationship === ">=") {
							return {
								offset: count,
								length: total - count
							};
						}
						return;
					}
					keyNibbles = keyNibbles.slice(commonPrefixLength);
				}
				let keyNibble = keyNibbles.shift();
				if (is.absent(keyNibble)) {
					break;
				}
				let resident = head.resident();
				if (resident !== 0) {
					count += 1;
				}
				if (this.blockHandler.getBlockSize(blockIndex) < NodeHead.LENGTH + NodeBody.LENGTH) {
					if (relationship === "<") {
						return {
							offset: 0,
							length: count
						};
					} else if (relationship === "<=") {
						return {
							offset: 0,
							length: count
						};
					} else if (relationship === ">") {
						return {
							offset: count,
							length: total - count
						};
					} else if (relationship === ">=") {
						return {
							offset: count,
							length: total - count
						};
					}
					return;
				}
				this.blockHandler.readBlock(blockIndex, body.buffer, NodeBody.OFFSET);
				for (let i = 0; i < keyNibble; i++) {
					let child = body.child(i);
					if (child !== 0) {
						this.blockHandler.readBlock(child, next.buffer, 0);
						count += next.total();
					}
				}
				let child = body.child(keyNibble);
				if (child === 0) {
					if (relationship === "<") {
						return {
							offset: 0,
							length: count
						};
					} else if (relationship === "<=") {
						return {
							offset: 0,
							length: count
						};
					} else if (relationship === ">") {
						return {
							offset: count,
							length: total - count
						};
					} else if (relationship === ">=") {
						return {
							offset: count,
							length: total - count
						};
					}
					return;
				}
				blockIndex = child;
			}
			if (keyIndex + 1 < key.length) {
				let resident = head.resident();
				if (resident !== 0) {
					count += 1;
				}
				let subtree = head.subtree();
				if (subtree === 0) {
					if (relationship === "<") {
						return {
							offset: 0,
							length: count
						};
					} else if (relationship === "<=") {
						return {
							offset: 0,
							length: count
						};
					} else if (relationship === ">") {
						return {
							offset: count,
							length: total - count
						};
					} else if (relationship === ">=") {
						return {
							offset: count,
							length: total - count
						};
					}
					return;
				}
				blockIndex = subtree;
			}
		}
		let resident = head.resident();
		if (relationship === "=") {
			if (resident !== 0) {
				return {
					offset: count,
					length: 1
				};
			}
		} else if (relationship === "^=") {
			return {
				offset: count,
				length: head.total()
			};
		} else if (relationship === "<") {
			return {
				offset: 0,
				length: count
			};
		} else if (relationship === "<=") {
			count += resident !== 0 ? 1 : 0;
			return {
				offset: 0,
				length: count
			};
		} else if (relationship === ">") {
			if (keys.comparePath([head.prefix()], key.map(keys.getNibblesFromBytes)) <= 0) {
				count += resident !== 0 ? 1 : 0;
			}
			return {
				offset: count,
				length: total - count
			};
		} else if (relationship === ">=") {
			return {
				offset: count,
				length: total - count
			};
		}
		return;
	}

	private traverse(key: keys.Key): { nodePath: NodePath, skipped: number, keyOrderRelativeToNode: number } {
		let head = new NodeHead();
		let next = new NodeHead();
		let body = new NodeBody();
		let path = [[]] as keys.Path;
		let blockIndex = this.blockIndex;
		let skipped = 0;
		outer: for (let [keyIndex, keyPart] of key.entries()) {
			let keyNibbles = keys.getNibblesFromBytes(keyPart);
			inner: while (keyNibbles.length > 0) {
				this.blockHandler.readBlock(blockIndex, head.buffer);
				let nodeNibbles = head.prefix();
				let commonPrefixLength = keys.computeCommonPrefixLength(nodeNibbles, keyNibbles);
				if (commonPrefixLength < nodeNibbles.length) {
					break outer;
				}
				keyNibbles.splice(0, commonPrefixLength);
				let keyNibble = keyNibbles.shift();
				if (is.absent(keyNibble)) {
					break inner;
				}
				if (this.blockHandler.getBlockSize(blockIndex) < NodeHead.LENGTH + NodeBody.LENGTH) {
					break outer;
				}
				if (head.resident() !== 0) {
					skipped += 1;
				}
				this.blockHandler.readBlock(blockIndex, body.buffer, NodeBody.OFFSET);
				let child = body.child(keyNibble);
				if (child === 0) {
					let precedingNibble: number | undefined;
					for (let i = keyNibble - 1; i >= 0; i--) {
						let child = body.child(i);
						if (child !== 0) {
							precedingNibble = i;
							break;
						}
					}
					if (is.present(precedingNibble)) {
						for (let i = 0; i < precedingNibble; i++) {
							let child = body.child(i);
							if (child !== 0) {
								this.blockHandler.readBlock(child, next.buffer, 0);
								skipped += next.total();
							}
						}
						path[path.length-1].push(...nodeNibbles, precedingNibble);
						blockIndex = body.child(precedingNibble);
					}
					break outer;
				}
				for (let i = 0; i < keyNibble; i++) {
					let child = body.child(i);
					if (child !== 0) {
						this.blockHandler.readBlock(child, next.buffer, 0);
						skipped += next.total();
					}
				}
				path[path.length-1].push(...nodeNibbles, keyNibble);
				blockIndex = child;
			}
			if (keyIndex + 1 < key.length) {
				let resident = head.resident();
				if (resident !== 0) {
					skipped += 1;
				}
				let subtree = head.subtree();
				if (subtree === 0) {
					break outer;
				}
				path[path.length-1].push(...head.prefix());
				path.push([]);
				blockIndex = subtree;
			}
		}
		this.blockHandler.readBlock(blockIndex, head.buffer);
		path[path.length-1].push(...head.prefix());
		return {
			nodePath: {
				path,
				blockIndex
			},
			skipped,
			keyOrderRelativeToNode: keys.comparePath(key.map(keys.getNibblesFromBytes), path)
		};
	}

	private updateTotal(blockIndex: number, delta: number): void {
		let head = new NodeHead();
		let body = new NodeBody();
		let deletedIndex: number | undefined;
		let lastIndex: number | undefined;
		while (blockIndex !== 0) {
			this.blockHandler.readBlock(blockIndex, head.buffer, 0);
			head.total(head.total() + delta);
			if (head.total() > 0 || blockIndex === this.blockIndex) {
				if (head.subtree() === deletedIndex) {
					head.subtree(0);
				}
				if (this.blockHandler.getBlockSize(blockIndex) >= NodeHead.LENGTH + NodeBody.LENGTH) {
					this.blockHandler.readBlock(blockIndex, body.buffer, NodeBody.OFFSET);
					for (let i = 0; i < 16; i++) {
						if (body.child(i) === deletedIndex) {
							body.child(i, 0);
						}
					}
					this.blockHandler.writeBlock(blockIndex, body.buffer, NodeBody.OFFSET);
				}
				this.blockHandler.writeBlock(blockIndex, head.buffer, 0);
				deletedIndex = undefined;
			} else {
				this.blockHandler.deleteBlock(blockIndex);
				deletedIndex = blockIndex;
			}
			lastIndex = blockIndex;
			blockIndex = head.parent();
		}
	}

	constructor(blockHandler: BlockHandler, blockIndex: number) {
		this.blockHandler = blockHandler;
		this.blockIndex = blockIndex;
	}

	* [Symbol.iterator](): Iterator<shared.Entry<number>> {
		yield * this.createIterable({
			path: [[]],
			blockIndex: this.blockIndex
		}, {
			offset: 0,
			length: this.length()
		}, []);
	}

	debug(nodePath?: NodePath): void {
		nodePath = nodePath ?? {
			path: [[]],
			blockIndex: this.blockIndex
		};
		let head = new NodeHead();
		for (let node of this.createNodeIterable(nodePath)) {
			this.blockHandler.readBlock(node.blockIndex, head.buffer, 0);
			let key = node.path.map((pathPart) => {
				return "0x" + pathPart.map((nibble) => nibble.toString(16)).join("");
			}).join(", ");
			console.log(key, node.blockIndex, {
				prefix: head.prefix(),
				parent: head.parent(),
				total: head.total(),
				resident: head.resident(),
				subtree: head.subtree()
			});
		}
	}

	branch(key: keys.Key): CompressedTrie | undefined {
		let traversion = this.traverse(key);
		if (traversion.keyOrderRelativeToNode !== 0) {
			return;
		}
		let { blockIndex } = traversion.nodePath;
		let head = new NodeHead();
		this.blockHandler.readBlock(blockIndex, head.buffer, 0);
		let subtree = head.subtree();
		if (subtree === 0) {
			return;
		}
		return new CompressedTrie(this.blockHandler, subtree);
	}

	private doDelete(index: number): void {
		let head = new NodeHead();
		this.blockHandler.readBlock(index, head.buffer, 0);
		let subtree = head.subtree();
		if (this.blockHandler.getBlockSize(index) >= NodeHead.LENGTH + NodeBody.LENGTH) {
			let body = new NodeBody();
			this.blockHandler.readBlock(index, body.buffer, NodeBody.OFFSET);
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
		this.blockHandler.deleteBlock(index);
	}

	delete(): void {
		this.doDelete(this.blockIndex);
	}

	export(): { block: number } {
		return {
			block: this.blockIndex
		};
	}

	insert(key: keys.Key, value: number): boolean {
		let head = new NodeHead();
		let blockIndex = this.createNodes(key);
		this.blockHandler.readBlock(blockIndex, head.buffer, 0);
		if (head.resident() === 0) {
			head.resident(value);
			this.blockHandler.writeBlock(blockIndex, head.buffer, 0);
			this.updateTotal(blockIndex, 1);
			return true;
		} else {
			head.resident(value);
			this.blockHandler.writeBlock(blockIndex, head.buffer, 0);
			return false;
		}
	}

	length(): number {
		let head = new NodeHead();
		this.blockHandler.readBlock(this.blockIndex, head.buffer, 0);
		return head.total();
	}

	lookup(key: keys.Key): number | undefined {
		let head = new NodeHead();
		let traversion = this.traverse(key);
		if (traversion.keyOrderRelativeToNode !== 0) {
			return;
		}
		let { blockIndex } = traversion.nodePath;
		this.blockHandler.readBlock(blockIndex, head.buffer, 0);
		let resident = head.resident();
		if (resident === 0) {
			return;
		}
		return resident;
	}

	remove(key: keys.Key): boolean {
		let head = new NodeHead();
		let traversion = this.traverse(key);
		if (traversion.keyOrderRelativeToNode !== 0) {
			return false;
		}
		let { blockIndex } = traversion.nodePath;
		this.blockHandler.readBlock(blockIndex, head.buffer, 0);
		if (head.resident() === 0) {
			return false;
		}
		head.resident(0);
		this.blockHandler.writeBlock(blockIndex, head.buffer, 0);
		this.updateTotal(blockIndex, -1);
		return true;
	}

	search(key: keys.Key, relationship: Relationship, options?: { anchor?: keys.Key, offset?: number, length?: number, directions?: Array<Direction> }): SearchResults<shared.Entry<number>> {
		let range = this.getMatchingRange(key, relationship);
		if (is.absent(range)) {
			return {
				[Symbol.iterator]: () => [][Symbol.iterator](),
				total: () => 0
			};
		}
		let directions = options?.directions ?? [];
		let direction = directions[0] ?? "increasing";
		let anchor = options?.anchor;
		if (is.present(anchor)) {
			let anchorRange = this.getMatchingRange(anchor, direction === "increasing" ? ">" : "<");
			if (is.present(anchorRange)) {
				range = anchorRange; // TODO: Overlap.
			}
		}
		let offset = Math.max(0, Math.min(options?.offset ?? 0, range.length));
		let length = Math.max(0, Math.min(options?.length ?? 10, range.length - offset));
		if (direction === "increasing") {
			offset += range.offset;
		} else {
			let head = new NodeHead();
			this.blockHandler.readBlock(this.blockIndex, head.buffer, 0);
			offset += head.total() - (range.length + range.offset);
		}
		let iterable = this.createIterable({
			path: [[]],
			blockIndex: this.blockIndex
		}, {
			offset,
			length
		}, directions);
		let total = range.length;
		return {
			* [Symbol.iterator]() {
				yield * iterable;
			},
			total: () => total
		};
	}

	static readonly INITIAL_SIZE = NodeHead.LENGTH;
};
