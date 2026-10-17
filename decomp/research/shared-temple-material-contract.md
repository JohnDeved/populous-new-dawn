# Shared ordinary Temple material contract

## Historical status (updated 2026-10-17)

This is the accepted October 10 design contract, not an outstanding implementation
plan. Its “current” descriptions below refer to the frozen runtime named there.
The bank-aware environment was delivered in
[51bd8f93](https://github.com/JohnDeved/populous-new-dawn/commit/51bd8f93dce15809b70cdcd3835ccc4bc2244ebe),
and shared ordinary Temple materials in
[71dadcb2](https://github.com/JohnDeved/populous-new-dawn/commit/71dadcb29ebc2e34c8f48fba0851a9b28c93c6d5).
Current `app/temple-art.ts` admits completed models 95–98 independently of mission
and tribe, while keeping acquisition sprite-palette eligibility separate.
The invariants and original acceptance requirements remain useful historical
rationale; their presence here is not a claim that any later rendered gate passed.
This documentation integration changes no runtime behavior and performs no new
rendering validation. The original review remains recorded in
[PR #313's acceptance](https://github.com/JohnDeved/populous-new-dawn/pull/313#issuecomment-6097007130).

Proposed implementation contract for issues [#23](https://github.com/JohnDeved/populous-new-dawn/issues/23)
and [#14](https://github.com/JohnDeved/populous-new-dawn/issues/14), frozen against
runtime `219384134d21200f80df0496a4866fb02fb200db`. This is source review and a
future acceptance contract, not an implemented or tested rendering change.

## Existing evidence and the missing connection

[PR #312's accepted inventory](https://github.com/JohnDeved/populous-new-dawn/blob/d13825915c557cb24b0fc5341b5280c69ac88c94/decomp/research/early-mission-theme-20261010/proposal.md)
proves complete c/s/p atlas decoding and equality of Temple models95–98 between
object banks2/6. Its full atlases cover every tribe's tile set; the old
`temple-model-p` is only a Blue95-scoped patch. No new geometry or pixel evidence
is needed to choose those proven records. Other landscape identities retain the
theme contract's explicit c compatibility fallback, not claimed original colors.

[Temple top research](temple-top-vfx.md) already establishes all four meshes'
sixteen mode32 quads, faces127–142, source tile92 and construction flags0. They
belong to completed meshes, independently of training, worship or occupancy.
The shared renderer's `modelFaceVisible`/`modelStage` selects their visibility.
This does not identify the separately reported, still-unbound apex sprite.

The existing original-source chain is `0042af10:load_bl320` (read500-byte ANIBL,
then `0044fc40:set_anibl0`) and `0044fbd0:update_bl320_sprites` (advance the shared
record and bank2 texture handle). `004a4450:197–200` updates before world drawing.
`004bd170`/`004bd230` call the BL loader; `0042b230:56–71` conditionally reloads
the landscape resources. These retained pseudocode exports and the accepted
[acquisition lifecycle findings](temple-acquisition-integration.md) support the
resource-owned phase. They are not a newly executed native lifecycle proof.

Current browser ownership is `GameStore`'s `createSharedAniblResource`, published
with World replacement. Scene's `worshipVisit` advances it before controller
visits; `animate` reads the post-advance snapshot before world and overlay drawing.
The ordinary consumer is `updateBuildingsFrame -> templeWorldMaterial ->
nativeModel`; it currently restricts mission3/Blue/object95/stage4. The overlay
has its own `BuildingAcquisitionTriangleSurface` and calls `templeTileOffset`.

## Resource interface agreed with the theme implementation owner

The proposed `app/world-environment.ts` exports `worldEnvironment(world)` and
Scene retains the immutable result as `scene.environment`. Its relevant fields:

- `landscape.requested`: authored numeric identity;
- `landscape.bank`: effective `c | s | p`;
- `landscape.supported`: whether the requested identity is supported;
- `landscape.modelAtlas`: `atlas | atlas-s | atlas-p`;
- `objects.requested`, `objects.bank` (`2 | 6`) and `objects.supported` are
  independent geometry selection, not ANIBL phase identity.

Use that same pure selection in the store before publishing a new World. Do not
add another mission allowlist, mutable global palette or serialized theme field.
The ANIBL resource identity is the effective landscape bank/model atlas plus the
fixed existing animation sequence, not the mission, object bank or a building ID.
Keep the requested/supported distinction in the environment descriptor: animating
the selected c fallback makes no claim of authored-theme fidelity.

The shared snapshot must identify its actual bank/atlas instead of hardcoding p.
Initialize it for the initial World as well as later replacements. For the
supported c/s/p resources, and the explicit c fallback, resource availability
does not depend on whether a Temple or acquisition currently exists.

## Phase, lifecycle and readiness invariants

- Preserve the exact existing nominal worship-visit callback, catch-up, limiter,
  pause and hidden gating. Keep advance-before-controller/draw order and the
  sequence92,93,94,95,100,101,102,103,108. No RAF, simulation-turn, per-building,
  acquisition-age or new scheduler owns this phase. This remains the documented
  browser compatibility policy, not exact original cadence or first-frame parity.
- Fresh World/start and successful checkpoint Load select the environment and
  reset counter0/tile92 with a new epoch before notifying subscribers, even if
  the effective bank matches the old one. Save/storage retrieval do not reset it;
  the resource counter stays outside checkpoint state.
- Normal Restart may retain counter/epoch only for equal effective resource
  identity and the existing normal condition `!(world.land.landFlags & 8)`.
  Otherwise reset. World replacement still revokes the old Scene binding, even
  when phase/epoch survive. No caller may force retention across different banks.
- Scene replacement/disposal and repeated draw reads do not advance or reset the
  phase. Preserve current-World/live-Scene tokens and immutable prior snapshots.
- Required full atlas readiness comes from the theme preload. A supported atlas
  failure is a failure, not fallback permission. Failed preparation preserves the
  previous World/resource; failure after commit does not roll it back. Explicit
  retry repeats the existing store action. Renderer/material/sprite state remains
  Scene-owned; shared asset caches stay keyed by immutable resource identity.
  Texture identity and generated shader mode must not leak across scenes.

## Ordinary material and acquisition separation

Admit an ordinary completed Temple by `kind === temple`, object95–98 and stage4.
Remove mission and Blue-only qualification. Use its scene-selected full model
atlas and the one current matching resource snapshot. A missing/mismatched
snapshot for an admitted consumer is an integration error, not static tile92.
Other stages retain shared face visibility and the theme-correct construction
material/cap; completing a building joins the current global phase.

Separate `nativeModel`'s current coupled `temple` boolean responsibilities:
atlas/model selection belongs to the scene environment; an explicit animated
Temple material variant supplies the mode32 UV offset. Preserve encoded-color
filtering, alpha cutoff, fullbrightness, winding, scale, lighting and picker
geometry. No particle producer or socket decoration is added.

Resource presence must not imply acquisition sprite-palette admission. Preserve
the existing M3 companion/pulse p-art eligibility explicitly in the overlay,
qualified by its existing mission context and a matching p resource. M1 and all
other contexts continue their existing `effects` atlas/command RGB routing;
ghost trails retain their existing pixels and85/255 opacity. This is an existing
bounded overlay policy, not an ordinary Temple material exception. Merely
checking `snapshot.bank === p` would also recolor other p-mission acquisitions
and would silently broaden the present scope.

Keep `buildingAcquisitionSource`'s authored M1 Camp and M3 Temple provenance,
local-recipient checks, sixth-visit handoff, independent82nd-visit award, HUD
destination and controller ordering unchanged. The M3 model95 overlay may keep
its proven scoped p atlas and shares the same tile snapshot as world Temples;
M1 model103 remains on its existing c overlay atlas. Full-atlas migration or
additional overlay admission is unnecessary for this contract.

## Original implementation acceptance requirements

Extend the existing store/material/Scene tests through actual callers: initial
M1 resource; c/s/p and fallback identity; all four ordinary Temple models;
stages0–4 and completion joining an advanced phase; simultaneous world/overlay
snapshot equality; unchanged M1 sprite RGB and M3 shared companion/ghost routing;
same/different-resource retention; Load/fresh-start reset; stale callbacks;
failed readiness/retry; and warm-cache p→c→s scene replacement. Preserve clock
assertions in `shared-anibl-store.test.mjs`, rather than changing expectations
to accommodate a new cadence. Mixed identity cases are controlled fixtures,
not ordinary gameplay evidence.

Obtain ordinary rendered evidence for M3 Blue plus naturally reached non-Blue
and non-M3 Temples, including shared phase, construction/completion and
save/load/restart. Coordinate terrain/theme screenshots with that owner; do not
re-run the accepted archive/model inventory. Standard check/build and affected
material, Scene, acquisition and lifecycle gates remain implementation gates.
No new original/native/game execution, extraction, regression test or runtime
edit was performed for this contract. The source inputs/phase producer are
identified. Implementation and its acceptance were the remaining work at this
October 10 checkpoint; see the historical-status section for subsequent delivery.
