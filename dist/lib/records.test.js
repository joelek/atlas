"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const records = require("./records");
const test_1 = require("./test");
(0, test_1.test)(`It should encode records.`, async (assert) => {
    let rh = new records.RecordManager({
        firstname: new records.StringField(""),
        lastname: new records.StringField("")
    });
    let record = {
        firstname: "Joel",
        lastname: "Ek"
    };
    let observed = rh.decode(rh.encode(record));
    let expected = record;
    assert.record.equals(observed, expected);
});
(0, test_1.test)(`It should encode keys.`, async (assert) => {
    let rh = new records.RecordManager({
        firstname: new records.StringField(""),
        lastname: new records.StringField("")
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
