# Behavior replay for gameplay and parity work

Borrow the useful part of [rust-anything's record/diff approach](https://github.com/erkamyaman/rust-anything#how-it-works): freeze a small behavioral reference before editing, then compare the same cases at the normal entry point. Use the existing Populous fixtures and gates. No Rust port, plugin, second test runner, or new CI job is needed.

## One short evidence card per change

Put the card in the PR's **Behavior replay** section, or in the draft issue when another worker owns capture. Reuse existing receipts if their source and input fingerprints still match.

- **Oracle:** name the original executable/probe/export with its limits, or the exact New Dawn base when protecting current behavior. An observed browser baseline is not original-game parity. Pin the case input, mission or save format, tick/seed, and fixture revision as applicable. Keep raw captures out of the diff; follow the [worker handoff](worker-handoff.md).
- **Entry and cases:** start at the shipped control, campaign, or normal system caller. Keep the smallest useful corpus: one representative case, one boundary or rejection, and one neighboring control where it matters. Name supplied or intercepted state explicitly. If capture is nondeterministic, repeat the reference before treating it as expected; do not silently normalize differences.
- **Replay and diff:** compare the same inputs and ordered observations. Refactors should not change the recorded outcome. For a fix, write the intended difference before changing code, and leave a neighboring case unchanged. Report the first unexpected difference (case, tick or step, field, expected versus observed), or state that the checked cases agreed. Preserve the failing case before repairing; do not bless a new expected snapshot just to pass.
- **Limits:** report unrecorded or blocked cases and stop the affected claim there. CPU witness, original-game behavior, browser input/rendering, durable Save/Load, and hardware performance are different evidence. Keep the normal Ready/merge, visual, resource and deployment rules in the [engineering protocol](README.md).

For performance work, first profile the actual workload and choose the outer hot path rather than many tiny calls. Compare behavior before timing, and report paired measurements separately. A passing replay is not a speed claim.

## Worked pilot: Vault reapproach

Applied retrospectively to [PR #1260](https://github.com/JohnDeved/populous-new-dawn/pull/1260) and its [exact landed test](https://github.com/JohnDeved/populous-new-dawn/blob/c39c00a6a7ad8942ac2b3f545c7f4add5ed1e566/tests/live-native-vault-arrival.test.mjs):

| Card field | Result |
| --- | --- |
| Oracle | [Retained native export 0043c7a0](https://github.com/JohnDeved/populous-new-dawn/blob/c39c00a6a7ad8942ac2b3f545c7f4add5ed1e566/decomp/generated/0043c7a0.c) for the reapproach branch; exact test fixture for the New Dawn boundary values. |
| Entry and cases | Authored Mission 3; the live task reaches prayer. The test varies only the horizontal position within the same cell after that point. |
| Replay and diff | At +11, prayer stays active; at +12, the same order returns to approach. Removing just that fallback failed the +12 case (actual phase 2, expected phase 1). The landed test passed [the normal hosted gate](https://github.com/JohnDeved/populous-new-dawn/actions/runs/45845808769). |
| Limits | The displacement was supplied for the comparison. This proves neither that it arises naturally during play nor rendering, whole Vault parity, or native execution. |

Use the same pattern on the next behavior change before implementation instead of adding another broad verification run.
