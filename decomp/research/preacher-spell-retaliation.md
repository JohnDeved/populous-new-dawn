# Active Preacher spell retaliation

Issue [#206](https://github.com/JohnDeved/populous-new-dawn/issues/206) repairs one
live adapter field. It grants no parity credit and does not close the broader
specialist or campaign gates.

## Native correspondence

The retained `0043a4d0.c:268-277` sermon producer calls `0043abf0` on its acquisition
phase, then clears or sets person `+0x76 & 0x40` according to the listener count.
`app/preacher-conversion.ts` preserves that assignment-bit producer through
`stepPreachingOrder`, called by `stepLivePreaching` in the ordinary person turn.

The retained `004d0860.c:181-283` computer spell controller checks enemy/alliance,
visibility, model 4 and this assignment bit. It tries models 2, 5, 3 (Blast, Swarm,
Lightning) in order, retaining cast eligibility, payment, mana, usage and range
gates. The original byte layout is already used by
`scripts/check-native-emergency-spells.py`; this change introduces no native fields.

That existing oracle compares 1,040 complete native controller calls with the port,
including assignment, visibility, alliance and readiness cases. Queries, geometry,
range and scan/dispatch execute natively; only final allocation at `004f4de0` is
supplied to record requests and apply delay 12. The retained result is 17 Blast,
4 Lightning, 1 Swarm and 4 Preacher responses. See the **Complete general and
emergency spell controller** section of [the decompilation index](../README.md)
and `references/reverse-engineering.md:1943-1982` for the original scope.
The probe now accepts `--failure-output` for an owned diagnostic path (defaulting
to ignored `work/native-emergency-failure.json`); fixtures, comparisons and native
execution are unchanged.

Exports are bound by `decomp/exports.json` to executable SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`, Ghidra 12.1.3:

- `0043a4d0.c`: `468e8230bd5ccf922c0237163fbf5e92fa00948b0d1fd98ac46b7e0a35d33188`
- `004d0860.c`: `bb3fe6bba786335868b979c0520ef1b2682c12b7bdf62201187569111ec5be13`

This is reuse of existing native evidence, not a new uninterrupted native sermon
producer-to-controller execution or original campaign proof.

## Live failure and repair

At base `dcfb0dc2afe3e2501f964b109933e43d8bdbd451`, `computerSpellPerson` hardcodes
assignment to zero. Its existing `unitAnimationSource` selects the actual sermon
record for command 17. The repair preserves that record's assignment, with zero
only when the source is absent. Flags2, disguise, target order, native controller,
payment and readiness are unchanged.

`tests/preacher-spell-retaliation.test.mjs` adds a Preacher/listener through normal
unit construction and advances six actual fixed turns. Command 17, assignment 336
(bit 64 set), and the owned state-23 listener are produced by the live lifecycle.
The fixture then stages the nearby computer Shaman and spell prerequisites to
isolate retaliation through the exported `stepComputerSpells` and private adapter.
The comparison uses the native-backed controller with the actual produced person.

Before the repair, the live 80-cell scan finds the Preacher but all three positive
priority/fallback cases fail at zero spell allocations. The same 14 tests pass after
the one-field repair. Negative cases cover absent assignment/source, same/allied
tribe, invisibility, caster cooldown, entry readiness, paused scan, payment and
stored-Lightning mana. The independent enemy-Shaman Lightning response still spends
stock with zero mana and preserves pending scan state.

`scripts/check-browser-preacher-retaliation.mjs` uses the same bounded staging and
calls actual `tick` for all three spell responses, through the tribe processor's
normal AI dispatch. It checks rendered spell effects, movement-command cancellation
and invisibility. Its explicit `--scenario before` mode requires the candidate's
observed capture turn and an actual base application for a comparable screenshot.

Run `node --test tests/preacher-spell-retaliation.test.mjs`. This bounded regression
stages actors and readiness; it is not natural campaign acquisition or rendered
acceptance. Full check/build, affected native rerun and rendered validation must be
recorded separately on the accepted candidate. The bug suppresses retaliation and
cannot explain earlier Mission 3 Preacher deaths. Ongoing Mission 3 ordinary-control
evidence remains separately pinned to its b381851 application bytes.
