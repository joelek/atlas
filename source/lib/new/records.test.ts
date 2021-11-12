import * as records from "./records";
import { test } from "../test";

test(`It should encode records.`, async (assert) => {
	let rh = new records.RecordManager({
		firstname: new records.StringFieldManager(),
		lastname: new records.StringFieldManager()
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
	let rh = new records.RecordManager({
		firstname: new records.StringFieldManager(),
		lastname: new records.StringFieldManager()
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
