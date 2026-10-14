# Followers nearby mode: bounded port implementation contract

Issue #60. Revision 2 for review, 2026-10-10. Supersedes the wording-only
first draft `implementation-contract.md` (SHA256
`b920d42724ac7172dfaad1710907ede1da7eeb38716a9c3972bf1753e9592deb`).
Assessed code:
`92907866646e418747dd2bda44236d9949835bc5` (tracked tree clean).
This document freezes an implementation proposal; no runtime implementation or
executed acceptance is claimed. The accepted static findings, repeated-release
addendum and ordinary-consumer addendum supply the original evidence.

## Outcome and compatibility boundary

Restore the HFX875 control as a global/nearby follower toggle, including its four
normal/pressed icons and persistent Total/class count/font feedback. The existing
24 task cells, 12 transport cells and selection/focus engines already consume
tribe bit0x80. Do not duplicate them. Enter continues to expose Planet overview.

The native input is release-driven, first accepted command wins before consumption,
and ordinary command processing can continue during simulation pause. The port
will preserve those observable properties with one **mode-specific, transient
desired-value slot** owned by the current Scene and World. It will dispatch at an
explicit **12 Hz elapsed-time opportunity before `advanceGame`**. Twelve is the
port's existing `TURNS_PER_SECOND` value (`app/world-rules.ts:6`), chosen here as a
compatibility policy. Native `004a5590` uses `1000 / DAT_0089d161`; its ordinary
default producer and exact end-to-end wall time remain unbound. Neither 24 Hz
animation nor render-frame count is an original command cadence.

This is not a shared human command queue. Other port actions remain immediate;
contention against those actions, native rings/pipeline latency, exceptional native
bit0x100 buffering, all original interface schedules and original save-file
semantics are outside this contract.

## Request, commit and lifetime

1. The Page control owns only armed/pressed UI state. Primary down inside an enabled
   control arms it. A matching primary release inside invokes the Scene request
   exactly once. Held input never repeats. Leaving, pointer cancellation, blur,
   Escape, opening a modal, losing the current World or unmount cancels the armed
   press; returning inside without a new down does not rearm it. Secondary release
   does nothing. Shift/Ctrl do not change the desired mode; accommodate macOS
   Ctrl-primary without a second contextmenu/click request. Browser keyboard button
   activation remains an explicit accessibility route: one completed activation,
   no held-key repeats, and no claimed native physical-key0x97 binding.
2. Both arming and the Scene request require an active current Scene/World, ready
   gameplay HUD, no open modal/mission selector and no load transition. The Scene
   request also uses the existing follower no-focus input gates: `world.inputMask`,
   `overviewStage`, `overviewActive` and `manaWorld.gameFlags & 32` reject it.
   These are named port compatibility gates, not inferred branches in004a1680.
   Pause alone is allowed. This control adds no class-count, unlock, task-category,
   drag-order, Shift or Ctrl eligibility condition.
3. Read the committed `world.castingTribes[0].flags & 0x80`. Request directional
   cue0x6e for global→nearby or0x6f for nearby→global through `scene.onSound(cue,1,0)`
   **before** testing whether the mode slot is occupied. Then admit the opposite
   Boolean desired value only if empty, capturing the exact World and Scene owner.
   A rejected second request keeps the first value. It still requests the cue.
   Blocked/stale requests before this callback boundary request no cue. Audio's
   mute/pause/availability gates remain authoritative; a cue request need not be
   audible. Do not enqueue these UI cues as positional world sound events.
4. Keep committed mode authoritative for icon, aria-pressed, persistent counts,
   task/transport counts and selection/focus. The pending desired value never
   anticipates those displays. At an eligible dispatch opportunity, revalidate the
   same Scene/World and HUD/input gates, consume at most the one retained request,
   and assign `(flags & ~0x80) | (desired ? 0x80 : 0)`. This preserves every other
   flag. Clear the slot before publishing `onChange`, so a later normal activation
   observes the new committed state. A blocked pending request is canceled, never
   parked for an unrelated later UI state. Cancel the armed press when blocked,
   modal, hidden or stale ownership causes cancellation. A successful commit does
   not cancel a separate valid press already held across that opportunity: its
   later release reads the newly committed mode and may request the reverse.
5. `GameScene.isCurrent()` uses the existing store presentation binding. Store
   `replaceWorld` invalidates that token before publishing its new World, so an old
   Scene cannot request or commit even before React cleanup. Disposal clears slot,
   press ownership and clock phase. Restart/Load/new mission start with a fresh
   Scene phase and no pending request; the old World object must remain unchanged.
