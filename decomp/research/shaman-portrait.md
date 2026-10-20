# Shaman portrait selection and focus

Issue #60, based on `96becd8826afc5a4256a12ccebf3caa61729e24b`.
PR #647 deliberately left the Page portrait's `select` → `setSelection` plus
immediate camera focus unchanged. That replaced the current group, omitted
occupied companions and combined two different native actions.

## Original binding and contract

The original archive was recovered using `engineering/native-setup.md`, verified
as SHA-256 `6aa6c366809ea1d9575ec1d31a24527a95c7332f0a1d2ab692f7a602e7e10702`,
and only Component0 `d3dpoptb.exe` extracted. Its SHA-256 is
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
New inspection was **static data reading and objdump only**. No original program,
native checker/emulator, fixture recording or parity recording was run.

[Exact PE bytes](shaman-portrait/descriptor.json) bind the separate HFX664
portrait at logical (33,114), size 30×35 to left callback `004a0f00`, right
callback `004a1010`, model7, renderer `0049fe70`, refresh `004a1170`.
This confirms the actual portrait rather than inferring it from the class strip.
The callback excerpt was also checked with GNU objdump:

```
objdump -d -Mintel --start-address=0x4a0f00 --stop-address=0x4a1060 d3dpoptb.exe
```

The retained indexed Ghidra exports (pseudocode, not recovered source) establish:

- `004a0f00` → `00450f30`: ordinary and Ctrl left-click submit `0x7d` with
  model7. Shift, including Ctrl+Shift, submits `0x53`. Both left/right modifier
  keys are represented by the two native key slots. Alt does not participate.
  There is no camera call in this path and no preceding cancel-selection command.
- `0043e8e0`, case `0x7d`: the special model7 branch resolves the tribe Shaman,
  checks `004e3430(person,0)`, ORs selection bit7 and clears the selected-work
  bit. It **does not toggle an already selected Shaman**. It then marks the valid
  occupied craft's capacity-bounded other passengers via `004458d0`, before
  common HUD refresh and voice delivery. Other selected people remain selected.
- Case `0x53` adds all eligible model7 people and their occupied companions.
  It uses `004e3430(person,1)`, so its command-level availability includes bit
  `0x800` reservations while still excluding bit `0x80`; it uses the existing
  group voices including prior selection. These supplied command cases do not
  prove that every artificial reserved-Shaman roster can enable the portrait.
- `004a1010` → `004de810`: right-click focuses camera then opens the person
  panel, without issuing selection or movement commands. Ctrl has no effect;
  Shift permits reserved candidates. Repeated focus retains/cycles the remembered
  class identity. Initial Nearby focus uses the nearest-search range; an already
  remembered valid Shaman is range-exempt through `00451ac0`. This asymmetry is
  preserved, not replaced with unconditional direct focus.
- `004ecac0` clears/rebuilds the tribe's Shaman pointer from active class1,
  model7, non-`0x800` roster entries. `004a1170` disables an empty model7 control;
  `004a0f00` does not submit a command without that pointer. The model12 death
  presentation described in `shaman-death-support.md` is not a selectable class1
  Shaman. At an absent/reincarnation boundary there is no home-focus fallback or
  group replacement. Exact native death-frame/roster-update timing is not newly
  established here; current-port dead/removed/respawn cases are supporting tests.

Existing `tests/fixtures/hud-selection.json` and `check-native-hud-selection.py`
provide retained on-foot command/focus evidence, including supplied model7 cases;
`follower-strip-passenger-selection.md` binds the occupied traversal. They are
reused without regeneration or claiming a new native executable run.

## Live change and scope

