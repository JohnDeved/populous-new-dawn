# #214 final style delta and evidence carry

Decision: **ACCEPT** source preflight at
`d8897cf8eeac1886d2f653af2cad0674c6bfa91a`.
Explicitly approve carrying the full 1,126-test outcomes and parity/orchestration
results from `3123edf97dce9dc13fd3510cdb3ad1d15aedc160` across this exact delta.
This is reviewed carry, not a claim that the full suite ran on d8897cf.

The full delta contains only two changes:

1. `animationUsesLogicalVisits` replaces
   `const mode = rules.animationDescriptors[p.draw].mode` with
   `const { mode } = rules.animationDescriptors[p.draw]`.
   Both evaluate the same descriptor lookup once and read its mode once. The
   descriptor is the existing imported JSON data, not an accessor/proxy producer.
   Gate conditions, call order, frames, stamps and return values are unchanged.
2. The Splash logical predicate is wrapped across lines without a token or
   evaluation-order change.

No tests, rules/data, controller paths, metadata/parity files, manifest checks,
package files or dependency locks changed. No clock or observer boundary moved.
The source and test assertions accepted in the prior reviews therefore retain
their meaning. A second 1,126-test run or parity rerun is not required for this
exact style change; substantive later edits would need a new impact decision.

Independently verified the original full-check receipt and raw log hashes:
`full-check-3123edf.json`, SHA256
`baab09835a6d170404eb3e06de5eac6726a436d78d22b8d9ceff9c7993ea649e`.
It passed TypeScript, all 1,126 tests, parity check and orchestration check with
stable before/after source and lock fingerprints. Also verified the fresh clean
d8897cf receipts and raw logs:

- `style-lifecycle.json`: all 12 focused lifecycle tests passed; SHA256
  `905432c2003d18700d59cb138a8ea08ad788a918b4eeef3d3baa28bd8037b0f5`.
- `style-typecheck.json`: typecheck passed; SHA256
  `7a88b4adc659eda4e6654bf915df28cc734869b6215e4d7e2b58bbcdbe36f3e8`.

Receipts are under the feature tree's
`work/orchestration/sprite-logical-visit-fix/`. The earlier 168-snapshot native
adapter comparison may likewise retain its bounded result across this exact
semantic-equivalent style delta. No native, full-suite, build or browser job was
launched by this reviewer.

The original 3123edf build result is not presented as a fresh final-head build;
the planned d8897cf build remains required. Final scoped quality results must
confirm removal of the introduced warning/style defect and honestly attribute
the reported baseline Oxlint debt. The ordinary candidate browser comparison and
terminal evidence review remain pending. This review does not expand #214 scope
or authorize broad cleanup. No resources are held.
