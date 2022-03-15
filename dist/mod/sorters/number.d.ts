import { Sorter } from "./shared";
export declare const NumberSorter: {
    decreasing<A>(getField: (value: A) => number | null | undefined): Sorter<A>;
    increasing<A_1>(getField: (value: A_1) => number | null | undefined): Sorter<A_1>;
};
