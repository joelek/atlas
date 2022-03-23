import { Link, LinkManagersFromLinks, WritableLinksFromLinkManagers } from "./links";
import { Store, StoreManagersFromStores, WritableStoresFromStoreManagers } from "./stores";
import { Record, KeysRecordMap, BinaryField, BooleanField, StringField, NullableStringField, RequiredKeys, Value, Field, BigIntField, NumberField, IntegerField, NullableBigIntField, NullableBinaryField, NullableBooleanField, NullableIntegerField, NullableNumberField } from "./records";
import { TransactionManager } from "./transactions";
import { DecreasingOrder, IncreasingOrder, Order } from "./orders";
import { EqualityOperator, Operator } from "./operators";
import { SubsetOf } from "./inference";
import { Query, QueryManagersFromQueries, WritableQueriesFromQueryManagers } from "./queries";
export declare class FieldReference<A extends Field<any>> {
    private FieldReference;
}
export declare type FieldReferences<A extends Record> = {
    [B in keyof A]: FieldReference<Field<A[B]>>;
};
export declare class StoreReference<A extends Record, B extends RequiredKeys<A>> {
    private StoreReference;
}
export declare type StoreReferences<A> = {
    [B in keyof A]: A[B] extends StoreReference<infer C, infer D> ? StoreReference<C, D> : A[B];
};
export declare type StoresFromStoreReferences<A extends StoreReferences<any>> = {
    [B in keyof A]: A[B] extends StoreReference<infer C, infer D> ? Store<C, D> : never;
};
export declare class LinkReference<A extends Record, B extends RequiredKeys<A>, C extends Record, D extends RequiredKeys<C>, E extends KeysRecordMap<A, B, C>> {
    private LinkReference;
}
export declare type LinkReferences<A> = {
    [B in keyof A]: A[B] extends LinkReference<infer C, infer D, infer E, infer F, infer G> ? LinkReference<C, D, E, F, G> : A[B];
};
export declare type LinksFromLinkReferences<A extends LinkReferences<any>> = {
    [B in keyof A]: A[B] extends LinkReference<infer C, infer D, infer E, infer F, infer G> ? Link<C, D, E, F, G> : never;
};
export declare class QueryReference<A extends Record, B extends RequiredKeys<A>, C extends SubsetOf<A, C>, D extends SubsetOf<A, D>> {
    private QueryReference;
}
export declare type QueryReferences<A> = {
    [B in keyof A]: A[B] extends QueryReference<infer C, infer D, infer E, infer F> ? QueryReference<C, D, E, F> : A[B];
};
export declare type QueriesFromQueryReferences<A extends QueryReferences<any>> = {
    [B in keyof A]: A[B] extends QueryReference<infer C, infer D, infer E, infer F> ? Query<C, D, E, F> : never;
};
export declare class OrderReference<A extends Order<any>> {
    private OrderReference;
}
export declare type OrderReferences<A extends Record> = {
    [B in keyof A]: OrderReference<Order<A[B]>>;
};
export declare class OperatorReference<A extends Operator<any>> {
    private OperatorReference;
}
export declare type OperatorReferences<A extends Record> = {
    [B in keyof A]: OperatorReference<Operator<A[B]>>;
};
export declare class Context {
    private fields;
    private links;
    private stores;
    private queries;
    private operators;
    private orders;
    private databaseManagers;
    private getField;
    private getLink;
    private getStore;
    private getQuery;
    private getOperator;
    private getOrder;
    private createFile;
    constructor();
    createBigIntField(): FieldReference<BigIntField>;
    createNullableBigIntField(): FieldReference<NullableBigIntField>;
    createBinaryField(): FieldReference<BinaryField>;
    createNullableBinaryField(): FieldReference<NullableBinaryField>;
    createBooleanField(): FieldReference<BooleanField>;
    createNullableBooleanField(): FieldReference<NullableBooleanField>;
    createIntegerField(): FieldReference<IntegerField>;
    createNullableIntegerField(): FieldReference<NullableIntegerField>;
    createNumberField(): FieldReference<NumberField>;
    createNullableNumberField(): FieldReference<NullableNumberField>;
    createStringField(): FieldReference<StringField>;
    createNullableStringField(): FieldReference<NullableStringField>;
    createLink<A extends Record, B extends RequiredKeys<A>, C extends Record, D extends RequiredKeys<C>, E extends KeysRecordMap<A, B, C>>(parent: StoreReference<A, B>, child: StoreReference<C, D>, recordKeysMap: E, orderReferences?: Partial<OrderReferences<C>>): LinkReference<A, B, C, D, E>;
    createStore<A extends Record, B extends RequiredKeys<A>, C extends SubsetOf<A, C>>(fieldReferences: FieldReferences<A>, keys: [...B], orderReferences?: OrderReferences<C>): StoreReference<A, B>;
    createQuery<A extends Record, B extends RequiredKeys<A>, C extends SubsetOf<A, C>, D extends SubsetOf<A, D>>(storeReference: StoreReference<A, B>, operatorReferences: OperatorReferences<C>, orderReferences?: OrderReferences<D>): QueryReference<A, B, C, D>;
    createEqualityOperator<A extends Value>(): OperatorReference<EqualityOperator<A>>;
    createDecreasingOrder<A extends Value>(): OrderReference<DecreasingOrder<A>>;
    createIncreasingOrder<A extends Value>(): OrderReference<IncreasingOrder<A>>;
    createTransactionManager<A extends StoreReferences<any>, B extends LinkReferences<any>, C extends QueryReferences<any>>(path: string, storeReferences?: A, linkReferences?: B, queryReferences?: C): {
        transactionManager: TransactionManager<WritableStoresFromStoreManagers<StoreManagersFromStores<StoresFromStoreReferences<A>>>, WritableLinksFromLinkManagers<LinkManagersFromLinks<LinksFromLinkReferences<B>>>, WritableQueriesFromQueryManagers<QueryManagersFromQueries<QueriesFromQueryReferences<C>>>>;
    };
}
