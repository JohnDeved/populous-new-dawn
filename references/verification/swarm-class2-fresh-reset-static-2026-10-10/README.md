# Swarm prerequisite: the concrete fresh-level reset boundary

`0042b230` calls the unit/cell reset at `0042b258 → 004eef50`, which calls
`004ee300` at `004eefc9`. This binds a real fresh-level invocation of the already
proved list builder. The proposed `clear_some_array` symbol is instead
`0042b281 → 00448c80`, a small unrelated zeroing routine. Its name is not evidence
of physical unit initialization.

The finite result is the reset-return state and its caller's following terrain
clear. It does **not** establish that the same state survives every intervening
initializer until `00484a10`, nor establish the earlier actual invocation of
physical-index/range setup. No authored allocation replay or native ID prediction
is made. Port assessment remains `f9675f56c597ec83adf02f28e9801bfc6bbd0490`;
research head is `4fc7f904243e06901314215eebce8284cd929f4e`.

## Actual caller and reset writes

The retained `0042b590` fresh-level path calls `0042b230`. The latter's exact
entry slice shows:

1. `0042b258` calls `004eef50` before the full terrain clear.
2. At `004eef60`, each fixed record between globals `00890378` and `00890384`,
   stride `0xb3`, receives class byte `+0x2a = 0`. After incrementing the pointer,
   `004eef68` clears bit 0 at the previous record's `+0x0c`; this is the deleted
   bit, not all flags or the cell-membership bit.
3. `004eef77–004eefc7` visits packed XY values 0..65535. The masking maps them
   onto all 16,384 terrain cells. It writes cell head `+0x06 = 0` and clears
   selected terrain/footprint/shadow fields. It does not rewrite each record's
   old `+0x20/+0x22` cell links or physical ID.
4. `004eefc9` calls `004ee300`, then returns at `004eefcf`.
5. Back in the caller, `0042b27f` zeroes `0x10000` dwords starting at `008a03e4`,
   covering the full `0x40000`-byte terrain-cell region, including its heads.
6. `0042b281` calls `00448c80`; that no-call body writes `0x31` zero dwords
   (`0xc4` bytes) at `009556e0` and returns at `00448c90`. It writes no unit index,
   free/allocated/pending head or cell-head field.

The caller slice ends exactly after that second call at `0042b286`. The initial
exploratory window ended partway through a later instruction at `0042b2bb`; it is
retained, excluded from complete-code claims, and superseded by the exact slice.

## List rebuilding: concrete fields and conditional ranges

`004ee300` is already retained and accepted in the secondary-owner and retirement
research. This pass reuses that interpretation and binds the reset caller plus
actual global addresses from assembly. It has no calls and returns at `004ee465`.

| List owner | Actual fields and traversal |
| --- | --- |
| Primary range | Read start `0089037c`; stop before `00890388`; stride `0xb3`. |
| Low/high free pools | Clear heads `00890320` and `0089031c`. A class-zero record with deleted bit clear goes to low if unsigned `+0x24 < 0x280`, otherwise high. Prepend using pointer links `+0x00` previous / `+0x04` next. |
| Primary allocated/pending | Clear `00890324` and `00890328`. Nonzero class goes to allocated; class zero with deleted set goes to pending. Both contribute to counts at `0089c651`, and ID below 640 also contributes at `0089c659`. |
| Secondary range | Read start `00890380`; stop before `0089038c`; stride `0xb3`. |
| Secondary free/allocated | Clear `0089032c` and `00890330`, and counts `0089c655/0089c65d`. Class zero prepends to free, nonzero class to allocated; the latter increments `0089c655`. |

Retained `004ed820` supplies these **layout preconditions**: fixed storage scan
`008e04db..00937a98` (records 1..1999), primary range
`008e04db..00930ab8` (1..1839), secondary range `00930ab8..00937a98`
(1840..1999), and physical-ID lookup table `00890390` with index zero null.
Retained `004ed880` supplies the separate `+0x24 = physical index` producer for
all 2000 records. Neither function is called by `004eef50` or `004ee300`.
Their concrete earlier invocation is not established by this packet.

