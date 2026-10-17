# Intentional native-reference fixtures

These fixtures contain independent original-game reference facts, not outputs
regenerated from the implementation under test. Normal tests read only these
files; they do not parse historical command logs or require Git history.

## Version 1 schema

Each `*-native.json` below has `schemaVersion: 1`, an explicit `kind`, `provenance`,
and an ordered `cases` array. Provenance identifies the immutable source commit,
original path, compressed/file and decoded byte lengths and SHA-256, plus the
bounded claim. It is metadata, never a fixture expected value derived from the port.

- `mission3-raid-allocation-native.json`: five cases with exactly `name`, `rng`,
  `reads`, `allocated`, `occupiedUnchanged`, and `attributes`. Full task fields,
  attribute arrays, ordering, RNG, and reads are retained without normalization.
- `mission3-raid-recruitment-native.json`: three cases containing `id` and the
  complete `comparison`: selector, count, ordered IDs/ranks, flags3, task, and RNG.
  Loaded-cell tests reuse the authored-coordinate comparison, retain the deliberate
  missing-Shaman adjustment, and still exercise direct and checkpoint paths.
- `firewarrior-firing-phase-native.json`: sixteen cases containing `name`, the
  complete normalized `initialFields`, and sixty ordered `visits`. Every visit
  retains `complete`. Nonterminal visits additionally contain all twelve
  `activeFields` and the owned `activeBits` (`flags2 & 0x40000000`). Terminal
  residual state was never an owned assertion and is deliberately absent.
- `firewarrior-firing-phase-input.json`: the sixteen authored input records,
  decoded byte-for-byte from the original input fixture, not a run transcript.
  Its existing frozen SHA-256 and all scenario settings remain unchanged.

The firing test keeps initial-state equality, exact visit counts/completion,
paired launch attribution, and no-extra-projectile assertions. The immutable
`decomp/research/firewarrior-firing-phase/owned-projection.json` defines the same
claim boundary as before. Full raw observations remain in history, including
fields explicitly excluded from owned acceptance; their removal from the current
tree does not turn a partial comparison into whole-command parity.

## Reproduce the extraction audit

Run `node scripts/check-native-fixture-extraction.mjs` with the pinned source
commit available in Git, or pass `--archive-root PATH` containing its original
paths. The read-only command verifies hashes and exact projection equality; it
never executes native binaries or updates expected results. This is an explicit
developer audit, not a CI prerequisite. CI consumes only the small intentional
fixtures and validates their schema, case identity, and behavior assertions.

Historical source: [pre-cleanup tree](https://github.com/JohnDeved/populous-new-dawn/tree/bc9cabf404240ad99b2aab8c26e9b0137cdd7702).
The four consumed Mission 3 transcripts totaled 221,412 bytes; their exact expected
payloads are about 4 KB each before provenance. The firing native trace was
907,665 decoded bytes (15,086 gzip bytes); its readable owned projection is about
35 KB before provenance. Readable firing inputs retain 30,911 bytes instead of
1,081 gzip bytes. This deliberately trades compression for reviewability, not
for fewer assertions. Other unused logs/receipts in the two Mission 3 run groups
are also untracked; archived reports retain their original success/failure limits.
