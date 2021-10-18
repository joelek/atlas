# @joelek/billy

Relational database built on the Älmhult Cabinet storage system.

## Roadmap

* Implement transactions for ACID-compliance.
* Decide on whether or not to support encryption.
* Achieve referential integrity through linked columns.
* Improve cache by keeping track of cache hits and misses and use information during purge.
* Add support for creating blocks with zero size with an additional control mechanism.
* Investigate stalling behaviour occuring after writing 1 572 945 entries without synchronizing.
* Add support for smaller address spaces for RobinHoodHash.
* Investigate possibility of adding offset computation to RobinHoodHash.
* Improve iterators for RobinHoodHash.
* Optimize RobinHoodHash with minProbeDistance and maxProbeDistance.
* Add support for storing null values in CompressedTrie.
* Optimize CompressedTrie by storing total for each child within the node.
* Optimize CompressedTrie by storing leaf residents at parent node.
* Improve iterators for CompressedTrie.
* Add support for smaller address spaces for CompressedTrie.
* Investigate possibility of removing parent pointers from CompressedTrie through recursive calls.
* Improve types wrapping buffers.
