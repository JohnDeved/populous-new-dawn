# Accepted production-caller failure before the correction

The one granted run at `0105ddd7bfd86c0c36071fd02cc985824a704ce3` reaches the
expected final assertion: actual mode2/RNG1607832750 versus reviewed native
mode0/RNG3603658299. The independent reviewer **ACCEPTED this failure-first proof**.
The regression itself exited1; it did not pass, and this evidence includes no fix.

Three real `stepLivePreaching` visits complete, including the private five-listener
scan and its real RNG copyback, followed by three Preacher-only updater calls.
Both real acquisition visits, earlier controller assertions and every unrelated
world guard pass. The final mode/RNG assertion is the sole failure. All13 retained
snapshots preserve the five listeners, and independent comparison of nine mapped
phases finds only the known terminal mode and simulation-word differences.

The run used CPU4, a512MiB heap and a15-second TERM bound plus3-second cleanup.
It exited after2.027489seconds with empty stderr and no remaining owned process
group members. All218 source/input hashes plus Node match before and after.
No retry or additional application/native/browser run was performed.

- [Independent result review](result-review/review.md)
- [Independent verification](result-review/verification.json)
- [Exact source review](source-review/review.md)
- [Raw receipt and command](run-01/receipt.json)
- [All retained phase rows](run-01/rows.json)
- [Unedited test output](run-01/stdout.txt)
- [Native row comparison](run-01/native-row-comparison.json)
- [Preservation manifest](preservation.json)

Every raw file and review is copied byte-for-byte. The original raw manifest's
pending-review label is preserved; the later independent acceptance is recorded
separately. Execution belongs to source0105ddd7, not this evidence-only commit.
Test, fixture and application bytes are unchanged.

This proves the supplied six-person production-caller prerequisite. It does not
establish ordinary five-listener acquisition history, complete native physics or
world scheduling, rendering, fresh conversion, ghost/Bloodlust behavior, mode1/2
native execution, or command32 parity. The separate implementation owner can now
carry this failing regression into the reviewed one-condition cutoff repair.
