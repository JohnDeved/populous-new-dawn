# Simulation steps in F8 captures

Schema v1 adds optional frame-level `simulationSteps`: the number of actual logical
turn increments executed by this animation callback's `advanceGame` call. Missing
means unknown (older exports), not zero. Zero includes paused, land-paused, menu,
and no-fixed-turn callbacks; catch-up frames may have multiple advances. Animation
and worship UI visits and land-paused tick attempts do not count. The counter is
incremented at the existing logical-turn advance, independent of wrapping or reset
turn IDs; it never changes scheduling or checkpoint state. Failed callbacks do not
export a completed frame. Direct off-frame tick calls are outside this count.

Recording reuses a callback-local carrier and one numeric ring slot. With F8 off
there is no carrier allocation/reset, timer, or count update, only passing an
undefined optional argument and a branch at the existing turn increment. Menu and
new callbacks reset the carrier; ring/reset behavior retains unknown explicitly.

The offline cohort summary reports the count distribution without filling absent
values. This does not divide CPU time by turns or certify equal simulation work:
the CPU stage also includes presentation/animation and turns have varying work.
The separately frozen browser benchmark allowlist/classification is unchanged;
simulation remains observation-only until a separately reviewed protocol adopts
this field. The existing 2 MiB export/parser limit and schema version remain intact.
