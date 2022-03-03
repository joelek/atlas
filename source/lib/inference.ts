export type ExpansionOf<A> = A extends infer B ? { [C in keyof B]: B[C] } : never;

export type SubsetOf<A> = {
	[B in keyof A]: {
		[C in B]: A[B];
	}
}[keyof A];
