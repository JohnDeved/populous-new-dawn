# Ordinary Mission 3 automatic Vault panel witness

Prepared against main `4754e12d3590bde18656416514871b033de164be` for issue #72.
This document describes an unrun episode. Supplied-DOM contract tests are not
ordinary gameplay or rendered evidence. The product change is a separate input.

## Source and actual interfaces

- `scripts/local-render/mission3-temple-checkpoint.mjs:349` supplies the accepted
  public Mission 3 startup/readiness, original Shaman selection, minimap and
  command-33 prefix. The new episode omits all Temple construction.
- `createMission1VaultInput` in `mission1-vault-input.mjs` exposes `action`,
  `button`, `view`, `prepareDispatch`, `fixedGround`, `entityPoint`, `dispatch`
  and `clickEntity`. The episode uses returned ground `{point,context,rejection}`
  and command `before`/`after`/`delivered` receipts. Its existing observer checks
  actual pointer events, picker ownership, command context and selected recipient.
- `vaultPoints` in `app/vault-geometry.ts` supplies the original shape-derived
  outside/inside/departure points. `browserPosition(points.leave)` is the bounded
  ordinary cancellation destination. It is preflighted in the actual Vault camera
  before the long approach, and `dispatch` rechecks it immediately before input.
- The accepted [PR #282 route](https://github.com/JohnDeved/populous-new-dawn/blob/f204d48c179085d4987be15ff1c0686cf4c1a250/references/verification/m3-vault-approach-2026-10-09/README.md)
  establishes the ordinary approach/work/reward/departure prerequisite. This
  witness does not reuse that route's images as current evidence.
- Product interface: actual World sampling calls
  `scene.objectPanels.requestAutomaticVault(id)` synchronously before replacing
  `Shrine.followers` and incrementing work. The existing `panels` map and new
  `automaticVaultLatches` set own presentation. No Vault `panelActivity` is assumed.

## Bounded episode

1. Use a fresh owned profile, ordinary Mission 3 startup and readiness, original
   Shaman, public minimap, exact picker/context preflight, then trusted command 33.
2. Park the pointer on the HUD. Capture the first prior-zero request rejection,
   the new count after the fixed turn, subsequent successful creation, and at
   least four natural off-target held update visits. Save a visible progress PNG.
3. Send trusted ordinary command 3 to the preflighted departure point while work
   is at most `floor(target / 4)`. `stepVaultWork` advances work once per four
   fixed turns. Verify this bound synchronously at the actual pointer event;
   no host-delay or one-frame-per-turn promise substitutes for that evidence.
4. Observe current count zero, natural panel/latch/reservation expiry, and save
   a PNG. Reissue ordinary command 33 and capture a fresh successful creation.
   The previous lifetime must have ended; a numerical allocator slot may repeat.
5. Let the original command earn the Temple knowledge reward and finish departure.
   Require exactly one use, Temple unlock, released command-33 task and retired
   panel. Retain the final PNG before assertions.

The overall admission budget is 720 seconds. Readiness, initial approach, expiry,
reissue and reward waits have explicit bounds. Polls serialize only short current
summaries; new synchronous records are retrieved in ranges every five seconds.
The observer caps records at 4,096 and fails visibly on overflow. `AbortSignal`
and the maintained harness own ordinary stop, browser and server cleanup. Observer
close restores exact method descriptors and listeners; stale/disposed Scenes
release observation without replacing a foreign owner.

No Save/Load is required for this fresh episode. No failure fallback Save replaces
a genuine checkpoint. Any later checkpoint continuation must use the maintained
typed committed-checkpoint comparison and supported owned-profile cleanup.

## Verification and limits

Cheap checks: syntax for the three maintained modules and
`node --test tests/vault-prayer-witness.test.mjs`. The composed fixture tests old
versus current count, actual input boundary capture, expiry before recreation,
identity reuse, stop/stale/dispose cleanup, bounded ranges and foreign ownership.
The fixture supplies callbacks and DOM; product caller tests belong to the feature.

Browser execution and all package/model/full/native checks require the coordinator's
resource grant. A browser run must pin the combined product and QA source, retain
partial JSON/PNGs on failure and inspect the actual pixels. Final PR/issue images
must be embedded using verified immutable URLs. No current rendered pass is claimed.
Native wall time, physical allocation, exact socket anchors, clickable Vault slots,
original raster/audio fidelity and hardware performance remain outside this proof.
