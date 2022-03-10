export interface Readable {
    read(buffer: Uint8Array, offset: number): Uint8Array;
}
export interface Writable {
    write(buffer: Uint8Array, offset: number): Uint8Array;
}
export declare abstract class Chunk {
    readonly buffer: Uint8Array;
    constructor(buffer: Uint8Array);
    read(readable: Readable, offset: number): void;
    write(writable: Writable, offset: number): void;
}
