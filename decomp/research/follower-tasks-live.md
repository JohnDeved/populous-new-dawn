# Followers task rows: live integration

Implementation base: `12bdb1635126be60ed9d99fe29690b44622f2d50`, the accepted
`01bdd90` runtime plus the separately accepted `734309e` research packet.
The original [task-panel research](follower-task-panel.md) remains authoritative
for recovered descriptors and native boundaries.

## Bounded outcome

Restore the four task rows (24 controls): Selected, Idle, Housed and Busy, with
Total/Brave/Warrior/Firewarrior/Preacher/Spy columns. Occupied Boat/Balloon rows
remain a follow-on. This is not complete Followers-panel or issue #60 parity.
No parity ledger credit is requested.

The live path is `page.tsx` → `FollowerTasks` → `GameScene.chooseFollowers` →
`selectFollowerTask` / category-specific focus. The persistent selection strip
keeps its existing category-zero behavior and separate focus memory.

`hud-tasks.ts` ports the recovered classifier, native additive counts, task-nearest
selection/deselection and per-task focus. Native total counts and Shift-all exclude
the Shaman, while nearest single/Ctrl/focus can include it. Ctrl on Selected
reselects the nearest selected person and clears only its selection-work flag;
it does not deselect five. Task commands also propagate selection to the existing
occupied vehicle's passengers, even though transport-row controls are not added.

The count producer uses the raw camera/tribe position for the strict6144-unit
nearby radius. Selection/focus-nearest use the containing cell's center instead.
`check-native-follower-tasks.py` compares both at non-cell-aligned camera positions
and exact-radius boundaries. Initial focus applies nearby range to the Shaman;
later per-task cycling uses its native range exemption.

## Live controller boundary

HUD reads never allocate, register or attach a person, change orders, or consume
RNG. Native state/status, current command, vehicle and inside-building descriptor
own classification. The native inside-building mapping distinguishes huts
(Housed) from training/working buildings and towers (Busy).

Some shipped browser actions retain separate legacy task owners. Their narrow
read-only classifier projections use explicit native command identities:

- G guard flag → command30. `check-native-follower-task-adapters.py` executes
  key action0xc1 → tribe command0x82 → original producer00443b40, which requests
  command30 targeted at the Shaman. The browser's existing per-unit G toggle
  gameplay is unchanged and is not claimed equivalent to the original producer.
- Tree/harvest/delivery → command7. The retained original004340a0 keeps harvesting
  and its delivery tail in that command; cargo alone is not a task.
- BuilderTask activity → command6, including an active builder whose person still
  has commandStatus0.
- The exact live building's pre-entry journey → command8; an adopted native
  entry/dismantling person retains its actual command8/10 state.
- Independent legacy movement → command3. A native idle-approach route remains
  Idle and is not reclassified solely because it has waypoints.

Flight/fight and exceptional native controllers suspend these projections, as in
`world-turn.ts`. Dormant native Idle records do not conceal active legacy timber
work. State10/status0 remains category0 when no proved task owner applies.
Brand-new people without a controller likewise have no invented task category;
their first ordinary resting visit establishes Idle. Selection still uses the live
roster bit, and class existence follows the live registered-person lifecycle.

These projections provide task-category continuity; they do not claim complete
native legacy work/guard gameplay. Broader native command migration is separate.

## Artwork and compatibility

`scripts/import-follower-tasks.py` verifies the supplied executable and HFX/palette
hashes, checks all18 RGBA hashes against the accepted research packet, and imports
a separate tiny atlas. Existing HUD atlas coordinates and pixels are untouched.
The task frames use15×34 geometry. The native root background/frame is100×277.
`check-native-follower-task-art.py` compares imported root and frames to executed
native logical draw requests and each atlas region to original source RGBA.

Regular logical positions (columns0/16/32/48/64/80, rows210/251/292/333) deliberately
avoid the old constructor's one-pixel16.16 rounding. Artwork wider than15px is not
cropped by the control. Disabled class cells retain their opaque task silhouette,
blank zero digits, and separately85/255-alpha frame. The previously accepted
native ghost-alpha evidence applies to that frame family; no whole-button opacity
is used. Original Windows painter order/full UI input-loop equivalence remains
outside this bounded acceptance. Native reconstructions are not game screenshots.

## Verification

The retained pre-change browser run used real Mission1, the shipped Followers tab,
and unmodified runtime at12bdb16. It captured `followers-mission1.png` and failed
at0 task controls versus the expected24. It used the prior shared dependency-link
setup; this is functional failure evidence, not an isolation/performance claim.
Final browser and aggregate gates use an exclusively owned dependency tree.

Final commands, exact candidate identity, receipts and before/after evidence are
recorded in the completed review handoff. Portable/native checks, rendered browser
checks, and hardware-performance claims are separate. Software-rendered Linux
browser evidence cannot establish modern hardware FPS.
