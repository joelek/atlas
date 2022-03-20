"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Table = exports.HashTableSlot = exports.HashTableHeader = exports.compareBuffers = void 0;
const bedrock = require("@joelek/bedrock");
const libcrypto = require("crypto");
const blocks_1 = require("./blocks");
const chunks_1 = require("./chunks");
const variables_1 = require("./variables");
const asserts = require("../mod/asserts");
const asserts_1 = require("../mod/asserts");
function compareBuffers(one, two) {
    if (one.length < two.length) {
        return -1;
    }
    if (one.length > two.length) {
        return 1;
    }
    for (let i = 0; i < one.length; i++) {
        let comparison = bedrock.utils.Chunk.comparePrefixes(one[i], two[i]);
        if (comparison !== 0) {
            return comparison;
        }
    }
    return 0;
}
exports.compareBuffers = compareBuffers;
;
class HashTableHeader extends chunks_1.Chunk {
    count;
    table;
    constructor(buffer) {
        super(buffer ?? new Uint8Array(HashTableHeader.LENGTH));
        if (variables_1.DEBUG)
            asserts.IntegerAssert.exactly(this.buffer.length, HashTableHeader.LENGTH);
        this.count = new blocks_1.BlockReference(this.buffer.subarray(16, 16 + blocks_1.BlockReference.LENGTH));
        this.table = new blocks_1.BlockReference(this.buffer.subarray(24, 24 + blocks_1.BlockReference.LENGTH));
    }
    static LENGTH = 32;
}
exports.HashTableHeader = HashTableHeader;
;
class HashTableSlot extends blocks_1.BlockReference {
    constructor(buffer) {
        super(buffer ?? new Uint8Array(HashTableSlot.LENGTH));
    }
    probeDistance(value) {
        return this.metadata(value);
    }
}
exports.HashTableSlot = HashTableSlot;
;
;
class Table {
    blockManager;
    bid;
    detail;
    header;
    minimumCapacity;
    constructor(blockManager, detail, options) {
        let blockId = options?.bid;
        this.blockManager = blockManager;
        this.bid = blockId ?? blockManager.createBlock(HashTableHeader.LENGTH);
        this.detail = detail;
        this.header = new HashTableHeader();
        this.minimumCapacity = asserts.IntegerAssert.atLeast(1, options?.minimumCapacity ?? 64);
        if (blockId != null) {
            this.header.read(blockManager.makeReadable(blockId), 0);
        }
        if (this.header.table.value() === 0) {
            let table = blockManager.createBlock(this.minimumCapacity * HashTableSlot.LENGTH);
            this.header.table.value(table);
        }
        this.header.write(blockManager.makeWritable(this.bid), 0);
    }
    readSlot(index, slot) {
        slot.read(this.blockManager.makeReadable(this.header.table.value()), index * HashTableSlot.LENGTH);
        return slot;
    }
    writeSlot(index, slot) {
        slot.write(this.blockManager.makeWritable(this.header.table.value()), index * HashTableSlot.LENGTH);
        return slot;
    }
    computeOptimalSlot(key) {
        let slotCount = this.getSlotCount();
        let hash = Buffer.alloc(6);
        for (let keyPart of key) {
            hash = libcrypto.createHash("sha256")
                .update(hash)
                .update(keyPart)
                .digest();
        }
        return hash.readUIntBE(0, 6) % slotCount;
    }
    doInsert(key, value) {
        let optimalSlot = this.computeOptimalSlot(key);
        let slotCount = this.getSlotCount();
        let probeDistance = 0;
        let slotIndex = optimalSlot;
        let slot = new HashTableSlot();
        for (let i = 0; i < slotCount; i++) {
            this.readSlot(slotIndex, slot);
            if (slot.value() === 0) {
                slot.probeDistance(probeDistance);
                slot.value(value);
                this.writeSlot(slotIndex, slot);
                return slotIndex;
            }
            if (compareBuffers(this.detail.getKeyFromValue(slot.value()), key) === 0) {
                return;
            }
            if (probeDistance > slot.probeDistance()) {
                let replacementSlot = new HashTableSlot();
                replacementSlot.probeDistance(probeDistance);
                replacementSlot.value(value);
                this.writeSlot(slotIndex, replacementSlot);
                value = slot.value();
                probeDistance = slot.probeDistance();
            }
            slotIndex = (slotIndex + 1) % slotCount;
            probeDistance += 1;
        }
    }
    doLookup(key) {
        let optimalSlot = this.computeOptimalSlot(key);
        let slotCount = this.getSlotCount();
        let probeDistance = 0;
        let slotIndex = optimalSlot;
        let slot = new HashTableSlot();
        for (let i = 0; i < slotCount; i++) {
            this.readSlot(slotIndex, slot);
            let value = slot.value();
            if (value === 0 || probeDistance > slot.probeDistance()) {
                return;
            }
            if (compareBuffers(this.detail.getKeyFromValue(value), key) === 0) {
                return slotIndex;
            }
            slotIndex = (slotIndex + 1) % slotCount;
            probeDistance += 1;
        }
    }
    doRemove(key) {
        let optimalSlot = this.computeOptimalSlot(key);
        let slotCount = this.getSlotCount();
        let probeDistance = 0;
        let slotIndex = optimalSlot;
        let slot = new HashTableSlot();
        for (let i = 0; i < slotCount; i++) {
            this.readSlot(slotIndex, slot);
            let value = slot.value();
            if (value === 0 || probeDistance > slot.probeDistance()) {
                return;
            }
            if (compareBuffers(this.detail.getKeyFromValue(value), key) === 0) {
                this.writeSlot(slotIndex, new HashTableSlot());
                return slotIndex;
            }
            slotIndex = (slotIndex + 1) % slotCount;
            probeDistance += 1;
        }
    }
    getSlotCount() {
        let blockSize = this.blockManager.getBlockSize(this.header.table.value());
        return Math.floor(blockSize / blocks_1.BlockReference.LENGTH);
    }
    propagateBackwards(slotIndex) {
        let slotCount = this.getSlotCount();
        let slot = new HashTableSlot();
        for (let i = 0; i < slotCount; i++) {
            this.readSlot((slotIndex + 1) % slotCount, slot);
            let probeDistance = slot.probeDistance();
            if (probeDistance === 0) {
                this.writeSlot(slotIndex, new HashTableSlot());
                break;
            }
            slot.probeDistance(probeDistance - 1);
            this.writeSlot(slotIndex, slot);
            slotIndex = (slotIndex + 1) % slotCount;
        }
    }
    resizeIfNecessary() {
        let slotCount = this.getSlotCount();
        let currentLoadFactor = this.header.count.value() / slotCount;
        let desiredSlotCount = slotCount;
        if (currentLoadFactor <= 0.25) {
            desiredSlotCount = Math.max(Math.ceil(slotCount / 2), this.minimumCapacity);
        }
        if (currentLoadFactor >= 0.75) {
            desiredSlotCount = slotCount * 2;
        }
        if (desiredSlotCount === slotCount) {
            return;
        }
        let values = new Array();
        let slot = new HashTableSlot();
        for (let i = 0; i < slotCount; i++) {
            this.readSlot(i, slot);
            let value = slot.value();
            if (value !== 0) {
                values.push(value);
            }
        }
        let minLength = desiredSlotCount * blocks_1.BlockReference.LENGTH;
        this.blockManager.resizeBlock(this.header.table.value(), minLength);
        this.blockManager.clearBlock(this.header.table.value());
        for (let value of values) {
            let key = this.detail.getKeyFromValue(value);
            this.doInsert(key, value);
        }
        this.header.write(this.blockManager.makeWritable(this.bid), 0);
    }
    *[Symbol.iterator]() {
        let slotCount = this.getSlotCount();
        let slot = new HashTableSlot();
        for (let i = 0; i < slotCount; i++) {
            this.readSlot(i, slot);
            let value = slot.value();
            if (value !== 0) {
                yield value;
            }
        }
    }
    clear() {
        this.blockManager.clearBlock(this.header.table.value());
        this.header.count.value(0);
        this.header.write(this.blockManager.makeWritable(this.bid), 0);
    }
    delete() {
        this.blockManager.deleteBlock(this.header.table.value());
        this.blockManager.deleteBlock(this.bid);
        this.header.count.value(0);
    }
    insert(key, value) {
        if (variables_1.DEBUG)
            asserts_1.IntegerAssert.atLeast(1, value);
        let slotIndex = this.doInsert(key, value);
        if (slotIndex == null) {
            return false;
        }
        this.header.count.value(this.header.count.value() + 1);
        this.header.write(this.blockManager.makeWritable(this.bid), 0);
        this.resizeIfNecessary();
        return true;
    }
    length() {
        return this.header.count.value();
    }
    lookup(key) {
        let slotIndex = this.doLookup(key);
        if (slotIndex == null) {
            return;
        }
        let slot = new HashTableSlot();
        this.readSlot(slotIndex, slot);
        return slot.value();
    }
    remove(key) {
        let slotIndex = this.doRemove(key);
        if (slotIndex == null) {
            return false;
        }
        this.header.count.value(this.header.count.value() - 1);
        this.header.write(this.blockManager.makeWritable(this.bid), 0);
        this.propagateBackwards(slotIndex);
        this.resizeIfNecessary();
        return true;
    }
    static LENGTH = HashTableHeader.LENGTH;
}
exports.Table = Table;
;
