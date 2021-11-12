import * as files from "./files";
import * as vfs from "./vfs";
import { test } from "../test";
import { BlockFlags } from "./chunks";

test(`It should not support creating blocks with a size of 0.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let bh = new vfs.BlockHandler(file);
	await assert.throws(async () => {
		bh.createBlock(0);
	});
});

test(`It should allocate blocks in a logarithmic fashion.`, async (assert) => {
	for (let i = 1; i <= 16; i++) {
		let file = new files.VirtualFile(0);
		let bh = new vfs.BlockHandler(file);
		let id = bh.createBlock(i);
		assert.true(bh.getBlockSize(id) === Math.pow(2, Math.ceil(Math.log2(i))));
	}
});

test(`It should generate block ids starting at 0.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let bh = new vfs.BlockHandler(file);
	assert.true(bh.createBlock(1) === 0);
	assert.true(bh.createBlock(1) === 1);
	assert.true(bh.createBlock(1) === 2);
});

test(`It should keep track of the number of blocks.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let bh = new vfs.BlockHandler(file);
	assert.true(bh.getBlockCount() === 0);
	bh.createBlock(1);
	assert.true(bh.getBlockCount() === 1);
	bh.createBlock(1);
	assert.true(bh.getBlockCount() === 2);
});

test(`It should prevent operations from before a block.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let bh = new vfs.BlockHandler(file);
	let id = bh.createBlock(4);
	bh.writeBlock(id, Uint8Array.of(0, 1, 2, 3), 0);
	let buffer = new Uint8Array(2);
	await assert.throws(async () => {
		bh.readBlock(id, buffer, -3);
	});
});

test(`It should prevent operations from just before a block.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let bh = new vfs.BlockHandler(file);
	let id = bh.createBlock(4);
	bh.writeBlock(id, Uint8Array.of(0, 1, 2, 3), 0);
	let buffer = new Uint8Array(2);
	await assert.throws(async () => {
		bh.readBlock(id, buffer, -2);
	});
});

test(`It should prevent operations overlapping the beginning of a block.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let bh = new vfs.BlockHandler(file);
	let id = bh.createBlock(4);
	bh.writeBlock(id, Uint8Array.of(0, 1, 2, 3), 0);
	let buffer = new Uint8Array(2);
	await assert.throws(async () => {
		bh.readBlock(id, buffer, -1);
	});
});

test(`It should support operations at the beginning of a block.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let bh = new vfs.BlockHandler(file);
	let id = bh.createBlock(4);
	bh.writeBlock(id, Uint8Array.of(0, 1, 2, 3), 0);
	let buffer = new Uint8Array(2);
	bh.readBlock(id, buffer, 0);
	assert.binary.equals(buffer, Uint8Array.of(0, 1));
});

test(`It should support operations in the middle of a block`, async (assert) => {
	let file = new files.VirtualFile(0);
	let bh = new vfs.BlockHandler(file);
	let id = bh.createBlock(4);
	bh.writeBlock(id, Uint8Array.of(0, 1, 2, 3), 0);
	let buffer = new Uint8Array(2);
	bh.readBlock(id, buffer, 1);
	assert.binary.equals(buffer, Uint8Array.of(1, 2));
});

test(`It should support operations at the end of a block`, async (assert) => {
	let file = new files.VirtualFile(0);
	let bh = new vfs.BlockHandler(file);
	let id = bh.createBlock(4);
	bh.writeBlock(id, Uint8Array.of(0, 1, 2, 3), 0);
	let buffer = new Uint8Array(2);
	bh.readBlock(id, buffer, 2);
	assert.binary.equals(buffer, Uint8Array.of(2, 3));
});

test(`It should prevent operations overlapping the end of a block.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let bh = new vfs.BlockHandler(file);
	let id = bh.createBlock(4);
	bh.writeBlock(id, Uint8Array.of(0, 1, 2, 3), 0);
	let buffer = new Uint8Array(2);
	await assert.throws(async () => {
		bh.readBlock(id, buffer, 3);
	});
});

test(`It should prevent operations from just after a block.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let bh = new vfs.BlockHandler(file);
	let id = bh.createBlock(4);
	bh.writeBlock(id, Uint8Array.of(0, 1, 2, 3), 0);
	let buffer = new Uint8Array(2);
	await assert.throws(async () => {
		bh.readBlock(id, buffer, 4);
	});
});

test(`It should prevent operations from after a block.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let bh = new vfs.BlockHandler(file);
	let id = bh.createBlock(4);
	bh.writeBlock(id, Uint8Array.of(0, 1, 2, 3), 0);
	let buffer = new Uint8Array(2);
	await assert.throws(async () => {
		bh.readBlock(id, buffer, 5);
	});
});

