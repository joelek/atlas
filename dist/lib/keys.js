"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareChunks = exports.compareChunk = void 0;
const bedrock = require("@joelek/bedrock");
function compareChunk(one, two) {
    return bedrock.utils.Chunk.comparePrefixes(one, two);
}
exports.compareChunk = compareChunk;
;
function compareChunks(one, two) {
    if (one.length < two.length) {
        return -1;
    }
    if (one.length > two.length) {
        return 1;
    }
    for (let i = 0; i < one.length; i++) {
        let comparison = compareChunk(one[i], two[i]);
        if (comparison !== 0) {
            return comparison;
        }
    }
    return 0;
}
exports.compareChunks = compareChunks;
;
