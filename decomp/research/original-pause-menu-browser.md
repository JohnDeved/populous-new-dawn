# Original in-game pause menu, bounded restoration

Refs #457 / #16. Base `3f87f5f767fa6e9a08e6b853de18feaf0fa83b9e`.

The shipped Menu/Game settings controls now open menu16's original rows over the
paused battlefield. Browser-specific options/help, HUD scaling, sound preferences,
speed/camera conveniences and world selection remain under the explicitly named
Browser options and help panel. Camera requests apply only after closing the menu.

## Native evidence and limits

Original static evidence: `decomp/research/original-menus.md`,
`decomp/research/frontend-menu-composition.md`, and `decomp/generated/004fdbc0.c`.
The game renderer `00522b04 → 004581c0` queues text with `0045b6e0` and draws it
with `004fdbc0`; it does not use the startup `00459100` background/logo/glow path.
Menu16 table `005d9e98`, list `005d9b30`, initializer `004581f0` produces top anchors
159,189,219,249,279,309,339 and Back454 at 640×480. Tutorial79 keeps only Continue
Game159, Options189, Quit Game219 and Back454. All playable browser campaign levels
are within the native expanded single-player range1–25. Native Quit Level's extra
`0089d17c&1` gate has no corresponding browser mode and is not claimed implemented.

Exact English questions: Restart Level?1210, Quit Level?1211, Quit Game?1185;
Yes235/No236/Back328 at159/189/219/454. These are separate confirmations.

A further static audit corrected the frontend-font hypothesis: `004fdd64–004fdda8`
remaps style2 bank IDs6/7/8/9 to pointer`0087cbf4`, resource record`005a4790`
`data/f00t9-0.dat`. The dedicated importer preserves PSFB glyph pixels/widths using
the same initial pal0-c as the existing HUD importer. English settled foreground
uses normal alpha170, highlighted255 and dim85. Native sine entrance fade,
language-specific paths and live palette changes are not claimed reproduced.
Uniform 4:3 fitting, native HTML keyboard/focus controls, visible focus outlines,
and readable fallback labels are browser/accessibility adaptations.

## Ownership and browser adaptations

`00458060` captures prior pause in`0059d134`. Continue`004584f0` and root
Back`00458710` clear pause only if the world was previously running. Browser opening
captures that state and the world identity synchronously; only final same-world
close restores it. Options, save/load and No/Back/Escape keep ownership. Beginning
a load/restart/quit invalidates the old session before replacement.

Scene modal suspension stops fixed turns, time/RNG, worship acquisition visits,
unit/object animation, camera motion, sky/globe phase and environmental updates.
It keeps rendering the frozen scene and sampling frame timestamps, avoiding elapsed
time catch-up. Ordinary Space pause still supports its previous acquisition behavior.
Opening cancels captured pointer gestures so drag input cannot move the frozen world.

Browser Save stores one checkpoint, replacing the previous one only on the explicit
Save checkpoint action. Its pause override affects only the clone, never the live
world. Persistent versus session-only saves are reported. Explicit browser Load
continues the existing auto-resume behavior, including a checkpoint saved while
already paused. Original multi-slot file compatibility remains unimplemented.
Quit Level returns to world selection; Quit Game returns to the main menu and
explains that closing the browser tab exits. Neither pretends to terminate the browser.

## Validation

The dedicated browser scenario covers ordinary controls, interrupted/repeated
flows, frozen state, already-paused and running close, confirmation focus/cancel,
checkpoint persistence and replacement, original Tutorial restriction and distinct
quit outcomes. Synthetic wrappers count calls for repeated-click checks only;
this is not a claim of native execution or hardware performance.

Retain source-bound command/browser receipts and failed attempts in the review
handoff. Before/after screenshots must identify the actual source head. Software
Chrome evidence cannot certify hardware frame performance or exact native pixels.
