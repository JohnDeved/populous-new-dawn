# Mission 2 authored Land Bridge activation assessment

Status: bounded component observation ready for independent review. No production
files changed, no defect ticket opened, no implementation or full-world timing
claim. This is separate from Erosion issue 223 / PR 224.

## Finding

The original reward clone's immediate `004ed700` call performs meaningful bridge
initialization. It is not an empty call, and it does **not** deform terrain on this
first visit. In the supplied Mission 2 case it advances controller turn 0 to 1,
binds its coarse endpoints and axis, and caches direction, cross increment, height
increment, and raise-water state. The next explicit controller visit advances to
2 and performs the first terrain/trail pass.

The current browser component implements both visits exactly for this case.
However, the authored reward adapter creates a turn-0 controller after the effect
loop. It does not perform the initialization visit at reward creation. This is a
source-supported difference at the creation-return boundary. This probe does not
assign those boundaries an absolute game tick or establish native mixed-class
iteration order. It is not evidence of an Erosion-like first-call terrain change,
nor evidence against the accepted PR 191 final terrain/origin/save results.

## What existing evidence settled

- `scripts/check-native-authored-bridges.py:163-177` already asserts processing
  state 25 and controller turn 1 immediately after `004fb270`, before its later
  dispatcher loop.
- `decomp/generated/0050ee00.c:20-90` and `app/land-bridge.ts:50-66` describe the
  turn-1 initialization return; terrain traversal starts only on later visits.
- `tests/authored-bridges.test.mjs:42-59` explicitly expects turn 0 upon ordinary
  Mission 2 reward creation, then compares later ticks to component visits.
- `app/world-turn.ts:918-927` creates the bridge after the effect loop at 567-849.
  `createLandBridge` at `app/land-bridge.ts:27-39` leaves cells/direction/heightStep
  at zero until the first component step.
- `scripts/check-native-land-bridge.py` already compares complete controller
  timelines, ordered trail requests and terrain notifications. Its random Python
  generator selects test cases; it does not prove the original game's RNG.
- `decomp/research/authored-bridge-origins.md` explicitly limits its optional
  ordinary-browser capture comparison to endpoints and final terrain, not
  per-turn browser observations. The authored report aggregates all visits; it
  does not retain exact first/next-visit event snapshots.

Thus existing evidence settled the nature of the initialization and the source
adapter difference. The new two-visit probe supplies exact authored snapshots,
instruction provenance and explicit RNG/interception boundaries. No old receipt
was rerun or overwritten.

## New observed states and events

Source: accepted main `b28b031f6917f6d814536ba10a7d46e7be71de05`, clean before
and after. Raw Mission 2 authored terrain, all terrain flags supplied as zero.
Endpoints are decoded from record 60, not supplied by the probe:
`(47872,24832)` to `(51968,24832)`. Trigger record 59 has only link token 61.

| Boundary | turn | alongY | startCell | endCell | direction | crossStep | heightStep | raiseWater |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | --- |
| Native initialized template before clone | 0 | false | 0 | 0 | 0 | 0 | 0 | false |
| Port `createLandBridge` return | 0 | false | 0 | 0 | 0 | 0 | 0 | true |
| Native authored reward return / port visit 1 | 1 | false | 24762 | 24778 | 2 | 0 | 0 | true |
| Next native explicit dispatch / port visit 2 | 2 | false | 24762 | 24778 | 2 | 0 | 0 | true |

Native processing state is 25 at reward return. Both port visits remain alive.

- Visit 1: no changed terrain heights, trail allocation requests, terrain-queue
  calls, or height-change notification calls. Initial and post-visit terrain hash:
  `c81ced8d62c38bff72a0afaac4cfde17d1ab116fe5bdc34bfbaacea9c6ffb460`.
- Visit 2: 36 ordered model-3 trail allocation requests; 36 ordered
  `0044ddf0(cell,2,1)` calls and 36 paired `0044f2f0(1,cell,2,-1)` calls. Only 28
  heights numerically change, each 0 to 1. Eight nonzero differences round to zero
  after division, but still produce notifications. This is why notification count
  must not be reported as the number of actual height changes.
- Visit-2 terrain hash:
  `0875f3c9bbf87747c33d3065185c14b426044ff51c54d92cb8f2980bd5b64d60`.
- All component state fields, all 16,384 terrain heights, ordered trails and
  ordered changed-cell callbacks agree between the corresponding native and port
  visits. Full ordered arrays and exact cell indices are in `observations.json`.
- Raw x86 stack slots for narrow cell arguments retain irrelevant upper bits;
  cell identity is their low 16 bits. `observations.json` preserves raw notification
  stack slots and the normalized changed-cell list separately.

## RNG and presentation boundary

The supplied gameplay seed at `0089d178` is `0x12345678` (305419896), and the
cosmetic seed at `0089bc72` is `0x87654321` (2271560481). Both remain exactly
unchanged on both native visits; memory hooks observe no writes to either stream
in the executed component. The pure port bridge component has no RNG access.

