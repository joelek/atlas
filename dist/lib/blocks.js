"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockManager = exports.BinHeader = exports.BlockReference = exports.BlockHeader = exports.BlockFlags = void 0;
const asserts = require("../mod/asserts");
const chunks_1 = require("./chunks");
const variables_1 = require("./variables");
const utils = require("./utils");
var BlockFlags;
(function (BlockFlags) {
    BlockFlags[BlockFlags["APPLICATION_0"] = 0] = "APPLICATION_0";
    BlockFlags[BlockFlags["APPLICATION_1"] = 1] = "APPLICATION_1";
    BlockFlags[BlockFlags["APPLICATION_2"] = 2] = "APPLICATION_2";
    BlockFlags[BlockFlags["APPLICATION_3"] = 3] = "APPLICATION_3";
    BlockFlags[BlockFlags["RESERVED_4"] = 4] = "RESERVED_4";
    BlockFlags[BlockFlags["RESERVED_5"] = 5] = "RESERVED_5";
    BlockFlags[BlockFlags["RESERVED_6"] = 6] = "RESERVED_6";
    BlockFlags[BlockFlags["DELETED"] = 7] = "DELETED";
})(BlockFlags = exports.BlockFlags || (exports.BlockFlags = {}));
;
class BlockHeader extends chunks_1.Chunk {
    constructor(buffer) {
        super(buffer ?? new Uint8Array(BlockHeader.LENGTH));
        if (variables_1.DEBUG)
            asserts.IntegerAssert.exactly(this.buffer.length, BlockHeader.LENGTH);
    }
    flag(bit, value) {
        return utils.Binary.boolean(this.buffer, 0, bit, value);
    }
    flags(value) {
        return utils.Binary.unsigned(this.buffer, 0, 1, value);
    }
    category(value) {
        return utils.Binary.unsigned(this.buffer, 1, 1, value);
    }
    offset(value) {
        return utils.Binary.unsigned(this.buffer, 2, 6, value);
    }
    length(value) {
        let category = this.category(value != null ? BlockHeader.getCategory(value) : undefined);
        return BlockHeader.getLength(category);
    }
    static getCategory(minLength) {
        if (variables_1.DEBUG)
            asserts.IntegerAssert.atLeast(1, minLength);
        let category = Math.ceil(Math.log2(minLength));
        return category;
    }
    static getLength(cateogry) {
        if (variables_1.DEBUG)
            asserts.IntegerAssert.atLeast(0, cateogry);
        let length = Math.pow(2, cateogry);
        return length;
    }
    static LENGTH = 8;
}
exports.BlockHeader = BlockHeader;
;
class BlockReference extends chunks_1.Chunk {
    constructor(buffer) {
        super(buffer ?? new Uint8Array(BlockReference.LENGTH));
        if (variables_1.DEBUG)
            asserts.IntegerAssert.exactly(this.buffer.length, BlockReference.LENGTH);
    }
    metadata(value) {
        return utils.Binary.unsigned(this.buffer, 0, 2, value);
    }
    value(value) {
        return utils.Binary.unsigned(this.buffer, 2, 6, value);
    }
    static LENGTH = 8;
}
exports.BlockReference = BlockReference;
;
class BinHeader extends chunks_1.Chunk {
    table;
    count;
    pools;
    constructor(buffer) {
        super(buffer ?? new Uint8Array(BinHeader.LENGTH));
        if (variables_1.DEBUG)
            asserts.IntegerAssert.exactly(this.buffer.length, BinHeader.LENGTH);
        this.identifier(BinHeader.IDENTIFIER);
        this.table = new BlockHeader(this.buffer.subarray(16, 16 + BlockHeader.LENGTH));
        this.count = new BlockReference(this.buffer.subarray(24, 24 + BlockReference.LENGTH));
        this.pools = new Array();
        let offset = 32;
        for (let i = 0; i < 64; i++) {
            let pool = new BlockHeader(this.buffer.subarray(offset, offset + BlockHeader.LENGTH));
            this.pools.push(pool);
            offset += BlockHeader.LENGTH;
        }
    }
    identifier(value) {
        return utils.Binary.string(this.buffer, 0, 8, "binary", value);
    }
    read(readable, offset) {
        super.read(readable, offset);
        if (this.identifier() !== BinHeader.IDENTIFIER) {
            throw `Expected identifier to be ${BinHeader.IDENTIFIER}!`;
        }
    }
    static IDENTIFIER = "atlasbin";
    static LENGTH = 32 + 64 * BlockHeader.LENGTH;
}
exports.BinHeader = BinHeader;
;
class BlockManager {
    file;
    header;
    constructor(file, options) {
        this.file = file;
        this.header = new BinHeader();
        if (this.file.size() === 0) {
            this.header.write(this.file, 0);
        }
        else {
            this.header.read(this.file, 0);
        }
        let initialTableCapacity = options?.initialTableCapacity ?? 256;
        let initialPoolCapacity = options?.initialPoolCapacity ?? 16;
        if (variables_1.DEBUG)
            asserts.IntegerAssert.atLeast(1, initialTableCapacity);
        if (variables_1.DEBUG)
            asserts.IntegerAssert.atLeast(1, initialPoolCapacity);
        if (this.header.table.offset() === 0) {
            this.allocateBlock(this.header.table, initialTableCapacity * BlockHeader.LENGTH);
        }
        for (let pool of this.header.pools) {
            if (pool.offset() === 0) {
                this.allocateBlock(pool, initialPoolCapacity * BlockReference.LENGTH);
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
        if (BlockHeader.getCategory(minLength) <= header.category()) {
            return;
        }
        let offset = header.offset();
        let length = header.length();
        let oldHeader = new BlockHeader();
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
        let capactity = Math.floor(length / BlockHeader.LENGTH);
        if (count === capactity) {
            this.resizeSystemBlock(this.header.table, length + length);
        }
        this.header.count.value(count + 1);
        this.header.write(this.file, 0);
        let id = count;
        let header = new BlockHeader();
        this.allocateBlock(header, minLength);
        this.writeBlockHeader(id, header);
        return id;
    }
    createOldBlock(minLength) {
        let category = BlockHeader.getCategory(minLength);
        let pool = this.header.pools[category];
        let offset = pool.offset();
        let counter = new BlockReference();
        counter.read(this.file, offset);
        let count = counter.value();
        if (count === 0) {
            throw `Expected pool to contain at least one free block!`;
        }
        let pointer = new BlockReference();
        pointer.read(this.file, offset + BlockReference.LENGTH + (count - 1) * BlockReference.LENGTH);
        let id = pointer.value();
        pointer.value(0);
        pointer.write(this.file, offset + BlockReference.LENGTH + (count - 1) * BlockReference.LENGTH);
        counter.value(count - 1);
        counter.write(this.file, offset);
        let header = new BlockHeader();
        this.readBlockHeader(id, header, true);
        header.flag(BlockFlags.DELETED, false);
        this.writeBlockHeader(id, header);
        return id;
    }
    readBlockHeader(id, header, deleted) {
        let count = this.getBlockCount();
        if (variables_1.DEBUG)
            asserts.IntegerAssert.between(0, id, count - 1);
        let offset = this.header.table.offset();
        header.read(this.file, offset + id * BlockHeader.LENGTH);
        if (deleted != null) {
            if (deleted) {
                if (!header.flag(BlockFlags.DELETED)) {
                    throw `Expected block to be deleted!`;
                }
            }
            else {
                if (header.flag(BlockFlags.DELETED)) {
                    throw `Expected block to not be deleted!`;
                }
            }
        }
    }
    writeBlockHeader(id, header) {
        let count = this.getBlockCount();
        if (variables_1.DEBUG)
            asserts.IntegerAssert.between(0, id, count - 1);
        let offset = this.header.table.offset();
        header.write(this.file, offset + id * BlockHeader.LENGTH);
    }
    *[Symbol.iterator]() {
        for (let bid = 0; bid < this.getBlockCount(); bid++) {
            let header = new BlockHeader();
            this.readBlockHeader(bid, header);
            if (!header.flag(BlockFlags.DELETED)) {
                let buffer = this.readBlock(bid);
                yield {
                    bid,
                    buffer
                };
            }
        }
    }
    clearBlock(id) {
        let header = new BlockHeader();
        this.readBlockHeader(id, header, false);
        let buffer = new Uint8Array(header.length());
        this.writeBlock(id, buffer, 0);
    }
    cloneBlock(idOne) {
        let headerOne = new BlockHeader();
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
        let header = new BlockHeader();
        this.readBlockHeader(id, header, false);
        let category = header.category();
        let pool = this.header.pools[category];
        let offset = pool.offset();
        let counter = new BlockReference();
        counter.read(this.file, offset);
        let count = counter.value();
        let minLength = BlockReference.LENGTH + (count + 1) * BlockReference.LENGTH;
        if (minLength > pool.length()) {
            this.resizeSystemBlock(pool, minLength);
            offset = pool.offset();
            // The pool block may in theory be deleted and placed in itself.
            counter.read(this.file, offset);
            count = counter.value();
        }
        let pointer = new BlockReference();
        pointer.value(id);
        pointer.write(this.file, offset + BlockReference.LENGTH + count * BlockReference.LENGTH);
        counter.value(count + 1);
        counter.write(this.file, offset);
        this.clearBlock(id);
        header.flags(0);
        header.flag(BlockFlags.DELETED, true);
        this.writeBlockHeader(id, header);
    }
    getBlockCount() {
        return this.header.count.value();
    }
    getBlockFlag(id, bit) {
        let header = new BlockHeader();
        this.readBlockHeader(id, header, false);
        if (variables_1.DEBUG)
            asserts.IntegerAssert.between(BlockFlags.APPLICATION_0, bit, BlockFlags.APPLICATION_3);
        return header.flag(bit);
    }
    getBlockSize(id) {
        let header = new BlockHeader();
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
        let header = new BlockHeader();
        this.readBlockHeader(id, header, false);
        let offset = header.offset();
        let length = header.length();
        data = data ?? new Uint8Array(length);
        let activeBlockOffset = blockOffset ?? 0;
        if (variables_1.DEBUG)
            asserts.IntegerAssert.between(0, activeBlockOffset, length);
        if (variables_1.DEBUG)
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
        let headerOne = new BlockHeader();
        this.readBlockHeader(idOne, headerOne, false);
        if (BlockHeader.getCategory(minLength) === headerOne.category()) {
            return;
        }
        let idTwo = this.createBlock(minLength);
        let headerTwo = new BlockHeader();
        this.readBlockHeader(idTwo, headerTwo, false);
        let length = Math.min(headerOne.length(), headerTwo.length());
        let buffer = new Uint8Array(length);
        this.readBlock(idOne, buffer, 0);
        this.writeBlock(idTwo, buffer, 0);
        this.swapBlocks(idOne, idTwo);
        this.deleteBlock(idTwo);
    }
    setBlockFlag(id, bit, value) {
        let header = new BlockHeader();
        this.readBlockHeader(id, header, false);
        if (variables_1.DEBUG)
            asserts.IntegerAssert.between(BlockFlags.APPLICATION_0, bit, BlockFlags.APPLICATION_3);
        header.flag(bit, value);
        this.writeBlockHeader(id, header);
    }
    swapBlocks(idOne, idTwo) {
        let headerOne = new BlockHeader();
        this.readBlockHeader(idOne, headerOne, false);
        let headerTwo = new BlockHeader();
        this.readBlockHeader(idTwo, headerTwo, false);
        this.writeBlockHeader(idOne, headerTwo);
        this.writeBlockHeader(idTwo, headerOne);
    }
    writeBlock(id, data, blockOffset) {
        let header = new BlockHeader();
        this.readBlockHeader(id, header, false);
        let offset = header.offset();
        let length = header.length();
        let activeBlockOffset = blockOffset ?? 0;
        if (variables_1.DEBUG)
            asserts.IntegerAssert.between(0, activeBlockOffset, length);
        if (variables_1.DEBUG)
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
