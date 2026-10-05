# Native Shaman Guard lifecycle: accepted research packet

This evidence-only branch retains the independently accepted native command30
lifecycle and signed-distance comparison packet from 2026-10-05. It adds no game
implementation and earns no gameplay, browser, performance, or whole-Guard parity
credit. The source baseline is
[`3b899125cc8cedef938823718ad5d44f49957b66`](https://github.com/JohnDeved/populous-new-dawn/tree/3b899125cc8cedef938823718ad5d44f49957b66).

- [Frozen findings](native-guard-lifecycle-20261005/findings.md)
- [Independent review](native-guard-lifecycle-review-20261005/review.md)
- [Lifecycle receipt](native-guard-lifecycle-20261005/receipt.json) and
  [distance receipt](native-guard-lifecycle-20261005/distance-receipt.json)
- [Lifecycle result](native-guard-lifecycle-20261005/attempt-04.json) and
  [independent replay](native-guard-lifecycle-review-20261005/replay.json)
- [Distance result](native-guard-lifecycle-20261005/distance-result.json) and
  [independent replay](native-guard-lifecycle-review-20261005/distance-replay.json)
- [File identities and source dependencies](manifest.json)

## Review freeze and editorial correction

The independent review is preserved byte-for-byte at SHA256
`27538c420093465594e9bd3fb519b5801d59871c31ae8d5e75472532905e2798`.
The findings are restored to the exact reviewed SHA256
`32e27423b6accdc8571e90dae2433b7da0fc237b82f3a1b1d0a89a5cc0ceaaec`.
That frozen text says “The first eight cases”; this count should read “The first
nine cases”: there are eleven total cases, of which the final two execute the
state10/common-transition segment. The source working copy contains only that
word correction and hashes to
`2802bd502d5de72032708318ba6731bf4c823964914349c7afca2445d342d58d`.
No probe or result bytes were changed during publication.

This publication was authorized separately after the research review. Statements
inside frozen artifacts that no publication had occurred describe their original
research/review time. Producer extensions are outside this accepted packet and
are deliberately excluded: no producer probe/results or `004999d0.asm` are included.

## What the evidence establishes

The lifecycle probe has 11 cases and 64 explicitly scheduled stages. It runs the
original G command30 producer, queue lifecycle, deferred adoption, guard dispatch,
selection writes, and animation setter/transition boundaries under supplied
fixtures. Independent replay is byte-identical to the author result.
The distance companion has 28 original-native cases. All match separately
sign-extended-coordinate subtraction; five differ from the current port's wrapped
subtraction expression. Independent replay is byte-identical.

Destination planning, selection UI refresh, and voice are intercepted in the
lifecycle harness. Object/tribe/terrain data, animation stamps, and phase seeds
are supplied. The final state10 segment excludes the processor's physics preamble
and ordinary tail. Idle-artwork re-entry retains speed 65, with no stop event.
This does not prove physically stopped Guard, natural arrival, uninterrupted
original phase, full world scheduling/pathfinding, browser rendering, or ordinary
Mission 10 acquisition. The distance probe does not run TypeScript; its destination
and recovery leaves are supplied, and recovery is not reached. See the frozen
findings and review for all remaining boundaries.

## Source-dependent replay

The original executable, game assets, Python/tool binaries, credentials, browser
profiles, and unrelated dumps are not distributed. Obtain the already authorized
original inputs independently and retain their exact hashes from the receipts.
A full source checkout at the baseline commit is required separately from this
sparse evidence checkout. The scripts import `scripts/decomp.py`; that helper reads
`decomp/tools.json` and, for lifecycle work, `app/original-constants.json` and the
original `levels/constant.dat`. Lifecycle also reads `app/original-rules.json` and
original `data/vstart-0.ani` / `data/vfra-0.ani`; distance records the exact
`app/live-movement.ts` hash. Source hashes and paths are retained in `manifest.json`
and the unchanged receipts/results.

Original runs used Python 3.12.14, Unicorn 2.1.4, and Capstone 5.0.7. The helper and
repository tool-lock hashes are pinned in the manifest. The original receipts
record package versions, not binary hashes of the Python interpreter or installed
Unicorn/Capstone distributions. No stronger package-identity claim is made.
Ghidra and Java were not used for these probes; the five scoped assembly listings
were independently checked against the pinned executable bytes.

For an already prepared compatible environment, set `PYTHON`, `EXE`, `REPO`,
`BUNDLE`, and `OUT` to absolute paths: the chosen interpreter, original executable,
full source checkout at the baseline, this packet directory, and a new output
directory. `EXE` must have the original adjacent input paths described above.
The following reproduces the bounded calls; it does not install dependencies:

```sh
mkdir -p "$OUT"
timeout 60s taskset -c 4 env PYTHONDONTWRITEBYTECODE=1 "$PYTHON" \
  "$BUNDLE/native-guard-lifecycle-20261005/probe-guard-lifecycle.py" \
  "$EXE" "$REPO" > "$OUT/lifecycle.json" 2> "$OUT/lifecycle.stderr"
timeout 60s taskset -c 4 env PYTHONDONTWRITEBYTECODE=1 "$PYTHON" \
  "$BUNDLE/native-guard-lifecycle-20261005/probe-guard-distance.py" \
  "$EXE" "$REPO" > "$OUT/distance.json" 2> "$OUT/distance.stderr"
```

CPU 4 was available in the original executor; use an available allowed CPU on a
different host and record that choice. Relocated script, input, or source paths,
and a changed interpreter build string alter the raw JSON fingerprints. The
retained exact replay hashes apply to the original recorded paths/environment;
compare semantic cases and exact input hashes when replaying elsewhere. Do not
rewrite the retained originals to make new raw outputs compare equal.

## Packaging validation

Publication checks verify the selected file inventory, SHA256 and Git blob
identities, JSON syntax, 11/64 and 28/5 counts, the two byte-identical author/reviewer
result pairs, empty stderr files, the findings restoration, and all receipt-pinned
repository source hashes against the baseline commit. No native replay, browser,
standard check/build, dependency install, profile access, or Ghidra operation is
part of this packaging task. Those gates are not applicable to this additive
research-only publication; evidence identity and source-bound checks are the
relevant validation. This does not replace the independent native review.

The full `git diff --check` reports 15 trailing spaces already present in the
frozen disassemblies. They are preserved to retain exact source artifact hashes;
the newly authored README and manifest pass the whitespace check.

The manifest excludes its own bytes to avoid a circular hash. Its SHA256 and Git
blob identity must be obtained from the publication handoff or immutable commit.
All manifest paths are relative to this directory; hashes authenticate transport,
not the semantic acceptance of a self-modified manifest.

Historical links outside this packet still refer to their original source paths.
Repository links resolve against the unchanged source baseline. The previous
sibling-worktree `guard-handoff-assessment.md` is not part of this packet and its
historical relative link is not portable; it is background only, not additional
accepted proof. Failed/intermediate attempts remain in the original research
workspace, and their outcomes are preserved in the unchanged receipts.
