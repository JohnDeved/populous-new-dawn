# Accepted native G producer and caller extension

This separate evidence addition preserves the independently accepted finite
producer/caller probes and source-only controller map. The earlier 21-file
[lifecycle/distance packet](../README.md), including its manifest, remains
byte-for-byte unchanged from
[`6cbae1169517a295a323ce8dcbf67a29ce61d02d`](https://github.com/JohnDeved/populous-new-dawn/commit/6cbae1169517a295a323ce8dcbf67a29ce61d02d).
Its historical statement that extensions were pending describes that baseline
publication. This extension has now received its own acceptance.

- [Frozen independent review](native-guard-lifecycle-review-20261005/extension-review.md)
- [Producer findings and source-only controller map](native-guard-lifecycle-20261005/producer-findings.md)
- [Producer receipt](native-guard-lifecycle-20261005/producer-receipt.json) and
  [caller receipt](native-guard-lifecycle-20261005/key-mode-receipt.json)
- [Producer result](native-guard-lifecycle-20261005/producer-attempt-01.json) and
  [independent replay](native-guard-lifecycle-review-20261005/producer-replay.json)
- [Caller result](native-guard-lifecycle-20261005/key-mode-result.json) and
  [independent replay](native-guard-lifecycle-review-20261005/key-mode-replay.json)
- [Extension manifest](manifest.json)

Review SHA256:
`bf66f503726eb744333ce3f2365da15c7a4aef52003fb3ac0fd20c168045e14b`.
Findings SHA256:
`0e67b49df68f3211ccedd147afed12be32cee3a9b6aa5114062f052da2abeabe`.
Every retained source artifact is copied exactly; no frozen script, result,
receipt, findings, or review text is edited for publication.

## Accepted scope and remaining limits

Producer coverage is 20 cases / 43 stages: shared command30 references,
replacement/cancellation, pool exhaustion and later allocation retry, raw roster
predicates, passenger selection ordering, absent/stale targets, and target
identity. The caller probe covers two selection modes through native global
initialization, mode helper, action0xc1, and tribe-command0x82 dispatch. Both
independent replays are byte-identical to their author results.

Fixtures still supply roster/world state and the baseline destination/UI/voice
leaves. The caller additionally supplies palette/globe/auxiliary initialization
and outgoing emission; copying the emitted argument into a packet is an explicit
boundary. Original input polling, packet scheduling, natural motion, stopped
Guard, continuous phase, and browser gameplay are not proved. The controller map
is independently inspected source evidence, not an executed controller handoff.
Pool-exhaustion compatibility, controller cleanup/ownership, legacy saves, and
ordinary Mission 10 acquisition/UI observations remain implementation decisions
or acceptance work. This publication adds no runtime changes or parity credit.

## Frozen path map and replay constraints

The unchanged scripts find `probe-guard-lifecycle.py` beside themselves, execute
it, and assert BOTH its SHA256 and the SHA256 of its entire captured JSON output.
The baseline script is retained once in the
[baseline packet](../native-guard-lifecycle-20261005/probe-guard-lifecycle.py),
not recopied or patched here. Its exact output is
[attempt-04.json](../native-guard-lifecycle-20261005/attempt-04.json).
The baseline output includes absolute input/source paths and interpreter identity.
Consequently, simply running these frozen extension scripts from a relocated
folder will fail their baseline-output assertion even with identical input bytes.
Do not weaken or remove that assertion to report a passing frozen replay.

For exact source-bound replay, use a separately prepared full source checkout at
`3b899125cc8cedef938823718ad5d44f49957b66`, the original recorded repository/game
paths and compatible interpreter identity from the unchanged receipts. Place
unmodified copies of the baseline and the two extension scripts side-by-side at
that checkout's `work/orchestration/native-guard-lifecycle-20261005/` path, only if
those destinations are absent or already byte-identical. Preserve different
existing files. Use each receipt's exact command from its recorded working
directory and write new output files. This is a documented replay procedure;
publication does not execute it or install/copy dependencies.

Relocation that preserves semantic tests while normalizing captured provenance
would require a separately reviewed portable harness. None is claimed here.
Original game assets, executable/tool binaries, environment files, credentials,
and browser profiles are not distributed. Tool versions and source/input hashes
are in the receipts; interpreter/package binary hashes were not recorded in the
accepted baseline. The executable identity remains
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.

Raw Markdown links preserve their original research layout. Within this folder,
author artifacts are under `native-guard-lifecycle-20261005/` and reviewer artifacts
under `native-guard-lifecycle-review-20261005/`. For historical cross-packet links:

- Baseline `findings.md` maps to
  [the unchanged reviewed findings](../native-guard-lifecycle-20261005/findings.md).
  The later one-word count correction is disclosed in the baseline README and
  separately accepted in the extension review; the original file stays frozen.
- `baseline-review.md` maps to
  [the unchanged baseline review](../native-guard-lifecycle-review-20261005/review.md).
- Baseline `probe-guard-lifecycle.py` and `attempt-04.json` map to the links above.
- `../../../app/...`, `../../../scripts/...`, and `../../../decomp/...` links in raw
  artifacts mean those repository-root paths at the pinned source commit, rather
  than paths relative to this additional publication folder. Resolve them against
  [the source baseline](https://github.com/JohnDeved/populous-new-dawn/tree/3b899125cc8cedef938823718ad5d44f49957b66).

The manifest retains original source paths, exact file identities, source-audit
hashes, and baseline dependencies. Its self-hash is excluded to avoid a circular
identity and is supplied in the immutable publication handoff. Packaging checks
cover the allowlist, exact hashes, JSON/Python syntax, 20/43 and 2 case counts,
byte-identical replay pairs, empty stderr, source-audit identities, and unchanged
baseline files. Native replay, browser, standard check/build, and TypeScript
quality checks are outside this additive evidence-publication task.

The full whitespace check reports15 trailing spaces in the frozen `004999d0.asm`
listing. They remain unchanged to preserve its accepted hash. The newly authored
README and manifest pass the whitespace check.
