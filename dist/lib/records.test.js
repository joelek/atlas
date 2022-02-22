"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const records = require("./records");
const test_1 = require("./test");
const vfs_1 = require("./vfs");
const files_1 = require("./files");
(0, test_1.test)(`It should encode records.`, async (assert) => {
    let blockHandler = new vfs_1.BlockHandler(new files_1.VirtualFile(0));
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
(0, test_1.test)(`It should encode keys.`, async (assert) => {
    let blockHandler = new vfs_1.BlockHandler(new files_1.VirtualFile(0));
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
