"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cache = void 0;
;
class Cache {
    detail;
    map;
    status;
    purgeIfNecessary() {
        if (this.status.maxWeight != null) {
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
    constructor(detail, maxWeight) {
        this.detail = detail ?? {
            getWeightForValue: () => 1
        };
        this.map = new Map();
        this.status = {
            weight: 0,
            maxWeight: maxWeight
        };
    }
    *[Symbol.iterator]() {
        for (let tuple of this.map) {
            yield {
                key: tuple[0],
                value: tuple[1]
            };
        }
    }
    clear() {
        for (let [key, value] of this.map) {
            this.detail.onRemove?.(key);
        }
        this.map.clear();
        this.status.weight = 0;
    }
    insert(key, value) {
        this.remove(key);
        this.map.set(key, value);
        this.status.weight += this.detail.getWeightForValue(value);
        this.detail.onInsert?.(key, value);
        this.purgeIfNecessary();
    }
    length() {
        return this.map.size;
    }
    lookup(key) {
        return this.map.get(key);
    }
    remove(key) {
        let value = this.map.get(key);
        if (value == null) {
            return;
        }
        this.status.weight -= this.detail.getWeightForValue(value);
        this.map.delete(key);
        this.detail.onRemove?.(key);
        return value;
    }
}
exports.Cache = Cache;
;
