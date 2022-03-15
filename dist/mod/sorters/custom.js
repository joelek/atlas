"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomSorter = void 0;
exports.CustomSorter = {
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
            return (t ? 1 : 0) - (o ? 1 : 0);
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
            return (o ? 1 : 0) - (t ? 1 : 0);
        };
    }
};
