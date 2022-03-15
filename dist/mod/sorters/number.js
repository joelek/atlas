"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NumberSorter = void 0;
exports.NumberSorter = {
    decreasing(getField) {
        return (one, two) => {
            let o = getField(one);
            let t = getField(two);
            if (o == null) {
                if (t == null) {
                    return 0;
                }
                else {
                    return -1;
                }
            }
            if (t == null) {
                if (o == null) {
                    return 0;
                }
                else {
                    return 1;
                }
            }
            return t - o;
        };
    },
    increasing(getField) {
        return (one, two) => {
            let o = getField(one);
            let t = getField(two);
            if (o == null) {
                if (t == null) {
                    return 0;
                }
                else {
                    return 1;
                }
            }
            if (t == null) {
                if (o == null) {
                    return 0;
                }
                else {
                    return -1;
                }
            }
            return o - t;
        };
    }
};
