# HUD tab keyboard shortcuts

Refs #457 and #60. The archived [poptb.com controls guide](https://ts.popre.net/websites/poptb.com/guide/getting-started/controls/index.html),
General Purpose section, lists Insert for Buildings, Home for Spells and Page Up
for Followers. This is a community gameplay reference, not a retail-manual
citation, recovered native keyboard table or fresh original-game execution.

At base `1f76849ea332c1328553f13f4819d46f92f82ee7`, Home's keyboard owner has
none of these branches. Its existing tab buttons already choose the tab, clear
spell/building targeting and clear hover. The shortcut implementation uses those
same state changes. It preserves selection, orders, mana, RNG and pause, and
retains the existing B and numeric spell aliases. This is a missing input producer,
not a new panel design or a rewrite of the original HUD artwork.

## Browser input policy

The guide establishes the key-to-panel mapping, not all event semantics. The
browser adapter admits only an initial, unmodified dedicated navigation-key press.
It ignores OS repeats and keypad aliases to preserve the existing camera keypad
bindings. It also leaves consumed input, editable/link/modal controls, open game
menus or campaign details, world selection, loading, terminal or replaced worlds,
absent/replaced Scenes and masked gameplay with their existing owners. Pausing
alone does not disable tab selection, matching the existing tab buttons.

These are explicit compatibility and lifecycle policies, not claims about native
modifier precedence or exact native dispatch cadence. Tab tooltips and
aria-keyshortcuts expose the new bindings without changing existing accessible
names or tab artwork. L/Nearby, Shift+L/Stay Selected and other missing gameplay
shortcuts retain their separate acceptance; this change does not enable them.

## Verification scope

`tests/hud-tab-shortcuts.test.mjs` extracts and executes the actual Home keyboard
effect with supplied event, store and Scene ports. It covers all three mappings,
pause, targeting cancellation, rejection states, replacement, repeats, keypad
aliases and existing B behavior. The accessible-binding markup assertions are
source checks, not a rendered accessibility witness. Existing Escape tests remain
applicable to this shared keyboard owner.

Before integration, obtain the applicable source-bound planning, TypeScript
quality, standard check/build and independent review gates. Rendered public input
must verify all three tab transitions, tooltip/readability and no browser scrolling
at standard, wide and high-DPI sizes; cover cancel/reopen, public Save/Load or
Restart replacement and the adjacent Options/Menu flow. Compare original behavior
where an exact native claim is needed. Helper tests alone do not satisfy those
gates, complete #457/#60 or earn parity credit.
