"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RadixTree = exports.RadixTreeTraverserAtOrAfter = exports.RadixTreeTraverserPrefix = exports.RadixTreeTraverserAt = exports.RadixTreeTraverser = exports.RadixTreeWalker = exports.NodeBody = exports.NodeHead = exports.getBytesFromNibbles = exports.getNibblesFromBytes = exports.computeCommonPrefixLength = void 0;
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
                asserts_1.IntegerAssert.between(0, value.length, length * 2);
            let bytes = getBytesFromNibbles(value.length % 2 === 1 ? [...value, 0] : value);
            this.prefixLength(value.length);
            this.buffer.set(bytes, offset);
            this.buffer.fill(0, offset + bytes.length, offset + length);
            return value;
        }
        else {
            let bytes = this.buffer.subarray(offset, offset + length);
            let nibbles = getNibblesFromBytes(bytes);
            return nibbles.slice(0, this.prefixLength());
        }
    }
    constructor(buffer) {
        super(buffer ?? new Uint8Array(NodeHead.LENGTH));
        if (variables_1.DEBUG)
            asserts_1.IntegerAssert.exactly(this.buffer.length, NodeHead.LENGTH);
    }
    prefixLength(value) {
        return utils_1.Binary.unsigned(this.buffer, 0, 1, value);
    }
    prefix(value) {
        return this.nibbles(1, NodeHead.MAX_PREFIX_BYTES, value);
    }
    resident(value) {
        return utils_1.Binary.unsigned(this.buffer, 14, 6, value);
    }
    subtree(value) {
        return utils_1.Binary.unsigned(this.buffer, 20, 6, value);
    }
    total(value) {
        return utils_1.Binary.unsigned(this.buffer, 26, 6, value);
    }
    static LENGTH = 32;
    static MAX_PREFIX_BYTES = 13;
    static MAX_PREFIX_NIBBLES = NodeHead.MAX_PREFIX_BYTES * 2;
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
class RadixTreeWalker {
    blockManager;
    relationship;
    keys;
    directions;
    *doYield(bid, depth, relationship, reverse, include) {
        let iterables = [];
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
                        }
                        else if (relationship === "<=") {
                            relationship = ">=";
                        }
                        else if (relationship === ">") {
                            relationship = "<";
                        }
                        else if (relationship === ">=") {
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
            yield* iterable;
        }
    }
    *onKeyIsNodeKey(bid, depth, relationship, reverse) {
        let iterables = [];
        if (relationship === "^=") {
            if (depth === this.keys.length - 1) {
                iterables.push(this.doYield(bid, depth, relationship, reverse, { resident: true, subtree: true, children: true }));
            }
            else {
                let head = new NodeHead();
                this.blockManager.readBlock(bid, head.buffer, 0);
                let subtree = head.subtree();
                if (subtree !== 0) {
                    iterables.push(this.doTraverse(subtree, depth + 1));
                }
            }
        }
        else if (relationship === "=") {
            if (depth === this.keys.length - 1) {
                iterables.push(this.doYield(bid, depth, relationship, reverse, { resident: true, subtree: false, children: false }));
            }
            else {
                let head = new NodeHead();
                this.blockManager.readBlock(bid, head.buffer, 0);
                let subtree = head.subtree();
                if (subtree !== 0) {
                    iterables.push(this.doTraverse(subtree, depth + 1));
                }
            }
        }
        else if (relationship === ">") {
            if (depth === this.keys.length - 1) {
                iterables.push(this.doYield(bid, depth, relationship, reverse, { resident: false, subtree: true, children: true }));
            }
            else {
                let head = new NodeHead();
                this.blockManager.readBlock(bid, head.buffer, 0);
                let subtree = head.subtree();
                if (subtree !== 0) {
                    iterables.push(this.doTraverse(subtree, depth + 1));
                }
                iterables.push(this.doYield(bid, depth, relationship, reverse, { resident: false, subtree: false, children: true }));
            }
        }
        else if (relationship === ">=") {
            if (depth === this.keys.length - 1) {
                iterables.push(this.doYield(bid, depth, relationship, reverse, { resident: true, subtree: true, children: true }));
            }
            else {
                let head = new NodeHead();
                this.blockManager.readBlock(bid, head.buffer, 0);
                let subtree = head.subtree();
                if (subtree !== 0) {
                    iterables.push(this.doTraverse(subtree, depth + 1));
                }
                iterables.push(this.doYield(bid, depth, relationship, reverse, { resident: false, subtree: false, children: true }));
            }
        }
        else if (relationship === "<") {
            if (depth === this.keys.length - 1) {
                iterables.push(this.doYield(bid, depth, relationship, reverse, { resident: false, subtree: false, children: false }));
            }
            else {
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
        else if (relationship === "<=") {
            if (depth === this.keys.length - 1) {
                iterables.push(this.doYield(bid, depth, relationship, reverse, { resident: true, subtree: false, children: false }));
            }
            else {
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
            yield* iterable;
        }
    }
    *onKeyIsPrefixForNodeKey(bid, depth, relationship, reverse) {
        let iterables = [];
        if (relationship === "^=") {
            if (depth === this.keys.length - 1) {
                iterables.push(this.doYield(bid, depth, relationship, reverse, { resident: true, subtree: true, children: true }));
            }
        }
        else if (relationship === ">") {
            iterables.push(this.doYield(bid, depth, relationship, reverse, { resident: true, subtree: true, children: true }));
        }
        else if (relationship === ">=") {
            iterables.push(this.doYield(bid, depth, relationship, reverse, { resident: true, subtree: true, children: true }));
        }
        for (let iterable of reverse ? iterables.reverse() : iterables) {
            yield* iterable;
        }
    }
    *onKeyIsBeforeNodeKey(bid, depth, relationship, reverse) {
        if (relationship === ">") {
            yield* this.doYield(bid, depth, relationship, reverse, { resident: true, subtree: true, children: true });
        }
        else if (relationship === ">=") {
            yield* this.doYield(bid, depth, relationship, reverse, { resident: true, subtree: true, children: true });
        }
    }
    *onKeyIsAfterNodeKey(bid, depth, relationship, reverse) {
        if (relationship === "<") {
            yield* this.doYield(bid, depth, relationship, reverse, { resident: true, subtree: true, children: true });
        }
        else if (relationship === "<=") {
            yield* this.doYield(bid, depth, relationship, reverse, { resident: true, subtree: true, children: true });
        }
    }
    *onNodeKeyIsPrefixForKey(bid, depth, relationship, reverse, suffix) {
        let iterables = [];
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
            yield* iterable;
        }
    }
    *visitNode(bid, depth, relationship, reverse, suffix) {
        let head = new NodeHead();
        this.blockManager.readBlock(bid, head.buffer, 0);
        let prefix = head.prefix();
        let commonPrefixLength = computeCommonPrefixLength(prefix, suffix);
        let nextPrefixNibble = prefix[commonPrefixLength];
        let nextSuffixNibble = suffix[commonPrefixLength];
        if (nextSuffixNibble == null) {
            if (nextPrefixNibble == null) {
                yield* this.onKeyIsNodeKey(bid, depth, relationship, reverse);
            }
            else {
                yield* this.onKeyIsPrefixForNodeKey(bid, depth, relationship, reverse);
            }
        }
        else {
            if (nextPrefixNibble == null) {
                yield* this.onNodeKeyIsPrefixForKey(bid, depth, relationship, reverse, suffix.slice(commonPrefixLength));
            }
            else {
                if (nextSuffixNibble < nextPrefixNibble) {
                    yield* this.onKeyIsBeforeNodeKey(bid, depth, relationship, reverse);
                }
                else {
                    yield* this.onKeyIsAfterNodeKey(bid, depth, relationship, reverse);
                }
            }
        }
    }
    *doTraverse(bid, depth) {
        let suffix = this.keys[depth]?.slice() ?? [];
        let direction = this.directions[depth] ?? "increasing";
        let reverse = direction === "decreasing";
        let relationship = this.relationship;
        if (reverse) {
            if (relationship === "<") {
                relationship = ">";
            }
            else if (relationship === "<=") {
                relationship = ">=";
            }
            else if (relationship === ">") {
                relationship = "<";
            }
            else if (relationship === ">=") {
                relationship = "<=";
            }
        }
        yield* this.visitNode(bid, depth, relationship, reverse, suffix);
    }
    constructor(blockManager, relationship, keys, directions) {
        this.blockManager = blockManager;
        this.relationship = relationship;
        this.keys = keys.length > 0 ? keys : [[]];
        this.directions = directions;
    }
    *traverse(bid) {
        yield* this.doTraverse(bid, 0);
    }
}
exports.RadixTreeWalker = RadixTreeWalker;
;
class RadixTreeTraverser {
    blockManager;
    bid;
    *traverseUnconditionally(bid) {
        yield bid;
        if (this.blockManager.getBlockSize(bid) >= NodeHead.LENGTH + NodeBody.LENGTH) {
            let body = new NodeBody();
            this.blockManager.readBlock(bid, body.buffer, NodeBody.OFFSET);
            for (let i = 0; i < 16; i++) {
                let child = body.child(i);
                if (child !== 0) {
                    yield* this.traverseUnconditionally(child);
                }
            }
        }
    }
    constructor(blockManager, bid) {
        this.blockManager = blockManager;
        this.bid = bid;
    }
    traverse(keys) {
        return this.doTraverse(this.bid, keys.slice(1), keys[0] ?? []);
    }
}
exports.RadixTreeTraverser = RadixTreeTraverser;
;
class RadixTreeTraverserAt extends RadixTreeTraverser {
    *doTraverse(bid, keys, keyNibbles) {
        let head = new NodeHead();
        this.blockManager.readBlock(bid, head.buffer, 0);
        let nodeNibbles = head.prefix();
        let commonPrefixLength = computeCommonPrefixLength(nodeNibbles, keyNibbles);
        let nextNodeNibble = nodeNibbles[commonPrefixLength];
        let nextKeyNibble = keyNibbles[commonPrefixLength];
        if (nextKeyNibble == null) {
            if (nextNodeNibble == null) {
                // Key ("ab") is identical to node ("ab").
                if (keys.length === 0) {
                    yield bid;
                }
                else {
                    let subtree = head.subtree();
                    if (subtree !== 0) {
                        yield* this.doTraverse(subtree, keys.slice(1), keys[0]);
                    }
                }
            }
            else {
                // Key ("a") is prefix to node ("ab").
                return;
            }
        }
        else {
            if (nextNodeNibble == null) {
                // Node ("a") is prefix to key ("ab").
                if (this.blockManager.getBlockSize(bid) < NodeHead.LENGTH + NodeBody.LENGTH) {
                    return;
                }
                let body = new NodeBody();
                this.blockManager.readBlock(bid, body.buffer, NodeBody.OFFSET);
                let child = body.child(nextKeyNibble);
                if (child !== 0) {
                    yield* this.doTraverse(child, keys, keyNibbles.slice(commonPrefixLength + 1));
                }
            }
            else {
                if (nextKeyNibble < nextNodeNibble) {
                    // Key ("aa") is sibling before node ("ab").
                    return;
                }
                else {
                    // Key ("ac") is sibling after node ("ab").
                    return;
                }
            }
        }
    }
    constructor(blockManager, bid) {
        super(blockManager, bid);
    }
}
exports.RadixTreeTraverserAt = RadixTreeTraverserAt;
;
class RadixTreeTraverserPrefix extends RadixTreeTraverser {
    *doTraverse(bid, keys, keyNibbles) {
        let head = new NodeHead();
        this.blockManager.readBlock(bid, head.buffer, 0);
        let nodeNibbles = head.prefix();
        let commonPrefixLength = computeCommonPrefixLength(nodeNibbles, keyNibbles);
        let nextNodeNibble = nodeNibbles[commonPrefixLength];
        let nextKeyNibble = keyNibbles[commonPrefixLength];
        if (nextKeyNibble == null) {
            if (nextNodeNibble == null) {
                // Key ("ab") is identical to node ("ab").
                if (keys.length === 0) {
                    yield* this.traverseUnconditionally(bid);
                }
                else {
                    let subtree = head.subtree();
                    if (subtree !== 0) {
                        yield* this.doTraverse(subtree, keys.slice(1), keys[0]);
                    }
                }
            }
            else {
                // Key ("a") is prefix to node ("ab").
                if (keys.length === 0) {
                    yield* this.traverseUnconditionally(bid);
                }
                else {
                    return;
                }
            }
        }
        else {
            if (nextNodeNibble == null) {
                // Node ("a") is prefix to key ("ab").
                if (this.blockManager.getBlockSize(bid) < NodeHead.LENGTH + NodeBody.LENGTH) {
                    return;
                }
                let body = new NodeBody();
                this.blockManager.readBlock(bid, body.buffer, NodeBody.OFFSET);
                let child = body.child(nextKeyNibble);
                if (child !== 0) {
                    yield* this.doTraverse(child, keys, keyNibbles.slice(commonPrefixLength + 1));
                }
            }
            else {
                if (nextKeyNibble < nextNodeNibble) {
                    // Key ("aa") is sibling before node ("ab").
                    return;
                }
                else {
                    // Key ("ac") is sibling after node ("ab").
                    return;
                }
            }
        }
    }
    constructor(blockManager, bid) {
        super(blockManager, bid);
    }
}
exports.RadixTreeTraverserPrefix = RadixTreeTraverserPrefix;
;
class RadixTreeTraverserAtOrAfter extends RadixTreeTraverser {
    *doTraverse(bid, keys, keyNibbles) {
        let head = new NodeHead();
        this.blockManager.readBlock(bid, head.buffer, 0);
        let nodeNibbles = head.prefix();
        let commonPrefixLength = computeCommonPrefixLength(nodeNibbles, keyNibbles);
        let nextNodeNibble = nodeNibbles[commonPrefixLength];
        let nextKeyNibble = keyNibbles[commonPrefixLength];
        if (nextKeyNibble == null) {
            if (nextNodeNibble == null) {
                // Key ("ab") is identical to node ("ab").
                if (keys.length === 0) {
                    yield* this.traverseUnconditionally(bid);
                }
                else {
                    let subtree = head.subtree();
                    if (subtree !== 0) {
                        yield* this.doTraverse(subtree, keys.slice(1), keys[0]);
                    }
                }
            }
            else {
                // Key ("a") is prefix to node ("ab").
                if (keys.length === 0) {
                    yield* this.traverseUnconditionally(bid);
                }
                else {
                    yield* this.traverseUnconditionally(bid);
                }
            }
        }
        else {
            if (nextNodeNibble == null) {
                // Node ("a") is prefix to key ("ab").
                if (this.blockManager.getBlockSize(bid) < NodeHead.LENGTH + NodeBody.LENGTH) {
                    return;
                }
                let body = new NodeBody();
                this.blockManager.readBlock(bid, body.buffer, NodeBody.OFFSET);
                let child = body.child(nextKeyNibble);
                if (child !== 0) {
                    yield* this.doTraverse(child, keys, keyNibbles.slice(commonPrefixLength + 1));
                }
                for (let i = nextKeyNibble + 1; i < 16; i++) {
                    let child = body.child(i);
                    if (child !== 0) {
                        yield* this.traverseUnconditionally(child);
                    }
                }
            }
            else {
                if (nextKeyNibble < nextNodeNibble) {
                    // Key ("aa") is sibling before node ("ab").
                    yield* this.traverseUnconditionally(bid);
                }
                else {
                    // Key ("ac") is sibling after node ("ab").
                    return;
                }
            }
        }
    }
    constructor(blockManager, bid) {
        super(blockManager, bid);
    }
}
exports.RadixTreeTraverserAtOrAfter = RadixTreeTraverserAtOrAfter;
;
class RadixTree {
    blockManager;
    blockIndex;
    doDelete(bid) {
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
    doInsert(keys, value, bid, suffix) {
        let head = new NodeHead();
        this.blockManager.readBlock(bid, head.buffer, 0);
        let prefix = head.prefix();
        let total = head.total();
        let commonPrefixLength = computeCommonPrefixLength(prefix, suffix);
        let nextPrefixNibble = prefix[commonPrefixLength];
        let nextSuffixNibble = suffix[commonPrefixLength];
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
                }
                else {
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
            }
            else {
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
        }
        else {
            if (nextPrefixNibble == null) {
                // Node is prefix to key.
                if (commonPrefixLength === 0 && total === 0) {
                    head.prefix(suffix.slice(0, NodeHead.MAX_PREFIX_NIBBLES));
                    this.blockManager.writeBlock(bid, head.buffer, 0);
                    return this.doInsert(keys, value, bid, suffix);
                }
                else {
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
            }
            else {
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
    doLocate(keys, bid, suffix) {
        let head = new NodeHead();
        this.blockManager.readBlock(bid, head.buffer, 0);
        let prefix = head.prefix();
        let total = head.total();
        let commonPrefixLength = computeCommonPrefixLength(prefix, suffix);
        let nextPrefixNibble = prefix[commonPrefixLength];
        let nextSuffixNibble = suffix[commonPrefixLength];
        if (nextSuffixNibble == null) {
            if (nextPrefixNibble == null) {
                // Key is identical to node.
                if (keys.length === 0) {
                    return bid;
                }
                else {
                    let subtree = head.subtree();
                    if (subtree === 0) {
                        return;
                    }
                    return this.doLocate(keys.slice(1), subtree, keys[0]);
                }
            }
            else {
                // Key is prefix to node.
                return;
            }
        }
        else {
            if (nextPrefixNibble == null) {
                // Node is prefix to key.
                if (commonPrefixLength === 0 && total === 0) {
                    return;
                }
                else {
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
            }
            else {
                // Key is sibling to node.
                return;
            }
        }
    }
    doRemove(keys, bid, suffix) {
        let head = new NodeHead();
        this.blockManager.readBlock(bid, head.buffer, 0);
        let prefix = head.prefix();
        let total = head.total();
        let commonPrefixLength = computeCommonPrefixLength(prefix, suffix);
        let nextPrefixNibble = prefix[commonPrefixLength];
        let nextSuffixNibble = suffix[commonPrefixLength];
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
                }
                else {
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
            }
            else {
                // Key is prefix to node.
                return;
            }
        }
        else {
            if (nextPrefixNibble == null) {
                // Node is prefix to key.
                if (commonPrefixLength === 0 && total === 0) {
                    return;
                }
                else {
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
            }
            else {
                // Key is sibling to node.
                return;
            }
        }
    }
    doVacate(bid) {
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
        }
        else {
            this.blockManager.deleteBlock(bid);
        }
    }
    traverse(relationship, keys) {
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
        throw "Expected code to be unreachable!";
    }
    constructor(blockManager, blockIndex) {
        this.blockManager = blockManager;
        this.blockIndex = blockIndex ?? blockManager.createBlock(RadixTree.INITIAL_SIZE);
    }
    *[Symbol.iterator]() {
        yield* this.filter("^=", []);
    }
    *branch(relationship, keys) {
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
    delete() {
        this.doDelete(this.blockIndex);
    }
    *filter(relationship, keys, directions) {
        let nibbles = keys.map(getNibblesFromBytes);
        let treeWalker = new RadixTreeWalker(this.blockManager, relationship, nibbles, directions ?? []);
        yield* treeWalker.traverse(this.blockIndex);
    }
    insert(keys, value) {
        if (variables_1.DEBUG)
            asserts_1.IntegerAssert.atLeast(1, value);
        let nibbles = keys.map(getNibblesFromBytes);
        return this.doInsert(nibbles.slice(1), value, this.blockIndex, nibbles[0] ?? []) != null;
    }
    length() {
        let head = new NodeHead();
        this.blockManager.readBlock(this.blockIndex, head.buffer, 0);
        return head.total();
    }
    lookup(keys) {
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
    remove(keys) {
        let nibbles = keys.map(getNibblesFromBytes);
        return this.doRemove(nibbles.slice(1), this.blockIndex, nibbles[0] ?? []) != null;
    }
    vacate() {
        this.doVacate(this.blockIndex);
    }
    static INITIAL_SIZE = NodeHead.LENGTH;
}
exports.RadixTree = RadixTree;
;
