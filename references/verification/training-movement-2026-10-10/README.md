# Training movement lifecycle evidence

The [candidate rationale](../../../decomp/research/training-movement-lifecycle.md)
describes the product change and its limits.

`native-retirement/` preserves byte-identical compact records from the read-only
retirement investigation at source `96a465d1`. Its
[manifest](native-retirement/manifest.json) binds every copied file with SHA-256.
Read [findings](native-retirement/findings.md), [audit](native-retirement/audit.json),
and [actual boundary trace](native-retirement/trace01/lifecycle.json).
The constructor/allocation/retirement disassembly and observation-only driver diff
are retained alongside the trace. No original executable/assets, runtime-global
binary, private environment, or 62 MB duplicate full result is included.

The native worker's report and scripts are frozen provenance. Their original
commands and paths describe the investigation workspace, not turnkey paths in
this compact bundle. Reproduction requires the original executable/assets and
the frozen attempt08 driver/input from research
[PR 321](https://github.com/JohnDeved/populous-new-dawn/pull/321), with the same
reviewed native environment. The audit proves unchanged baseline-shaped outputs
for all six comparison keys; this compact copy preserves the lifecycle evidence
without claiming that the omitted complete result is present here.

Native record reuse was not exercised. Original animation scheduling, full-world
startup/rendering, and native checkpoint reconstruction remain outside this
bounded evidence. Browser same-turn recruitment, end-turn lifetime order,
interruption, and browser checkpoint migration are separately tested through the
actual product callers.
