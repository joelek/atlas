import * as bedrock from "@joelek/bedrock";
import * as keys from "./keys";
import { BlockHandler } from "./vfs";
export declare type Value = Uint8Array | bigint | boolean | null | number | string;
export declare type Record = {
    [key: string]: Value;
};
export declare type Key<A> = keyof A & string;
export declare type Keys<A> = Array<Key<A>>;
export declare type RequiredKey<A> = Key<A> & {
    [B in keyof A]: null extends A[B] ? never : B;
}[keyof A];
export declare type RequiredKeys<A> = Array<RequiredKey<A>>;
export declare type KeysRecord<A extends Record, B extends RequiredKeys<A>> = A | Pick<A, B[number]>;
export declare type KeysRecordMap<A extends Record, B extends RequiredKeys<A>, C extends Record> = {
    [D in B[number]]: {
        [E in keyof C]: A[D] extends C[E] ? E : never;
    }[keyof C];
};
export declare abstract class FieldManager<A extends Value> {
    protected blockHandler: BlockHandler;
    protected bid: number;
    protected codec: bedrock.codecs.Codec<A>;
    protected defaultValue: A;
    constructor(blockHandler: BlockHandler, bid: number, codec: bedrock.codecs.Codec<A>, defaultValue: A);
    delete(): void;
    getBid(): number;
    getCodec(): bedrock.codecs.Codec<A>;
    static construct(blockHandler: BlockHandler, bid: number): FieldManager<any>;
}
export declare type FieldManagers<A extends Record> = {
    [B in keyof A]: FieldManager<A[B]>;
};
export declare abstract class Field<A extends Value> {
    defaultValue: A;
    constructor(defaultValue: A);
    abstract convertValue(value: Value | undefined): A;
    abstract createManager(blockHandler: BlockHandler, bid: number | null): FieldManager<A>;
    abstract isCompatibleWith(that: FieldManager<any>): boolean;
}
export declare type Fields<A extends Record> = {
    [B in keyof A]: Field<A[B]>;
};
export declare const BinaryFieldSchema: bedrock.codecs.ObjectCodec<{
    type: "binary";
    defaultValue: Uint8Array;
}>;
export declare type BinaryFieldSchema = ReturnType<typeof BinaryFieldSchema["decode"]>;
export declare class BinaryFieldManager extends FieldManager<Uint8Array> {
    constructor(blockHandler: BlockHandler, bid: number, defaultValue: Uint8Array);
    static construct(blockHandler: BlockHandler, bid: number | null, schema?: BinaryFieldSchema): BinaryFieldManager;
}
export declare class BinaryField extends Field<Uint8Array> {
    constructor(defaultValue: Uint8Array);
    convertValue(value: Value | undefined): Uint8Array;
    createManager(blockHandler: BlockHandler, bid: number | null): FieldManager<Uint8Array>;
    isCompatibleWith(that: FieldManager<any>): boolean;
}
export declare const StringFieldSchema: bedrock.codecs.ObjectCodec<{
    type: "string";
    defaultValue: string;
}>;
export declare type StringFieldSchema = ReturnType<typeof StringFieldSchema["decode"]>;
export declare class StringFieldManager extends FieldManager<string> {
    constructor(blockHandler: BlockHandler, bid: number, defaultValue: string);
    static construct(blockHandler: BlockHandler, bid: number | null, schema?: StringFieldSchema): StringFieldManager;
}
export declare class StringField extends Field<string> {
    constructor(defaultValue: string);
    convertValue(value: Value | undefined): string;
    createManager(blockHandler: BlockHandler, bid: number | null): FieldManager<string>;
    isCompatibleWith(that: FieldManager<any>): boolean;
}
export declare const NullableStringFieldSchema: bedrock.codecs.ObjectCodec<{
    type: "nullable_string";
    defaultValue: string | null;
}>;
export declare type NullableStringFieldSchema = ReturnType<typeof NullableStringFieldSchema["decode"]>;
export declare class NullableStringFieldManager extends FieldManager<string | null> {
    constructor(blockHandler: BlockHandler, bid: number, defaultValue: string | null);
    static construct(blockHandler: BlockHandler, bid: number | null, schema?: NullableStringFieldSchema): NullableStringFieldManager;
}
export declare class NullableStringField extends Field<string | null> {
    constructor(defaultValue: string | null);
    convertValue(value: Value | undefined): string | null;
    createManager(blockHandler: BlockHandler, bid: number | null): FieldManager<string | null>;
    isCompatibleWith(that: FieldManager<any>): boolean;
}
export declare const BooleanFieldSchema: bedrock.codecs.ObjectCodec<{
    type: "boolean";
    defaultValue: boolean;
}>;
export declare type BooleanFieldSchema = ReturnType<typeof BooleanFieldSchema["decode"]>;
export declare class BooleanFieldManager extends FieldManager<boolean> {
    constructor(blockHandler: BlockHandler, bid: number, defaultValue: boolean);
    static construct(blockHandler: BlockHandler, bid: number | null, schema?: BooleanFieldSchema): BooleanFieldManager;
}
export declare class BooleanField extends Field<boolean> {
    constructor(defaultValue: boolean);
    convertValue(value: Value | undefined): boolean;
    createManager(blockHandler: BlockHandler, bid: number | null): FieldManager<boolean>;
    isCompatibleWith(that: FieldManager<any>): boolean;
}
export declare class RecordManager<A extends Record> {
    private fieldManagers;
    private tupleKeys;
    private tupleCodec;
    constructor(fieldManagers: FieldManagers<A>);
    decode(buffer: Uint8Array): A;
    encode(record: A): Uint8Array;
    decodeKeys<B extends Keys<A>>(keys: [...B], buffers: keys.Chunks): Pick<A, B[number]>;
    encodeKeys<B extends Keys<A>>(keys: [...B], record: Pick<A, B[number]>): keys.Chunks;
}
