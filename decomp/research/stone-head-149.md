# Default149 Stone Head: bounded implementation prerequisite

**18 September 2026; inspected main `bb5980c2bc85fdfc9bd91d5bdc58eb9866b3bebb`.**
This note scopes the default149/150/151 family after the accepted model45 and
orientation work. It does not implement that family, modify Worker5's active
mode3/base8 work, or claim complete issue21 acceptance. No new native executable,
emulator, browser, build or graphics workload ran in this research slice.

## 1. Authored entry, not a legacy model-number guess

The [post-load linker](../generated/004851e0.c) connects a class6/model6 controller
to the first class5/model9 scenery in the same native512-unit cell. It derives
bits0x20/0x10 from linked class6/model2 rewards: imported `settings[2]` is the native
byte+0x80; values3/1 select those respective flags. The default149 branch applies
after the higher-priority mode/family tests in `004fbd20`. It must not be selected
merely because the browser currently calls a head model45 or stores no animation.

The bounded, immediate implementation targets below all have mode0 and no derived
0x20/0x10 flags. Their rewards are landscape effects or a boat rather than those
special class6/model2 grants. The original and browser IDs are deliberately kept
separate:

| Mission | Original trigger / scenery | Linked original object | Current Shrine ID / kind | Original heading |
|---|---|---|---|---:|
| 3 | 101 / 102 | 103, class7/model23 | 101, `erosionEffect` | 1536 |
| 5 | 96 / 125 | 126, class7/model24 | 94, `bridgeEffect` | 1024 |
| 5 | 101 / 102 | 100, class4/model1 | 98, `boat` | 0 |
| 5 | 113 / 114 | 115, class7/model24 | 109, `bridgeEffect` | 1536 |

Actual `createWorld` calls on the inspected source return **model45, `morph:null`
and `stoneHead:null` for all four**. The geometry family and animation are therefore
missing, while the corrected decorative headings already match the original
records. The selected original level records were SHA-checked; this is initialized
current-world evidence, not new rendered screenshots or an observed playthrough.

The earlier orientation probe already executed original `00485b00` and `004fbd20`
on Mission3 trigger101/scenery102 and Mission5 trigger113/scenery114: it selected149
and preserved heading1536. That receipt is reused unchanged. Its paired browser
model submissions were for45, **not an executed149 animation/pixel proof**.

Negative controls matter. Mission1 automatic spell heads are45; Mission22's mode3
heads are8; a Mission5 angel context is157. Vault/mode4 ownership is separate.
Neither `stoneHead:null`, reward kind, runtime `id`, nor absence of a45 source is
by itself a safe149 classifier. The first slice can remain the evidenced mode0
source family without inventing semantics for every other trigger mode.

## 2. Exact known resource and sequence requirements

The scoped static check reads only the known bank2 OBJS/FACS/PNTS/MORPH inputs:

| Input | SHA-256 |
|---|---|
| `objects/objs0-2.dat` | `e1af6bdf050608d7c1832700826bece72ca592abdff3ee9c2138c50ed8a8607d` |
| `objects/facs0-2.dat` | `01a9a6d02efa0d35f7026cd97f8e01f72cbfb72e94217efe8256e8fe43597e9a` |
| `objects/pnts0-2.dat` | `09ebbdc9496d2ebd3a932be96af3fd27e6701a41105a5154aec4abe39e50b911` |
| `objects/morph0-2.dat` | `1939b4d30839f2ab49ea110abb29d40eb001d6cc6fa4932be72ce44c3aebf066` |

The retained bank2/6 comparison already found the relevant blocks identical; that
prior result was not rerun as a new native workload. Morph record7 has base149,
keys150/151 and length-minus-one values8/8. Its raw368-byte record SHA is
`c30a9953dc06a4e29758a83ed820209d18113c588880872e89be37f2e8929e30`.
The existing [normalization](../generated/0040ce30.c) yields:

