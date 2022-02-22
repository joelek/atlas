"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecordManager = exports.BooleanField = exports.BooleanFieldManager = exports.BooleanFieldSchema = exports.NullableStringField = exports.NullableStringFieldManager = exports.NullableStringFieldSchema = exports.StringField = exports.StringFieldManager = exports.StringFieldSchema = exports.BinaryField = exports.BinaryFieldManager = exports.BinaryFieldSchema = exports.Field = exports.FieldManager = void 0;
const bedrock = require("@joelek/bedrock");
class FieldManager {
    blockHandler;
    bid;
    codec;
    defaultValue;
    constructor(blockHandler, bid, codec, defaultValue) {
        this.blockHandler = blockHandler;
        this.bid = bid;
        this.codec = codec;
        this.defaultValue = defaultValue;
    }
    delete() {
        this.blockHandler.deleteBlock(this.bid);
    }
    getBid() {
        return this.bid;
    }
    getCodec() {
        return this.codec;
    }
    static construct(blockHandler, bid) {
        try {
            return BinaryFieldManager.construct(blockHandler, bid);
        }
        catch (error) { }
        try {
            return BooleanFieldManager.construct(blockHandler, bid);
        }
        catch (error) { }
        try {
            return StringFieldManager.construct(blockHandler, bid);
        }
        catch (error) { }
        throw `Expected to construct a field manager!`;
    }
}
exports.FieldManager = FieldManager;
;
class Field {
    defaultValue;
    constructor(defaultValue) {
        this.defaultValue = defaultValue;
    }
}
exports.Field = Field;
;
exports.BinaryFieldSchema = bedrock.codecs.Object.of({
    type: bedrock.codecs.StringLiteral.of("binary"),
    defaultValue: bedrock.codecs.Binary
});
class BinaryFieldManager extends FieldManager {
    constructor(blockHandler, bid, defaultValue) {
        super(blockHandler, bid, bedrock.codecs.Binary, defaultValue);
    }
    static construct(blockHandler, bid, schema) {
        if (bid == null) {
            schema = schema ?? {
                type: "binary",
                defaultValue: Uint8Array.of()
            };
            let buffer = exports.BinaryFieldSchema.encode(schema);
            bid = blockHandler.createBlock(buffer.length);
            blockHandler.writeBlock(bid, buffer);
        }
        else {
            if (schema == null) {
                schema = exports.BinaryFieldSchema.decode(blockHandler.readBlock(bid));
            }
            else {
                let buffer = exports.BinaryFieldSchema.encode(schema);
                blockHandler.resizeBlock(bid, buffer.length);
                blockHandler.writeBlock(bid, buffer);
            }
        }
        let defaultValue = schema.defaultValue;
        return new BinaryFieldManager(blockHandler, bid, defaultValue);
    }
}
exports.BinaryFieldManager = BinaryFieldManager;
;
class BinaryField extends Field {
    constructor(defaultValue) {
        super(defaultValue);
    }
    convertValue(value) {
        if (value instanceof Uint8Array) {
            return value;
        }
        return this.defaultValue;
    }
    createManager(blockHandler, bid) {
        return BinaryFieldManager.construct(blockHandler, bid, {
            type: "binary",
            defaultValue: this.defaultValue
        });
    }
    isCompatibleWith(that) {
        if (that instanceof BinaryFieldManager) {
            return true;
        }
        return false;
    }
}
exports.BinaryField = BinaryField;
;
exports.StringFieldSchema = bedrock.codecs.Object.of({
    type: bedrock.codecs.StringLiteral.of("string"),
    defaultValue: bedrock.codecs.String
});
class StringFieldManager extends FieldManager {
    constructor(blockHandler, bid, defaultValue) {
        super(blockHandler, bid, bedrock.codecs.String, defaultValue);
    }
    static construct(blockHandler, bid, schema) {
        if (bid == null) {
            schema = schema ?? {
                type: "string",
                defaultValue: ""
            };
            let buffer = exports.StringFieldSchema.encode(schema);
            bid = blockHandler.createBlock(buffer.length);
            blockHandler.writeBlock(bid, buffer);
        }
        else {
            if (schema == null) {
                schema = exports.StringFieldSchema.decode(blockHandler.readBlock(bid));
            }
            else {
                let buffer = exports.StringFieldSchema.encode(schema);
                blockHandler.resizeBlock(bid, buffer.length);
                blockHandler.writeBlock(bid, buffer);
            }
        }
        let defaultValue = schema.defaultValue;
        return new StringFieldManager(blockHandler, bid, defaultValue);
    }
}
exports.StringFieldManager = StringFieldManager;
;
class StringField extends Field {
    constructor(defaultValue) {
        super(defaultValue);
    }
    convertValue(value) {
        if (typeof value === "string") {
            return value;
        }
        return this.defaultValue;
    }
    createManager(blockHandler, bid) {
        return StringFieldManager.construct(blockHandler, bid, {
            type: "string",
            defaultValue: this.defaultValue
        });
    }
    isCompatibleWith(that) {
        if (that instanceof StringFieldManager) {
            return true;
        }
        return false;
    }
}
exports.StringField = StringField;
;
exports.NullableStringFieldSchema = bedrock.codecs.Object.of({
    type: bedrock.codecs.StringLiteral.of("nullable_string"),
    defaultValue: bedrock.codecs.Union.of(bedrock.codecs.String, bedrock.codecs.Null)
});
class NullableStringFieldManager extends FieldManager {
    constructor(blockHandler, bid, defaultValue) {
        super(blockHandler, bid, bedrock.codecs.Union.of(bedrock.codecs.String, bedrock.codecs.Null), defaultValue);
    }
    static construct(blockHandler, bid, schema) {
        if (bid == null) {
            schema = schema ?? {
                type: "nullable_string",
                defaultValue: null
            };
            let buffer = exports.NullableStringFieldSchema.encode(schema);
            bid = blockHandler.createBlock(buffer.length);
            blockHandler.writeBlock(bid, buffer);
        }
        else {
            if (schema == null) {
                schema = exports.NullableStringFieldSchema.decode(blockHandler.readBlock(bid));
            }
            else {
                let buffer = exports.NullableStringFieldSchema.encode(schema);
                blockHandler.resizeBlock(bid, buffer.length);
                blockHandler.writeBlock(bid, buffer);
            }
        }
        let defaultValue = schema.defaultValue;
        return new NullableStringFieldManager(blockHandler, bid, defaultValue);
    }
}
exports.NullableStringFieldManager = NullableStringFieldManager;
;
class NullableStringField extends Field {
    constructor(defaultValue) {
        super(defaultValue);
    }
    convertValue(value) {
        if (typeof value === "string" || value === null) {
            return value;
        }
        return this.defaultValue;
    }
    createManager(blockHandler, bid) {
        return NullableStringFieldManager.construct(blockHandler, bid, {
            type: "nullable_string",
            defaultValue: this.defaultValue
        });
    }
    isCompatibleWith(that) {
        if (that instanceof StringFieldManager) {
            return true;
        }
        return false;
    }
}
exports.NullableStringField = NullableStringField;
;
exports.BooleanFieldSchema = bedrock.codecs.Object.of({
    type: bedrock.codecs.StringLiteral.of("boolean"),
    defaultValue: bedrock.codecs.Boolean
});
class BooleanFieldManager extends FieldManager {
    constructor(blockHandler, bid, defaultValue) {
        super(blockHandler, bid, bedrock.codecs.Boolean, defaultValue);
    }
    static construct(blockHandler, bid, schema) {
        if (bid == null) {
            schema = schema ?? {
                type: "boolean",
                defaultValue: false
            };
            let buffer = exports.BooleanFieldSchema.encode(schema);
            bid = blockHandler.createBlock(buffer.length);
            blockHandler.writeBlock(bid, buffer);
        }
        else {
            if (schema == null) {
                schema = exports.BooleanFieldSchema.decode(blockHandler.readBlock(bid));
            }
            else {
                let buffer = exports.BooleanFieldSchema.encode(schema);
                blockHandler.resizeBlock(bid, buffer.length);
                blockHandler.writeBlock(bid, buffer);
            }
        }
        let defaultValue = schema.defaultValue;
        return new BooleanFieldManager(blockHandler, bid, defaultValue);
    }
}
exports.BooleanFieldManager = BooleanFieldManager;
;
class BooleanField extends Field {
    constructor(defaultValue) {
        super(defaultValue);
    }
    convertValue(value) {
        if (typeof value === "boolean") {
            return value;
        }
        return this.defaultValue;
    }
    createManager(blockHandler, bid) {
        return BooleanFieldManager.construct(blockHandler, bid, {
            type: "boolean",
            defaultValue: this.defaultValue
        });
    }
    isCompatibleWith(that) {
        if (that instanceof BooleanFieldManager) {
            return true;
        }
        return false;
    }
}
exports.BooleanField = BooleanField;
;
class RecordManager {
    fieldManagers;
    tupleKeys;
    tupleCodec;
    constructor(fieldManagers) {
        this.fieldManagers = fieldManagers;
        this.tupleKeys = Object.keys(fieldManagers).sort();
        this.tupleCodec = bedrock.codecs.Tuple.of(...this.tupleKeys.map((key) => fieldManagers[key].getCodec()));
    }
    decode(buffer) {
        let values = this.tupleCodec.decode(buffer);
        let record = {};
        for (let [index, key] of this.tupleKeys.entries()) {
            record[key] = values[index];
        }
        return record;
    }
    encode(record) {
        let values = this.tupleKeys.map((key) => record[key]);
        let buffer = this.tupleCodec.encode(values);
        return buffer;
    }
    decodeKeys(keys, buffers) {
        let record = {};
        for (let [index, key] of keys.entries()) {
            record[key] = this.fieldManagers[key].getCodec().decodePayload(buffers[index]);
        }
        return record;
    }
    encodeKeys(keys, record) {
        let buffers = keys.map((key) => this.fieldManagers[key].getCodec().encodePayload(record[key]));
        return buffers;
    }
}
exports.RecordManager = RecordManager;
;
