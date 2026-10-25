# Ready-only trigger correction: focused evidence

> Historical run artifacts referenced below are [retained at the pre-cleanup commit](https://github.com/JohnDeved/populous-new-dawn/tree/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/ci-ready-only-20261016), not in the current checkout. Source probes, fixtures, and findings remain tracked where applicable.

Implementation: `0c0a330fc5f7204b4c725f1e76d21e60c28e154b`.
Prior hosted candidate: `870d3012f6d7800414b3a06efa106e9518bd38ff`.

20 workflow-policy tests passed, including the exact complete event block, strict
boolean guard, candidate concurrency and shell failure propagation contracts.
ESLint and 135 orchestration structural checks passed. Diff whitespace is clean.
Every changed path is recognized by orchestration planning. Full tests/build and
live transitions were not run; root coordinates the revised hosted pilot.

The workflow was compared byte-for-byte with the prior candidate after replacing
only its event type list. Resource policy SHA-256 remains
`cd8670c7a9526fac77bf151cd3648248da7e1966123fb4656e4289d673a16540`.

Receipts retain source commit, command, status and complete output, with local
roots redacted by the review-bundle exporter. The manifest separately records
original and published receipt hashes and changed-source hashes. Receipt output
hash fields refer to original local bytes. Historical split-name evidence remains
under `evidence/ci-event-race-20261016`; its successful Full does not validate this
trigger correction. The settled eligibility failure and revised pilot are recorded
in `engineering/ci-event-race-pilot.md`.
