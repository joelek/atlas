import * as bedrock from "@joelek/bedrock";
import * as keys from "./keys";
import { BlockHandler } from "./vfs";

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
	protected blockHandler: BlockHandler;
	protected bid: number;
	protected codec: bedrock.codecs.Codec<A>;
	protected defaultValue: A;

	constructor(blockHandler: BlockHandler, bid: number, codec: bedrock.codecs.Codec<A>, defaultValue: A) {
		this.blockHandler = blockHandler;
		this.bid = bid;
		this.codec = codec;
		this.defaultValue = defaultValue;
	}

	delete(): void {
		this.blockHandler.deleteBlock(this.bid);
	}

	getBid(): number {
		return this.bid;
	}

	getCodec(): bedrock.codecs.Codec<A> {
		return this.codec;
	}

	static construct(blockHandler: BlockHandler, bid: number): FieldManager<any> {
		try {
			return BinaryFieldManager.construct(blockHandler, bid);
		} catch (error) {}
		try {
			return BooleanFieldManager.construct(blockHandler, bid);
		} catch (error) {}
		try {
			return StringFieldManager.construct(blockHandler, bid);
		} catch (error) {}
		throw `Expected to construct a field manager!`;
	}
};

export type FieldManagers<A extends Record> = {
	[B in keyof A]: FieldManager<A[B]>;
};

export abstract class Field<A extends Value> {
	protected defaultValue: A;

	constructor(defaultValue: A) {
		this.defaultValue = defaultValue;
	}

	abstract convertValue(value: Value | undefined): A;
	abstract createManager(blockHandler: BlockHandler, bid: number | null): FieldManager<A>;
	abstract isCompatibleWith(that: FieldManager<any>): boolean;
};

export type Fields<A extends Record> = {
	[B in keyof A]: Field<A[B]>;
};





























export const BinaryFieldSchema = bedrock.codecs.Object.of({
	type: bedrock.codecs.StringLiteral.of("binary"),
	defaultValue: bedrock.codecs.Binary
});

export type BinaryFieldSchema = ReturnType<typeof BinaryFieldSchema["decode"]>;

export class BinaryFieldManager extends FieldManager<Uint8Array> {
	constructor(blockHandler: BlockHandler, bid: number, defaultValue: Uint8Array) {
		super(blockHandler, bid, bedrock.codecs.Binary, defaultValue);
	}

	static construct(blockHandler: BlockHandler, bid: number | null, schema?: BinaryFieldSchema): BinaryFieldManager {
		if (bid == null) {
			schema = schema ?? {
				type: "binary",
				defaultValue: Uint8Array.of()
			};
			let buffer = BinaryFieldSchema.encode(schema);
			bid = blockHandler.createBlock(buffer.length);
			blockHandler.writeBlock(bid, buffer);
		} else {
			if (schema == null) {
				schema = BinaryFieldSchema.decode(blockHandler.readBlock(bid));
			} else {
				let buffer = BinaryFieldSchema.encode(schema);
				blockHandler.resizeBlock(bid, buffer.length);
				blockHandler.writeBlock(bid, buffer);
			}
		}
		let defaultValue = schema.defaultValue;
		return new BinaryFieldManager(blockHandler, bid, defaultValue);
	}
};

export class BinaryField extends Field<Uint8Array> {
	constructor(defaultValue: Uint8Array) {
		super(defaultValue);
	}

	convertValue(value: Value | undefined): Uint8Array {
		if (value instanceof Uint8Array) {
			return value;
		}
		return this.defaultValue;
	}

	createManager(blockHandler: BlockHandler, bid: number | null): FieldManager<Uint8Array> {
		return BinaryFieldManager.construct(blockHandler, bid, {
			type: "binary",
			defaultValue: this.defaultValue
		});
	}

	isCompatibleWith(that: FieldManager<any>): boolean {
		if (that instanceof BinaryFieldManager) {
			return true;
		}
		return false;
	}
};































export const StringFieldSchema = bedrock.codecs.Object.of({
	type: bedrock.codecs.StringLiteral.of("string"),
	defaultValue: bedrock.codecs.String
});

export type StringFieldSchema = ReturnType<typeof StringFieldSchema["decode"]>;

export class StringFieldManager extends FieldManager<string> {
	constructor(blockHandler: BlockHandler, bid: number, defaultValue: string) {
		super(blockHandler, bid, bedrock.codecs.String, defaultValue);
	}

	static construct(blockHandler: BlockHandler, bid: number | null, schema?: StringFieldSchema): StringFieldManager {
		if (bid == null) {
			schema = schema ?? {
				type: "string",
				defaultValue: ""
			};
			let buffer = StringFieldSchema.encode(schema);
			bid = blockHandler.createBlock(buffer.length);
			blockHandler.writeBlock(bid, buffer);
		} else {
			if (schema == null) {
				schema = StringFieldSchema.decode(blockHandler.readBlock(bid));
			} else {
				let buffer = StringFieldSchema.encode(schema);
				blockHandler.resizeBlock(bid, buffer.length);
				blockHandler.writeBlock(bid, buffer);
			}
		}
		let defaultValue = schema.defaultValue;
		return new StringFieldManager(blockHandler, bid, defaultValue);
	}
};

