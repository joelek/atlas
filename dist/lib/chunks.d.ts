export interface Readable {
    read(buffer: Uint8Array, offset: number): Uint8Array;
}
export interface Writable {
    write(buffer: Uint8Array, offset: number): Uint8Array;
}
export declare abstract class Chunk {
    protected buffer: Uint8Array;
    constructor(buffer: Uint8Array);
    read(readable: Readable, offset: number): void;
    write(writable: Writable, offset: number): void;
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
export declare enum BlockFlags {
    APPLICATION_0 = 0,
    APPLICATION_1 = 1,
    APPLICATION_2 = 2,
    APPLICATION_3 = 3,
    RESERVED_4 = 4,
    RESERVED_5 = 5,
    RESERVED_6 = 6,
    DELETED = 7
}
export declare class BlockHeader extends Chunk {
    constructor(buffer?: Uint8Array);
    flag(bit: number, value?: boolean): boolean;
    flags(value?: number): number;
    category(value?: number): number;
    offset(value?: number): number;
    length(value?: number): number;
    static getCategory(minLength: number): number;
    static getLength(cateogry: number): number;
    static readonly LENGTH = 8;
}
export declare class BlockReference extends Chunk {
    constructor(buffer?: Uint8Array);
    metadata(value?: number): number;
    value(value?: number): number;
    static readonly LENGTH = 8;
}
export declare class BinHeader extends Chunk {
    readonly table: BlockHeader;
    readonly count: BlockReference;
    readonly pools: Array<BlockHeader>;
    constructor(buffer?: Uint8Array);
    identifier(value?: string): string;
    read(readable: Readable, offset: number): void;
    static readonly IDENTIFIER = "atlasbin";
    static readonly LENGTH: number;
}
