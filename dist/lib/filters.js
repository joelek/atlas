"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GreaterThanFilter = exports.EqualityFilter = exports.Filter = void 0;
const bedrock = require("@joelek/bedrock");
const trees_1 = require("./trees");
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
    createNodeVisitor(key_nibbles) {
        return new trees_1.NodeVisitorEqual(key_nibbles);
    }
    getValue() {
        return this.value;
    }
    matches(encodedFilterValue, encodedRecordValue) {
        return bedrock.utils.Chunk.comparePrefixes(encodedFilterValue, encodedRecordValue) === 0;
    }
}
exports.EqualityFilter = EqualityFilter;
;
class GreaterThanFilter extends Filter {
    value;
    constructor(value) {
        super();
        this.value = value;
    }
    createNodeVisitor(key_nibbles) {
        return new trees_1.NodeVisitorGreaterThan(key_nibbles);
    }
    getValue() {
        return this.value;
    }
    matches(encodedFilterValue, encodedRecordValue) {
        return bedrock.utils.Chunk.comparePrefixes(encodedFilterValue, encodedRecordValue) < 0;
    }
}
exports.GreaterThanFilter = GreaterThanFilter;
;