test(`It should support swapping two blocks.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let bh = new vfs.BlockHandler(file);
	let idOne = bh.createBlock(2);
	let idTwo = bh.createBlock(4);
	bh.writeBlock(idOne, Uint8Array.of(0, 1), 0);
	bh.writeBlock(idTwo, Uint8Array.of(2, 3, 4, 5), 0);
	bh.swapBlocks(idOne, idTwo);
	assert.true(bh.getBlockSize(idOne) === 4);
	assert.true(bh.getBlockSize(idTwo) === 2);
	assert.binary.equals(bh.readBlock(idOne, new Uint8Array(4), 0), Uint8Array.of(2, 3, 4, 5));
	assert.binary.equals(bh.readBlock(idTwo, new Uint8Array(2), 0), Uint8Array.of(0, 1));
});

test(`It should prevent swapping two blocks when block one is deleted.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let bh = new vfs.BlockHandler(file);
	let idOne = bh.createBlock(2);
	let idTwo = bh.createBlock(4);
	bh.deleteBlock(idOne);
	await assert.throws(async () => {
		bh.swapBlocks(idOne, idTwo);
	});
});

test(`It should prevent swapping two blocks when block two is deleted.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let bh = new vfs.BlockHandler(file);
	let idOne = bh.createBlock(2);
	let idTwo = bh.createBlock(4);
	bh.deleteBlock(idTwo);
	await assert.throws(async () => {
		bh.swapBlocks(idOne, idTwo);
	});
});

test(`It should prevent swapping two blocks when both blocks are deleted.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let bh = new vfs.BlockHandler(file);
	let idOne = bh.createBlock(2);
	let idTwo = bh.createBlock(4);
	bh.deleteBlock(idOne);
	bh.deleteBlock(idTwo);
	await assert.throws(async () => {
		bh.swapBlocks(idOne, idTwo);
	});
});

test(`It should support increasing the size of a block.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let bh = new vfs.BlockHandler(file);
	let id = bh.createBlock(2);
	bh.writeBlock(id, Uint8Array.of(0, 1), 0);
	bh.resizeBlock(id, 4);
	assert.true(bh.getBlockSize(id) === 4);
	assert.binary.equals(bh.readBlock(id, new Uint8Array(4), 0), Uint8Array.of(0, 1, 0, 0));
});

test(`It should support decreasing the size of a block.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let bh = new vfs.BlockHandler(file);
	let id = bh.createBlock(4);
	bh.writeBlock(id, Uint8Array.of(0, 1, 2, 3), 0);
	bh.resizeBlock(id, 2);
	assert.true(bh.getBlockSize(id) === 2);
	assert.binary.equals(bh.readBlock(id, new Uint8Array(2), 0), Uint8Array.of(0, 1));
});

test(`It should prevent resizing deleted blocks`, async (assert) => {
	let file = new files.VirtualFile(0);
	let bh = new vfs.BlockHandler(file);
	let id = bh.createBlock(1);
	bh.deleteBlock(id);
	await assert.throws(async () => {
		bh.resizeBlock(id, 2);
	});
});

test(`It should support clearing a block.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let bh = new vfs.BlockHandler(file);
	let id = bh.createBlock(4);
	bh.writeBlock(id, Uint8Array.of(0, 1, 2, 3), 0);
	bh.clearBlock(id);
	assert.binary.equals(bh.readBlock(id, new Uint8Array(4), 0), Uint8Array.of(0, 0, 0, 0));
});

test(`It should prevent clearing a deleted block.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let bh = new vfs.BlockHandler(file);
	let id = bh.createBlock(1);
	bh.deleteBlock(id);
	await assert.throws(async () => {
		bh.clearBlock(id);
	});
});

test(`It should support cloning a block.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let bh = new vfs.BlockHandler(file);
	let idOne = bh.createBlock(2);
	let idTwo = bh.cloneBlock(idOne);
	assert.true(idOne !== idTwo);
	assert.true(bh.getBlockSize(idOne) === bh.getBlockSize(idTwo));
});

test(`It should support cloning the contents of a block.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let bh = new vfs.BlockHandler(file);
	let idOne = bh.createBlock(2);
	bh.writeBlock(idOne, Uint8Array.of(0, 1), 0);
	let idTwo = bh.cloneBlock(idOne);
	assert.binary.equals(bh.readBlock(idOne, new Uint8Array(2), 0), Uint8Array.of(0, 1));
	assert.binary.equals(bh.readBlock(idTwo, new Uint8Array(2), 0), Uint8Array.of(0, 1));
});

