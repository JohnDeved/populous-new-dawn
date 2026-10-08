# PR267 remaining ordinary controls

Supporting source starts at frozen candidate
`72c73c007b3dcda60392dcd66ec833358502d3b8`. It is a separate scenario for the
acceptance already listed by `scenario.mjs`; it does not change that moving-target
episode, its reducer, or the maintained local-render harness.

Status: source and focused synthetic evidence tests only. Browser, native,
aggregate and build checks have not run for this addition. Passing helper tests
does not establish ordinary gameplay. The parent owns admission to the stationary
browser lane and the final combined-source review.

## Existing runner and exact controls

Use `scripts/local-render/harness.mjs` with `--scenario
qa/blast-ordinary/controls.mjs`, `--mission 2`, a new owned `--profile`, fresh
`--output`, and `--timeout 300000`. Browser path, isolated port and outer execution
receipt must be assigned by the lane owner. No dependencies are installed or
copied by this scenario. Its profile cannot contain an earlier checkpoint.

The shipped labels were checked in `app/page.tsx`, `app/world-selector.tsx`,
`app/world-rules.ts`, and the existing runners:

- `All missions` / `Mission 2` entry through the existing `openMission` helper
- `followers`, `Select and focus shaman`, `Select brave`
- `Blast, N shots`; keyboard `1` toggles targeting; right-click toggles charging
- `Pause game`, `Resume game`, or Space when focus is outside buttons/dialogs
- `Game settings`, `Save checkpoint`, fresh-page `Load Game`

The menu owns a pause. Closing it resumes; public Load also resumes. A successful
cast clears mode and immediately spends one shot. Permanent Blast remains
selectable at zero stock. A plain repeated click with mode cleared and no selected
followers is not a second spell request and must not issue a movement order.

## Witness sequence and assertions

1. Enter ordinary Mission 2, wait for Shaman readiness, and reuse the existing
   fixed five-point ground envelope near `(-99,-101)` to stage one original
   HUD-selected Brave. Verify the actual command3 payload and retained registered
   owner, then wait for stable idle across two different turns. Disable Blast
   charging through the HUD and clear selection.
2. Exercise `1`/Escape, `1`/canvas right-click, and `1`/`1`. Delivered-event
   boundaries must show no payment, allocation, cast-count or RNG changes.
3. A finite 56-point diagnostic search in the settled view supplies one empty
   in-range pixel clear of nearby actors/scenery and one out-of-range pixel.
   The latter must reject through the real handler, retain stock, and show the
   exact range message. No pixel is synthesized if the search fails.
4. Double-click the in-range ground. Require one terrain-owned allocation with
   cell-centered aim and no person identity; the repeated click must not cast or
   order followers. Passive real-turn observations require arrival, retirement,
   and one new Blast flash/wave pair. No render is forced.
5. Find the original staged person using existing person bounds and owned 5x5
   picker admission. Real mouse release is followed immediately by real Space,
   without a host read or menu navigation between them. Require event ordering,
   original person ownership, one-shot payment, and a genuine paused `windup` or
   `flying` projectile. A late pause fails; there is no retry or retrospective
   active-cast claim.
6. Hold the public pause for 1.2 seconds. Open settings, save, and await the
   existing committed-turn readback. A QA-only readonly IDB projection must match
   the paused projectile, tracked target, caster, stock/payment, timing and RNG.
   Reload the page and install the existing synchronous store-replacement
   observation before public `Load Game`. Compare the same complete projection
   before automatic resume or asynchronous scene binding can advance it. Confirm
   ordinary resumed retirement without another payment. Recheck that Load did
   not rewrite the stored checkpoint.
7. Re-discover the ground pixel for the newly created camera. Spend the remaining
   two shots through individually rearmed ordinary casts. The next in-range cast
   must retain zero stock, allocate nothing, and show the exact charging message.
   Finish with public pause-button hold for one second and normal resume.

Setup is bounded by turn 1800 / 140 seconds; camera settlement by 15 seconds; each
cast by 48 active turns / 10 seconds; committed Save readback by 300 attempts
spaced 100 ms apart; whole scenario by 240 seconds and the harness by 300 seconds. All first
failed assertions, actual input traces and partial outcomes are retained in
`controls.json`. Queued current-run stop commands retain their bytes and stop
further input. Screenshots show rejection/status and saved-settings UI, not
isolated-effect pixel evidence.

## Evidence limits

Existing `tests/blast-targeting.test.mjs` provides controlled unit evidence for
tracking, target deletion, point-only ground casts, payment rejection and save
migration. This scenario seeks new ordinary input, pause, charging/stock and
active checkpoint integration evidence. It does not replace the moving-target
pair, paired-image review, native parity or hardware performance acceptance.

The release-to-Space timing is a real feasibility gate. Casting while paused is
rejected by the game. Therefore the pause must arrive after allocation and before
impact; only then do menu/Save operations become independent of the short cast
window. The source does not promise this timing succeeds in a software renderer.

Focused tests, without shared packages:

`taskset -c 4 node --test tests/blast-ordinary-controls.test.mjs`

`taskset -c 4 node --check qa/blast-ordinary/controls.mjs`
