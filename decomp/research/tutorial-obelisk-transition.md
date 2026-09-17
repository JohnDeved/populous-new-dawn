# Tutorial Obelisk transition

## Native stage-5 boundary

CPSCR057 words 2599–2647 run when stage 5 is outside World View. They force
marker 102, schedule the exact `1205/1209/1213/1210/1211/1211/1206` flyby, and set
stage 6. There is no selection or worship-success predicate in this branch.

Marker 102 (`0x08e4`) resolves to authored class-6/model-6 object 2. Reviewed
`004fbf40` force semantics and `004fb270` linked-object handling establish that its
ordered links materialize class-6/model-6 object 42 and colocated model-9 Obelisk
object 46, then retire the one-use source. The flyby points at that linked Obelisk.

Object 42 is mode 3: native admission is Shaman-only and completion has a separate
51-qualifying-visit delay. The authored Blue Shaman is object 41. This identifies the
participant but does not prove terrain reachability or completion of the worship
lesson.

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

Stop at stage 6 after word 2647. Words 2573–2598 begin the next lesson: disable
highlight 16, show message 150 (“Worshipping Obelisks…”), and jump to stage 9.
The probes intercept allocation/copy/deletion and presentation/audio leaves; they
are not a native Tutorial playthrough, renderer capture, or natural worship proof.
