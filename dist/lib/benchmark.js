"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.benchmark = void 0;
async function benchmark(subject, times = 1) {
    let start = process.hrtime.bigint();
    let result = await subject();
    for (let i = 1; i < times; i++) {
        await subject();
    }
    let duration_ms = (Number(process.hrtime.bigint() - start) / 1000 / 1000 / times);
    let ops_per_sec = 1000 / duration_ms;
    console.log(`${duration_ms.toFixed(6)} ms, ${ops_per_sec.toFixed(0)} ops/s`);
    return result;
}
exports.benchmark = benchmark;
;
