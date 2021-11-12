import * as bedrock from "@joelek/bedrock";
import * as keys from "./keys";
import { BlockHandler } from "./vfs";

export type Value = Uint8Array | bigint | boolean | null | number | string;
export type Record = { [key: string]: Value; };
export type Key<A> = keyof A & string;
export type Keys<A> = Array<Key<A>>;
export type KeysRecord<A extends Record, B extends Keys<A>> = A | Pick<A, B[number]>;
export type KeysRecordMap<A extends Record, B extends Keys<A>, C extends Record> = {
	[D in B[number]]: {
		[E in keyof C]: A[D] extends C[E] ? E : never;
	}[keyof C];
};














export abstract class FieldManager<A extends Value> {
	protected codec: bedrock.codecs.Codec<A>;

	constructor(codec: bedrock.codecs.Codec<A>) {
		this.codec = codec;
	}

	getCodec(): bedrock.codecs.Codec<A> {
		return this.codec;
	}
};

export type FieldManagers<A extends Record> = {
	[B in keyof A]: FieldManager<A[B]>;
};

export abstract class AllocatedField<A extends Value> {
	protected blockHandler: BlockHandler;
	protected bid: number;
	protected defaultValue: A;

	constructor(blockHandler: BlockHandler, bid: number, defaultValue: A) {
		this.blockHandler = blockHandler;
		this.bid = bid;
		this.defaultValue = defaultValue;
	}

	abstract createManager(): FieldManager<A>;

	deallocate(): void {
		this.blockHandler.deleteBlock(this.bid);
	}

	getBid(): number {
		return this.bid;
	}

	abstract migrateData(value: Value | undefined): A;

	abstract requiresDataMigration(that: AllocatedField<any>): boolean;

	static loadFromBid(blockHandler: BlockHandler, bid: number): AllocatedField<any> {
		try {
			return new AllocatedBinaryField(blockHandler, bid);
		} catch (error) {}
		try {
			return new AllocatedStringField(blockHandler, bid);
		} catch (error) {}
		throw `Expected to load an allocated field!`;
	}
};

export type AllocatedFields<A extends Record> = {
	[B in keyof A]: AllocatedField<A[B]>;
};

export abstract class Field<A extends Value> {
	constructor() {}

	abstract allocate(blockHandler: BlockHandler): AllocatedField<A>;
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
	constructor() {
		super(bedrock.codecs.Binary);
	}
};

export class AllocatedBinaryField extends AllocatedField<Uint8Array> {
	constructor(blockHandler: BlockHandler, bid: number) {
		let schema = BinaryFieldSchema.decode(blockHandler.readBlock(bid));
		super(blockHandler, bid, schema.defaultValue);
	}

	createManager(): FieldManager<Uint8Array> {
		return new BinaryFieldManager();
	}

	migrateData(value: Value | undefined): Uint8Array {
		if (value instanceof Uint8Array) {
			return value;
		}
		return this.defaultValue;
	}

	requiresDataMigration(that: AllocatedField<any>): boolean {
		if (that instanceof AllocatedBinaryField) {
			return false;
		}
		return true;
	}
};

export class BinaryField extends Field<Uint8Array> {
	constructor() {
		super();
	}

	allocate(blockHandler: BlockHandler): AllocatedField<Uint8Array> {
		let schema: BinaryFieldSchema = {
			type: "binary",
			defaultValue: Uint8Array.of()
		};
		let buffer = BinaryFieldSchema.encode(schema);
		let bid = blockHandler.createBlock(buffer.length);
		blockHandler.writeBlock(bid, buffer);
		return new AllocatedBinaryField(blockHandler, bid);
	}
};





















export const StringFieldSchema = bedrock.codecs.Object.of({
	type: bedrock.codecs.StringLiteral.of("string"),
	defaultValue: bedrock.codecs.String
});

export type StringFieldSchema = ReturnType<typeof StringFieldSchema["decode"]>;

export class StringFieldManager extends FieldManager<string> {
	constructor() {
		super(bedrock.codecs.String);
	}
};

export class AllocatedStringField extends AllocatedField<string> {
	constructor(blockHandler: BlockHandler, bid: number) {
		let schema = StringFieldSchema.decode(blockHandler.readBlock(bid));
		super(blockHandler, bid, schema.defaultValue);
	}

	createManager(): FieldManager<string> {
		return new StringFieldManager();
	}

	migrateData(value: Value | undefined): string {
		if (typeof value === "string") {
			return value;
		}
		return this.defaultValue;
	}

	requiresDataMigration(that: AllocatedField<any>): boolean {
		if (that instanceof AllocatedStringField) {
			return false;
		}
		return true;
	}
};

export class StringField extends Field<string> {
	constructor() {
		super();
	}

	allocate(blockHandler: BlockHandler): AllocatedField<string> {
		let schema: StringFieldSchema = {
			type: "string",
			defaultValue: ""
		};
		let buffer = StringFieldSchema.encode(schema);
		let bid = blockHandler.createBlock(buffer.length);
		blockHandler.writeBlock(bid, buffer);
		return new AllocatedStringField(blockHandler, bid);
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
