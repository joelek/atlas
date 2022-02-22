"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecreasingOrder = exports.IncreasingOrder = exports.Order = void 0;
const bedrock = require("@joelek/bedrock");
class Order {
    constructor() { }
}
exports.Order = Order;
;
class IncreasingOrder extends Order {
    constructor() {
        super();
    }
    compare(one, two) {
        let oneEncoded = bedrock.codecs.Any.encodePayload(one);
        let twoEncoded = bedrock.codecs.Any.encodePayload(two);
        return bedrock.utils.Chunk.comparePrefixes(oneEncoded, twoEncoded);
    }
}
exports.IncreasingOrder = IncreasingOrder;
class DecreasingOrder extends Order {
    constructor() {
        super();
    }
    compare(one, two) {
        let oneEncoded = bedrock.codecs.Any.encodePayload(one);
        let twoEncoded = bedrock.codecs.Any.encodePayload(two);
        return bedrock.utils.Chunk.comparePrefixes(twoEncoded, oneEncoded);
    }
}
exports.DecreasingOrder = DecreasingOrder;
