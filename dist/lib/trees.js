"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RadixTree = exports.combineRanges = exports.NodeBody = exports.NodeHead = exports.getBytesFromNibbles = exports.getNibblesFromBytes = exports.computeCommonPrefixLength = void 0;
const asserts_1 = require("../mod/asserts");
const chunks_1 = require("./chunks");
const utils_1 = require("./utils");
const variables_1 = require("./variables");
function computeCommonPrefixLength(one, two) {
    let length = Math.min(one.length, two.length);
    for (let i = 0; i < length; i++) {
        if (one[i] !== two[i]) {
            return i;
        }
    }
    return length;
}
exports.computeCommonPrefixLength = computeCommonPrefixLength;
;
function getNibblesFromBytes(buffer) {
    let nibbles = new Array();
    for (let byte of buffer) {
        let one = (byte >> 4) & 0x0F;
        let two = (byte >> 0) & 0x0F;
        nibbles.push(one, two);
    }
    return nibbles;
}
exports.getNibblesFromBytes = getNibblesFromBytes;
;
function getBytesFromNibbles(nibbles) {
    if (variables_1.DEBUG)
        asserts_1.IntegerAssert.exactly(nibbles.length % 2, 0);
    let bytes = new Array();
    for (let i = 0; i < nibbles.length; i += 2) {
        let one = nibbles[i + 0];
        if (variables_1.DEBUG)
            asserts_1.IntegerAssert.between(0, one, 15);
        let two = nibbles[i + 1];
        if (variables_1.DEBUG)
            asserts_1.IntegerAssert.between(0, two, 15);
        let byte = (one << 4) | (two << 0);
        bytes.push(byte);
    }
    return Uint8Array.from(bytes);
}
exports.getBytesFromNibbles = getBytesFromNibbles;
;
class NodeHead extends chunks_1.Chunk {
    nibbles(offset, length, value) {
        if (value != null) {
            if (variables_1.DEBUG)
                asserts_1.IntegerAssert.between(0, value.length, length * 2 - 1);
            let nibbles = [value.length, ...value];
            if ((nibbles.length % 2) === 1) {
                nibbles.push(0);
            }
            let bytes = getBytesFromNibbles(nibbles);
            if (variables_1.DEBUG)
                asserts_1.IntegerAssert.between(0, bytes.length, length);
            this.buffer.set(bytes, offset);
            this.buffer.fill(0, offset + bytes.length, offset + length);
            return value;
        }
        else {
            let bytes = this.buffer.subarray(offset, offset + length);
            let nibbles = getNibblesFromBytes(bytes);
            return nibbles.slice(1, 1 + nibbles[0]);
        }
    }
    constructor(buffer) {
        super(buffer ?? new Uint8Array(NodeHead.LENGTH));
        if (variables_1.DEBUG)
            asserts_1.IntegerAssert.exactly(this.buffer.length, NodeHead.LENGTH);
    }
    prefix(value) {
        return this.nibbles(0, 8, value);
    }
    resident(value) {
        return utils_1.Binary.unsigned(this.buffer, 8, 6, value);
    }
    parent(value) {
        return utils_1.Binary.unsigned(this.buffer, 14, 6, value);
    }
    subtree(value) {
        return utils_1.Binary.unsigned(this.buffer, 20, 6, value);
    }
    total(value) {
        return utils_1.Binary.unsigned(this.buffer, 26, 6, value);
    }
    static LENGTH = 32;
}
exports.NodeHead = NodeHead;
;
class NodeBody extends chunks_1.Chunk {
    constructor(buffer) {
        super(buffer ?? new Uint8Array(NodeBody.LENGTH));
        if (variables_1.DEBUG)
            asserts_1.IntegerAssert.exactly(this.buffer.length, NodeBody.LENGTH);
    }
    child(index, value) {
        if (variables_1.DEBUG)
            asserts_1.IntegerAssert.between(0, index, 15);
        return utils_1.Binary.unsigned(this.buffer, index * 6, 6, value);
    }
    static OFFSET = NodeHead.LENGTH;
    static LENGTH = 16 * 6;
}
exports.NodeBody = NodeBody;
;
function combineRanges(one, two) {
    if (one.offset > two.offset) {
        return combineRanges(two, one);
    }
    let gap = two.offset - (one.offset + one.length);
    if (gap >= 0) {
        return;
    }
    let overlap = 0 - gap;
    let offset = two.offset;
    let length = Math.min(overlap, two.length);
    return {
        offset,
        length
    };
}
exports.combineRanges = combineRanges;
;
class RadixTree {
    blockManager;
    blockIndex;
    *createDecreasingIterable(blockIndex, cursor, directions) {
        let head = new NodeHead();
        this.blockManager.readBlock(blockIndex, head.buffer, 0);
        let total = head.total();
        if (cursor.offset >= total) {
            cursor.offset -= total;
            return;
        }
        if (cursor.length <= 0) {
            return;
        }
        if (this.blockManager.getBlockSize(blockIndex) >= NodeHead.LENGTH + NodeBody.LENGTH) {
            let body = new NodeBody();
            this.blockManager.readBlock(blockIndex, body.buffer, NodeBody.OFFSET);
            for (let i = 16 - 1; i >= 0; i--) {
                let child = body.child(i);
                if (child !== 0) {
                    yield* this.createDecreasingIterable(child, cursor, directions);
                    if (cursor.length <= 0) {
                        return;
                    }
                }
            }
        }
        let subtree = head.subtree();
        if (subtree !== 0) {
            yield* this.createIterable(subtree, cursor, directions);
            if (cursor.length <= 0) {
                return;
            }
        }
        let resident = head.resident();
        if (resident !== 0) {
            if (cursor.offset === 0) {
                yield resident;
                cursor.length -= 1;
                if (cursor.length <= 0) {
                    return;
                }
            }
            else {
                cursor.offset -= 1;
            }
        }
    }
    *createIncreasingIterable(blockIndex, cursor, directions) {
        let head = new NodeHead();
        this.blockManager.readBlock(blockIndex, head.buffer, 0);
        let total = head.total();
        if (cursor.offset >= total) {
            cursor.offset -= total;
            return;
        }
        if (cursor.length <= 0) {
            return;
        }
        let resident = head.resident();
        if (resident !== 0) {
            if (cursor.offset === 0) {
                yield resident;
                cursor.length -= 1;
                if (cursor.length <= 0) {
                    return;
                }
            }
            else {
                cursor.offset -= 1;
            }
        }
        let subtree = head.subtree();
        if (subtree !== 0) {
            yield* this.createIterable(subtree, cursor, directions);
            if (cursor.length <= 0) {
                return;
            }
        }
        if (this.blockManager.getBlockSize(blockIndex) >= NodeHead.LENGTH + NodeBody.LENGTH) {
            let body = new NodeBody();
            this.blockManager.readBlock(blockIndex, body.buffer, NodeBody.OFFSET);
            for (let i = 0; i < 16; i++) {
                let child = body.child(i);
                if (child !== 0) {
                    yield* this.createIncreasingIterable(child, cursor, directions);
                    if (cursor.length <= 0) {
                        return;
                    }
                }
            }
        }
    }
    *createIterable(blockIndex, cursor, directions) {
        directions = [...directions];
        let direction = directions.shift() ?? "increasing";
        if (direction === "increasing") {
            yield* this.createIncreasingIterable(blockIndex, cursor, directions);
        }
        else {
            yield* this.createDecreasingIterable(blockIndex, cursor, directions);
        }
    }
    updateChildParents(blockIndex) {
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
                let child = body.child(i);
                if (child !== 0) {
                    this.blockManager.readBlock(child, temp.buffer, 0);
                    temp.parent(blockIndex);
                    this.blockManager.writeBlock(child, temp.buffer, 0);
                }
            }
        }
    }
    createNodes(key) {
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
                    }
                    else {
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
    getRange(key, relationship) {
        let head = new NodeHead();
        this.blockManager.readBlock(this.blockIndex, head.buffer, 0);
        let total = head.total();
        let { offset, blockIndex, prefixBlockIndex } = { ...this.getOffset(key) };
        let identicalMatch = false;
        let prefixMatch = false;
        if (blockIndex != null) {
            this.blockManager.readBlock(blockIndex, head.buffer, 0);
            identicalMatch = head.resident() !== 0;
            prefixMatch = true;
        }
        if (prefixBlockIndex != null) {
            this.blockManager.readBlock(prefixBlockIndex, head.buffer, 0);
            prefixMatch = true;
        }
        if (relationship === "=") {
            if (identicalMatch) {
                return {
                    offset: offset,
                    length: 1
                };
            }
        }
        else if (relationship === "^=") {
            if (prefixMatch) {
                return {
                    offset: offset,
                    length: head.total()
                };
            }
        }
        else if (relationship === "<") {
            return {
                offset: 0,
                length: offset
            };
        }
        else if (relationship === "<=") {
            offset += identicalMatch ? 1 : 0;
            return {
                offset: 0,
                length: offset
            };
        }
        else if (relationship === ">") {
            offset += identicalMatch ? 1 : 0;
            return {
                offset: offset,
                length: total - offset
            };
        }
        else if (relationship === ">=") {
            return {
                offset: offset,
                length: total - offset
            };
        }
    }
    getOffset(key) {
        let head = new NodeHead();
        let next = new NodeHead();
        let body = new NodeBody();
        let blockIndex = this.blockIndex;
        let offset = 0;
        for (let [keyIndex, keyPart] of key.entries()) {
            let keyNibbles = getNibblesFromBytes(keyPart);
            while (true) {
                this.blockManager.readBlock(blockIndex, head.buffer);
                let nodeNibbles = head.prefix();
                let commonPrefixLength = computeCommonPrefixLength(nodeNibbles, keyNibbles);
                if (commonPrefixLength < nodeNibbles.length) {
                    return {
                        offset,
                        prefixBlockIndex: blockIndex
                    };
                }
                keyNibbles.splice(0, commonPrefixLength);
                let keyNibble = keyNibbles.shift();
                if (keyNibble == null) {
                    break;
                }
                if (head.resident() !== 0) {
                    offset += 1;
                }
                if (this.blockManager.getBlockSize(blockIndex) < NodeHead.LENGTH + NodeBody.LENGTH) {
                    return {
                        offset
                    };
                }
                this.blockManager.readBlock(blockIndex, body.buffer, NodeBody.OFFSET);
                for (let i = 0; i < keyNibble; i++) {
                    let child = body.child(i);
                    if (child !== 0) {
                        this.blockManager.readBlock(child, next.buffer, 0);
                        offset += next.total();
                    }
                }
                let child = body.child(keyNibble);
                if (child === 0) {
                    return {
                        offset
                    };
                }
                blockIndex = child;
            }
            if (keyIndex + 1 < key.length) {
                let resident = head.resident();
                if (resident !== 0) {
                    offset += 1;
                }
                let subtree = head.subtree();
                if (subtree === 0) {
                    return {
                        offset
                    };
                }
                blockIndex = subtree;
            }
        }
        return {
            offset,
            blockIndex
        };
    }
    updateTotal(blockIndex, delta) {
        let head = new NodeHead();
        let body = new NodeBody();
        let deletedIndex;
        let lastIndex;
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
            }
            else {
                this.blockManager.deleteBlock(blockIndex);
                deletedIndex = blockIndex;
            }
            lastIndex = blockIndex;
            blockIndex = head.parent();
        }
    }
    doDelete(index) {
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
    constructor(blockManager, blockIndex) {
        this.blockManager = blockManager;
        this.blockIndex = blockIndex;
    }
    *[Symbol.iterator]() {
        yield* this.search([], "^=");
    }
    branch(key) {
        let { blockIndex } = { ...this.getOffset(key) };
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
    delete() {
        this.doDelete(this.blockIndex);
    }
    insert(key, value) {
        let head = new NodeHead();
        let blockIndex = this.createNodes(key);
        this.blockManager.readBlock(blockIndex, head.buffer, 0);
        if (head.resident() === 0) {
            head.resident(value);
            this.blockManager.writeBlock(blockIndex, head.buffer, 0);
            this.updateTotal(blockIndex, 1);
            return true;
        }
        else {
            head.resident(value);
            this.blockManager.writeBlock(blockIndex, head.buffer, 0);
            return false;
        }
    }
    length() {
        let head = new NodeHead();
        this.blockManager.readBlock(this.blockIndex, head.buffer, 0);
        return head.total();
    }
    lookup(key) {
        let { blockIndex } = { ...this.getOffset(key) };
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
    remove(key) {
        let { blockIndex } = { ...this.getOffset(key) };
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
    *search(key, relationship, options) {
        let range = this.getRange(key, relationship);
        if (range == null) {
            return;
        }
        let directions = options?.directions ?? [];
        let direction = directions[0] ?? "increasing";
        let anchor = options?.anchor;
        if (anchor != null) {
            let anchorRange = this.getRange(anchor, direction === "increasing" ? ">" : "<");
            if (anchorRange != null) {
                range = combineRanges(range, anchorRange);
                if (range == null) {
                    return;
                }
            }
        }
        let offset = Math.max(0, Math.min(options?.offset ?? 0, range.length));
        let length = Math.max(0, Math.min(options?.length ?? 10, range.length - offset));
        if (direction === "increasing") {
            offset += range.offset;
        }
        else {
            let head = new NodeHead();
            this.blockManager.readBlock(this.blockIndex, head.buffer, 0);
            offset += head.total() - (range.length + range.offset);
        }
        yield* this.createIterable(this.blockIndex, {
            offset,
            length
        }, directions);
    }
    static INITIAL_SIZE = NodeHead.LENGTH;
}
exports.RadixTree = RadixTree;
;
