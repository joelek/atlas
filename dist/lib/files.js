"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VirtualFile = exports.PhysicalFile = exports.PagedFile = exports.DurableFile = exports.PagedDurableFile = exports.LogDeltaHeader = exports.LogHeader = exports.CachedFile = exports.File = void 0;
const stdlib = require("@joelek/ts-stdlib");
const libfs = require("fs");
const libpath = require("path");
const asserts = require("../mod/asserts");
const caches_1 = require("./caches");
const chunks_1 = require("./chunks");
const variables_1 = require("./variables");
const utils = require("./utils");
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
        this.cache = new caches_1.Cache({
            getWeightForValue: (value) => 64 + value.length,
            onInsert: (key, value) => this.tree.insert(key, value),
            onRemove: (key) => this.tree.remove(key)
        }, maxWeight);
    }
    discard() {
        this.file.discard();
    }
    persist() {
        this.file.persist();
    }
    read(buffer, offset) {
        if (variables_1.DEBUG)
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
                this.cache.insert(entry.key, entry.value);
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
            this.cache.insert(entry.key, entry.value);
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
        if (variables_1.DEBUG)
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
        if (variables_1.DEBUG)
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
                this.cache.insert(entry.key, entry.value);
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
            this.cache.insert(entry.key, entry.value);
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
class LogHeader extends chunks_1.Chunk {
    constructor(buffer) {
        super(buffer ?? new Uint8Array(LogHeader.LENGTH));
        if (variables_1.DEBUG)
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
class LogDeltaHeader extends chunks_1.Chunk {
    constructor(buffer) {
        super(buffer ?? new Uint8Array(LogDeltaHeader.LENGTH));
        if (variables_1.DEBUG)
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
class PagedDurableFile extends File {
    bin;
    log;
    header;
    pageSizeLog2;
    pageSize;
    logOffsets;
    readRedo(logOffset, buffer, offset) {
        let header = new LogDeltaHeader();
        header.read(this.log, logOffset);
        logOffset += LogDeltaHeader.LENGTH;
        let length = header.length();
        if (variables_1.DEBUG)
            asserts.IntegerAssert.between(0, offset, length);
        if (variables_1.DEBUG)
            asserts.IntegerAssert.between(0, buffer.length, length - offset);
        this.log.read(buffer, logOffset + offset);
    }
    writeRedo(logOffset, buffer, offset) {
        let header = new LogDeltaHeader();
        header.read(this.log, logOffset);
        logOffset += LogDeltaHeader.LENGTH;
        let length = header.length();
        if (variables_1.DEBUG)
            asserts.IntegerAssert.between(0, offset, length);
        if (variables_1.DEBUG)
            asserts.IntegerAssert.between(0, buffer.length, length - offset);
        this.log.write(buffer, logOffset + offset);
    }
    readDelta(offset) {
        let header = new LogDeltaHeader();
        header.read(this.log, offset);
        offset += LogDeltaHeader.LENGTH;
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
        offset += LogDeltaHeader.LENGTH;
        this.log.write(delta.redo, offset);
        offset += delta.redo.length;
        this.log.write(delta.undo, offset);
        offset += delta.undo.length;
    }
    appendRedo(redo, offset, activeBytes) {
        activeBytes = activeBytes ?? redo.length;
        let header = new LogDeltaHeader();
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
        this.logOffsets.set(offset, this.log.size());
        this.writeDelta(delta, this.log.size());
        this.header.redoSize(Math.max(this.header.redoSize(), offset + activeBytes));
    }
    redo() {
        let redoSize = this.header.redoSize();
        for (let [key, value] of this.logOffsets) {
            if (key >= redoSize) {
                continue;
            }
            let delta = this.readDelta(value);
            this.bin.write(delta.redo, key);
        }
        this.bin.resize(redoSize);
        this.bin.persist();
        this.discard();
    }
    undo() {
        let undoSize = this.header.undoSize();
        for (let [key, value] of this.logOffsets) {
            if (key >= undoSize) {
                continue;
            }
            let delta = this.readDelta(value);
            this.bin.write(delta.undo, key);
        }
        this.bin.resize(undoSize);
        this.bin.persist();
        this.discard();
    }
    constructor(bin, log, pageSizeLog2) {
        if (variables_1.DEBUG)
            asserts.IntegerAssert.atLeast(0, pageSizeLog2);
        super();
        this.bin = bin;
        this.log = log;
        this.header = new LogHeader();
        this.header.redoSize(this.bin.size());
        this.header.undoSize(this.bin.size());
        this.pageSizeLog2 = pageSizeLog2;
        this.pageSize = 2 ** pageSizeLog2;
        this.logOffsets = new Map();
        if (log.size() === 0) {
            this.header.write(this.log, 0);
        }
        else {
            let offset = 0;
            this.header.read(this.log, offset);
            offset += LogHeader.LENGTH;
            // A corrupted log should be discarded since it is persisted before and after bin is persisted.
            try {
                while (offset < this.log.size()) {
                    let header = new LogDeltaHeader();
                    header.read(this.log, offset);
                    this.logOffsets.set(header.offset(), offset);
                    let length = header.length();
                    offset += LogDeltaHeader.LENGTH + length + length;
                }
                this.undo();
            }
            catch (error) {
                this.discard();
            }
        }
    }
    discard() {
        if (this.log.size() > LogHeader.LENGTH) {
            this.log.resize(0);
            this.header.redoSize(this.bin.size());
            this.header.undoSize(this.bin.size());
            this.header.write(this.log, 0);
            this.log.persist();
            this.logOffsets.clear();
        }
    }
    persist() {
        if (this.log.size() > LogHeader.LENGTH || this.bin.size() !== this.header.redoSize()) {
            this.header.write(this.log, 0);
            this.log.persist();
            this.redo();
        }
    }
    read(buffer, offset) {
        if (variables_1.DEBUG)
            asserts.IntegerAssert.atLeast(0, offset);
        if (variables_1.DEBUG)
            asserts.IntegerAssert.between(0, buffer.length, this.size() - offset);
        if (buffer.length === 0) {
            return buffer;
        }
        buffer.fill(0);
        let firstByte = offset;
        let lastByte = offset + buffer.length - 1;
        let firstPageIndex = firstByte >> this.pageSizeLog2;
        let lastPageIndex = lastByte >> this.pageSizeLog2;
        let firstPageOffset = firstByte & (this.pageSize - 1);
        let lastPageOffset = (lastByte & (this.pageSize - 1)) + 1;
        let bytes = 0;
        for (let pageIndex = firstPageIndex; pageIndex <= lastPageIndex; pageIndex++) {
            let pageOffset = pageIndex === firstPageIndex ? firstPageOffset : 0;
            let pageLength = (pageIndex === lastPageIndex ? lastPageOffset : this.pageSize) - pageOffset;
            let binOffset = pageIndex << this.pageSizeLog2;
            let logOffset = this.logOffsets.get(binOffset);
            if (logOffset == null) {
                let overlap = this.bin.size() - binOffset;
                if (overlap > 0) {
                    let readLength = Math.min(overlap, this.pageSize);
                    this.bin.read(buffer.subarray(bytes, bytes + readLength), binOffset + pageOffset);
                }
            }
            else {
                this.readRedo(logOffset, buffer.subarray(bytes, bytes + pageLength), pageOffset);
            }
            bytes += pageLength;
        }
        return buffer;
    }
    resize(size) {
        if (variables_1.DEBUG)
            asserts.IntegerAssert.atLeast(0, size);
        let currentSize = this.size();
        if (size === currentSize) {
            return;
        }
        let firstByte = Math.min(size, currentSize);
        let lastByte = Math.max(size, currentSize) - 1;
        let firstPageIndex = firstByte >> this.pageSizeLog2;
        let lastPageIndex = lastByte >> this.pageSizeLog2;
        let firstPageOffset = firstByte & (this.pageSize - 1);
        let lastPageOffset = (lastByte & (this.pageSize - 1)) + 1;
        for (let pageIndex = firstPageIndex; pageIndex <= lastPageIndex; pageIndex++) {
            let pageOffset = pageIndex === firstPageIndex ? firstPageOffset : 0;
            let pageLength = (pageIndex === lastPageIndex ? lastPageOffset : this.pageSize) - pageOffset;
            let binOffset = pageIndex << this.pageSizeLog2;
            let logOffset = this.logOffsets.get(binOffset);
            if (logOffset == null) {
                let redo = new Uint8Array(this.pageSize);
                let overlap = this.bin.size() - binOffset;
                if (overlap > 0) {
                    let readLength = Math.min(overlap, this.pageSize);
                    this.bin.read(redo.subarray(0, readLength), binOffset);
                }
                this.appendRedo(redo, binOffset, pageOffset + pageLength);
            }
            else {
                let delta = this.readDelta(logOffset);
                delta.redo.subarray(pageOffset, pageOffset + pageLength).fill(0);
                this.writeDelta(delta, logOffset);
            }
        }
        this.header.redoSize(size);
    }
    size() {
        return this.header.redoSize();
    }
    write(buffer, offset) {
        if (variables_1.DEBUG)
            asserts.IntegerAssert.atLeast(0, offset);
        if (buffer.length === 0) {
            return buffer;
        }
        let firstByte = offset;
        let lastByte = offset + buffer.length - 1;
        let firstPageIndex = firstByte >> this.pageSizeLog2;
        let lastPageIndex = lastByte >> this.pageSizeLog2;
        let firstPageOffset = firstByte & (this.pageSize - 1);
        let lastPageOffset = (lastByte & (this.pageSize - 1)) + 1;
        let bytes = 0;
        for (let pageIndex = firstPageIndex; pageIndex <= lastPageIndex; pageIndex++) {
            let pageOffset = pageIndex === firstPageIndex ? firstPageOffset : 0;
            let pageLength = (pageIndex === lastPageIndex ? lastPageOffset : this.pageSize) - pageOffset;
            let binOffset = pageIndex << this.pageSizeLog2;
            let logOffset = this.logOffsets.get(binOffset);
            if (logOffset == null) {
                let redo = new Uint8Array(this.pageSize);
                let overlap = this.bin.size() - binOffset;
                if (overlap > 0) {
                    let readLength = Math.min(overlap, this.pageSize);
                    this.bin.read(redo.subarray(0, readLength), binOffset);
                }
                redo.set(buffer.subarray(bytes, bytes + pageLength), pageOffset);
                this.appendRedo(redo, binOffset, pageOffset + pageLength);
            }
            else {
                this.writeRedo(logOffset, buffer.subarray(bytes, bytes + pageLength), pageOffset);
            }
            bytes += pageLength;
        }
        this.header.redoSize(Math.max(this.header.redoSize(), offset + buffer.length));
        return buffer;
    }
}
exports.PagedDurableFile = PagedDurableFile;
;
class DurableFile extends File {
    bin;
    log;
    header;
    tree;
    readDelta(offset) {
        let header = new LogDeltaHeader();
        header.read(this.log, offset);
        offset += LogDeltaHeader.LENGTH;
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
        offset += LogDeltaHeader.LENGTH;
        this.log.write(delta.redo, offset);
        offset += delta.redo.length;
        this.log.write(delta.undo, offset);
        offset += delta.undo.length;
    }
    appendRedo(redo, offset) {
        let header = new LogDeltaHeader();
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
        this.header = new LogHeader();
        this.header.redoSize(this.bin.size());
        this.header.undoSize(this.bin.size());
        this.tree = new stdlib.collections.avl.Tree();
        if (log.size() === 0) {
            this.header.write(this.log, 0);
        }
        else {
            let offset = 0;
            this.header.read(this.log, offset);
            offset += LogHeader.LENGTH;
            // A corrupted log should be discarded since it is persisted before and after bin is persisted.
            try {
                while (offset < this.log.size()) {
                    let header = new LogDeltaHeader();
                    header.read(this.log, offset);
                    this.tree.insert(header.offset(), offset);
                    let length = header.length();
                    offset += LogDeltaHeader.LENGTH + length + length;
                }
                this.undo();
            }
            catch (error) {
                this.discard();
            }
        }
    }
    discard() {
        if (this.log.size() > LogHeader.LENGTH) {
            this.log.resize(0);
            this.header.redoSize(this.bin.size());
            this.header.undoSize(this.bin.size());
            this.header.write(this.log, 0);
            this.log.persist();
            this.tree.clear();
        }
    }
    persist() {
        if (this.log.size() > LogHeader.LENGTH || this.bin.size() !== this.header.redoSize()) {
            this.header.write(this.log, 0);
            this.log.persist();
            this.redo();
        }
    }
    read(buffer, offset) {
        if (variables_1.DEBUG)
            asserts.IntegerAssert.atLeast(0, offset);
        let current = offset;
        let bytes = 0;
        let end = offset + buffer.length;
        let entry = this.tree.locate({ operator: "<=", key: offset });
        if (entry != null) {
            let header = new LogDeltaHeader();
            header.read(this.log, entry.value);
            let distance = current - entry.key;
            let overlap = Math.min(header.length() - distance, buffer.length);
            if (overlap > 0) {
                this.log.read(buffer.subarray(bytes, bytes + overlap), entry.value + LogDeltaHeader.LENGTH + distance);
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
                redo.fill(0);
                let distance = this.bin.size() - current;
                if (distance > 0) {
                    this.bin.read(redo.subarray(0, distance), current);
                }
                current += gap;
                bytes += gap;
            }
            let header = new LogDeltaHeader();
            header.read(this.log, entry.value);
            let overlap = Math.min(header.length(), end - current);
            this.log.read(buffer.subarray(bytes, bytes + overlap), entry.value + LogDeltaHeader.LENGTH + 0);
            current += overlap;
            bytes += overlap;
        }
        let gap = end - current;
        if (gap > 0) {
            let redo = buffer.subarray(bytes, bytes + gap);
            redo.fill(0);
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
        if (variables_1.DEBUG)
            asserts.IntegerAssert.atLeast(0, size);
        let entry = this.tree.locate({ operator: "<", key: size });
        if (entry != null) {
            let header = new LogDeltaHeader();
            header.read(this.log, entry.value);
            let distance = size - entry.key;
            let overlap = header.length() - distance;
            if (overlap > 0) {
                this.tree.remove(entry.key);
                let redo = new Uint8Array(distance);
                this.log.read(redo, entry.value + LogDeltaHeader.LENGTH + 0);
                this.appendRedo(redo, entry.key);
            }
        }
        let entries = Array.from(this.tree.filter({ operator: ">=", key: size }));
        for (let entry of entries) {
            this.tree.remove(entry.key);
        }
        this.header.redoSize(size);
    }
    size() {
        return this.header.redoSize();
    }
    write(buffer, offset) {
        if (variables_1.DEBUG)
            asserts.IntegerAssert.atLeast(0, offset);
        let current = offset;
        let bytes = 0;
        let end = offset + buffer.length;
        let entry = this.tree.locate({ operator: "<=", key: offset });
        if (entry != null) {
            let header = new LogDeltaHeader();
            header.read(this.log, entry.value);
            let distance = current - entry.key;
            let overlap = Math.min(header.length() - distance, buffer.length);
            if (overlap > 0) {
                this.log.write(buffer.subarray(bytes, bytes + overlap), entry.value + LogDeltaHeader.LENGTH + distance);
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
            let header = new LogDeltaHeader();
            header.read(this.log, entry.value);
            let overlap = Math.min(header.length(), end - current);
            this.log.write(buffer.subarray(bytes, bytes + overlap), entry.value + LogDeltaHeader.LENGTH + 0);
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
class PagedFile extends File {
    file;
    pageSizeLog2;
    pageSize;
    cache;
    constructor(file, pageSizeLog2, maxPageCount) {
        if (variables_1.DEBUG)
            asserts.IntegerAssert.atLeast(0, pageSizeLog2);
        super();
        this.file = file;
        this.pageSizeLog2 = pageSizeLog2;
        this.pageSize = 2 ** pageSizeLog2;
        this.cache = new caches_1.Cache(undefined, maxPageCount);
    }
    discard() {
        this.file.discard();
    }
    persist() {
        this.file.persist();
    }
    read(buffer, offset) {
        if (variables_1.DEBUG)
            asserts.IntegerAssert.atLeast(0, offset);
        if (variables_1.DEBUG)
            asserts.IntegerAssert.between(0, buffer.length, this.size() - offset);
        if (buffer.length === 0) {
            return buffer;
        }
        let firstByte = offset;
        let lastByte = offset + buffer.length - 1;
        let firstPageIndex = firstByte >> this.pageSizeLog2;
        let lastPageIndex = lastByte >> this.pageSizeLog2;
        let firstPageOffset = firstByte & (this.pageSize - 1);
        let lastPageOffset = (lastByte & (this.pageSize - 1)) + 1;
        let bytes = 0;
        for (let pageIndex = firstPageIndex; pageIndex <= lastPageIndex; pageIndex++) {
            let pageOffset = pageIndex === firstPageIndex ? firstPageOffset : 0;
            let pageLength = (pageIndex === lastPageIndex ? lastPageOffset : this.pageSize) - pageOffset;
            let page = this.cache.lookup(pageIndex);
            if (page == null) {
                let readOffset = pageIndex << this.pageSizeLog2;
                let readLength = Math.min(this.size() - readOffset, this.pageSize);
                page = new Uint8Array(readLength);
                this.file.read(page, readOffset);
            }
            this.cache.insert(pageIndex, page);
            buffer.set(page.subarray(pageOffset, pageOffset + pageLength), bytes);
            bytes += pageLength;
        }
        return buffer;
    }
    resize(size) {
        if (variables_1.DEBUG)
            asserts.IntegerAssert.atLeast(0, size);
        let currentSize = this.size();
        if (size === currentSize) {
            return;
        }
        this.file.resize(size);
        if (size === 0) {
            this.cache.clear();
            return;
        }
        let firstByte = Math.min(size, currentSize);
        let lastByte = Math.max(size, currentSize) - 1;
        let firstPageIndex = firstByte >> this.pageSizeLog2;
        let lastPageIndex = lastByte >> this.pageSizeLog2;
        for (let pageIndex = firstPageIndex; pageIndex <= lastPageIndex; pageIndex++) {
            this.cache.remove(pageIndex);
        }
    }
    size() {
        return this.file.size();
    }
    write(buffer, offset) {
        if (variables_1.DEBUG)
            asserts.IntegerAssert.atLeast(0, offset);
        if (buffer.length === 0) {
            return buffer;
        }
        this.file.write(buffer, offset);
        let firstByte = offset;
        let lastByte = offset + buffer.length - 1;
        let firstPageIndex = firstByte >> this.pageSizeLog2;
        let lastPageIndex = lastByte >> this.pageSizeLog2;
        let firstPageOffset = firstByte & (this.pageSize - 1);
        let lastPageOffset = (lastByte & (this.pageSize - 1)) + 1;
        let bytes = 0;
        for (let pageIndex = firstPageIndex; pageIndex <= lastPageIndex; pageIndex++) {
            let pageOffset = pageIndex === firstPageIndex ? firstPageOffset : 0;
            let pageLength = (pageIndex === lastPageIndex ? lastPageOffset : this.pageSize) - pageOffset;
            let page = this.cache.lookup(pageIndex);
            if (page != null) {
                let readOffset = pageIndex << this.pageSizeLog2;
                let readLength = Math.min(this.size() - readOffset, this.pageSize);
                if (page.length !== readLength) {
                    page = new Uint8Array(readLength);
                    this.file.read(page, readOffset);
                }
                page.set(buffer.subarray(bytes, bytes + pageLength), pageOffset);
                this.cache.insert(pageIndex, page);
            }
            bytes += pageLength;
        }
        return buffer;
    }
}
exports.PagedFile = PagedFile;
;
class PhysicalFile extends File {
    fd;
    currentSize;
    constructor(filename, clear) {
        super();
        libfs.mkdirSync(libpath.dirname(filename), { recursive: true });
        this.fd = libfs.openSync(filename, libfs.existsSync(filename) ? "r+" : "w+");
        this.currentSize = libfs.fstatSync(this.fd).size;
        if (clear) {
            this.resize(0);
        }
    }
    discard() {
        throw `Expected discard() to be delegated to another implementation!`;
    }
    hint() {
        let pageSizeLog2 = Math.log2(libfs.fstatSync(this.fd).blksize);
        return {
            pageSizeLog2
        };
    }
    persist() {
        libfs.fsyncSync(this.fd);
    }
    read(buffer, offset) {
        if (variables_1.DEBUG)
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
        if (variables_1.DEBUG)
            asserts.IntegerAssert.atLeast(0, size);
        libfs.ftruncateSync(this.fd, size);
        this.currentSize = size;
    }
    size() {
        return this.currentSize;
    }
    write(buffer, offset) {
        if (variables_1.DEBUG)
            asserts.IntegerAssert.atLeast(0, offset);
        let bytesWritten = libfs.writeSync(this.fd, buffer, 0, buffer.length, offset);
        if (bytesWritten !== buffer.length) {
            throw `Expected to write ${buffer.length} bytes but ${bytesWritten} bytes were written!`;
        }
        this.currentSize = Math.max(this.currentSize, offset + buffer.length);
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
        if (variables_1.DEBUG)
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
        if (variables_1.DEBUG)
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
        if (variables_1.DEBUG)
            asserts.IntegerAssert.atLeast(0, size);
        let buffer = new Uint8Array(size);
        buffer.set(this.buffer.subarray(0, Math.min(size, this.size())), 0);
        this.buffer = buffer;
    }
    size() {
        return this.buffer.length;
    }
    write(buffer, offset) {
        if (variables_1.DEBUG)
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