Given those already documented layout/index preconditions, the reset clears
class/deleted across both traversed ranges, so rebuilding yields empty allocated
and pending lists and zero allocation counts. Ascending physical traversal with
head prepend yields low free IDs 639..1, high free IDs 1839..640 and secondary
free IDs 1999..1840. These are conditional **reset-return** orders, not authored
object IDs or a claim that the first later class-2 allocation takes a particular
pool. Without the index precondition, the exact proved rule is reverse physical
traversal within the unsigned-ID threshold subsets, not numeric-ID sorting.

Free records retain stale model/state/position/other flags and own cell-link
words; only the named reset fields and rebuilt global links are changed here.
The retained primary allocator `004ed8a0` separately clears the selected record
while preserving its physical ID and allocation-list links. Treating reset as a
new allocation, or assigning authored ordinals as physical IDs, would add behavior.

## Current owner and exact remaining producer

The browser `createWorldState` creates empty object-cell heads and a fresh
`nextId = 1`; `createWorld` then invokes actual ordinary building/unit producers.
`addBuilding` still owns a browser terrain handle, not this shared native pool.
The existing person-cell reconciliation, neutral Vault omission, plan/building
alias and upgrade replacement gaps remain as mapped previously. This result
does not authorize putting Building snapshots into the person registry.

Two exact composition boundaries remain:

- Earlier initialization must actually call the known `004ed820` range/lookup
  producer and `004ed880` physical-index producer, or an equivalent concrete
  writer, before the reset consumes those fields. Their bodies are available;
  the missing evidence is the native caller/order, not an inaccessible input.
- The retained `0042b230` body has other initializers and `load_objs_1` between
  this reset and its `00484a10` call. This pass does not compose their allocation
  effects. Reset-return free order cannot be relabeled the final pre-authored
  allocation state. A later finite pass must select that particular caller/field
  boundary before extending the claim.

The already accepted authored-tail result remains `0048506f → 004edf50`, linked
deactivation separate from retirement, with zero linked class-2 records in the
M1–3 decoded inventory. Native Save restoration and typed browser Load are still
separate: this fresh-level reset does not show how saved raw IDs/list state are
restored and does not justify reconstructing missing checkpoint history.

## Verification and limits

Canonical EXE SHA256 `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`
and existing GNU objdump 2.44 SHA256
`96afb8521834982d0e711b5d6e9785252bf82129fb0106b93a6bd54d83fae11f` match before
and after all five short data-only decoder commands on CPU 4. Every command
exited zero with empty stderr. Complete branch/return coverage is claimed for
`00448c80..00448c91`, `004eef50..004eefd0`, and `004ee300..004ee466` only (end
exclusive). Remaining bytes in the windows are padding. No original code,
native probe, game, importer, browser or runtime test was executed.

This closes one concrete reset/list-builder invocation. It does not close whole
fresh-level composition, native save format, full allocator parity, current
class-2 identity ownership, timing/raster parity or Swarm building gameplay.

The [manifest](manifest.json) binds the exact commands, bytes, retained sources
and local exploratory-window receipt. Independent source review SHA256:
`bb55d3f92296db343f46a75f9ec5d8a6de6376169eb3c4b8714fbd38dd90cc33`.
The original accepted findings hash is
`99792eec4d7e6721ba11bf44975e776375609924fa8f84aa5c4d9f03242633e6`.
Earlier [bootstrap/inventory proof](https://github.com/JohnDeved/populous-new-dawn/blob/00e5a1e5b8780f1ef8b6f4a89e5edf171a2bf228/references/verification/swarm-class2-bootstrap-static-2026-10-10/README.md) remains immutable.
Only source text is published; no executable, level assets, binary archive or
raw profile is included.