export class StringField extends Field<string> {
	constructor(defaultValue: string) {
		super(defaultValue);
	}

	convertValue(value: Value | undefined): string {
		if (typeof value === "string") {
			return value;
		}
		return this.defaultValue;
	}

	createManager(blockHandler: BlockHandler, bid: number | null): FieldManager<string> {
		return StringFieldManager.construct(blockHandler, bid, {
			type: "string",
			defaultValue: this.defaultValue
		});
	}

	isCompatibleWith(that: FieldManager<any>): boolean {
		if (that instanceof StringFieldManager) {
			return true;
		}
		return false;
	}
};















export const NullableStringFieldSchema = bedrock.codecs.Object.of({
	type: bedrock.codecs.StringLiteral.of("nullable_string"),
	defaultValue: bedrock.codecs.Union.of(
		bedrock.codecs.String,
		bedrock.codecs.Null
	)
});

export type NullableStringFieldSchema = ReturnType<typeof NullableStringFieldSchema["decode"]>;

export class NullableStringFieldManager extends FieldManager<string | null> {
	constructor(blockHandler: BlockHandler, bid: number, defaultValue: string | null) {
		super(blockHandler, bid, bedrock.codecs.Union.of(
			bedrock.codecs.String,
			bedrock.codecs.Null
		), defaultValue);
	}

	static construct(blockHandler: BlockHandler, bid: number | null, schema?: NullableStringFieldSchema): NullableStringFieldManager {
		if (bid == null) {
			schema = schema ?? {
				type: "nullable_string",
				defaultValue: null
			};
			let buffer = NullableStringFieldSchema.encode(schema);
			bid = blockHandler.createBlock(buffer.length);
			blockHandler.writeBlock(bid, buffer);
		} else {
			if (schema == null) {
				schema = NullableStringFieldSchema.decode(blockHandler.readBlock(bid));
			} else {
				let buffer = NullableStringFieldSchema.encode(schema);
				blockHandler.resizeBlock(bid, buffer.length);
				blockHandler.writeBlock(bid, buffer);
			}
		}
		let defaultValue = schema.defaultValue;
		return new NullableStringFieldManager(blockHandler, bid, defaultValue);
	}
};

export class NullableStringField extends Field<string | null> {
	constructor(defaultValue: string | null) {
		super(defaultValue);
	}

	convertValue(value: Value | undefined): string | null {
		if (typeof value === "string" || value === null) {
			return value;
		}
		return this.defaultValue;
	}

	createManager(blockHandler: BlockHandler, bid: number | null): FieldManager<string | null> {
		return NullableStringFieldManager.construct(blockHandler, bid, {
			type: "nullable_string",
			defaultValue: this.defaultValue
		});
	}

	isCompatibleWith(that: FieldManager<any>): boolean {
		if (that instanceof StringFieldManager) {
			return true;
		}
		return false;
	}
};












export const BooleanFieldSchema = bedrock.codecs.Object.of({
	type: bedrock.codecs.StringLiteral.of("boolean"),
	defaultValue: bedrock.codecs.Boolean
});

export type BooleanFieldSchema = ReturnType<typeof BooleanFieldSchema["decode"]>;

export class BooleanFieldManager extends FieldManager<boolean> {
	constructor(blockHandler: BlockHandler, bid: number, defaultValue: boolean) {
		super(blockHandler, bid, bedrock.codecs.Boolean, defaultValue);
	}

	static construct(blockHandler: BlockHandler, bid: number | null, schema?: BooleanFieldSchema): BooleanFieldManager {
		if (bid == null) {
			schema = schema ?? {
				type: "boolean",
				defaultValue: false
			};
			let buffer = BooleanFieldSchema.encode(schema);
			bid = blockHandler.createBlock(buffer.length);
			blockHandler.writeBlock(bid, buffer);
		} else {
			if (schema == null) {
				schema = BooleanFieldSchema.decode(blockHandler.readBlock(bid));
			} else {
				let buffer = BooleanFieldSchema.encode(schema);
				blockHandler.resizeBlock(bid, buffer.length);
				blockHandler.writeBlock(bid, buffer);
			}
		}
		let defaultValue = schema.defaultValue;
		return new BooleanFieldManager(blockHandler, bid, defaultValue);
	}
};

export class BooleanField extends Field<boolean> {
	constructor(defaultValue: boolean) {
		super(defaultValue);
	}

	convertValue(value: Value | undefined): boolean {
		if (typeof value === "boolean") {
			return value;
		}
		return this.defaultValue;
	}

	createManager(blockHandler: BlockHandler, bid: number | null): FieldManager<boolean> {
		return BooleanFieldManager.construct(blockHandler, bid, {
			type: "boolean",
			defaultValue: this.defaultValue
		});
	}

	isCompatibleWith(that: FieldManager<any>): boolean {
		if (that instanceof BooleanFieldManager) {
			return true;
		}
		return false;
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
