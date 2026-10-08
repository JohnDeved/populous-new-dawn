# M1 ordinary building-screen witness: source proposal

Refs #23. Preparation only on verified main `9751eee28bd6f43cac3a84eda350eac71f5a4e8a`, app tree `ba6df35a5a9fcd06b7c9004cd5a833d24f8d359c`. Product proposal `47a8ba13` was independently accepted in verdict `b58400db`. This QA work does not implement or accept the product. No executable browser scenario or launch is enabled. M3 is excluded behind its ANIBL/bank-p prerequisites.

## Recovered source and current input contract

[source-correspondence.json](source-correspondence.json) pins the four necessary PR269 helper modules from `91c9453061e92aa2ada4f4c170904b47c7e56a98`, their complete original/candidate hashes, every dynamic import, and current main consumers/runtime. Movement, guard-presentation and bounded checkpoint helpers are unchanged. No historical app, runtime, package, profile, construction helper or world-art observer was recovered.

Only `mission1-vault-input.mjs` changes: `castInput` composes the current maintained `observeEntityPointer` once and retains its actual delivered picker calls. Its cleanup encloses every post-arm report/save/assertion/input step and only finishes its explicit armed invocation owner. A rejected preflight or changed owner cannot consume another observer. Original callback failures, including primitive thrown values, stay primary and cleanup/save failures remain in the report. It also records the real projectile target/destination/Blast ownership and pointer acknowledgement alongside unchanged before/after stock. Cast and ordinary dispatch observers refuse overlap. It adds no diagnostic re-pick inside a delivered handler and no second picker wrapper.

Current `scene-input-runtime.ts:353–378` tries person picking first for direct Blast. A terrain preflight and stock payment cannot prove ground-only dispatch. The executable `assertMission1BlastTarget` now consumes that pointerup evidence. It validates the actual ordinary gate, trusted release/forwarding, one fresh original-caster Blast windup packet (remaining6/turns0/no visuals), fresh acknowledgement and exact chain: same-object resolved person→retained native destination, or real null-person→terrain pick→native2×2 cell center. Nested picking.pick calls remain visible and are allowed. Non-null unresolved IDs are unsupported QA prerequisites, not game invalidity. Direct-person and genuine ground fallback are both accepted; non-Blast casts retain their existing behavior. Do not chase a person pixel merely to reuse the route or expand stopped enemy Blast QA. A missing/ambiguous trace is a prerequisite failure, not a reason to invent a ground target. The composed synthetic contracts exercise this exact current selector, maintained pointer observer, recovered cast helper, first-save/throw/restoration failures, nested calls, malformed target receipts, overlap rejection, and M1 checkpoint restriction. They are not browser/gameplay evidence.

## Minimal ordinary route to preserve

Use normal harness loopback root → `Start game` → `All missions` → exact `Mission 1`; bind real scene/store and await `waitForShamanReadiness`. Current helper signatures remain:

- `createMission1VaultInput({page,signal,report,save,originalShamanId})`
- `clickEntity(collection,id,command,cast=false,expectedIds=null)`
- `fixedGround(target,spell=null,cellMove=false)` and `moveGround(target,cellMove=false)`
- `castInput(hit,spell)` now also returns `pointer`

The accepted prefix at `91c9453:scripts/local-render/mission1-vault-knowledge.mjs:149–257` remains the source recipe, not a blindly adopted executable. Select the original living Shaman; command27 Bridge head `(-5,25)`; await earned stock; move `(0.5,19)`; public key2/Bridge terrain `(0,4)` and original range margin; await actual bridge/terrain completion; cross with native-cell move; approach `(-5,3)`; handle authored record43 Red guard using normal current input if still necessary. Preserve established readiness/dispatch/movement/guard bounds. No World, stock, clock, renderer or storage injection.

Save a new pre-Vault checkpoint through `Game settings` → `Save checkpoint`, await committed read-only storage, reload, then `Load Game`; capture synchronous World replacement before public Load auto-unpauses. Rebind readiness and the original Shaman. The existing checkpoint helper is adequate only for this pre-acquisition bounded snapshot. It does not yet cover new screen ownership.

Before command33: publicly open `buildings B`, read the disabled `Warrior Training Hut, 8 wood` card and its actual rectangle; return to `spells 1–3`. Card DOM exists only on Buildings. Arm passive screen observation, resume and dispatch command33 to the real authored camp Vault `(-5,-3)`. Accept immediate registered phase0/entering ownership, uncancelled order33/work target; never demand phase≥1 before the next visit. Actual runtime IDs are observed, never assumed from saved946.

Public labels also verified from current source: `Select and focus shaman`, `Pause game`, `Resume game`, `Load checkpoint`, `Restart world`. New profile must be empty and source-bound; old saved946/profile remains historical. Reuse only a genuine checkpoint earned by the same new application.

## Passive observer proposal, pending final interface freeze

The source owner proposes these existing-owner extensions: `Gift.buildingAcquisition` provenance; `world.worshipAcquisition.controllers.building`; existing shared companion/pulse with family/gift binding; and previous/current draw commands containing `kind:'building'`. The supplied building command is `{kind:'building',family:'building',giftId,model:7,geometry,whole,selected,submissions}`; `whole` distinguishes whole/per-face drawing, each submission retains face/transformed/projected/flight. `geometry` is frozen HUD reference; controller x/y/scale/yaw/tilt own model pose. Final composed product/interface review remains pending; the proposal adds no browser API.

