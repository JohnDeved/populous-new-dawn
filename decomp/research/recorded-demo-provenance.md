# Recorded-demo provenance: raw state is not a source-map identity

**Observed and published September 17, 2026, Europe/Berlin. Decision: UNRESOLVED source maps for active recordings 1/5/2/6/3.** This note packages the accepted raw-state/current-height contract and its useful negative evidence. It neither proves nor disproves reuse of LEVL2131, assigns another extra map, or changes the [Face Off header-only/no-CPSCR130 finding](demo131-entry.md#rolling-demo-exact-remaining-provenance-boundary).

**Recorded-demo state is not a user-created original save fixture.** U08 remains CEO-owned. This is static evidence, not native execution, a full save codec, runtime/playthrough acceptance or parity credit. Multiplayer implementation and scope expansion are not part of this work.

## Byte-backed loading and height contract

The accepted montage parser selects recording IDs **1,5,2,6,3**, naming `RDnnnGM.DAT/.VER` rather than campaign levels. Every supplied GM image is **858,468 bytes (`0xd1964`)**; each sidecar is 68 bytes with version word **106**. The base Component 0 provenance and file identities were established before this packaging; no extraction or package inventory was repeated.

| Consumer | Established contract |
| --- | --- |
| `004b351f → 004b28d0 → 00428210` | The recorded-state path checks size `0xd1964` at `004b2ad5`, then invokes the raw reader at `004b2af7` with requested version107. These are recording-file consumers, not LEVL filename selectors. |
| `00428210 → 00525f80 → 00526580` | It reads the sidecar and loads the GM block directly at **`0089d178..<0096eadc`**. The adapter calls imported `ReadFile` at `005265a9`; the inspected path does not decompress or manufacture a source identity. No Windows API was executed by this proof. |
| `00428120` conversion | Sidecar106 is eligible for requested107. The separate payload word at `0096aa9e`, offset `0xcd926`, is **0 in all five files**, not 106. Conversion processes 16,384 cells of 16 bytes and preserves the current height word at cell `+4` while repacking other fields. |
| [Original DAT loader](../generated/00484a10.c) | It reads the first `0x8000` DAT bytes and writes each 16-bit source height to **`008a03e8 + 16*i`** at `00484cb0`. Thus snapshot offset **`0x3270 + 16*i`**, count 16,384, is a proved projection of the **current** height field, not a coincidental byte search. |

The checker emits five 32,768-byte signed 16-bit height projections. They are not complete maps, reconstructed original DATs, playable assets or new fixtures.

## Why the observed fields do not name a map

| Candidate | Evidence and limit |
| --- | --- |
| Current height | Conversion preserves it, but `0050c60d` can overwrite the same live height word. An exact source-loading edge does not make the later value immutable. Similar or different terrain cannot establish original-map identity without a producer/reconstruction proof. |
| Saved art bank | `0042a516` writes bank byte `0096ead0` (offset `0xd1958`); `00442bad/00442bb3` feeds it through [0042a500](../generated/0042a500.c) to filename setup. It selects artwork, not a campaign/map ID. |
| Ordinary level globals | `0089c6dd` lies 2,715 bytes before the copied block; a byte copy at `0089d16e` is also outside it. Those addresses are not captured by this raw copy. This is **not** proof that every possible identity encoding is absent from the image. |
| Sidecar words | Offset 20 happens to equal each recording ID, but its map semantics are unbound. The current writer interface `0049a750` supplies version/build/date and a trailing caller word; it does not establish the interior schema of older version106 files. |

The current writer's literal is **“Nov 25 1998”**; supplied sidecar text is **“Sep 30 1998 16:35:49”**. These are observed file/code strings, not independently verified creation dates or evidence that this executable created those snapshots. Repeated bytes and recording numbers are not promoted to source-map IDs.

| Active recording | Recorded art bank | Original source map |
| --- | ---: | --- |
| 1 | 13 | **UNRESOLVED** |
| 5 | 1 | **UNRESOLVED** |
| 2 | 13 | **UNRESOLVED** |
| 6 | 30 | **UNRESOLVED** |
| 3 | 13 | **UNRESOLVED** |

The accepted bounded comparison found no exact whole-height equality against three already imported references: `app/level-four.ts`, `app/level-thirteen.ts`, `app/level-nineteen.ts`. The checker pins those file/source hashes when the optional comparison is requested. This is not an exhaustive map search, a new LEVL2131 terrain comparison or even exclusion of those three maps: current heights are mutable. Approximate similarity, art banks, labels and tribe counts do not supply provenance.

## Remaining producer boundary

The opaque-reader question is narrowed: **`00428210` loads raw state plus conversion, not a source-level filename.** The missing link is the matching **version106 recording-creation producer** connecting an original DAT/HDR to that captured state, or a proven immutable/pre-mutation geometry/source fingerprint. Current writer `0049a750` and recorded raw-state call-site lead `00443094` are investigation anchors, not a proved old authoring pipeline. A field must be shown to receive and retain the original map identity; no such field is bound by this result.

All five `sourceMapId` results deliberately remain `null`/`UNRESOLVED`. There is no LEVL2131 include/exclude decision, other extra-map assignment, U01 completion, scope ledger edit or original-user-save acceptance. Only this accepted finding is packaged; no new source-map investigation is required or claimed here.

## Reproduce the static boundary proof

Use Python **3.9+**, existing **Capstone 5.0.7**, the [tracked checker](../../scripts/check-static-recorded-demo-provenance.py) and its unchanged sibling [PE32 reader](../../scripts/check-static-mission18-sky.py):

```sh
python3 -B scripts/check-static-recorded-demo-provenance.py \
  --exe /path/to/d3dpoptb.exe \
  --data-root /path/to/original-game \
  --output-dir /path/to/new-recorded-demo-evidence
```

The output directory must not exist; its parent must exist. The checker reads actual EXE bytes and all 11 size/SHA-locked input files, writes 13 code listings, five height projections and an inspectable `evidence.json`. It has no fixed-worktree, Git-head, ignored-report or cwd dependency. Reader discovery is relative to the script. No target execution/emulation, Ghidra, network, GPU, server or build is involved.

The default omits imported-level comparisons. To reproduce the historical **220-check** result including only the three accepted, hash-pinned references, add `--imports-root /path/to/checkout`. No additional reference is searched or accepted. Omitting that option removes six reference identity checks and one aggregate comparison assertion; report fields record which mode ran. This optional negative comparison still cannot assign or exclude source maps.

The accepted original run completed **September 17 10:18:00 Berlin**, with **220 checks /13 windows /11 canonical files**, using D3D EXE SHA-256 `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`. Report SHA-256: `16b8205e219341a43a7a24701a02338cc041473a6cf281841df2d6cd7ef38506`; original source SHA-256: `61b8dd63aed2e7c31a16453c44499be8cd9c55e3a34154cd9f85da6a485344c5`. Those receipts remain historical and unchanged, not required checker inputs. Publication adapts reader/path/error setup and accurately labels optional comparison scope; all original byte assertions, projections, input guards and unresolved conclusions remain intact.

Exact input identities are embedded in the tracked checker and included in every passing report: montage `rdmn001.dat` (286 bytes), five GM files (858,468 bytes each) and five VER files (68 bytes each). Inputs are supplied base Component 0 files; no user-created save fixture or extracted dependency is invented. Successful static verification proves this bounded contract and reproducible projections—not original-map identity or live-game correctness.