test(`It should use separate storage for two cloned blocks.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let bh = new vfs.BlockHandler(file);
	let idOne = bh.createBlock(2);
	bh.writeBlock(idOne, Uint8Array.of(0, 1), 0);
	let idTwo = bh.cloneBlock(idOne);
	bh.writeBlock(idOne, Uint8Array.of(2, 3), 0);
	assert.binary.equals(bh.readBlock(idOne, new Uint8Array(2), 0), Uint8Array.of(2, 3));
	assert.binary.equals(bh.readBlock(idTwo, new Uint8Array(2), 0), Uint8Array.of(0, 1));
});

test(`It should prevent cloning a deleted block.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let bh = new vfs.BlockHandler(file);
	let id = bh.createBlock(1);
	bh.deleteBlock(id);
	await assert.throws(async () => {
		bh.cloneBlock(id);
	});
});

test(`It should support deleting a block.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let bh = new vfs.BlockHandler(file);
	let id = bh.createBlock(1);
	bh.deleteBlock(id);
});

test(`It should support deleting multiple blocks.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let bh = new vfs.BlockHandler(file);
	let idOne = bh.createBlock(1);
	let idTwo = bh.createBlock(1);
	bh.deleteBlock(idOne);
	bh.deleteBlock(idTwo);
});

test(`It should re-use deleted blocks.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let bh = new vfs.BlockHandler(file);
	let idOne = bh.createBlock(1);
	bh.deleteBlock(idOne);
	assert.true(bh.createBlock(1) === idOne);
});

test(`It should re-use multiple deleted blocks.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let bh = new vfs.BlockHandler(file);
	let idOne = bh.createBlock(1);
	let idTwo = bh.createBlock(1);
	bh.deleteBlock(idOne);
	bh.deleteBlock(idTwo);
	assert.true(bh.createBlock(1) === idTwo);
	assert.true(bh.createBlock(1) === idOne);
});

test(`It should clear re-used blocks.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let bh = new vfs.BlockHandler(file);
	let idOne = bh.createBlock(1);
	bh.writeBlock(idOne, Uint8Array.of(1), 0);
	bh.deleteBlock(idOne);
	let idTwo = bh.createBlock(1);
	assert.binary.equals(bh.readBlock(idTwo, new Uint8Array(1), 0), Uint8Array.of(0));
});

test(`It should prevent deleting a deleted block.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let bh = new vfs.BlockHandler(file);
	let id = bh.createBlock(1);
	bh.deleteBlock(id);
	await assert.throws(async () => {
		bh.deleteBlock(id);
	});
});

test(`It should prevent writing to deleted blocks.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let bh = new vfs.BlockHandler(file);
	let id = bh.createBlock(1);
	bh.deleteBlock(id);
	await assert.throws(async () => {
		bh.writeBlock(id, new Uint8Array(1), 0);
	});
});

test(`It should prevent reading from deleted blocks.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let bh = new vfs.BlockHandler(file);
	let id = bh.createBlock(1);
	bh.deleteBlock(id);
	await assert.throws(async () => {
		bh.readBlock(id, new Uint8Array(1), 0);
	});
});

test(`It should recycle system blocks that get deleted during the deletion of an application block.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let bh = new vfs.BlockHandler(file, {
		initialPoolCapacity: 1
	});
	let idOne = bh.createBlock(8);
	bh.deleteBlock(idOne);
	let idTwo = bh.createBlock(8);
	assert.true(idOne === idTwo);
	bh.createBlock(8);
	assert.true(bh.getBlockCount() === 2);
});

test(`It should support storing block flags.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let bh = new vfs.BlockHandler(file);
	let id = bh.createBlock(1);
	bh.setBlockFlag(id, BlockFlags.APPLICATION_0, true);
	assert.true(bh.getBlockFlag(id, BlockFlags.APPLICATION_0) === true);
});

test(`It should prevent setting flags for deleted blocks.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let bh = new vfs.BlockHandler(file);
	let id = bh.createBlock(1);
	bh.deleteBlock(id);
	await assert.throws(async () => {
		bh.setBlockFlag(id, BlockFlags.APPLICATION_0, true);
	});
});

test(`It should clear block flags when deleting blocks.`, async (assert) => {
	let file = new files.VirtualFile(0);
	let bh = new vfs.BlockHandler(file);
	let idOne = bh.createBlock(1);
	bh.setBlockFlag(idOne, BlockFlags.APPLICATION_0, true);
	bh.deleteBlock(idOne);
	let idTwo = bh.createBlock(1);
	assert.true(idOne === idTwo);
	assert.true(bh.getBlockFlag(idTwo, BlockFlags.APPLICATION_0) === false);
});
