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

## Original Query artwork, interim Menu behavior

The live button keeps its existing accessible name, description, primary callback
and browser-recovery role. Only the invented Arial glyph, outset border and
12×12 rectangle at(64,113) are replaced. The actual Home button now renders native
13×12 geometry at(64,114), HFX105 integer-centered at local(4,3), and the original
normal/hover/held frame tables. `004a1f50` repeats original4×4 edge/interior pixels;
no synthetic active-mode glow or disabled Help state is introduced.

This is the existing browser's uniform640-reference HUD adaptation. Native's
independent-axis scaling and HFX106 selection above800 native screen width are not
newly reproduced. The imported106 asset is retained for that future integration,
not misrepresented as a hover image. Failed frame/icon loads explicitly retain
minimal former recovery artwork, marked `data-query-art="failed"`; that exceptional
fallback is not native-art acceptance. The actual Menu semantics are unchanged.

## Exact English article preparation, not activation

- Body and `<b>` both use existing F00T4 pixels; title uses existing F00T3 at a
  native screen area≥307200, otherwise4. Links use original F00T10 when available,
  their run font when unavailable, and F00T11 when hovered, not CSS recoloring.
- `layoutHelpText` follows addressed00425400 English run/row wrapping. Tags reset
  the current run's break position; original whitespace/punctuation is retained.
  Row advance is max actual glyph height+4. Query's20px title makes body start38,
  and its192px-width article measures174px high. Source fixtures are static
  transcriptions, not original runtime screenshots.
- `helpPanelLayout` takes actual native logical viewport and HUD width. Three
  separate16px-tiled outer regions retain odd-tile gaps; navigation uses24×28
  boxes at contents-right−30, top+7+35*i. Home is984; contents stays983. Scroll
  arrows adjust thumb position, with proportional article-pixel offset.
- Discovery table0059be28 is88 predicate/argument pairs. Building gates use its
  availability mask; spells use knowledge or low-nibble stock, with special
  level-flag0x20 semantics. Failed links still activate and select1057. Contextual
  Query selection deliberately bypasses this link-only gate.
- Main native panel005cd0be is100×480 at640-reference. Spell HUD slots and tab
  use1055; building slots/tab1054; Followers tab/task cells1056; count/role strip
  1053; portrait/health1050; tribe flags1052; nearby toggle1049; minimap1047.
  Charge-rate control005cb3c8 has zero topic and therefore falls back1046, not1059.

The importer pins every original input before creating any new owned output,
refuses differing existing outputs, and has a read-only `--check`. It never runs
original code or regenerates the existing HUD/title/frame artwork. It retains
exact code/table spans in `source.json`; its addresses are static evidence, not
an executable parity harness. English text and descriptors are unmodified.

### Explicit blockers before replacing Menu with Help

1. Real scene/HUD interception, POINT13 input ownership, F1/two-stage cancellation,
   history and semantic article navigation are not integrated yet.
2. The staged text layout deliberately rejects inline `<i N>` rather than hiding
   unsupported content. The verified21-entry mapping needs its actual renderer.
3. Native preview kinds0/1/2/4/5/6 require real person, building, vehicle, spell-HUD,
   scenery and reincarnation render paths. Kinds3 and255 genuinely render nothing;
   blank Query1051 is not permission to omit other previews or substitute art.
4. Live discovery fields and all native control metadata need integration.
5. Actual rendered comparisons, scale/asset-failure/accessibility/input witnesses,
   focused/full checks and build must pass before any full Help claim.

Issue #741 remains open and any feature publication must remain draft while these
blocks remain. Do not claim restored Query behavior from the artwork correction.

## Draft safety and integration follow-through

The importer safety changes from reviewed narrow prerequisite `3ef0af579` are
ported here: suppress bytecode before importing, reject symlink/nonregular
outputs, enforce selected-root parent containment, and create missing outputs
exclusively. `tests/help-ui-import.test.mjs` covers these boundaries. This full
branch's port and inactive Help tests have not yet run; the narrow branch's121
observed passes must not be borrowed as full-feature acceptance.

Before rendering this full draft, compose the reviewed narrow Query artwork and
Menu prerequisite (including its recovery-focus fix and dedicated asset paths).
This historical draft fork still contains the earlier artwork staging; it is not
an alternative release candidate. Native preview renderer work should touch only
its isolated preview modules/tests until the parent composes the live branch.

