# Mission 11 first Matak BUILD_AT tower

## Native contract

Matak tribe 3's `EVERY 255` block runs at turns `253 + 256n`. Imported script
words `599..<625` require a completed self model-3 Hut, user variable 6 equal to
zero, and internal 1236 greater than one (at least two free AI task entries). The
live Hut reaches model 3 on turn 4560, so the first eligible live visit is turn
4605.

Words `617..<621` dispatch opcode 1082 with `(120,166)`. Native `004e5530` packs
that origin as `0xa678` and allocates
`flags=1, type=0, requested=4, origin=0xa678, extra=1, phase=0`; the script then
latches variable 6 to one. Allocation consumes no RNG. Mission 11 attribute 30 is
zero, so the first task dispatch consumes one orientation draw.

## Placement and failure semantics

`extra=1` is not hard placement at the origin. In native `004c6da0` it prevents
the ordinary model-4 coordinate-latch override, then the usual `0049c890` spiral
search runs around `0xa678`, excluding the center. With candidate acceptance forced
to fail, the first candidate was `0xa87a` `(122,168)`; 2,040 candidates were tried
in 40-candidate dispatches before phase 9 and cleanup. The origin was never visited.
Variable 6 remains latched, so this first request is not retried after failure.

The browser binds only this first branch. Its real Mission 11 terrain accepts a
later spiral candidate at `0xa478`, after which ordinary worker assignment and
construction complete and render the tower. Checkpoint continuation preserves the
full task, workers, orders, buildings, RNG, and variable-6 latch. Later BUILD_AT
towers, staffing, production, attacks, objectives, victory, and completion remain
deferred. No parity ledger status changed.

## Evidence boundary

`scripts/check-native-mission11-build-at.py` executes the bounded native script
branch, command dispatcher, allocator, construction dispatcher, and spiral search
against hash-verified inputs. The model-3 count and inert base building are supplied;
candidate acceptance is forced to reject for the failure case. Natural terrain
acceptance, construction, rendering, and checkpoint restoration are browser evidence.
