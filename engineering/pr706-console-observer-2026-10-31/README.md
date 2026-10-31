# PR706 external console-observer checkpoint

Preservation only: this evidence branch is **not for merging into main**. It keeps
the exact reviewed external integration adapter/support test for PR #706. It does
not install or register the adapter, alter application behavior, change PR #706's
head, or authorize a browser run. No PR is requested for this branch.

## Source and result

The existing v4 adapter closes the harness's initial context, then creates four
fresh case contexts. Harness console observers therefore do not cover those case
pages. The preserved R2 candidate observes pages owned by each fresh context and
records console errors/warnings without changing the public-input sequence, four
cases, 80 checks, 20 captures, snapshots, deadlines, launch settings or cleanup.
Errors fail the existing terminal assertion; warnings remain nonfatal. Existing
save points persist diagnostics, with no additional synchronous write points.

One independently reviewed, source-bound supplied-control pair completed:

- Original v4 adapter with the same proposed test: **21 total, 16 passed and five
  intended assertion failures**, actual Node exit 1. These remain failed tests.
- Exact R2 candidate: **21/21 passed**, no failed/cancelled/skipped/todo, exit 0.
- Actual guard exit 0; each owned process group finished with no signals or
  survivors and empty TMPDIR. Source/runtime identities were unchanged.
- Independent review accepted **preservation of this exact external candidate**,
  not actual browser or combined acceptance. The fixture uses supplied browser,
  DOM/geometry/state/helper objects and fake screenshot bytes.

`source/` contains the five exact candidate/imported-source files. `CHANGESET.patch`
records the two-file change against historical v4. `source-identities.json` keeps
current source context separate from historical `0581184b` lineage and original
source hashes; historical test/browser evidence is not rebound to this checkpoint.
The actual fixture ran before this preservation commit; exact byte identities,
not a rerun or a new commit SHA, bind its result to these files.

## Raw evidence retained separately

Raw logs, resource samples, guards, R1/R2 packets and independent review are kept
outside development commits, in the private 71-member packet:
`pr706-console-observer-20261031-private-evidence.zip` (154,919 bytes), SHA256
`07c6035a2de651624aa69c875c387dae8f0cdfd299d126b99cc5b697cb14b186`.
This identity describes the locally verified packet, not a claimed Library upload.
Original execution paths/pins and all earlier failures remain unchanged.

## Limits and remaining gates

The observer sees secondary-page events after its page notification; it does not
promise the earliest events before notification. Console volume is uncapped, and
hard termination before an existing save can lose queued diagnostics. Fixture
sampling/RLIMITs are not an end-to-end hard bound or immutable-host sandbox.

The original 120,000 ms combined failure, current sandbox/resource admission,
actual combined interactions, comparable/ordered screenshots and independent
visual publication, Swamp/disabled-portrait/current-base obligations, and current
standard/Full gates remain open. This change is not a timeout fix, performance
improvement, browser pass, Ready transition, gameplay parity or deployment.
PR #706 remains Draft. Relocated execution requires fresh reviewed admission;
none is supplied by this preservation branch.