6. Pending request and dispatch phase live outside World and checkpoints. Save
   does **not** flush or serialize pending input: `saveCheckpoint` clones only the
   committed flag. Save alone does not invalidate a current Scene slot; if its HUD
   remains eligible, it may commit after the snapshot, while the saved mode stays
   unchanged. In the ordinary menu Save route, modal opening cancels pending input
   under rule4. Page modal-opening handlers cancel armed/pending mode input
   synchronously, before a same-handler Save snapshot; do not rely on a later
   React effect or animation frame for this ordering. Load always discards old
   transient ownership and restores only the
   saved committed mode. Committed nearby survives the existing typed checkpoint;
   Restart/new mission use existing fresh tribe flags0. No save-schema change or
   original save-codec claim is required.

## Elapsed dispatch schedule

Use one small Scene-owned mode clock, independent of `world.pendingTime`,
`world.speed`, `world.paused`, animation/worship clocks and tooltip visits. Anchor
its monotonic phase at the first active animation timestamp. Request arrival uses
`performance.now()`; `requestAnimationFrame` supplies `now` from that same browser
performance time origin. Do not use `Date.now()` or unnormalized DOM event
timestamps. Before the first animation frame, retain the request arrival timestamp
and pending value; that first frame establishes the anchor without consuming the
request, and its first subsequent opportunity can consume it. Opportunities are at
`anchor + n * (1000/12)` milliseconds. Nonfinite or backward timestamps must not
produce a visit. Equal timestamps do not advance. Reset the anchor/phase when the
Scene is replaced/disposed; never inherit elapsed debt from another World.

The actual `GameScene.animate` owner (currently lines761–770) first validates its
binding, computes elapsed time, and calls the small mode dispatcher before
`advanceGame`. When a frame crosses several opportunities, advance the phase over
all of them and consume an admitted request once at the first eligible opportunity;
remaining opportunities are empty. Do not replay a cue or toggle per crossed visit.
A request records its arrival time against the same monotonic clock and cannot be
consumed by an opportunity that predates it. At exact equality it is eligible.
This matters when input arrives before a delayed catch-up frame.

Use timestamps/phase arithmetic rather than a per-frame counter or a debounce.
The same request/opportunity ordering must agree at30/60/144 Hz and after an
irregular long frame. A request just after an opportunity waits for the next one;
two complete releases before it produce one transition and two directional cue
requests; a release after it can reverse the committed mode. Paused, speed0 and
ordinary speed changes do not change these elapsed opportunities or advance the
simulation as a side effect.

Hidden/inactive HUD or modal entry cancels pending/armed input; resumption starts
with no deferred user action. Elapsed phase may advance past missed opportunities
without replaying work. `afterCurrentGameTurn`, tooltip24 Hz and worship callbacks
are not owners for this feature. Full native inactive-window timing is unclaimed.

## Exact live paths and minimal implementation files

| File/owner | Bounded change |
| --- | --- |
| `app/page.tsx:967–973` | Replace HFX875 overview action with the release-driven mode control; expose a clear accessible name and committed aria-pressed; forward to the actual Scene request. Own pressed/cancel state and the page-ready/modal/selector guard. Existing overview Enter handler at408 remains. |
| `app/scene.ts:519`, `679`, `761–770`, `863` | Current-binding request bridge; one Scene/World-bound mode slot and elapsed phase; dispatch before advanceGame; explicit cancellation/disposal. A small dedicated `app/follower-nearby.ts` may hold these mode-only transitions for focused tests, with the Scene owning the actual instance and clock. |
| `app/page.tsx:1010–1055`, `app/hud-tasks.ts:55`, `app/hud-population.ts:17/30` | Derive persistent display totals from the same `hudTaskPeople(world)` source and raw `hudCamera` used by task counts. Extend the existing count pass with separate global and displayed totals before task-category accumulation; nearby strict toroidal squared radius is `<0x2400000`. Sum models2..6 for Total, excluding Shaman; never sum overlapping task rows. Keep global totals for enablement, class order and visible-disabled empty controls. Pass `alternate={nearby}` to persistent `FollowerNumber`. Keep the population/capacity meter global. |
| `app/follower-tasks-view.tsx:56/87/111`; `app/scene-input-runtime.ts:572–659`; `app/selection-runtime.ts:145–159`; task/transport runtimes | Existing consumers. Reuse their committed flag, modifiers/focus and camera contract. Counts use raw camera center; selection/focus snap to containing512-native-unit cell center. No change to their proved Shaman/reserved/vehicle asymmetries. |
| `app/globals.css:29`, `app/hud.tsx::HudSprite` | Keep the original control footprint(6,122,24,18); choose875/876 global normal/armed,877/878 nearby normal/armed. Hover alone does not choose a pressed icon. Reuse atlas consumer; verify centered icon/press placement. Full original HUD frame/painter equivalence remains separate. |
| `app/audio.ts::AUDIO_CUES` | Add0x6e/0x6f to existing cue preloading if absent. `scene.onSound` already reaches `audio.current.cue` at `page.tsx:334`; sound records already bind sound-bank samples148/149 in `app/original-sound.json`. Reuse current audio pause/mute ownership. |
| `scripts/import-follower-nearby.py` (new narrow appender); `app/original-hud.json`; `public/original/hud.png`; `engineering/generated-files.json` | Add only canonical HFX876–878, preserve all existing rectangles/pixels and metadata except appended atlas height, and register the bounded producer. Reuse validated PSFB decode in `scripts/import-original.py` rather than run the broad `scripts/import-hud.py` rewrite. No unrelated atlas rebuild. |
| `app/game-store.ts:382–407,442–466` | Existing owner/checkpoint contract to exercise; no planned save schema or shared queue edit. Actual replaceWorld token invalidation must be in the composed test, not simulated by manual disposal only. |

