# Original result presentation: clocks, glyphs and geometry

Refs #457. **Static Western/English source contract, not native-runtime parity.**
Extends [result-navigation](../result-navigation/README.md), without duplicating
its two-Space navigation, popup priority, HUD/pause ownership, or selector proof.
The original files and existing result/popup evidence were read first.

## Identity, files and verification

- `d3dpoptb.exe`: 2,275,840 bytes, SHA-256
  `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
  Existing local source: `populous-original-inputs-20261020/game/d3dpoptb.exe`.
- [native.json](native.json) contains bounded, half-open VA ranges, PE file
  offsets, exact bytes and hashes. [native.asm](native.asm) is their GNU objdump
  2.44 disassembly. Code spans are instruction-aligned; data is not disassembled.
  The import resolver independently proves `00d0c784 = KERNEL32!GetTickCount`.
- [contract.mjs](contract.mjs) is a **research-only**, pure, executable specification
  of the bounded formulas below. No application imports it. It does not run or
  emulate the original program and does not invent a browser clock binding.
- [cases.json](cases.json) has integer layout/phase cases. [metrics.json](metrics.json)
  retains the needed source glyph dimensions and prior normal-resolution fixture.
  All 224 F4 dimensions were independently read from existing PSFB record headers
  and matched against the existing HUD atlas rectangles. F4 source:
  `/tmp/pnd-popup-inputs-20261021/data/f00t4-0.dat`, 13,472 bytes, SHA-256
  `2cbebbf772ffa2fceca7ec5e37a08c1c6fe190653bbc3d85ebe126443d4494d0`.
  F3 metrics reuse the established `app/original-result-ui.json` import; the
  corresponding metadata hashes are pinned, not presented as a new F3 extraction.
- [provenance.json](provenance.json) pins all evidence/specification files and
  commands. Reproduce PE JSON with
  `python3 -B scripts/research-result-presentation.py VERIFIED_EXE > SCRATCH.json`,
  then `cmp SCRATCH.json decomp/research/result-presentation/native.json`.
- Run `node --test tests/native-result-presentation-source.test.mjs
  tests/native-result-navigation-source.test.mjs` and `git diff --check`.
  These are source/contract tests, not original execution or browser acceptance.

No game/installer execution, emulator, download, dependency install, bulk extraction,
new sprite import, runtime edit, screenshot or full build was performed. Existing
ZIP/installer data was not opened or changed in this pass.

## The two counters are different owners

| Address | Producer | Meaning for this bounded single-player path |
|---|---|---|
| `0089d184` | `0043e871 ff 05 84 d1 89 00` | Increment once after an admitted input/tribe-command cycle. Not render frames or successful object turns. |
| `0089d188` | `004ec703 ff 05 88 d1 89 00` | Increment at the beginning of an unpaused inner simulation/object turn. |
| `00897981` | `004a4710 ff 05 81 79 89 00` | Separate main-display-loop counter. It does not supply result blink phases. |

`0043e480` ordinary SP admission checks queued records against the current input
cycle when applicable. The no-admission branch at `0043e55d` returns through
`0043e877` **without** incrementing. Accepted paths join `0043e871`. No `land & 2`
pause gate surrounds that increment.

`004ec6f0` begins with `f6 05 61 c6 89 00 02`; `jne 004eca3b` bypasses the
inner work and its counter when simulation pause is set. Terminal win/loss bits
are not that pause. The commands in the navigation contract compare **unsigned
188 > 10**, not input-cycle184 > 10 and not elapsed seconds.

### Clock, cadence and speed

`004a5590` reads unsigned rate byte `0089d161`, divides 1000 by it using integer
`idiv`, and stores the interval at `005cd930`. It reads the imported timer through
`00d0c784`. Ordinary SP scheduling at `004a5931` admits work while the sampled
GetTickCount value is **unsigned greater than** deadline `005cd92c`. It calls
`0043e480`, processes commands, performs `1 + signed byte[00895dac]` inner visits,
then advances the deadline by the interval. It can catch up multiple intervals.
Popup states 2/3 call `004af640` in place of the simulation body.

The rate is **default 12, not proved immutable**:

- Settings record `005a9d6c`, stride20, is
  `61d18900 00000000 0c000000 0c000000 0100011c`.
- It targets `0089d161`; default field+8 is12; type byte+18 is1; flags+19 contains8.
- `0049a940` iterates that table, dispatches type1 to `0049a97a`, and writes the
  byte default at `0049a980`. Startup calls this at `004a44e9`, followed immediately
  by settings-file processing `0049a9d0`, which can override the defaults.
- At rate12, interval is **83ms**, not exactly 1/12 second. Divide4 blink half-period
  is332ms (full664); divide6 is498ms (full996), assuming uninterrupted admission.
  Native timer granularity, catch-up and input availability still affect displays.
- Speed command `0043ec32` clamps extra inner iterations to0..4 ordinarily
  (0..32 with `land & 0x8000`). This accelerates188, **not184/blink**.

When184 is zero, `004a55bb` calls GetTickCount and subtracts1 before initializing
the deadline. Consequently the first scheduler visit is immediately due.
A browser `floor(elapsedMs/83)` clock starting at zero is a deliberate epoch/phase
adaptation, not a byte-for-byte reproduction of this first visit.

### Phase and render order

`004a470b`–`004a472d` computes `floor(uint32(184)/divisor)&1` for divisors1..7.
Thus `00897989 = floor(184/4)&1`, and `0089798b = floor(184/6)&1`.
These are sampled **before** state dispatch at `004a4755`; ordinary gameplay
calls the scheduler at `004a4b6a`, then renders at `004a4c07`. A fresh display can
therefore use the pre-catch-up phase, not the final count after that visit.

- Terminal battlefield overlay: visible iff divide6 phase is1, in addition to
  the existing terminal/stats/files ownership gates (`00523a42`).
- Statistics terminal status: full string is measured and centered first;
  divide6 phase1 replaces `%s: %s` with `%s:` at the **same x** (`005242bb`).
  The value is visible in phase0, complementary to the battlefield overlay.
- Statistics `Press Space Bar`: visible iff divide4 phase is1 (`00524968`).
- Both counters wrap at32bits. Pure cases include the high unsigned bit and wrap.

### Initialization and bounded browser mapping

`0042bfa0` zeros both counters at `0042bfd3/0042bfdc` and speed-extra at
`0042c010`. Level-load owners `0042b590` and `0042c790` call it at
`0042b597/0042c827`. This disproves a necessarily application-global blink epoch.
Other reset/restore/network paths exist; **this is not an original-save loader
or a proof that every scene transition should reset both counters**.

Read-only comparison against the runtime integration tree found:

- `app/world-turn.ts::stepTurn` first checks `landFlags & 2`, processes preceding
  tribe work, then increments `w.turn` before `stepOutcome`. That is a bounded
  semantic match for188's inner-turn owner, not a blind name-based substitution.
- `app/game-clock.ts::advanceGame` speed-scales `tick`; animation frames run24Hz
  and stop during ordinary UI pause. Neither is native184.
- A dedicated browser presentation/input-cycle accumulator, unscaled by game
  speed and continuing during result simulation pause, is the suitable **adapter**.
  Keep its initialization, immediate first visit, tab/focus suspension, queue
  admission and pre-scheduler sampling policies explicit. It is not an original
  input scheduler, even if it uses83ms and the exact phase formulas.
- A separate count of successfully completed logical steps can bind188 for
  fresh browser worlds if it wraps32bits, is not incremented on paused no-ops,
  and has an explicit current-save/reset policy. It must not replace184 for blink.

## Glyphs and color: do not tint from a palette slot

Screen **area**, not battlefield area, selects slots in `0042bde0` (retained in
navigation evidence): overlay `008928dd` is3 in both branches; statistics
`008928de` is4 when signed width*height <307200, otherwise3. F3 glyph A is10x19;
F4 glyph A is6x10. The independent compact-height branch is **screen height <=220**.
The contract is for positive, valid native screen dimensions, not overflowed or
out-of-range signed-short input.

A material refinement to the earlier overlay-color note:

1. Overlay `00523a80` and stats `00524014` both select **direct/raw vtable591688**
   for Western text. Layout-only measuring at `0042b98e` selects591698 instead;
   the two have the same metrics but different glyph drawing.
2. `00591688+12 -> 00527a00`: this CPU leaf calls raw sprite blit `0052a7e0` and
   does not read the passed color argument. Recolor leaf527a60 belongs to591698.
3. `00516d30` maps591688 to GPU table5da200, whose glyph leaf is516c80. It uses
   white modulation0x00ffffff unless inherited `005da074 & 8` requests5da0e0.
   It likewise does **not** use the text call's color argument.
4. The stats panel523d40 clears flag8 at523f86 before its text. Reward icon work
   clears it again at5248b4 before the prompt. Overlay inherited flag8 is not
   fully established here. Other GPU texture/palette/blend/filter state remains
   outside the claim.
5. Overlay still passes slot89c6f7 for completion or89c6f6 for failure.
   `00429dab` binds slot-array base89c6f4 to initialization42adc0; +2 uses the
   red target(255,0,0), +3 green target(0,255,0), through palette lookup526660.
   **These arguments do not prove red/green visible Western glyphs** and must
   not become guessed CSS text colors, filters or masking colors.

Reuse unmodified existing source glyph pixels: F3 from `result-font.png` or the
identical existing F3 HUD crops (prior pixel verification is retained in
`decomp/research/campaign-popup-presentation/hud-font-pixel-verification.json`
in the integration tree); F4 from HUD keys `f00t4-0`..`f00t4-223`. No new
atlas is required. Fixed pal0-c source pixels are not proof of every mission's
live palette or native GPU output. Language IDs9..11 use a different font path
(`00493210` and451ba0); that branch is not covered by these English glyph claims.

## Exact placement and low-resolution statistics

All integer divisions below truncate toward zero. Use separately supplied
**screen** dimensions and current battlefield viewport `(vx,vy,vw,vh)`.

Battlefield overlay5239f0:

- `statusY = vy + trunc(7 * (vh - font3.A.height) / 8)`.
- `statusX = vx + trunc((vw - statusWidth) / 2)`.
- `promptY = statusY + font3.A.height`.
- `promptX = vx + trunc((vw - promptWidth) / 2)`.
- No explicit placement clamp in this function. Complete/Failed widths are134/100;
  prompt width138. A320px screen still uses F3 here, not F4.

Statistics42b940/523fa0:

- `contract.mjs::statisticsLayout` implements the exact Western layout using the
  existing ten labels, grouped rows, glyph dimensions and HFX1028 reward36x43.
  HFX1462 supplies the16x16 tile dimensions. This is not responsive CSS text wrap.
- Center the tile-rounded panel in the **post-HUD-hide viewport**, with signed
  truncation. Do not preserve its prior sidebar offset or clamp its top natively.
- Headings use `insetX + trunc((contentWidth - measuredFullTextWidth)/2)`.
  Measure the full status before omitting its blinking value, without recentering.
- Terminal prompt uses **panelWidth**, not contentWidth, for horizontal center.
  `provisionalY = panelTop + panelHeight + trunc(lineHeight/4)`.
  Only if `provisionalY > screenHeight` use `screenHeight-lineHeight-2`.
  `== screenHeight` is not clamped; neither is partial glyph clipping. A browser
  fit/visibility correction should be explicit instead of silently called native.

| Screen | Font | Panel | Inset | Heading/player/status/time y | Line/gap | Prompt local y |
|---|---:|---|---|---|---|---:|
| 640x480 | 3 | 384x368 | 1,5 | 13/31/49/76 | 18/7 | 372 |
| 512x384 | 4 | 240x224 | 2,4 | 12/21/30/43 | 9/5 | 226 |
| 320x200 | 4 | 240x208 | 2,2 | 6/15/24/37 | 9/3 | 210 |
| 1600x200 | 3 | 384x336 | 1,6 | 10/27/44/69 | 17/3 | 340 |

F4 label/colon/value-start x are18/168/177; counter reserve51, separator9;
time reserve54. Row y values are57,66,80,89,98,107,121,130,139,153 at512x384;
49,58,70,79,88,97,109,118,127,139 at320x200. F4 prompt width83.
At full320x200, native panel top is-4 and prompt is clamped from206 to189.

The panel is the **same523d40** used by campaign popups: HFX1450..1462.
The existing campaign-popup tile atlas uses x=(frame-1450)*16, y=0. Reuse it and
`popupPanelTile` where already available; side-edge parity depends on columns-1,
not row. This proof does not change the previously disclosed inherited panel
tint/blend limit. Reusing/scaling the precomposed384x368 panel is not the original
low-resolution240x224/208 composition.

## Acceptance boundaries

The source tests cover exact executable bytes, import/default-rate binding,
separate paused/speed/admission counters, unsigned wrap, blink boundaries,
raw/recolor vtable distinction, both font/height thresholds, all three normal
screen examples plus wide-short F3, negative truncation, status origin retention,
and strict prompt-clamp boundaries. They do **not** prove native screenshots,
full language coverage, focus/suspend/save behavior, queue stalls, original GPU
colors, or playable browser integration. Keep those visible in integration notes.
