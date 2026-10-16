# Browser-local Game input preferences

Original Options now shows all five Game rows in both skins. Rotation and Flip
Rotation control the already-supported keyboard camera mapping. Tooltips, Stay
Selected and Autocast Spell remain visibly unavailable and noninteractive; their
native runtime consumers have not been established for integration.

## Keyboard behavior

- Cursor: Left/Right arrows turn; Delete/Page Down pan sideways.
- Control Cursor: Left/Right arrows pan; Delete/Page Down turn.
- Ctrl swaps these two pairs in either setting. Up/Down still move forward/back.
- Flip Rotation reverses keyboard turning, including Q/E and keypad turn aliases.
  It does not reverse sideways panning, mouse drag, or screen-edge scrolling.
- WASD and fixed keypad movement aliases retain their direction. Shift accelerates
  panning only. Existing overview conversion, modal and input locks remain unchanged.

Cursor/No are compatibility-preserving browser defaults, not a claim about original
installed defaults. Settings only affect later admitted input; changing them never
advances the camera, simulation, or audio while Options is open.

## Storage and ownership

`app/game-preferences.ts` reads/writes only `populous-game-preferences` in browser
localStorage. Version 1 contains `rotation` (`cursor` or `control-cursor`) and boolean
`flipRotation`. No other original option, world state, campaign progress, enabled
sound flag, native save data, or checkpoint field is stored here.

Missing, malformed, unsupported or invalid records restore a fresh default object.
Reads never replace or delete saved records. An explicit valid control change writes
only the supported fields. Storage getter/read failures safely use defaults; write
failure leaves the chosen session values working and shows a visible notice. Other
browser keys, audio preferences, HUD size, and game/profile checkpoints are untouched.
Separate tabs retain their own current session values until reloaded or adjusted.

Page owns settings across startup and in-game Options. It restores them at the
existing asynchronous startup-ready boundary. A current-value ref is updated with
each setting change and is read immediately after new GameScene construction,
before start; asynchronous scene import cannot capture an earlier choice. Existing
scenes receive the current object directly without scene/world recreation. The scene
creation effect's dependencies are unchanged.

## Evidence boundary

Native row positions, value labels, descriptor bits and existing camera mapping are
summarized in [static findings](../decomp/research/game-options-static/findings.md).
Portable preference and caller tests cover storage validation/failure, all keyboard
mapping combinations, current-setting reads, edge and modal gates. The Options test
evaluates production row declarations and checks their actual indexed-shadow inputs.
Rendered evidence and source-bound final checks are retained in the
[bounded acceptance packet](../evidence/game-options-20261016/README.md) and PR #467.
Unit/caller results alone are not a rendered or native runtime witness. No native persistence/defaults, full original-settings parity,
selection rules, spell rules, or hardware performance claim follows from this slice.