| Phase interval | Source / destination keys | Interpolation divisor |
|---|---|---:|
| 0–8 | 150 → 151 | 9 |
| 9–17 | 151 → 150 | 9 |

There are **18 animation visits per cycle**, not18simulation turns and not a newly
proved wall-clock duration. The accepted engine's24Hz presentation boundary can be
reused; the native frequency/visibility-catch-up qualification from the
[45-family note](stone-head-animation.md) still applies.

All three objects have **51faces,51raw points and scale160**. Base149 raw positions
are exactly key151's positions. Keys150/151 differ at point indices30–41: twelve
points and24coordinate components. Two raw key blocks require612bytes before JSON
encoding; the base face block occupies3060bytes. Final decoded JSON size has not
been guessed or generated.

Equal counts do **not** imply identical face data. The complete original face-block
hashes differ:

| Object | Face-block SHA-256 |
|---|---|
| 149 | `b9909659a6d65448694c39f5c0acd8fb324b218405eb4ada8952bbd5b493f9f7` |
| 150 | `155b84815abceea70585e69d88fd5752e7531085eb45e6a61436537773a3bdb6` |
| 151 | `5734ca7e31450cb998de13808ff3258f1dae513581b9d9db431a683671bd0c48` |

Preserve base149's face/index/UV/material/normal/bias data and interpolate only
corresponding signed-short positions, as the existing
[morph consumer](../generated/0040c9f0.c) does. Do not borrow45's52-point topology or
swap independently expanded150/151meshes. This check establishes raw block/count
identity and sequence arithmetic; it does not yet decode every face/material or
certify atlas coverage, lighting or GPU/picking behavior.

## 3. State entry and timing:149 is not45's idle loop

The accepted retained selector analysis identifies default149 as draw4/scenery
presentation mode4. Its state distinction is:

| Controller condition | Retained original149 presentation |
|---|---|
| Disabled | Hold frame1. |
| Enabled, no sampled worshippers | Hold frame7. |
| Enabled, sampled worshippers present | Release the ordinary18-visit morph loop. |

This interpretation comes from the earlier selector/morph research; no new149
setter/clock run was performed here. The [controller](../generated/004fb270.c)
provides the upstream event evidence: its eligible fourth-phase sample sets or
clears bit8 and notifies `004fbd20` when worshipper presence changes. It also calls
the selector on disable/refill/reset paths. The current `world-turn.ts` likewise
updates `shrine.followers` only on the existing fourth-turn work sample before
`stepWorship`, then makes the existing45 presentation notification.

Use that already sampled presence, not a new per-render proximity count, a live
mouse/selection flag, work progress or a threshold guessed from45. Hold/release
must preserve the native counter semantics; only the original object-reselection
paths reset it. Full149 entry/leave/disable/refill/reset, final-use scenery lifetime
and any same-interval transitions still need a focused original comparison during
implementation. Do not import45's always-enabled idle loop or mode3's frame49
completion by analogy. Cue193 synchronization remains an explicit later boundary.

## 4. Legacy checkpoint and heading preservation

Current ordinary unsupported heads serialize **explicit `stoneHead:null`**, not
only an absent field. A cloned current checkpoint restored through
`migrateCheckpoint` preserves that null. Calling the current45 initializer on
null leaves it null; deleting the field merely causes the same unsupported family
to be classified back to null. This is a migration trap for a future implementation
that checks only `undefined` or assumes every null is149.

Prefer a149-specific optional presentation record with an explicit family/source
identity and counter/hold state. Lazy initialization must revalidate the authored
mission, trigger index, scenery index and selected family for both old null and
absent presentation data. It must leave existing45/8 state and unsupported families
untouched. A separate field can avoid rewriting the accepted45 checkpoint shape.
No game-store or broad save-schema edit is currently justified: structured cloning
already retains optional plain state. New saves preserve real149 phase; old saves
receive a documented deterministic initial hold, not fabricated historical phase
or replayed work/rewards. Validate disabled, active and retired-controller cases.

