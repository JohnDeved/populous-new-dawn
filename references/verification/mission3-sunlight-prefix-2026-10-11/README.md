# Conditional original sunlight prefix

Issue #29; research only. One admitted original run passed independent post-run
review at source HEAD `c7abae13e31d476d4d8ba6f170305cb2a4d0e914`.
This investigation has not changed product code or merged to main. Separate
workflow work may advance main independently.

## Accepted result

The actual loader prefix `0042b590` executes the previously reviewed reset and
palette copy, then the genuine sunlight initializer and its integer square-root
helper. It stops at `0042b5a8`, before terrain-mask setup.

- 198,587 original instructions; all 43 predeclared memory fields pass.
- The earlier 33-field checkpoint and final CPU/unknown-state contract pass.
- All 2,048 square-root calls return. Both 1,024-byte output tables match
  independently derived host expectations.
- Independent review derives all 158,959 observer events from source: 30,766
  reads, 128,181 committed byte writes and 12 explicit invalidations. A separately
  reviewed pure helper replays their masks under the reviewer's trusted contract.
- 86 author and eight independent synthetic tests pass. No original code was
  executed by the reviewer. The original process exited zero and all four driver
  hashes stayed unchanged.

The full result SHA256 is
`e61d5f6bbf61ff8692fc948d4560aab525233b9996b668c93f73c0b8ce436f7a`.
The canonical EXE SHA256 remains
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.

## Explicit conditions and limits

Forty sampled writable trigonometric words are conditioned to equal canonical
EXE values at prefix entry. Writes to them are rejected throughout this prefix.
The finite reference/alias audit does not establish their entire campaign
lifetime. The prior three camera floating-point omissions still assume normal,
no-fault return. The scoped, live, disjoint palette allocation remains an explicit
renaming condition; its contents and copied cache remain unknown.

Only the exact 52-byte original square-root code window is admitted from the
read-only first CSEG. No installer, PE startup, OS/import bridge or network runs.
Observer event order is not an independent full CPU-retirement trace. Write
events record masks rather than values; output values have separate assertions.
Genuine later stack writes can redefine omitted-call footprint bytes, and the
review checks their final provenance instead of assuming they remain unknown.

Terrain, commands, tribe reset, bank loading, allocation, authored objects,
post-load callbacks and gameplay have not run in this prefix. The Mission 3
class1 seed, conversion waves and a safe training fix remain unproved. This
evidence does not reopen the rejected product candidates or weaken Mission 2
acceptance. The next bounded source task is a coherent pre-loader input map.

## Retained evidence and reproduction

`retained-proof.tar.gz` preserves frozen drivers, source audits, synthetic tests,
preflight and run receipts, raw result, independent review and its replay
contract. `manifest.json` binds each archive member and the archive itself.
The raw result's gzip copy is independently round-trip verified. Original
executable/assets must be supplied separately; they are not distributed here.

Extract into the retained Mission 3 research layout. The scripts preserve their
original task paths and exact hash checks; relocating them requires explicit
path adaptation, not changing expected hashes. The review script also reads the
previous palette result from the [prior evidence](../mission3-reset-palette-2026-10-11/README.md).
A frozen copy of its separate replay helper is included under `review-tools/`;
the historical script names the original helper workspace path.

Native execution requires the separately held review and parent-release payloads;
the evidence archive is not permission to run broader code. File-only review and
synthetic tests do not constitute a new original run. Product check/build and
rendered gameplay gates are not applicable to this research-only publication;
structural and diff checks are recorded at publication.
