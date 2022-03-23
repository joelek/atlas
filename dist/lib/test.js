"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.benchmark = exports.test = exports.Assert = void 0;
exports.Assert = {
    false(condition) {
        if (condition) {
            throw ``;
        }
    },
    true(condition) {
        if (!condition) {
            throw ``;
        }
    },
    async throws(cb) {
        try {
            await cb();
        }
        catch (error) {
            return;
        }
        throw `Expected to throw!`;
    },
    array: {
        equals(one, two, message = "") {
            if (one.length !== two.length) {
                throw message;
            }
            for (let i = 0; i < one.length; i++) {
                if (one[i] !== two[i]) {
                    throw message;
                }
            }
        }
    },
    binary: {
        equals(one, two, message = "") {
            if (one.length !== two.length) {
                throw message;
            }
            for (let i = 0; i < one.length; i++) {
                if (one[i] !== two[i]) {
                    throw message;
                }
            }
        }
    },
    record: {
        equals(one, two, message = "") {
            for (let key in one) {
                if (!(key in two)) {
                    throw message;
                }
            }
            for (let key in two) {
                if (!(key in one)) {
                    throw message;
                }
            }
            for (let key in one) {
                if (one[key] !== two[key]) {
                    throw message;
                }
            }
        }
    }
};
function test(name, cb) {
    cb(exports.Assert).catch((error) => {
        console.log(name);
        console.log(error);
    });
}
exports.test = test;
;
async function benchmark(subject) {
    let start = process.hrtime.bigint();
    let times = 0;
    while (true) {
        await subject();
        times += 1;
        let duration = Number(process.hrtime.bigint() - start) / 1000 / 1000;
        if (duration >= 1000) {
            break;
        }
    }
    let averageDuration = (Number(process.hrtime.bigint() - start) / 1000 / 1000 / times);
    return averageDuration;
}
exports.benchmark = benchmark;
;
