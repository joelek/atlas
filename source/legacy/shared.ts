import * as keys from "../keys";

export interface Entry<A> {
	key(): keys.Key;
	value(): A
};
