export declare type ExpansionOf<A> = A extends infer B ? {
    [C in keyof B]: B[C];
} : never;
export declare type SubsetOf<A, S> = ExpansionOf<Pick<{
    [B in keyof S]: B extends keyof A ? A[B] : never;
}, keyof S>>;
