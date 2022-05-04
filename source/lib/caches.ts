import * as stdlib from "@joelek/ts-stdlib";

export type Primitive = boolean | null | number | string | undefined;

export interface CacheDetail<A, B> {
	getWeightForValue(value: B): number;
	onInsert?(key: A, value: B): void;
	onRemove?(key: A): void;
};

export type CacheStatus = {
	weight: number;
	maxWeight?: number;
};

export type CacheEntry<A extends Primitive, B> = {
	key: A;
	value: B;
};

export class Cache<B> {
	private detail: CacheDetail<number, B>;
	private map: stdlib.collections.lhm.LinkedHashMap<B>;
	private status: CacheStatus;

	private purgeIfNecessary(): void {
		if (this.status.maxWeight != null) {
			for (let { key, value } of this.map) {
				if (this.status.weight <= this.status.maxWeight) {
					break;
				}
				this.status.weight -= this.detail.getWeightForValue(value);
				this.map.remove(key);
				this.detail.onRemove?.(key);
			}
		}
	}

	constructor(detail?: CacheDetail<number, B>, maxWeight?: number) {
		this.detail = detail ?? {
			getWeightForValue: () => 1
		};
		this.map = new stdlib.collections.lhm.LinkedHashMap<B>();
		this.status = {
			weight: 0,
			maxWeight: maxWeight
		};
	}

	* [Symbol.iterator](): Iterator<CacheEntry<number, B>> {
		yield * this.map;
	}

	clear(): void {
		for (let { key, value } of this.map) {
			this.detail.onRemove?.(key);
		}
		this.map.vacate();
		this.status.weight = 0;
	}

	insert(key: number, value: B): void {
		this.remove(key);
		this.map.insert(key, value);
		this.status.weight += this.detail.getWeightForValue(value);
		this.detail.onInsert?.(key, value);
		this.purgeIfNecessary();
	}

	length(): number {
		return this.map.length();
	}

	lookup(key: number): B | undefined {
		return this.map.lookup(key);
	}

	remove(key: number): B | undefined {
		let value = this.map.lookup(key);
		if (value == null) {
			return;
		}
		this.status.weight -= this.detail.getWeightForValue(value);
		this.map.remove(key);
		this.detail.onRemove?.(key);
		return value;
	}
};
