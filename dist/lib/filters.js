"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EqualityFilter = exports.Filter = void 0;
const bedrock = require("@joelek/bedrock");
class Filter {
    constructor() { }
}
exports.Filter = Filter;
;
class EqualityFilter extends Filter {
    value;
    constructor(value) {
        super();
        this.value = value;
    }
    getValue() {
        return this.value;
    }
    matches(value) {
        let one = bedrock.codecs.Any.encodePayload(this.value);
        let two = bedrock.codecs.Any.encodePayload(value);
        return bedrock.utils.Chunk.comparePrefixes(one, two) === 0;
    }
}
exports.EqualityFilter = EqualityFilter;
;
