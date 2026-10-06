# Issue 225 implementation evidence

Source: `55c684cd2c4cc80a7e06786e24f0d87f4a0a5cd5`, PR 226. The only runtime change initializes the existing Land Bridge component once at authored reward birth. The generic constructor, cast producer, controller arithmetic and old-checkpoint decoding are unchanged.

- [Independent source review](implementation-review.md): ACCEPT through55c684c, not yet merge-ready.
- [Driver and native evidence review](driver-native-review.md): ACCEPT within the stated component/source limits.
- [Failure-first receipt](failure-first.json): expected exit1 on unmodified runtime. [After receipt](after-focused.json): exit0, all5 tests pass with identical test bytes. [Correspondence](source-correspondence.json) maps those dirty-source executions to the committed runtime/test hashes; they are not relabeled executions at the final commit.
- [Updated native receipt](native-authored-command.json): exit0 on clean55c684c, 5 authored producers and315 native controller visits. [Snapshots](native-authored.json) preserve first/next state, both RNG streams and ordered requests. Mapped-PE startup RNG values are0; original trail/notification consumers remain intercepted.
- [Prepared browser driver](candidate.mjs): NOT RUN. [Provenance](driver-provenance.json) and [13-line delta](pr191-driver-delta.patch) retain PR191's route and active/completed Save/Load flow. Only observed initialized-cache and post-Load cache assertions are added; no exact birth-turn expectation, observer or live-world mutation.

[Manifest](manifest.json) hashes the byte-identical, explicitly allowlisted artifacts. No binary game inputs, assets, profiles, credential/environment files or package trees are included.

Remaining gates: adopt the accepted Erosion main for combined-source validation, generic bridge regression, standard check/build, TypeScript quality including legacy deltas, ordinary shrine/save rendered acceptance and captured-terrain native replay. These remain pending; the driver review is not a browser result. No absolute native clock, full allocation/RNG, rendering/audio or new parity claim.
