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
function* flatten(iterable) {
    for (let value of iterable) {
        if (typeof value[Symbol.iterator] === "function") {
            yield* value;
        }
        else {
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
function* limit(iterable, length) {
    if (length > 0) {
        let index = 0;
        for (let value of iterable) {
            yield value;
            index += 1;
            if (index >= length) {
                break;
            }
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
    flatten() {
        return new StreamIterable(flatten(this.values));
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
    limit(length) {
        return new StreamIterable(limit(this.values, length));
    }
    map(transform) {
        return new StreamIterable(map(this.values, transform));
    }
    peek() {
        let iterator = this.values[Symbol.iterator]();
        let result = iterator.next();
        if (!result.done) {
            this.values = flatten([[result.value], new class {
                    [Symbol.iterator]() {
                        return iterator;
                    }
                }]);
        }
        return result.value;
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
