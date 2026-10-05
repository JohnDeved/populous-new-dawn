# Reviewed native Guard movement continuation

Issue [#219](https://github.com/JohnDeved/populous-new-dawn/issues/219). Evidence-only
follow-on to the [accepted native lifecycle packet](https://github.com/JohnDeved/populous-new-dawn/blob/b6ee17f0d4392a3f52bf825ac6b1e1262941c5fe/evidence/native-shaman-guard-lifecycle/README.md).
It does not change [PR220](https://github.com/JohnDeved/populous-new-dawn/pull/220),
its frozen source `c20a297f5f815ce404f796b08f77ea56396f96da`, or its acceptance scope.

Independent review: **ACCEPT for the four-case synthetic flat-world native witness**.
The reviewer replayed the frozen probe byte-for-byte, audited 4,124 original
instruction rows and 18 indexed Ghidra exports, and checked all 96 complete person
visits plus 96 animation visits. There are 196 stages including four input producers.
No supplied leaf runs during any of those person or animation visits.

## What this establishes

- Native person processing runs preparation → physics → route advancement →
  Guard callback → remaining person tail → processor stamp. A separately invoked
  native animation-list visit follows. Original outer timer/render/world scheduling
  is statically mapped, not executed.
- Near Guard clears pursuit at visit4, after physics has already moved the follower.
  Visit5 still moves (+61,+17), retaining speed61, route1 and source40. Its route
  releases naturally on visit11, while movement continues through visit24.
- Far Guard clears pursuit at visit20 after the follower enters the near square;
  visit21 still moves (+63,+8), retaining speed61/route1/source40.
- With target loss before visit5, original order completion and resting-slot
  processing first settle the follower on visit13 at (4864,4352), speed0/source48.
  The command3 movement control first settles there on visit12. Both stay fixed
  on subsequent visits through visit24. The settling visit itself still moves.
- Settled records retain stale velocity bytes: target loss (+57,0,+18), command3
  (+65,0,+20), in x/height/y order. Actual position deltas, together with the
  observed consumer, establish rest; the stored velocity bytes alone do not.

The fixture supplies a flat, passable, quiet world, synthetic person records,
fixed identities, initial pose/phase, a stationary unscheduled Shaman target,
and global turn/sprite counters. Genuine native input functions queue Guard and
command3. Genuine startup `0042c210`, shipped MWSEARCH data, actual motion,
route construction, resting-slot selection, setters and animation consumers execute.
Full campaign acquisition, arbitrary terrain/world behavior, formation, rendered
pixels, hardware timing and universal eventual Guard settling remain unproved.

The port comparison is **read-only source mapping**: the applicable PR220 path
already performs physics → route → Guard, and the near callback has no stop or
resting setter. No port/native trajectory equality, production defect,
implementation change, broader PR220 acceptance or full-Guard parity is claimed.

## Read the evidence

- [Research findings](research-findings.md): caller addresses, exact fixture,
  observed trajectories and limitations.
- [Independent review](independent-review.md): ACCEPT, replay identity, independent
  instruction/export/phase checks, and preserved boundaries.
- [Static-only port comparison](source-comparison.md).
- [Reviewed raw archive](reviewed-native-evidence.tar.gz): 37 allowlisted UTF-8
  files, including unchanged probes, all raw results, raw receipts, native assembly,
  original packet/review manifests and retained incomplete attempts.
- [Archive manifest](archive-manifest.json): each exact archive member, size and
  SHA256, plus archive identity.
- [Publication manifest](publication-manifest.json): hashes for this published
  directory's documents, archive and archive manifest.

The archive is 602,639 bytes and expands to 39,177,842 bytes. Its SHA256 is
`21f5b0d50685af37899f5b55359c649741594c97fc66934246848a157cec27fb`.
All members were read back, compared byte-for-byte with the frozen sources,
and checked against an explicit path/extension allowlist. There are no symlinks,
original executable/game-data files, tools, dependencies, profiles or credentials.
In particular, **MWSEARCH.DAT is not included**.

The archive preserves these sibling paths:

- `native-guard-motion-followup/`: authoritative `probe-motion.py`,
  `result-03.json`, `receipt.json`, `verify-result.py`, `verified-summary.json`,
  disassemblies, findings and earlier incomplete results.
- `native-guard-motion-review/`: independent `findings.md`, unmodified replay,
  audit program/results, preflight/preservation checks, receipt and manifest.
- `replay-inputs/probe-guard-lifecycle.py`: byte-exact retained harness dependency,
  also available in the earlier public lifecycle packet. This is a Python probe,
  not a game or tool binary.

Earlier attempts were not promoted into the accepted result. Their target-loss
failure at `004d52d6` tried reading address00000004 through an uninitialized
resting-slot table. The final probe supplies the established shipped search input
and executes its actual native startup producer, rather than inventing a return.
The independent review confirms that repair and the corrected packed movement input.

## Identity and replay inputs

- Probe SHA256: `c15642c46d8cf593527be3c1fd98d3a396b9f2de49b3397de107b5e5ee059be1`
- Original result and byte-identical reviewer replay SHA256:
  `13ca18e32601f551ae911ae19d9717725950b18124389666aadd3d0de42759d5`
- Frozen research manifest SHA256:
  `52b6f17dd948ad7ae70f90f1b1b9f28510d3bf601c63fabe00e2a328616f28af`
- Frozen independent-review manifest SHA256:
  `6bbcd5c4ecf06c8e252000e483c37758769006e97a5a1c59af760487ce43eebd`

The exact source/input/tool bindings and commands are preserved in the raw
receipts. Source is the unchanged
[c20a297 candidate](https://github.com/JohnDeved/populous-new-dawn/tree/c20a297f5f815ce404f796b08f77ea56396f96da).
The established environment used Python3.12.14, Unicorn2.1.4 and Capstone5.0.7,
CPU4 and a 60-second command timeout. No native probe was rerun for publication.

Replay requires legally supplied original files at these paths relative to the
game root; only their identities are published:

| Input | SHA256 |
| --- | --- |
| `d3dpoptb.exe` | `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f` |
| `data/mwsearch.dat` | `0c39b12d160658863c2df89aa34484dff459e48ea0b5634658b7473ca940fae0` |
| `levels/constant.dat` | `e905e513c798171d5540082565b8addc9f54e5851006b56e8d1976687ba42f24` |
| `data/vstart-0.ani` | `64a8975f234aa67eafc4d4d9edd7cc4aeba9f5743d028d8203e0c67ca199a1aa` |
| `data/vfra-0.ani` | `c91720da3c636fb74cb749c5f8747ae884c1d76dbeed4b845f5a199ef1a55258` |

The probe accepts `EXE SOURCE_ROOT BASELINE_PROBE` positional arguments. Exact
byte-for-byte output identity additionally depends on retaining the original
paths recorded in the report; relocating inputs changes path metadata. The
included verifier can inspect the frozen JSON without executing the game image.
The original executable is only mapped by the established Unicorn loader; it is
never launched as an OS program.

No source/index change in the implementation worktrees, parity-ledger edit,
deployment, runtime fix, browser run, full check or build is part of this packet.
