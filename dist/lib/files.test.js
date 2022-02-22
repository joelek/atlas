"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const files = require("./files");
const test_1 = require("./test");
const constructors = {
    CachedFile: () => new files.CachedFile(new files.VirtualFile(0)),
    DurableFile: () => new files.DurableFile(new files.VirtualFile(0), new files.VirtualFile(0)),
    PhysicalFile: () => new files.PhysicalFile("./private/test.bin", true),
    VirtualFile: () => new files.VirtualFile(0)
};
for (let key in constructors) {
    let constructor = constructors[key];
    (0, test_1.test)(`It should support increasing in size (${key}).`, async (assert) => {
        let file = constructor();
        file.resize(0);
        file.write(Uint8Array.of(1), 0);
        assert.true(file.size() === 1);
        file.resize(2);
        assert.true(file.size() === 2);
        let buffer = file.read(new Uint8Array(2), 0);
        assert.true(buffer[0] === 1);
        assert.true(buffer[1] === 0);
    });
    (0, test_1.test)(`It should support decreasing in size (${key}).`, async (assert) => {
        let file = constructor();
        file.resize(0);
        file.write(Uint8Array.of(1, 2), 0);
        assert.true(file.size() === 2);
        file.resize(1);
        assert.true(file.size() === 1);
        let buffer = file.read(new Uint8Array(1), 0);
        assert.true(buffer[0] === 1);
    });
    (0, test_1.test)(`It should support writing before the end (${key}).`, async (assert) => {
        let file = constructor();
        file.resize(3);
        file.write(Uint8Array.of(2, 3), 1);
        assert.true(file.size() === 3);
        let buffer = file.read(new Uint8Array(3), 0);
        assert.true(buffer[0] === 0);
        assert.true(buffer[1] === 2);
        assert.true(buffer[2] === 3);
    });
    (0, test_1.test)(`It should support writing at the end (${key}).`, async (assert) => {
        let file = constructor();
        file.resize(1);
        file.write(Uint8Array.of(2, 3), 1);
        assert.true(file.size() === 3);
        let buffer = file.read(new Uint8Array(3), 0);
        assert.true(buffer[0] === 0);
        assert.true(buffer[1] === 2);
        assert.true(buffer[2] === 3);
    });
    (0, test_1.test)(`It should support writing past the end (${key}).`, async (assert) => {
        let file = constructor();
        file.resize(0);
        file.write(Uint8Array.of(2, 3), 1);
        assert.true(file.size() === 3);
        let buffer = file.read(new Uint8Array(3), 0);
        assert.true(buffer[0] === 0);
        assert.true(buffer[1] === 2);
        assert.true(buffer[2] === 3);
    });
}
(0, test_1.test)(`It should not persist truncated data (DurableFile).`, async (assert) => {
    let bin = new files.VirtualFile(0);
    let log = new files.VirtualFile(0);
    let file = new files.DurableFile(bin, log);
    file.write(Uint8Array.of(1, 2), 0);
    file.resize(1);
    file.resize(2);
    file.persist();
    let buffer = bin.read(new Uint8Array(2), 0);
    assert.true(buffer[0] === 1);
    assert.true(buffer[1] === 0);
});
(0, test_1.test)(`It should support writing before a cached range (CachedFile).`, async (assert) => {
    let file = new files.VirtualFile(10);
    let cached = new files.CachedFile(file);
    cached.read(new Uint8Array(4), 3);
    file.write(Uint8Array.of(1, 1, 1, 1, 1, 1, 1, 1, 1, 1), 0);
    cached.write(Uint8Array.of(2, 2), 0);
    assert.binary.equals(cached.read(new Uint8Array(10), 0), Uint8Array.of(2, 2, 1, 0, 0, 0, 0, 1, 1, 1));
    assert.binary.equals(file.read(new Uint8Array(10), 0), Uint8Array.of(2, 2, 1, 1, 1, 1, 1, 1, 1, 1));
});
(0, test_1.test)(`It should support writing just before a cached range (CachedFile).`, async (assert) => {
    let file = new files.VirtualFile(10);
    let cached = new files.CachedFile(file);
    cached.read(new Uint8Array(4), 3);
    file.write(Uint8Array.of(1, 1, 1, 1, 1, 1, 1, 1, 1, 1), 0);
    cached.write(Uint8Array.of(2, 2), 1);
    assert.binary.equals(cached.read(new Uint8Array(10), 0), Uint8Array.of(1, 2, 2, 0, 0, 0, 0, 1, 1, 1));
    assert.binary.equals(file.read(new Uint8Array(10), 0), Uint8Array.of(1, 2, 2, 1, 1, 1, 1, 1, 1, 1));
});
(0, test_1.test)(`It should support writing overlapping the beginning of a cached range (CachedFile).`, async (assert) => {
    let file = new files.VirtualFile(10);
    let cached = new files.CachedFile(file);
    cached.read(new Uint8Array(4), 3);
    file.write(Uint8Array.of(1, 1, 1, 1, 1, 1, 1, 1, 1, 1), 0);
    cached.write(Uint8Array.of(2, 2), 2);
    assert.binary.equals(cached.read(new Uint8Array(10), 0), Uint8Array.of(1, 1, 2, 2, 0, 0, 0, 1, 1, 1));
    assert.binary.equals(file.read(new Uint8Array(10), 0), Uint8Array.of(1, 1, 2, 2, 1, 1, 1, 1, 1, 1));
});
(0, test_1.test)(`It should support writing at the beginning of a cached range (CachedFile).`, async (assert) => {
    let file = new files.VirtualFile(10);
    let cached = new files.CachedFile(file);
    cached.read(new Uint8Array(4), 3);
    file.write(Uint8Array.of(1, 1, 1, 1, 1, 1, 1, 1, 1, 1), 0);
    cached.write(Uint8Array.of(2, 2), 3);
    assert.binary.equals(cached.read(new Uint8Array(10), 0), Uint8Array.of(1, 1, 1, 2, 2, 0, 0, 1, 1, 1));
    assert.binary.equals(file.read(new Uint8Array(10), 0), Uint8Array.of(1, 1, 1, 2, 2, 1, 1, 1, 1, 1));
});
(0, test_1.test)(`It should support writing embedding into a cached range (CachedFile).`, async (assert) => {
    let file = new files.VirtualFile(10);
    let cached = new files.CachedFile(file);
    cached.read(new Uint8Array(4), 3);
    file.write(Uint8Array.of(1, 1, 1, 1, 1, 1, 1, 1, 1, 1), 0);
    cached.write(Uint8Array.of(2, 2), 4);
    assert.binary.equals(cached.read(new Uint8Array(10), 0), Uint8Array.of(1, 1, 1, 0, 2, 2, 0, 1, 1, 1));
    assert.binary.equals(file.read(new Uint8Array(10), 0), Uint8Array.of(1, 1, 1, 1, 2, 2, 1, 1, 1, 1));
});
(0, test_1.test)(`It should support writing at the end of a cached range (CachedFile).`, async (assert) => {
    let file = new files.VirtualFile(10);
    let cached = new files.CachedFile(file);
    cached.read(new Uint8Array(4), 3);
    file.write(Uint8Array.of(1, 1, 1, 1, 1, 1, 1, 1, 1, 1), 0);
    cached.write(Uint8Array.of(2, 2), 5);
    assert.binary.equals(cached.read(new Uint8Array(10), 0), Uint8Array.of(1, 1, 1, 0, 0, 2, 2, 1, 1, 1));
    assert.binary.equals(file.read(new Uint8Array(10), 0), Uint8Array.of(1, 1, 1, 1, 1, 2, 2, 1, 1, 1));
});
(0, test_1.test)(`It should support writing overlapping the end of a cached range (CachedFile).`, async (assert) => {
    let file = new files.VirtualFile(10);
    let cached = new files.CachedFile(file);
    cached.read(new Uint8Array(4), 3);
    file.write(Uint8Array.of(1, 1, 1, 1, 1, 1, 1, 1, 1, 1), 0);
    cached.write(Uint8Array.of(2, 2), 6);
    assert.binary.equals(cached.read(new Uint8Array(10), 0), Uint8Array.of(1, 1, 1, 0, 0, 0, 2, 2, 1, 1));
    assert.binary.equals(file.read(new Uint8Array(10), 0), Uint8Array.of(1, 1, 1, 1, 1, 1, 2, 2, 1, 1));
});
(0, test_1.test)(`It should support writing just after a cached range (CachedFile).`, async (assert) => {
    let file = new files.VirtualFile(10);
    let cached = new files.CachedFile(file);
    cached.read(new Uint8Array(4), 3);
    file.write(Uint8Array.of(1, 1, 1, 1, 1, 1, 1, 1, 1, 1), 0);
    cached.write(Uint8Array.of(2, 2), 7);
    assert.binary.equals(cached.read(new Uint8Array(10), 0), Uint8Array.of(1, 1, 1, 0, 0, 0, 0, 2, 2, 1));
    assert.binary.equals(file.read(new Uint8Array(10), 0), Uint8Array.of(1, 1, 1, 1, 1, 1, 1, 2, 2, 1));
});
(0, test_1.test)(`It should support writing after a cached range (CachedFile).`, async (assert) => {
    let file = new files.VirtualFile(10);
    let cached = new files.CachedFile(file);
    cached.read(new Uint8Array(4), 3);
    file.write(Uint8Array.of(1, 1, 1, 1, 1, 1, 1, 1, 1, 1), 0);
    cached.write(Uint8Array.of(2, 2), 8);
    assert.binary.equals(cached.read(new Uint8Array(10), 0), Uint8Array.of(1, 1, 1, 0, 0, 0, 0, 1, 2, 2));
    assert.binary.equals(file.read(new Uint8Array(10), 0), Uint8Array.of(1, 1, 1, 1, 1, 1, 1, 1, 2, 2));
});
