import * as wtf from "@joelek/wtf";
import { RLECompressor } from "./compressors";

wtf.test(`RLECompressor should compress data.`, async (assert) => {
	let compressed = RLECompressor.compress(Uint8Array.of(0x01, 0x02, 0x03, 0x03, 0x03, 0x03));
	assert.equals(compressed, Uint8Array.of(0b00100000, 0b00010000, 0b00101011, 0b00000011));
});

wtf.test(`RLECompressor should decompress data.`, async (assert) => {
	let decompressed = RLECompressor.decompress(Uint8Array.of(0b00100000, 0b00010000, 0b00101011, 0b00000011));
	assert.equals(decompressed, Uint8Array.of(0x01, 0x02, 0x03, 0x03, 0x03, 0x03));
});