The [orientation fix](stone-head-orientation.md) already supplies canonical scenery
headings for these examples, including0/1024/1536 and the previously missing high
byte. Keep `stoneHeadAngle` and existing level metadata unchanged. Derive149 as a
presentation model before factory/update use while retaining legacy controller
`model`/`angle` and reward identity where possible. Heading does not come from the
morph, trigger-settings word, runtime Shrine ID or camera bearing.

## 5. Smallest missing ownership and proposed outputs

**No runtime or generated output is changed in this research slice.** Coordinate
against Worker5 PR64's next clean boundary before reserving overlapping files.
The minimal proposed increment is:

1. A dedicated `app/stone-head-149-animation.ts` with focused tests: source-only
   family classification, optional149 state hydration, sampled-presence transitions,
   original integer morphing and bounded18-frame position caches. Reuse generic
   animation/morph functions without modifying their45/8 behavior.
2. One optional149 presentation field in `Shrine`; one149 call on the existing
   presentation-clock boundary; one149 notification after existing sampled work.
   These are narrow `world-types.ts`, `game-clock.ts` and `world-turn.ts` hunks,
   not changes to work, admission, RNG, rewards, simulation timing or45's helper.
3. A149-only derived-model/position branch in `scene-entities.ts`, preserving
   Worker5 mode3/Vault branches and existing orientation. This can hydrate lazily
   before mesh creation and avoid any initializer or game-store edit.
4. A scoped standalone import/check path, with exactly these **proposed** outputs:
   `app/original-stone-head-149.json` for raw keys/segments/base-index correspondence;
   append **only model149** to `app/original-models.json`; and one additive
   `stoneHead149` entry in `public/original/provenance.json`. No150/151shared model
   slots,45/8 replacement or PNG change is proposed.

The base149 record is a genuine missing dependency: the current
`scene-assets.ts:nativeModel` resolves geometry, UVs, material modes, scale and
lighting metadata from the shared model bank, which contains none of149/150/151.
Appending one base record is narrower than cloning or generalizing the shader,
picker and model loader to accept a second model registry. Existing entries must
be preserved byte/semantic-equivalently and reconciled with Worker5 ownership.
Before generating, the scoped decoder must establish base149face attributes and
that its texture references are already in the existing atlas. If coverage is
missing, stop and request only the demonstrated extra output; this note does not
authorize or assert a new atlas requirement.

## 6. Bounded acceptance and remaining limits

Reuse the retained45 generic-morph proof and the149 selector/heading receipt, but
do not count those as an animated149 acceptance run. Once implementation is
reserved, one focused queued original comparison should cover the full149face/
point correspondence and18phases, sampled worship enter/leave, idle7/disabled1,
reset/refill/counter-wrap and final-use behavior without intercepting the compared
bodies. The proof must distinguish supplied allocation/visibility/trigger fixtures
from a native playthrough. New native workloads were explicitly excluded here.

Use the real authored Mission3 erosion and a Mission5 bridge/boat head for the
smallest shipped acceptance: original149mesh and heading, normal admitted worship
through its existing reward, interruption, pause, legacy/new checkpoint restoration,
independent heads, selected frame schedules and CPU/GPU/picking agreement. Do not
repeat unrelated45/8 suites merely to acquire a passing count, and do not certify
FPS from synthetic schedules. A full normal reward run, other native trigger modes,
149 audio timing, material/atlas coverage and final rendered geometry remain open.

The research's28-condition resource check is static and read-only. Current-world
and checkpoint observations use cloned/imported application state without stepping
the simulation. One missing optional setter export and a safety-status-blocked
combined source read are retained as tool limitations, not bypassed with new
exports/native probes. No menu asset investigation was resumed. This note and
ignored evidence are the only writes; issue21 remains open and implementation
still requires the exact ownership above.
