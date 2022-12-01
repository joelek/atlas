export type Encoding = "hex" | "base64" | "base64url" | "binary" | "utf-8";
export type Endian = "big" | "little";
export declare class Binary {
    private constructor();
    static string(buffer: Uint8Array, offset: number, length: number, encoding: Encoding, value?: string): string;
    static boolean(buffer: Uint8Array, offset: number, bit: number, value?: boolean): boolean;
    static signed(buffer: Uint8Array, offset: number, length: number, value?: number, endian?: Endian): number;
    static unsigned(buffer: Uint8Array, offset: number, length: number, value?: number, endian?: Endian): number;
}
export declare class PromiseQueue {
    private lock;
    private open;
    constructor();
    close(): void;
    enqueue<A>(operation: Promise<A> | (() => Promise<A>) | (() => A)): Promise<A>;
}
export declare class Tokenizer {
    private constructor();
    static tokenize(value: string, maxTokenCount?: number): Array<string>;
}
export interface SeekableIterable<A> extends Iterable<A> {
    next(): A | undefined;
    seek(value: A | undefined): A | undefined;
}
export type Collator<A> = (one: A, two: A) => number;
export declare function makeSeekableIterable<A>(source: Iterable<A>, collator: Collator<A>): SeekableIterable<A>;
export declare function intersection<A>(iterables: Iterable<SeekableIterable<A>>, collator: Collator<A>): SeekableIterable<A>;
export declare function union<A>(iterables: Iterable<SeekableIterable<A>>, collator: Collator<A>): SeekableIterable<A>;
