# Independent review: vehicle passenger panel and voluntary unload

**Verdict: ACCEPT** for the bounded issue #184 prerequisite / PR #187.

- Reviewed candidate: `1a6ae6835f2491fd2287b910e421744964066d1c`
- Original review base: `0b0719f270649f688a07b791a8ff831ed0c91a46`
- Adopted main: `2a8211b`; its delta from the original base is Mission 3 research, checker and test tooling. There are no app/public/build-input changes in that main delta.
- Reviewed the complete feature diff, relevant callers, repository engineering protocol, generated-file ownership, native research/probes, supporting tests, rendered artifacts and subsequent repairs. The worktree was clean at final verification. This review changed no tracked source.

## Findings and repairs

1. **Resolved P2: passenger hover incorrectly looked selected.** The initial layout drew HFX53 for an unselected hovered passenger. Actual native `00504bc0` draws the palette154 background fill on hover; only the selected bit draws53. The repair preserves that distinction and the native palette130 pressed silhouette. Six scoped pressed masks retain the original silhouette alpha. Sixteen actual native own/foreign, selected/unselected and hovered/pressed comparisons now pass, with rendered pixel coverage.
2. **Resolved stale aggregate expectation.** A follower-task regression expected boarded people at the signed craft center. The native settled seat owner intentionally changes these positions. The repaired test independently pins authored craft `[1,-7084,12197,0]` and literal unsigned seat coordinates `[58412,12069]` / `[58412,12133]`. All route-owner, dormant-source, selection, deselection, order and nonmutation assertions remain.
3. **No remaining blocking source finding.** Reviewed ordinary world inspection, same-class panel retirement/coexistence, ownership-limited passenger controls, stale click revalidation, right-click no-camera behavior, selection asymmetry, voluntary versus destruction writes, native seat transforms and cell relocation, boarding publication, and impulse lifetime through landing. The quality cleanup preserves behavior while avoiding the unnecessary full person copy and deeply nested new branches.

## Exact-candidate evidence

All following receipts use the clean candidate above. Independently checked that each retained stdout/stderr file matches its receipt hash and that before/after source fingerprints match.

- `final-check-1a6ae68.json`: PASS, exit0. Typecheck, **955/955 tests**, parity check and orchestration check complete.
- `final-build-1a6ae68.json`: PASS, exit0. Existing chunk-size/tool-environment warnings are retained.
- `final-native-panel-1a6ae68.json`: PASS. 24 native layouts plus16 hover/pressed comparisons; captured input, predicate and anchor-height evidence retains its stated boundaries.
- `final-native-panel-selection-1a6ae68.json`: PASS,256 complete native selection-command comparisons.
- `final-native-exit-1a6ae68.json`: PASS,320 composed exit/readiness comparisons.
- `final-native-unload-1a6ae68.json`: PASS,96 complete command/order/impulse/RNG comparisons, including initially frozen passengers.
- `final-native-seats-1a6ae68.json`: PASS,84 settled slot/orientation/seam comparisons and16 native seating-to-ejection-to-first-physics compositions. The504 native captures include84 settled and420 countdown cases; countdown behavior is not credited as implemented.
- `final-portable-1a6ae68.json`: PASS,31 panel, runtime, cell, destruction, appearance and transport-idle tests.
- `final-format-1a6ae68.json`: PASS, Oxfmt check of all10 maintained TypeScript files changed by the feature.
- `final-icons-1a6ae68.json`: PASS, checked original HFX60/61 and palette130 source-alpha masks.

The original executable is SHA256 `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`. Native receipts retain external-input fingerprints and the probes disclose supplied leaves. This is executable comparison evidence, not a claim of complete native-world execution.

## Rendered evidence and correspondence

`candidate-render-resize.json` and `candidate-resize/receipt.json` pass at **`d18ff90d426b2b54a25fb02f8551b1d7ea13dfb6`**, using sandboxed Chrome154.0.8037.92 and verified ANGLE/SwiftShader. The source identity is deliberately not relabelled as the final candidate.

