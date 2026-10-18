# Optional export-only scene update CPU regions

`sceneUpdateCpu` contains `terrainCpuMs`, `waterCpuMs`, and `hudCpuMs`. These are disjoint subsets of the existing inclusive `otherCallbackCpuMs`, not additional callback costs. They bracket the existing terrain update call, the water call within environment preparation, and the HUD update call respectively. No production call is moved or repeated. The terrain call can rebuild geometry and refresh textures, but does not call the separately bracketed environment water update.

The remaining callback work is explicitly unclassified. Offline cohorts derive `otherCallbackUnclassifiedCpuMs` only when all three subregions are available; missing old fields remain unknown, not zero. Non-finite derived remainders are rejected by the parser. A finite negative remainder is retained as evidence of inconsistent timing ownership rather than clamped away. Never add these regions to their inclusive parent or to nested pointer timings. A water reason bit reports key-change context, not measured duration or causal attribution.

Only existing visible F8 enablement creates/reuses the optional three-number sink and invokes the six boundary clock reads. F8-off, hidden and stale-scene paths create no sink and make no additional clock calls. Modal frames report observed zero for skipped regions. The sink resets each callback, and the recorder copies values into its bounded ring. Old captures remain readable. The actual export remains bounded to 2 MiB with explicit newest-contiguous-frame retention; extra optional fields can reduce retained frame count.

No overlay rows are added. The existing asynchronous GPU duration remains separate from CPU values. Tests cover raw ring interleaving, old/malformed values, actual environment call ordering and exceptions, disabled clocks, real animate propagation and actual Blob/parser/cohort behavior. This is instrumentation, not a performance optimization or a causal explanation of an existing recording.

The two changed held-drag source-owner slices (frame order and camera producers) were independently reviewed before their exact pins were refreshed. The other ten owner pins are unchanged.
