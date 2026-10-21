# Native campaign integration

Checkpoint A is an intermediate integration, not full restoration of campaign or
result UI. It composes the reviewed native model/result contract/all-world renderer.
The legacy completion ledger and profile envelope remain version 1; the additive
native extension carries 25 byte flags and explicit history provenance. Checkpoint
version 3 and database version 1 are unchanged.

Completion-only migration is a preservation policy, not recovered play history.
Recorded supported completions remain replayable, then one non-victory transition
opens the first incomplete mission. Sorted wins are never replayed. Old-tab ledger
additions join completion bits, preserve available bits and downgrade provenance.
Malformed records/extensions are salvage-only and never overwritten. Restore does
not persist migration. Eligible completion and selector events read/merge/recompute
and put in one transaction; failed events remain local for a later authorized retry.

The native selector receives mask-5 selectability, separate inspected selection and
recommendation anchor. All 25 source records remain visible; only missions 1–23
can launch. Tutorial 79 uses its separate entry. F8 at startup/selection opens a
diagnostic picker. F8 gameplay performance and F9 spell testing remain separate.
Debug launches cannot save or award completion, including after Restart. Existing
clean checkpoints may continue even when newly migrated campaign flags lock that
world. Public campaign start independently checks both membership and availability.

The shared public diagnostic browser helper now uses F8. Existing save/progression
fixtures must be migrated explicitly to native profile/checkpoint fixtures; calling
the helper does not establish earned progression. Result-stage and remaining browser
adapter migration are checkpoint B. Full check/build and rendered acceptance remain
required after the complete candidate is independently reviewed. No parity claim,
source-pin activation, production profile mutation or mission24/25 support is made.
