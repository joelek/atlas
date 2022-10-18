"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const wtf = require("@joelek/wtf");
const records = require("./records");
wtf.test(`It should encode records.`, async (assert) => {
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
    assert.equals(observed, expected);
});
wtf.test(`It should encode keys.`, async (assert) => {
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
    assert.equals(observed, expected);
});