The existing portrait now mounts `followerControl(7)` and is disabled when its
live Shaman is absent/dead. Disabled rendering has **separate frame and interior
layers**: `0049fe70` calls `004a1dd0`, which sets vertex flag8 from `control+8`.
`004a1f50` passes it through the tiled/corner frame consumers to `004f95a0`;
ordinary ghost state selects ARGB `55ffffff`, alpha **85/255**, as traced in
[follower frame alpha](follower-frame-alpha.md). `004a1dd0` clears flag8 before
`0049fe70` fills the interior through `00516890` → `00516a00`, whose ordinary
fill has alpha255. The frame tables are independent of this alpha state; their
exact PE bytes and initial alpha85 are retained in `descriptor.json`. At30×35,
each exposed frame pixel belongs to one piece; geometric overlaps lie inside
the later opaque fill. A separate geometry regression checks this distinction
against the recovered tables, so fading the imported composite once is equivalent
for the exposed frame (`scripts/import-hud.py`).

The frame is therefore a separate CSS `::before` layer, dimmed only when disabled.
The button and its existing canvas remain full-opacity; the canvas fills local
(2,2,25,30) with color172 and suppresses the sprite for absent/dead Shamans.
The actual runtime caller excludes hp0 even if its cached mesh remains. Enabled
hover artwork stays full-strength, and disabled hover keeps the normal frame.
The previous blanket full-strength-frame conclusion was incorrect and is
superseded by this consumer trace. `check-native-hud-portrait.py` sets `control+8=1`
even for a null Shaman and intercepts the frame consumers; its retained fixtures
prove interior/sprite facts, not disabled-frame alpha. Those fixtures are unchanged.
Page pointer/keyboard → GameScene → `chooseFollowers`
reuses the already shipped selectors, voices, tutorial flags, input gates and
passenger owner reads. Ctrl primary release still dispatches once, including
macOS context-menu delivery. The accessible name is now `Select shaman`, with a
separate accessible description and tooltip for right-click focus. Active browser
selectors use the new name; historical producer fixtures retain their original bytes.
H and F keyboard
shortcuts, Total/class/task/transport controls, sprites and panel design are unchanged.

The previous regression deliberately asserted the excluded old behavior. It is
replaced by `hud-shaman-portrait.test.mjs`, which executes the actual Page JSX,
control callback and GameScene method with supplied camera/panel leaves. Its first
run failed on the unmodified current base. It covers group/history preservation,
repetition, modifiers and keyboard, exact cues, unchanged orders/RNG/craft,
Boat/Balloon route-owned crews, enemy exclusion, absent/dead/reincarnating and
returning Shaman, gates, cancellation, right-focus ordering and Nearby asymmetry.
These fixtures are not natural crew acquisition or native death timing evidence.

`scripts/local-render/shaman-portrait.mjs` uses ordinary Mission1 startup, Pause,
Brave selection, the actual portrait, keyboard activation and right-click focus.
It retains before/after observations and actual screenshots at normal/compact
viewports. Rendered results are reported separately in the PR; the existence of
the scenario is not a pass. Supplied live → hp0 → absent → live fixtures follow
ordinary interactions. The pixel oracle compares the native frame asset at85/255
outside the interior, and independently requires opaque color172 inside it, over
black/sand at1×/2×, including hover and re-enabling. Enabled cases composite the
observed sprite foreground over the full-strength frame; they do not independently
prove sprite pixels. The oracle's own regressions reject both the old full-strength
frame and an incorrectly faded interior. These are not natural death episodes.
Camera-specific melee/corpse setup and the legacy
camera-focus checker now request right-focus explicitly; their assertions remain.
Other active scenario references receive only the accessible-name migration. Scenarios
that depended on implicit group replacement require their own explicit public
selection setup and fresh acceptance; no prior browser pass transfers to this head.

The original producer writes the shared tribe-command ring; the current port
executes the existing follower action synchronously. This patch introduces no
new queue, delayed double-click or selection/focus composite. Native shared-ring
contention/consumer timing remains outside this bounded correction, as in the
existing class controls. The relative gameplay operations and current-port public
input order are tested; full original command cadence is not claimed.
