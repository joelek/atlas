"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockManager = void 0;
const asserts = require("../mod/asserts");
const chunks_1 = require("./chunks");
const env_1 = require("./env");
class BlockManager {
    file;
    header;
    constructor(file, options) {
        this.file = file;
        this.header = new chunks_1.BinHeader();
        if (this.file.size() === 0) {
            this.header.write(this.file, 0);
        }
        else {
            this.header.read(this.file, 0);
        }
        let initialTableCapacity = options?.initialTableCapacity ?? 256;
        let initialPoolCapacity = options?.initialPoolCapacity ?? 16;
        if (env_1.DEBUG)
            asserts.IntegerAssert.atLeast(1, initialTableCapacity);
        if (env_1.DEBUG)
            asserts.IntegerAssert.atLeast(1, initialPoolCapacity);
        if (this.header.table.offset() === 0) {
            this.allocateBlock(this.header.table, initialTableCapacity * chunks_1.BlockHeader.LENGTH);
        }
        for (let pool of this.header.pools) {
            if (pool.offset() === 0) {
                this.allocateBlock(pool, initialPoolCapacity * chunks_1.BlockReference.LENGTH);
            }
        }
        this.header.write(this.file, 0);
        this.file.persist();
    }
    allocateBlock(header, minLength) {
        let offset = header.offset(this.file.size());
        let length = header.length(minLength);
        this.file.resize(offset + length);
    }
    resizeSystemBlock(header, minLength) {
        if (chunks_1.BlockHeader.getCategory(minLength) <= header.category()) {
            return;
        }
        let offset = header.offset();
        let length = header.length();
        let oldHeader = new chunks_1.BlockHeader();
        oldHeader.offset(offset);
        oldHeader.length(length);
        let buffer = new Uint8Array(length);
        this.file.read(buffer, offset);
        this.allocateBlock(header, minLength);
        this.file.write(buffer, header.offset());
        let count = this.header.count.value();
        this.header.count.value(count + 1);
        this.header.write(this.file, 0);
        let id = count;
        this.writeBlockHeader(id, oldHeader);
        this.deleteBlock(id);
    }
    createNewBlock(minLength) {
        let length = this.header.table.length();
        let count = this.header.count.value();
        let capactity = Math.floor(length / chunks_1.BlockHeader.LENGTH);
        if (count === capactity) {
            this.resizeSystemBlock(this.header.table, length + length);
        }
        this.header.count.value(count + 1);
        this.header.write(this.file, 0);
        let id = count;
        let header = new chunks_1.BlockHeader();
        this.allocateBlock(header, minLength);
        this.writeBlockHeader(id, header);
        return id;
    }
    createOldBlock(minLength) {
        let category = chunks_1.BlockHeader.getCategory(minLength);
        let pool = this.header.pools[category];
        let offset = pool.offset();
        let counter = new chunks_1.BlockReference();
        counter.read(this.file, offset);
        let count = counter.value();
        if (count === 0) {
            throw `Expected pool to contain at least one free block!`;
        }
        let pointer = new chunks_1.BlockReference();
        pointer.read(this.file, offset + chunks_1.BlockReference.LENGTH + (count - 1) * chunks_1.BlockReference.LENGTH);
        let id = pointer.value();
        pointer.value(0);
        pointer.write(this.file, offset + chunks_1.BlockReference.LENGTH + (count - 1) * chunks_1.BlockReference.LENGTH);
        counter.value(count - 1);
        counter.write(this.file, offset);
        let header = new chunks_1.BlockHeader();
        this.readBlockHeader(id, header, true);
        header.flag(chunks_1.BlockFlags.DELETED, false);
        this.writeBlockHeader(id, header);
        return id;
    }
    readBlockHeader(id, header, deleted) {
        let count = this.getBlockCount();
        if (env_1.DEBUG)
            asserts.IntegerAssert.between(0, id, count - 1);
        let offset = this.header.table.offset();
        header.read(this.file, offset + id * chunks_1.BlockHeader.LENGTH);
        if (deleted != null) {
            if (deleted) {
                if (!header.flag(chunks_1.BlockFlags.DELETED)) {
                    throw `Expected block to be deleted!`;
                }
            }
            else {
                if (header.flag(chunks_1.BlockFlags.DELETED)) {
                    throw `Expected block to not be deleted!`;
                }
            }
        }
    }
    writeBlockHeader(id, header) {
        let count = this.getBlockCount();
        if (env_1.DEBUG)
            asserts.IntegerAssert.between(0, id, count - 1);
        let offset = this.header.table.offset();
        header.write(this.file, offset + id * chunks_1.BlockHeader.LENGTH);
    }
    *[Symbol.iterator]() {
        for (let bid = 0; bid < this.getBlockCount(); bid++) {
            let header = new chunks_1.BlockHeader();
            this.readBlockHeader(bid, header);
            if (!header.flag(chunks_1.BlockFlags.DELETED)) {
                let buffer = this.readBlock(bid);
                yield {
                    bid,
                    buffer
                };
            }
        }
    }
    clearBlock(id) {
        let header = new chunks_1.BlockHeader();
        this.readBlockHeader(id, header, false);
        let buffer = new Uint8Array(header.length());
        this.writeBlock(id, buffer, 0);
    }
    cloneBlock(idOne) {
        let headerOne = new chunks_1.BlockHeader();
        this.readBlockHeader(idOne, headerOne, false);
        let buffer = new Uint8Array(headerOne.length());
        this.readBlock(idOne, buffer, 0);
        let idTwo = this.createBlock(buffer.length);
        this.writeBlock(idTwo, buffer, 0);
        return idTwo;
    }
    createBlock(minLength) {
        try {
            return this.createOldBlock(minLength);
        }
        catch (error) { }
        try {
            return this.createNewBlock(minLength);
        }
        catch (error) { }
        throw `Expected block with a length of at least ${minLength} bytes to be created!`;
    }
    deleteBlock(id) {
        let header = new chunks_1.BlockHeader();
        this.readBlockHeader(id, header, false);
        let category = header.category();
        let pool = this.header.pools[category];
        let offset = pool.offset();
        let counter = new chunks_1.BlockReference();
        counter.read(this.file, offset);
        let count = counter.value();
        let minLength = chunks_1.BlockReference.LENGTH + (count + 1) * chunks_1.BlockReference.LENGTH;
        if (minLength > pool.length()) {
            this.resizeSystemBlock(pool, minLength);
            offset = pool.offset();
            // The pool block may in theory be deleted and placed in itself.
            counter.read(this.file, offset);
            count = counter.value();
        }
        let pointer = new chunks_1.BlockReference();
        pointer.value(id);
        pointer.write(this.file, offset + chunks_1.BlockReference.LENGTH + count * chunks_1.BlockReference.LENGTH);
        counter.value(count + 1);
        counter.write(this.file, offset);
        this.clearBlock(id);
        header.flags(0);
        header.flag(chunks_1.BlockFlags.DELETED, true);
        this.writeBlockHeader(id, header);
    }
    getBlockCount() {
        return this.header.count.value();
    }
    getBlockFlag(id, bit) {
        let header = new chunks_1.BlockHeader();
        this.readBlockHeader(id, header, false);
        if (env_1.DEBUG)
            asserts.IntegerAssert.between(chunks_1.BlockFlags.APPLICATION_0, bit, chunks_1.BlockFlags.APPLICATION_3);
        return header.flag(bit);
    }
    getBlockSize(id) {
        let header = new chunks_1.BlockHeader();
        this.readBlockHeader(id, header, false);
        return header.length();
    }
    makeReadable(id) {
        return {
            read: (buffer, offset) => this.readBlock(id, buffer, offset)
        };
    }
    makeWritable(id) {
        return {
            write: (buffer, offset) => this.writeBlock(id, buffer, offset)
        };
    }
    readBlock(id, data, blockOffset) {
        let header = new chunks_1.BlockHeader();
        this.readBlockHeader(id, header, false);
        let offset = header.offset();
        let length = header.length();
        data = data ?? new Uint8Array(length);
        let activeBlockOffset = blockOffset ?? 0;
        if (env_1.DEBUG)
            asserts.IntegerAssert.between(0, activeBlockOffset, length);
        if (env_1.DEBUG)
            asserts.IntegerAssert.between(0, data.length, length - activeBlockOffset);
        if (blockOffset == null) {
            let buffer = new Uint8Array(length);
            this.file.read(buffer, offset + activeBlockOffset);
            data.set(buffer.subarray(0, data.length), 0);
        }
        else {
            this.file.read(data, offset + activeBlockOffset);
        }
        return data;
    }
    resizeBlock(idOne, minLength) {
        let headerOne = new chunks_1.BlockHeader();
        this.readBlockHeader(idOne, headerOne, false);
        if (chunks_1.BlockHeader.getCategory(minLength) === headerOne.category()) {
            return;
        }
        let idTwo = this.createBlock(minLength);
        let headerTwo = new chunks_1.BlockHeader();
        this.readBlockHeader(idTwo, headerTwo, false);
        let length = Math.min(headerOne.length(), headerTwo.length());
        let buffer = new Uint8Array(length);
        this.readBlock(idOne, buffer, 0);
        this.writeBlock(idTwo, buffer, 0);
        this.swapBlocks(idOne, idTwo);
        this.deleteBlock(idTwo);
    }
    setBlockFlag(id, bit, value) {
        let header = new chunks_1.BlockHeader();
        this.readBlockHeader(id, header, false);
        if (env_1.DEBUG)
            asserts.IntegerAssert.between(chunks_1.BlockFlags.APPLICATION_0, bit, chunks_1.BlockFlags.APPLICATION_3);
        header.flag(bit, value);
        this.writeBlockHeader(id, header);
    }
    swapBlocks(idOne, idTwo) {
        let headerOne = new chunks_1.BlockHeader();
        this.readBlockHeader(idOne, headerOne, false);
        let headerTwo = new chunks_1.BlockHeader();
        this.readBlockHeader(idTwo, headerTwo, false);
        this.writeBlockHeader(idOne, headerTwo);
        this.writeBlockHeader(idTwo, headerOne);
    }
    writeBlock(id, data, blockOffset) {
        let header = new chunks_1.BlockHeader();
        this.readBlockHeader(id, header, false);
        let offset = header.offset();
        let length = header.length();
        let activeBlockOffset = blockOffset ?? 0;
        if (env_1.DEBUG)
            asserts.IntegerAssert.between(0, activeBlockOffset, length);
        if (env_1.DEBUG)
            asserts.IntegerAssert.between(0, data.length, length - activeBlockOffset);
        if (blockOffset == null) {
            let buffer = new Uint8Array(length);
            buffer.set(data, 0);
            this.file.write(buffer, offset + activeBlockOffset);
        }
        else {
            this.file.write(data, offset + activeBlockOffset);
        }
        return data;
    }
}
exports.BlockManager = BlockManager;
;
