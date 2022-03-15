import { Sorter } from "./shared";

export const CompositeSorter = {
	of<A>(...rankers: Sorter<A>[]): Sorter<A> {
		return (one, two) => {
			for (let ranker of rankers) {
				let rank = ranker(one, two);
				if (rank !== 0) {
					return rank;
				}
			}
			return 0;
		};
	}
};
