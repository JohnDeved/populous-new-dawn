# Followers tab / follower HUD controls

Issue #60 first-slice research on base `506289f9a9621f67cd4255fe23430343b55eb70d`.
The verified D3D executable used by retained/native inspection has SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
Ghidra pseudocode and static table labels are evidence, not recovered source.

## Shipped browser path

`app/page.tsx` owns three category tabs (`buildings`, `spells`, `followers`) and
uses HFX 676/677, 678/679, and 680/681 respectively. Selection/focus is routed
through `followerControl` -> `GameScene.chooseFollowers` ->
`scene-input-runtime.ts::chooseFollowers` -> `selection-runtime.ts::selectFollowers`
and `hud-selection.ts`. The recovered interaction semantics are already live:
ordinary click adds one, Ctrl adds five (except Shaman), Shift adds the full class
or all non-Shamans, and right-click cycles/focuses a matching person and opens the
person panel.

The page currently exposes two follower-selection surfaces:

1. The persistent `section.tribe-classes` at logical y=153 contains Total plus
   Braves, Warriors, Preachers, Firewarriors and Spies. It renders the original
   follower frames, live numeric counts and total population/capacity meter using
   `FollowerIcon`, `FollowerNumber` and `PopulationMeter`.
2. When `tab === "followers"`, `div.follower-list` renders a second generic 3-column
   command grid containing Shaman (664), Braves (666), Warriors (668), Firewarriors
   (672), Spies (674), and Everyone (680). It has no counts and omits Preachers.
   Selected spies additionally receive enemy disguise action buttons; that gameplay
   action is a separate modern control and is not evidence for the duplicated roster.

`app/world-state.ts::population` counts one Shaman plus every live, non-ghost
non-Shaman follower and does not exclude housed people. The persistent class counts
also filter by live/non-ghost class without excluding `inside`. That matches retained
`004ecac0` evidence: active non-ghost tribe followers remain counted while housed or
selected. Counted does not mean selectable: `hud-selection.ts` preserves the native
reservation filters (`flags4` 0x880 for ordinary acquisition; all-selection may include
0x800-reserved people but still rejects 0x80) and assignment-priority search.

## Retained native follower controls

Existing `scripts/check-native-hud-population.py` and the generated HUD consumers
prove the original six counted controls:

| control | native model | HFX | logical geometry | renderer | left/right input |
| --- | ---: | ---: | --- | --- | --- |
| Total | 0 | population meter / no class icon | x=0, y=153, 15x36 | `004a0800` | `004a1090` / `004a1120` |
| Brave | 2 | 666/667 | x=16, y=153, 15x36 | `004a0510` | `004a0f00` / `004a1010` |
| Warrior | 3 | 668/669 | x=32, y=153, 15x36 | `004a0510` | `004a0f00` / `004a1010` |
| Preacher | 6 | 670/671 | x=48, y=153, 15x36 | `004a0510` | `004a0f00` / `004a1010` |
| Firewarrior | 4 | 672/673 | x=64, y=153, 15x36 | `004a0510` | `004a0f00` / `004a1010` |
| Spy | 5 | 674/675 | x=80, y=153, 15x36 | `004a0510` | `004a0f00` / `004a1010` |

The total display descriptor begins at `005cb213`; its draw callback pointer at
`005cb223` is `004a0800`, with total left/right pointers `005cb207 -> 004a1090`
and `005cb20b -> 004a1120`. Class display descriptors are at `005cb255`,
`005cb297`, `005cb2d9`, `005cb31b`, and `005cb35d`. The corresponding class
left/right callbacks are `004a0f00` / `004a1010`.

The original Shaman HFX 664 is not a seventh class-strip button. Its separate native
descriptor has logical geometry x=33, y=114, 30x35 (HFX literal at `005caf07`) and
uses the model-specific selection/focus callbacks; this matches the shipped separate
Shaman portrait control.

`references/reverse-engineering.md` section "Original HUD follower selection and
focus (2026-09-11)" records the interaction result: single/Shift/Ctrl selection,
nearby/global fallback, assignment priority, reserved-person rules, and right-click
focus cycling. `scripts/check-native-hud-selection.py` executes 1,024 complete native
HUD commands / 12,288 people, 1,024 focus cycles, 144 left callback/producer cases
and 12 right callbacks. These mechanics should be reused, not reimplemented for #60.

## Native category tabs and negative evidence for the duplicated roster

Bounded canonical queue job `3652695f-17c8-4588-8f0f-25cf8054b371` inspected the
verified executable HUD descriptor data on exact repository head
`506289f9a9621f67cd4255fe23430343b55eb70d` and passed. Its ignored helper hash is
`9fec2aed57a518281995022011193e56d04ec80578093b2c22df7258dc7b4cb3`.

The native category records are sibling records 0x42 bytes apart and contain HFX
676 (Buildings), 678 (Spells), and 680 (Followers), at x fields 0, 32 and 64. HFX
680 occurs at `005cb00f` in the Followers category record. Therefore HFX 680 is the
Followers **tab selector art**, not an "Everyone" follower-control icon. The shipped
lower grid currently reuses that tab art for its Everyone button.

Within the scanned original HUD descriptor segment `[005c8000,005cc000)`, the literal
class HFX ids 666, 668, 670, 672 and 674 each occur only in the counted class-control
records above; HFX 664 occurs in the Shaman portrait record and HFX 680 in the category
tab record. This static negative result does not prove that no dynamically computed
UI exists elsewhere, but it supplies no native descriptor evidence for the browser's
second Shaman/Brave/Warrior/Firewarrior/Spy/Everyone 3-column grid.

Static disassembly of the shared category record routines shows `0049d140` is a jump
into generic UI-list handling (`0044b890`) and `004a18c0` is a generic control renderer;
there is no retained/generated specialized Followers-grid consumer at those addresses.
Do not infer additional lower-panel appearance from those generic routines.

