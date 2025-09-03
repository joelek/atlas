"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RadixTree = exports.RadixTreeTraverserAfter = exports.RadixTreeTraverserAtOrAfter = exports.RadixTreeTraverserPrefix = exports.RadixTreeTraverserAt = exports.RadixTreeTraverser = exports.RadixTreeDecreasingWalker = exports.RadixTreeIncreasingWalker = exports.NodeVisitorIn = exports.NodeVisitorAfter = exports.NodeVisitorBefore = exports.NodeVisitorNot = exports.NodeVisitorAnd = exports.NodeVisitorOr = exports.NodeVisitorLessThanOrEqual = exports.NodeVisitorLessThan = exports.NodeVisitorGreaterThanOrEqual = exports.NodeVisitorGreaterThan = exports.NodeVisitorPrefix = exports.NodeVisitorEqual = exports.RadixTreeWalker = exports.NodeBody = exports.NodeHead = exports.getBytesFromNibbles = exports.getNibblesFromBytes = exports.computeCommonPrefixLength = exports.getKeyPermutations = void 0;
const asserts_1 = require("../mod/asserts");
const chunks_1 = require("./chunks");
const utils_1 = require("./utils");
const variables_1 = require("./variables");
function getKeyPermutations(keys) {
    let permutations = [];
    if (keys.length > 0) {
        let headPermutations = keys[0];
        if (keys.length > 1) {
            let tailPermutations = getKeyPermutations(keys.slice(1));
            for (let headPermutation of headPermutations) {
                for (let tailPermutation of tailPermutations) {
                    permutations.push([headPermutation, ...tailPermutation]);
                }
            }
        }
        else {
            for (let headPermutation of headPermutations) {
                permutations.push([headPermutation]);
            }
        }
    }
    return permutations;
}
exports.getKeyPermutations = getKeyPermutations;
;
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
        let completeBlock = this.blockManager.readBlock(bid);
        if (include.resident || include.subtree) {
            let head = new NodeHead(completeBlock.subarray(0, NodeHead.LENGTH));
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
                let body = new NodeBody(completeBlock.subarray(NodeBody.OFFSET));
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
                let completeBlock = this.blockManager.readBlock(bid);
                let head = new NodeHead(completeBlock.subarray(0, NodeHead.LENGTH));
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
                let completeBlock = this.blockManager.readBlock(bid);
                let head = new NodeHead(completeBlock.subarray(0, NodeHead.LENGTH));
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
                let completeBlock = this.blockManager.readBlock(bid);
                let head = new NodeHead(completeBlock.subarray(0, NodeHead.LENGTH));
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
                let completeBlock = this.blockManager.readBlock(bid);
                let head = new NodeHead(completeBlock.subarray(0, NodeHead.LENGTH));
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
                let completeBlock = this.blockManager.readBlock(bid);
                let head = new NodeHead(completeBlock.subarray(0, NodeHead.LENGTH));
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
                let completeBlock = this.blockManager.readBlock(bid);
                let head = new NodeHead(completeBlock.subarray(0, NodeHead.LENGTH));
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
        let completeBlock = this.blockManager.readBlock(bid);
        let iterables = [];
        if (relationship === "<" || relationship === "<=") {
            let head = new NodeHead(completeBlock.subarray(0, NodeHead.LENGTH));
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
            let body = new NodeBody(completeBlock.subarray(NodeBody.OFFSET));
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
        let completeBlock = this.blockManager.readBlock(bid);
        let head = new NodeHead(completeBlock.subarray(0, NodeHead.LENGTH));
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
var NodeKeyRelationship;
(function (NodeKeyRelationship) {
    NodeKeyRelationship[NodeKeyRelationship["KEY_IS_NODE_KEY"] = 0] = "KEY_IS_NODE_KEY";
    NodeKeyRelationship[NodeKeyRelationship["KEY_IS_PREFIX_TO_NODE_KEY"] = 1] = "KEY_IS_PREFIX_TO_NODE_KEY";
    NodeKeyRelationship[NodeKeyRelationship["KEY_IS_BEFORE_NODE_KEY"] = 2] = "KEY_IS_BEFORE_NODE_KEY";
    NodeKeyRelationship[NodeKeyRelationship["KEY_IS_AFTER_NODE_KEY"] = 3] = "KEY_IS_AFTER_NODE_KEY";
    NodeKeyRelationship[NodeKeyRelationship["NODE_KEY_IS_PREFIX_TO_KEY"] = 4] = "NODE_KEY_IS_PREFIX_TO_KEY";
})(NodeKeyRelationship || (NodeKeyRelationship = {}));
;
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
const YIELD_NOTHING_CHECK_NOTHING = [NOTHING_FLAG, NOTHING_FLAG];
const YIELD_CURRENT_CHECK_NOTHING = [CURRENT_FLAG, NOTHING_FLAG];
const YIELD_CHILDREN_CHECK_NOTHING = [CHILDREN_FLAG, NOTHING_FLAG];
const YIELD_CURRENT_AND_CHILDREN_CHECK_NOTHING = [CURRENT_FLAG | CHILDREN_FLAG, NOTHING_FLAG];
const YIELD_NOTHING_CHECK_CHILD = new Array(16).fill(0).map((value, index) => {
    return [NOTHING_FLAG, CHILD_FLAGS[index]];
});
const YIELD_CHILDREN_AFTER_CHECK_CHILD = new Array(16).fill(0).map((value, index) => {
    return [CHILDREN_AFTER_FLAGS[index], CHILD_FLAGS[index]];
});
const YIELD_CHILDREN_AFTER_INCLUSIVE_CHECK_NOTHING = new Array(16).fill(0).map((value, index) => {
    return [CHILD_FLAGS[index] | CHILDREN_AFTER_FLAGS[index], NOTHING_FLAG];
});
const YIELD_CURRENT_AND_CHILDREN_BEFORE_CHECK_CHILD = new Array(16).fill(0).map((value, index) => {
    return [CURRENT_FLAG | CHILDREN_BEFORE_FLAGS[index], CHILD_FLAGS[index]];
});
;
class NodeVisitorEqual {
    key_nibbles;
    constructor(key_nibbles) {
        this.key_nibbles = key_nibbles;
    }
    visit(node_nibbles) {
        let key_nibbles = this.key_nibbles;
        let common_prefix_length = computeCommonPrefixLength(node_nibbles, key_nibbles);
        let next_node_nibble = node_nibbles[common_prefix_length];
        let next_key_nibble = key_nibbles[common_prefix_length];
        if (next_key_nibble == null) {
            if (next_node_nibble == null) {
                // NodeKeyRelationship.KEY_IS_NODE_KEY
                return YIELD_CURRENT_CHECK_NOTHING;
            }
            else {
                // NodeKeyRelationship.KEY_IS_PREFIX_TO_NODE_KEY
                return YIELD_NOTHING_CHECK_NOTHING;
            }
        }
        else {
            if (next_node_nibble == null) {
                // NodeKeyRelationship.NODE_KEY_IS_PREFIX_TO_KEY
                return YIELD_NOTHING_CHECK_CHILD[next_key_nibble];
            }
            else {
                if (next_key_nibble < next_node_nibble) {
                    // NodeKeyRelationship.KEY_IS_BEFORE_NODE_KEY
                    return YIELD_NOTHING_CHECK_NOTHING;
                }
                else {
                    // NodeKeyRelationship.KEY_IS_AFTER_NODE_KEY
                    return YIELD_NOTHING_CHECK_NOTHING;
                }
            }
        }
    }
}
exports.NodeVisitorEqual = NodeVisitorEqual;
;
class NodeVisitorPrefix {
    key_nibbles;
    constructor(key_nibbles) {
        this.key_nibbles = key_nibbles;
    }
    visit(node_nibbles) {
        let key_nibbles = this.key_nibbles;
        let common_prefix_length = computeCommonPrefixLength(node_nibbles, key_nibbles);
        let next_node_nibble = node_nibbles[common_prefix_length];
        let next_key_nibble = key_nibbles[common_prefix_length];
        if (next_key_nibble == null) {
            if (next_node_nibble == null) {
                // NodeKeyRelationship.KEY_IS_NODE_KEY
                return YIELD_CURRENT_AND_CHILDREN_CHECK_NOTHING;
            }
            else {
                // NodeKeyRelationship.KEY_IS_PREFIX_TO_NODE_KEY
                return YIELD_CURRENT_AND_CHILDREN_CHECK_NOTHING;
            }
        }
        else {
            if (next_node_nibble == null) {
                return YIELD_NOTHING_CHECK_CHILD[next_key_nibble];
            }
            else {
                if (next_key_nibble < next_node_nibble) {
                    // NodeKeyRelationship.KEY_IS_BEFORE_NODE_KEY
                    return YIELD_NOTHING_CHECK_NOTHING;
                }
                else {
                    // NodeKeyRelationship.KEY_IS_AFTER_NODE_KEY
                    return YIELD_NOTHING_CHECK_NOTHING;
                }
            }
        }
    }
}
exports.NodeVisitorPrefix = NodeVisitorPrefix;
;
class NodeVisitorGreaterThan {
    key_nibbles;
    constructor(key_nibbles) {
        this.key_nibbles = key_nibbles;
    }
    visit(node_nibbles) {
        let key_nibbles = this.key_nibbles;
        let common_prefix_length = computeCommonPrefixLength(node_nibbles, key_nibbles);
        let next_node_nibble = node_nibbles[common_prefix_length];
        let next_key_nibble = key_nibbles[common_prefix_length];
        if (next_key_nibble == null) {
            if (next_node_nibble == null) {
                // NodeKeyRelationship.KEY_IS_NODE_KEY
                return YIELD_CHILDREN_CHECK_NOTHING;
            }
            else {
                // NodeKeyRelationship.KEY_IS_PREFIX_TO_NODE_KEY
                return YIELD_CURRENT_AND_CHILDREN_CHECK_NOTHING;
            }
        }
        else {
            if (next_node_nibble == null) {
                // NodeKeyRelationship.NODE_KEY_IS_PREFIX_TO_KEY
                return YIELD_CHILDREN_AFTER_CHECK_CHILD[next_key_nibble];
            }
            else {
                if (next_key_nibble < next_node_nibble) {
                    // NodeKeyRelationship.KEY_IS_BEFORE_NODE_KEY
                    return YIELD_CURRENT_AND_CHILDREN_CHECK_NOTHING;
                }
                else {
                    // NodeKeyRelationship.KEY_IS_AFTER_NODE_KEY
                    return YIELD_NOTHING_CHECK_NOTHING;
                }
            }
        }
    }
}
exports.NodeVisitorGreaterThan = NodeVisitorGreaterThan;
;
class NodeVisitorGreaterThanOrEqual {
    key_nibbles;
    constructor(key_nibbles) {
        this.key_nibbles = key_nibbles;
    }
    visit(node_nibbles) {
        let key_nibbles = this.key_nibbles;
        let common_prefix_length = computeCommonPrefixLength(node_nibbles, key_nibbles);
        let next_node_nibble = node_nibbles[common_prefix_length];
        let next_key_nibble = key_nibbles[common_prefix_length];
        if (next_key_nibble == null) {
            if (next_node_nibble == null) {
                // NodeKeyRelationship.KEY_IS_NODE_KEY
                return YIELD_CURRENT_AND_CHILDREN_CHECK_NOTHING;
            }
            else {
                // NodeKeyRelationship.KEY_IS_PREFIX_TO_NODE_KEY
                return YIELD_CURRENT_AND_CHILDREN_CHECK_NOTHING;
            }
        }
        else {
            if (next_node_nibble == null) {
                // NodeKeyRelationship.NODE_KEY_IS_PREFIX_TO_KEY
                return YIELD_CHILDREN_AFTER_CHECK_CHILD[next_key_nibble];
            }
            else {
                if (next_key_nibble < next_node_nibble) {
                    // NodeKeyRelationship.KEY_IS_BEFORE_NODE_KEY
                    return YIELD_CURRENT_AND_CHILDREN_CHECK_NOTHING;
                }
                else {
                    // NodeKeyRelationship.KEY_IS_AFTER_NODE_KEY
                    return YIELD_NOTHING_CHECK_NOTHING;
                }
            }
        }
    }
}
exports.NodeVisitorGreaterThanOrEqual = NodeVisitorGreaterThanOrEqual;
;
class NodeVisitorLessThan {
    key_nibbles;
    constructor(key_nibbles) {
        this.key_nibbles = key_nibbles;
    }
    visit(node_nibbles) {
        let key_nibbles = this.key_nibbles;
        let common_prefix_length = computeCommonPrefixLength(node_nibbles, key_nibbles);
        let next_node_nibble = node_nibbles[common_prefix_length];
        let next_key_nibble = key_nibbles[common_prefix_length];
        if (next_key_nibble == null) {
            if (next_node_nibble == null) {
                // NodeKeyRelationship.KEY_IS_NODE_KEY
                return YIELD_NOTHING_CHECK_NOTHING;
            }
            else {
                // NodeKeyRelationship.KEY_IS_PREFIX_TO_NODE_KEY
                return YIELD_NOTHING_CHECK_NOTHING;
            }
        }
        else {
            if (next_node_nibble == null) {
                // NodeKeyRelationship.NODE_KEY_IS_PREFIX_TO_KEY
                return YIELD_CURRENT_AND_CHILDREN_BEFORE_CHECK_CHILD[next_key_nibble];
            }
            else {
                if (next_key_nibble < next_node_nibble) {
                    // NodeKeyRelationship.KEY_IS_BEFORE_NODE_KEY
                    return YIELD_NOTHING_CHECK_NOTHING;
                }
                else {
                    // NodeKeyRelationship.KEY_IS_AFTER_NODE_KEY
                    return YIELD_CURRENT_AND_CHILDREN_CHECK_NOTHING;
                }
            }
        }
    }
}
exports.NodeVisitorLessThan = NodeVisitorLessThan;
;
class NodeVisitorLessThanOrEqual {
    key_nibbles;
    constructor(key_nibbles) {
        this.key_nibbles = key_nibbles;
    }
    visit(node_nibbles) {
        let key_nibbles = this.key_nibbles;
        let common_prefix_length = computeCommonPrefixLength(node_nibbles, key_nibbles);
        let next_node_nibble = node_nibbles[common_prefix_length];
        let next_key_nibble = key_nibbles[common_prefix_length];
        if (next_key_nibble == null) {
            if (next_node_nibble == null) {
                // NodeKeyRelationship.KEY_IS_NODE_KEY
                return YIELD_CURRENT_CHECK_NOTHING;
            }
            else {
                // NodeKeyRelationship.KEY_IS_PREFIX_TO_NODE_KEY
                return YIELD_NOTHING_CHECK_NOTHING;
            }
        }
        else {
            if (next_node_nibble == null) {
                // NodeKeyRelationship.NODE_KEY_IS_PREFIX_TO_KEY
                return YIELD_CURRENT_AND_CHILDREN_BEFORE_CHECK_CHILD[next_key_nibble];
            }
            else {
                if (next_key_nibble < next_node_nibble) {
                    // NodeKeyRelationship.KEY_IS_BEFORE_NODE_KEY
                    return YIELD_NOTHING_CHECK_NOTHING;
                }
                else {
                    // NodeKeyRelationship.KEY_IS_AFTER_NODE_KEY
                    return YIELD_CURRENT_AND_CHILDREN_CHECK_NOTHING;
                }
            }
        }
    }
}
exports.NodeVisitorLessThanOrEqual = NodeVisitorLessThanOrEqual;
;
class NodeVisitorOr {
    visitor;
    visitors;
    constructor(visitor, ...vistors) {
        this.visitor = visitor;
        this.visitors = vistors;
    }
    visit(node_nibbles) {
        let [combined_yield_outcome, combined_check_outcome] = this.visitor.visit(node_nibbles);
        for (let visitor of this.visitors) {
            let [yield_outcome, check_outcome] = visitor.visit(node_nibbles);
            combined_yield_outcome = combined_yield_outcome | yield_outcome;
            combined_check_outcome = combined_check_outcome | check_outcome;
        }
        return [combined_yield_outcome, combined_check_outcome];
    }
}
exports.NodeVisitorOr = NodeVisitorOr;
;
class NodeVisitorAnd {
    visitor;
    visitors;
    constructor(visitor, ...vistors) {
        this.visitor = visitor;
        this.visitors = vistors;
    }
    visit(node_nibbles) {
        let [combined_yield_outcome, combined_check_outcome] = this.visitor.visit(node_nibbles);
        for (let visitor of this.visitors) {
            let [yield_outcome, check_outcome] = visitor.visit(node_nibbles);
            combined_check_outcome = (check_outcome & combined_yield_outcome) | (combined_check_outcome & yield_outcome) | (check_outcome & combined_check_outcome);
            combined_yield_outcome = combined_yield_outcome & yield_outcome;
        }
        return [combined_yield_outcome, combined_check_outcome];
    }
}
exports.NodeVisitorAnd = NodeVisitorAnd;
;
class NodeVisitorNot {
    visitor;
    constructor(visitor) {
        this.visitor = visitor;
    }
    visit(node_nibbles) {
        let [yield_outcome, check_outcome] = this.visitor.visit(node_nibbles);
        yield_outcome = (~yield_outcome) >>> 0;
        check_outcome = check_outcome;
        return [yield_outcome, check_outcome];
    }
}
exports.NodeVisitorNot = NodeVisitorNot;
;
class NodeVisitorBefore {
    visitor;
    constructor(key_nibbles, direction) {
        this.visitor = direction === "decreasing" ? new NodeVisitorGreaterThan(key_nibbles) : new NodeVisitorLessThan(key_nibbles);
    }
    visit(node_nibbles) {
        return this.visitor.visit(node_nibbles);
    }
}
exports.NodeVisitorBefore = NodeVisitorBefore;
;
class NodeVisitorAfter {
    visitor;
    constructor(key_nibbles, direction) {
        this.visitor = direction === "decreasing" ? new NodeVisitorLessThan(key_nibbles) : new NodeVisitorGreaterThan(key_nibbles);
    }
    visit(node_nibbles) {
        return this.visitor.visit(node_nibbles);
    }
}
exports.NodeVisitorAfter = NodeVisitorAfter;
;
class NodeVisitorIn {
    visitor;
    constructor(key_nibbles_array) {
        let visitors = key_nibbles_array.map((key_nibbles) => new NodeVisitorEqual(key_nibbles));
        let visitor = visitors.shift();
        if (visitor == null) {
            throw new Error(`Expected a visitor!`);
        }
        this.visitor = new NodeVisitorOr(visitor, ...visitors);
    }
    visit(node_nibbles) {
        return this.visitor.visit(node_nibbles);
    }
}
exports.NodeVisitorIn = NodeVisitorIn;
;
class RadixTreeIncreasingWalker {
    block_manager;
    node_visitor;
    *yieldChild(node_bid) {
        yield node_bid;
        if (this.block_manager.getBlockSize(node_bid) >= NodeHead.LENGTH + NodeBody.LENGTH) {
            let completeBlock = this.block_manager.readBlock(node_bid);
            let body = new NodeBody(completeBlock.subarray(NodeBody.OFFSET));
            for (let i = 0; i < 16; i++) {
                let child_node_bid = body.child(i);
                if (child_node_bid !== 0) {
                    yield* this.yieldChild(child_node_bid);
                }
            }
        }
    }
    *visitNode(node_bid, previous_node_nibbles) {
        let completeBlock = this.block_manager.readBlock(node_bid);
        let head = new NodeHead(completeBlock.subarray(0, NodeHead.LENGTH));
        let node_nibbles = head.prefix();
        let new_node_nibbles = [...previous_node_nibbles, ...node_nibbles];
        let [yield_outcome, check_outcome] = this.node_visitor.visit(new_node_nibbles);
        if (yield_outcome & CURRENT_FLAG) {
            yield node_bid;
        }
        if (this.block_manager.getBlockSize(node_bid) >= NodeHead.LENGTH + NodeBody.LENGTH) {
            let body = new NodeBody(completeBlock.subarray(NodeBody.OFFSET));
            for (let i = 0; i < 16; i++) {
                if (yield_outcome & CHILD_FLAGS[i]) {
                    let child_node_bid = body.child(i);
                    if (child_node_bid !== 0) {
                        yield* this.yieldChild(child_node_bid);
                    }
                    continue;
                }
                if (check_outcome & CHILD_FLAGS[i]) {
                    let child_node_bid = body.child(i);
                    if (child_node_bid !== 0) {
                        yield* this.visitNode(child_node_bid, [...new_node_nibbles, i]);
                    }
                    continue;
                }
            }
        }
    }
    constructor(block_manager, node_visitor) {
        this.block_manager = block_manager;
        this.node_visitor = node_visitor;
    }
    *traverse(node_bid) {
        yield* this.visitNode(node_bid, []);
    }
}
exports.RadixTreeIncreasingWalker = RadixTreeIncreasingWalker;
;
class RadixTreeDecreasingWalker {
    block_manager;
    node_visitor;
    *yieldChild(node_bid) {
        if (this.block_manager.getBlockSize(node_bid) >= NodeHead.LENGTH + NodeBody.LENGTH) {
            let completeBlock = this.block_manager.readBlock(node_bid);
            let body = new NodeBody(completeBlock.subarray(NodeBody.OFFSET));
            for (let i = 16 - 1; i >= 0; i--) {
                let child_node_bid = body.child(i);
                if (child_node_bid !== 0) {
                    yield* this.yieldChild(child_node_bid);
                }
            }
        }
        yield node_bid;
    }
    *visitNode(node_bid, previous_node_nibbles) {
        let completeBlock = this.block_manager.readBlock(node_bid);
        let head = new NodeHead(completeBlock.subarray(0, NodeHead.LENGTH));
        let node_nibbles = head.prefix();
        let new_node_nibbles = [...previous_node_nibbles, ...node_nibbles];
        let [yield_outcome, check_outcome] = this.node_visitor.visit(new_node_nibbles);
        if (this.block_manager.getBlockSize(node_bid) >= NodeHead.LENGTH + NodeBody.LENGTH) {
            let body = new NodeBody(completeBlock.subarray(NodeBody.OFFSET));
            for (let i = 16 - 1; i >= 0; i--) {
                if (yield_outcome & CHILD_FLAGS[i]) {
                    let child_node_bid = body.child(i);
                    if (child_node_bid !== 0) {
                        yield* this.yieldChild(child_node_bid);
                    }
                    continue;
                }
                if (check_outcome & CHILD_FLAGS[i]) {
                    let child_node_bid = body.child(i);
                    if (child_node_bid !== 0) {
                        yield* this.visitNode(child_node_bid, [...new_node_nibbles, i]);
                    }
                    continue;
                }
            }
        }
        if (yield_outcome & CURRENT_FLAG) {
            yield node_bid;
        }
    }
    constructor(block_manager, node_visitor) {
        this.block_manager = block_manager;
        this.node_visitor = node_visitor;
    }
    *traverse(node_bid) {
        yield* this.visitNode(node_bid, []);
    }
}
exports.RadixTreeDecreasingWalker = RadixTreeDecreasingWalker;
;
class RadixTreeTraverser {
    blockManager;
    bid;
    *traverseUnconditionally(bid) {
        yield bid;
        yield* this.traverseChildrenUnconditionally(bid);
    }
    *traverseChildrenUnconditionally(bid) {
        if (this.blockManager.getBlockSize(bid) >= NodeHead.LENGTH + NodeBody.LENGTH) {
            let completeBlock = this.blockManager.readBlock(bid);
            let body = new NodeBody(completeBlock.subarray(NodeBody.OFFSET));
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
        let completeBlock = this.blockManager.readBlock(bid);
        let head = new NodeHead(completeBlock.subarray(0, NodeHead.LENGTH));
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
                let body = new NodeBody(completeBlock.subarray(NodeBody.OFFSET));
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
        let completeBlock = this.blockManager.readBlock(bid);
        let head = new NodeHead(completeBlock.subarray(0, NodeHead.LENGTH));
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
                let body = new NodeBody(completeBlock.subarray(NodeBody.OFFSET));
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
        let completeBlock = this.blockManager.readBlock(bid);
        let head = new NodeHead(completeBlock.subarray(0, NodeHead.LENGTH));
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
                let body = new NodeBody(completeBlock.subarray(NodeBody.OFFSET));
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
class RadixTreeTraverserAfter extends RadixTreeTraverser {
    *doTraverse(bid, keys, keyNibbles) {
        let completeBlock = this.blockManager.readBlock(bid);
        let head = new NodeHead(completeBlock.subarray(0, NodeHead.LENGTH));
        let nodeNibbles = head.prefix();
        let commonPrefixLength = computeCommonPrefixLength(nodeNibbles, keyNibbles);
        let nextNodeNibble = nodeNibbles[commonPrefixLength];
        let nextKeyNibble = keyNibbles[commonPrefixLength];
        if (nextKeyNibble == null) {
            if (nextNodeNibble == null) {
                // Key ("ab") is identical to node ("ab").
                if (keys.length === 0) {
                    yield* this.traverseChildrenUnconditionally(bid);
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
                let body = new NodeBody(completeBlock.subarray(NodeBody.OFFSET));
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
exports.RadixTreeTraverserAfter = RadixTreeTraverserAfter;
;
class RadixTree {
    blockManager;
    blockIndex;
    requestCompression;
    doDelete(bid) {
        let completeBlock = this.blockManager.readBlock(bid);
        let head = new NodeHead(completeBlock.subarray(0, NodeHead.LENGTH));
        if (this.blockManager.getBlockSize(bid) >= NodeHead.LENGTH + NodeBody.LENGTH) {
            let body = new NodeBody(completeBlock.subarray(NodeBody.OFFSET));
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
        let completeBlock = this.blockManager.readBlock(bid);
        let head = new NodeHead(completeBlock.subarray(0, NodeHead.LENGTH));
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
                        this.blockManager.writeBlock(bid, completeBlock);
                        return;
                    }
                    total = head.total(total + 1);
                    resident = head.resident(value);
                    this.blockManager.writeBlock(bid, completeBlock);
                    return total;
                }
                else {
                    let subtree = head.subtree();
                    if (subtree === 0) {
                        subtree = head.subtree(this.blockManager.createBlock(NodeHead.LENGTH));
                        this.blockManager.writeBlock(bid, completeBlock);
                    }
                    let outcome = this.doInsert(keys.slice(1), value, subtree, keys[0]);
                    if (outcome == null) {
                        return;
                    }
                    total = head.total(total + 1);
                    this.blockManager.writeBlock(bid, completeBlock);
                    return total;
                }
            }
            else {
                // Key is prefix to node.
                let index = nextPrefixNibble;
                head.prefix(prefix.slice(commonPrefixLength + 1));
                this.blockManager.writeBlock(bid, completeBlock);
                let bidTwo = this.blockManager.createBlock(NodeHead.LENGTH + NodeBody.LENGTH, this.requestCompression);
                let completeBlockTwo = new Uint8Array(NodeHead.LENGTH + NodeBody.LENGTH);
                let headTwo = new NodeHead(completeBlockTwo.subarray(0, NodeHead.LENGTH));
                let bodyTwo = new NodeBody(completeBlockTwo.subarray(NodeBody.OFFSET));
                headTwo.prefix(prefix.slice(0, commonPrefixLength));
                headTwo.total(total);
                bodyTwo.child(index, bidTwo);
                this.blockManager.writeBlock(bidTwo, completeBlockTwo);
                this.blockManager.swapBlocks(bid, bidTwo);
                return this.doInsert(keys, value, bid, suffix);
            }
        }
        else {
            if (nextPrefixNibble == null) {
                // Node is prefix to key.
                if (commonPrefixLength === 0 && total === 0) {
                    head.prefix(suffix.slice(0, NodeHead.MAX_PREFIX_NIBBLES));
                    this.blockManager.writeBlock(bid, completeBlock);
                    return this.doInsert(keys, value, bid, suffix);
                }
                else {
                    if (this.blockManager.getBlockSize(bid) < NodeHead.LENGTH + NodeBody.LENGTH) {
                        let bidTwo = this.blockManager.createBlock(NodeHead.LENGTH + NodeBody.LENGTH, this.requestCompression);
                        this.blockManager.swapBlocks(bid, bidTwo);
                        this.blockManager.deleteBlock(bidTwo);
                        let completeBlockTwo = new Uint8Array(NodeHead.LENGTH + NodeBody.LENGTH);
                        completeBlockTwo.set(completeBlock, 0);
                        completeBlock = completeBlockTwo;
                        this.blockManager.writeBlock(bid, completeBlock);
                        head = new NodeHead(completeBlock.subarray(0, NodeHead.LENGTH));
                    }
                    let index = nextSuffixNibble;
                    let body = new NodeBody(completeBlock.subarray(NodeBody.OFFSET));
                    let child = body.child(index);
                    if (child === 0) {
                        child = body.child(index, this.blockManager.createBlock(NodeHead.LENGTH));
                        this.blockManager.writeBlock(bid, completeBlock);
                    }
                    let outcome = this.doInsert(keys, value, child, suffix.slice(commonPrefixLength + 1));
                    if (outcome == null) {
                        return;
                    }
                    total = head.total(total + 1);
                    this.blockManager.writeBlock(bid, completeBlock);
                    return total;
                }
            }
            else {
                // Key is sibling to node.
                let index = nextPrefixNibble;
                head.prefix(prefix.slice(commonPrefixLength + 1));
                this.blockManager.writeBlock(bid, completeBlock);
                let bidTwo = this.blockManager.createBlock(NodeHead.LENGTH + NodeBody.LENGTH, this.requestCompression);
                let completeBlockTwo = new Uint8Array(NodeHead.LENGTH + NodeBody.LENGTH);
                let headTwo = new NodeHead(completeBlockTwo.subarray(0, NodeHead.LENGTH));
                let bodyTwo = new NodeBody(completeBlockTwo.subarray(NodeBody.OFFSET));
                headTwo.prefix(prefix.slice(0, commonPrefixLength));
                headTwo.total(total);
                bodyTwo.child(index, bidTwo);
                this.blockManager.writeBlock(bidTwo, completeBlockTwo);
                this.blockManager.swapBlocks(bid, bidTwo);
                return this.doInsert(keys, value, bid, suffix);
            }
        }
    }
    doLocate(keys, bid, suffix) {
        let completeBlock = this.blockManager.readBlock(bid);
        let head = new NodeHead(completeBlock.subarray(0, NodeHead.LENGTH));
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
                    let body = new NodeBody(completeBlock.subarray(NodeBody.OFFSET));
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
        let completeBlock = this.blockManager.readBlock(bid);
        let head = new NodeHead(completeBlock.subarray(0, NodeHead.LENGTH));
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
                    this.blockManager.writeBlock(bid, completeBlock);
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
                    }
                    total = head.total(total - 1);
                    this.blockManager.writeBlock(bid, completeBlock);
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
                    let body = new NodeBody(completeBlock.subarray(NodeBody.OFFSET));
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
                    }
                    total = head.total(total - 1);
                    this.blockManager.writeBlock(bid, completeBlock);
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
        let completeBlock = this.blockManager.readBlock(bid);
        let head = new NodeHead(completeBlock.subarray(0, NodeHead.LENGTH));
        if (this.blockManager.getBlockSize(bid) >= NodeHead.LENGTH + NodeBody.LENGTH) {
            let body = new NodeBody(completeBlock.subarray(NodeBody.OFFSET));
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
        if (relationship === ">") {
            return new RadixTreeTraverserAfter(this.blockManager, this.blockIndex)
                .traverse(nibbles);
        }
        throw new Error("Expected code to be unreachable!");
    }
    constructor(blockManager, blockIndex, requestCompression) {
        this.blockManager = blockManager;
        this.blockIndex = blockIndex ?? blockManager.createBlock(RadixTree.INITIAL_SIZE);
        this.requestCompression = requestCompression ?? false;
    }
    *[Symbol.iterator]() {
        yield* this.filter("^=", []);
    }
    *branch(relationship, keys) {
        let bids = this.traverse(relationship, keys);
        for (let bid of bids) {
            let completeBlock = this.blockManager.readBlock(bid);
            let head = new NodeHead(completeBlock.subarray(0, NodeHead.LENGTH));
            let subtree = head.subtree();
            if (subtree === 0) {
                continue;
            }
            yield new RadixTree(this.blockManager, subtree, this.requestCompression);
        }
    }
    debug(indent = "") {
        let completeBlock = this.blockManager.readBlock(this.blockIndex);
        let head = new NodeHead(completeBlock.subarray(0, NodeHead.LENGTH));
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
            new RadixTree(this.blockManager, subtree, this.requestCompression).debug(indent + "\t");
        }
        console.log(`${indent}total: ${total}`);
        if (this.blockManager.getBlockSize(this.blockIndex) >= NodeHead.LENGTH + NodeBody.LENGTH) {
            let body = new NodeBody(completeBlock.subarray(NodeBody.OFFSET));
            for (let i = 0; i < 16; i++) {
                let child = body.child(i);
                if (child !== 0) {
                    console.log(`${indent}children[${i.toString(16)}]: (${child})`);
                    new RadixTree(this.blockManager, child, this.requestCompression).debug(indent + "\t");
                }
            }
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
    *get_filtered_node_bids(nodeVisitor, direction) {
        nodeVisitor = nodeVisitor ?? new NodeVisitorPrefix([]);
        let treeWalker = direction === "decreasing" ? new RadixTreeDecreasingWalker(this.blockManager, nodeVisitor) : new RadixTreeIncreasingWalker(this.blockManager, nodeVisitor);
        yield* treeWalker.traverse(this.blockIndex);
    }
    get_resident_bid() {
        let completeBlock = this.blockManager.readBlock(this.blockIndex);
        let head = new NodeHead(completeBlock.subarray(0, NodeHead.LENGTH));
        let resident = head.resident();
        if (resident === 0) {
            return;
        }
        return resident;
    }
    get_statistics() {
        let statistics = {};
        let compactNodes = statistics.compactNodes = {
            entries: 0,
            bytesPerEntry: NodeHead.LENGTH
        };
        let fullNodes = statistics.fullNodes = {
            entries: 0,
            bytesPerEntry: NodeHead.LENGTH + NodeBody.LENGTH
        };
        let blockManager = this.blockManager;
        function traverse(node_bid) {
            let completeBlock = blockManager.readBlock(node_bid);
            let head = new NodeHead(completeBlock.subarray(0, NodeHead.LENGTH));
            if (blockManager.getBlockSize(node_bid) >= NodeHead.LENGTH + NodeBody.LENGTH) {
                let body = new NodeBody(completeBlock.subarray(NodeBody.OFFSET));
                fullNodes.entries += 1;
                for (let i = 0; i < 16; i++) {
                    let child = body.child(i);
                    if (child !== 0) {
                        traverse(child);
                    }
                }
            }
            else {
                compactNodes.entries += 1;
            }
            let subtree = head.subtree();
            if (subtree !== 0) {
                traverse(subtree);
            }
        }
        ;
        traverse(this.blockIndex);
        return statistics;
    }
    get_subtree_bid() {
        let completeBlock = this.blockManager.readBlock(this.blockIndex);
        let head = new NodeHead(completeBlock.subarray(0, NodeHead.LENGTH));
        let subtree = head.subtree();
        if (subtree === 0) {
            return;
        }
        return subtree;
    }
    insert(keys, value) {
        if (variables_1.DEBUG)
            asserts_1.IntegerAssert.atLeast(1, value);
        let nibbles = keys.map(getNibblesFromBytes);
        return this.doInsert(nibbles.slice(1), value, this.blockIndex, nibbles[0] ?? []) != null;
    }
    length() {
        let completeBlock = this.blockManager.readBlock(this.blockIndex);
        let head = new NodeHead(completeBlock.subarray(0, NodeHead.LENGTH));
        return head.total();
    }
    lookup(keys) {
        let bids = this.traverse("=", keys);
        for (let bid of bids) {
            let completeBlock = this.blockManager.readBlock(bid);
            let head = new NodeHead(completeBlock.subarray(0, NodeHead.LENGTH));
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
