# Tornado building wood correction: proposed boundary

Base: `3b13a7ff534ab95797b0b06330055cead956160d`.
This is source/test preparation, not a runtime or ordinary-play acceptance.
Earthquake, radius ownership, `world-turn.ts`, `computer-runtime.ts`, checkpoint
schema, original execution and held raw archives remain outside this change.

## Accepted source

Reuse the [accepted static packet](https://github.com/JohnDeved/populous-new-dawn/blob/9694f1f2156c4c06a6128278f16c6eac1dd35ba2/decomp/research/selection-radius-source-20261010/tornado-retirement/findings.json)
and its adjacent review; do not decode or execute original bytes again.

| Artifact | SHA256 |
| --- | --- |
| `review.json` | `43c5473526e6020bf203394c21293dc5207bf0581f89d2e1c8737d9da6cbe3cd` |
| `caller/manifest.json` | `db1b70b89667a9946f3d73b6ed74357756552d06ccff60bf3bc5bb27ac7abfd5` |
| `work-owner/manifest.json` | `5d0e8dc40f4a1ca6cd7cbd0bc450a7573083bf34b183a67cb84c7edee04528db` |
| `retirement-child/manifest.json` | `98c857934b5e40203542ad20aa85107f84cd87fa45f32410bb34d6f66f7d8e9f` |

The accepted caller saves stage and decrements the stage byte before calling
`004980a0(building, 1)`. That helper ensures/reuses the linked plan via retained
`00498140`; a missing/deleted/class-zero plan returns without allocating wood.
Positive signed work attempts exactly one `004ed8a0(5, 11, 255, &building.position)`.
Only successful allocation calls `004ba2c0(plan, -100)`. Signed remaining work at
or below zero calls `0040b130`: plan cleanup/retirement followed by building-loss
credit and building retirement. The accepted retirement chain is
`004ef180 -> 00403820 -> 004edcf0`.

After that helper returns, the Tornado caller updates the building attacker unless
the incoming byte is 255. Only a still-live linked plan receives the repair delay
and non-255 attacker. Retired building or final stage unequal to saved stage emits
debris and sound 18. Therefore allocation failure can still change stage and emit
debris, even though work is unchanged. A successful allocation can restore the
same final stage as before and should not emit debris merely because the
intermediate decremented stage differed.

## Proposed runtime delta

- Add a Tornado-specific building callback beside the existing disaster callback
  in `app/building-runtime.ts`; route only `app/tornado-runtime.ts` to it.
- Reuse `ensureBuildingDamage`, `changeBuildingWork`, current debris/sound owners,
  and the existing building-owned plan and hp-zero retirement endpoint. Preserve
  distinct stored `stage` and `plan.remaining`. Transition complete state 2 to
  repair state 1 under the existing `!(flags2 & 0x100000)` condition.
- Snapshot stage, decrement with byte storage, make the one wood attempt when
  signed work is positive, conditionally subtract 100 through the maintained work
  helper, then retire on exhausted work. Final stage versus initial stage and
  retirement decide debris; attacker/repair bookkeeping follows source order.
- Use exactly the existing non-jittering adapter shape used by construction,
  building entry and resting: `{ id: w.nextId++, ...browserPosition(point),
  logs: 1, model: 11 }`, appended to `w.trees`, with `true` result. `point` is the
  current `nativePosition(w, building)`. The conversion wraps signed x/y into x/z;
  no h/team/reservation metadata is added and no RNG is consumed by this adapter.
  Do not reuse celebration's caller-owned centering/two jitter draws. Do not
  refactor other producers or introduce a global allocator.
- An optional supplied allocation callback belongs only to the Tornado-specific
  building helper for component failure controls. The shipped caller uses the
  existing always-successful array adapter. No `stepLiveTornado` test override,
  native pool simulator, checkpoint field, or UI control is required.
- Keep the old Earthquake callback byte-for-byte unchanged. No stock/grant,
  Tornado movement, class-5 scenery, radius, or simulation order change.

The port already creates its damage-state plan eagerly from progress/combat hp.
Native plan allocation/deletion failure, complete original full-life plan
initialization, physical object slots/IDs, neutral tribe representation, scenery
initializer RNG/history, mixed-class scheduling and full retirement effects are
not newly proved. Building-owned plan/hp-zero removal is the accepted supported
live success adapter. Supplied allocation failure demonstrates control flow only,
not an actual production failure path or native pool-exhaustion parity.

## Failure-first caller tests

Add `tests/tornado-building-wood.test.mjs` before any runtime edit. Start with the
existing real `stepLiveTornado -> stepTornado -> damage` chain, a stationary
controlled effect, one live building and deterministic admission seed. These are
explicit controlled Node cases, not ordinary campaign evidence.

1. Successful Hut hit appends exactly one model-11/logs-1 tree at the target's
   current wrapped position, with the pre-call nextId before later debris IDs. Work
   becomes 200, stage 2, hp/progress follow retained adapters. This must fail on
   base because no wood is created. Assert no unrelated existing tree mutation.
2. Existing plan is reused by identity; repeat successful hits exhaust work,
   create one log per hit, set hp zero and do not hit the retired building again.
   Later actual `tick` checks that the ordinary cleanup removes it and its
   landscape membership. Tie checks to the real caller rather than a replacement
   callback implementation.
3. Protected model, rejected RNG draw, preparation-only building and hp-zero
   target produce no tree/work/stage changes. Retain existing Tornado protection
   and one-draw tests; maintain person/tree behavior.
4. Through the new helper after implementation, supplied allocation failure sees
   the already decremented stage and repair-state plan, returns false, produces
   no tree/nextId/work/progress/hp loss, but retains stage decrement and source
   attacker/repair/debris behavior. Include 0-to-255 byte wrap as component state.
5. Final-stage-unchanged success suppresses debris/sound18 even though stage was
   temporarily decremented, so this case also asserts exactly one total nextId
   increment and no RNG draw from the wood adapter. Attacker255 preserves prior attribution; retired plan
   gets no post-retirement delay/attacker writes; existing exhausted work requests
   no allocation. These distinguish ordering errors from the happy path.
6. Existing refresh-schedule Tornado test and existing Earthquake tests must pass.
   Add no generic disaster test override or assertions that mirror only a helper.

Independent source/test-scope acceptance is required before runtime editing and
focused execution. Then retain failing base and passing candidate source-bound
receipts on CPU4 with a fresh TMP/cache. Dependency identity was read back as
inode538212/device27 at the coordinator's stationary node_modules, installed lock
SHA256 `65e45d0a87d1ecd4fbf56508b9821eb3bfb3867c8477db4aaa1452eb2bed13d8` and
repository lock `c1599d8d7e3f028e290a13561c653cf926e739e98eb9ec1b476dbe1c2a4558ba`.
Only a worktree-local symlink is authorized; no install/move/copy. Standard gates,
quality and browser work await a separate serialized coordinator grant.

## Ordinary M2 witness proposal

First inspect a known owned profile's metadata and committed-checkpoint provenance
if the coordinator supplies one. The obvious current camp/recovery locations had
no profile metadata. The retained October4 M2 checkpoint is in the held archive;
it is not an admissible input here. Do not restore raw world JSON, copy a profile,
change ownership guards or treat a fixture as earned stock.

Fallback: fresh shipped All missions -> Mission2 entry, ordinary Skip introduction
when offered, real RAF at normal game speed. Reuse `bindGame`/`showAllMissions`
from `scripts/browser-game.mjs`, public input methods from
`scripts/local-render/mission1-vault-input.mjs`, and its maintained
`qa/erosion-ordinary/input.mjs` and `minimap-input.mjs` helpers. Despite its M1 name,
the input helper has caller-supplied actor/target identities and generic view,
selection/entity-order and spell-picking methods; M1-specific Blast assertions
must not be repurposed for Tornado. Any additional spell observer remains small
and independently contract-tested before launch.

Verify authored shrine55 is the bridge-effect totem, initial Tornado stock is zero,
and head56 is the Tornado reward. Select the actual Blue Shaman via HUD; use real
minimap/canvas input to issue the public shrine55 worship order and wait for the
ordinary bridge start and completion. Walk through the earned crossing using
ordinary command input; send the required living followers to head56 and wait
for its three actual gifts. Read stock/use increments and preserve actor/head
identity; no forced stock, effect, clock, command, camera or terrain writes.
The retained [ordinary M2 route](../../references/verification/mission-two-controls-2026-10-04/README.md)
already observed shrine55, the crossing, two worshippers, three gifts and two casts,
but its failed checker envelope remains failed and is not a passing new witness.

Approach a current authored enemy building with the real Shaman. Choose and bind
its identity after fresh eligibility/range checks on a detached world clone;
pause only through public controls for before capture. Observe actual HUD Tornado
choice and the delivered canvas pointer, accepted stock decrement and spawned
projectile. Resume and observe every actual `gameClock.afterTurn`, retaining
unchanged original callback invocation and real Scene/store identity. Keep polling
bounded to the target, owned Tornado effect and newly created loose wood; retain
synchronous per-turn snapshots locally and export evidence once at terminal, not
whole-world/history JSON on every poll. Record target work/stage/hp transitions,
new loose-log IDs/positions and retirement; stop
the success witness after an admitted Tornado impact and verified wood/work
correspondence. Claim exhausted-work removal only if naturally reached; use later
earned gifts as ordinary attempts if needed, never pin/move the Tornado or target.

Do not require Camp construction, victory or another full campaign journey for
this narrow witness unless a proven route prerequisite demands it. Natural actor
loss, unreachable target or no eligible impact is an explicit failed/blocked
witness, not permission for injected replacements. Save/fresh-page Load continuity
can use a genuinely earned paused post-impact state, with awaited IndexedDB
readback and the actual Load UI. Existing maintained checkpoint helpers own that
sequence. Capture comparable current before/after pixels with exact source/head,
browser/renderer and clock boundaries. Publish only reviewed captures later,
embedded inline with verified immutable URLs; software WebGL is not hardware
performance or original-pixel parity.
