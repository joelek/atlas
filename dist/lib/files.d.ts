import { Chunk, Readable } from "./chunks";
export declare abstract class File {
    constructor();
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
export declare class LogHeader extends Chunk {
    constructor(buffer?: Uint8Array);
    identifier(value?: string): string;
    redoSize(value?: number): number;
    undoSize(value?: number): number;
    read(readable: Readable, offset: number): void;
    static readonly IDENTIFIER = "atlaslog";
    static readonly LENGTH = 32;
}
export declare class LogDeltaHeader extends Chunk {
    constructor(buffer?: Uint8Array);
    offset(value?: number): number;
    length(value?: number): number;
    static readonly LENGTH = 16;
}
export type LogDelta = {
    header: LogDeltaHeader;
    redo: Uint8Array;
    undo: Uint8Array;
};
export declare class PagedDurableFile extends File {
    private bin;
    private log;
    private header;
    private pageSizeLog2;
    private pageSize;
    private logOffsets;
    private readRedo;
    private writeRedo;
    private readDelta;
    private writeDelta;
    private appendRedo;
    private redo;
    private undo;
    constructor(bin: File, log: File, pageSizeLog2: number);
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
export declare class PagedFile extends File {
    private file;
    private pageSizeLog2;
    private pageSize;
    private cache;
    constructor(file: File, pageSizeLog2: number, maxPageCount?: number);
    discard(): void;
    persist(): void;
    read(buffer: Uint8Array, offset: number): Uint8Array;
    resize(size: number): void;
    size(): number;
    write(buffer: Uint8Array, offset: number): Uint8Array;
}
export declare class PhysicalFile extends File {
    private fd;
    private currentSize;
    constructor(filename: string, clear?: boolean);
    discard(): void;
    hint(): {
        pageSizeLog2: number;
    };
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
