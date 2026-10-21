# Original in-game pause menu, bounded restoration

Refs #457 / #16. Base `3f87f5f767fa6e9a08e6b853de18feaf0fa83b9e`.

The shipped Menu/Game settings controls now open menu 16's original rows over the
paused battlefield. Browser-specific options/help, HUD scaling, sound preferences,
speed/camera conveniences and world selection remain under the explicitly named
Browser options and help panel. Camera requests apply only after closing the menu.

## Native evidence and limits

Original static evidence: `decomp/research/original-menus.md`,
`decomp/research/frontend-menu-composition.md`, and `decomp/generated/004fdbc0.c`.
The game renderer `00522b04 → 004581c0` queues text with `0045b6e0` and draws it
with `004fdbc0`; it does not use the startup `00459100` background/logo/glow path.
Menu16 table `005d9e98`, list `005d9b30`, initializer `004581f0` produces top anchors
159,189,219,249,279,309,339 and Back 454 at 640×480. Tutorial 79 keeps only Continue
Game 159, Options 189, Quit Game 219 and Back 454. All playable browser campaign levels
are within the native expanded single-player range 1–25. Native Quit Level's extra
`0089d17c&1` gate has no corresponding browser mode and is not claimed implemented.

Exact English questions: Restart Level? 1210, Quit Level? 1211, Quit Game? 1185;
Yes 235 / No 236 / Back 328 at 159 / 189 / 219 / 454. These are separate confirmations.

A further static audit corrected the frontend-font hypothesis: `004fdd64–004fdda8`
remaps style 2 bank IDs 6/7/8/9 to pointer `0087cbf4`, resource record `005a4790`
`data/f00t9-0.dat`. The dedicated importer preserves PSFB glyph pixels/widths using
the same initial pal0-c as the existing HUD importer. English settled foreground
uses normal alpha 170, highlighted 255 and dim 85. Native sine entrance fade,
language-specific paths and live palette changes are not claimed reproduced.
The frontend Fepointe cursor is reused as an explicit identity-preserving browser
approximation. The pause pointer path `00522b12–00522b2d → 00517750` reaches a
RET-only routine in this D3D executable, so it does not prove that resource choice.
The separate frontend selection is at `0045929d`.
Uniform 4:3 fitting, native HTML keyboard/focus controls, visible focus outlines,
and readable fallback labels are browser/accessibility adaptations.

## Ownership and browser adaptations

`00458060` captures prior pause in `0059d134`. Continue `004584f0` and root
Back `00458710` clear pause only if the world was previously running. Browser opening
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
Quit Level returns to world selection; Quit Game returns to the main menu. Neither pretends to terminate the browser.
The browser destination and unsaved-progress warning use two centered lines of the
same in-game F00T9 atlas below the native confirmation rows (y262/y292). This wording
and placement are browser adaptations, not recovered native text. The warning has
an accessible text description and the existing readable font fallback. The redundant
browser-tab instruction is omitted from this in-game confirmation; native question,
Yes/No/Back anchors and the confirmation/cancel behavior remain unchanged.

### Checkpoint lookup recovery

The continuation from `a488a7f769d6d16bb09f130da49be079a51c3076` corrects the
browser Load panel after a cold storage-read failure. Previously the original
Load Game row was disabled and titled "No saved checkpoint in this browser"
whenever memory had no checkpoint, even when the disk lookup had failed. The
frontend already supported retrying that read; the in-game panel now exposes the
same store-owned operation through the existing Load Game row.

| Read status with no memory checkpoint | Load Game row | Load panel |
| --- | --- | --- |
| idle | enabled | not checked; retry available |
| pending | enabled | checking; retry disabled |
| failed | enabled | read failed; checkpoint may still exist; retry available |
| read | disabled | if already open, reports no usable checkpoint |
| unavailable | disabled | storage unavailable |

A memory checkpoint keeps Load Game and explicit Load checkpoint usable in every
read state. A read status does not establish whether a later Save persisted, so
the Load panel calls it available in this session without claiming "session only."
Save retains its own persistent/session-only completion notice.

Retry only calls `restoreCheckpoint`: its existing single-flight promise owns the
lookup, it retains a newer in-memory save over a late disk result, and it never
replaces the active world. The explicit Load checkpoint action still owns world
replacement. The original rows, font, anchors, Tutorial restrictions, Back and
pause ownership remain as above. Read status and retry text are browser storage
adaptations inside the existing Load panel, not a claim about original file slots.

Retry synchronously focuses the persistent Back control before starting the read.
Repeated activation keydowns on buttons are suppressed, so holding Enter cannot
follow that focus change into Back and accidentally close the panel.
Completion never changes panels or takes focus from Save/Options. Returning to a
now-disabled Load Game row falls back to Continue Game; the same fallback applies
if an empty result disables the currently focused root row. Unit regressions cover
states, retry ownership and save/read races. The focused rendered scenario is
`scripts/local-render/original-pause-checkpoint-recovery.mjs`; it uses a real UI
save plus explicitly controlled IndexedDB failure/event timing, and separately
checks empty-store focus at DPR2. Actual run results and any incomplete rendered
acceptance belong in the source-bound PR evidence, not inferred from test source.

## Validation

The dedicated browser scenario covers ordinary controls, interrupted/repeated
flows, frozen state, already-paused and running close, confirmation focus/cancel,
checkpoint persistence and replacement, original Tutorial restriction and distinct
quit outcomes. Synthetic wrappers count calls for repeated-click checks only;
this is not a claim of native execution or hardware performance.

Retain source-bound command/browser receipts and failed attempts in the review
handoff. Before/after screenshots must identify the actual source head. Software
Chrome evidence cannot certify hardware frame performance or exact native pixels.

### Recorded browser coverage and remaining harness work

