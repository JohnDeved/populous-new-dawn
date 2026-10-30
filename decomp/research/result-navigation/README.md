# Original terminal-result navigation

Refs #457. **Static research only, no runtime activation or UI parity claim.**
This closes the input/destination gap left by [original-result-ui.md](../original-result-ui.md).
The original has a two-stage terminal display, not Continue / Restart / Select
Level buttons. A normal first Space opens statistics; a second Space returns
through campaign selection, not directly to the numerically next mission.

## Source identity and method

- Existing `d3dpoptb.exe`, SHA-256
  `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
- Existing verified installer data, 323091880 bytes, SHA-256
  `c5d3ad2a1b369e636df85a6061b832c18f2dc33526a03383f61abd7b5518c52d`,
  originating from the documented `PopulousTB-Setup.zip` archive, SHA-256
  `6aa6c366809ea1d9575ec1d31a24527a95c7332f0a1d2ab692f7a602e7e10702`.
- Only `data/{app}/levels/levlspc2.dat`, **Component0**, was decoded in memory
  using the existing `refinery.lib.inno.archive.InnoArchive.read_file_and_check`.
  Its 924 bytes hash to
  `28649cf28a49aeef9980b7481d2b9d836fe633d89c8c0a7f9641c604eb90608b`.
  The installer was rehashed first. Component1's similarly named file was not used.
  No binary payload is added to the repository.
- [native.json](native.json) pins each bounded PE span and its bytes;
  [native.asm](native.asm) disassembles only the code spans with GNU objdump 2.44.
  [provenance.json](provenance.json) pins the listings, commands and small data
  observation. These are static instructions/data, **not native execution**.

Earlier renderer, input, camera and progression work was inspected first. Retained
Ghidra exports are pseudocode, not original compilable source. No game/installer
execution, emulator, network download, bulk asset copy, browser, build or full
test suite was used for this research.

## Ordinary single-player contract

Addresses below refer to this one executable. `land` is the dword at `0089c661`,
`load` at `0089c665`, and `level` at `0089c669`. Do not confuse their overlapping
byte views. Terminal bits are `land & 0x06000000`; statistics is `level & 0x20`.

### 1. Terminal overlay, not automatic statistics

The retained [end-level renderer](../campaign-popup-presentation/end-level-prompt.asm),
`005239f0`, requires terminal bits, statistics closed, opened-files gate
`0098f746 & 4` clear, and blink byte
`0089798b` nonzero. It draws string 248 (`Level Complete`) or 249 (`Level Failed`),
then string 250 (`Press Space Bar`). There are no action rectangles in this path.
The win/loss colour comes from `0089c6f7` / `0089c6f6`; it is not a guessed CSS gold.

Text is horizontally centered separately for each line in the battlefield
viewport (`0088f026`/`28`/`2a`/`2c`). First-line y is viewport y plus
`trunc(7 * (viewport height - glyph A height) / 8)`; the next line is one A-height
below. Font slot `008928dd` is 3 in both size branches of `0042bde0`.
Statistics uses `008928de`, which is 3 at area >= 640*480, but 4 below that.
Existing normal-resolution F00T3 glyphs can be reused, not an Arial substitute.
Live palette modulation/native GPU equivalence remains outside this proof.

The outcome producer `decomp/generated/00418e30.c` sets terminal flags and may
request the result camera. `0041b6d0.c` locks input reason 4, then unlocks it and
clears the active-camera byte. It does **not** open statistics. Overlay rendering
is not conditioned on that camera-active byte. The current browser's automatic
after-camera statistics activation is therefore not the original transition.

### 2. First Space opens statistics, hides HUD, and pauses

Default key table record `005d65d4` maps ASCII Space to command `0x5b`, with
predicate `004ff4f0` testing terminal bits. Initialization and first-match lookup
are retained in `004891d0.c` and `00489470.c`. Earlier Space records include
building rotation and another active-state action; this is not permission to
intercept Space globally before popup/menu/input ownership.

Command `0x5b`, `004abd86`, requires unsigned `DWORD[0089d188] > 10` and occurs
after the command processor's paused guard. For ordinary single-player it:

1. Sets statistics bit `level & 0x20`.
2. Calls `00479f00(8, 0, 1)` to hide the side HUD and recalculate the viewport.
3. Calls `00479f00(10, player, 1)` to pause when `land & 8` is clear.
4. Calls `0047aaa0` to clear the pause status display, not every status/message.

The UI/pause effects are described by `decomp/generated/00479f00.c`. When
`load & 0x04000000` is set (the tutorial-associated branch), `0x5b` instead calls
`0041b4f0` directly and does **not** show statistics. Do not make the tutorial
take a fabricated second-Space path.

### 3. Statistics presentation and owned input

`00523fa0` requires statistics set and `load & 0x200` clear. Reuse the existing
384x368 normal-resolution source panel and ten-row geometry, centered in the
**new** viewport after HUD hiding, not the old sidebar-reserved viewport.

The terminal prompt is string 250, drawn when `00897989` is nonzero. Its y is
panel top + panel height + trunc(line height/4), clamped to screen height minus
line height minus 2 if the computed y exceeds screen height. Normal panel-local
y is 372, already retained in `app/original-result-ui.json`. Terminal status text
also blinks: `00524228`–`0052432a` substitutes `%s:` for `%s: %s` while retaining
the earlier full-string centering origin, rather than hiding the whole heading.

`004a470b` sets blink byte `00897989 = floor(DWORD[0089d184]/4) & 1` and
`0089798b = floor(DWORD[0089d184]/6) & 1`. The overlay uses the latter; stats prompt
uses the former. This is **not** a render-frame counter or a proved CSS-duration
equivalent. The command eligibility counter `0089d188` is a different address.

Ordinary unmasked keyboard handling in `004a9d90` admits terminal-statistics
**Space-down** (scan code `0x39`) as command 99. Other key-downs return without
dismissing it. Nonterminal statistics is different: any key-down can close it.
Releases continue through ordinary lookup. `004aa1c0.c` similarly checks `0x39`
for terminal stats, whereas actual mouse buttons are `0xf0`/`0xf1`/`0xf2`:
there is no original terminal-results click-to-continue strip in this path.

Priority and exceptions matter: hard input-disable returns first; popup states
2/3 own Enter-down as command `0xb0`; opened-files state can consume the event
before results. Under input-mask `0x10000000`, Escape has its own menu command,
and Space can skip a flyby before routing terminal `0x5b`. The masked multiplayer
branch differs again. Therefore **do not generalize** this contract into
"Escape never works" or attach a global Space handler ahead of existing owners.

### 4. Second Space requests selection, never current+1

Command 99, `004ab498`, is in the first command switch, so it can run while the
statistics pause is set. It requires unsigned `0089d188 > 10` and
`load & 0x04000000` clear. For terminal stats it stops audio at `0048b480`, clears
the stats bit, and calls `0041b4f0`. Nonterminal command 99 just toggles stats.

`0041b4f0` ordinarily sets `load & 0x08000000` and requests
`00479cf0(player, 0x4a, 54, 0)`. The queue refuses an occupied pending slot
and a separate `land & 0x800` gate; the request is not an unconditional synchronous
scene replacement. After admission, tribe dispatcher `0043e8e0` maps command
`0x4a` to `0043fb95`, which calls `004858f0(arg1)`.

`00486350` reads `LEVELS\\LEVLSPC2.DAT` into `0089a00d`. The special-level byte
at `0089a315` is file offset `0x308`, verified as **54** in the Component0 data.
`004858f0(54)` compares equal, assigns profile index 99, sets `load & 0x200`,
and calls `00412960(0)`. `00485660(54)` has an explicit early return, so **54 is
not a mission data load**. The selected-body recommendation/progression owner
then requests state 10 (selector), except its known terminal-25 branch.

The reviewed prerequisite [PR712](https://github.com/JohnDeved/populous-new-dawn/pull/712)
models that later boundary, not the entire result lifecycle. On victory it uses
the selected-body mission and existing completion snapshot. On non-victory,
argument zero requests `pop3mask.tgq`, then recommends the first incomplete
mission, not necessarily the mission just lost. Completed worlds remain replayable
via mask 5. A recommendation is **not** an instruction to launch a level.

External modes are deliberately excluded: `0041b4f0` with `land & 8` only sets
another land bit; `004858f0` with `0089d17c & 1` requests state 7 before the
selector path. The latter's exact semantic name is not invented here. The quit
callback's `00412960(1)` is not equivalent to this `00412960(0)` result exit.

## Smallest safe replacement and dependencies

At base `eb8e02208097ae05d6ca33e008a7f3c97a2c225c`, the live result component
contains the native panel plus invented HTML action strip, Arial buttons and
explanatory paragraph. `app/page.tsx` auto-shows it after the camera and Continue
loads `outcome.level + 1`. The selector's All missions route is still the only
ordinary route exposing Missions 4–23. **Do not remove either sole route now.**

The smallest safe activation is one reviewed lifecycle/selector integration, not
a prompt-only patch:

1. Integrate PR712's availability/completion/recommendation distinction with a
   reviewed current-format profile policy in `app/game-store.ts` and profile
   serialization. Completed-only history cannot losslessly reconstruct availability:
   after completed 1–15, ordinary entry yields only 16; natural win15 yields 16–19.
   Preserve unrelated flags and cheat/no-award boundaries. Reject incompatible
   saves without changing stored data; never silently invent recovered history.
2. Use [PR714](https://github.com/JohnDeved/populous-new-dawn/pull/714)'s inactive
   25-body/socket/title/palette manifest plus remaining palette-specific source
   artwork to finish `world-selector.tsx` / `world-selector-data.ts`. It is data,
   not a ready selector. Keep the supported-mission filter: do not expose unsupported
   24/25. Keep all existing 1–23 direct access until an explicitly reviewed native-
   styled compatibility route replaces it; progression eligibility and development
   access are distinct. Replaying the just-lost/completed level must stay reachable.
3. Give `app/page.tsx` explicit result-overlay, result-statistics, and exit-pending
   ownership. Preserve popup/flyby/camera priorities. First admitted Space opens
   stats and owns HUD hiding/pause; second returns through the campaign selector
   transition, never `continueCampaign()`'s current+1 launch. Do not repurpose
   `quitLevel()` blindly because its teardown/startup/intro policy differs.
4. Update `original-result-screen.tsx`, its CSS and `original-result-layout.ts`
   to remove the strip only when that route is working. Reuse source glyphs/panel,
   render the native prompts, and fit the expanded viewport. Keep unrecorded
   counters unavailable, with accessible descriptions: counter-owner research is
   not live event wiring. Resolve blink-clock mapping, source colour and low-
   resolution font behavior separately before claiming exact rendered parity.
5. Route owned result input ahead of gameplay pause/building rotation and camera
   keyboard handlers, but **after** higher-priority modal owners. Suppressing browser
   key-repeat and requiring a fresh down per stage is defensive browser policy;
   do not claim its millisecond timing is original. Deduplicate pending effects,
   preserve error recovery, and release only result-owned pause/HUD/input state.

If visual cleanup must ship earlier, retain necessary actions as explicitly
compatible controls using existing verified original control artwork/bitmap text.
That is a style adaptation, not proof those actions existed in the result screen.
Deleting the strip or relabeling Continue as Space before the complete route is
ready would strand restart/access or preserve the incorrect next-mission behavior.

## Focused activation acceptance (not run here)

- Natural win and loss: overlay first; no automatic stats after camera; camera
  completes or skips through its existing owner. First fresh Space opens stats,
  hides HUD, pauses single-player and clears only the pause status. Second fresh
  Space requests selector exactly once, with no gameplay pause/rotation/camera leak.
- Tutorial-associated branch skips stats. Popup Enter ownership, masked Escape,
  opened-files gates, keyup, held/repeated Space, pointer input, pending work and
  failed/retried transitions are separate cases, not one unconditional handler.
- Terminal stats Enter/click do not act as invented navigation; nonterminal stats
  retains its different dismissal semantics. No extra modern instruction text.
- Victory1, replay, win15 fork16–19, both pair unlocks20/21, and non-victory first-
  incomplete recommendation use PR712 oracles. Opening UI/restarting never awards
  completion. Unsupported24/25 cannot launch. All current1–23 access remains.
- Selector Back preserves the terminal world where compatibility offers it;
  choosing the same mission creates a clean restart, not a stale result world.
  Async double input/failure cannot leave pause/HUD/menu ownership stuck.
- Current-format profile/save/load roundtrip and deliberate migration/rejection
  policy; cheat completion boundaries; new game/restart and natural campaign run.
- Source-sized 640x480 and supported modern viewports/DPR: panel placement after
  HUD hiding, native glyph/source colours, prompts outside panel, both blink
  sources, image failure/accessibility, no Continue/Restart/Select Level strip.
  Existing result counter/final-time/palette unknowns must not be disguised.

Extend existing `tests/home-result-lifecycle.test.mjs`,
`tests/original-result-screen.test.mjs`, campaign store/selector tests and natural-
outcome browser episodes. Run normal check/build and affected rendered gates only
after an independent review and serialized integration checkpoint.

## Reproduction and present acceptance

```sh
python3 -B scripts/research-result-navigation.py VERIFIED_EXE > /tmp/result-navigation.json
cmp /tmp/result-navigation.json decomp/research/result-navigation/native.json
node --test tests/native-result-navigation-source.test.mjs
```

Reproduce each bounded listing with the exact commands in `provenance.json`;
normalize only the input path to `d3dpoptb.exe`, trim line-end whitespace, and
prefix each with `; <span name>`. The one-member data observation can be repeated
using the existing data-only extractor after checking the installer hash, exact
member name, Component0, and 924-byte size. Do not execute the installer.

The portable test checks retained identities, dispatch-table targets, key gates,
call targets, queue admission, selector sentinel identity and corrupt-input
rejection. It is a **static consistency test**, not a native differential test,
live UI acceptance, playability proof, or timing/performance measurement.
