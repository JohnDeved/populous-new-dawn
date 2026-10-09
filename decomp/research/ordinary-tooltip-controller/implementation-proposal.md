# Ordinary object tooltip: finite implementation proposal

2026-10-09, issue 19. **Implementation held; proposal only.** The accepted static
[source assessment](../ordinary-tooltip-controller.md) establishes original
behavior, not acceptance of this browser mapping. Shared HUD/cell cache history
and inspection timing can change visible output. Preserve this handoff while the
resident-owner audit takes priority; no continuing tooltip implementation lane.

Source binding: application base `d6cf109474379172728a3ccebf46ef72a15f3a58`, retained
research commit `f51479c55a2292a714032e38b6cbc474351599a4`. Application source hashes
are in [provenance.json](provenance.json). References below are to those bytes.
No app changes, new disassembly, runtime execution or tests accompany this proposal.

## Concrete available caller

- `app/scene.ts:489–497`: `start` rejects stale binding/disposed/aborted state,
  avoids a duplicate start, and schedules the first RAF.
- `app/scene.ts:718–758`: `animate` exits early at 719 for disposed/stale binding.
  Every other normally completed invocation calls `renderTooltip` at 737 exactly
  once, before `updatePointerFrame` at 742, then schedules the next RAF at 758.
  Camera/flyby processing occurs before the tooltip opportunity. Pause does not
  itself return from this function. Exceptions are not completed opportunities.
- `app/scene.ts:810–813`: disposal releases the presentation binding and cancels
  the pending RAF. `app/page.tsx:293–365` creates/disposes GameScene on world and
  startup lifecycle changes; scene-local fields alone cannot retain a cache
  across level restart.
- `app/scene-input-runtime.ts:648–683`: ordinary text currently uses a temporary
  `createTooltip`/`showObjectTooltip` state, forcing draw immediately. Public
  `GameScene.renderTooltip` also has diagnostic callers outside animate, so a
  display call by itself must not advance the frontend sample or hover counter.
- `app/scene-input-runtime.ts:716–766`: current picking publishes a retained
  `hoveredObject`, with pointer/button/input-mask/mode gates. Tooltip processing
  currently sees the previous published pick, as native input precedes its next
  painter pass. `pointerleave` at 443–448 clears pointer/pick information.

These callers permit a small local state addition without a new fixed-rate loop
or framework. They do not prove equivalence of the whole original frontend.

## Candidate object-text mapping

Subject to explicit review of the exclusions below:

1. Once per animate invocation after the disposal/binding guard, use its monotonic
   timestamp to sample the preceding frontend count. When at least 1,000 ms has
   elapsed, store the nonnegative count delta and move the sample boundary; do not
   normalize a delayed sample or synthesize catch-up visits. Then increment the
   current frontend count. This preserves the original measure-before-increment
   ordering of `0049c9f0` / `004a4710`.
2. At the existing tooltip opportunity, lazily initialize T to max(sample,12)
   when the first eligible repeated owner needs it. Cache T rather than recalculating
   it on each hover. A small session owner above per-world GameScene could preserve
   it through restart; this is proposed wiring, not an existing equivalent owner.
3. Keep ordinary object state separate from the forced target/lifetime fields.
   New named ID/category: clear text/fixed state, store ID/name, reset count=0,
   and emit no draw. Same named ID: increment while count<T; otherwise request
   text. At equality, increment once and emit one first-display event. Acquisition
   through first draw is T+2 eligible visits when no other producer intervenes.
4. Preserve the distinct empty-name transition: record the new raw object ID,
   clear text, but do not reset count solely because the name is empty. An authored
   tree can provide that known no-name transit; reentering the Hut reacquires its
   name and resets count. Null descriptor alone is not proof of a known unnamed
   object because the current adapter omits some classes.
5. Keep direct renderTooltip calls paint-only. A per-frontend output may be
   repainted without adding a dwell visit. Existing name/layout helpers can be
   reused; ordinary ownership should not be represented as duration-1 forced
   state merely to obtain text.

This is a candidate faithful count algorithm at mapped browser opportunities,
not a proposed fixed number of seconds or a 12/24/40 Hz scheduler. If T was cached
at 60 then the frontend changes to 144 visits/sec, elapsed dwell changes. Preserving
that native cached-count quirk is a possible explicit choice, not a hard evidence
blocker or authority to silently substitute elapsed-time semantics.

## Observable limits requiring a decision

**Shared cache history.** Native HUD, cell and other owners can initialize T before
an ordinary object. The browser HUD mostly uses DOM titles/description state
(`app/follower-tasks-view.tsx:95`, `app/page.tsx:1215–1220`), not the shared native
controller. Native menus, frontend pacing flags, rate restoration and process-wide
sample history are not represented by the GameScene opportunity. A session-held
object-only cache cannot claim the original earlier owner history.

**Forced exclusion.** `app/scene-camera-runtime.ts:430–449` advances forced lifetime
inside its existing provisional 24 Hz flyby loop and discards `stepTooltip`'s
boolean. `app/scene.ts:732` skips that updater when camera motion owns the frame.
Native `0044db60` returns ownership even on expiry. A proposed per-RAF owner latch
must retain active/handled forced ownership, including expiry or acquisition and
expiry within that RAF; `draw` or nonempty text is insufficient. Carrying this
result need not retime the forced timeline, but the mixed cadence remains an
explicit adapter and is not complete native forced/ordinary composition.

**Leave and replacement.** Named-to-named replacement and known tree transit have
an exact recovered local transition. Ground, canvas exit, HUD transit, modes and
invalid objects collapse to missing pointer/descriptor information in current
callers. Native cleanup uses five owner words and may retain state when no helper
runs. Hiding text immediately is available; universal counter reset or retention
on all missing-target visits is unsupported. Do not describe those branches as
exact without their owner mapping.

**First-display inspection.** Native `00508fe0` sets the input flag and invokes
`0047ae00(1,0)` with class/terrain eligibility and inspection-record effects.
`app/object-panels.ts:40–50` supports people/heads/vehicles and rejects buildings;
its update at 145 onward repicks and owns a different retention timeline.
`app/building-panels.ts:90–125` already exposes a Blue Hut panel from raw hover or
activity, before a delayed tooltip. Calling `ObjectPanels.open` is therefore not
the native callback. The proposed text-only slice must explicitly exclude panel
activation/lifetime and cannot certify the full hover controller.

**Other classes and positioning.** `app/tooltips.ts:112–175` maps vehicles,
buildings and linked shrines, not every native named person/scenery class.
Ordinary text is currently object-anchored via the forced adapter; native cleared
ordinary flags choose pointer-relative placement. Neither broad class coverage
nor anchor/raster equivalence follows from a dwell repair.

## Finite future acceptance scope

If separately accepted, the smallest useful runtime slice is supported named-object
text acquisition, repeated same-ID hover, named replacement, known unnamed-tree
transit/reacquisition, and explicit forced exclusion. Use ordinary Mission 1's
authored Blue Hut DAT 42 after real readiness, input masks and forced ownership
clear. Resolve actual runtime identity; record actual animate/pick/tooltip outputs,
not injected target state or direct paint calls counted as frontend visits.

Check initial no-draw, native count boundary, same-ID pointer movement, one-shot
first-display signal, and replacement. Record HUD/ground leave and panel behavior
as scoped observations, not passing claims for excluded semantics. Preserve
selection/order/RNG around real inputs. No runtime implementation is authorized
or accepted by this document; resume only after the cache/ownership exclusions
and intended visible behavior have been explicitly reviewed.
