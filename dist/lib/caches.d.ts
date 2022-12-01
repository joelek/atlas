export type Primitive = boolean | null | number | string | undefined;
export interface CacheDetail<A, B> {
    getWeightForValue(value: B): number;
    onInsert?(key: A, value: B): void;
    onRemove?(key: A): void;
}
export type CacheStatus = {
    weight: number;
    maxWeight?: number;
};
export type CacheEntry<A extends Primitive, B> = {
    key: A;
    value: B;
};
export declare class Cache<B> {
    private detail;
    private map;
    private status;
    private purgeIfNecessary;
    constructor(detail?: CacheDetail<number, B>, maxWeight?: number);
    [Symbol.iterator](): Iterator<CacheEntry<number, B>>;
    clear(): void;
    insert(key: number, value: B): void;
    length(): number;
    lookup(key: number): B | undefined;
    remove(key: number): B | undefined;
}
