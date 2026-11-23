# Mission 13 Green settlement (candidate)

This extends the reviewed Yellow settlement slice, not complete Mission 13 AI.
Green stayed at seven authored people with no buildings/tasks through turn 3000
in the retained baseline and Yellow-only witness. Its separate cpscr029 startup
enables construction, four concurrent tasks, housing capacity target 18 and zero
school targets. Schools, vehicles, later attacks and victory remain unqualified.

## Native and origin boundary

The Green script hash is
`d5f2bfe673291a5a299efcb0b5f65e8e619465fad41efa0cc9a328a5658f407b`.
The imported Green Shaman at (-73,63) gives immutable loaded origin `0xb8be`,
not Yellow `0xb47a` and not Green's Tower coordinate latch `0xbab0`.
The candidate uses team-aware immutable origins and admits the existing ordinary
Tower phase-3 base establishment for Green. Yellow's predicate outcome and origin
are unchanged; both tribes share the game's world/RNG; task-slot arrays remain tribe-local.

The separately reviewed `check-native-mission13-green-growth.py` executes actual
header setup, cpscr029, availability, producer 004e5580, capacity and allocation.
Nine controlled cases passed: loaded/stored/zero base origins, 0/1/2 workers,
completed capacity below/at target, and an unfinished Hut excluded from capacity.
Only available-worker count 004f67b0 is intercepted. Linked owners and base state
are supplied; this is not original actor loading, consumer execution, placement,
whole native settlement or timing proof.

## Retained diagnostic checkpoint

The first natural 3000-turn browser-runtime simulation produced Green's completed
Tower and six completed Huts, population17 and one additional pending Hut. Yellow
reached population18 with a Tower and seven completed Huts. No followers, stock,
buildings, clock or task state were injected.

The first 28 focused tests passed27; the old Yellow-only six-Hut final-count pin
failed (actual7). Full checkpoint replay equality through3000 passed before that
final assertion. Both tribes' origin/capacity/workforce/gating controls passed.
The failed receipt is retained. A subsequent read-only natural task-activation
trace observed Yellow's seventh Hut request at turn1470: three completed Huts
and two preparation plans counted capacity15, while another unfinished body was
excluded. Green's seventh request at2685 counted four complete Huts (capacity12),
excluding two unfinished bodies. The observer records inactive-to-active slot transitions, not same-tick reuse;
these are specific observed admissions, not an exhaustive allocation history.
Both requests were below the authored target18;
concurrent completions explain the later extra Hut. Construction consumes shared
RNG, so placement/timing changes with the now-active Green tribe; exact native
whole-world timing is not claimed. The final replay regression pins the actual
Yellow seven completed Huts and zero pending tasks, Green six completed Huts plus
one phase8 pending Hut, preserved births and full checkpoint equality. This is
not a relaxation of the native capacity/workforce gate tests.

## Ordinary rendered continuation

The reviewed local-render checker uses public Mission 13 controls and real RAF,
with read-only observations. At turn3000, Green had a completed Tower and six
completed Huts, one pending Hut and population17; Yellow had a Tower and seven
completed Huts with population18. Inspected temporal opening and completed images
show Green's actual settlement, not a baseline-code comparison.

Ordinary Save committed turn3010. After browser termination and restart, public
Load restored the exact complete checkpoint
`8dace5d11651909ea2808adaedbc9757541e67c8206ea1f2dc1e804f2d3ab3ee`
before normal resume at3035. Both receipts passed with no errors, unchanged source
fingerprints and verified cleanup. The loaded overhead image visibly retains the
settlement. This is software-WebGL local development rendering, not production
build, hardware performance, full mission or native rendered parity acceptance.

The 28 focused tests and nine controlled native cases passed. Standard Full,
production build and hosted qualification remain required. This candidate is based
on the Yellow branch and requires coordinated current-main composition.
