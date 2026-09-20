# Bloodlust follower overlay prerequisite

## Status and selection

This is a **blocked gameplay slice with a completed original-art prerequisite**,
not a shipped visual repair. Base main is
`5a0c8152e421b5082b97c0e235fb878f76fd0726`. The isolated branch is
`codex/worker5-visual-worship-gameplay`.

Four candidates were compared after reading GOAL and current PR/dirty-worktree
metadata: Bloodlust's procedural ring, Shield's larger multi-piece overlay,
Ghost Army's already-live visual state, and the delivered Vault marker/unsupported
side-fire proposal. Bloodlust was selected because retained native evidence named
a concrete missing original-art consumer and a normal Mission16 route was reachable.
All reserved PR scopes, Temple/apex and denied delivery-audit reads were excluded.
No other worker's branch was modified.

The request to write the Bloodlust runtime helper, scene helper and narrow unit
caller was blocked by the tool safety check before execution. It was **not retried
or implemented by another route**. Those two runtime files do not exist and
`app/scene-entities.ts` remains byte-identical to base. The shipped red torus is
therefore unchanged. This draft preserves only the successful proof, importer and
isolated unused art, for a later authorized continuation.

## Original identity and producer

Reuse [Mission16 Bloodlust](mission16-bloodlust.md),
[the original renderer](../generated/004673b0.c), and
[existing sprite scaling](../generated/00476090.c). Model20 dispatches the existing
Bloodlust effect87/status0x48; original eligibility/application and the six-person
selection remain the already-implemented spell owner's responsibility.

The Bloodlust-only renderer branch is **004691ec..00469303**. It reads the person
flags3 bit0x80000, timer byte+0xb1 and person-local counter+0x2e. Below timer16,
counter mask0x02 suppresses the overlay; otherwise it draws one alpha HFX rectangle
at the person's existing projected anchor. The prior Shield branch and the
following status branch are different owners and are not included here.

The exact source is **HFX1478..1487**:
`hfx_base + 0x2e30 + (sprite_animation_counter % 10)*8`.
The relocated HFX table is zero-based, as in the existing
[HUD-health checker](../../scripts/check-native-hud-health.py); the HSPR sentinel
convention must not be applied to this HFX offset. Each original frame is30×25.
The frame is global presentation phase, not a new per-effect clock or world-age*12
sequence. The current chronological presentation adapter remains unchanged.

The rectangle starts at `anchorX - trunc(width/2)` and
`anchorY - trunc(bodyFrameHeight*40/36)`. The body frame height is the already
scaled VFRA header height, not the combined headdress/weapon bounds. Scaled
presentations call the original00476090 on the overlay width/height, using the
same body depth bucket and view scale. The probe executes this arithmetic rather
than estimating a world-space ring radius.

Original status allocation, damage multipliers, duration, selection, sound and
expiry are not changed. In particular, the native timer is a byte decremented on
its existing eight-visit schedule, whereas the current browser exposes remaining
turns. A future caller must preserve that adapter and use the relevant person
counter; it must not rewrite simulation timing to make a visual test pass.

## Isolated original artwork

[scripts/import-bloodlust.py](../../scripts/import-bloodlust.py) uses the existing
pure PSFB decoder from `import-original.py`, without invoking the shared importer.
It verifies the original HFX, PAL and AL files, then exports only:

- `app/original-bloodlust.json`: ten source rectangles, per-frame RGBA hashes,
  original input hashes, PNG hash and executable identity;
- `public/original/bloodlust.png`:320×32, ten32-pixel cells.

Upper-nibble colour selection uses `AL[(value|15)*256]`; lower-nibble opacity is
`(value&15)*17`, matching the retained HFX alpha decoder. There is no new tint or
procedural artwork. All shared HUD/effects/unit atlases, their metadata, the global
provenance file and shared importers are unchanged. The new image has no live
consumer yet and is not an implicit extension to the reserved spell HUD atlas.

Pinned executable SHA256:
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
PNG SHA256:
`85095d071e6132921cf9324759f305ec35f68f89bc103587c292083e04bf0220`.
All three source-file and ten frame hashes are retained in the generated metadata.

## Executed original evidence

Canonical receipt **423079fd-0001-439b-b4e9-65332910f9cc**, exit0, passed before any
runtime edit. The [checker](../../scripts/check-native-bloodlust-appearance.py)
executes the Bloodlust-only branch and original sprite-scaling helper in **1,600
cases**, varying status/timer boundaries, person counter, global animation phase,
view, bucket, scaled/unscaled mode and body frame height. It also reconstructs and
compares both isolated asset outputs exactly.

Supplied leaves are palette selection and final rectangle submission; supplied
inputs are post-person-render locals and status fields. This is not a whole-native
world, original GPU blend/raster, or live browser comparison. No source instructions
are patched. The imported RGBA follows the established decoder, not a claim that
a framebuffer capture was taken. The successful checker and importer hashes bind
the later publication; no native rerun is needed merely to change receipt HEAD.

**Run this partial in evidence-only mode:**

```sh
python -B scripts/check-native-bloodlust-appearance.py /path/to/d3dpoptb.exe \
  --game-root /path/to/game --output /new/ignored/report.json --evidence-only
python -B scripts/import-bloodlust.py /path/to/game --check
```

Without `--evidence-only`, the checker reserves a comparison against the
not-yet-created `app/bloodlust-appearance.ts`; that mode is unavailable in this
partial branch and is **not** claimed passing. It is retained unchanged from the
successful pre-implementation proof rather than silently relabelled as a completed
TypeScript comparison. Existing output reports must not be overwritten.

## Normal campaign route feasibility and remaining acceptance

A no-injection engine exploration used authored Mission16: select its six Blue
Braves, command the left Bloodlust head (id6), and advance ordinary ticks. They
walked from their authored settlement, completed worship normally and acquired one
stock at turn1142. The authored Shaman then walked toward(-26,-13), reached casting
range and cast on an existing Brave; all six obtained status1440 at turn1403.
No actors, terrain, work, mana, stock, enemy state or rewards were injected.

This proves route feasibility through the real command/simulation API, **not**
shipped-pointer/browser acceptance. The old Mission16 browser checker uses injected
setup and was not reused as a normal-route claim. A later runtime delivery still
needs the shipped acquisition/cast path, actual original overlay pixels and frames,
pause/checkpoint continuity, varied render schedules, natural expiry and unchanged
world/RNG/rewards. None is claimed complete here.

## First divergent owner and next boundary

Current `makeUnit` creates a red torus for Bloodlust, then `updateUnits` rotates it
and gates its blink from global turn. The missing owner is the **Bloodlust-specific
post-body-render overlay consumer**. Retained sprite projection and per-draw atlas
transform support are sufficient candidates for later integration, but no denied
write may be retried automatically. Do not move the fix into worship acquisition,
HUD visibility, Shield, audio, global scheduling or another worker's reserved code.

The coordinator must resolve the blocked runtime-write boundary before resuming
that narrow implementation and its complete normal-path acceptance. No issue
closure, full spell parity, production change, or review acceptance is asserted.
Local evidence, attempted commands and final validation statuses remain under
`work/orchestration/worker5-visual-worship/`, including `native-proof.json`,
`safety-stop.json`, `contract.json` and the final handoff.
