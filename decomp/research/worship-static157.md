# Static worship model 157 — Mission 5 Angel head

Issue #22 / PND-06 static-model157 slice. Base: `e431cfd378879d49e89b7a5dc3f6f0d354509a94`.
No new native execution or broad worship inventory was run; this reuses the accepted
`004fbd20` selector job `08b82309-9c3b-4519-89bc-fda212fba046` and the existing
`decode_original_model` decoder.

## Authored occurrence

Mission 5 has a concrete authored mode-5 worship head:

- class-6/model-6 trigger index **97** at `(-97,117)`, `settings[0] = 5`;
- colocated class-5/model-9 scenery index **98**, native heading **1024**;
- trigger link 128 resolves to index **127**, class-7/model-91 Angel statue at the head;
- trigger link 129 resolves to index **128**, class-7/model-88 target at `(-51,15)`.

The retained selector contract proves mode 5 selects presentation object **157**,
independent of the reward-presentation bits. This is authored integration evidence,
not an inference from a synthetic selector row.

## Current shipped mismatch

Fresh main `createWorld(5)` produces the Angel head as:

`{ id:95, kind:'angel', mode:5, model:45, x:-97, z:117, angelTarget:{x:-51,z:15}, remaining:1 }`.

The normal initializer already preserves `mode: settings[0]` and already calls
`worshipAppearanceModel(settings[0])`; only that helper lacks mode 5. The generic
scene already renders `nativeModel(shrine.model)`, so no scene or initializer change
is needed.

Mode 5 is not a Shaman-only admission mode. `live-worship.ts` specializes only
`mode === 3`; Mission 5's existing normal-path test uses an ordinary Blue warrior
and the Angel reward path is already owned by `kind === 'angel'` in `world-turn.ts`.
The reward target, remaining count, sound/combat behavior, and RNG therefore do not
need a model157-specific rule.

## Static model 157 asset

Hash-pinned bank-2 inputs match the previously accepted worship-variant evidence:

- `objs0-2.dat` — `e1af6bdf050608d7c1832700826bece72ca592abdff3ee9c2138c50ed8a8607d`
- `facs0-2.dat` — `01a9a6d02efa0d35f7026cd97f8e01f72cbfb72e94217efe8256e8fe43597e9a`
- `pnts0-2.dat` — `09ebbdc9496d2ebd3a932be96af3fd27e6701a41105a5154aec4abe39e50b911`

Existing decoder output for object 157:

- source record: 120 faces, 99 points, scale 160, face start 11316, point start 9882;
- decoded SHA-256: `21f743b9265069ef25202079aff0252a6016b827dcdafbf9dc1a1a8322ee090c`;
- 525 expanded vertices / 175 triangles / 120 source faces;
- texture tiles: **161, 182, 184, 221, 249**;
- modes: 108 faces mode 6, 12 faces mode 7;
- bias is -15 for every face; panel height 706;
- UV range stays inside the existing 256x1024 atlas; no atlas pixels are missing or
  need regeneration.

Current main already has model8 but has neither model157 in
`app/original-models.json` nor 157 in provenance `modelIds`.

## Checkpoint boundary

Current `migrateLegacyWorshipAppearance` restores authored mode for legacy mode-less
heads and upgrades only mode3/model45 to model8. A current Mission 5 checkpoint already
contains `mode:5, model:45`, so migration today leaves the wrong presentation intact.
The minimal additive checkpoint rule is therefore only: when a shrine is still
model45 and its restored/persisted mode is 5, replace its model with
`worshipAppearanceModel(5)`. This preserves the existing mode3 migration and all
reward/work/follower/RNG state.

The separate missing-Angel checkpoint adapter already clones the canonical Mission 5
head through `createWorld(5)`; once the selector helper returns157, that path inherits
157 without another initializer/store rule.

## Smallest implementation reservation

Owned draft:
- `app/worship-appearance.ts`: add `WORSHIP_ANGEL_MODEL = 157`; map mode5 ->157.
- `scripts/import-worship-models.py`: extend the existing hash-pinned additive importer
  to validate/append model157 alongside already-present model8; do not write provenance.

Shared outputs/hunk requested before editing:
- `app/original-models.json`: append only key `"157"` from the decoded model above.
- `public/original/provenance.json`: add only modelId `157`; atlas/input hashes unchanged.
- `app/game-store.ts`: inside `migrateLegacyWorshipAppearance`, add only the
  mode5/model45 presentation upgrade after the existing authored-mode recovery.
- `tests/mission5-angel.test.mjs` and its focused browser checker: change Angel-head
  model expectations 45 ->157 and add a persisted mode5/model45 migration assertion.

Read-only/no change: `world-initialization.ts`, `scene-entities.ts`, `world-turn.ts`,
`live-worship.ts`, mode3 migration semantics, model/settings data, Worker1's
model149/cadence, and Worker7's panel work.

Ignored proof: `work/orchestration/issue22-static157/asset-proof.json` and
`behavior-proof.json`.
