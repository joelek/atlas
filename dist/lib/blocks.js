"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockManager = exports.BinHeader = exports.BlockReference = exports.BlockHeader = exports.BlockFlags2 = exports.BlockFlags1 = void 0;
const asserts = require("../mod/asserts");
const chunks_1 = require("./chunks");
const variables_1 = require("./variables");
const utils = require("./utils");
const compressors_1 = require("./compressors");
var BlockFlags1;
(function (BlockFlags1) {
    BlockFlags1[BlockFlags1["COMPRESSION_REQUESTED"] = 6] = "COMPRESSION_REQUESTED";
    BlockFlags1[BlockFlags1["DELETED"] = 7] = "DELETED";
})(BlockFlags1 = exports.BlockFlags1 || (exports.BlockFlags1 = {}));
;
var BlockFlags2;
(function (BlockFlags2) {
    BlockFlags2[BlockFlags2["RESERVED_6"] = 6] = "RESERVED_6";
    BlockFlags2[BlockFlags2["RESERVED_7"] = 7] = "RESERVED_7";
})(BlockFlags2 = exports.BlockFlags2 || (exports.BlockFlags2 = {}));
;
class BlockHeader extends chunks_1.Chunk {
    constructor(buffer) {
        super(buffer ?? new Uint8Array(BlockHeader.LENGTH));
        if (variables_1.DEBUG)
            asserts.IntegerAssert.exactly(this.buffer.length, BlockHeader.LENGTH);
    }
    flag1(bit, value) {
        if (variables_1.DEBUG)
            asserts.IntegerAssert.between(BlockFlags1.COMPRESSION_REQUESTED, bit, BlockFlags1.DELETED);
        return utils.Binary.boolean(this.buffer, 0, bit, value);
    }
    flags1(value) {
        return utils.Binary.unsigned(this.buffer, 0, 1, value) & BlockHeader.FLAGS_MASK;
    }
    uncompressedCategory(value) {
        if (this.isCompressionRequested()) {
            return utils.Binary.unsigned(this.buffer, 0, 1, value != null ? this.flags1() | (value & BlockHeader.CATEGORY_MASK) : undefined) & BlockHeader.CATEGORY_MASK;
        }
        else {
            return this.allocatedCategory(value);
        }
    }
    flag2(bit, value) {
        if (variables_1.DEBUG)
            asserts.IntegerAssert.between(BlockFlags2.RESERVED_6, bit, BlockFlags2.RESERVED_7);
        return utils.Binary.boolean(this.buffer, 1, bit, value);
    }
    flags2(value) {
        return utils.Binary.unsigned(this.buffer, 1, 1, value) & BlockHeader.FLAGS_MASK;
    }
    allocatedCategory(value) {
        return utils.Binary.unsigned(this.buffer, 1, 1, value != null ? this.flags2() | (value & BlockHeader.CATEGORY_MASK) : undefined) & BlockHeader.CATEGORY_MASK;
    }
    offset(value) {
        return utils.Binary.unsigned(this.buffer, 2, 6, value);
    }
    uncompressedLength(value) {
        let compressedCategory = this.uncompressedCategory(value != null ? BlockHeader.getCategory(value) : undefined);
        return BlockHeader.getLength(compressedCategory);
    }
    allocatedLength(value) {
        let allocatedCategory = this.allocatedCategory(value != null ? BlockHeader.getCategory(value) : undefined);
        return BlockHeader.getLength(allocatedCategory);
    }
    isCompressionRequested() {
        return this.flag1(BlockFlags1.COMPRESSION_REQUESTED);
    }
    isDeleted() {
        return this.flag1(BlockFlags1.DELETED);
    }
    isCompressed() {
        return this.uncompressedCategory() > this.allocatedCategory();
    }
    toJSON() {
        return {
            isDeleted: this.isDeleted(),
            isCompressionRequested: this.isCompressionRequested(),
            isCompressed: this.isCompressed(),
            allocatedCategory: this.allocatedCategory(),
            uncompressedCategory: this.uncompressedCategory(),
            offset: this.offset()
        };
    }
    toString() {
        return JSON.stringify(this.toJSON(), null, "\t");
    }
    static getCategory(minLength) {
        if (variables_1.DEBUG)
            asserts.IntegerAssert.atLeast(1, minLength);
        let category = Math.ceil(Math.log2(minLength));
        return category;
    }
    static getLength(category) {
        if (variables_1.DEBUG)
            asserts.IntegerAssert.atLeast(0, category);
        if (category <= 31) {
            return (1 << category) >>> 0;
        }
        else {
            return Math.pow(2, category);
        }
    }
    static LENGTH = 8;
    static CATEGORY_MASK = 0b00111111;
    static FLAGS_MASK = 0b11000000;
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
        let allocatedLength = header.allocatedLength(minLength);
        this.file.resize(offset + allocatedLength);
    }
    resizeSystemBlock(header, minLength) {
        if (BlockHeader.getCategory(minLength) <= header.allocatedCategory()) {
            return;
        }
        let offset = header.offset();
        let allocatedLength = header.allocatedLength();
        let oldHeader = new BlockHeader();
        oldHeader.offset(offset);
        oldHeader.allocatedLength(allocatedLength);
        let buffer = new Uint8Array(allocatedLength);
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
    createNewBlock(minLength, compression) {
        let allocatedLength = this.header.table.allocatedLength();
        let count = this.header.count.value();
        let capactity = Math.floor(allocatedLength / BlockHeader.LENGTH);
        if (count === capactity) {
            this.resizeSystemBlock(this.header.table, allocatedLength + allocatedLength);
            // The old system block becomes an application block which affects the block count.
            count = this.header.count.value();
        }
        this.header.count.value(count + 1);
        this.header.write(this.file, 0);
        let id = count;
        let header = new BlockHeader();
        this.allocateBlock(header, minLength);
        header.flag1(BlockFlags1.COMPRESSION_REQUESTED, compression ?? false);
        header.uncompressedCategory(header.allocatedCategory());
        this.writeBlockHeader(id, header);
        return id;
    }
    createOldBlock(minLength, compression) {
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
        header.flag1(BlockFlags1.COMPRESSION_REQUESTED, compression ?? false);
        header.uncompressedCategory(header.allocatedCategory());
        header.flag1(BlockFlags1.DELETED, false);
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
                if (!header.flag1(BlockFlags1.DELETED)) {
                    throw `Expected block ${id} to be deleted!`;
                }
            }
            else {
                if (header.flag1(BlockFlags1.DELETED)) {
                    throw `Expected block ${id} to not be deleted!`;
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
            if (!header.flag1(BlockFlags1.DELETED)) {
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
        let buffer = new Uint8Array(header.uncompressedLength());
        this.writeBlock(id, buffer, 0);
    }
    cloneBlock(idOne, compression) {
        let headerOne = new BlockHeader();
        this.readBlockHeader(idOne, headerOne, false);
        let buffer = new Uint8Array(headerOne.uncompressedLength());
        this.readBlock(idOne, buffer, 0);
        let idTwo = this.createBlock(buffer.length, compression);
        this.writeBlock(idTwo, buffer, 0);
        return idTwo;
    }
    createBlock(minLength, compression) {
        try {
            return this.createOldBlock(minLength, compression);
        }
        catch (error) { }
        try {
            return this.createNewBlock(minLength, compression);
        }
        catch (error) { }
        throw `Expected block with a length of at least ${minLength} bytes to be created!`;
    }
    deleteBlock(id) {
        let header = new BlockHeader();
        this.readBlockHeader(id, header, false);
        let allocatedCategory = header.allocatedCategory();
        let pool = this.header.pools[allocatedCategory];
        let offset = pool.offset();
        let counter = new BlockReference();
        counter.read(this.file, offset);
        let count = counter.value();
        let minLength = BlockReference.LENGTH + (count + 1) * BlockReference.LENGTH;
        if (minLength > pool.allocatedLength()) {
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
        let buffer = new Uint8Array(header.allocatedLength());
        this.file.write(buffer, header.offset());
        header.uncompressedCategory(allocatedCategory);
        header.flag1(BlockFlags1.COMPRESSION_REQUESTED, false);
        header.flag1(BlockFlags1.DELETED, true);
        this.writeBlockHeader(id, header);
    }
    getBlockCount() {
        return this.header.count.value();
    }
    getBlockSize(id) {
        let header = new BlockHeader();
        this.readBlockHeader(id, header, false);
        return header.uncompressedLength();
    }
    getStatistics() {
        let statistics = {};
        statistics.header = {
            entries: 1,
            bytesPerEntry: BinHeader.LENGTH
        };
        statistics.allocationTable = {
            entries: this.header.table.uncompressedLength() / BlockHeader.LENGTH,
            bytesPerEntry: BlockHeader.LENGTH
        };
        statistics.freeBlockLists = this.header.pools.map((pool) => {
            return {
                entries: pool.uncompressedLength() / BlockReference.LENGTH,
                bytesPerEntry: BlockReference.LENGTH
            };
        });
        // Only include blocks with a size of at most 2^40 (1 TiB) since the number of larger blocks is virtually always zero.
        statistics.freeBlockStorage = this.header.pools.slice(0, 40 + 1).map((pool, category) => {
            let offset = pool.offset();
            let blockReference = new BlockReference();
            blockReference.read(this.file, offset);
            return {
                entries: blockReference.value(),
                bytesPerEntry: BlockHeader.getLength(category)
            };
        });
        return statistics;
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
        let uncompressedLength = header.uncompressedLength();
        data = data ?? new Uint8Array(uncompressedLength);
        let activeBlockOffset = blockOffset ?? 0;
        if (variables_1.DEBUG)
            asserts.IntegerAssert.between(0, activeBlockOffset, uncompressedLength);
        if (variables_1.DEBUG)
            asserts.IntegerAssert.between(0, data.length, uncompressedLength - activeBlockOffset);
        if (blockOffset == null) {
            if (data.length !== uncompressedLength) {
                let blockBuffer = new Uint8Array(uncompressedLength);
                this.readCompleteBlock(header, blockBuffer);
                data.set(blockBuffer.subarray(0, data.length), 0);
            }
            else {
                this.readCompleteBlock(header, data);
            }
        }
        else {
            this.readPartialBlock(header, data, activeBlockOffset);
        }
        return data;
    }
    readCompleteBlock(header, data) {
        let offset = header.offset();
        if (header.isCompressed()) {
            let compressedData = new Uint8Array(header.allocatedLength());
            this.file.read(compressedData, offset);
            compressors_1.RLECompressor.decompress(compressedData, data);
        }
        else {
            this.file.read(data, offset);
        }
    }
    readPartialBlock(header, data, activeBlockOffset) {
        if (header.isCompressed()) {
            let uncompressedLength = header.uncompressedLength();
            if (data.length !== uncompressedLength) {
                let blockBuffer = new Uint8Array(uncompressedLength);
                this.readCompleteBlock(header, blockBuffer);
                data.set(blockBuffer.subarray(activeBlockOffset, activeBlockOffset + data.length), 0);
            }
            else {
                this.readCompleteBlock(header, data);
            }
        }
        else {
            let offset = header.offset();
            this.file.read(data, offset + activeBlockOffset);
        }
    }
    reload() {
        this.header.read(this.file, 0);
    }
    recreateBlock(idOne, minLength) {
        let headerOne = new BlockHeader();
        this.readBlockHeader(idOne, headerOne, false);
        if (BlockHeader.getCategory(minLength) === headerOne.allocatedCategory()) {
            return;
        }
        let idTwo = this.createBlock(minLength, headerOne.isCompressionRequested());
        this.swapBlocks(idOne, idTwo);
        this.deleteBlock(idTwo);
    }
    resizeBlock(idOne, minLength) {
        let headerOne = new BlockHeader();
        this.readBlockHeader(idOne, headerOne, false);
        if (BlockHeader.getCategory(minLength) === headerOne.allocatedCategory()) {
            return;
        }
        let idTwo = this.createBlock(minLength, headerOne.isCompressionRequested());
        let headerTwo = new BlockHeader();
        this.readBlockHeader(idTwo, headerTwo, false);
        let length = Math.min(headerOne.uncompressedLength(), headerTwo.uncompressedLength());
        let buffer = new Uint8Array(length);
        this.readBlock(idOne, buffer, 0);
        this.writeBlock(idTwo, buffer, 0);
        this.swapBlocks(idOne, idTwo);
        this.deleteBlock(idTwo);
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
        let uncompressedLength = header.uncompressedLength();
        let activeBlockOffset = blockOffset ?? 0;
        if (variables_1.DEBUG)
            asserts.IntegerAssert.between(0, activeBlockOffset, uncompressedLength);
        if (variables_1.DEBUG)
            asserts.IntegerAssert.between(0, data.length, uncompressedLength - activeBlockOffset);
        if (blockOffset == null) {
            let blockBuffer = data;
            if (data.length !== uncompressedLength) {
                blockBuffer = new Uint8Array(uncompressedLength);
                blockBuffer.set(data, 0);
            }
            this.writeCompleteBlock(header, id, blockBuffer);
        }
        else {
            this.writePartialBlock(header, id, data, activeBlockOffset);
        }
        return data;
    }
    writeCompleteBlock(header, id, data) {
        if (header.isCompressionRequested()) {
            let compressedData = compressors_1.RLECompressor.compress(data);
            if (compressedData == null || BlockHeader.getCategory(compressedData.length) >= BlockHeader.getCategory(data.length)) {
                compressedData = data;
            }
            this.recreateBlock(id, compressedData.length);
            this.readBlockHeader(id, header, false);
            let blockBuffer = compressedData;
            if (compressedData.length != header.allocatedLength()) {
                blockBuffer = new Uint8Array(header.allocatedLength());
                blockBuffer.set(compressedData, 0);
            }
            this.file.write(blockBuffer, header.offset());
            header.uncompressedLength(data.length);
            this.writeBlockHeader(id, header);
        }
        else {
            this.file.write(data, header.offset());
        }
    }
    writePartialBlock(header, id, data, activeBlockOffset) {
        if (header.isCompressionRequested()) {
            let uncompressedLength = header.uncompressedLength();
            let blockBuffer = data;
            if (data.length !== uncompressedLength) {
                blockBuffer = new Uint8Array(uncompressedLength),
                    this.readCompleteBlock(header, blockBuffer);
                blockBuffer.set(data, activeBlockOffset);
            }
            this.writeCompleteBlock(header, id, blockBuffer);
        }
        else {
            let offset = header.offset();
            this.file.write(data, offset + activeBlockOffset);
        }
    }
    static RESERVED_BLOCK_DATABASE_SCHEMA = 0;
}
exports.BlockManager = BlockManager;
;
