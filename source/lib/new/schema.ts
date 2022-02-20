import * as bedrock from "@joelek/bedrock";

export const BinaryFieldSchema = bedrock.codecs.Object.of({
	type: bedrock.codecs.StringLiteral.of("BinaryField"),
	defaultValue: bedrock.codecs.Binary
});

export type BinaryFieldSchema = ReturnType<typeof BinaryFieldSchema["decode"]>;

export const BooleanFieldSchema = bedrock.codecs.Object.of({
	type: bedrock.codecs.StringLiteral.of("BooleanField"),
	defaultValue: bedrock.codecs.Boolean
});

export type BooleanFieldSchema = ReturnType<typeof BooleanFieldSchema["decode"]>;

export const StringFieldSchema = bedrock.codecs.Object.of({
	type: bedrock.codecs.StringLiteral.of("StringField"),
	defaultValue: bedrock.codecs.String
});

export type StringFieldSchema = ReturnType<typeof StringFieldSchema["decode"]>;

export const NullableStringFieldSchema = bedrock.codecs.Object.of({
	type: bedrock.codecs.StringLiteral.of("NullableStringField"),
	defaultValue: bedrock.codecs.Union.of(
		bedrock.codecs.String,
		bedrock.codecs.Null
	)
});

export type NullableStringFieldSchema = ReturnType<typeof NullableStringFieldSchema["decode"]>;

export const FieldSchema = bedrock.codecs.Union.of(
	BinaryFieldSchema,
	BooleanFieldSchema,
	StringFieldSchema,
	NullableStringFieldSchema
);

export type FieldSchema = ReturnType<typeof FieldSchema["decode"]>;

export const IndexSchema = bedrock.codecs.Object.of({
	keys: bedrock.codecs.Array.of(bedrock.codecs.String),
	bid: bedrock.codecs.Integer
});

export type IndexSchema = ReturnType<typeof IndexSchema["decode"]>;

export const StoreSchema = bedrock.codecs.Object.of({
	fields: bedrock.codecs.Record.of(FieldSchema),
	keys: bedrock.codecs.Array.of(bedrock.codecs.String),
	indices: bedrock.codecs.Array.of(IndexSchema),
	storageBid: bedrock.codecs.Integer
});

export type StoreSchema = ReturnType<typeof StoreSchema["decode"]>;

export const DecreasingOrderSchema = bedrock.codecs.Object.of({
	type: bedrock.codecs.StringLiteral.of("DecreasingOrder")
});

export type DecreasingOrderSchema = ReturnType<typeof DecreasingOrderSchema["decode"]>;

export const IncreasingOrderSchema = bedrock.codecs.Object.of({
	type: bedrock.codecs.StringLiteral.of("IncreasingOrder")
});

export type IncreasingOrderSchema = ReturnType<typeof IncreasingOrderSchema["decode"]>;

export const OrderSchema = bedrock.codecs.Union.of(
	DecreasingOrderSchema,
	IncreasingOrderSchema
);

export type OrderSchema = ReturnType<typeof OrderSchema["decode"]>;

export const LinkSchema = bedrock.codecs.Object.of({
	parent: bedrock.codecs.String,
	child: bedrock.codecs.String,
	keys: bedrock.codecs.Record.of(bedrock.codecs.String),
	orders: bedrock.codecs.Array.of(bedrock.codecs.Object.of({
		key: bedrock.codecs.String,
		order: OrderSchema
	}))
});

export type LinkSchema = ReturnType<typeof LinkSchema["decode"]>;

export const DatabaseSchema = bedrock.codecs.Object.of({
	stores: bedrock.codecs.Record.of(StoreSchema),
	links: bedrock.codecs.Record.of(LinkSchema)
});

export type DatabaseSchema = ReturnType<typeof DatabaseSchema["decode"]>;
