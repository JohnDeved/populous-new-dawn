# Single-player release feasibility checkpoint

Checkpoint date: 2026-09-15 Europe/Berlin. Baseline: `642b60a`.

## Decision

Do not start another mission opening yet. The next delivery gate is one ordinary,
rendered-input Mission 2 victory, its shipped Continue path, and one ordinary Mission
3 victory. Repair only blockers observed on that path, using native evidence for any
new command binding.

The complete single-player target for 2026-09-30 is not supported by the current
scope evidence. This is a schedule risk, not authority to reduce quality or scope.
The fastest credible recovery is to prove sequential campaign completion, broaden
shared VM/AI hosts only as real missions require them, and work on save-format
recovery independently of campaign gameplay.

## Current boundary

- `PARITY.md` reports 26.94% verified gameplay and game-mechanics parity at ledger
  revision 28. Campaign and persistence each have zero complete broad checkpoints.
- `app/mission-data.ts` registers Missions 1-13. Missions 14-25 are not available
  through the shipped selector or Continue path, although the PND01 inventory
  classifies matching supplied level/header/script inputs for later integration.
- Missions 1-13 are not complete campaign deliveries. The runtime deliberately
  executes selected recurring PopScript blocks. Missions 8 and 9 currently use no
  recurring block; Missions 4-13 retain documented AI, tutorial, failure, victory,
  or special-object gaps.
- The thirteen imported scripts name 95 command opcodes. Forty-six are absent from the
  recurring `campaignCommand` arity table, but that number is not a backlog: several
  are already handled during turn-zero initialization and others may never be
  reached by a selected mission path. Required commands must be derived from the
  failing full script block, not implemented from this count.
- The generic outcome system grants victory after all active campaign opponents lose
  their population. The rendered-control route in `744ad67` proves ordinary Mission
  2 and Mission 3 victories, shipped Mission 2→3 continuation, and the Mission 4
  offer; later optional AI/tutorial branches remain separate parity work.

## Critical work and estimates

| Work | Evidence-backed boundary | Estimate | Important unknowns |
| --- | --- | ---: | --- |
| Ordinary Mission 2 victory → Continue | Delivered in `744ad67` through rendered player controls, natural Matak defeat, result UI, profile completion, and shipped Continue. | Complete for this boundary | Broader Mission 2 parity remains outside this completed route. |
| Ordinary Mission 3 victory | Delivered in `744ad67` through rendered player controls and natural Chumara defeat. Later `1030/1074/1103/1168` branches are reachable optional AI/tutorial behavior, not completion gates. | Complete for this boundary | Full recurring opposition and tutorial parity remain separate work. |
| Complete Missions 4-13 | Openings and vertical slices exist, but natural endgames and substantial AI/tutorial branches remain incomplete. | 3-8 weeks total | Scope differs sharply by mission; Mission 10 failure branches, exact special terrain consumers, and later specialist/vehicle paths remain open. |
| Missions 14-25 and progression | Runtime registry reaches Mission 13; the PND01 inventory classifies all 25 supplied mission inputs, but later unique objects, mechanics and commands remain unintegrated. | Months, not one opening-sized slice | Per-mission object classes, script hosts, AI, tutorials and endgames remain unevenly known. |
| One trustworthy original-save compatibility slice | No original fixture, parser, converter, loader export, or native load oracle exists. | 5-10 engineering days under the capture assumptions below; 2-4 weeks if the native loader is tightly coupled | Mid-level saves may differ from campaign-progress slots; file APIs, checksums/compression, pointer relocation and licensing/provenance are unresolved. |

Recent delivery demonstrates that a bounded mission vertical slice can land in
roughly one to three hours, but those commits do not establish complete missions.
Using that opening rate to estimate full campaign completion would be misleading.

## Save/load feasibility

The shipped checkpoint is browser-native, not original-format compatible:

- `app/game-store.ts` stores one `{ version: 1, world: structuredClone(world) }`
  record plus a small completed-mission profile in IndexedDB.
- `migrateCheckpoint` migrates browser schema. It does not parse original bytes.
- `scripts/check-browser-checkpoint.mjs` proves reload discovery and a selected
  restored-world projection; other mission checks exercise internal clones. None
  load an original save.
- `decomp/research/campaign-progression.md` proves a native in-memory 164-byte
  per-level campaign slot and identifies `00427220` as a separate serialization
  owner. It does not establish a mid-level save format. Ghidra-inferred
  `load_savegame` names are leads, not reviewed exports.

A trustworthy first oracle requires the exact executable and matching data plus a
usable Windows/Wine capture environment. Its controlled authentic fixture must be
produced and reloaded by that executable and retain hashes, build, locale, slot/path,
scenario actions, and expected state. Recovery then needs reviewed loader and
filesystem boundaries; format/slot/error recovery; a native post-load state
projection plus deterministic
continuation; and a browser decoder exercised through shipped UI. Truncated and
wrong-version fixtures and a provenance decision are required before compatibility
can be claimed. The 5-10 day estimate assumes the loader can be isolated behind a
small filesystem-hook boundary; without the executable, matching data, or capture
environment, this slice is blocked rather than merely slower.

## Immediate execution order

1. Use the accepted natural Mission 2→3 route as the baseline for later campaign
   work; do not reopen it without contradictory evidence.
2. In parallel when independent capacity is available, acquire one controlled
   authentic save and recover the exact loader boundary before writing a decoder.
3. Re-estimate Missions 4-25 using the delivered PND01 inventory and select a
   release-critical gameplay/system gap rather than another convenient opening.
4. Bind later Mission 3 AI/tutorial blocks only as complete behaviors when their
   remaining parity is selected; do not add isolated command stubs.

This update changes no parity status. PND02 reuses the accepted natural-victory
receipt, adds a current fingerprinted checkpoint-browser receipt, and uses a
non-recording structured script walk plus byte inspection for the later-command
boundary. No native game, build, CrossOver, fixture-recording, or parity-recording
command was run for this update.
