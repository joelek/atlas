# @joelek/billy

Relational database built on the Älmhult Cabinet storage system.

## Roadmap

* Implement transactions for ACID-compliance.
* Decide on whether or not to support encryption.
* Achieve referential integrity through linked columns.
* Improve cache by keeping track of cache hits and misses and use information during purge.
* Add support for creating blocks with zero size with an additional control mechanism.
* Investigate stalling behaviour occuring after writing 1 572 945 entries without synchronizing.
