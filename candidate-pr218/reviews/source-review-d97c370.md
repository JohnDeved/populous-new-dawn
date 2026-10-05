# Stone Head logical visits: frozen source preflight

Decision: **ACCEPT** source preflight at
`d97c370da3e996e00130610df97d10b827ab5c4b`, based on
`3cc9e830d2e7d2aa9844e8104fa51017d65dd171`.
No runtime source fix is requested. Full gates and rendered candidate acceptance
remain pending; this is not final merge acceptance.

The initial assignment named 9ae0310831d4163806474d3c11b3bbde2241de93. I inspected
the complete seven-file base-to-final diff and both subsequent deltas. The
9ae→779 correction preserves unsigned checkpoint flags with >>>0 and strengthens
the high-bit save test. The final779→d97 delta only wraps a function signature
and removes an unused node:crypto import from the controlled browser fixture.
The author confirmed the final freeze; all deltas are included in this acceptance.
The reviewed tree is clean.

## Runtime and lifecycle findings

The two runtime changes follow the independently accepted native model45 proof.
Only the existing authored family45 constructor/adoption path supplies 0x40000.
Source selection still excludes Vault, non-model45 families, unsupported nulls
and unrecognized authored sources. Imported geometry, frame tables and rendering
math are unchanged.

animateStoneHeads synchronizes enabled/hold/refill state before selecting its
logical or presentation owner. The existing branch-aware gate leaves mode4
transitions on presentation visits; ordinary/held mode4 has logical ownership.
The second synchronization inside the explicit per-visit helper is idempotent,
so a refill resets once. Held ordinary state receives a logical stamp without
advancing f1. No phase is called twice at a coincident boundary.

The adapter continues enumerating surviving decorative states without consulting
shrine.active, remaining uses or follower count. Trigger exhaustion therefore
does not stop the independent body's clock. Removed bodies are not enumerated;
new/lazy bodies at a completed turn can receive the accepted allocation-eligible
visit. This is the bounded world-shrine adapter, not a claim to implement a full
native scenery allocator or terrain-damage lifecycle.

Existing checkpoint adoption repairs the missing bit without resetting f1/f2,
stamp, morph state, enabled state or authored identity. The final unsigned fix
preserves high bits numerically. Repeated renderer/clock initialization does not
consume a frame. Missing optional state keeps the established phase0/held1 policy.
Old saved stamps and a new Scene clock cannot grant a presentation replay.

The new logical call is beside the existing person phase, after the turn body,
afterTurn observer and queued callbacks, and before the next turn or coincident
24-Hz work. It inherits the already-reviewed per-turn partition, pause/land-pause
and wrap handling. No accumulator or global timing constant changed. Direct tick
remains simulation-only. Explicit stepStoneHeadAnimation calls represent eligible
visits for the native/geometry helper contract; they are not elapsed scheduling.

## Tests, native comparison and fixture scope

Verified 779755e's final-focused.json, its stable source/diff identity and raw
stdout/stderr hashes. All 34 tests passed in 20.09 seconds: eight new body-clock
tests, the existing ten Stone Head tests, four chronological-clock tests and
twelve person/Splash clock tests. The existing Stone Head suite retains gameplay
and both-RNG equality, real worship/reward behavior, separate heads, all18 raw
geometry phases, refill semantics, restore and refresh-schedule controls.

The failure-first receipts preserve seven initial failures plus the passing
transition control, the old exhausted-trigger half-turn assumption, and the
later signed-versus-unsigned checkpoint failure. The corrected old test now
requires the extra presentation half-turn to hold and the following logical
half-turn to advance, strengthening the intended distinction.

Inspected the actual candidate adapter comparison driver and verified
native-adapter-9ae0310.json, its driver fingerprint and raw streams. It matches
132 retained native f1/frame/hold-mode rows across the two allocation-list
controls, plus the synthetic ungated transition control. Logical/enable/pause
inputs are supplied and the modern stamp identity is deliberately distinct from
the native outer serial. This is not another native OS or full-world run.

Explicitly approve carrying that comparison to 779755e: the only runtime delta
is unsigned normalization after setting the gate. Every flag value in these
132 rows and transition control is below bit31, so its numerical result is
unchanged. The newly protected high-bit checkpoint case is separately exercised
by the fresh final-head tests. No duplicate original probe or adapter rerun is
required solely for this final delta.

The controlled browser fixture now uses speed1 and exactly one checked World
turn per geometry step, replacing its invalid speed0/1/24 assumption. All18
frame-index, vertex, UV, material-mode, painter and pixel-change assertions are
retained. Exhaustion checks now assert one real turn and subsequent body phase
change. The fixture still pauses RAF, focuses the camera and later stages
gameplay/final-use state; its added disclosure is accurate. It has not yet run
on this candidate and must not be presented as ordinary campaign observation.

TypeScript changes are small and readable, reuse the reviewed gate and updater,
and introduce no duplicated controller/clock machinery. Fresh final-head formatting
and ESLint pass for the changed app/test/fixture scope; eight final-head lifecycle
tests also pass. I independently verified the raw receipts and compared Oxlint
diagnostic multisets to actual3cc source: one error and two warnings remain, with
no additions. This is accepted legacy debt, not a clean Oxlint claim.

Explicitly accept carrying the 34-test 779 result and the reviewed 132-row native
comparison across the final whitespace/unused-import delta. Neither changes a
runtime operation or assertion, and the removed built-in import has no uses.
The unsigned save change was already covered by the full 34-test 779 run and the
fresh 8-test d97 run. These are reviewed carries, not newly executed 34/132 results.

## Finite final gate list

1. Run source-bound npm run check and npm run build on the final candidate. Plan
   from the actual3cc base and explicitly dispose any broad mapped/unknown paths;
   retain the affected complete test assertions. No carry of prior PR217's full
   suite substitutes for this semantic change.
2. Retain the now-passed final-head formatting/ESLint receipts and the independently
   verified baseline-equivalent Oxlint result for both app files. No repeat of
   these unchanged inputs is required. Retain the repository's applicable Fallow
   advisory evidence without converting warnings into cleanup scope or a
   clean-health claim.
3. Complete a source-bound ordinary visible model45 witness with passive body
   flags/stamp/phase, World.turn, presentation serial and rendered geometry,
   including extra presentation holds, real logical advances, public pause/resume
   and supported speed changes. Use a discriminating baseline/negative control.
   An unobserved body or missing eligible interval is inconclusive.
4. Validate the migrated controlled18-phase browser route, or an equivalent
   source-bound rendered assertion route retaining those exact geometry/UV/frame
   checks. Keep its staged and geometry-only portions separate from the ordinary
   witness. Portable saved-state/lazy/new-clock checks cover the changed restore
   boundary; no extra ordinary Save/reload/Load scenario is required just for
   this unchanged storage format.
5. Retain terminal raw evidence, renderer/source/input identity and owned-resource
   cleanup, then obtain final evidence review. Re-review substantive repairs.

Scope stays the authored model45 body. Vault/HFX, other scenery and Stone Head
families, cue193/full audio, full allocator behavior, Firewarrior fallback,
historical wall-clock cadence and hardware-performance claims remain outside.
No browser, full gate, package/dependency change or native run was launched by
this reviewer. No resources are held.
