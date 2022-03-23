export declare const Assert: {
    false(condition: boolean): void;
    true(condition: boolean): void;
    throws(cb: () => Promise<void>): Promise<void>;
    array: {
        equals<A>(one: A[], two: A[], message?: string): void;
    };
    binary: {
        equals(one: Uint8Array, two: Uint8Array, message?: string): void;
    };
    record: {
        equals(one: Record<string, any>, two: Record<string, any>, message?: string): void;
    };
};
export declare function test(name: string, cb: (assert: typeof Assert) => Promise<any>): void;
export declare function benchmark<A>(subject: (() => A) | (() => Promise<A>)): Promise<number>;
