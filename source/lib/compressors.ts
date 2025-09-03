function compress_data_using_rle_coding(source: Uint8Array): Uint8Array | undefined {
	let target = new Uint8Array(source.length);
	let source_offset = 0;
	let target_offset = 0;
	while (source_offset < source.length) {
		let raw_length = 1;
		for (let byte_index = source_offset + 1; byte_index < source.length; byte_index += 1) {
			if (source[byte_index] !== source[byte_index - 1]) {
				raw_length += 1;
				if (raw_length - 1 === 127) {
					break;
				}
			} else {
				raw_length -= 1;
				break;
			}
		}
		if (raw_length > 0) {
			target[target_offset++] = 0x00 | (raw_length - 1);
			target.set(source.subarray(source_offset, source_offset + raw_length), target_offset);
			source_offset += raw_length;
			target_offset += raw_length;
		}
		let run_length = 1;
		for (let byte_index = source_offset + 1; byte_index < source.length; byte_index += 1) {
			if (source[byte_index] === source[byte_index - 1]) {
				run_length += 1;
				if (run_length - 2 === 127) {
					break;
				}
			} else {
				break;
			}
		}
		if (run_length > 1) {
			target[target_offset++] = 0x80 | (run_length - 2);
			target[target_offset++] = source[source_offset];
			source_offset += run_length;
		}
	}
	if (target_offset > target.length) {
		return;
	}
	return target.subarray(0, target_offset);
};

function decompress_data_using_rle_coding(source: Uint8Array, target: Uint8Array): Uint8Array {
	let source_offset = 0;
	let target_offset = 0;
	while (target_offset < target.length) {
		let control = source[source_offset++];
		if (control & 0x80) {
			let run_length = 2 + (control & 0x7F);
			let byte = source[source_offset++];
			target.fill(byte, target_offset, target_offset + run_length);
			target_offset += run_length;
		} else {
			let raw_length = 1 + (control & 0x7F);
			target.set(source.subarray(source_offset, source_offset + raw_length), target_offset);
			source_offset += raw_length;
			target_offset += raw_length;
		}
	}
	return target;
};

export const RLECompressor = {
	compress: compress_data_using_rle_coding,
	decompress: decompress_data_using_rle_coding
};
