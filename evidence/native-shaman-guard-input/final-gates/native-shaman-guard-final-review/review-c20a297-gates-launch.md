# PR220 final package and launcher review

**ACCEPT exact c20a297 final source/check package and revision3 launcher preflight.**
Ordinary Mission10 rendered acceptance remains pending; this is not final gameplay
or merge acceptance. No gate rerun is needed on these unchanged inputs.

Candidate `c20a297f5f815ce404f796b08f77ea56396f96da`, tree
`9af7241660efc11eb8969845ab7e587231d906bc`; baseline
`3b899125cc8cedef938823718ad5d44f49957b66`. Both worktrees were clean.
All19 changed source hashes match the accepted manifest. The earlier substantive
[source/focused review](../native-shaman-guard-review-ddd0904/review-c20a297.md)
and [revision3 preflight](../native-guard-browser-preflight-review/review-revision-03.md)
remain applicable and unchanged.

## Final gates

All11 final command receipts have stable clean candidate HEAD before/after; their
raw stdout/stderr bytes, embedded text and hashes agree. Build CR characters were
compared as raw bytes, without newline normalization.

- Fullcheck **PASS**,1238/1238, zero failed/skipped/cancelled; typecheck, parity
  consistency and130 orchestration structural checks pass. Receipt SHA256
  `3964ed4c0c75151cd8bd40e5dea83f2b4da54341df85d7ba5c3ef343cce6aad0`.
- Production build **PASS**, exit0. Receipt SHA256
  `d0d8d83f3cd072fdf5087caef7ca8e33e927cb2f718814d60ceb9cf4d3f21227`.
- All8 changed runtime paths pass scoped formatting. Global formatting still fails
  on unchanged `render-view.ts` and `viewport-bounds.ts`.
- ESLint retains a failed status; output SHA256
  `105bef648bf59ba70b4115168cb02a8c9470e33c3a65aede64f84ac778e9c245`
  equals fixed-base output byte-for-byte. Independently normalized Oxlint line/
  column locations produce394 baseline and394 candidate findings with no added
  or removed diagnostic messages. These tools are not reported as clean passes.
- Fallow advisories remain visible: health1903/18629,13137 duplicated lines(9.5%),
  unused7files/3dependencies/38imports/1unlisted dependency/20cycles. README makes
  Fallow advisory; no baseline-equality claim is made for these whole-repo counts.

The baseline Oxlint wrapper itself fingerprints the candidate checkout; its command
explicitly enters the dedicated baseline, independently verified clean at the fixed
base. Baseline ESLint reads the exact base Git blob. Current root/installed locks
match the quality comparison and launcher. Fullcheck/build receipts bind source but
do not themselves contain explicit dependency-input hashes; do not imply otherwise.

## Planner disposition

The source-bound112-check plan matches all19 changed paths. The existing tests
selected by24 portable entries and2 metadata entries are covered by fullcheck;
production-build is covered by the build receipt. `clock-portable` is **blocked as
written**: it names nonexistent `tests/unit-interpolation.test.mjs`, also absent at
the accepted base. Actual `game-clock.test.mjs` and `unit-motion.test.mjs` (which
imports the native interpolation fixture) passed in fullcheck. This pre-existing
planner defect is a separate follow-up, not an executed command or a PR220 repair.

Broad routing also selects49 native,33 browser and2 static entries. Their full
commands were not executed. Unchanged native routines and authored assets need no
blanket revalidation for this bounded Guard slice. Accepted native lifecycle,
producer/key/distance/payload/supersession evidence and maintained vector tests
cover the changed native boundary. The paired ordinary Mission10 scenario is the
required pending rendered integration. No unrelated mission/transport/construction,
fresh campaign, pixel-equivalence or hardware-performance claim is accepted.

The3 unknown paths have explicit review: `world-tasks.ts` supersession cleanup has
failure-first and subsequent-controller evidence; the research note has manually
reviewed evidence limits; generated native fixture hashes/b-only normalization and
read-only extraction correspondence are accepted. Each planner ID/status and all
receipt hashes are recorded in [verification-c20a297.json](verification-c20a297.json),
SHA256 `adc3262d84d286fad6cf2b69085d1d7e865762029ed7fe7b7dd4d5870f5ad007`.

## Launcher binding

[launch-plan-rev3.json](../native-guard-browser-execution/launch-plan-rev3.json)
SHA256 `b17eab90f45c263f76f153426ceb8934dd5a52373c3be4c927675000039d6916`
correctly runs dedicated baseline4392 before candidate4393. Both use the same
accepted scenario `1889980c…`, preparation receipt `90624ba4…`, fresh ephemeral
1440×1000 context,300000ms harness envelope and330s outer timeout on CPU0–3.
No profile or unsafe browser flags are supplied. Exact browser, root locks,
preflight review and every preparation input hash were independently verified.
Both maintained harnesses have SHA256
`af11148b0c896a255bc1a8f431b7054e6e3dee928b3c1217115a5c9b027d390c`.
Output paths were fresh at review.

Parent grants the serialized lane. The owner still must verify ports/dependencies
in the actual launch namespace, await each original session and prove cleanup before
moving resources or launching candidate. Any failed input/sample/deadline ends the
attempt under the unchanged plan. Actual paired logs, training provenance, identity
and Save/Load evidence, screenshots and runtime source bindings require later review.
This review performed no browser, server, dependency, profile or production operation.
