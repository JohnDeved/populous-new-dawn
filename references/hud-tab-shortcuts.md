# HUD tab keyboard shortcuts

Refs #457 and #60. The archived [poptb.com controls guide](https://ts.popre.net/websites/poptb.com/guide/getting-started/controls/index.html),
General Purpose section, lists Insert for Buildings, Home for Spells and Page Up
for Followers. This is a community gameplay reference, not a retail-manual
citation, recovered native keyboard table or fresh original-game execution.

At base `1f76849ea332c1328553f13f4819d46f92f82ee7`, Home's keyboard owner has
none of these branches. Its existing tab buttons already choose the tab, clear
spell/building targeting and clear hover. The shortcut implementation uses those
same state changes. It preserves selection, orders, mana, RNG and pause, and
retains the existing B shortcut and current numbered follower-group ownership. This is a missing input producer,
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


## Current-main composition, 16 November 2026

The refreshed branch composes main `25e11812`, including numbered follower groups,
quick-camera/instant-overview keys and requested-message modal ownership. Preserve
main's current tab accessible names (Buildings retains B; Spells no longer advertises
obsolete numeric spell aliases). Tooltips and `aria-keyshortcuts` add only the three
new dedicated-key bindings. The extracted-owner tests use current actual message,
group and camera key parsers; explicit controls retain group and overview dispatch.
Historical rendered evidence keeps its original source pins, not this composition.

### Current hosted input supplement (prepared, not yet executed)

The existing pause-checkpoint-recovery lane invokes a 20-second bounded HUD-key
check after its actual Load checkpoint replacement assertions and before closing
that gameplay page. All earlier recovery checks and its independent high-DPI
empty-store case remain required, inside the unchanged 180-second outer budget.
There is no new context, workflow, browser flag or injected world. This checks
Insert/Home/PageUp, tooltips, preserved selection/scroll, spell-mode clearing,
held-key rejection, Shift rejection, root/Options suppression and return ownership.
Three screenshots cover the tabs on the existing 640×480 DPR1 loaded scene.
This is narrower than earlier historical display evidence: no current DPR2/wide
or Restart claim, and editable/loading exclusions retain extracted-effect tests
rather than new rendered proof. Contract tests verify wiring and bounds only;
they do not substitute for a fresh successful hosted browser receipt.
