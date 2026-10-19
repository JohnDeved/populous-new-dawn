# Optional research evidence projection

These commands extend existing context/evidence tooling. They are not a new task
ledger, native execution provider, evidence signer, cache or parity measurement.
Keep full diff review and source-bound raw receipts. The author supplies a finite
mapping; a reviewer judges its meaning. A hash proves byte identity, not truth.

## Hash-linked function navigation

A version-1 JSON packet contains:

- `identity`: `sourceFingerprint` (64 lowercase SHA-256 hex), exact `query`, and
  `adapterVersion`. Pass these independently from the current assignment. Do not
  obtain expected identity from an untrusted packet being verified.
- `sources`: nonempty entries `{id, path, sha256}`. Paths are root-relative regular
  files, using the portable bundle path guard; traversal, final-component symlinks,
  paths resolving outside the repository, sensitive paths and files larger than
  16 MiB are rejected. Intermediate directory symlinks resolving inside the
  repository are allowed. Same-path reads are batched; every
  declared hash is checked, including duplicate-path references.
- `dossiers`: entries with unique `id`, `facts`, `inferences`, `unknowns`, and any
  other question/status/source-location metadata. All metadata is retained.
- Each dossier's `raw` contains only `pseudocode` and/or `assembly`, and `rawSources`
  contains the exact corresponding pointers. A text pointer is
  `{sourceId, format: "text"}`. A JSON pointer is
  `{sourceId, format: "json", keys: ["00405b80", "instructions"]}`; keys select
  own properties, including explicit array index strings. The pointer must recover
  exactly the original raw value before omission is allowed.

From the repository root, with caller-known variables:

```sh
node scripts/orchestration/cli.mjs research-view \
  --packet work/orchestration/task/research.json \
  --source-fingerprint "$SOURCE_SHA" --query "$QUESTION" --adapter-version local-v1 \
  > work/orchestration/task/navigation.json
node scripts/orchestration/cli.mjs research-read \
  --packet work/orchestration/task/navigation.json \
  --source-fingerprint "$SOURCE_SHA" --query "$QUESTION" --adapter-version local-v1 \
  --dossier training --field assembly
```

The view preserves sources and pointers and adds an explicit omission warning.
The read command returns a JSON value; text is JSON-escaped. It verifies all
backing sources again. Missing or changed bytes fail closed; no export/provider
fallback is attempted. Keep the source packet and raw files with the evidence.
Never infer completeness from the compact payload or absence of direct calls.
Do not include executable images, credentials, private machine logs or secrets.

## Claim-specific bindings

A separate version-1 packet uses the same `identity` and `sources`, plus:

- `requiredClaims`: the nonempty IDs required for this handoff.
- `claims`: `{id, authority, dimensions, sourceIds, requiredClaims, maxAgeMs}`.
  Dimensions and source IDs are nonempty unique string lists. `requiredClaims`
  lists dependent proof obligations, including unresolved callbacks. Dependencies
  expand transitively; absent claims/results block acceptance. Declare them even
  when callback names already exist in a function inventory.
- `results`: `{claimId, authority, dimensions, identity, contractSha256, sourceIds,
  sourceSha256s, observedAtMs, status}`. `sourceSha256s` maps each referenced ID to
  its observed digest. Allowed statuses are `passed`, `failed`, `unknown`,
  `blocked`, and `not-run`. Times are integer Unix milliseconds.

`claimContractSha256(claim)` exported by `research-evidence.mjs` hashes the reviewed
contract's ID, authority, sorted dimensions/dependency IDs/source IDs and age
window. Record that digest with a real observation; do not retrofit old evidence
to a changed contract. Every required source must be covered by the result, and
all result source hashes must still match. A current packet source manifest alone
cannot make a stale result fresh.

```sh
node scripts/orchestration/cli.mjs research-claims \
  --packet work/orchestration/task/claims.json \
  --source-fingerprint "$SOURCE_SHA" --query "$QUESTION" --adapter-version local-v1
```

Evaluation uses current time and exits 1 for unaccepted required claims. Malformed
packets/identities or unavailable/tampered sources also exit 1. Latest attempts are
selected per claim before checking compatibility; an older pass never masks a
later failure or incompatible result. Every equal-time latest attempt must pass,
so unknown/failure ties cannot depend on array order. Stale and future dates fail.
The exported evaluator accepts an explicit clock only for reproducible tests.

A passing browser-observation result cannot cover a claim requiring native-policy
or matched-original-pixel dimensions it did not observe. This checker cannot detect
an author falsely labelling browser output as native evidence. Independent review
of raw sources and their boundaries remains mandatory. It does not update parity.

## Review and transport

Use existing source-bound command receipts to retain these commands' outputs and
include those receipts in an existing portable review bundle when needed. Raw
research sources are still needed separately when reviewing instruction semantics;
a compact view does not make them portable by itself. Preserve bundle size limits,
redaction and caller-supplied identity verification. Don't publish machine-specific
absolute paths, original-game executables or the experimental third-party package.

Validation lives in `tests/research-evidence.test.mjs`, included in the existing
orchestration check suite and `npm test`. It covers lossless retrieval, source
identity drift, tampering, missing backing files, path guards, exact query/version,
claim dimensions, callback proof obligations, freshness and latest failure ties.
No token, agent-time, correctness, native parity or gameplay improvement is claimed.

## Reviewed browser-reference record projection

`evaluateThemeReferenceRecord(repo, request)` from
`scripts/orchestration/theme-reference-evidence.mjs` derives and evaluates exactly
two historical-record claims in one call. `request` contains consumer-known
`mappingVersion: "theme-reference-record-v1"`, `sourceCommit`, `sourceFingerprint`,
and a `sources` manifest using `{id, path, sha256}`. Supply independent expected
identity; never derive trust from an incoming packet. Required source IDs are
`outer`, `inner`, `scenario`, `witness`, `harness`, and `observer`. The four producer
IDs correspond to the exact reviewed source paths and hashes pinned in the helper;
retain their raw files and the recorded Git commit locally. Missing Git objects,
changed producer bytes, unknown versions, receipt drift/errors, or inconsistent
save/load boundaries fail closed. No source is executed or fetched.

This mapping covers the historical theme-reference producer only: its
`captured-reference` outcome and recorded Mission 3 save/load digest equality.
It returns seven hash-linked facts, evaluation, original observation time, and
explicit absent obligations. It exports no claim/result packet and accepts no
manual authority/dimension overrides. The derivation time is an offline byte
inspection, not a new browser run. Browser reference success does not prove native
policy, matched original pixels, corrected resource selection, current-main
validation, hardware performance, or campaign victory. Hashes do not authenticate
a receipt. Independent producer/receipt review remains necessary; never route
edited output through the generic checker as if it carried authority. Tests use
synthetic receipts and read-only pinned producer fixtures; actual pilot receipts
remain separate evidence. No time/token savings or parity credit are claimed.