## Demonstrated original-vs-current gap

The player-visible mismatch is the duplicated browser-only roster inside the Followers
command tab:

- original evidenced follower information/control roster: **Total, Brave, Warrior,
  Preacher, Firewarrior, Spy**, each with native count/state art; Total also owns the
  housing meter; Shaman has its separate portrait;
- shipped lower Followers grid: **Shaman, Brave, Warrior, Firewarrior, Spy, Everyone**;
  it omits Preacher, omits counts/meter, uses generic 43px command buttons instead of
  the native 15x36 follower controls, duplicates the already-live selection surface,
  and misuses HFX 680 (Followers tab art) for Everyone.

The persistent shipped `tribe-classes` strip already implements the evidenced original
roster/layout/counts and calls the recovered native selection/focus path. This means
#60 does not need new selection, count, occupancy or HUD-art machinery for the smallest
repair.

## Smallest evidenced repair reservation

Reserve **`app/page.tsx` only** for production in the first implementation slice:
remove the invented six-button selection roster from the `tab === "followers"` branch
and keep the persistent native `tribe-classes` strip as the sole Total/class follower
selection-and-count surface. Preserve selected-Spy disguise buttons as a separate
modern follower action because they are valid shipped gameplay, but do not present
them as original class controls. No `app/globals.css`, `app/hud.tsx`,
`app/hud-population.ts`, `app/hud-selection.ts`, selection runtime, scene/picking or
gameplay change is required for this minimal correction.

Suggested focused acceptance for that future slice:

1. Followers tab uses HFX 680/681 only for the category tab, never as an Everyone icon.
2. Exactly one native follower roster is exposed: Total + Brave + Warrior + Preacher +
   Firewarrior + Spy, in the existing 0/16/32/48/64/80 logical positions with live
   counts and population meter. No duplicate Shaman/class/Everyone selection grid.
3. Existing single/Ctrl/Shift/right-click focus semantics remain unchanged; reuse the
   existing HUD-selection tests rather than reimplementing selection logic.
4. Counts update for live class changes and still include valid housed followers; empty
   classes render zero/empty using the existing native follower-number behavior.
5. Shaman remains selectable/focusable from its separate portrait.
6. Spy disguise actions still appear and work when applicable.
7. A dedicated browser check can cover normal campaign UI, count changes, a housed
   follower, empty specialist classes, checkpoint restoration, and modern viewport/DPR
   readability. Existing `check-browser-hud-selection.mjs` remains the regression owner
   for recovered selection/focus mechanics.

## Source identities used in this trace

- `app/page.tsx` `ebb637a827621df60882d34b4055a118bd7251cc898943758fd241826dfde0f1`
- `app/globals.css` `aad088c80d1dd9ef271382059fad8789f0d244e0f7b9e7282117f7c2d30b4115`
- `app/hud.tsx` `2d0a0032c0f7a2970c350a0323b7122bcbb58c333213968565028832508d9f0b`
- `app/hud-population.ts` `0190262ee4ca0acbc76a2a9d8eb2a6f0a1cb57da2b1d636cf42fcf115b5aa095`
- `app/hud-selection.ts` `21738b749f85d9cf2daf9df5dfb3825283722775c7e5ff475843ad51c539ef3c`
- `app/selection-runtime.ts` `1678adfa2b43eaaa13f4f0a2b918651a635ad4ce2685abbe8789135a6fda876e`
- `app/scene-input-runtime.ts` `d9fccbdc63aa4a33b0ee0df9cf689607ec6459c5d5855a6dcf35bb938145ecc4`
- `app/world-state.ts` `6dd69bccd271aa96c93dd6acb1696e3fc3b702dfb3cac5ab6bcc8776a4e16c5d`
- `app/original-hud.json` `c84f2d568756a60c3ae3ad85210c82bbc5155b5ebb1bb047ba9cb7c804cad1d0`
- `scripts/check-native-hud-population.py` `1c89453a173d9d03b7126ff6355b950776dd39483072833a34b8e2eeea7c71a7`
- `scripts/check-native-hud-selection.py` `11ed4e65a633e090e66f1f879f0a98076ebb3b521cbaaa82be180940c3a7155c`
- `scripts/check-browser-hud-selection.mjs` `ba4bd9ba7c6e7401b64adf3380e9ea7866f9df14143bc478df2acb498b943f9c`
- `decomp/generated/004a0510.c` `d392a71d78448479363c424909590513cb9af6dd7e6af2ecf494cb14fade25ea`
- `decomp/generated/004a0800.c` `e7bb0c37a98c4b70106fb8a7183f473167b138212df2e69fdb683b973d272e61`
- `decomp/generated/004a0f00.c` `78353214de4a2418b1eb4cee2df209ebdccf5f718b2eafe36f1c99e4e51fd155`
- `decomp/generated/004a1010.c` `9b12982584efcc48b2802cba18fe2d02028c7f447a9fd73ea6ea8c89fa7dddc4`
- `decomp/generated/004a1090.c` `ada109463e378aa1e998a29b9771533e1a6b0dcefb16febbc97c2617acab7b64`
- `decomp/generated/004a1120.c` `f49677629df2c3feb82c1938d1fffb060fd7df390843766a43202c91adbf550a`
- `references/reverse-engineering.md` `29da579e7715b1c93fe74dbd78327026f21299e5fa1669676976a94685834a01`

## Limits

This first slice does not implement #60, change source UI/CSS/gameplay, capture browser
screenshots, record parity, or claim unproved lower-panel appearance. The bounded native
inspection proves descriptor ownership and negative evidence for the duplicated icon
grid; it does not reconstruct every generic UI-list state transition.
