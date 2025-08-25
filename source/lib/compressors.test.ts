import * as wtf from "@joelek/wtf";
import { CompressionFailureError, RLECompressor } from "./compressors";

wtf.test(`RLECompressor should compress data.`, async (assert) => {
	let compressed = RLECompressor.compress(Uint8Array.of(0x01, 0x02, 0x03, 0x03, 0x03, 0x03));
	assert.equals(compressed, Uint8Array.of(0b00100000, 0b00010000, 0b00101011, 0b00000011));
});

wtf.test(`RLECompressor should decompress data.`, async (assert) => {
	let decompressed = RLECompressor.decompress(Uint8Array.of(0b00100000, 0b00010000, 0b00101011, 0b00000011), new Uint8Array(6));
	assert.equals(decompressed, Uint8Array.of(0x01, 0x02, 0x03, 0x03, 0x03, 0x03));
});

wtf.test(`RLECompressor should be robust.`, async (assert) => {
	let count = 0;
	let factors = [] as Array<number>;
	let start = Date.now();
	for (let i = 0; i < 100000; i += 1) {
		let array = new Uint8Array(128);
		for (let j = 0; j < array.length; j += 1) {
			array[j] = Math.random() < 0.875 ? 0 : Math.floor(Math.random() * 256);
		}
		try {
			let compressed = RLECompressor.compress(array);
			let decompressed = RLECompressor.decompress(compressed, new Uint8Array(array.length));
			assert.equals(decompressed, array);
			count += 1;
			factors.push(compressed.length / decompressed.length);
		} catch (error) {
			if (error instanceof CompressionFailureError) {
				continue;
			}
			throw error;
		}
	}
	let duration = Date.now() - start;
	factors.sort();
	// console.log(`Duration: ${duration/100000} ms/cycle, Success: ${count/100000*100}%, Min: ${factors[0]}, Med: ${factors[factors.length >> 1]}, Max: ${factors[factors.length - 1]}`);
});
