# Guarded integration writer — review repair evidence

Tested code: `9cbb3125eafc2e4e084ad02d7cc03684acd18464`.
Branch source base: `cf38a755a3a00255184c63c175a00076cff6b025`.
This supersedes the earlier read-only foundation's scope; the earlier receipts
remain historical evidence. The source manifest binds nine exact maintained inputs.

| Check | Result | Receipt |
| --- | --- | --- |
| Queue plus existing runner tests | Passed, 46 tests, zero failed/skipped | [focused.json](focused.json) |
| Targeted ESLint | Passed | [lint.json](lint.json) |
| Targeted Oxfmt | Passed | [format.json](format.json) |
| Repository structural validation | Passed | [structural.json](structural.json) |
| Diff whitespace | Passed | [diff.json](diff.json) |
| Full plan, not execution | 450 files, serial fallback: production-config-runtime-drift | [resource-preflight.json](resource-preflight.json) |
| Exact-merge Cloudflare observation | Read-only provider check observed | [cloudflare-observation.json](cloudflare-observation.json) |

The 34 queue cases include fixed GH argument arrays for `expected_head_sha`
refresh, ready, and `sha`-guarded merge; zero dry-run transport writes; exact-plan,
review, driver, journal and expiry guards; intent persisted before transport;
interrupted/uncertain merge reconciliation without resubmission; and a complete
fake refresh→drain→ready→terminal checks→merge sequence across serialized restarts.
The other 12 tests are the unchanged runner suite. Its deliberate failing child
fixture tests failure propagation; the outer terminal result is 46/46 passed.

All four independent-review findings have focused regressions:

- Non-required draft admission is excluded only with pinned Full workflow content,
  Actions provenance, `IS_DRAFT: true`, failed readiness and skipped mandatory
  validation stages. Failed ready validation still blocks. #502's inspected head
  `870d3012f6d7800414b3a06efa106e9518bd38ff` leaves Tutorial browser unchanged;
  the driver does not exclude its failed jobs.
- An older run 99 attempt 2 failed at 19:00 blocks run 100 green at 18:00.
  Actual attempt/job chronology must agree with the current named Actions check;
  missing timestamps, ties or disagreement stop.
- A configured clean-filter witness is rejected before resource preflight/status
  can execute it. Central Git initialization reads configuration first.
- A short page whose total_count promises more, changed counts and duplicated
  page entries stop. Fixture/live checkpoints are mode-bound, journal-bound and
  cannot be mixed; symlink checkpoints are rejected.

The actual writer is implemented behind `--apply` plus independently reviewed
exact plan/pilot hashes. Each pilot authorizes one action for at most one hour,
with a clean exact driver commit and fixed repository. Intent and pilot
consumption are fsynced before GH submission. An uncertain response consumes the
pilot and retains pending intent. The root must authorize a bounded live pilot
following independent review; no real adapter mutation or pilot was executed here.
No credentials, scopes, repository protection or workflows changed.

Read-only provider evidence is bound to merge
`be840400c5c86da43ac49bcbcba38f292cbc02e8`, Cloudflare app 85455, check
`117148928608`, name `Workers Builds: populous-new-dawn`, and this project's
production build `f6177da5-6c55-4ab0-b51c-216ed4817756`. The observed check passed.
This validates the narrow observer against an existing real response; it is not
an integration pilot or evidence that #503 is deployed. Output distinguishes
`merge: confirmed`, `deployment: provider-production-build-check-passed`, and
`servingDeployment: unverified`. Preview, wrong app/project/commit, older success
superseded by a later failure, and ambiguous chronology cannot pass.

Node 24.18.0 / macOS arm64. Resource approval on a real CI-matched Linux install
remains unverified; no policy hashes or classifications changed. Full check/build
remain for the ready PR after independent review. No full local suite, browser,
production build, original executable or nested worker ran. The brief environment
disconnect did not lose state or block execution; the original command's completion
was checked before proceeding.

Original receipts/logs remain in `work/orchestration/integration-queue-writer/`.
Published copies replace only local checkout/temp prefixes. The artifact index
records original and published SHA-256 digests separately. Embedded original log
hashes remain unchanged. Earlier foundation and development receipts remain intact.
See [driver contract](../../scripts/integration-queue/README.md) for pilot schema,
exact command semantics, unavoidable ready/base-CAS limits and recovery rules.
