"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompositeSorter = void 0;
exports.CompositeSorter = {
    of(...rankers) {
        return (one, two) => {
            for (let ranker of rankers) {
                let rank = ranker(one, two);
                if (rank !== 0) {
                    return rank;
                }
            }
            return 0;
        };
    }
};
