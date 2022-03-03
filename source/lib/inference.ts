export type ExpansionOf<A> = A extends infer B ? { [C in keyof B]: B[C] } : never;

export type SubsetOf<A, S> = ExpansionOf<Pick<A, {
	[B in keyof A]: B extends keyof S ? B : never;
}[keyof A]>>;
