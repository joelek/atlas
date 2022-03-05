"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Chunk = void 0;
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
