"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BinHeader = exports.BlockReference = exports.BlockHeader = exports.BlockFlags = exports.LogDeltaHeader = exports.LogHeader = exports.Chunk = void 0;
const utils = require("./utils");
const asserts = require("../mod/asserts");
const env_1 = require("./env");
;
;
class Chunk {
    buffer;
    constructor(buffer) {
        this.buffer = buffer;
    }
    read(readable, offset) {
        readable.read(this.buffer, offset);
    }
    write(writable, offset) {
        writable.write(this.buffer, offset);
    }
}
exports.Chunk = Chunk;
;
class LogHeader extends Chunk {
    constructor(buffer) {
        super(buffer ?? new Uint8Array(LogHeader.LENGTH));
        if (env_1.DEBUG)
            asserts.IntegerAssert.exactly(this.buffer.length, LogHeader.LENGTH);
        this.identifier(LogHeader.IDENTIFIER);
    }
    identifier(value) {
        return utils.Binary.string(this.buffer, 0, 8, "binary", value);
    }
    redoSize(value) {
        return utils.Binary.unsigned(this.buffer, 18, 6, value);
    }
    undoSize(value) {
        return utils.Binary.unsigned(this.buffer, 26, 6, value);
    }
    read(readable, offset) {
        super.read(readable, offset);
        if (this.identifier() !== LogHeader.IDENTIFIER) {
            throw `Expected identifier to be ${LogHeader.IDENTIFIER}!`;
        }
    }
    static IDENTIFIER = "atlaslog";
    static LENGTH = 32;
}
exports.LogHeader = LogHeader;
;
class LogDeltaHeader extends Chunk {
    constructor(buffer) {
        super(buffer ?? new Uint8Array(LogDeltaHeader.LENGTH));
        if (env_1.DEBUG)
            asserts.IntegerAssert.exactly(this.buffer.length, LogDeltaHeader.LENGTH);
    }
    offset(value) {
        return utils.Binary.unsigned(this.buffer, 2, 6, value);
    }
    length(value) {
        return utils.Binary.unsigned(this.buffer, 10, 6, value);
    }
    static LENGTH = 16;
}
exports.LogDeltaHeader = LogDeltaHeader;
;
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
class BlockHeader extends Chunk {
    constructor(buffer) {
        super(buffer ?? new Uint8Array(BlockHeader.LENGTH));
        if (env_1.DEBUG)
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
        if (env_1.DEBUG)
            asserts.IntegerAssert.atLeast(1, minLength);
        let category = Math.ceil(Math.log2(minLength));
        return category;
    }
    static getLength(cateogry) {
        if (env_1.DEBUG)
            asserts.IntegerAssert.atLeast(0, cateogry);
        let length = Math.pow(2, cateogry);
        return length;
    }
    static LENGTH = 8;
}
exports.BlockHeader = BlockHeader;
;
class BlockReference extends Chunk {
    constructor(buffer) {
        super(buffer ?? new Uint8Array(BlockReference.LENGTH));
        if (env_1.DEBUG)
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
class BinHeader extends Chunk {
    table;
    count;
    pools;
    constructor(buffer) {
        super(buffer ?? new Uint8Array(BinHeader.LENGTH));
        if (env_1.DEBUG)
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
