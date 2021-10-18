import * as keys from "../keys";

export interface Entry {
	key(): keys.Key;
	value(): number
};
