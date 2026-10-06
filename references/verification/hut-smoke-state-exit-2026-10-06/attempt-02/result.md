# Attempt 02: one native ignition/root-release composition passed

The separately authorized corrected case passed at source
`2136f8df17d1e46d9a3d75f984af98898e8d5eef`, probe SHA-256
`ef2f20f3547ebf313fd95c2381ce6e4d1568a9a9788243bcac571d45ce78da55`.
The [independent result review](result-review.md) ACCEPTS this bounded original-byte
component result. It is not a live-runtime comparison, rendered witness or gameplay fix.

The [terminal receipt](receipt.json) records exit 0, unchanged frozen fingerprints,
and no remaining owned process-group members. Exact start/end were
`2026-10-06T21:39:01.622159Z`–`2026-10-06T21:39:01.856394Z` (0.233879 seconds).
CPU4 was released on terminal. The same 30-second timeout plus 5-second kill
grace, 20 CPU-second limit, 1GiB address-space limit and 64MiB TCG buffer applied.
Those elapsed times are receipts of the guarded run, not performance measurements.

## Observed native ownership

The [raw result](stdout.json) retains the actual writes and records:

- Ignition entered state4 with burn timer127 and all three resident identities
  and records unchanged.
- Retained root index1999, pointer `009379e5`, reached the real `004ef180`
  destructor and `004ed530` unlink. Its class changed to0, secondary count
  changed2→1, and it became the free-list head. The free list contains159 valid
  slots; the allocated list contains only child index1998 at `00937932`.
- At original instruction `00403254`, the observer confirmed class0/count1/free
  head **after** the real destructor returned and **before** the building's
  `+0x92` handle was zeroed. The subsequent write cleared that handle. This is
  actual deletion/list composition, beyond merely observing a release request.
- The child retained identity, class/model/substate, sprite fields, position
  `(8192,12288,400)` and lifetime9 through ignition. Only adjacent-list bytes
  changed. The later real secondary pass visited only that child, advancing
  counter37→38 and lifetime9→8 without changing its frame or position.
- Root visits, replacement emissions and unexpected resident/cell-unlink calls
  did not occur. The source assertions and watched-write log retain the unchanged
  class-7 seed37, cosmetic RNG123 and gameplay RNG456.

Six supplied fire-allocation requests were logged before assertion in
[stderr](stderr.txt). Each raw owner DWORD was33554432 (`02000000`), while its
decoded tribe byte was0; class/model were5/10 and the full point pointer was
34590664. This establishes the corrected ABI interpretation for this run.
It does not reconstruct values missing from the separate failed first attempt.

## Supplied boundaries and unchanged first attempt

Root/child history and resident initialization are fixture inputs. The two setup
model initializers, deterministic terrain height384, sunlight bookkeeping and
all class5/model10 allocation failures remain supplied exactly as reviewed.
The real burn initializer, class-2 common cleanup tail, destructor, secondary
list return and subsequent child visit execute original bytes. Successful fire
production, real admission, whole-game allocation, elapsed/raster cadence and
ordinary Lightning acquisition remain outside this result.

[Attempt 01](../attempt-01/result.md) remains a failed ABI checker with no root
result. Its source, raw output and terminal receipt are unchanged. Attempt 02
used a fresh output directory and a separate explicit grant; no automatic retry
or further native run occurred.

## Resource admission note

A response-trigger owner had already admitted an earlier CPU4 Node check before
receiving this new reservation. Its verified receipt interval was
`2026-10-06T21:38:31.754Z`–`2026-10-06T21:38:34.819Z`, so the two recorded runs
did not overlap. Its receipt SHA-256 is
`e0282865134f13f810ceb2d09cb00eceb995ca4b646500873573872ef3511eaf`.
The exact source path and comparison are retained in `scheduling.json`.
No wider machine-idleness or CPU-exclusivity claim is made.

The [accepted correction review](abi-correction-review.md), exact
[probe](source-probe.py), [source/input/tool manifest](source-manifest.json),
[bounded launcher](source-launch.json) and [host receipt owner](host-one-case.py)
are retained. No original EXE, asset data, installed dependency or tool binary is
included. The next step is separate review and bounded execution of the production-caller
comparison. No runtime correction follows from this result alone; the ordinary
Mission1 input witness remains separately required.
