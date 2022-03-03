"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VirtualFile = exports.PhysicalFile = exports.DurableFile = exports.CachedFile = exports.File = void 0;
const stdlib = require("@joelek/ts-stdlib");
const libfs = require("fs");
const libpath = require("path");
const asserts = require("../mod/asserts");
const cache_1 = require("./cache");
const env_1 = require("./env");
const chunks_1 = require("./chunks");
class File {
    constructor() { }
}
exports.File = File;
;
class CachedFile extends File {
    file;
    tree;
    cache;
    constructor(file, maxWeight) {
        super();
        this.file = file;
        this.tree = new stdlib.collections.avl.Tree();
        this.cache = new cache_1.Cache({
            getWeightForValue: (value) => 64 + value.length,
            onInsert: (key, value) => this.tree.insert(key, value),
            onRemove: (key) => this.tree.remove(key)
        }, maxWeight);
    }
    discard() {
        this.file.discard();
        this.tree.clear();
        this.cache.clear();
    }
    persist() {
        this.file.persist();
    }
    read(buffer, offset) {
        if (env_1.DEBUG)
            asserts.IntegerAssert.atLeast(0, offset);
        let current = offset;
        let bytes = 0;
        let end = offset + buffer.length;
        let entry = this.tree.locate({ operator: "<=", key: offset });
        if (entry != null) {
            let distance = current - entry.key;
            let overlap = Math.min(entry.value.length - distance, buffer.length);
            if (overlap > 0) {
                buffer.set(entry.value.subarray(distance, distance + overlap), bytes);
                current += overlap;
                bytes += overlap;
            }
        }
        if (current >= end) {
            return buffer;
        }
        let entries = Array.from(this.tree.filter({ operator: ">", key: offset }, { operator: "<", key: end }));
        for (let entry of entries) {
            let gap = entry.key - current;
            if (gap > 0) {
                let value = buffer.subarray(bytes, bytes + gap);
                let distance = this.file.size() - current;
                if (distance > 0) {
                    this.file.read(value.subarray(0, distance), current);
                }
                this.cache.insert(current, value.slice());
                current += gap;
                bytes += gap;
            }
            let overlap = Math.min(entry.value.length, end - current);
            buffer.set(entry.value.subarray(0, overlap), bytes);
            current += overlap;
            bytes += overlap;
        }
        let gap = end - current;
        if (gap > 0) {
            let value = buffer.subarray(bytes, bytes + gap);
            let distance = this.file.size() - current;
            if (distance > 0) {
                this.file.read(value.subarray(0, distance), current);
            }
            this.cache.insert(current, value.slice());
            current += gap;
            bytes += gap;
        }
        return buffer;
    }
    resize(size) {
        if (env_1.DEBUG)
            asserts.IntegerAssert.atLeast(0, size);
        this.file.resize(size);
        let entry = this.tree.locate({ operator: "<", key: size });
        if (entry != null) {
            let distance = size - entry.key;
            let overlap = entry.value.length - distance;
            if (overlap > 0) {
                let value = entry.value.subarray(0, distance);
                this.cache.insert(entry.key, value.slice());
            }
        }
        let entries = Array.from(this.tree.filter({ operator: ">=", key: size }));
        for (let entry of entries) {
            this.cache.remove(entry.key);
        }
    }
    size() {
        return this.file.size();
    }
    write(buffer, offset) {
        if (env_1.DEBUG)
            asserts.IntegerAssert.atLeast(0, offset);
        this.file.write(buffer, offset);
        let current = offset;
        let bytes = 0;
        let end = offset + buffer.length;
        let entry = this.tree.locate({ operator: "<=", key: offset });
        if (entry != null) {
            let distance = current - entry.key;
            let overlap = Math.min(entry.value.length - distance, buffer.length);
            if (overlap > 0) {
                entry.value.set(buffer.subarray(bytes, bytes + overlap), distance);
                current += overlap;
                bytes += overlap;
            }
        }
        if (current >= end) {
            return buffer;
        }
        let entries = Array.from(this.tree.filter({ operator: ">", key: offset }, { operator: "<", key: end }));
        for (let entry of entries) {
            let gap = entry.key - current;
            if (gap > 0) {
                let value = buffer.subarray(bytes, bytes + gap);
                this.cache.insert(current, value.slice());
                current += gap;
                bytes += gap;
            }
            let overlap = Math.min(entry.value.length, end - current);
            entry.value.set(buffer.subarray(bytes, bytes + overlap), 0);
            current += overlap;
            bytes += overlap;
        }
        let gap = end - current;
        if (gap > 0) {
            let value = buffer.subarray(bytes, bytes + gap);
            this.cache.insert(current, value.slice());
            current += gap;
            bytes += gap;
        }
        return buffer;
    }
}
exports.CachedFile = CachedFile;
;
class DurableFile extends File {
    bin;
    log;
    header;
    tree;
    readDelta(offset) {
        let header = new chunks_1.LogDeltaHeader();
        header.read(this.log, offset);
        offset += chunks_1.LogDeltaHeader.LENGTH;
        let length = header.length();
        let redo = new Uint8Array(length);
        this.log.read(redo, offset);
        offset += length;
        let undo = new Uint8Array(length);
        this.log.read(undo, offset);
        offset += length;
        let delta = {
            header,
            redo,
            undo
        };
        return delta;
    }
    writeDelta(delta, offset) {
        delta.header.write(this.log, offset);
        offset += chunks_1.LogDeltaHeader.LENGTH;
        this.log.write(delta.redo, offset);
        offset += delta.redo.length;
        this.log.write(delta.undo, offset);
        offset += delta.undo.length;
    }
    appendRedo(redo, offset) {
        let header = new chunks_1.LogDeltaHeader();
        header.offset(offset);
        header.length(redo.length);
        let undo = new Uint8Array(redo.length);
        let distance = this.bin.size() - offset;
        if (distance > 0) {
            this.bin.read(undo.subarray(0, distance), offset);
        }
        let delta = {
            header,
            undo,
            redo
        };
        this.tree.insert(offset, this.log.size());
        this.writeDelta(delta, this.log.size());
        this.header.redoSize(Math.max(this.header.redoSize(), offset + redo.length));
        this.header.write(this.log, 0);
    }
    redo() {
        let redoSize = this.header.redoSize();
        let entries = this.tree.filter({ operator: "<", key: redoSize });
        for (let entry of entries) {
            let delta = this.readDelta(entry.value);
            this.bin.write(delta.redo, entry.key);
        }
        this.bin.resize(redoSize);
        this.bin.persist();
        this.discard();
    }
    undo() {
        let undoSize = this.header.undoSize();
        let entries = this.tree.filter({ operator: "<", key: undoSize });
        for (let entry of entries) {
            let delta = this.readDelta(entry.value);
            this.bin.write(delta.undo, entry.key);
        }
        this.bin.resize(undoSize);
        this.bin.persist();
        this.discard();
    }
    constructor(bin, log) {
        super();
        this.bin = bin;
        this.log = log;
        this.header = new chunks_1.LogHeader();
        this.header.redoSize(this.bin.size());
        this.header.undoSize(this.bin.size());
        this.tree = new stdlib.collections.avl.Tree();
        if (log.size() === 0) {
            this.header.write(this.log, 0);
        }
        else {
            let offset = 0;
            this.header.read(this.log, offset);
            offset += chunks_1.LogHeader.LENGTH;
            // A corrupted log should be discarded since it is persisted before and after bin is persisted.
            try {
                while (offset < this.log.size()) {
                    let header = new chunks_1.LogDeltaHeader();
                    header.read(this.log, offset);
                    this.tree.insert(header.offset(), offset);
                    let length = header.length();
                    offset += chunks_1.LogDeltaHeader.LENGTH + length + length;
                }
                this.undo();
            }
            catch (error) {
                this.discard();
            }
        }
    }
    discard() {
        if (this.tree.length() > 0) {
            this.log.resize(0);
            this.header.redoSize(this.bin.size());
            this.header.undoSize(this.bin.size());
            this.header.write(this.log, 0);
            this.log.persist();
            this.tree.clear();
        }
    }
    persist() {
        if (this.tree.length() > 0) {
            this.log.persist();
            this.redo();
        }
    }
    read(buffer, offset) {
        if (env_1.DEBUG)
            asserts.IntegerAssert.atLeast(0, offset);
        let current = offset;
        let bytes = 0;
        let end = offset + buffer.length;
        let entry = this.tree.locate({ operator: "<=", key: offset });
        if (entry != null) {
            let delta = this.readDelta(entry.value);
            let distance = current - delta.header.offset();
            let overlap = Math.min(delta.header.length() - distance, buffer.length);
            if (overlap > 0) {
                buffer.set(delta.redo.subarray(distance, distance + overlap), bytes);
                current += overlap;
                bytes += overlap;
            }
        }
        if (current >= end) {
            return buffer;
        }
        let entries = this.tree.filter({ operator: ">", key: offset }, { operator: "<", key: end });
        for (let entry of entries) {
            let gap = entry.key - current;
            if (gap > 0) {
                let redo = buffer.subarray(bytes, bytes + gap);
                let distance = this.bin.size() - current;
                if (distance > 0) {
                    this.bin.read(redo.subarray(0, distance), current);
                }
                current += gap;
                bytes += gap;
            }
            let delta = this.readDelta(entry.value);
            let overlap = Math.min(delta.header.length(), end - current);
            buffer.set(delta.redo.subarray(0, overlap), bytes);
            current += overlap;
            bytes += overlap;
        }
        let gap = end - current;
        if (gap > 0) {
            let redo = buffer.subarray(bytes, bytes + gap);
            let distance = this.bin.size() - current;
            if (distance > 0) {
                this.bin.read(redo.subarray(0, distance), current);
            }
            current += gap;
            bytes += gap;
        }
        return buffer;
    }
    resize(size) {
        if (env_1.DEBUG)
            asserts.IntegerAssert.atLeast(0, size);
        let entry = this.tree.locate({ operator: "<", key: size });
        if (entry != null) {
            let delta = this.readDelta(entry.value);
            let distance = size - delta.header.offset();
            let overlap = delta.header.length() - distance;
            if (overlap > 0) {
                this.tree.remove(entry.key);
                let redo = delta.redo.subarray(0, distance);
                this.appendRedo(redo, entry.key);
            }
        }
        let entries = Array.from(this.tree.filter({ operator: ">=", key: size }));
        for (let entry of entries) {
            this.tree.remove(entry.key);
        }
        this.header.redoSize(size);
        this.header.write(this.log, 0);
    }
    size() {
        return this.header.redoSize();
    }
    write(buffer, offset) {
        if (env_1.DEBUG)
            asserts.IntegerAssert.atLeast(0, offset);
        let current = offset;
        let bytes = 0;
        let end = offset + buffer.length;
        let entry = this.tree.locate({ operator: "<=", key: offset });
        if (entry != null) {
            let delta = this.readDelta(entry.value);
            let distance = current - delta.header.offset();
            let overlap = Math.min(delta.header.length() - distance, buffer.length);
            if (overlap > 0) {
                delta.redo.set(buffer.subarray(bytes, bytes + overlap), distance);
                this.writeDelta(delta, entry.value);
                current += overlap;
                bytes += overlap;
            }
        }
        if (current >= end) {
            return buffer;
        }
        let entries = Array.from(this.tree.filter({ operator: ">", key: offset }, { operator: "<", key: end }));
        for (let entry of entries) {
            let gap = entry.key - current;
            if (gap > 0) {
                let redo = buffer.subarray(bytes, bytes + gap);
                this.appendRedo(redo, current);
                current += gap;
                bytes += gap;
            }
            let delta = this.readDelta(entry.value);
            let overlap = Math.min(delta.header.length(), end - current);
            delta.redo.set(buffer.subarray(bytes, bytes + overlap), 0);
            this.writeDelta(delta, entry.value);
            current += overlap;
            bytes += overlap;
        }
        let gap = end - current;
        if (gap > 0) {
            let redo = buffer.subarray(bytes, bytes + gap);
            this.appendRedo(redo, current);
            current += gap;
            bytes += gap;
        }
        return buffer;
    }
}
exports.DurableFile = DurableFile;
;
class PhysicalFile extends File {
    fd;
    constructor(filename, clear) {
        super();
        libfs.mkdirSync(libpath.dirname(filename), { recursive: true });
        this.fd = libfs.openSync(filename, libfs.existsSync(filename) ? "r+" : "w+");
        if (clear) {
            this.resize(0);
        }
    }
    discard() {
        throw `Expected discard() to be delegated to another implementation!`;
    }
    persist() {
        return libfs.fsyncSync(this.fd);
    }
    read(buffer, offset) {
        if (env_1.DEBUG)
            asserts.IntegerAssert.atLeast(0, offset);
        let bytesRead = libfs.readSync(this.fd, buffer, {
            position: offset
        });
        if (bytesRead !== buffer.length) {
            throw `Expected to read ${buffer.length} bytes but ${bytesRead} bytes were read!`;
        }
        return buffer;
    }
    resize(size) {
        if (env_1.DEBUG)
            asserts.IntegerAssert.atLeast(0, size);
        return libfs.ftruncateSync(this.fd, size);
    }
    size() {
        return libfs.fstatSync(this.fd).size;
    }
    write(buffer, offset) {
        if (env_1.DEBUG)
            asserts.IntegerAssert.atLeast(0, offset);
        let bytesWritten = libfs.writeSync(this.fd, buffer, 0, buffer.length, offset);
        if (bytesWritten !== buffer.length) {
            throw `Expected to write ${buffer.length} bytes but ${bytesWritten} bytes were written!`;
        }
        return buffer;
    }
}
exports.PhysicalFile = PhysicalFile;
;
class VirtualFile extends File {
    backup;
    buffer;
    constructor(size) {
        super();
        if (env_1.DEBUG)
            asserts.IntegerAssert.atLeast(0, size);
        this.backup = new Uint8Array(size);
        this.buffer = new Uint8Array(size);
    }
    discard() {
        this.buffer = new Uint8Array(this.backup.length);
        this.buffer.set(this.backup, 0);
    }
    persist() {
        this.backup = new Uint8Array(this.buffer.length);
        this.backup.set(this.buffer, 0);
    }
    read(buffer, offset) {
        if (env_1.DEBUG)
            asserts.IntegerAssert.atLeast(0, offset);
        let minSize = offset + buffer.length;
        let size = this.size();
        if (size < minSize) {
            throw `Expected to read ${buffer.length} bytes at offset ${offset} from a total of ${size}!`;
        }
        buffer.set(this.buffer.subarray(offset, offset + buffer.length), 0);
        return buffer;
    }
    resize(size) {
        if (env_1.DEBUG)
            asserts.IntegerAssert.atLeast(0, size);
        let buffer = new Uint8Array(size);
        buffer.set(this.buffer.subarray(0, Math.min(size, this.size())), 0);
        this.buffer = buffer;
    }
    size() {
        return this.buffer.length;
    }
    write(buffer, offset) {
        if (env_1.DEBUG)
            asserts.IntegerAssert.atLeast(0, offset);
        let minSize = offset + buffer.length;
        let size = this.size();
        if (size < minSize) {
            this.resize(minSize);
        }
        this.buffer.set(buffer, offset);
        return buffer;
    }
}
exports.VirtualFile = VirtualFile;
;
