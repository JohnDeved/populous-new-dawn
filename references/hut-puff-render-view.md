# Hut-puff render snapshot and cleanup membership

Refs #144. The shipped `GameScene.animate` calls `updateBuildingsFrame`, whose
last consumer is `updateHutSmokePuffs`. That consumer previously created an eager
`flatMap` puff array and searched it for every cached sprite. A Scene-owned weak
snapshot now refills the ordered puff references and serial set at the same
**before-cleanup** boundary. The captured secondary owner still supplies animation
frame arithmetic; later pose/frame reads retain the existing live-record behavior.

The allocator in `secondary-effects.ts` owns serial creation and the 160-slot
secondary pool. `stepSecondaryEffects` emits full-hut children through the existing
reserve20 admission rule, defers newly prepended children, and owns their sixteen
visits. Those producers, pool admission, lifetime, restore, RNG and draw laws are
unchanged. Cached NaN serials still fail the original strict equality and are
removed each frame. Duplicate serial order, signed zero and Infinity remain
compatible. The remove → releaseGroup → map-delete sequence and later HFX drawing
body are byte-identical to the baseline.

The snapshot array is overwritten and truncated every call; the set is cleared
and rebuilt. Its references last until the next refill or Scene collection. This
removes the former `flatMap` result Array object boundary; reuse of the Array
object does not prove reuse of backing storage, reduced GC or zero frame allocation.
The scope is maintained plain arrays and shipped synchronous consumers, excluding
arbitrary custom serial-mutating accessors, Array species and same-Scene reentry.

The actual-caller tests bind the maintained Scene wrapper, transforms, sprite
factory and resource release. A supporting command8 admission reaches an actual
full-root child. Other controlled cases cover cleanup/draw snapshot timing, live
pose edits, captured-owner replacement, shared atlas/Sprite geometry ownership,
ordered disposal, repeated frames, restored NaN/duplicate serials, load, empty/refill
and independent Scenes. Full expected World, terrain and both RNG owners are
compared; explicit observer mutations are accounted for. Existing natural
admission/lifetime/pause/restore and building-resource cases remain unchanged.

Fresh paired command at tested head `0478e4317c8f183c9e134b268eade66de59a8310`
and pristine main `d38c88dca5cdc4be15d94d99e7895e7cff571c7b`:

```sh
node --test tests/hut-puff-render-view.test.mjs tests/secondary-hut-smoke-scene.test.mjs tests/building-mesh-reconciliation.test.mjs
```

The same fifteen cases produced **15 passed / 0 failed** on the candidate and
**13 passed / 2 failed** on the unchanged baseline. Its distinct failures are the
serial-read scaling and `flatMap` result Array object assertions. All populations
use the maintained allocator with reserve20, stay below the real pool limit, and
run three warm measured frames with puff-only secondary entries and empty
building/plan maps. Counts come from the complete maintained building-frame
caller; no total-frame timing or other occupancy/controller cost is claimed.

| Puff population | Candidate serial reads/frame | Baseline serial reads/frame | Candidate/baseline result Arrays over 3 frames |
| --------------- | ---------------------------- | --------------------------- | ---------------------------------------------- |
| 16              | 32                           | 152                         | 0 / 3                                          |
| 64              | 128                          | 2144                        | 0 / 3                                          |
| 128             | 256                          | 8384                        | 0 / 3                                          |

Baseline result arrays retained 48, 192 and 384 puff references respectively;
candidate observations retained none. All 351 focused inputs are bound before
and after both runs; 350 are identical across the pair. Every pristine maintained
app byte matches the exact baseline Git source. Reversing only the reviewed
snapshot/index edits recovers the entire production file.

Scoped Oxfmt and both ESLint runs **passed**. Strict Oxlint remains **failed** on
both sides with the same six warnings and one error. The separate comparator
**passed**, preserving complete severity/rule/message/help text and multiplicity
while normalizing only numeric source locations. Original failed lint and
baseline receipts remain distinct from successful comparison evidence.

Author full check/build: **not run**; root owns the exact published-head gates.
Browser, native acceptance, hardware frame performance, backing-store/GC effects,
deployment and whole-issue #144 acceptance are **not proved** by these results.
Detailed receipts and portable review evidence remain **local only** under the
current disclosure hold; this note carries the bounded source/result claims.
