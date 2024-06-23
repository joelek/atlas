import * as bedrock from "@joelek/bedrock";
export type Value = Uint8Array | bigint | boolean | null | number | string;
export type Record = {
    [key: string]: Value;
};
export type Key<A> = keyof A & string;
export type Keys<A> = Array<Key<A>>;
export type RequiredKey<A> = Key<A> & {
    [B in keyof A]: null extends A[B] ? never : B;
}[keyof A];
export type RequiredKeys<A> = Array<RequiredKey<A>>;
export type KeysRecord<A extends Record, B extends Keys<A>> = A | Pick<A, B[number]>;
export type KeysRecordMap<A extends Record, B extends Keys<A>, C extends Record> = {
    [D in B[number]]: {
        [E in keyof C]: A[D] extends C[E] ? E : never;
    }[keyof C];
};
export type MetadataKeysRecordMap<A extends Record, B extends Keys<A>, C extends Record, D extends Keys<C>> = {
    [E in Keys<A>[number]]?: {
        [F in Exclude<keyof C, D[number]>]: A[E] extends C[F] ? F : never;
    }[Exclude<keyof C, D[number]>];
};
export declare abstract class Field<A extends Value> {
    protected codec: bedrock.codecs.Codec<A>;
    protected defaultValue: A;
    protected unique?: boolean;
    protected searchable?: boolean;
    constructor(codec: bedrock.codecs.Codec<A>, defaultValue: A, unique?: boolean, searchable?: boolean);
    getCodec(): bedrock.codecs.Codec<A>;
    getDefaultValue(): A;
    getUnique(): boolean | undefined;
    getSearchable(): boolean | undefined;
}
export type Fields<A extends Record> = {
    [B in keyof A]: Field<A[B]>;
};
export declare class BigIntField extends Field<bigint> {
    constructor(defaultValue: bigint, unique?: boolean);
}
export declare class NullableBigIntField extends Field<bigint | null> {
    constructor(defaultValue: bigint | null, unique?: boolean);
}
export declare class BinaryField extends Field<Uint8Array> {
    constructor(defaultValue: Uint8Array, unique?: boolean);
}
export declare class NullableBinaryField extends Field<Uint8Array | null> {
    constructor(defaultValue: Uint8Array | null, unique?: boolean);
}
export declare class BooleanField extends Field<boolean> {
    constructor(defaultValue: boolean, unique?: boolean);
}
export declare class NullableBooleanField extends Field<boolean | null> {
    constructor(defaultValue: boolean | null, unique?: boolean);
}
export declare class IntegerField extends Field<number> {
    constructor(defaultValue: number, unique?: boolean);
}
export declare class NullableIntegerField extends Field<number | null> {
    constructor(defaultValue: number | null, unique?: boolean);
}
export declare class NumberField extends Field<number> {
    constructor(defaultValue: number, unique?: boolean);
}
export declare class NullableNumberField extends Field<number | null> {
    constructor(defaultValue: number | null, unique?: boolean);
}
export declare class StringField extends Field<string> {
    constructor(defaultValue: string, unique?: boolean, searchable?: boolean);
}
export declare class NullableStringField extends Field<string | null> {
    constructor(defaultValue: string | null, unique?: boolean, searchable?: boolean);
}
export declare class RecordManager<A extends Record> {
    private fields;
    private tupleKeys;
    private tupleCodec;
    constructor(fields: Fields<A>);
    decode(buffer: Uint8Array): A;
    encode(record: A): Uint8Array;
    decodeKeys<B extends Keys<A>>(keys: [...B], buffers: Array<Uint8Array>): Pick<A, B[number]>;
    encodeKeys<B extends Keys<A>>(keys: [...B], record: Pick<A, B[number]>): Array<Uint8Array>;
}
