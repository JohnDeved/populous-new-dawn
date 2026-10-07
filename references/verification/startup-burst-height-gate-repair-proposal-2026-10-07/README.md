# PR254 gate01 attribution and tiny test-style proposal

**Source-only; patch unapplied, no new tool/test/game run.** The two-line
[test patch](test-style.patch) uses object destructuring for the original RNG value
and array destructuring for the sampled first particle. Production clamp and passive
observer/driver bytes remain unchanged; no assertion, RNG forwarding or sampling
behavior changes. No legacy import-cycle refactor is proposed.

[Attribution](attribution.json) maps all40 diagnostic sites to exact accepted-main
lines. All six import(no-cycle) errors are inherited. Main e3a7a06a and baseline
b6c4d255 have identical app trees; candidate differs only in stoneBurst's body.
Its entire import prefix and every other app file are unchanged. Each reported
cycle's file hashes, unchanged Oxlint/TypeScript/package-lock config, identical
package dependency declarations and the verified installed Oxlint bytes are retained.
There was no baseline linter invocation. Of34 warnings,32 are inherited and two
are new test-only prefer-destructuring sites addressed by the text patch.

[Proposed continuation policy](expected-oxlint-diagnostics.json) retains Oxlint's
actual failed status/exit1 and all diagnostics, but permits an explicitly named
inherited/advisory classification only when all six errors and32 remaining warnings
exactly match the reviewed set after those two style changes. Any new, missing or
unclassified diagnostic fails closed. Global rules are not suppressed. Required
format/ESLint/check/build and Fallow's existing separate policy remain unchanged.

Independent review must accept this attribution, policy and tiny patch before
source changes or a fresh gate02 are frozen. Gate01 and its real failure/cleanup
stay immutable. Ordinary/native evidence needs only source correspondence because
this proposed repair changes tests alone; final aggregate tests still rerun all
assertions. The old interrupted dependency loan remains untouched and unknown.