Clean `b7f4eeae` interaction evidence establishes frozen world/clock/camera,
640×480 through ultrawide/short layouts, confirmation cancel/focus, running and
already-paused close, selector return, and durable checkpoint replacement. Its
later restart scene creation crashed; that complete episode is not a pass.
Separate clean `24479c53` episodes passed restart replacement/one-shot Yes and
Tutorial captured-drag cancellation/Quit Game. Clean `97e96c5f` episodes passed
real DPR2 and a blocked font request with readable keyboard-accessible fallback.
Quit Level Yes and the controlled storage-failure/pending-save episode remain
rendered acceptance gaps: later attempts failed during initial world/startup
loading, before those actions. Initial-world software-Chrome crashes were also
reproduced on exact base main. These failures are retained, not counted as passes.

The new pause scenarios supplement recent migrated startup/checkpoint scenarios.
Older browser scenarios still need menu-navigation/observer-selector migration:
`early-missions`, `minimap-frame`, `mission1-hut-dismantle` and its `-witness`,
`mission10-boat-checkpoint`, `mission3-building-lifecycle`,
`mission3-building-screen`, `mission3-temple-checkpoint`, `readiness-lifecycle`,
`temple-training-auto`, `temple-training-witness`, and `water-shore-animation`
(all under `scripts/local-render`, `.mjs`). They are not claimed passing here;
stale combined-dialog selectors must not be diagnosed as gameplay regressions.

### Hosted cold-lookup acceptance route

The existing ready-PR Tutorial browser workflow also runs the authored
`original-pause-checkpoint-recovery.mjs` scenario in an isolated
`pause-checkpoint-recovery` matrix episode. It uses the same exact proposed merge,
plain production Home builder and official sandboxed Chrome as Tutorial. Tutorial,
selector, scenery, M2/F8 and spell coverage remain in their original episode.
Each episode retains the 120-second build, 180-second browser and 15-minute job
caps; the recovery scenario receives the browser deadline's AbortSignal. No M2
fixture is generated for recovery. Its receipt binds the scenario hash and actual
source, browser and dependencies, and its distinct artifact retains the authored
progress report and screenshots. This route is prepared, not rendered acceptance:
only a successful hosted run and inspection of its evidence establish that.

### First hosted recovery failure and startup-readiness repair

The first hosted recovery episode on PR550's composed `3b4cfce1` failed at the
second Mission1 entry (after the persisted-save reload): `enterMission` timed out
waiting for unlocked input. The retained failure showed the public Skip
introduction control and initial narration, no browser errors, and successful
cleanup. The first-failure artifact SHA256 is
`d61b8aa21f5db6520a398122ba65fe1ba329fc1bae6a9a80d5b4512201725ad6`.
The scenario had polled flyby state, then sampled Skip visibility only once;
React could mount its ready-gated control after that snapshot. It now polls until
the public control is visible/enabled or input is already unlocked, clicks the
actual Skip button when needed, and retains the final unlocked-input assertion.
The 25-second operation and 180-second browser caps are unchanged. No production
behavior was changed.

The earlier Mac functional pass and first hosted failure remain separate evidence.
Authored app blobs are unchanged; the scenario now contains this diagnosed
readiness repair. Its final composed hosted acceptance must be obtained afresh.
A naturally completed introduction can also remove Skip after readiness. The
scenario rechecks unlocked input before activation, awaits a public click bounded
to 2.5 seconds, and accepts a click failure only when input is already unlocked.
It never leaves a click running in the background; still-locked failures preserve
the original error and the final unlocked-input assertion remains mandatory.

### Browser checkpoint presentation

The Save/Load checkpoint subpanels now reuse the existing in-game `MenuText` and
`MenuRow` primitives: original F00T9/style2 atlas pixels, settled foreground alpha,
30px line pitch, transparent battlefield overlay and native-style action rows.
The removed dark bordered panel, sans-serif copy and filled HTML buttons were
browser inventions. No save-slot artwork, native filename editor or original
multi-slot functionality is claimed restored.

The 640×480 browser adaptation places its title at y39, explanatory copy in a
576×270 scrollable area at (32,81), Retry at y369, explicit Save/Load at y399 and
the unchanged Back at y454. Copy wraps by actual glyph advance within 544px,
leaving room for a scrollbar; long tokens wrap without shortening their text.
Only the copy area scrolls, keeping actions and Back visible. Keyboard focus can
scroll that area without triggering menu-row navigation. Unsupported characters
and a missing atlas use the existing readable fallback, with wrapping. Ellipsis
is drawn as three supported full-stop glyphs while the accessible label stays
unchanged. Browser instructions and these positions are not recovered native
save-panel text or geometry.

All read states retain their complete disclosure, including incompatible stored
save preservation and the distinction between an available in-memory checkpoint
and a proven session-only save. Save completion still reports its own persistence
outcome. Storage lookup, explicit load/save ownership, pending guards and pause
restoration are unchanged. Rendered acceptance and source-bound check results
must be established separately; this source note makes no pixel-parity claim.

The authored `scripts/local-render/original-pause-checkpoint-style.mjs` supplement
uses ordinary Mission 1 Save/Load controls with deliberately unavailable IndexedDB,
then repeats with a blocked pause-font request at DPR2. It checks the real
session-only disclosure, 640×480 / 1920×1080 / 800×450 layout, atlas rows or readable
fallback, independently scrollable copy, fixed reachable actions, frozen world and
Back/Continue focus/ownership. It retains screenshots and a geometry/text record.
The existing recovery and save-failure scenarios still own durable save/load,
lookup races and asynchronous failures. This authored supplement has not yet run;
the current cloud runtime blocks local browser execution, so rendered acceptance
remains pending in a supported environment. No existing hosted gate is changed.
