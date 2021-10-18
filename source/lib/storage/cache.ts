import * as is from "../is";

type Primitive = boolean | null | number | string | undefined;

interface CacheDetail<B> {
	getWeightForValue(value: B): number;
};

type CacheStatus = {
	weight: number;
	maxWeight?: number;
};

export class Cache<A extends Primitive, B> {
	private detail: CacheDetail<B>;
	private map: Map<A, B>;
	private status: CacheStatus;

	private purgeIfNecessary(): void {
		if (is.present(this.status.maxWeight)) {
			for (let [key, last] of this.map.entries()) {
				if (this.status.weight <= this.status.maxWeight) {
					break;
				}
				this.status.weight -= this.detail.getWeightForValue(last);
				this.map.delete(key);
			}
		}
	}

	constructor(detail: CacheDetail<B>, maxWeight?: number) {
		this.detail = detail;
		this.map = new Map<A, B>();
		this.status = {
			weight: 0,
			maxWeight: maxWeight
		};
	}

	insert(key: A, value: B): void {
		this.remove(key);
		this.map.set(key, value);
		this.status.weight += this.detail.getWeightForValue(value);
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
		return value;
	}
};
