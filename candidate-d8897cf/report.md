# #214 ordinary d889 candidate capture

The single authorized ordinary Mission1 capture and the frozen offline predicate
**passed** on clean `d8897cf8eeac1886d2f653af2cad0674c6bfa91a`, with zero failures or
inconclusive checks. This is bounded person gameplay/presentation evidence for
the logical-visit repair. The separate implementation review, native packet and
portable lifecycle/refresh/restore tests retain their own acceptance scope.

## Observed change against the retained baseline

The [immutable a53 baseline](https://github.com/JohnDeved/populous-new-dawn/blob/8b5e2134e21b1e128e5e100e4530af1042b75ee5/README.md)
captured flags3=0/stamp=0 and95 same-turn frame advances across opening/resume.
The unchanged browser driver now captures gate bit0x40000 and current logical
turn stamps on the repaired sources. **284 stable logical-owner pairs with an
extra presentation visit but no logical turn retain f1/f2/stamp.** The1544
checked stable completed-turn pairs have stamp equal to the observed World.turn.

Opening spans8.033 s with193 presentation visits /97 logical turns. Public resume
has97 /49; shipped2× has96 /96 over3.9999 s; restored1× has49 /24. The existing
24Hz presentation accumulator matches actual elapsed scene time independently of
speed, and secondary-smoke serial deltas match presentation visits. These are
captured browser clock observations, not an original-game Hz measurement.

All **2,480 native frame selections and mesh draws**, **4,960 existing visible
person-layer UVs** and **447 partial hut-smoke UV samples** match their source and
imported atlas records. There are22 genuine native walk samples. Stable Shaman
mode2 windows supply332 unaliased comparisons,227 with positive turn deltas, at
both1× and2×. Every checked delta follows logical turns rather than extra draws.
All public/settings pause samples preserve native state, clocks and frame/UVs.

Source/object/draw and state/flag boundaries are retained as exclusions, not
assigned a fictional count of unseen native visits. In particular,
`sourceObjectDrawBoundaries` also counts missing native-source endpoints; it is
not a count of actual source swaps. Repeated artwork can share atlas pieces even
when its frame index changes. No screenshot alone proves cadence.

Only **partial hut smoke** is observed as the unaffected artwork control. Splash,
full hut smoke and damage smoke are **not observed**, and no effect was injected.
Their native/portable coverage remains separate. No Save/reload row was added;
the reviewed portable restore/new-scene-clock evidence owns that boundary.

## Exact inputs, reproduction and artifacts

- Observer SHA256 `cb57bd7076cedb08b042b6f8ad843b088fc613ae6863f3fed3742944eb88a060`.
- Offline predicate SHA256 `3aaf2a16871eccbb381dd849bac1ce9a020e95be8c5865f0c1cdc4394106c93d`.
- Corrected launcher SHA256 `6387b423343849abb61a095bbd56beca06738a80151bffa2a8a1617c0a9407b2`.
- Raw rows SHA256 `cd988093a996f8e03a7e44b0127b0f41319418f447cebb029259982ba40bc906`.
- Offline result SHA256 `b91910c036ab6cb135e4fd6d54cf53c2160457b06752503260e60f39c801a13f`.

From `sprite-animation-gate-fix`, reproduce the saved-data check with no browser
or dependencies:

```sh
python3 ../integration-publish-recovered/work/orchestration/sprite-visit-ordinary-214/analyze-candidate.py \
  --observations work/orchestration/sprite-visit-ordinary-214/candidate-d8897cf-raw-owners/sprite-observations.json \
  --source-root "$PWD" \
  --expected-source d8897cf8eeac1886d2f653af2cad0674c6bfa91a \
  --output /absolute/fresh/candidate-cadence-attribution.json
```

The frozen predicate's existing a53 negative control fails for missing gate,
same-turn advancement, wrong logical cadence and stale stamps; ordinary controls
and frame/UV linkage pass there. It remains separate from this candidate pass.

The raw directory contains three original PNGs, complete observations, offline
attribution, server diagnostics and the inner receipt. Adjacent command/launcher/
terminal receipts retain exact source, input/runtime/browser/lock hashes and raw
command streams. Opening and2× screenshots were visually inspected: Mission1
followers, island, smoke and shipped HUD render. Console errors are absent;
retained warnings include a preload-as warning, software-WebGL fallback, ReadPixels
stalls and two missing-image texture warnings. No blanket texture-readiness claim
is made. Chrome154 uses sandboxed SwiftShader at1440×1000/DPR1, not hardware-GPU proof.

## Terminal ownership

Original session **81430 exited0**. Outer/inner receipts passed and exact source/
explicit input hashes remained stable. The corrected launcher requires the parsed
inner passed status with no failure/previousFailure before accepting browser
cleanup, and separately verifies closed IPv4/IPv6 port4374 in the same launcher
namespace. The lane was released before offline attribution. Dependency inode
**925605 remains at the author's frozen checkout**; no dependency move, install,
source change, extra capture or package job occurred. No resources remain held.
