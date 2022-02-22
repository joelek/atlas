export declare class BigintAssert {
    private constructor();
    static atLeast(min: bigint, value: bigint): bigint;
    static atMost(max: bigint, value: bigint): bigint;
    static between(min: bigint, value: bigint, max: bigint): bigint;
    static exactly(value: bigint, expected: bigint): bigint;
}
