import { Sorter } from "./shared";

export const StringSorter = {
	decreasing<A>(getField: (value: A) => string | null | undefined): Sorter<A> {
		return (one, two) => {
			let o = getField(one);
			let t = getField(two);
			if (o == null) {
				if (t == null) {
					return 0;
				} else {
					return -1;
				}
			}
			if (t == null) {
				if (o == null) {
					return 0;
				} else {
					return 1;
				}
			}
			return t.localeCompare(o);
		};
	},
	increasing<A>(getField: (value: A) => string | null | undefined): Sorter<A> {
		return (one, two) => {
			let o = getField(one);
			let t = getField(two);
			if (o == null) {
				if (t == null) {
					return 0;
				} else {
					return 1;
				}
			}
			if (t == null) {
				if (o == null) {
					return 0;
				} else {
					return -1;
				}
			}
			return o.localeCompare(t);
		};
	}
};
