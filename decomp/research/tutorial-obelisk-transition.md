# Tutorial Obelisk transition

## Native stage-5 boundary

CPSCR057 words 2599–2647 run when stage 5 is outside World View. They force
marker 102, schedule the exact `1205/1209/1213/1210/1211/1211/1206` flyby, and set
stage 6. There is no selection or worship-success predicate in this branch.

Marker 102 (`0x08e4`) resolves to authored class-6/model-6 object 2. Reviewed
`004fbf40` force semantics and `004fb270` linked-object handling establish that its
ordered links materialize class-6/model-6 object 42 and colocated model-9 Obelisk
object 46, then retire the one-use source. The flyby points at that linked Obelisk.

Object 42 is mode 3 and the authored Blue Shaman is object 41. The exact admission
and completion controller is recorded below.

## Mode-3 worship controller (2026-09-17)

The hash-pinned executable and focused `FUN_0043bcc0` probe establish that command 27
rejects a non-model-7 person when the colocated class-6/model-6 head has flag `0x10`
at `+0x6d` or signed mode 3 at `+0x68`. A mode-3 Brave stops in substate 1 while the
Shaman enters substate 2; the same Brave is admitted by mode 0.

`FUN_004fb270` samples mode 3 only when `head+0x2e & 3 == 0` and counts eligible
class-1/model-7 people. Object 42 has required 1, target 10, and remaining 1. Its
tenth qualifying single-Shaman sample sets the separate short countdown at `+0x9e`
to 51 and immediately decrements it to 50. Fifty later controller invocations do not
require the Shaman. At zero the head becomes inactive, its links materialize, and
`FUN_004ef180` deletes the class-6/model-6 head.

CPSCR057 words 2573–2598 are the lesson opening rather than a completion reward:
when stage variable 9 is 6 and variable 7 is not 1, they disable highlight 16, show
message 150/string 1231, and set stage 9. Later word 1022 reads head 42 through
`1131(230,40,var5)`; word 1036 queries linked head 44. Browser routing, rendering,
audio, and later Tutorial transitions remain separate evidence boundaries.

## Reproduce and stop

With the hash-verified executable at `work/orchestration/ceo-release/native-run/d3dpoptb.exe`:

```sh
.tools/decomp/oracle/bin/python scripts/check-native-campaign.py \
  work/orchestration/ceo-release/native-run/d3dpoptb.exe
.tools/decomp/oracle/bin/python scripts/check-native-mission23.py \
  work/orchestration/ceo-release/native-run/d3dpoptb.exe
```

Both reusable probes pass for marker forcing and ordered linked-head/model-9 cloning.
EXE SHA256: `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.

The focused mode-3 probe is retained under ignored
`work/orchestration/tutorial-obelisk-worship/native/`; it passed without starting a
Ghidra process. The probes intercept allocation/copy/deletion and
presentation/audio leaves; they are not a native Tutorial playthrough or renderer
capture.
