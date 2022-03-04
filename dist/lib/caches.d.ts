export declare type Primitive = boolean | null | number | string | undefined;
export interface CacheDetail<A, B> {
    getWeightForValue(value: B): number;
    onInsert?(key: A, value: B): void;
    onRemove?(key: A): void;
}
export declare type CacheStatus = {
    weight: number;
    maxWeight?: number;
};
export declare class Cache<A extends Primitive, B> {
    private detail;
    private map;
    private status;
    private purgeIfNecessary;
    constructor(detail?: CacheDetail<A, B>, maxWeight?: number);
    [Symbol.iterator](): Iterator<[A, B]>;
    clear(): void;
    insert(key: A, value: B): void;
    length(): number;
    lookup(key: A): B | undefined;
    remove(key: A): B | undefined;
}
