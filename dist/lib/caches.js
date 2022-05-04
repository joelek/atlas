"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cache = void 0;
const stdlib = require("@joelek/ts-stdlib");
;
class Cache {
    detail;
    map;
    status;
    purgeIfNecessary() {
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
    constructor(detail, maxWeight) {
        this.detail = detail ?? {
            getWeightForValue: () => 1
        };
        this.map = new stdlib.collections.lhm.LinkedHashMap();
        this.status = {
            weight: 0,
            maxWeight: maxWeight
        };
    }
    *[Symbol.iterator]() {
        yield* this.map;
    }
    clear() {
        for (let { key, value } of this.map) {
            this.detail.onRemove?.(key);
        }
        this.map.vacate();
        this.status.weight = 0;
    }
    insert(key, value) {
        let oldValue = this.map.lookup(key);
        if (oldValue != null) {
            this.status.weight -= this.detail.getWeightForValue(oldValue);
            this.detail.onRemove?.(key);
        }
        this.map.insert(key, value);
        this.status.weight += this.detail.getWeightForValue(value);
        this.detail.onInsert?.(key, value);
        this.purgeIfNecessary();
    }
    length() {
        return this.map.length();
    }
    lookup(key) {
        return this.map.lookup(key);
    }
    remove(key) {
        let value = this.map.lookup(key);
        if (value == null) {
            return;
        }
        this.status.weight -= this.detail.getWeightForValue(value);
        this.map.remove(key);
        this.detail.onRemove?.(key);
        return value;
    }
}
exports.Cache = Cache;
;
