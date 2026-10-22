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
is clear, not only on the tutorial. `process_cmd` (`004aab80`) case `0x9b` can open
Game Menu (`00458060`); its land-flags-clear path also tests panel 2 through
`00451370`, and may instead call `0045db60(0)`. Earlier Query Escape record
`005d5ecc` is `01b9000000090001e0f04f00`; predicate `004ff0e0` tests mode `0x11`.
This establishes the ordinary Game Menu route and Help precedence, not every
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

## Original Query artwork with interim Menu behavior

The existing literal button keeps its `Menu` accessible name and `openMenu`
action. Only the invented Arial question mark and CSS-outset frame are replaced
on the normal asset-success path. `QueryControlArt` is an inert child, not a new
input owner. It uses the descriptor at `005cb386`: 640-reference rect
`(64,114,13,12)`, HFX105 (4 × 6) centered at local `(4,3)`, and the three original
4 × 4 tile frames. The parent controls group begins at y112, hence CSS top2.

Row-major native tables at `005caba8` / `005cabd8` / `005cabc0` select normal /
hover / held frames. The edge and middle cells repeat rather than stretch their
pixels, following `004a1f50`. No persistent invented activation glow is added. Browser keyboard focus reuses
the original hover frame instead of drawing an invented outline; this accessible
focus mapping is an explicit browser adaptation.
The original chooses HFX106 at larger native width and scales its own HUD; this
browser's existing fixed-width HUD uses the explicit 640-reference artwork.
This is not a claim that the whole responsive HUD matches every native size.

`scripts/import-query-control.py` checks the exact EXE, palette and HFX hashes,
then reuses the reviewed data-only decoder in `import-original.py`. It creates
only 28 original PNGs and the addressed `query-control.json` evidence manifest.
It does not load the game, regenerate shared banks, copy unrelated research or
install dependencies. `--reuse-assets` hardlinks only PNGs whose bytes match a
fresh decode. Existing outputs must already match; `--check` never writes.

Every icon/frame image has an error probe. A failed image restores an explicit
exceptional recovery question mark while keeping Menu access. That fallback is
not native appearance and must never count as a passing artwork comparison.
`tests/query-control.test.mjs` checks the actual component, the literal page
button, all frame IDs and geometry, explicit failure, and PNG hashes/dimensions.
These checks do not replace screenshot or browser acceptance.

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

The larger inactive Help core is preserved separately on
`feat/native-query-help-20261022` at `ef9e2df11d7fe373bbc0e1c70fc296e61c215441`.
It is not included in this safe Menu/artwork prerequisite. Native rendering
research has resolved the original fonts, layout, discovery and HUD topic IDs;
real preview renderers, scene/input integration and rendered parity remain
unfinished. The full Query feature remains draft under issue #741.
