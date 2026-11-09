# Simulation steps in F8 captures

Schema v1 adds optional frame-level `simulationSteps`: the number of actual logical
turn increments executed by this animation callback's `advanceGame` call. Missing
means unknown (older exports), not zero. Zero includes paused, land-paused, menu,
and no-fixed-turn callbacks; catch-up frames may have multiple advances. Animation
and worship UI visits and land-paused tick attempts do not count. The counter is
incremented at the existing logical-turn advance, independent of wrapping or reset
turn IDs; it never changes scheduling or checkpoint state. Failed callbacks do not
export a completed frame. Direct off-frame tick calls are outside this count.

Recording reuses a callback-local carrier and one numeric ring slot. With F8 off
there is no carrier allocation/reset, timer, or count update, only passing an
undefined optional argument and a branch at the existing turn increment. Menu and
new callbacks reset the carrier; ring/reset behavior retains unknown explicitly.

The offline cohort summary reports the count distribution without filling absent
values. This does not divide CPU time by turns or certify equal simulation work:
the CPU stage also includes presentation/animation and turns have varying work.
The separately frozen browser benchmark allowlist/classification is unchanged;
simulation remains observation-only until a separately reviewed protocol adopts
this field. The existing 2 MiB export/parser limit and schema version remain intact.

## Export size and explicit retention

The original maximal-counter fixture left only 939 bytes of headroom; valid
fractional timings or paused-state strings exceeded the same 2 MiB cap. Export now
checks both UTF-8 Blob bytes and JSON code units, preserving exact values. If the
full ring does not fit, it exports a newest contiguous suffix with recomputed
count/start/end/span and optional `retention` metadata (`availableFrames`,
`droppedOldestFrames`, reason `serialized-size-limit`). The UI reports omitted
oldest frames; the recording ring is untouched. Metadata plus one frame that cannot
fit causes a visible failure, never an invalid download. Size handling runs only
on explicit export. Legacy v1 readers see an ordinary valid suffix and its actual
span/count; updated readers additionally validate and report omissions. Comparison
protocols must continue checking required coverage, not treat a shorter window as
faster work. Further optional fields must pass adversarial actual-Blob tests, not
assume a single large-number fixture is the worst JSON representation.

Gameplay phase summaries validate raw retention before selecting complete phase
intervals. Original export retention remains in `rawAnalysis`, with retained raw
frame count and exact selected raw indices as provenance. Derived parser summaries
omit export retention and recompute their own subset timing/count; they do not
claim omitted history was captured. The anti-wrap guard uses pre-trim available
frame count, and the independently observed action window still governs minimum
coverage. Neither trimming nor subset selection changes benchmark classification.
