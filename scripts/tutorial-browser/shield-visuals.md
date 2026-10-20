# Standalone Shield visual witness

This module is **prepared, not browser-accepted** until a source-bound actual
browser run and retained crop review pass. It is not yet wired into shared CI.

Import the default `spellShield` from `shield-visuals.mjs`, then call:

```js
await spellShield({ browser, url, output, source, expectedRevision, deadlineAt })
```

`browser` is the runner-owned Playwright browser. `url` serves the ordinary hosted
Home build, its original assets and the actual compiled build revision. `output`
must be a fresh existing artifact directory. `source` has the runner's `commit`
and tracked-file hash inventory. `deadlineAt` is the runner's unchanged absolute
`Date.now()` deadline, not a fresh duration.

The episode rejects admission before context creation unless at least 55 seconds
remain. One 45-second monotonic deadline covers context creation, fixture setup,
all observations/retention and context closure. Ten seconds remain reserved for
outer cleanup. Late context creation triggers its single owned close; delayed,
failed or unconfirmed closure never becomes a pass. The runner owns browser and
server cleanup, and does not reuse the episode's context.

## Route and retained evidence

- A declared current-format M2 checkpoint supplies one Shield shot, six Blue
  braves, one brave per other owner, allied relationships, a flat field and
  suppressed campaign AI/outcome. The original opening is processed and its
  introduction is completed offline using the existing flyby state machine.
- Each foreign brave has an explicitly supplied near-expiry timer of 180 turns.
  No browser-side status, actor, ownership, gameplay RNG or clock write is used.
- The public Home Load Game route admits the full lossless checkpoint. The
  shipped `0` key and actual canvas-owned left click spend the shot and Shield
  six Blue followers. There is no F9 shortcut or test API added to production.
- Public Pause holds the full world and clock. Actor-local crops and GL pixel
  differences use the same explicit ordinary renderer call as their recorded
  body frame, VFRA height, native UV uniform, tint, rectangle and painter data.
  A diagnostic removes only one actor's three presentation sprites, rerenders,
  then restores visibility in `finally`. Whole-world and camera/clock equality,
  exact restored crop pixels and nonzero changes inside Shield rectangles are
  required. The canvas copy must exactly match the vertically oriented framebuffer;
  an independent bounded PNG decoder checks the actual retained file's RGBA hash
  against that frame. Four owners use the ordinary view; Blue additionally uses the public
  close-zoom scaled path and the post-load view.
- F8's actual exported build identity is checked, without FPS acceptance.
- Public Save checkpoint and Load checkpoint use the imported
  `CHECKPOINT_VERSION`, never a fixed historical version. Exact full normalized
  World comparison accompanies actual old-scene disposal events and canvas
  removal. Shared atlas disposal must remain zero.
- After Load, ordinary Resume advances foreign timers to zero. A read-only RAF
  observer checks remaining time against actual elapsed turns and the removal of
  the native `0x8000` flag and all three visible pieces.

The receipt is `shield-visuals.json`; inputs are `shield-checkpoint-{transfer,source}.json`.
Crops are `shield-original-{0,1,2,3}.png`, `shield-scaled-0.png` and
`shield-loaded-0.png`, with `shield-context.png` and `shield-build-frames.json`.
Failed observations stay failed, not skipped.

## Explicit limits and tests

This does not prove earned stock acquisition, campaign progression, exact full
native lifetime, original allocation ownership, live per-unit deletion, native
GPU pixel equivalence, hardware smoothness or fresh-process save persistence.
Current Save/Load covers old-scene removal/disposal, not manufactured unit death.
The existing raw-asset/rectangle/palette tests remain the source-parity evidence.

Focused Node tests are `shield-browser-budget.test.mjs`,
`shield-browser-checkpoint.test.mjs` and `shield-browser-evidence.test.mjs`.
They exercise deadline/late-cleanup failures, the actual cast/timer route,
lossless current checkpoint data and negative evidence mutations. Synthetic
validator inputs are never browser receipts.

## Combined ninth-shard contract

The mandatory integration is now `spell-visuals-nine-v2`, with ordered Angel then
Shield and unchanged180s/120s/15min outer/build/job caps. See
[the combined contract](../../engineering/combined-spell-visuals-witness.md).
Current-v4 fixture/source/expected/actual initial Load and public Save/Load graphs
are retained and hashed alongside the six crops, context image and build readout.
The standalone pixel oracle takes explicitly supplied original unit-frame data;
the trusted reader requires caller-pinned bytes and never imports app code.
