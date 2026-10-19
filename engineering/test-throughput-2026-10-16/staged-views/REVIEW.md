# Staged checkpoint comparison views

> Historical run artifacts referenced below are [retained at the pre-cleanup commit](https://github.com/JohnDeved/populous-new-dawn/tree/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/engineering/test-throughput-2026-10-16/staged-views), not in the current checkout. Source probes, fixtures, and findings remain tracked where applicable.

## Scope

Test-only follow-on to PR488. The staged Mission22 test has a distinct normalization policy: every comparison asserts shrine IDs102/120 at indices0/2, then defaults only an undefined reward at those indices to mana. It does not use rewardMana. Other shrine rewards remain untouched. The existing general mana-truthiness helper is unchanged.

A transient shallow comparison view preserves that policy and full deep equality. No cached world/expected result is introduced. All original replay ticks, 47 deepEqual call sites, 11 tick-call sites and five true checkpoint/branch cloning sites are preserved. The clone removed from the comparison normalizer is assertion preparation, not fixture creation.

## Coverage and structural count

Fresh: one initial comparison plus700 staged,1200 idle,300 Shift,400 successor comparisons =2601 comparisons/5202 whole-world assertion clones.
Historical: idle begins3653 and exits on the pinned first fight3886,233 ticks; total1+700+233+300+400=1634 comparisons/3268 clones.
Combined:8470 old assertion clones. Eight actual live/restored worlds per case receive one-time old-oracle domain checks,16 clones across both cases. Net structural reduction8454 clones; no bytes/time estimate.

## Domain and isolation

Each pair is validated immediately after checkpoint load and before comparison: world/restored, idle/idleReplay, departing/replay, successor/successorReplay. The previous clone-normalizer remains the independent setup oracle. It rejects incompatible starting aliases or data shapes. Views are used immediately and never mutated or retained.

This is scoped to the current headless Mission22 replay, not a generic structuredClone replacement. Independent source review found no persistent later normalized-shrine alias sink: linkedShrine promotion removes the link before tick returns; other stored targets use IDs or copied coordinates. Local shrine references used by assertions are not additional fields in World. Renderer caches are outside the headless World.

Six pure helper tests cover no mutation, exact reward defaults including zero/missing rewardMana, preservation of other shrine rewards, shared person/Map identity, unrelated nested Map/Set/typed-array/order differences with identical assertion diagnostics, view refresh, incompatible graph rejection, and indexed ID validation on every call. All six passed in168.859ms.

## Timing context

Existing accepted Full logs measured this unchanged file's two cases at48.747s/29.739s (PR484) and48.564s/30.935s (PR488). These are whole-case observations, not cloning profiles or controlled baseline measurements. No precise saving is claimed.

## Validation boundary

Isolated snapshot pinned to caae208c47536e31dbdb495c3fc785af8c7e68a8 with only staged test/helper overlaid. One180-second capped file run authorized after independent review and heavy-lane release. Raw TAP/stderr and before/after source/resource receipt are retained. No shared checkout edits or local full suite performed during this stage.

## Terminal result

Single candidate file finished2026-10-16T13:50:32.842518Z, exit0, both cases passed with no stderr/timeout and all source hashes stable. Wall47.459s, fresh31.805s/historical14.216s, maxRSS627364KiB. This validates the actual branch domain guards and preserved assertions; different-host historical measurements do not establish a controlled time saving.
