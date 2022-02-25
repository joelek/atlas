"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecordManager = exports.NullableStringField = exports.NullableStringFieldManager = exports.StringField = exports.StringFieldManager = exports.NumberField = exports.NumberFieldManager = exports.IntegerField = exports.IntegerFieldManager = exports.BooleanField = exports.BooleanFieldManager = exports.BinaryField = exports.BinaryFieldManager = exports.BigIntField = exports.BigIntFieldManager = exports.Field = exports.FieldManager = void 0;
const bedrock = require("@joelek/bedrock");
class FieldManager {
    codec;
    defaultValue;
    constructor(codec, defaultValue) {
        this.codec = codec;
        this.defaultValue = defaultValue;
    }
    getCodec() {
        return this.codec;
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
class BigIntFieldManager extends FieldManager {
    constructor(defaultValue) {
        super(bedrock.codecs.BigInt, defaultValue);
    }
}
exports.BigIntFieldManager = BigIntFieldManager;
;
class BigIntField extends Field {
    constructor(defaultValue) {
        super(defaultValue);
    }
    createManager() {
        return new BigIntFieldManager(this.defaultValue);
    }
}
exports.BigIntField = BigIntField;
;
class BinaryFieldManager extends FieldManager {
    constructor(defaultValue) {
        super(bedrock.codecs.Binary, defaultValue);
    }
}
exports.BinaryFieldManager = BinaryFieldManager;
;
class BinaryField extends Field {
    constructor(defaultValue) {
        super(defaultValue);
    }
    createManager() {
        return new BinaryFieldManager(this.defaultValue);
    }
}
exports.BinaryField = BinaryField;
;
class BooleanFieldManager extends FieldManager {
    constructor(defaultValue) {
        super(bedrock.codecs.Boolean, defaultValue);
    }
}
exports.BooleanFieldManager = BooleanFieldManager;
;
class BooleanField extends Field {
    constructor(defaultValue) {
        super(defaultValue);
    }
    createManager() {
        return new BooleanFieldManager(this.defaultValue);
    }
}
exports.BooleanField = BooleanField;
;
class IntegerFieldManager extends FieldManager {
    constructor(defaultValue) {
        super(bedrock.codecs.Number, defaultValue);
    }
}
exports.IntegerFieldManager = IntegerFieldManager;
;
class IntegerField extends Field {
    constructor(defaultValue) {
        super(defaultValue);
    }
    createManager() {
        return new IntegerFieldManager(this.defaultValue);
    }
}
exports.IntegerField = IntegerField;
;
class NumberFieldManager extends FieldManager {
    constructor(defaultValue) {
        super(bedrock.codecs.Number, defaultValue);
    }
}
exports.NumberFieldManager = NumberFieldManager;
;
class NumberField extends Field {
    constructor(defaultValue) {
        super(defaultValue);
    }
    createManager() {
        return new NumberFieldManager(this.defaultValue);
    }
}
exports.NumberField = NumberField;
;
class StringFieldManager extends FieldManager {
    constructor(defaultValue) {
        super(bedrock.codecs.String, defaultValue);
    }
}
exports.StringFieldManager = StringFieldManager;
;
class StringField extends Field {
    constructor(defaultValue) {
        super(defaultValue);
    }
    createManager() {
        return new StringFieldManager(this.defaultValue);
    }
}
exports.StringField = StringField;
;
class NullableStringFieldManager extends FieldManager {
    constructor(defaultValue) {
        super(bedrock.codecs.Union.of(bedrock.codecs.String, bedrock.codecs.Null), defaultValue);
    }
}
exports.NullableStringFieldManager = NullableStringFieldManager;
;
class NullableStringField extends Field {
    constructor(defaultValue) {
        super(defaultValue);
    }
    createManager() {
        return new NullableStringFieldManager(this.defaultValue);
    }
}
exports.NullableStringField = NullableStringField;
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
