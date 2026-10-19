# Ordinary spell reward payout feedback

Refs #58. Remove only the extra nine-second browser prose notice for gifts tagged
with the established ordinary Mission 1 Lightning/Bridge or Mission 2 Tornado
source. This is not a finding that native rewards have no feedback.

The retained [handoff](worship-grant-handoff.md),
[presentation](worship-grant-presentation.md) and
[replacement](worship-grant-replacement.md) evidence establishes positive native
feedback earlier in the lifecycle: the phase-zero `004facf0` handoff invokes
`00481550`, whose class-11 branch starts the spell and companion controllers.
Flight, particles, pulse and sound are separate from the later payout. The old
handoff note's missing-browser-controller finding is historical; current scene
and worship-acquisition-runtime callers implement that path.

At payout, [004facf0](../generated/004facf0.c) mode 3 invokes
[004c2cd0](../generated/004c2cd0.c) for capped stock and
[004c2aa0](../generated/004c2aa0.c) for the saturated gift counter, then deletes
the reward. That established payout owner has no counterpart for the added
`{Spell} received. {Count} shots ready.` status overwrite. Suppress only that
extra overwrite, preserving arithmetic, timing, acquisition requests and cues.

The browser boundary is `ordinaryWorshipSource` through shrine provenance,
`createGift`, and the normal gift loop. Its tag currently identifies the authored
M1/M2 records established as `[11, model, 3, 1]` by the retained source research;
it is not a universal guarantee about arbitrary fabricated gift tags. Existing
legacy checkpoint gifts deliberately do not acquire provenance retrospectively.
Untagged gifts, later mission and Vault rewards, mana and building feedback remain
unchanged. Their presentation and callers require separate decisions.

No new native execution is claimed. Retained probes supply display/raster/device
leaves, arrival UI and deletion bookkeeping; they are not exhaustive original-game
replay or proof that all downstream feedback is absent. The maintained real M1
command/worship regression checks status preservation at payout. Focused fixtures
cover all three authored spell tags, capped stock, gift-count saturation, checkpoint
continuation and unchanged untagged feedback. These are port tests, not new native
or rendered acceptance. Report actual run status separately.
