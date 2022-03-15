import * as bedrock from "@joelek/bedrock";
import { Database, DatabaseManager } from "./databases";
import { File } from "./files";
import { Links, LinkManagersFromLinks } from "./links";
import { Stores, StoreManagersFromStores } from "./stores";
import { Queries, QueryManagersFromQueries } from "./queries";
export declare const BigIntFieldSchema: bedrock.codecs.ObjectCodec<{
    type: "BigIntField";
    defaultValue: bigint;
}>;
export declare type BigIntFieldSchema = ReturnType<typeof BigIntFieldSchema["decode"]>;
export declare const NullableBigIntFieldSchema: bedrock.codecs.ObjectCodec<{
    type: "NullableBigIntField";
    defaultValue: bigint | null;
}>;
export declare type NullableBigIntFieldSchema = ReturnType<typeof NullableBigIntFieldSchema["decode"]>;
export declare const BinaryFieldSchema: bedrock.codecs.ObjectCodec<{
    type: "BinaryField";
    defaultValue: Uint8Array;
}>;
export declare type BinaryFieldSchema = ReturnType<typeof BinaryFieldSchema["decode"]>;
export declare const NullableBinaryFieldSchema: bedrock.codecs.ObjectCodec<{
    type: "NullableBinaryField";
    defaultValue: Uint8Array | null;
}>;
export declare type NullableBinaryFieldSchema = ReturnType<typeof NullableBinaryFieldSchema["decode"]>;
export declare const BooleanFieldSchema: bedrock.codecs.ObjectCodec<{
    type: "BooleanField";
    defaultValue: boolean;
}>;
export declare type BooleanFieldSchema = ReturnType<typeof BooleanFieldSchema["decode"]>;
export declare const NullableBooleanFieldSchema: bedrock.codecs.ObjectCodec<{
    type: "NullableBooleanField";
    defaultValue: boolean | null;
}>;
export declare type NullableBooleanFieldSchema = ReturnType<typeof NullableBooleanFieldSchema["decode"]>;
export declare const IntegerFieldSchema: bedrock.codecs.ObjectCodec<{
    type: "IntegerField";
    defaultValue: number;
}>;
export declare type IntegerFieldSchema = ReturnType<typeof IntegerFieldSchema["decode"]>;
export declare const NullableIntegerFieldSchema: bedrock.codecs.ObjectCodec<{
    type: "NullableIntegerField";
    defaultValue: number | null;
}>;
export declare type NullableIntegerFieldSchema = ReturnType<typeof NullableIntegerFieldSchema["decode"]>;
export declare const NumberFieldSchema: bedrock.codecs.ObjectCodec<{
    type: "NumberField";
    defaultValue: number;
}>;
export declare type NumberFieldSchema = ReturnType<typeof NumberFieldSchema["decode"]>;
export declare const NullableNumberFieldSchema: bedrock.codecs.ObjectCodec<{
    type: "NullableNumberField";
    defaultValue: number | null;
}>;
export declare type NullableNumberFieldSchema = ReturnType<typeof NullableNumberFieldSchema["decode"]>;
export declare const StringFieldSchema: bedrock.codecs.ObjectCodec<{
    type: "StringField";
    defaultValue: string;
}>;
export declare type StringFieldSchema = ReturnType<typeof StringFieldSchema["decode"]>;
export declare const NullableStringFieldSchema: bedrock.codecs.ObjectCodec<{
    type: "NullableStringField";
    defaultValue: string | null;
}>;
export declare type NullableStringFieldSchema = ReturnType<typeof NullableStringFieldSchema["decode"]>;
export declare const FieldSchema: bedrock.codecs.UnionCodec<[{
    type: "BigIntField";
    defaultValue: bigint;
}, {
    type: "NullableBigIntField";
    defaultValue: bigint | null;
}, {
    type: "BinaryField";
    defaultValue: Uint8Array;
}, {
    type: "NullableBinaryField";
    defaultValue: Uint8Array | null;
}, {
    type: "BooleanField";
    defaultValue: boolean;
}, {
    type: "NullableBooleanField";
    defaultValue: boolean | null;
}, {
    type: "IntegerField";
    defaultValue: number;
}, {
    type: "NullableIntegerField";
    defaultValue: number | null;
}, {
    type: "NumberField";
    defaultValue: number;
}, {
    type: "NullableNumberField";
    defaultValue: number | null;
}, {
    type: "StringField";
    defaultValue: string;
}, {
    type: "NullableStringField";
    defaultValue: string | null;
}]>;
export declare type FieldSchema = ReturnType<typeof FieldSchema["decode"]>;
export declare const FieldsSchema: bedrock.codecs.RecordCodec<{
    type: "BigIntField";
    defaultValue: bigint;
} | {
    type: "NullableBigIntField";
    defaultValue: bigint | null;
} | {
    type: "BinaryField";
    defaultValue: Uint8Array;
} | {
    type: "NullableBinaryField";
    defaultValue: Uint8Array | null;
} | {
    type: "BooleanField";
    defaultValue: boolean;
} | {
    type: "NullableBooleanField";
    defaultValue: boolean | null;
} | {
    type: "IntegerField";
    defaultValue: number;
} | {
    type: "NullableIntegerField";
    defaultValue: number | null;
} | {
    type: "NumberField";
    defaultValue: number;
} | {
    type: "NullableNumberField";
    defaultValue: number | null;
} | {
    type: "StringField";
    defaultValue: string;
} | {
    type: "NullableStringField";
    defaultValue: string | null;
}>;
export declare type FieldsSchema = ReturnType<typeof FieldsSchema["decode"]>;
export declare const KeysSchema: bedrock.codecs.ArrayCodec<string>;
export declare type KeysSchema = ReturnType<typeof KeysSchema["decode"]>;
export declare const IndexSchema: bedrock.codecs.ObjectCodec<{
    keys: string[];
    bid: number;
}>;
export declare type IndexSchema = ReturnType<typeof IndexSchema["decode"]>;
export declare const IndicesSchema: bedrock.codecs.ArrayCodec<{
    keys: string[];
    bid: number;
}>;
export declare type IndicesSchema = ReturnType<typeof IndicesSchema["decode"]>;
export declare const EqualityOperatorSchema: bedrock.codecs.ObjectCodec<{
    type: "EqualityOperator";
}>;
export declare type EqualityOperatorSchema = ReturnType<typeof EqualityOperatorSchema["decode"]>;
export declare const OperatorSchema: bedrock.codecs.UnionCodec<[{
    type: "EqualityOperator";
}]>;
export declare type OperatorSchema = ReturnType<typeof OperatorSchema["decode"]>;
export declare const KeyOperatorSchema: bedrock.codecs.ObjectCodec<{
    key: string;
    operator: {
        type: any;
    };
}>;
export declare type KeyOperatorSchema = ReturnType<typeof KeyOperatorSchema["decode"]>;
export declare const KeyOperatorsSchema: bedrock.codecs.ArrayCodec<{
    key: string;
    operator: {
        type: any;
    };
}>;
export declare type KeyOperatorsSchema = ReturnType<typeof KeyOperatorsSchema["decode"]>;
export declare const DecreasingOrderSchema: bedrock.codecs.ObjectCodec<{
    type: "DecreasingOrder";
}>;
export declare type DecreasingOrderSchema = ReturnType<typeof DecreasingOrderSchema["decode"]>;
export declare const IncreasingOrderSchema: bedrock.codecs.ObjectCodec<{
    type: "IncreasingOrder";
}>;
export declare type IncreasingOrderSchema = ReturnType<typeof IncreasingOrderSchema["decode"]>;
export declare const OrderSchema: bedrock.codecs.UnionCodec<[{
    type: "DecreasingOrder";
}, {
    type: "IncreasingOrder";
}]>;
export declare type OrderSchema = ReturnType<typeof OrderSchema["decode"]>;
export declare const KeyOrderSchema: bedrock.codecs.ObjectCodec<{
    key: string;
    order: {
        type: any;
    } | {
        type: any;
    };
}>;
export declare type KeyOrderSchema = ReturnType<typeof KeyOrderSchema["decode"]>;
export declare const KeyOrdersSchema: bedrock.codecs.ArrayCodec<{
    key: string;
    order: {
        type: any;
    } | {
        type: any;
    };
}>;
export declare type KeyOrdersSchema = ReturnType<typeof KeyOrdersSchema["decode"]>;
export declare const KeysMapSchema: bedrock.codecs.RecordCodec<string>;
export declare type KeyMapSchema = ReturnType<typeof KeysMapSchema["decode"]>;
export declare const StoreSchema: bedrock.codecs.ObjectCodec<{
    version: number;
    fields: globalThis.Record<string, {
        type: any;
        defaultValue: any;
    } | {
        type: any;
        defaultValue: any;
    } | {
        type: any;
        defaultValue: any;
    } | {
        type: any;
        defaultValue: any;
    } | {
        type: any;
        defaultValue: any;
    } | {
        type: any;
        defaultValue: any;
    } | {
        type: any;
        defaultValue: any;
    } | {
        type: any;
        defaultValue: any;
    } | {
        type: any;
        defaultValue: any;
    } | {
        type: any;
        defaultValue: any;
    } | {
        type: any;
        defaultValue: any;
    } | {
        type: any;
        defaultValue: any;
    }>;
    keys: string[];
    orders: {
        key: any;
        order: any;
    }[];
    indices: {
        keys: any;
        bid: any;
    }[];
    storageBid: number;
}>;
export declare type StoreSchema = ReturnType<typeof StoreSchema["decode"]>;
export declare const StoresSchema: bedrock.codecs.RecordCodec<{
    version: number;
    fields: globalThis.Record<string, {
        type: any;
        defaultValue: any;
    } | {
        type: any;
        defaultValue: any;
    } | {
        type: any;
        defaultValue: any;
    } | {
        type: any;
        defaultValue: any;
    } | {
        type: any;
        defaultValue: any;
    } | {
        type: any;
        defaultValue: any;
    } | {
        type: any;
        defaultValue: any;
    } | {
        type: any;
        defaultValue: any;
    } | {
        type: any;
        defaultValue: any;
    } | {
        type: any;
        defaultValue: any;
    } | {
        type: any;
        defaultValue: any;
    } | {
        type: any;
        defaultValue: any;
    }>;
    keys: string[];
    orders: {
        key: any;
        order: any;
    }[];
    indices: {
        keys: any;
        bid: any;
    }[];
    storageBid: number;
}>;
export declare type StoresSchema = ReturnType<typeof StoresSchema["decode"]>;
export declare const LinkSchema: bedrock.codecs.ObjectCodec<{
    version: number;
    parent: string;
    child: string;
    keysMap: globalThis.Record<string, string>;
    orders: {
        key: any;
        order: any;
    }[];
}>;
export declare type LinkSchema = ReturnType<typeof LinkSchema["decode"]>;
export declare const LinksSchema: bedrock.codecs.RecordCodec<{
    version: number;
    parent: string;
    child: string;
    keysMap: globalThis.Record<string, string>;
    orders: {
        key: any;
        order: any;
    }[];
}>;
export declare type LinksSchema = ReturnType<typeof LinksSchema["decode"]>;
export declare const QuerySchema: bedrock.codecs.ObjectCodec<{
    version: number;
    store: string;
    operators: {
        key: any;
        operator: any;
    }[];
    orders: {
        key: any;
        order: any;
    }[];
}>;
export declare type QuerySchema = ReturnType<typeof QuerySchema["decode"]>;
export declare const QueriesSchema: bedrock.codecs.RecordCodec<{
    version: number;
    store: string;
    operators: {
        key: any;
        operator: any;
    }[];
    orders: {
        key: any;
        order: any;
    }[];
}>;
export declare type QueriesSchema = ReturnType<typeof QueriesSchema["decode"]>;
export declare const DatabaseSchema: bedrock.codecs.ObjectCodec<{
    stores: globalThis.Record<string, {
        version: any;
        fields: any;
        keys: any;
        orders: any;
        indices: any;
        storageBid: any;
    }>;
    links: globalThis.Record<string, {
        version: any;
        parent: any;
        child: any;
        keysMap: any;
        orders: any;
    }>;
    queries: globalThis.Record<string, {
        version: any;
        store: any;
        operators: any;
        orders: any;
    }>;
}>;
export declare type DatabaseSchema = ReturnType<typeof DatabaseSchema["decode"]>;
export declare function isSchemaCompatible<V>(codec: bedrock.codecs.Codec<V>, subject: any): subject is V;
export declare class SchemaManager {
    private getStoreName;
    private initializeDatabase;
    private loadFieldManager;
    private loadOperatorManager;
    private loadOrderManager;
    private loadIndexManager;
    private loadRecordManager;
    private loadStoreManager;
    private loadLinkManager;
    private loadQueryManager;
    private loadDatabaseManager;
    private compareField;
    private compareFields;
    private compareKeys;
    private compareIndex;
    private compareStore;
    private compareLink;
    private createField;
    private createIndex;
    private createStore;
    private deleteStore;
    private deleteIndex;
    private updateStore;
    private updateStores;
    private createOperator;
    private createKeyOperators;
    private createOrder;
    private createKeyOrders;
    private createLink;
    private deleteLink;
    private updateLink;
    private updateLinks;
    private compareQuery;
    private createQuery;
    private deleteQuery;
    private updateQuery;
    private updateQueries;
    private updateDatabase;
    private getDirtyStoreNames;
    private getDirtyLinkNames;
    constructor();
    createDatabaseManager<A extends Stores<any>, B extends Links<any>, C extends Queries<any>>(file: File, database: Database<A, B, C>): DatabaseManager<StoreManagersFromStores<A>, LinkManagersFromLinks<B>, QueryManagersFromQueries<C>>;
}
