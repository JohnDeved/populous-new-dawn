# Native Followers task panel

Issue #60 evidence recovery on base `c373fa1ba1512ffd8a3e63fcca7df47e63221add`.
No production UI/CSS, imported runtime assets, browser behavior or parity ledger is
changed. This note supplies the missing lower-panel evidence rather than reviving
the removed duplicate roster.

## Result and source boundary

The original lower Followers panel is a **six-column, six-row task/transport table**:

- columns: Total, Brave, Warrior, Firewarrior, Preacher, Spy;
- first four rows: Currently Selected, Idle, Housed, Busy;
- final two rows: Boats Occupied and Balloons Occupied.

This is established by the EXE's descriptors, executed callbacks, and original
English tooltip strings 777–812, not by issue summaries or visual guesswork.
The old `followers-tab.md` negative scan ended at `005cc000`; these descriptors begin
at **`005cc6f0`**, outside that bounded scan. The older finding correctly rejected
the duplicate class grid but never excluded this original task table.

Canonical EXE SHA-256:
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
The Ghidra 12.1.3 project `populous-restored` was exported using Temurin
21.0.12.1 on 2026-10-04. `ExportFunctions.java` verified every canonical file-backed
section against `decomp/sections.tsv` before six scoped exports completed.
Preserved existing classifier export `004513e0`; new exports: `004a0200`, `004a0e70`, `004a11e0`,
`004a1240`, `004a1340`; hashes are indexed in `decomp/exports.json`.
Pseudocode is not original source; executable probes remain authoritative.

## Exact descriptors and artwork

Root record `005cd178` has ID 4, child pointers `005cc6f0`, logical rectangle
**(0,204,100,277)** and renderer `004a1720`. Each child is a 66-byte record.
There are 36 controls, followed by a type-9 terminator at `005cd038`.
All have 15×34 logical geometry and zero construction-mode byte at record `+65`.
Columns have x positions 0/16/32/48/64/80. Relative row y positions are
6/47/88/129/190/231. Root-relative placement gives absolute row y positions
210/251/292/333/394/435. The gap before transport is present in original data.

The first 24 descriptors are stored column-major, with key `model*5 + row`, where
row is 0–3. Models are **0,2,3,6,4,5** in visual order. The last 12 are row-major,
with key `model` for Boats and `model+8` for Balloons. Tooltip IDs are row-major
777–812 regardless of descriptor storage order. The complete address, geometry,
art, callback, key and original-label inventory is in
[follower-task-panel/native-panel-contract.json](follower-task-panel/native-panel-contract.json).

Exactly eighteen missing sprites are consumed:

| Use | HFX |
| --- | --- |
| Total Selected normal/pressed | 639 / 640 |
| Total Idle normal/pressed | 641 / 642 |
| Total Housed normal/pressed | 643 / 644 |
| Total Busy normal/pressed | 645 / 646 |
| Total Balloons normal/pressed | 647 / 648 |
| Total Boats normal/pressed | 653 / 654 |
| Class Boats silhouette | 655 |
| Class Selected/Idle/Housed/Busy silhouettes | 1084 / 1085 / 1086 / 1087 |
| Class Balloons silhouette | 1088 |

![Eighteen exact original sprites, nearest-neighbor enlarged for inspection](follower-task-panel/panel-sprite-contact-sheet.png)

The class columns use the **task silhouette**, not repeated follower portraits.
`004a0e70` chooses `1083+category`, categories 1–4. Total cells use their own normal
or pressed pairs. Vehicle renderer `004a1580` chooses 655/1088 for class cells,
while Total cells use the descriptor pair. Some artwork is 17/18px wide despite the
15px cell: do not crop it to the button rectangle. Native framing uses the existing
`005caba8/005cabc0/005cabd8` frame families with **34px** height, not the persistent
strip's 36px height. Background/frame uses original root renderer `004a1720`.

The following image is a reconstruction of **executed native draw requests** with
supplied raster consumers and synthetic counters. It is not a running-game or
browser screenshot. Original HFX and font pixels are retained.

![Native draw-request reconstruction with synthetic global counters](follower-task-panel/panel-global-normal.png)
![Native draw-request reconstruction with synthetic nearby counters](follower-task-panel/panel-nearby-normal.png)

## Task counts and enabled state

`004ecac0` rebuilds global task matrix at tribe+`0xaa5` (`0089dc6d` for player 0)
and nearby matrix at tribe+`0xb11` (`0089dcd9`). Each model owns six signed-short
buckets. Renderer uses category 1–4. Total row sums models 2–6 and excludes Shaman.
Nearby display is selected by tribe+`0x93d` bit `0x80`; radius is strictly less than
`0x2400000` squared toroidal position units (6,144 radius).

