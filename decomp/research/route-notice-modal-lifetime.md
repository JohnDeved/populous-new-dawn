# Route notice lifetime during browser menu suspension

Refs #457 / #16. Baseline f85a8105fd77c71547fe5cd01594d3467c47b098.

Home hides `.route-notice` when the menu is open, but its three-second CSS animation
continues. Its completion handler clears the world's notice. The selector is reached
from the menu's Browser compatibility panel and retains that menu session while
`menu` becomes false. Both surfaces therefore need to suspend this presentation timer.

## Supported contract and limits

[Original pause restoration](original-pause-menu-browser.md) records prior-pause
capture at 00458060 and conditional restoration at 004584f0/00458710. It separately
documents the browser adaptation: scene modal suspension freezes the presentation.
The current `GameScene.animate` implements that explicit contract; ordinary Space
pause still advances presentation. Home's actual open/close handlers capture the
same world and restore its prior pause state. The current public menu and its
selector always suspend; there is no supported continuing-world menu policy here.
Native restricted/multiplayer menu contexts must not be inferred from these paths.

This correction suspends the existing CSS timer while either supported modal is
open. It preserves the existing timer during ordinary game pause and after closing
a menu that began paused. It does not assert that three seconds is native timing,
change notification production/text, or claim complete native notification fidelity.
The original route failure remains flags 0x200000/message603 in `requestTutorial`.
An obsolete callback also checks world identity before clearing a matching serial.

## Focused reproduction

`tests/route-notice-modal.test.mjs` evaluates the shipped Home JSX and real menu
handlers through the existing AST harness. It checks initially running/paused
sessions, selector return, reopen, final pause restoration, ordinary pause, and stale
callbacks after replacement or a new notice. These tests validate component wiring
and handlers, not actual browser animation time. Existing route-recovery tests cover
the unchanged production boundary. Initial harness and intermediate failed attempts
are retained separately from the valid baseline.

## Prepared rendered reproduction — not yet run

`scripts/local-render/route-notice-modal.mjs` uses actual Home, CSS, store and scene.
It follows New Game, recommendation No, Mission1, Skip introduction. A controlled
fixture then publishes only a route notice, explicitly excluding natural gameplay
production acceptance. It observes the actual CSS animation, holds the menu for
3.4 seconds, cancels Quit Level, inspects the selector, returns via Escape, reopens
the menu, then verifies timer expiry after final close for both prior pause states.
World/scene/canvas identity and frozen time/turn are checked. It never launches an
All missions button or original executable.

Run baseline and candidate serially after the parent releases the Mac browser lane.
Use a fresh context/output for each and a source-bound runner with bounded build,
browser timeout and cleanup. A baseline failure at `sameNotice` is expected; capture
the observed animation/time state before the assertion. Do not count preparation or
the controlled fixture as a real route-failure producer reproduction.
