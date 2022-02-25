import * as bedrock from "@joelek/bedrock";
import * as keys from "./keys";
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
    protected codec: bedrock.codecs.Codec<A>;
    protected defaultValue: A;
    constructor(codec: bedrock.codecs.Codec<A>, defaultValue: A);
    getCodec(): bedrock.codecs.Codec<A>;
}
export declare type FieldManagers<A extends Record> = {
    [B in keyof A]: FieldManager<A[B]>;
};
export declare abstract class Field<A extends Value> {
    defaultValue: A;
    constructor(defaultValue: A);
    abstract createManager(): FieldManager<A>;
}
export declare type Fields<A extends Record> = {
    [B in keyof A]: Field<A[B]>;
};
export declare class BigIntFieldManager extends FieldManager<bigint> {
    constructor(defaultValue: bigint);
}
export declare class BigIntField extends Field<bigint> {
    constructor(defaultValue: bigint);
    createManager(): FieldManager<bigint>;
}
export declare class BinaryFieldManager extends FieldManager<Uint8Array> {
    constructor(defaultValue: Uint8Array);
}
export declare class BinaryField extends Field<Uint8Array> {
    constructor(defaultValue: Uint8Array);
    createManager(): FieldManager<Uint8Array>;
}
export declare class IntegerFieldManager extends FieldManager<number> {
    constructor(defaultValue: number);
}
export declare class IntegerField extends Field<number> {
    constructor(defaultValue: number);
    createManager(): FieldManager<number>;
}
export declare class StringFieldManager extends FieldManager<string> {
    constructor(defaultValue: string);
}
export declare class StringField extends Field<string> {
    constructor(defaultValue: string);
    createManager(): FieldManager<string>;
}
export declare class NullableStringFieldManager extends FieldManager<string | null> {
    constructor(defaultValue: string | null);
}
export declare class NullableStringField extends Field<string | null> {
    constructor(defaultValue: string | null);
    createManager(): FieldManager<string | null>;
}
export declare class NumberFieldManager extends FieldManager<number> {
    constructor(defaultValue: number);
}
export declare class NumberField extends Field<number> {
    constructor(defaultValue: number);
    createManager(): FieldManager<number>;
}
export declare class BooleanFieldManager extends FieldManager<boolean> {
    constructor(defaultValue: boolean);
}
export declare class BooleanField extends Field<boolean> {
    constructor(defaultValue: boolean);
    createManager(): FieldManager<boolean>;
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