Additional native history evidence: `0045d870` sets capacity `00749ecc` to64,
allocates256 bytes for `00749ec0`, and clears cursor/count. The `00425180` boundary
behavior can write at capacity after enough pushes; do not imitate native memory
corruption. Any safe browser history bound must be explicitly documented.

## Article surface and history staging

`help-history.ts`, `help-document.ts` and `HelpArticleSurface` are now staged, not
imported by `page.tsx`. The surface actually renders the three original tiled
panes and original bitmap glyphs, with preserved blank rows and exact run widths.
Links stay present when unavailable and activate1057; normal available glyphs
are font10, hovered/focused glyphs font11, unavailable glyphs retain their node
font. Keyboard link activation and visible focus via native hover art are explicit
browser accessibility adaptations. No backdrop, CSS typography or synthetic
illustration is supplied. Asset failure is reported to the eventual owner, which
must restore its prior input/pause state and original Menu access safely.

The surface requires separately verified preview and navigation/scroll nodes.
They are not supplied with fake defaults. Text preflight rejects unsupported
inline images or impossible panel dimensions before a future owner may pause.
A ready text document does not mean its preview or complete feature is ready.
History is scene-local, survives article close, retains duplicate visits and
truncates forward history on a branch. Its64-slot bound includes the current
entry, a documented browser memory-safety adaptation at the native overflow edge.
Different article text resets scrolling at0045dd22; explicit link/home/context
activation also resets it. No checkpoint schema or active gameplay handler has
changed. These new modules/tests have not run and have no rendered acceptance.

`createHelpInputOwner` now stages real event ownership around the transient
session. Its identity requires BOTH the same current World and the same current
Scene, including scene.world equality. The caller must supply current higher
owners, foreign/F8/cheat exceptions, source context, renderer preflight, the real
store transaction and gameplay gesture release. No live fields are fabricated.
Context opens on primary down, and that press's up/compatibility click is consumed
rather than reaching the existing HUD callback. Right-down does not cancel;
right-up cancellation takes an explicit proven-region predicate because native
HUD dispatch can precede the keymap. F1 toggles an article and Escape restores
article then Query then ordinary gameplay. Neutral Escape is deliberately not
owned, preserving the Menu prerequisite. Browser recovery releases this owner
before invoking the existing recovery callback. Another modal must acquire its
pause/input ownership only AFTER Help release; this ordering is a live integration
acceptance requirement, not proven by these isolated source tests.

The owner is NOT installed into window/page/scene listeners, and POINT13 has not
been connected to live cursor precedence. Live collector/discovery/counters,
actual full preview support and rendered/input evidence are still blockers. In
particular native hover-frame counter00897981 is distinct from illustration
counter0089d184; neither receives an invented local timer.

## Inline article artwork checkpoint (inactive, October 22)

The earlier inline-image blocker is now addressed in source, not yet validated in
execution. All 21 original `<i N>` slots resolve through `0059bdc0`, including the
intentional duplicate sprite 1609. `layoutHelpText` preserves image replacement of
its current run, image-height row expansion, and the native image-overflow width
reset; the article surface draws the exact PNG at the row top. Linked images are
still explicitly blocked because their palette-outline path is not implemented;
none occur in the retained English topic text. A new focused test covers all 88
texts and the native overflow quirk. These tests have not yet run.

The reviewed, data-only `import-help-article-art.py` created 47 unique PNGs and one
manifest in a fresh owned directory. Input EXE/palette/HFX hashes, all output
hashes, exact helper hashes, and exclusive creation are retained in the import
receipt; no native executable ran and no shared bank was regenerated. A separate
RGBA comparison establishes that all 27 navigation-frame tiles already exist in
`hud-button.png`, `hud-button-selected.png` (hover), and `hud-button-hover.png`
(pressed). Runtime navigation will reuse those three atlases, not issue 27 new
image requests. The dedicated decoded files remain provenance/reference data.

Source references: `00425680–0042579a`, `00426526–0042653c`, `0059bdc0`, and the
addressed native-help-navigation evidence packet for `004a2560` / `004a1f50`.
The new images are article decorations and navigation frames, not a replacement
for the still-incomplete 3D object/spell preview renderer. Live input/cursor,
actual discovery data, native counter cadence, lifecycle composition, tests and
browser comparison remain activation blockers. No new Help module is imported by
`page.tsx`; the safe Menu adaptation remains in force.
