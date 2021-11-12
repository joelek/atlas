import * as bedrock from "@joelek/bedrock";

export type Chunk = Uint8Array;
export type Chunks = Array<Chunk>;

export function compareChunk(one: Chunk, two: Chunk): number {
	return bedrock.utils.Chunk.comparePrefixes(one, two);
};

export function compareChunks(one: Chunks, two: Chunks): number {
	if (one.length < two.length) {
		return -1;
	}
	if (one.length > two.length) {
		return 1;
	}
	for (let i = 0; i < one.length; i++) {
		let comparison = compareChunk(one[i], two[i]);
		if (comparison !== 0) {
			return comparison;
		}
	}
	return 0;
};
