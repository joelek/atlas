import * as bedrock from "@joelek/bedrock";
import { Database, DatabaseManager } from "./databases";
import { File } from "./files";
import { Links, LinkManagersFromLinks } from "./links";
import { Stores, StoreManagersFromStores } from "./stores";
import { BlockManager } from "./blocks";
import { Queries, QueryManagersFromQueries } from "./queries";
export declare const BigIntFieldSchema: bedrock.codecs.ObjectCodec<{
    type: "BigIntField";
    defaultValue: bigint;
}, {
    unique: boolean;
}>;
export type BigIntFieldSchema = ReturnType<typeof BigIntFieldSchema["decode"]>;
export declare const NullableBigIntFieldSchema: bedrock.codecs.ObjectCodec<{
    type: "NullableBigIntField";
    defaultValue: bigint | null;
}, {
    unique: boolean;
}>;
export type NullableBigIntFieldSchema = ReturnType<typeof NullableBigIntFieldSchema["decode"]>;
export declare const BinaryFieldSchema: bedrock.codecs.ObjectCodec<{
    type: "BinaryField";
    defaultValue: Uint8Array;
}, {
    unique: boolean;
}>;
export type BinaryFieldSchema = ReturnType<typeof BinaryFieldSchema["decode"]>;
export declare const NullableBinaryFieldSchema: bedrock.codecs.ObjectCodec<{
    type: "NullableBinaryField";
    defaultValue: Uint8Array | null;
}, {
    unique: boolean;
}>;
export type NullableBinaryFieldSchema = ReturnType<typeof NullableBinaryFieldSchema["decode"]>;
export declare const BooleanFieldSchema: bedrock.codecs.ObjectCodec<{
    type: "BooleanField";
    defaultValue: boolean;
}, {
    unique: boolean;
}>;
export type BooleanFieldSchema = ReturnType<typeof BooleanFieldSchema["decode"]>;
export declare const NullableBooleanFieldSchema: bedrock.codecs.ObjectCodec<{
    type: "NullableBooleanField";
    defaultValue: boolean | null;
}, {
    unique: boolean;
}>;
export type NullableBooleanFieldSchema = ReturnType<typeof NullableBooleanFieldSchema["decode"]>;
export declare const IntegerFieldSchema: bedrock.codecs.ObjectCodec<{
    type: "IntegerField";
    defaultValue: number;
}, {
    unique: boolean;
}>;
export type IntegerFieldSchema = ReturnType<typeof IntegerFieldSchema["decode"]>;
export declare const NullableIntegerFieldSchema: bedrock.codecs.ObjectCodec<{
    type: "NullableIntegerField";
    defaultValue: number | null;
}, {
    unique: boolean;
}>;
export type NullableIntegerFieldSchema = ReturnType<typeof NullableIntegerFieldSchema["decode"]>;
export declare const NumberFieldSchema: bedrock.codecs.ObjectCodec<{
    type: "NumberField";
    defaultValue: number;
}, {
    unique: boolean;
}>;
export type NumberFieldSchema = ReturnType<typeof NumberFieldSchema["decode"]>;
export declare const NullableNumberFieldSchema: bedrock.codecs.ObjectCodec<{
    type: "NullableNumberField";
    defaultValue: number | null;
}, {
    unique: boolean;
}>;
export type NullableNumberFieldSchema = ReturnType<typeof NullableNumberFieldSchema["decode"]>;
export declare const StringFieldSchema: bedrock.codecs.ObjectCodec<{
    type: "StringField";
    defaultValue: string;
}, {
    unique: boolean;
    searchable: boolean;
}>;
export type StringFieldSchema = ReturnType<typeof StringFieldSchema["decode"]>;
export declare const NullableStringFieldSchema: bedrock.codecs.ObjectCodec<{
    type: "NullableStringField";
    defaultValue: string | null;
}, {
    unique: boolean;
    searchable: boolean;
}>;
export type NullableStringFieldSchema = ReturnType<typeof NullableStringFieldSchema["decode"]>;
export declare const FieldSchema: bedrock.codecs.UnionCodec<[{
    type: "BigIntField";
    defaultValue: bigint;
    unique?: boolean | undefined;
}, {
    type: "NullableBigIntField";
    defaultValue: bigint | null;
    unique?: boolean | undefined;
}, {
    type: "BinaryField";
    defaultValue: Uint8Array;
    unique?: boolean | undefined;
}, {
    type: "NullableBinaryField";
    defaultValue: Uint8Array | null;
    unique?: boolean | undefined;
}, {
    type: "BooleanField";
    defaultValue: boolean;
    unique?: boolean | undefined;
}, {
    type: "NullableBooleanField";
    defaultValue: boolean | null;
    unique?: boolean | undefined;
}, {
    type: "IntegerField";
    defaultValue: number;
    unique?: boolean | undefined;
}, {
    type: "NullableIntegerField";
    defaultValue: number | null;
    unique?: boolean | undefined;
}, {
    type: "NumberField";
    defaultValue: number;
    unique?: boolean | undefined;
}, {
    type: "NullableNumberField";
    defaultValue: number | null;
    unique?: boolean | undefined;
}, {
    type: "StringField";
    defaultValue: string;
    unique?: boolean | undefined;
    searchable?: boolean | undefined;
}, {
    type: "NullableStringField";
    defaultValue: string | null;
    unique?: boolean | undefined;
    searchable?: boolean | undefined;
}]>;
export type FieldSchema = ReturnType<typeof FieldSchema["decode"]>;
export declare const FieldsSchema: bedrock.codecs.RecordCodec<{
    type: "BigIntField";
    defaultValue: bigint;
    unique?: boolean | undefined;
} | {
    type: "NullableBigIntField";
    defaultValue: bigint | null;
    unique?: boolean | undefined;
} | {
    type: "BinaryField";
    defaultValue: Uint8Array;
    unique?: boolean | undefined;
} | {
    type: "NullableBinaryField";
    defaultValue: Uint8Array | null;
    unique?: boolean | undefined;
} | {
    type: "BooleanField";
    defaultValue: boolean;
    unique?: boolean | undefined;
} | {
    type: "NullableBooleanField";
    defaultValue: boolean | null;
    unique?: boolean | undefined;
} | {
    type: "IntegerField";
    defaultValue: number;
    unique?: boolean | undefined;
} | {
    type: "NullableIntegerField";
    defaultValue: number | null;
    unique?: boolean | undefined;
} | {
    type: "NumberField";
    defaultValue: number;
    unique?: boolean | undefined;
} | {
    type: "NullableNumberField";
    defaultValue: number | null;
    unique?: boolean | undefined;
} | {
    type: "StringField";
    defaultValue: string;
    unique?: boolean | undefined;
    searchable?: boolean | undefined;
} | {
    type: "NullableStringField";
    defaultValue: string | null;
    unique?: boolean | undefined;
    searchable?: boolean | undefined;
}>;
export type FieldsSchema = ReturnType<typeof FieldsSchema["decode"]>;
export declare const KeysSchema: bedrock.codecs.ArrayCodec<string>;
export type KeysSchema = ReturnType<typeof KeysSchema["decode"]>;
export declare const IndexSchema: bedrock.codecs.ObjectCodec<{
    keys: string[];
    bid: number;
}, {}>;
export type IndexSchema = ReturnType<typeof IndexSchema["decode"]>;
export declare const IndicesSchema: bedrock.codecs.ArrayCodec<{
    keys: string[];
    bid: number;
}>;
export type IndicesSchema = ReturnType<typeof IndicesSchema["decode"]>;
export declare const EqualityOperatorSchema: bedrock.codecs.ObjectCodec<{
    type: "EqualityOperator";
}, {}>;
export type EqualityOperatorSchema = ReturnType<typeof EqualityOperatorSchema["decode"]>;
export declare const GreaterThanOperatorSchema: bedrock.codecs.ObjectCodec<{
    type: "GreaterThanOperator";
}, {}>;
export type GreaterThanOperatorSchema = ReturnType<typeof GreaterThanOperatorSchema["decode"]>;
export declare const GreaterThanOrEqualOperatorSchema: bedrock.codecs.ObjectCodec<{
    type: "GreaterThanOrEqualOperator";
}, {}>;
export type GreaterThanOrEqualOperatorSchema = ReturnType<typeof GreaterThanOrEqualOperatorSchema["decode"]>;
export declare const LessThanOperatorSchema: bedrock.codecs.ObjectCodec<{
    type: "LessThanOperator";
}, {}>;
export type LessThanOperatorSchema = ReturnType<typeof LessThanOperatorSchema["decode"]>;
export declare const LessThanOrEqualOperatorSchema: bedrock.codecs.ObjectCodec<{
    type: "LessThanOrEqualOperator";
}, {}>;
export type LessThanOrEqualOperatorSchema = ReturnType<typeof LessThanOrEqualOperatorSchema["decode"]>;
export declare const OperatorSchema: bedrock.codecs.UnionCodec<[{
    type: "EqualityOperator";
}, {
    type: "GreaterThanOperator";
}, {
    type: "GreaterThanOrEqualOperator";
}, {
    type: "LessThanOperator";
}, {
    type: "LessThanOrEqualOperator";
}]>;
export type OperatorSchema = ReturnType<typeof OperatorSchema["decode"]>;
export declare const KeyOperatorSchema: bedrock.codecs.ObjectCodec<{
    key: string;
    operator: {
        type: "EqualityOperator";
    } | {
        type: "GreaterThanOperator";
    } | {
        type: "GreaterThanOrEqualOperator";
    } | {
        type: "LessThanOperator";
    } | {
        type: "LessThanOrEqualOperator";
    };
}, {}>;
export type KeyOperatorSchema = ReturnType<typeof KeyOperatorSchema["decode"]>;
export declare const KeyOperatorsSchema: bedrock.codecs.ArrayCodec<{
    key: string;
    operator: {
        type: "EqualityOperator";
    } | {
        type: "GreaterThanOperator";
    } | {
        type: "GreaterThanOrEqualOperator";
    } | {
        type: "LessThanOperator";
    } | {
        type: "LessThanOrEqualOperator";
    };
}>;
export type KeyOperatorsSchema = ReturnType<typeof KeyOperatorsSchema["decode"]>;
export declare const DecreasingOrderSchema: bedrock.codecs.ObjectCodec<{
    type: "DecreasingOrder";
}, {}>;
export type DecreasingOrderSchema = ReturnType<typeof DecreasingOrderSchema["decode"]>;
export declare const IncreasingOrderSchema: bedrock.codecs.ObjectCodec<{
    type: "IncreasingOrder";
}, {}>;
export type IncreasingOrderSchema = ReturnType<typeof IncreasingOrderSchema["decode"]>;
export declare const OrderSchema: bedrock.codecs.UnionCodec<[{
    type: "DecreasingOrder";
}, {
    type: "IncreasingOrder";
}]>;
export type OrderSchema = ReturnType<typeof OrderSchema["decode"]>;
export declare const KeyOrderSchema: bedrock.codecs.ObjectCodec<{
    key: string;
    order: {
        type: "DecreasingOrder";
    } | {
        type: "IncreasingOrder";
    };
}, {}>;
export type KeyOrderSchema = ReturnType<typeof KeyOrderSchema["decode"]>;
export declare const KeyOrdersSchema: bedrock.codecs.ArrayCodec<{
    key: string;
    order: {
        type: "DecreasingOrder";
    } | {
        type: "IncreasingOrder";
    };
}>;
export type KeyOrdersSchema = ReturnType<typeof KeyOrdersSchema["decode"]>;
export declare const KeysMapSchema: bedrock.codecs.RecordCodec<string>;
export type KeyMapSchema = ReturnType<typeof KeysMapSchema["decode"]>;
export declare const SearchIndexSchema: bedrock.codecs.ObjectCodec<{
    key: string;
    bid: number;
}, {}>;
export type SearchIndexSchema = ReturnType<typeof SearchIndexSchema["decode"]>;
export declare const SearchIndicesSchema: bedrock.codecs.ArrayCodec<{
    key: string;
    bid: number;
}>;
export type SearchIndicesSchema = ReturnType<typeof SearchIndicesSchema["decode"]>;
export declare const StoreSchema: bedrock.codecs.ObjectCodec<{
    version: number;
    fields: globalThis.Record<string, {
        type: "BigIntField";
        defaultValue: bigint;
        unique?: boolean | undefined;
    } | {
        type: "NullableBigIntField";
        defaultValue: bigint | null;
        unique?: boolean | undefined;
    } | {
        type: "BinaryField";
        defaultValue: Uint8Array;
        unique?: boolean | undefined;
    } | {
        type: "NullableBinaryField";
        defaultValue: Uint8Array | null;
        unique?: boolean | undefined;
    } | {
        type: "BooleanField";
        defaultValue: boolean;
        unique?: boolean | undefined;
    } | {
        type: "NullableBooleanField";
        defaultValue: boolean | null;
        unique?: boolean | undefined;
    } | {
        type: "IntegerField";
        defaultValue: number;
        unique?: boolean | undefined;
    } | {
        type: "NullableIntegerField";
        defaultValue: number | null;
        unique?: boolean | undefined;
    } | {
        type: "NumberField";
        defaultValue: number;
        unique?: boolean | undefined;
    } | {
        type: "NullableNumberField";
        defaultValue: number | null;
        unique?: boolean | undefined;
    } | {
        type: "StringField";
        defaultValue: string;
        unique?: boolean | undefined;
        searchable?: boolean | undefined;
    } | {
        type: "NullableStringField";
        defaultValue: string | null;
        unique?: boolean | undefined;
        searchable?: boolean | undefined;
    }>;
    keys: string[];
    orders: {
        key: string;
        order: {
            type: "DecreasingOrder";
        } | {
            type: "IncreasingOrder";
        };
    }[];
    indices: {
        keys: string[];
        bid: number;
    }[];
    storageBid: number;
    searchIndices: {
        key: string;
        bid: number;
    }[];
}, {}>;
export type StoreSchema = ReturnType<typeof StoreSchema["decode"]>;
export declare const StoresSchema: bedrock.codecs.RecordCodec<{
    version: number;
    fields: globalThis.Record<string, {
        type: "BigIntField";
        defaultValue: bigint;
        unique?: boolean | undefined;
    } | {
        type: "NullableBigIntField";
        defaultValue: bigint | null;
        unique?: boolean | undefined;
    } | {
        type: "BinaryField";
        defaultValue: Uint8Array;
        unique?: boolean | undefined;
    } | {
        type: "NullableBinaryField";
        defaultValue: Uint8Array | null;
        unique?: boolean | undefined;
    } | {
        type: "BooleanField";
        defaultValue: boolean;
        unique?: boolean | undefined;
    } | {
        type: "NullableBooleanField";
        defaultValue: boolean | null;
        unique?: boolean | undefined;
    } | {
        type: "IntegerField";
        defaultValue: number;
        unique?: boolean | undefined;
    } | {
        type: "NullableIntegerField";
        defaultValue: number | null;
        unique?: boolean | undefined;
    } | {
        type: "NumberField";
        defaultValue: number;
        unique?: boolean | undefined;
    } | {
        type: "NullableNumberField";
        defaultValue: number | null;
        unique?: boolean | undefined;
    } | {
        type: "StringField";
        defaultValue: string;
        unique?: boolean | undefined;
        searchable?: boolean | undefined;
    } | {
        type: "NullableStringField";
        defaultValue: string | null;
        unique?: boolean | undefined;
        searchable?: boolean | undefined;
    }>;
    keys: string[];
    orders: {
        key: string;
        order: {
            type: "DecreasingOrder";
        } | {
            type: "IncreasingOrder";
        };
    }[];
    indices: {
        keys: string[];
        bid: number;
    }[];
    storageBid: number;
    searchIndices: {
        key: string;
        bid: number;
    }[];
}>;
export type StoresSchema = ReturnType<typeof StoresSchema["decode"]>;
export declare const LinkSchema: bedrock.codecs.ObjectCodec<{
    version: number;
    parent: string;
    child: string;
    keysMap: globalThis.Record<string, string>;
    orders: {
        key: string;
        order: {
            type: "DecreasingOrder";
        } | {
            type: "IncreasingOrder";
        };
    }[];
}, {}>;
export type LinkSchema = ReturnType<typeof LinkSchema["decode"]>;
export declare const LinksSchema: bedrock.codecs.RecordCodec<{
    version: number;
    parent: string;
    child: string;
    keysMap: globalThis.Record<string, string>;
    orders: {
        key: string;
        order: {
            type: "DecreasingOrder";
        } | {
            type: "IncreasingOrder";
        };
    }[];
}>;
export type LinksSchema = ReturnType<typeof LinksSchema["decode"]>;
export declare const QuerySchema: bedrock.codecs.ObjectCodec<{
    version: number;
    store: string;
    operators: {
        key: string;
        operator: {
            type: "EqualityOperator";
        } | {
            type: "GreaterThanOperator";
        } | {
            type: "GreaterThanOrEqualOperator";
        } | {
            type: "LessThanOperator";
        } | {
            type: "LessThanOrEqualOperator";
        };
    }[];
    orders: {
        key: string;
        order: {
            type: "DecreasingOrder";
        } | {
            type: "IncreasingOrder";
        };
    }[];
}, {}>;
export type QuerySchema = ReturnType<typeof QuerySchema["decode"]>;
export declare const QueriesSchema: bedrock.codecs.RecordCodec<{
    version: number;
    store: string;
    operators: {
        key: string;
        operator: {
            type: "EqualityOperator";
        } | {
            type: "GreaterThanOperator";
        } | {
            type: "GreaterThanOrEqualOperator";
        } | {
            type: "LessThanOperator";
        } | {
            type: "LessThanOrEqualOperator";
        };
    }[];
    orders: {
        key: string;
        order: {
            type: "DecreasingOrder";
        } | {
            type: "IncreasingOrder";
        };
    }[];
}>;
export type QueriesSchema = ReturnType<typeof QueriesSchema["decode"]>;
export declare const DatabaseSchema: bedrock.codecs.ObjectCodec<{
    stores: globalThis.Record<string, {
        version: number;
        fields: globalThis.Record<string, {
            type: "BigIntField";
            defaultValue: bigint;
            unique?: boolean | undefined;
        } | {
            type: "NullableBigIntField";
            defaultValue: bigint | null;
            unique?: boolean | undefined;
        } | {
            type: "BinaryField";
            defaultValue: Uint8Array;
            unique?: boolean | undefined;
        } | {
            type: "NullableBinaryField";
            defaultValue: Uint8Array | null;
            unique?: boolean | undefined;
        } | {
            type: "BooleanField";
            defaultValue: boolean;
            unique?: boolean | undefined;
        } | {
            type: "NullableBooleanField";
            defaultValue: boolean | null;
            unique?: boolean | undefined;
        } | {
            type: "IntegerField";
            defaultValue: number;
            unique?: boolean | undefined;
        } | {
            type: "NullableIntegerField";
            defaultValue: number | null;
            unique?: boolean | undefined;
        } | {
            type: "NumberField";
            defaultValue: number;
            unique?: boolean | undefined;
        } | {
            type: "NullableNumberField";
            defaultValue: number | null;
            unique?: boolean | undefined;
        } | {
            type: "StringField";
            defaultValue: string;
            unique?: boolean | undefined;
            searchable?: boolean | undefined;
        } | {
            type: "NullableStringField";
            defaultValue: string | null;
            unique?: boolean | undefined;
            searchable?: boolean | undefined;
        }>;
        keys: string[];
        orders: {
            key: string;
            order: {
                type: "DecreasingOrder";
            } | {
                type: "IncreasingOrder";
            };
        }[];
        indices: {
            keys: string[];
            bid: number;
        }[];
        storageBid: number;
        searchIndices: {
            key: string;
            bid: number;
        }[];
    }>;
    links: globalThis.Record<string, {
        version: number;
        parent: string;
        child: string;
        keysMap: globalThis.Record<string, string>;
        orders: {
            key: string;
            order: {
                type: "DecreasingOrder";
            } | {
                type: "IncreasingOrder";
            };
        }[];
    }>;
    queries: globalThis.Record<string, {
        version: number;
        store: string;
        operators: {
            key: string;
            operator: {
                type: "EqualityOperator";
            } | {
                type: "GreaterThanOperator";
            } | {
                type: "GreaterThanOrEqualOperator";
            } | {
                type: "LessThanOperator";
            } | {
                type: "LessThanOrEqualOperator";
            };
        }[];
        orders: {
            key: string;
            order: {
                type: "DecreasingOrder";
            } | {
                type: "IncreasingOrder";
            };
        }[];
    }>;
}, {}>;
export type DatabaseSchema = ReturnType<typeof DatabaseSchema["decode"]>;
export declare function isSchemaCompatible<V>(codec: bedrock.codecs.Codec<V>, subject: any): subject is V;
export declare class SchemaManager {
    private getStoreName;
    private initializeDatabase;
    private loadFieldManager;
    private loadOperatorManager;
    private loadOrderManager;
    private loadIndexManager;
    private loadSearchIndexManager;
    private loadRecordManager;
    private loadStoreManager;
    private loadLinkManager;
    private loadQueryManager;
    private loadDatabaseManager;
    private compareField;
    private compareFields;
    private compareKeys;
    private compareIndex;
    private compareSearchIndex;
    private compareStore;
    private compareLink;
    private createField;
    private createIndex;
    private createSearchIndex;
    private createStore;
    private deleteStore;
    private deleteIndex;
    private deleteSearchIndex;
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
    createDatabaseManager<A extends Stores<any>, B extends Links<any>, C extends Queries<any>>(file: File, blockManager: BlockManager, database: Database<A, B, C>): DatabaseManager<StoreManagersFromStores<A>, LinkManagersFromLinks<B>, QueryManagersFromQueries<C>>;
}