Use the existing scene/clock and overlay callbacks. Wrappers call their originals exactly once with identical receiver/arguments, retain returned values/errors, and restore property descriptors. During route movement, the existing move observer owns clock hooks; install the screen observer only after it restores. The input observer independently owns only the trusted pointer dispatch. No new mutation API or shared instrumentation framework.

Proposed bounded observations:

1. `beforeTurn`/`afterTurn`: copy actual gift birth/ID and phase6/remaining82; count subsequent object visits independently. Retain hide at6 (phase0/76, knowledge false), last pre-grant state81 (remaining1/knowledge false), once-only grant82 and gift deletion. `scene.gameClock.afterTurn` already invokes handoffs; inspect state immediately around that existing call, without inserting a second one.
2. Existing `worshipPresentation.visit`: retain pre/post UI clock, building phase/visits/pending, relevant face flags/threshold/countdown, shared companion/pulse/cosmetic RNG, queue and draw commands. World visits, UI visits and actual draws remain distinct. Do not infer one render per visit or duplicate geometry feedback on RAF.
3. Existing `worshipPresentation.draw`: after its real draw, retain existing overlay pixels for the first naturally displayed whole geometry, first naturally displayed per-face flight, and terminal card state. Record actual automatic Buildings selection, disabled card rectangle, mode preservation, source rendered anchor and saved/current HUD geometry at handoff. Pixel capture calls no renderer/clock and leaves RNG/state untouched. Field binding and postdraw purity assertions depend on the finished owner.
4. After grant, select the now-enabled card with the public button and verify camp mode. No construction, battle or victory replay. Carry PR269 unchanged world body/glow assets/pixels after exact consumer correspondence; new birth PNGs are not an added requirement.

Capture only the finite semantic boundaries plus bounded errors and phase transitions, not unbounded full per-RAF state. Preserve pixels before assertion failures. If a required natural screen phase is missed, retain the actual sequence and fail the corresponding screen evidence; never issue a synthetic render or claim an unseen phase.

## Save, Load and Restart ownership

Extend the bounded save snapshot with complete `world.worshipAcquisition`, cosmetic RNG and tagged building gifts once fields are stable. This includes controller/face state, reference geometry, shared companion/pulse, requests, UI clock and previous/current commands. DOM/canvas/texture objects remain transient. Compare committed Save with synchronous Load replacement, not later live UI state; the screen can progress while simulation is paused. Do not reconstruct or reseed from gift age.

Public Load currently selects Spells and unpauses. Check the implemented saved HUD-local fallback/selection behavior and no cue, RNG, handoff or award replay. Restart must clear new ownership using normal new-world state. Choose active pause/save/restart or resize points only after reviewed duration/pause behavior establishes which are naturally reachable. No arbitrary active checkpoint is assumed. Any unresolved active-coverage gap returns to review rather than triggering an extended route.

## Admission boundary and stop

No new harness argument is proposed. The current `parseOptions`, profile input fingerprinting, command-receipt `--input` binding and fresh-profile policy remain unchanged. The source audit checks known helper imports/labels/signatures now. Final `--scenario`, `--browser`, `--port`, `--output`, `--profile`, exact source/runtime hashes and overall timeout are deliberately unset; they require the composed product/interface review and coordinator launch grant. There is no default-export browser scenario to accidentally treat as ready. No browser/full gate/dependency install/copy/link is performed.

This preparation stops at this source proposal and bounded cheap contract receipts. Next work is the minimal observer/scenario adaptation after product interfaces meet and are reviewed. Stop any future run on wrong source/profile/mission, lost original Shaman, missing target receipt, failed input/cleanup, runtime errors, absent required screen phase/locked target, or divergent6/82 behavior. Preserve stopped enemy QA and all failed historical attempt statuses. No parity or native GPU/hardware performance claim.

## Preparation validation

`taskset -c 4 timeout 30s node --test qa/mission1-building-screen/input-contract.test.mjs` passed all6 contracts on2026-10-08T17:20:07Z, exit0,129.65ms test duration. Source-bound receipt: `work/orchestration/m1-building-screen-proposal-01/contracts.json`; all nine explicit input fingerprints stable before/after. Application/runtime/package files stayed unchanged. Full check/build, browser, native, performance and product-interface acceptance are **not run**. The existing pre-Vault checkpoint snapshot still omits new screen ownership and must not be reused as proof of active screen Save/Load.

Changed-only repair validation: receipt `work/orchestration/m1-building-screen-proposal-02/contracts.json` passed12 contracts on2026-10-08T17:53:24Z with exit0; command remains CPU4/timeout30s and all11 explicit input fingerprints are stable. This supersedes the earlier six-case receipt only for the changed helper contract. It adds no browser/gameplay or product-interface acceptance.

Ownership follow-up: receipt `work/orchestration/m1-building-screen-proposal-03/contracts.json` passed15 contracts on2026-10-08T17:57:46.631Z (exit0, CPU4, bounded30s). Added rejected-preflight/existing-owner, changed-owner and primitive-throw negatives. All11 explicit input fingerprints remained stable. Earlier0c47/a32 reviews were HOLD; their passing synthetic test receipts remain historical and are not upgraded into accepted source.
