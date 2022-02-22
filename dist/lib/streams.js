"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamIterable = void 0;
function* filter(iterable, predicate) {
    let index = 0;
    for (let value of iterable) {
        if (predicate(value, index++)) {
            yield value;
        }
    }
}
;
function* include(iterable, predicate) {
    let index = 0;
    for (let value of iterable) {
        if (predicate(value, index++)) {
            yield value;
        }
    }
}
;
function* map(iterable, transform) {
    let index = 0;
    for (let value of iterable) {
        yield transform(value, index++);
    }
}
;
class StreamIterable {
    values;
    constructor(values) {
        this.values = values;
    }
    *[Symbol.iterator]() {
        for (let value of this.values) {
            yield value;
        }
    }
    collect() {
        return Array.from(this.values);
    }
    filter(predicate) {
        return new StreamIterable(filter(this.values, predicate));
    }
    find(predicate) {
        let index = 0;
        for (let value of this.values) {
            if (predicate(value, index++)) {
                return value;
            }
        }
    }
    include(predicate) {
        return new StreamIterable(include(this.values, predicate));
    }
    includes(predicate) {
        let index = 0;
        for (let value of this.values) {
            if (predicate(value, index++)) {
                return true;
            }
        }
        return false;
    }
    map(transform) {
        return new StreamIterable(map(this.values, transform));
    }
    shift() {
        for (let value of this.values) {
            return value;
        }
    }
    slice(start, end) {
        let array = this.collect().slice(start, end);
        return new StreamIterable(array);
    }
    sort(comparator) {
        let array = this.collect().sort(comparator);
        return new StreamIterable(array);
    }
    unique() {
        return new StreamIterable(new Set(this.values));
    }
    static of(values) {
        return new StreamIterable(values ?? new Array());
    }
}
exports.StreamIterable = StreamIterable;
;
