import { Sorter } from "./shared";
export declare const CompositeSorter: {
    of<A>(...rankers: Sorter<A>[]): Sorter<A>;
};