The producer requires an active registered person (`flags4 & 0x20000000`),
excludes Wildmen/model 1 and model 8, and excludes ghosts (`flags4 & 0x800`). It
adds the result of real classifier `004513e0`, then adds selected-bit `+0x7a & 0x80`
separately to bucket 1. A selected person can also be Idle/Housed/Busy: these rows
are not mutually exclusive totals. Some raw native state-table entries themselves
return category 1; crafted combinations can therefore double-count that bucket.
The probe preserves that arithmetic and does not claim every crafted state is
reachable during ordinary play.

Classifier `004513e0` uses the 46-state table at `005a6f78` (stride 5), state-10
command-status table at `005a7db8` (stride 22), state-21 inside-building descriptor
category (`005a725a`, stride 76), attached-vehicle `+0x9f` override and native
Preacher current-command predicate. A generic browser `inside` or `busy` Boolean
is insufficient evidence for these counts.

Class refresh `004a11e0` always shows a cell and enables it only when its **global
class total** is positive, independently of task count and nearby count. Zero live
class total clears the tooltip and disables the cell; a present class with zero
members in this particular task keeps its cell enabled. Total task controls have
no-op refresh `004a13b0`, not the class-live gate.

Vehicle counts are separate matrices: Boats at `0089dd9f/0089ddb1`, Balloons at
`0089ddc3/0089ddd5` (global/nearby). Static producer evidence counts occupied
vehicles with at least one matching passenger class, not passenger headcount.
The first checkpoint has not yet executed complete transport selection/count
ownership; do not claim that part from the task-row probe.

## Click and focus contracts

All task cells use left callback **`004a1240`** and right callback **`004a1340`**.
Key decoding is model=`key/5`, category=`key%5+1`. Left dispatch goes through
`00450f30` to actual command handler `0043e8e0`:

- ordinary click: command `0x7d`, nearest matching task/class follower;
- Ctrl: `0x72`, up to five through category-aware nearest selection;
- Shift: `0x54` for Total, `0x55` for one class; Shift takes precedence;
- Selected row ordinary click **deselects one**; Shift **deselects all matching**;
- Selected-row Ctrl is a verified native **no-op**, because the five command sets
  the already-selected bit rather than toggling it. Its tooltip does not advertise
  Ctrl. Do not invent Ctrl-deselect-five as an original behavior.

The persistent strip's assignment-priority search does **not** govern these task
cells: nonzero category branches directly from `00451720` to category-aware
`004518c0`. Same original input gates remain: overview mode, level lock, blocked
input, drag/press modes. Selection and deselection preserve unrelated person state.

Right click dispatches `004de810(model, category, shift)` and remembers a separate
person per **model+category** pair. It finds a nearest match, cycles native tribe
list order and wraps, respects nearby filtering, and lets Shift include reserved
people. It focuses camera and opens the person panel without changing selection
or orders. The current browser helper only implements category 0, so merely
reusing its existing signature would silently omit required task filtering/memory.

Vehicle rows have separate callbacks **`004a13c0/004a14b0`**, refresh `004a14e0`
and renderer `004a1580`. Their exact descriptor and renderer evidence is retained;
full vehicle command/focus proof remains explicitly separate at this checkpoint.

## Reproduction and acceptance

With the verified local prerequisites selected:

```
python scripts/check-native-followers-panel.py "$POPULOUS_EXE" --output work/orchestration/follower-task-panel/native
python scripts/capture-native-followers-panel.py "$POPULOUS_EXE" work/orchestration/follower-task-panel/native/render
```

Passed: 36 descriptors/root; 1,152 left callback/producer cases; 48 right callback
cases; 80 class-refresh cases; 194 native classifier cases; 36 complete task commands;
184 full native count rebuilds; 16 complete category focus cycles; four 36-cell
normal/pressed × global/nearby native renderer captures. The raster probe intercepts
coordinate adapters, CRT formatting, bank lookup and final raster queues. It executes
native frame/icon/font-placement routines. Only enabled pixels are reconstructed;
disabled diffuse is asserted absent rather than approximated.

No runtime source changes means browser checks, app typecheck/build and hardware
performance are not evidence for this research change and have not been run.
Original-game runtime screenshots, generic panel construction/state transitions,
complete transport command/focus behavior, disabled lower-cell raster, live browser
classification adapters and playable UI integration remain open. Those limits block
production/parity claims, not the scoped recovered evidence above.
