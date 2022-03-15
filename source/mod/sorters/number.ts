import { Sorter } from "./shared";

export const NumberSorter = {
	decreasing<A>(getField: (value: A) => number | null | undefined): Sorter<A> {
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
			return t - o;
		};
	},
	increasing<A>(getField: (value: A) => number | null | undefined): Sorter<A> {
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
			return o - t;
		};
	}
};
