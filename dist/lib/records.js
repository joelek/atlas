"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecordManager = exports.NullableStringField = exports.StringField = exports.NumberField = exports.IntegerField = exports.BooleanField = exports.BinaryField = exports.BigIntField = exports.Field = void 0;
const bedrock = require("@joelek/bedrock");
class Field {
    codec;
    defaultValue;
    constructor(codec, defaultValue) {
        this.codec = codec;
        this.defaultValue = defaultValue;
    }
    getCodec() {
        return this.codec;
    }
    getDefaultValue() {
        return this.defaultValue;
    }
}
exports.Field = Field;
;
class BigIntField extends Field {
    constructor(defaultValue) {
        super(bedrock.codecs.BigInt, defaultValue);
    }
}
exports.BigIntField = BigIntField;
;
class BinaryField extends Field {
    constructor(defaultValue) {
        super(bedrock.codecs.Binary, defaultValue);
    }
}
exports.BinaryField = BinaryField;
;
class BooleanField extends Field {
    constructor(defaultValue) {
        super(bedrock.codecs.Boolean, defaultValue);
    }
}
exports.BooleanField = BooleanField;
;
class IntegerField extends Field {
    constructor(defaultValue) {
        super(bedrock.codecs.Number, defaultValue);
    }
}
exports.IntegerField = IntegerField;
;
class NumberField extends Field {
    constructor(defaultValue) {
        super(bedrock.codecs.Number, defaultValue);
    }
}
exports.NumberField = NumberField;
;
class StringField extends Field {
    constructor(defaultValue) {
        super(bedrock.codecs.String, defaultValue);
    }
}
exports.StringField = StringField;
;
class NullableStringField extends Field {
    constructor(defaultValue) {
        super(bedrock.codecs.Union.of(bedrock.codecs.String, bedrock.codecs.Null), defaultValue);
    }
}
exports.NullableStringField = NullableStringField;
;
class RecordManager {
    fields;
    tupleKeys;
    tupleCodec;
    constructor(fields) {
        this.fields = fields;
        this.tupleKeys = Object.keys(fields).sort();
        this.tupleCodec = bedrock.codecs.Tuple.of(...this.tupleKeys.map((key) => fields[key].getCodec()));
    }
    decode(buffer) {
        let values = this.tupleCodec.decode(buffer, "record");
        let record = {};
        for (let [index, key] of this.tupleKeys.entries()) {
            record[key] = values[index];
        }
        return record;
    }
    encode(record) {
        let values = this.tupleKeys.map((key) => record[key]);
        let buffer = this.tupleCodec.encode(values, "record");
        return buffer;
    }
    decodeKeys(keys, buffers) {
        let record = {};
        for (let [index, key] of keys.entries()) {
            record[key] = this.fields[key].getCodec().decodePayload(buffers[index]);
        }
        return record;
    }
    encodeKeys(keys, record) {
        let buffers = keys.map((key) => this.fields[key].getCodec().encodePayload(record[key]));
        return buffers;
    }
}
exports.RecordManager = RecordManager;
;
