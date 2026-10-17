# Tutorial recommendation candidate: validation remains blocked

> Historical run artifacts referenced below are [retained at the pre-cleanup commit](https://github.com/JohnDeved/populous-new-dawn/tree/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/tutorial-recommendation-482), not in the current checkout. Source probes, fixtures, and findings remain tracked where applicable.

Refs #16 and #457. Product source commit `d5088d8fa5c75f1e17fce5b8397146a5074128c7`;
reviewed harness source `fd4c946814c58d488080f90872f4b55401402edf`. Later commit
`cc290d290cb66edd24216c0b24e99f80dcbf0e74` adds independent baseline pause evidence
only. All 1,486 recorded browser input hashes remained identical across that
publication. Source identity does not establish browser acceptance.

- Ten focused tests passed, covering recommendation identities, adapted layout,
  local storage/error behavior and production choice callbacks, plus existing Quit
  tests. Final product typecheck passed. Subsequent changes were harness/docs and
  reviewed resource inventory; the new browser scenario has not passed.
- Initial generic runner attempt, 11:08:25–11:08:30 UTC, crashed on initial
  `page.goto`, before scenario execution. Initial viewport was 1440×1000. Cleanup,
  unchanged source and dependency metadata were verified.
- First native-size attempt started 11:09:22 and was canceled on root coordination
  at 11:09:35, terminal exit130. The runner did not emit its final cleanup receipt.
  Supplemental checks found no visible owned runner/Chrome process or port5198
  listener. Their process-namespace limitation is retained. This is canceled,
  neither passed nor failed; its original running receipt is left unchanged.
- Cleared native retry, 11:14 UTC, used the proven initial640×480/DPR1 runner and
  crashed during initial navigation, before checks. Cleanup, unchanged source and
  dependency metadata were verified. Available /tmp space remained38,465,536bytes.
- Unchanged-main control, source `673b89ad4d53821a592b80ccc87cf6fc6048fc58`, used the
  successful pause fixture with the same native-size runner, shortened90s cap and
  main-menu-only scenario. It also crashed during initial navigation at11:16 UTC.
  Debug stderr shows Vite connected; no specific OOM cause was established.
  Browser cleanup exited normally and temporary-directory cleanup completed.

The control reproduces startup failure without Tutorial changes. It does not
identify the underlying cause or validate the candidate. No rendered screenshots,
focus/loading/persistence browser acceptance, full hosted check or deployment are
claimed. Keep this PR draft until browser validation can be completed.

The archive preserves all raw receipts, available logs, runner/scenario source,
fixture contract, source carry, interruption and cleanup records, and focused
check logs. The separate `pause-interactions-20261016` directory remains acceptance
of its explicitly identified baseline only.
