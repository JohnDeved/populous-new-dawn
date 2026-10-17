# Options keyboard ownership

Confirmed player-facing defect: pause-menu Options redirected ArrowUp/ArrowDown/
Home/End from option buttons into category navigation. Main-menu Options leaves
those keys with its controls. The parent pause dialog enumerated only `nav button`,
so the active Rotation/Flip Rotation/Back/Browser compatibility button was absent
from its list. Direct3D was in that list but still inherited the unrelated navigation.

This branch depends on accepted #508 head
`41fffe3d8c11d818502d7342fc51bbfba4d73c19`. It is separate from the frozen
#507/#508/#509 integration batch. #508's font/slider readiness code is byte-unchanged.
Only production delta: one guard in `OriginalPauseMenu.onKeyDown` leaves Options
keyboard ownership with that panel, matching the main-menu policy. Root and
confirmation menu navigation, slider/native controls, Escape/back handlers and
focus-return effects remain intact.

## Reproduction and limits

[Baseline browser receipt](receipts/baseline-2.json) at
`8e6a31ecfb566bd08b83a67f1a150e9fe4a820a1` passed its defect-observation contract:
48 combinations, 24 per skin. All 24 main-menu cases retained focus; 19 in-game
cases jumped to Game/Sound/Graphics. Rotation, Flip Rotation, Back and Browser
compatibility jumped on all four keys; Direct3D jumped on three. Back to Options
stayed focused in both skins because the category nav is absent on that panel.
The [complete observations](baseline-2/keyboard.json) retain before/after focus.

The actual Home uses public Main menu Options, New Game, Start Mission 1, Skip
introduction, Game settings and Options. Both entries verified Master/Music slider
Home/End/Up/Down adjustment without focus loss; native Tab was not prevented;
Escape and Back returned focus to the Options entry; Continue Game restored normal
pause ownership. No model/scene/clock/readiness substitution or state injection.
The in-game keyboard jumps are the demonstrated bug, not an original-game parity
claim. This is browser control ownership consistency with the already-live frontend.

The initial attempt `92be6d78` failed before reaching in-game Options on an unrelated
assertion that Tab must remain within the Options subsection. The actual native
Tab transition did not satisfy that assumption. Its receipt and observations are
retained. The second probe records native Tab focus and asserts the menu does not
prevent its default, without adding a new focus trap or claiming subsection
containment. No product code changed between these attempts.

Both browser attempts used sandboxed Chrome Headless Shell 153.0.8010.12 with a
new owned profile, actual Home/CSS/assets through plain React/Vite, port 4399.
Awaited cleanup closed context/browser/server and removed the owned profile.
Heavy slot released. No current browser/server/build is running. Vinext/Cloudflare/
RSC serving and hydration, native pixel parity and hardware performance are excluded.
The retained PNGs document each entry's Back focus/layout; they are not before/after
fix comparisons. Three.js missing-image warnings remain in stderr.

## Fix and focused verification

Candidate fix: `e4188e4a2621fd762adfed7cee19f78880bbefc3`.
The new test evaluates the real pause dialog handler: Options delegates the four
keys, root/confirmation navigation retains its enabled-row behavior, native slider
keys and Tab remain unintercepted, and Escape reaches dialog cancel/back.
Synthetic DOM/focus objects isolate handler policy; browser propagation and focus
must be confirmed separately.

- Before the fix, new focused regression: 3 pass, 1 expected failure at `08c5e406`.
- After the one-line fix: 33/33 cases passed across the exact existing files
  `options-keyboard-ownership`, `pause-menu-ownership`, `original-options`, and
  `options-art-readiness` under `tests/*.test.mjs`.
- Scoped ESLint, Oxfmt, Oxlint and repository structure checks passed at the fix.
  No warnings were emitted by the scoped ESLint/Oxlint runs.
- No full local check/build or Fallow run. No new helper/dependency or deletion;
  broad unused/duplicate analysis adds no coverage to this single condition.
- Resource policy is unchanged. Planner retains unmapped new probe/evidence paths
  and conservative full verification; focused checks do not replace hosted gates.

**Fixed browser episode passed** at clean source
`bcab15a8f6bfaeaf6a62e3139de11390f083442a`, using the same scenario as the completed
baseline with `POPULOUS_KEYBOARD_BASELINE` unset. All 24 in-game and all 24 frontend
cases retained focus: zero jumps, compared with 19 in-game jumps before the fix.
[Final receipt](receipts/fixed-1.json) and [all observations](fixed-1/keyboard.json)
retain the source identity and exact cases. Both Master/Music sliders passed
Home/End/Up/Down adjustment, native Tab was not intercepted, Escape and Back
returned focus to Options, and Continue Game restored unpaused play. No page errors.
Expected Three.js missing-image console warnings remain, not a silent-console claim.

The fixed browser source is the documentation child of the focused-tested fix;
application and scenario bytes are identical to their focused-tested source.
This publication adds only the final evidence and wording. Original failed probe
and pre-fix regression receipts are preserved, and all prior published manifest
hashes were checked before adding the final artifacts. Awaited cleanup closed the
owned browser/context/server on 4399 and removed its temporary profile. Shared Mac
slot released. Parent independent review, hosted full gate, integration, readiness
and merge remain separate; no effect or readiness transition was performed.

```sh
POPULOUS_BROWSER=/path/to/official/chrome-headless-shell \
POPULOUS_OPTIONS_KEYBOARD_OUTPUT=work/orchestration/options-keyboard/fixed-1 \
node scripts/orchestration/command-receipt.mjs \
  --output work/orchestration/options-keyboard/fixed-1.json \
  --input node_modules/.package-lock.json \
  -- node evidence/options-keyboard-20261017/run-probe.mjs
```

Use a fresh output and the shared browser slot. Weekly usage was 17%, below the
70% stop threshold. Manifest binds original and portable receipt hashes; absolute
repository, browser-cache, Node and temporary paths are redacted. Product sources
were rehashed after each browser run and stayed unchanged. Publication is an
evidence-only child of the focused-tested fix.
