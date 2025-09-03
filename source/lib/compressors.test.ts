import * as wtf from "@joelek/wtf";
import { RLECompressor } from "./compressors";

wtf.test(`RLECompressor should compress data.`, async (assert) => {
	let compressed = RLECompressor.compress(Uint8Array.of(0x01, 0x02, 0x03, 0x03, 0x03, 0x03));
	assert.equals(compressed, Uint8Array.of(0x01, 0x01, 0x02, 0x82, 0x03));
});

wtf.test(`RLECompressor should decompress data.`, async (assert) => {
	let decompressed = RLECompressor.decompress(Uint8Array.of(0x01, 0x01, 0x02, 0x82, 0x03), new Uint8Array(6));
	assert.equals(decompressed, Uint8Array.of(0x01, 0x02, 0x03, 0x03, 0x03, 0x03));
});

wtf.test(`RLECompressor should be robust.`, async (assert) => {
	for (let i = 0; i < 100000; i += 1) {
		let array = new Uint8Array(128);
		for (let j = 0; j < array.length; j += 1) {
			array[j] = Math.random() < 0.875 ? 0 : Math.floor(Math.random() * 256);
		}
		let compressed = RLECompressor.compress(array);
		if (compressed == null) {
			continue;
		}
		let decompressed = RLECompressor.decompress(compressed, new Uint8Array(array.length));
		assert.equals(decompressed, array);
	}
});
