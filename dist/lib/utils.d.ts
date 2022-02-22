export declare type Encoding = "hex" | "base64" | "base64url" | "binary" | "utf-8";
export declare type Endian = "big" | "little";
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
