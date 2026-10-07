# Lean integration gate attempt02: retained context-budget failure

Source `2b7b19856b58913dbdff2b89beeea13782308f75`, original session95326,
terminal292e39. Format and scoped ESLint passed. Scoped Oxlint exited0 with
27 introduced QA/test style warnings and no errors. Fallow health/dupes exited0
with advisory findings; unused exited1 with retained advisory findings.

The required repository check passed1387/1388 tests and failed the unchanged
Shaman context assertion at tests/orchestration.test.mjs:848: Phase1 ground was
omitted. Build did not run. With all six mapped references, the enlarged explicit
portable-check command requires24,074 bytes against the unchanged24,000-byte
budget. The proposed named npm script contains exactly the same three test files
and produces23,964 bytes without dropping evidence, checks, or limits.

Body ended01:52:48.951361 UTC; cleanup ended01:52:52.344555 on2026-10-07.
Donor1978923 returned, owned processes were absent, and source/tools were unchanged.
**dependencyTreeUnchanged=false**: the sole full-inventory difference was the
Fallow lazy-verification marker `.fallow-verified`,528→515 bytes. Both native
Fallow binary hashes and every other dependency entry remained unchanged. This
failed cleanup equality is preserved, not waived or relabelled as a pass.

`fallow-diagnosis/` retains the exact after-marker bytes, parsed metadata, installed
wrapper sources and binary hashes. Before-marker bytes were not captured by the
old host; only their SHA/size/mode are available in the immutable before inventory.
No before bytes are reconstructed and no donor bytes are reset in this diagnosis.
The wrapper binds the sentinel to the install path, so a dependency move can
invalidate it. Analysis `--no-cache` does not suppress this separate verification
metadata. The captured marker timestamp falls within the Fallow health command.
Normal Ed25519/SHA verification remains enabled.

## Proposed future loan treatment (source review required)

Before launching, capture the exact sentinel bytes, mode and parsed verification
metadata alongside the full dependency inventory. Preserve that original file by
moving it into the run evidence before executing the ordinary wrapper. Its absence
requires the wrapper's normal signature/digest verification; do not bypass it or
change permissions/package sources. After the owned processes end, retain the new
marker separately, verify that its recorded native hashes match actual binaries,
and restore the exact preserved file with its original bytes/mode. Then compute
and require the full dependency inventory equality. Fail closed on unexpected
objects or any other inventory change. Retain both markers and all differences.
This is a proposal only; no new loan or marker mutation has occurred.

The accepted app/native/ordinary evidence is unchanged by this failed metadata
check. The separate native height-clamp-order limit still applies.
