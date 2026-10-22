# Native Query and Encyclopaedia

Implementation starts from `0107e11c3650918f494982754fe12f3eb990b83b`, the unmerged
PR #732 composition. Issue #741 owns the full outcome. The current Menu button is
an interim browser adaptation and remains until the native article replacement
has source-backed typography, discovery, illustration and rendered acceptance.

## Escape prerequisite

Original `d3dpoptb.exe` SHA-256:
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.

The 12-byte keymap record at `005d60c4` is
`019b00000009000170ee4f00`: Escape down, command `0x9b`, predicate `004fee70`.
The predicate reads world flags `0089c661` and returns true when bit `0x80000000`
is clear, not only on the tutorial. `process_cmd` (`004aab80`) case `0x9b` opens
Game Menu (`00458060`) unless Help is being closed. Earlier Query Escape record
`005d5ecc` is `01b9000000090001e0f04f00`; predicate `004ff0e0` tests mode `0x11`.
This establishes the ordinary Game Menu route and Help precedence, not every
native cancel predicate or browser input lifecycle.

`Home` now opens the existing original-styled pause Menu from neutral Escape on
all playing worlds. Existing non-tutorial targeting then selection cancellation
and tutorial Escape behavior are deliberately preserved browser compatibility,
not a new claim of exact native cancellation parity. Repeated/modified presses,
foreign input owners, terminal or replaced worlds do not gain a new Menu route.
A handled Escape is consumed once, avoiding an accidental second destination.

`tests/game-menu-escape.test.mjs` evaluates the actual Home effect and Menu
handlers with supplied event/scene boundaries. It is not rendered or native
execution evidence. No changes to saves or scene lifecycle are made by this
prerequisite.

## Remaining feature acceptance

- Query is button 1051, mode `0x11`, POINT13 (31 × 19, hotspot 0,0), not POINT14.
- Query arming is unpaused; next primary press intercepts commands and opens the
  contextual article. Query on Query opens 1051. Article close returns to Query;
  the next cancel returns to the earlier gameplay mode. F1 toggles the article.
- Native original frame/content/navigation/scroll regions, font/markup, discovery
  conditions and illustrations must be implemented and visually verified. Topic
  1051 has descriptor kind 255 and no illustration, not a replacement graphic.
- Keep browser-recovery Menu access, pause/scene identity ownership, F8 and cheats.

Do not describe this prerequisite as restored Help or complete UI parity.
