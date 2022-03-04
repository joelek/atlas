"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContext = void 0;
const contexts_1 = require("./contexts");
function createContext() {
    return new contexts_1.Context();
}
exports.createContext = createContext;
;
