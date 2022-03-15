import { Sorter } from "./shared";
export declare const CustomSorter: {
    decreasing<A>(getField: (value: A) => boolean | null | undefined): Sorter<A>;
    increasing<A_1>(getField: (value: A_1) => boolean | null | undefined): Sorter<A_1>;
};
