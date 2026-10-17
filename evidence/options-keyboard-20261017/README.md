# Options keyboard ownership (#511)

Pause-menu Options used to redirect ArrowUp/ArrowDown/Home/End from option buttons
into category navigation. One guard in `OriginalPauseMenu.onKeyDown` now leaves
those keys with Options, matching the frontend policy. Root/confirmation navigation,
slider handling, Escape/Back and focus-return behavior remain intact.

## Accepted source and verification

- Dependency: #508 `41fffe3d8c11d818502d7342fc51bbfba4d73c19`.
- Production fix: `e4188e4a2621fd762adfed7cee19f78880bbefc3`.
- Fixed browser source: `bcab15a8f6bfaeaf6a62e3139de11390f083442a`.
- Accepted publication: `58907fdf08ec6aea525666463f5712a0c3df49f4`.

The focused regression failed before the fix; 33 tests passed after it across
keyboard ownership, pause ownership, original Options and artwork readiness.
Scoped ESLint/Oxfmt/Oxlint and structure checks passed. The browser exercised
48 combinations, 24 per skin: the baseline had 19 in-game focus jumps; the fixed
source had zero. Master/Music slider adjustment, native Tab non-interception,
Escape/Back focus return and Continue Game pause ownership also passed.

The first probe failed an incorrect assumption that native Tab stays within the
Options subsection. That failure remains preserved; subsection focus containment
is not claimed. Compatibility-subpanel Escape was source-reviewed, not a separate
browser assertion. The fixture uses actual Home/store/GameScene through plain
React/Vite and sandboxed Chrome, excluding hosted serving/hydration, hardware
performance and native parity. Software-WebGL, GPU-stall and Three warnings were
retained; this is not a quiet-console claim. Full suites remain hosted gates.

## Reusable probe and local outputs

`run-probe.mjs` runs `scripts/local-render/options-keyboard.mjs` on port 4399.
Set `POPULOUS_BROWSER` to official Chrome Headless Shell and
`POPULOUS_OPTIONS_KEYBOARD_OUTPUT` to a fresh ignored `work/orchestration/` folder.
Leave `POPULOUS_KEYBOARD_BASELINE` unset for the fixed-regression contract. Serialize
browser work and use the command-receipt wrapper when retaining local run results.

[Historical evidence and full acceptance notes](https://github.com/JohnDeved/populous-new-dawn/tree/58907fdf08ec6aea525666463f5712a0c3df49f4/evidence/options-keyboard-20261017)
remain available at the accepted commit. The 20 generated screenshots/reports/
receipts/manifest were untracked from the current tree without changing local
bytes. A hash-verified archive, original README/probe and removal inventory are
outside the checkout under `local-evidence/pr511-before-cleanup-20261017/`; raw
ignored runs remain local. Cleanup changes only generated-output tracking and this
summary. All accepted product/test/probe bytes and prior history remain unchanged;
no new runtime pass is implied. Shared ignore policy is owned by root's cleanup.
