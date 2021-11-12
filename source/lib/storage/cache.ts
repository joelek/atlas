import * as is from "../is";

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

export class Cache<A extends Primitive, B> {
	private detail: CacheDetail<A, B>;
	private map: Map<A, B>;
	private status: CacheStatus;

	private purgeIfNecessary(): void {
		if (is.present(this.status.maxWeight)) {
			for (let [key, value] of this.map.entries()) {
				if (this.status.weight <= this.status.maxWeight) {
					break;
				}
				this.status.weight -= this.detail.getWeightForValue(value);
				this.map.delete(key);
				this.detail.onRemove?.(key);
			}
		}
	}

	constructor(detail?: CacheDetail<A, B>, maxWeight?: number) {
		this.detail = detail ?? {
			getWeightForValue: () => 1
		};
		this.map = new Map<A, B>();
		this.status = {
			weight: 0,
			maxWeight: maxWeight
		};
	}

	[Symbol.iterator](): Iterator<[A, B]> {
		return this.map[Symbol.iterator]();
	}

	clear(): void {
		this.map.clear();
		this.status.weight = 0;
	}

	insert(key: A, value: B): void {
		this.remove(key);
		this.map.set(key, value);
		this.status.weight += this.detail.getWeightForValue(value);
		this.detail.onInsert?.(key, value);
		this.purgeIfNecessary();
	}

	length(): number {
		return this.map.size;
	}

	lookup(key: A): B | undefined {
		return this.map.get(key);
	}

	remove(key: A): B | undefined {
		let value = this.map.get(key);
		if (is.absent(value)) {
			return;
		}
		this.status.weight -= this.detail.getWeightForValue(value);
		this.map.delete(key);
		this.detail.onRemove?.(key);
		return value;
	}
};
