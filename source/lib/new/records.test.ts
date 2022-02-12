import * as records from "./records";
import { test } from "../test";
import { BlockHandler } from "./vfs";
import { VirtualFile } from "./files";

test(`It should encode records.`, async (assert) => {
	let blockHandler = new BlockHandler(new VirtualFile(0));
	let rh = new records.RecordManager({
		firstname: records.StringFieldManager.construct(blockHandler, null),
		lastname: records.StringFieldManager.construct(blockHandler, null)
	});
	let record = {
		firstname: "Joel",
		lastname: "Ek"
	};
	let observed = rh.decode(rh.encode(record));
	let expected = record;
	assert.record.equals(observed, expected);
});

test(`It should encode keys.`, async (assert) => {
	let blockHandler = new BlockHandler(new VirtualFile(0));
	let rh = new records.RecordManager({
		firstname: records.StringFieldManager.construct(blockHandler, null),
		lastname: records.StringFieldManager.construct(blockHandler, null)
	});
	let record = {
		firstname: "Joel",
		lastname: "Ek"
	};
	let observed = rh.decodeKeys(["firstname"], rh.encodeKeys(["firstname"], record));
	let expected = {
		firstname: "Joel"
	};
	assert.record.equals(observed, expected);
});
