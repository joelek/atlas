import { Sorter } from "./shared";
export declare const StringSorter: {
    decreasing<A>(getField: (value: A) => string | null | undefined): Sorter<A>;
    increasing<A_1>(getField: (value: A_1) => string | null | undefined): Sorter<A_1>;
};
