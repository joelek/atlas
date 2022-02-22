"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StringAssert = void 0;
class StringAssert {
    constructor() { }
    static identical(value, expected) {
        if (value !== expected) {
            throw `Expected "${value}" to be identical to ${expected}!`;
        }
        return value;
    }
}
exports.StringAssert = StringAssert;
;