The actual authored Mission22 Boat/Balloon meshes are reached with ordinary pointer controls. Injected mixed-class crews retain authored populations. The completed scenario checks single/Shift selection, passenger inspection without camera movement, panel coexistence, stale speed/terrain click revalidation, unload right-click inactivity, occupied checkpoint reload, and airborne checkpoint reload followed by complete live ticks to living landings: **4 Boat turns and9 Balloon turns**, both passengers alive and detached. It also checks empty/repeated-state behavior, input-mask hiding and inactive-target panel disposal.

Nine canvas source-pixel comparisons have zero mismatches: both craft empty/occupied/hover/pressed plus DPR2. Both panels fit1280×720,1920×1080 and3440×1440, retaining actual vehicle hit assertions and verified drawing-buffer sizing. Inspected actual full-frame and panel-crop images, including Balloon occupied/checkpoint, hover/pressed, and DPR2 output. Genuine baseline images and source-bound baseline receipt exist under `../vehicle-panel-baseline-0b0719f/work/orchestration/vehicle-panel/baseline/` and show the missing panel on unmodified0b0719f.

**Carried rendered proof is justified.** `browser-correspondence-1a6ae68.json` identifies the exact delta: equivalent DOM class/branch construction, equivalent paint-key/alpha branching, and a plain-record selection projection retaining every consumed and mutated field. Assets, browser scenario/harness/config/browser-game and package inputs are unchanged. Reviewed every affected line, with final exact-candidate native/layout/portable regressions passing. No unresolved visual/input concern requires a redundant full browser replay.

## Quality status and limitations

- Scoped ESLint exits1 with the same pre-existing unused `Point` import in `scene-input-runtime.ts`; it is not described as a passing lint gate.
- Scoped Oxlint exits1 with112 diagnostics versus114 on the original baseline, and no added diagnostic in the normalized comparison. See `quality-correspondence-1a6ae68.json` and raw baseline/final reports.
- Fallow health/dupes execute with exit0 and retain advisory complexity/duplication findings. Fallow unused exits1 with advisory findings (including existing unresolved imports/cycles), not an execution/configuration failure. These reports were consulted; no blanket clean-code claim is made.
- Standard aggregate/build gates pass. Quality commands above are scoped to changed TypeScript where stated; full-repository lint cleanliness is not claimed.
- Initial rendered attempt `candidate-ddd0a52` stopped in an undefined building-debris model after wholesale population removal. The cause was not established by the simplified base replay. The supporting fixture now preserves authored populations; retain that failure separately rather than labelling it a proved base defect.
- `candidate-d72b3dd` failed after a frozen-RAF viewport change left a cleared WebGL buffer. The reviewed bounded correction waits for real backing dimensions and queued layout, then uses the normal renderer and unchanged exposed-vehicle hit assertion. Both unsuccessful attempts remain retained, separately from the passing run.
- Current boarding attaches immediately. Original slowTurn countdown interpolation and the short native passenger splash/bobbing controller remain unported and are not claimed. Native helpers, source-pixel composition, supporting crew fixtures and software-rendered browser QA do not establish natural crew acquisition, Windows full-frame parity or hardware performance.
- Inactive-target disposal in browser QA is a state fixture; the separate portable destruction regression covers the actual destruction owner. Broader movement/campaign acceptance, #5/#25/#60 and the held follower-transport-row work remain separate. No parity ledger, deployment, paid-resource or GitHub Actions change is accepted by this review.

## Source-art preservation

Independently compared the candidate atlas to0b0719f: all **1,744** prior rectangles and every pixel of the original1024×460 area are unchanged. The final atlas is1024×508, with only the scoped60/61 source sprites and six pressed masks appended. Original-area RGBA SHA256 remains `e85cc61adcfd042e70bf68aacadf6cfff473967f616f7a4d856cceef2e5bcf05`. The importer uses explicit two-phase append behavior and does not rerun the full HUD importer or repack existing content.

Accepted outcome: the bounded shipped vehicle passenger panel and voluntary unload prerequisite, with settled-seat ownership required for correct living landings. No outstanding blocking finding.
