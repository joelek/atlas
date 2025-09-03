declare function compress_data_using_rle_coding(source: Uint8Array): Uint8Array | undefined;
declare function decompress_data_using_rle_coding(source: Uint8Array, target: Uint8Array): Uint8Array;
export declare const RLECompressor: {
    compress: typeof compress_data_using_rle_coding;
    decompress: typeof decompress_data_using_rle_coding;
};
export {};
