# Accepted bounded native sermon comparison and piece measurement

The single authorized original-instruction run supports the missing gesture
producer diagnosis and **rejects whole-sermon equality**. Independent raw-evidence
review accepted its bounded supplied-state scope; see [native-review.md](native-review.md).
The ordinary current-source browser baseline remains a separate prerequisite for
implementation. No gameplay, atlas, metadata, timing, package or parity changed.

## Source-bound run

- Actual source: `19c88e1ceabbfe28ed8524410aaf2b1dfaf6bd3d`.
- Frozen manifest SHA-256:
  `125acb5330e5487c7c5bd6438c13c2ec975ecb9d04538560ee9898d885b4a3b7`.
- Canonical EXE SHA-256:
  `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
- Run ID `cededb68-c5ed-41dc-9d8c-3d88584cf2e9`, session 24873;
  2026-10-06 11:57:21.828Z–11:57:25.938Z, exit 0, no signal.
- CPU 4; external 87-second TERM plus 3-second cleanup ceiling; internal
  60-second native run, 1-second/100,000-instruction call and 15-second port caps.
- All 27 cases / 63 controller-updater pairs completed. Source-bound receipt
  before/after inputs matched; all 26 postflight checks passed. Node v24.19.0
  exited 0, stderr was empty, and no owned processes remained after collection.

The exact launch, frozen inputs, raw stdout/stderr, four-phase observations,
partial-failure protections and limitations remain in the receipt and raw packet.
The approved function composition, not an original OS game or full world loop,
ran exactly once. There was no retry, new case, rewritten expectation or rerun
in review. See [comparison-plan.md](comparison-plan.md) and [preflight.json](preflight.json).

## Observed differences

| Boundary | Actual native | Frozen current port |
| --- | --- | --- |
| Entry object 95 | source160, f1=1/f2=0 | source160, f1=0/f2=2 |
| First loop object 97 | source168, f1=1/f2=0, assignment16 | source168, f1=0/f2=2, assignment0 |
| Cosmetic seed0 at counter16 | object98/source176; RNG0→653787137 | source168; RNG remains0 |
| Cosmetic seed3 at counter16 | object99/source184; RNG3→2517630980 | source168; RNG remains3 |
| Object98 return | final frame9 after updater10; return97 at controller11 | no gesture producer |
| Object99 return | final frame17 after updater18; return97 at controller19 | no gesture producer |
| Return97 visit | controller f1=0/f2=0, updater f2=1 | depends on retained loop phase |

The active object99 counter32 visit makes no fresh decision or setter request.
No-gesture residues2/3 still advance the native cosmetic word. Simulation RNG
stays4 through the two main empty-listener gesture traces. The audio cases record
prior-listener cues51/189 before acquisition; late acquisition makes no retroactive
cue. Audio and acquisition effects remain explicitly supplied boundaries.

The known timer840 and command32 even/odd differences are retained exactly,
without expanding this task into their repair. Independent review verified all
126 native-plus-port serialized updater rows and recomputed the full inventory:
62 rows differ, comprising 53 state/RNG/return differences and 9 event-label-only
differences. Those counts are observations, not distinct bug counts.

## Raw preservation

The unchanged actual artifacts are under
`work/orchestration/preacher-sermon-native/run-01/`, with adjacent
`run-01-receipt.json` and `run-01-cleanup.json`. The sibling preservation directory
`../preacher-sermon-gestures-preservation-20261006/` contains the source Git bundle,
`native-run-01-19c88e1c.tar.gz`, its per-file hash manifest and the review copies.
The original raw archive SHA-256 is
`5dce037a1cd54cf47899b8ff5216cd7c8bc4ab8d140ac0a0274bc0d3bcb422b7`.
Review fingerprints for the principal uncompressed artifacts are retained in
[native-review.md](native-review.md). These are local, unpushed preservation
artifacts and **not reset-durable**. No connector Git write or Library upload was
used. Later documentation commits do not relabel the actual tested source.

## Read-only artwork capacity measurement

[measure-pieces.py](measure-pieces.py) and [piece-measurement.json](piece-measurement.json)
retain the exact original input/decoder/accepted-atlas hashes, dimensions,
nontransparent pixel counts, exclusive alpha bounds and RGBA hash for each of the
48 missing source pieces. The measurement uses accepted combined application
`169b5f38e8cc9f7aacbae222ba804ac519ec1f27` and extracts only the existing importer's
`sprites` and `read_owned_rgba_png` decoder functions. It never calls the importer or
packing function and writes JSON only.

All 48 raw rectangles fit the existing 32×32 subslot convention without cropping.
Every decoded nontransparent bound reaches its original rectangle's edges.
All 4,122 existing piece rectangles match the original decoded RGBA bytes.
The accepted 2048×8128 atlas retains two completely unused 64×64 tail cells at
(1920,8064) and (1984,8064), providing 8 of the existing 32×32 subslots. The
remaining 40 pieces require 10 more cells under the same four-subslot rule.
One additional 64-pixel row provides 32 cells and reaches height **8192**.
Thus the existing convention has sufficient bounded capacity without moving an
old index, rectangle or pixel. No new piece coordinates have been assigned.

The 8192 texture limit is the supplied accepted hardware boundary, not a new
hardware query. This measurement proves capacity and decoded bytes, not a future
texture's rendering correctness. Later artwork must preserve the firing layout;
it remains blocked until the ordinary baseline is independently accepted.
Reproduce this read-only measurement from the repository root with:

```sh
taskset -c 4 ../prerequisites/venv/bin/python -B \
  decomp/research/preacher-sermon-gestures/measure-pieces.py
```

The retained result SHA-256 is
`f9a471e8472bd54f460d8cfc900d6fe970dea8c1d16614b604e2300b6fe81953`.
Its exact measurement source bytes match the executed ignored reader at
`work/orchestration/preacher-piece-measurement/measure.py`; only the file location
changed for this durable research copy.
