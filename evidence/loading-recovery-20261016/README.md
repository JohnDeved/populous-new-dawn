# Loading identity and browser recovery evidence

> Historical run artifacts referenced below are [retained at the pre-cleanup commit](https://github.com/JohnDeved/populous-new-dawn/tree/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/loading-recovery-20261016), not in the current checkout. Source probes, fixtures, and findings remain tracked where applicable.

Issue [#457](https://github.com/JohnDeved/populous-new-dawn/issues/457),
PR [#468](https://github.com/JohnDeved/populous-new-dawn/pull/468).

## Source and disposition

- Canonical base: `4687490198313ccf0f55d85c1cbcbd680d720cea`.
- Full-inventory implementation: `42e9e2bc6b3300685fb3133aebe0e932bb5a9b7a`.
- Final application: `adb0f10a1142cb9135192da63af756b43dbc035e`.
- The only change between those candidates extracts one pure pending-phase string
  from a nested JSX ternary. The independent review verifies the exact whole-file
  substitution and all 18 startup/error/readiness combinations. Error precedence,
  render guard, key, callback identity and runtime ownership are unchanged.
- Independent review accepts the bounded presentation and repair. The full
  inventory remains an execution of `42e9e2bc`; it is carried forward only through
  this explicit equivalence. Final evidence publication changes documentation and
  artifacts only. [Tested source](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/loading-recovery-20261016/tested-source.json) records runtime tree IDs.

## Verified results

| Check | Source | Result |
|---|---|---|
| Exact tracked test inventory | `42e9e2bc` | 433 files, 44 selected batches, **2,789 passed**; no failed, cancelled, skipped or todo tests |
| Focused loading component/asset tests | `adb0f10a` | 4/4 passed |
| TypeScript, parity, orchestration | Both candidates | Passed |
| Changed maintained TypeScript formatting | `adb0f10a` | Passed |
| Actual Home rendered presentation | Both candidates | Bounded scenarios passed; retained failures below |
| Canonical Cloudflare Workers build | Both candidates | Exact-head remote checks succeeded; retained check lists |
| Native label reconstruction | `42e9e2bc` | Independent all-pixel equality, deterministic regeneration, corrupt-input rejection |

The standard `npm run check` constituents were executed separately and source-bound
because of the shared environment's limits. This is not a claim that one monolithic
`npm run check` command passed. The build evidence is the canonical remote Workers
check, not a successful local build receipt. Known local full Vinext/RSC SIGKILL and
remote-preview TLS limitations were not retried or bypassed.

### Inventory interruption

Executor transport disappeared during original batch 24. Its receipt remains
`unknown`/`prepared`, with its original partial output. The old process session was
then absent; no host-wide orphan visibility was available. Stable timestamps and
that uncertainty were recorded before a controlled distinct attempt. Batches 1–23
were reused; `inventory-24-recovery1.json` covers the same ten files; batches 25–44
then completed. The original unknown receipt is never counted as passed or erased.
The terminal inventory, recovery mapping, both immutable runners, raw logs and
independent coverage/hash audits are in the validation archive.

### Quality attribution

Global quality gates are **not green**. The independent audit establishes a
source-equivalent canonical baseline and compares semantic diagnostics, retaining
raw output and installed-lock/input identities:

- ESLint exits 1: 392 errors unchanged; warnings 8→9. Two deliberate intrinsic
  native PNG image warnings replace the old single mask warning, a net +1.
- Oxlint exits 1: all 1,434 baseline diagnostics match after the scalar repair,
  including 673 errors. The original candidate's two introduced nested-ternary
  warnings and its failed receipt remain retained; the repair removes both.
- Global format exits 1 solely for unchanged `app/viewport-bounds.ts`.
- Fallow health and duplication commands exit 0. Advisory clone and health output
  is retained; it is not a cleanliness claim.
- Fallow unused exits 1 with the same displayed summary: 99 files, 1 export,
  3 dev/optional dependencies, 294 unresolved imports, 1 unlisted dependency,
  20 circular dependencies. Human Fallow output is truncated, so the audit does
  not assert identity of undisplayed diagnostics.

## Browser evidence and limits

The local sandboxed Chrome Headless Shell 154 runs the **actual production Home,
GameScene, store, CSS and assets** in a plain React/Vite bootstrap. Production input
hashes are checked before and after. Only framework serving/hydration is excluded.
This is software-rendered browser evidence, not native full-frame parity or a
hardware performance measurement.

Source-bound injections are explicitly labeled: delayed delivery of the original
successful IndexedDB-open event, held/aborted actual landscape/waves requests, and
missing loading-art image requests. No successful scene, world or readiness state
is fabricated.

Verified episodes cover cold checkpoint lookup, held mission loading, native even
and odd viewport placement, viewport resize, DPR2, opaque coverage, missing mask and
label, keyboard/focus containment, technical details, short-height scrolling,
frozen time/RNG/input, repeated Enter/Space recovery and a fresh single-failure
retry reaching the real ready GameScene. The last successful activation is on
`42e9e2bc`. The new-head short episode rechecks restore → held load → failure →
ordinary Enter retry → second failure, without claiming new-head activation.

Retained failures are part of the result:

- Independent cumulative two-retry activation crashed Chrome. Separate repeated
  failure and fresh single-retry activation passed; the cumulative run stays failed.
- All three migrated broad loading wrappers were executed and **failed**. Art
  crashed at the first held-art wait. Small viewport detached the overlay and
  clicked Continue anyway, then timed out waiting for the battlefield to be visible.
  Screen/lifecycle timed out at its first readiness release.
- Later restart/Continue/checkpoint/stale-owner lifecycle branches were not reached
  and remain unverified in these runs. Two canvases are normal battlefield/tooltip
  composition, not a proved cause of the visibility timeout. No assertions or
  timeouts were weakened. A prepared optional diagnostic was not run.

See [browser review](independent-browser-review.md),
[broad-wrapper qualification](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/loading-recovery-20261016/broad-wrapper-qualification-42e9e2bc.json) and
[phase-repair review](phase-repair-review.md) for the exact bounded disposition.

## Native identity and browser adaptations

The unchanged imported 130×161 mask and new 82×20 Western loading label are tied to
original source data. The label measures 81×19; FE gray then FF white at (+1,+1)
produces the composite. Pending label X uses `trunc((W−81)/2)`, independently of
the mask; label Y is mask Y−26. The static software-renderer proof is bounded to
that selected path. No original executable was run.

Native clear uses current palette index 0, whose RGB varies. Opaque black is a
browser compatibility choice. Checkpoint lookup text and the responsive failure,
technical-details and retry controls are browser adaptations. They do not claim
original save-slot or failure-dialog parity.

## Portable artifacts

- `native-presentation.tar.gz`: source windows, hashes, importer and independent
  native reconstruction checks; no original executable/font bank.
- `actual-home-browser-42e9e2bc.tar.gz`: immutable six-episode before/after packet,
  exact capture runners, screenshots, receipts and original failures.
- `phase-repair-adb0f10a.tar.gz`: exact equivalence verifier, new-head short browser
  episode and its four screenshots.
- `validation-42e9e2bc-adb0f10a.tar.gz`: raw command receipts/logs, canonical test
  inventory, recovery mapping, manifests, check-selection rationale, baseline
  quality receipts and independent audits. Paths inside receipts are provenance;
  the archive retains corresponding files under `loading-validation/`.
- `SHA256SUMS`: published artifact identities.

## Comparable 640×480 captures

Before browser checkpoint lookup:

![Before checkpoint lookup](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/loading-recovery-20261016/before-restore-640x480.png)

Restored loading identity during actual held mission resources:

![Original loading identity](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/loading-recovery-20261016/loading-640x480.png)

Browser recovery with original identity:

![Adapted browser recovery](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/loading-recovery-20261016/error-640x480.png)

[Cold lookup](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/loading-recovery-20261016/restore-640x480.png), [odd 641×481](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/loading-recovery-20261016/loading-641x481.png),
[expanded recovery at 640×300](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/loading-recovery-20261016/error-expanded-640x300.png),
[before recovery](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/loading-recovery-20261016/before-error-640x480.png).
