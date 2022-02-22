export declare abstract class File {
    constructor();
    clear(): void;
    abstract discard(): void;
    abstract persist(): void;
    abstract read(buffer: Uint8Array, offset: number): Uint8Array;
    abstract resize(size: number): void;
    abstract size(): number;
    abstract write(buffer: Uint8Array, offset: number): Uint8Array;
}
export declare class CachedFile extends File {
    private file;
    private tree;
    private cache;
    constructor(file: File, maxWeight?: number);
    discard(): void;
    persist(): void;
    read(buffer: Uint8Array, offset: number): Uint8Array;
    resize(size: number): void;
    size(): number;
    write(buffer: Uint8Array, offset: number): Uint8Array;
}
export declare class DurableFile extends File {
    private bin;
    private log;
    private header;
    private tree;
    private readDelta;
    private writeDelta;
    private appendRedo;
    private redo;
    private undo;
    constructor(bin: File, log: File);
    discard(): void;
    persist(): void;
    read(buffer: Uint8Array, offset: number): Uint8Array;
    resize(size: number): void;
    size(): number;
    write(buffer: Uint8Array, offset: number): Uint8Array;
}
export declare class PhysicalFile extends File {
    private fd;
    constructor(filename: string, clear?: boolean);
    discard(): void;
    persist(): void;
    read(buffer: Uint8Array, offset: number): Uint8Array;
    resize(size: number): void;
    size(): number;
    write(buffer: Uint8Array, offset: number): Uint8Array;
}
export declare class VirtualFile extends File {
    private backup;
    private buffer;
    constructor(size: number);
    discard(): void;
    persist(): void;
    read(buffer: Uint8Array, offset: number): Uint8Array;
    resize(size: number): void;
    size(): number;
    write(buffer: Uint8Array, offset: number): Uint8Array;
}
