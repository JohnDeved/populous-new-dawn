# Camera bookmarks

Implemented in `61b29c8` on 2026-09-13. Reuse the existing exports and comparison;
another Ghidra export is unnecessary unless investigating an uncovered branch.

## Established behavior

`004aab80` actions `0x1e..0x21` save four slots; `0x22..0x25` recall them.
The native key records at `005d63d0..005d6424`, loaded by `004891d0`, bind
Shift+Z/X/C/V to save and Z/X/C/V to recall. Stored state is x, y, and heading.
Unset slots produce no recall command. Save emits sound arguments `(0,221,1)`;
the recall consumer emits `(0,222,0)`.

Recall queues command `0x16` through `00479dd0`. Consumer `0043de90` resolves the
coarse cell to its center: `(coordinate & 0xfe00) | 0x100`, then uses the existing
camera focus planner. The first implementation targeted the lower edge; executing
the consumer during review exposed and corrected that parity difference.

## Evidence and reuse

Run `.tools/decomp/oracle/bin/python scripts/check-native-camera-motion.py <executable>`.
It checks the physical key-record bytes, invokes native save/recall actions, checks
stored state and queued commands, then executes the recall consumer and observes
its cue and focus target. Earlier batches compare native planning and movement to
`app/camera-motion.ts`. Executable identity is checked by `native_cpu`; SHA256:
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
Reviewed export hashes/tool metadata are in `decomp/exports.json`.

`scripts/check-browser-camera-smoothing.mjs` checks actual browser key events,
independent slots, movement, wrap, cues, and overview transition. Runtime ownership:
`app/scene-input-runtime.ts`, `app/scene-camera-runtime.ts`, and `app/audio.ts`.

The CPU harness supplies input/cleanup, globe updates, and sound consumers; it checks
arguments, not actual sound playback. Physical key records are inspected, not an
emulated Windows keyboard event chain. Browser checks establish the browser adapter.
The evidence does not establish persistent saved bookmarks or every original modal
and input-lock branch. These remain separate questions if future work needs them.

## Held-key boundary

The browser bookmark handler ignores `KeyboardEvent.repeat` for these eight
save/recall chords only. A later separate press remains effective. This prevents
holding a save chord from overwriting the captured position and replaying cue 221,
or holding recall from reissuing focus and cue 222. Other held camera keys are
unchanged.

The atlas's `press` label alone would not establish the repeat boundary. The
retained `original-startup-movies/input-player/keyboard-producer.asm` shows the
buffered DirectInput device call at `0052ca4f`, 16-byte records, `dwData & 0x80`,
and the loop bounded by returned record count. `input-dispatch.asm` dispatches
that record through the keyboard callback at `00526b34..00526b4a`. In the pinned
executable, gameplay calls `00526a80` with callback table `005cdb98` at
`004aa59c` and `004aa700`; the table's first pointer is `004a9d90`.
Microsoft's [Buffered Keyboard Data documentation](https://learn.microsoft.com/en-us/previous-versions/windows/desktop/ee416238(v=vs.85))
specifies that this input path does not generate character-repeat events while a
key remains held. This is static byte/API evidence, not a new native execution or
a claim about other input backends or focus reacquisition.

`tests/camera-bookmark-press.test.mjs` executes the extracted shipped key handler
and bookmark consumer with supplied scene/focus boundaries. It checks all four
save and recall slots, held repeats, separate presses, modifiers, existing input
locks, and unaffected held navigation. It does not establish rendered motion or
audible output.
