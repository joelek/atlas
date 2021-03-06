import * as bedrock from "@joelek/bedrock";
import { Record, Value } from "./records";
import { Direction } from "./trees";

export abstract class Order<A extends Value> {
	constructor() {}

	abstract compare(one: A, two: A): number;
	abstract getDirection(): Direction;
};

export class IncreasingOrder<A extends Value> extends Order<A> {
	constructor() {
		super();
	}

	compare(one: A, two: A): number {
		let oneEncoded = bedrock.codecs.Any.encodePayload(one);
		let twoEncoded = bedrock.codecs.Any.encodePayload(two);
		return bedrock.utils.Chunk.comparePrefixes(oneEncoded, twoEncoded);
	}

	getDirection(): Direction {
		return "increasing";
	}
}

export class DecreasingOrder<A extends Value> extends Order<A> {
	constructor() {
		super();
	}

	compare(one: A, two: A): number {
		let oneEncoded = bedrock.codecs.Any.encodePayload(one);
		let twoEncoded = bedrock.codecs.Any.encodePayload(two);
		return bedrock.utils.Chunk.comparePrefixes(twoEncoded, oneEncoded);
	}

	getDirection(): Direction {
		return "decreasing";
	}
}

export type OrderMap<A extends Record> = {
	[C in keyof A]?: Order<A[C]>;
};

export type Orders<A extends Record> = {
	[C in keyof A]: Order<A[C]>;
};
