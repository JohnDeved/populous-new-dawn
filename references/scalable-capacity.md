# Scalable capacity policy (first slice of #648)

New games from the shipped `createGameStore` default to `scalable` policy version
1. This removes the 200-person ceiling; it is **not** a supported FPS/population
tier or completion of the many-thousand-follower goal.

## Current behavior and native reference evidence

- Births retain `6 + completed, living Hut contributions` as their limit. Hut
  levels still contribute 3/5/7; the existing breeding-work bands and timers are
  unchanged. Scalable mode removes only the additional 200 ceiling.
- Convert Wild and Preacher replacement retain their original eligibility and
  scheduling. Classic mode caps ordinary recruitment at 200; scalable mode does
  not impose that ceiling. Recruitment is not housing-limited, as before.
- The original reserved Shaman population allowance remains one; ghosts and dead
  followers do not contribute to the ordinary population count.
- Direct `createWorld(mission, 'classic')` and its default remain the native/test
  reference path, not a shipping old-save or game-store option.
  Normal browser game creation calls `createGameStore()` and is scalable.
- New games, mission starts and restarts always use scalable policy. The shipping
  store accepts only the current v3 envelope with explicit scalable policy.
  Missing-policy, classic, and obsolete envelopes are incompatible: the UI
  explains this without deleting or overwriting the record. Campaign progress
  is read independently. See the [development save contract](../README.md#development-save-contract).

## Orders, identities and persistence

Scalable person orders grow from 800 records in 800-record chunks on exhaustion.
Record zero stays the sentinel. Group members continue to share records; eight
queued slots plus an immediate slot per person are unchanged. A staged allocation
reserves its chosen indices so eight distinct queued commands cannot alias a
single free record at wrap. Scalable references/active counts are safe integers,
not wrapping 16-bit counters. Classic pool allocation and arithmetic are retained.
The boarding-only release and computer attack validation consumers use the same
mode-aware domain.
The native scenery-clearing command-bit guard and formation low-byte test remain
classic-only: scalable queue indices are complete handles, not packed flags.

Campaign initialization retains authored identities and RNG. Before a scalable
world is published, the general allocation cursor is at least 1024. Later people,
effects and vehicles therefore do not consume the remaining 1–1023 terrain
building handles. Building allocation searches those low handles, including live
vehicles and linked heads in collision checks, and throws before changing the
world on exhaustion. The packed terrain/light representation is not widened.

New checkpoint writes use envelope version **3**, while the IndexedDB database
and campaign profile remain version 1. Obsolete development saves are rejected,
not migrated. Historical reconstruction lives only in the explicit test/research
fixture harness, never in the shipping reader. Full-graph cloning retains pool indices,
cursor, references and person aliases. Unknown policy versions/modes, mismatched
pool modes, invalid reference counts/active totals, mismatched queue ownership
(deduplicating registry/controller aliases), bad order handles and stale or
unsafe general-ID reservations fail validation. No load remaps IDs or resets RNG.

Demand-grown motion-route ownership is described separately in
[scalable motion routes](scalable-motion-routes.md). Its v3 checkpoint sidecar is
required for current shipping saves; missing ownership is rejected, not rebuilt.

## What is and is not established

Focused tests cover classic/scalable boundaries, actual store start/restart and
save/load, 1,000 distinct active order records, the 65,535 reference boundary, and
1,100 newly allocated followers followed by repeated terrain-handle construction.
The supplied flat-world diagnostic commands 256 live followers, requires every
one to move, and compares complete saved/restored worlds through 64 fixed turns.
Separate fixed-turn cases exercise actual Hut birth across 200 and live Preacher
replacement. These are supplied stress populations, not naturally grown campaign
completion or native evidence for a rule change.

Still separate limits/work:

- At most 1,023 packed terrain handles, shared with retained low-ID authored
  objects. This is not a universal follower/entity ID ceiling.
- Secondary effects retain 160 shared slots and their existing reserve/exhaustion
  rules. Timber searches retain 120 cache records, signed-byte indices and their
  existing scheduling budget. Neither pool is silently enlarged here.
- Pathfinding node/request budgets, eight-slot queues, authored AI thresholds,
  native numeric payloads, combat/mana counters and all other native consumers
  still need tier-specific auditing. Coordinate/angle masks are not entity caps.
- The existing HUD emits full decimal counts but large-count layout is unmeasured.
- No 1,000/5,000/10,000-active mixed combat/building/spell workload, matched frame
  timing, GPU timing, memory/GC profile, browser visual QA or hardware FPS claim
  is established by this slice. Effects/cache failure must be reported in those
  workloads, not treated as a successful partial simulation.

The scalable policy is enabled for normal new games, while issue #648 remains
open for measured tiers and the remaining pool/ID/render/simulation work.
