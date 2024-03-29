"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecordManager = exports.NullableStringField = exports.StringField = exports.NullableNumberField = exports.NumberField = exports.NullableIntegerField = exports.IntegerField = exports.NullableBooleanField = exports.BooleanField = exports.NullableBinaryField = exports.BinaryField = exports.NullableBigIntField = exports.BigIntField = exports.Field = void 0;
const bedrock = require("@joelek/bedrock");
class Field {
    codec;
    defaultValue;
    unique;
    searchable;
    constructor(codec, defaultValue, unique, searchable) {
        this.codec = codec;
        this.defaultValue = defaultValue;
        this.unique = unique;
        this.searchable = searchable;
    }
    getCodec() {
        return this.codec;
    }
    getDefaultValue() {
        return this.defaultValue;
    }
    getUnique() {
        return this.unique;
    }
    getSearchable() {
        return this.searchable;
    }
}
exports.Field = Field;
;
class BigIntField extends Field {
    constructor(defaultValue, unique) {
        super(bedrock.codecs.BigInt, defaultValue, unique);
    }
}
exports.BigIntField = BigIntField;
;
class NullableBigIntField extends Field {
    constructor(defaultValue, unique) {
        super(bedrock.codecs.Union.of(bedrock.codecs.BigInt, bedrock.codecs.Null), defaultValue, unique);
    }
}
exports.NullableBigIntField = NullableBigIntField;
;
class BinaryField extends Field {
    constructor(defaultValue, unique) {
        super(bedrock.codecs.Binary, defaultValue, unique);
    }
}
exports.BinaryField = BinaryField;
;
class NullableBinaryField extends Field {
    constructor(defaultValue, unique) {
        super(bedrock.codecs.Union.of(bedrock.codecs.Binary, bedrock.codecs.Null), defaultValue, unique);
    }
}
exports.NullableBinaryField = NullableBinaryField;
;
class BooleanField extends Field {
    constructor(defaultValue, unique) {
        super(bedrock.codecs.Boolean, defaultValue);
    }
}
exports.BooleanField = BooleanField;
;
class NullableBooleanField extends Field {
    constructor(defaultValue, unique) {
        super(bedrock.codecs.Union.of(bedrock.codecs.Boolean, bedrock.codecs.Null), defaultValue, unique);
    }
}
exports.NullableBooleanField = NullableBooleanField;
;
class IntegerField extends Field {
    constructor(defaultValue, unique) {
        super(bedrock.codecs.Integer, defaultValue, unique);
    }
}
exports.IntegerField = IntegerField;
;
class NullableIntegerField extends Field {
    constructor(defaultValue, unique) {
        super(bedrock.codecs.Union.of(bedrock.codecs.Integer, bedrock.codecs.Null), defaultValue, unique);
    }
}
exports.NullableIntegerField = NullableIntegerField;
;
class NumberField extends Field {
    constructor(defaultValue, unique) {
        super(bedrock.codecs.Number, defaultValue, unique);
    }
}
exports.NumberField = NumberField;
;
class NullableNumberField extends Field {
    constructor(defaultValue, unique) {
        super(bedrock.codecs.Union.of(bedrock.codecs.Number, bedrock.codecs.Null), defaultValue, unique);
    }
}
exports.NullableNumberField = NullableNumberField;
;
class StringField extends Field {
    constructor(defaultValue, unique, searchable) {
        super(bedrock.codecs.String, defaultValue, unique, searchable);
    }
}
exports.StringField = StringField;
;
class NullableStringField extends Field {
    constructor(defaultValue, unique, searchable) {
        super(bedrock.codecs.Union.of(bedrock.codecs.String, bedrock.codecs.Null), defaultValue, unique, searchable);
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
