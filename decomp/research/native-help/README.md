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
is clear, not only on the tutorial. `process_cmd` (`004aab80`) case `0x9b` can
enter Game Menu (`00458060`); its land-flags-clear path also checks panel 2 via
`00451370` and may call `0045db60(0)` instead. Earlier Query Escape record
`005d5ecc` is `01b9000000090001e0f04f00`; predicate `004ff0e0` tests mode `0x11`.
This establishes a non-tutorial Game Menu route and the earlier Query binding, not every
native cancel predicate or browser input lifecycle.

`Home` now opens the existing original-styled pause Menu from neutral Escape on
all playing worlds. Existing non-tutorial targeting then selection cancellation
and tutorial Escape behavior are deliberately preserved browser compatibility,
not a new claim of exact native cancellation parity. Repeated or Ctrl/Alt/Meta-modified presses,
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

## Staged Help core (not activated)

`app/help-session.ts` keeps independent Query/article return owners outside World
and therefore outside saves. Query never changes pause. Article close restores
the captured prior pause only for the current playing scene. Preserving the first
article entry owner across retargets is a deliberate browser lifecycle adaptation,
as is restoring prior pause rather than the original pause-toggle quirk.

`app/help-topic.ts` projects native object type/model/flags and HUD metadata through
`0045ed10`, tables `0059d7f4`/`0059d814`, and its scenery/terrain switch. Unsupported
valid objects and ordinary empty land retain the previous topic. Missing source
vehicle-definition flags are not guessed. Native model zero's overlapping table
words are deliberately not treated as valid fallback topics.

These modules and their focused tests are preparation for the real scene/HUD
integration, not a user-facing implementation or completed Help behavior.
