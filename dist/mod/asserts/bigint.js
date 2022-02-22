"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BigintAssert = void 0;
class BigintAssert {
    constructor() { }
    static atLeast(min, value) {
        if (value < min) {
            throw `Expected ${value} to be at least ${min}!`;
        }
        return value;
    }
    static atMost(max, value) {
        if (value > max) {
            throw `Expected ${value} to be at most ${max}!`;
        }
        return value;
    }
    static between(min, value, max) {
        if (value < min || value > max) {
            throw `Expected ${value} to be between ${min} and ${max}!`;
        }
        return value;
    }
    static exactly(value, expected) {
        if (value !== expected) {
            throw `Expected ${value} to be exactly ${expected}!`;
        }
        return value;
    }
}
exports.BigintAssert = BigintAssert;
;
