import * as bedrock from "@joelek/bedrock";
import * as keys from "./keys";

export type Value = Uint8Array | bigint | boolean | null | number | string;
export type Record = { [key: string]: Value; };
export type Key<A> = keyof A & string;
export type Keys<A> = Array<Key<A>>;
export type RequiredKey<A> = Key<A> & {
	[B in keyof A]: null extends A[B] ? never : B;
}[keyof A];
export type RequiredKeys<A> = Array<RequiredKey<A>>;
export type KeysRecord<A extends Record, B extends RequiredKeys<A>> = A | Pick<A, B[number]>;
export type KeysRecordMap<A extends Record, B extends RequiredKeys<A>, C extends Record> = {
	[D in B[number]]: {
		[E in keyof C]: A[D] extends C[E] ? E : never;
	}[keyof C];
};














export abstract class FieldManager<A extends Value> {
	protected codec: bedrock.codecs.Codec<A>;
	protected defaultValue: A;

	constructor(codec: bedrock.codecs.Codec<A>, defaultValue: A) {
		this.codec = codec;
		this.defaultValue = defaultValue;
	}

	getCodec(): bedrock.codecs.Codec<A> {
		return this.codec;
	}
};

export type FieldManagers<A extends Record> = {
	[B in keyof A]: FieldManager<A[B]>;
};

export abstract class Field<A extends Value> {
	defaultValue: A;

	constructor(defaultValue: A) {
		this.defaultValue = defaultValue;
	}

	abstract createManager(): FieldManager<A>;
};

export type Fields<A extends Record> = {
	[B in keyof A]: Field<A[B]>;
};





























export class BinaryFieldManager extends FieldManager<Uint8Array> {
	constructor(defaultValue: Uint8Array) {
		super(bedrock.codecs.Binary, defaultValue);
	}
};

export class BinaryField extends Field<Uint8Array> {
	constructor(defaultValue: Uint8Array) {
		super(defaultValue);
	}

	createManager(): FieldManager<Uint8Array> {
		return new BinaryFieldManager(this.defaultValue);
	}
};































export class StringFieldManager extends FieldManager<string> {
	constructor(defaultValue: string) {
		super(bedrock.codecs.String, defaultValue);
	}
};

export class StringField extends Field<string> {
	constructor(defaultValue: string) {
		super(defaultValue);
	}

	createManager(): FieldManager<string> {
		return new StringFieldManager(this.defaultValue);
	}
};














export class NullableStringFieldManager extends FieldManager<string | null> {
	constructor(defaultValue: string | null) {
		super(bedrock.codecs.Union.of(
			bedrock.codecs.String,
			bedrock.codecs.Null
		), defaultValue);
	}
};

export class NullableStringField extends Field<string | null> {
	constructor(defaultValue: string | null) {
		super(defaultValue);
	}

	createManager(): FieldManager<string | null> {
		return new NullableStringFieldManager(this.defaultValue);
	}
};












export class BooleanFieldManager extends FieldManager<boolean> {
	constructor(defaultValue: boolean) {
		super(bedrock.codecs.Boolean, defaultValue);
	}
};

export class BooleanField extends Field<boolean> {
	constructor(defaultValue: boolean) {
		super(defaultValue);
	}

	createManager(): FieldManager<boolean> {
		return new BooleanFieldManager(this.defaultValue);
	}
};


















export class RecordManager<A extends Record> {
	private fieldManagers: FieldManagers<A>;
	private tupleKeys: Keys<A>;
	private tupleCodec: bedrock.codecs.TupleCodec<Array<A[Key<A>]>>;

	constructor(fieldManagers: FieldManagers<A>) {
		this.fieldManagers = fieldManagers;
		this.tupleKeys = Object.keys(fieldManagers).sort();
		this.tupleCodec = bedrock.codecs.Tuple.of(...this.tupleKeys.map((key) => fieldManagers[key].getCodec()));
	}

	decode(buffer: Uint8Array): A {
		let values = this.tupleCodec.decode(buffer);
		let record = {} as A;
		for (let [index, key] of this.tupleKeys.entries()) {
			record[key] = values[index];
		}
		return record;
	}

	encode(record: A): Uint8Array {
		let values = this.tupleKeys.map((key) => record[key]);
		let buffer = this.tupleCodec.encode(values);
		return buffer;
	}

	decodeKeys<B extends Keys<A>>(keys: [...B], buffers: keys.Chunks): Pick<A, B[number]> {
		let record = {} as Pick<A, B[number]>;
		for (let [index, key] of keys.entries()) {
			record[key] = this.fieldManagers[key].getCodec().decodePayload(buffers[index]);
		}
		return record;
	}

	encodeKeys<B extends Keys<A>>(keys: [...B], record: Pick<A, B[number]>): keys.Chunks {
		let buffers = keys.map((key) => this.fieldManagers[key].getCodec().encodePayload(record[key]));
		return buffers;
	}
};
