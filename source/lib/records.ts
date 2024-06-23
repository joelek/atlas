import * as bedrock from "@joelek/bedrock";

export type Value = Uint8Array | bigint | boolean | null | number | string;
export type Record = { [key: string]: Value; };
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

export abstract class Field<A extends Value> {
	protected codec: bedrock.codecs.Codec<A>;
	protected defaultValue: A;
	protected unique?: boolean;
	protected searchable?: boolean;

	constructor(codec: bedrock.codecs.Codec<A>, defaultValue: A, unique?: boolean, searchable?: boolean) {
		this.codec = codec;
		this.defaultValue = defaultValue;
		this.unique = unique;
		this.searchable = searchable;
	}

	getCodec(): bedrock.codecs.Codec<A> {
		return this.codec;
	}

	getDefaultValue(): A {
		return this.defaultValue;
	}

	getUnique(): boolean | undefined {
		return this.unique;
	}

	getSearchable(): boolean | undefined {
		return this.searchable;
	}
};

export type Fields<A extends Record> = {
	[B in keyof A]: Field<A[B]>;
};

export class BigIntField extends Field<bigint> {
	constructor(defaultValue: bigint, unique?: boolean) {
		super(bedrock.codecs.BigInt, defaultValue, unique);
	}
};

export class NullableBigIntField extends Field<bigint | null> {
	constructor(defaultValue: bigint | null, unique?: boolean) {
		super(bedrock.codecs.Union.of<[bigint, null]>(
			bedrock.codecs.BigInt,
			bedrock.codecs.Null
		), defaultValue, unique);
	}
};

export class BinaryField extends Field<Uint8Array> {
	constructor(defaultValue: Uint8Array, unique?: boolean) {
		super(bedrock.codecs.Binary, defaultValue, unique);
	}
};

export class NullableBinaryField extends Field<Uint8Array | null> {
	constructor(defaultValue: Uint8Array | null, unique?: boolean) {
		super(bedrock.codecs.Union.of<[Uint8Array, null]>(
			bedrock.codecs.Binary,
			bedrock.codecs.Null
		), defaultValue, unique);
	}
};

export class BooleanField extends Field<boolean> {
	constructor(defaultValue: boolean, unique?: boolean) {
		super(bedrock.codecs.Boolean, defaultValue);
	}
};

export class NullableBooleanField extends Field<boolean | null> {
	constructor(defaultValue: boolean | null, unique?: boolean) {
		super(bedrock.codecs.Union.of<[boolean, null]>(
			bedrock.codecs.Boolean,
			bedrock.codecs.Null
		), defaultValue, unique);
	}
};

export class IntegerField extends Field<number> {
	constructor(defaultValue: number, unique?: boolean) {
		super(bedrock.codecs.Integer, defaultValue, unique);
	}
};

export class NullableIntegerField extends Field<number | null> {
	constructor(defaultValue: number | null, unique?: boolean) {
		super(bedrock.codecs.Union.of<[number, null]>(
			bedrock.codecs.Integer,
			bedrock.codecs.Null
		), defaultValue, unique);
	}
};

export class NumberField extends Field<number> {
	constructor(defaultValue: number, unique?: boolean) {
		super(bedrock.codecs.Number, defaultValue, unique);
	}
};

export class NullableNumberField extends Field<number | null> {
	constructor(defaultValue: number | null, unique?: boolean) {
		super(bedrock.codecs.Union.of<[number, null]>(
			bedrock.codecs.Number,
			bedrock.codecs.Null
		), defaultValue, unique);
	}
};

export class StringField extends Field<string> {
	constructor(defaultValue: string, unique?: boolean, searchable?: boolean) {
		super(bedrock.codecs.String, defaultValue, unique, searchable);
	}
};

export class NullableStringField extends Field<string | null> {
	constructor(defaultValue: string | null, unique?: boolean, searchable?: boolean) {
		super(bedrock.codecs.Union.of<[string, null]>(
			bedrock.codecs.String,
			bedrock.codecs.Null
		), defaultValue, unique, searchable);
	}
};

export class RecordManager<A extends Record> {
	private fields: Fields<A>;
	private tupleKeys: Keys<A>;
	private tupleCodec: bedrock.codecs.TupleCodec<Array<A[Key<A>]>>;

	constructor(fields: Fields<A>) {
		this.fields = fields;
		this.tupleKeys = Object.keys(fields).sort();
		this.tupleCodec = bedrock.codecs.Tuple.of<Array<A[Key<A>]>>(...this.tupleKeys.map((key) => fields[key].getCodec()));
	}

	decode(buffer: Uint8Array): A {
		let values = this.tupleCodec.decode(buffer, "record");
		let record = {} as A;
		for (let [index, key] of this.tupleKeys.entries()) {
			record[key] = values[index];
		}
		return record;
	}

	encode(record: A): Uint8Array {
		let values = this.tupleKeys.map((key) => record[key]);
		let buffer = this.tupleCodec.encode(values, "record");
		return buffer;
	}

	decodeKeys<B extends Keys<A>>(keys: [...B], buffers: Array<Uint8Array>): Pick<A, B[number]> {
		let record = {} as Pick<A, B[number]>;
		for (let [index, key] of keys.entries()) {
			record[key] = this.fields[key].getCodec().decodePayload(buffers[index]);
		}
		return record;
	}

	encodeKeys<B extends Keys<A>>(keys: [...B], record: Pick<A, B[number]>): Array<Uint8Array> {
		let buffers = keys.map((key) => this.fields[key].getCodec().encodePayload(record[key]));
		return buffers;
	}
};