This is intentionally **not** the composed game's complete cosmetic RNG result:
the inherited harness returns supplied storage for model-3 trail allocation and
does not run its native initializer. `decomp/generated/0050bf60.c`,
`scripts/check-native-spell-trails.py`, and `app/spell-trails.ts:65` separately
establish that successfully initializing each model-3 trail consumes one cosmetic
draw. The live bridge callback in `app/world-turn.ts:809-824` runs that port
initializer. No composed next-visit native cosmetic-stream claim is made here.
Gameplay RNG inside intercepted presentation/notification consumers likewise is
not assessed by this probe.

Native clone model initialization requests sounds 171 and 41 at `0048a050`.
Those requests are recorded as intercepted leaves and are distinct from the
`0050ee00` first-visit behavior. Sound execution, rendering and visual timing are
outside scope.

## Original instruction provenance

The probe verifies original EXE SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
Mission 2 DAT SHA-256 is
`83f5c446975398b163ef00526567f7a86b2666d26f9f026231ec0b36bf5a289f`.
It reuses `native_cpu` and `configure_native_constants` and the exact reviewed
authored-harness setup with one event-logging insertion. It executes the original
record decoder, model initializer, copy and dispatch, rather than reimplementing
their behavior. The scratch allocation thunk is explicitly supplied harness code.

`executed-instructions.json` retains 6,872 ordered original instruction addresses
and bytes, excluding intercepted entry bodies and scratch thunk bytes. Relevant
observed call sites:

| Address | Original bytes | Target / action |
| --- | --- | --- |
| 004fbb67 | e8a422ffff | Call 004ede10 clone copier |
| 004fbb82 | e8791bffff | Call immediate 004ed700 dispatch |
| 004ed78e | e8bdcf0100 | Call 0050a750 class-7 processor |
| 0050a981 | e87a440000 | Call 0050ee00 bridge controller |
| 0050ee0e | 6641 | Increment 16-bit visit counter |
| 0050ee1e | 66894e6c | Store incremented counter at +0x6c |
| 0050ee2c | 6683f901 | Compare counter to 1 |
| 0050ee30 | 0f8595010000 | Branch to later-visit path at 0050efcb |
| 0050efca | c3 | First-visit initialization returns |
| 0050efe9 | e822000000 | Later visit calls 0050f010 terrain traversal |
| 0050edd7 | e814f0f3ff | Terrain queue leaf 0044ddf0 |
| 0050ede6 | e80505f4ff | Height-change notification leaf 0044f2f0 |

No additional Ghidra export or project access occurred. Existing exports remain
indexed in `decomp/exports.json`.

## Reproduction and receipt

One coordinator-granted foreground CPU-4 invocation, bounded by 60 seconds:

```
timeout 60s taskset -c 4 env PYTHONDONTWRITEBYTECODE=1 \
  /workspace/scratch/69fd8163d94e/cloud-dev-20261004/prerequisites/venv/bin/python \
  work/orchestration/bridge-reward-activation-assessment/probe.py \
  /workspace/scratch/69fd8163d94e/cloud-dev-20261004/prerequisites/game/d3dpoptb.exe
```

Wrapped by `scripts/orchestration/command-receipt.mjs`; complete exact argv and
input hashes are in `receipt.json`. Result: **passed**, exit 0, terminal raw
stdout/stderr retained in `receipt.json.artifacts/`; source and every explicitly
bound input unchanged. Tool versions are recorded in `observations.json`.

| Artifact | SHA-256 |
| --- | --- |
| probe.py | d5ed3a8c2b7bee1f6306f6c64681e792552e878210a483dab15dfe91af152b11 |
| receipt.json | cdc05b83d5602b65b71b0230e271a5ab967e974d0b32f169dc8c2da0e2dea451 |
| observations.json | 069a1f6d9cf1555e04ab66135e2a56b2957d1adb2e3549f2e59ceb50d5740770 |
| executed-instructions.json | 374fb20c75729b816a73d7a2437a80703bf3a4ea9f7c3ec9ab504d9bc6ebe332 |

## Limits and next decision

Supplied: forced worship completion and head visit byte, allocation storage and
identity, deterministic RNG seeds, raw authored heights and zero flags.
Intercepted leaves (unchanged from original authored harness): `004ed8a0`,
`004ef180`, `004edcf0`, `004fc290`, `004fbd20`, `0050bcd0`, `004ed6f0`, `004ed640`,
`0048a050`, `0044ddf0`, `0044f2f0`, `004be230`, `004bdff0`.

This executes no native mixed-class list, ordinary native worship progression,
terrain queue processing, notification consumers, original OS game, browser,
package/aggregate job, audio or renderer. No old profile, active Erosion capture,
or its dependencies were touched. `npm check/build` are not applicable to a
read-only component assessment with no production changes.

The bounded question is answered: the immediate native visit performs controller
initialization; it has no first-visit terrain work; the port's corresponding two
component visits match exactly. Creation-return state differs in the authored
adapter. Independent review should classify that narrowly before any defect or
implementation claim. A claim about the first ordinary game's rendered/ticked
terrain change would additionally require a synchronized native mixed-class
scheduler capture and ordinary browser activation/next-pass trace. That broader
experiment is not required for the present component finding and was not run.
