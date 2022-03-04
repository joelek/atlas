"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEBUG = exports.getBoolean = void 0;
function getBoolean(key, defaultValue) {
    let string = globalThis?.process?.env[key];
    try {
        let json = JSON.parse(string);
        if (typeof json === "boolean") {
            return json;
        }
    }
    catch (error) { }
    return defaultValue;
}
exports.getBoolean = getBoolean;
;
exports.DEBUG = getBoolean("DEBUG", false);