Required art input identities are already in `original-hud.json`:
`data/hfx0-0.dat` SHA256
`681eb1734fd73f86a6a52a8540415ec69a241a378161b60e9c9da1263d4ee0bf`
and `data/pal0-c.dat` SHA256
`6c61cd586fc96ef5f777c71966a9ac1875491a4a521342ba06d108df5e92bf53`.
HFX875 is19×16 in the current atlas;876–878 are absent. Verify supplied source
members and record exact decoded RGBA/dimensions before adding them. No new art,
font, localized tooltip or sound-bank extraction has occurred in this assessment.
Use a descriptive port label; original tooltip758 wording remains unbound.

## Failure-first acceptance

These are required red cases and later acceptance, not tests executed here.

- Actual Page release→Scene request→elapsed consume: currently invokes overview,
  so fail ordinary reachability before implementation. Spy on actual handler return
  and cue order; do not substitute a helper call or write bit0x80 in browser setup.
- Both starting modes: down/hold does not commit; release outside/cancel/blur/Escape,
  right click, modal/blocked/stale input give no request. Ctrl-primary invokes once;
  Shift has no special action; keyboard activation is once per completed press.
- Two releases before dispatch: same cue twice, first desired value retained, one
  eventual transition. Release/dispatch/release gives opposite transitions. A
  separate second press held across successful commitment remains armed and its
  later release requests the reverse, using the new committed bit. Pending
  mode does not change rendered icon/counts/selection early. Preserve representative
  nonmode bits across both set and clear.
- Pause/speed0/speed changes;30/60/144 Hz; equal/backward/invalid timestamps;
  catch-up across many periods with a request between old and current timestamps;
  pre-first-frame request, boundary equality and just-after-boundary: same ordering, no extra transitions,
  no cue replay, no simulation-turn advance while paused. Use actual composed
  animate ordering in addition to small transition tests.
- Request then actual store Load/Restart/startMission before React disposal:
  advance old Scene callback and prove neither old nor replacement World changes.
  Rebind another Scene to the same World and reject old token ownership. Disposal
  cancels. Modal/hidden/cancellation before consume leaves no later surprise action.
- Save while pending: serialized committed mode is old, pending/phase absent.
  Eligible same-scene commitment afterward does not mutate that saved checkpoint;
  Load restores its old mode with no pending input. Save after commit restores new
  mode. Ordinary menu Save cancels pending on modal entry. New mission/restart reset.
- Persistent count red case: current Page always supplies global counts/default
  font. Pan an authored Mission1 view beyond home Braves, activate nearby through
  the actual control, and show persistent and lower task counts shrink together.
  Nearby0 still leaves globally present class enabled. Total excludes Shaman;
  class0 blanks but Total renders00; font4/6 switches to5/7 at the existing100
  threshold; housing meter remains global. Existing exact-radius/ghost/reserved
  fixtures support boundaries; no synthetic entities replace the ordinary episode.
- Art red case: currently876–878 missing. Verify all four Page states select the
  exact decoded RGBA rectangle, held/canceled state resets, no hover-as-press, old
  atlas pixels/rectangles preserved, and normal/DPR2 compact HUD placement. Capture
  actual before/after from the retained source head and final implementation head.
- Ordinary Mission1: use public minimap/camera, existing Idle-Brave single/Shift and
  right-focus; nearby away excludes distant eligible Braves, global at same view
  reaches them. Typed checkpoint and real building/housing activity complete the
  visible count/selection episode. Existing Mission2/3 consumers get targeted
  regression coverage; this slice does not claim full Mission1–3 or issue60 closure.

Implementation must run standard check/build plus affected portable, imported-art
and local rendered-browser checks on its frozen head under the repository protocol.
Native execution remains a separately held boundary; this accepted static evidence
must not be relabeled as a new executed original-game comparison. This source-only
publication needs structural/hash/link/diff checks, not app tests or a build.
