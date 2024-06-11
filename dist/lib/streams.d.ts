type FlattenType<A> = A extends Iterable<infer B> ? B : A;
export declare class StreamIterable<A> {
    private values;
    private constructor();
    [Symbol.iterator](): Iterator<A>;
    collect(): Array<A>;
    filter(predicate: (value: A, index: number) => boolean): StreamIterable<A>;
    find(predicate: (value: A, index: number) => boolean): A | undefined;
    flatten(): StreamIterable<FlattenType<A>>;
    include<B extends A>(predicate: (value: A, index: number) => value is B): StreamIterable<B>;
    includes(predicate: (value: A, index: number) => boolean): boolean;
    limit(length: number): StreamIterable<A>;
    map<B>(transform: (value: A, index: number) => B): StreamIterable<B>;
    peek(): A | undefined;
    shift(): A | undefined;
    slice(start?: number, end?: number): StreamIterable<A>;
    sort(comparator?: (one: A, two: A) => number): StreamIterable<A>;
    unique(): StreamIterable<A>;
    static of<A>(values: Iterable<A> | undefined): StreamIterable<A>;
}
export {};
