"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BooleanAssert = void 0;
class BooleanAssert {
    constructor() { }
    static true(value) {
        if (value !== true) {
            throw `Expected ${value} to be true!`;
        }
        return value;
    }
    static false(value) {
        if (value !== false) {
            throw `Expected ${value} to be false!`;
        }
        return value;
    }
}
exports.BooleanAssert = BooleanAssert;
;
