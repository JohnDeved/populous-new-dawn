# Issue 225 driver and native-evidence addendum

2026-10-06. Clean source `55c684cd2c4cc80a7e06786e24f0d87f4a0a5cd5`.
**ACCEPT prepared driver source and updated bounded native receipt.** No source
repair requested. This supplements `implementation-review.md`; candidate browser
execution and the remaining integration/quality gates are still pending.

## Prepared browser driver

Verified original bytes directly from `cfdf764631ab42173b0b4191abdbdd3c34d0d1e5`,
`references/verification/authored-bridge-origin-2026-10-04/browser-candidate-02/candidate.mjs`.
Original SHA-256: `bb5caada25c5f1c440ae00fedb312ef28a744185f1d50c46308aca50c1a1226c`.
Candidate SHA-256: `3e8ad3a90e505fc4ea439f959aaf8d9e845c1c12eec70b271f3c130f55562aa5`.
The retained delta body exactly matches an independent text diff: 13 added lines,
zero removed lines, with the route/save/load/terrain-export operations unchanged.

The new helper creates a separate bridge and separate typed-array copies of the
previously captured terrain. It evaluates the unchanged initialization component
on those copies only; it cannot mutate the live world. Callback assertions forbid
initialization trails/notifications. The comparisons check every controller field
except its advancing turn, including endpoints, before and after ordinary Load.

The observed active controller can be past turn 1. These assertions establish
cache consistency and preservation along this ordinary route; they do not alone
distinguish immediate initialization from initialization on an earlier post-birth
pass. The failure-first component test and original producer proof own that claim.
Likewise, using the pre-activation terrain as the cache reference checks this
route's input stability; it is not an exact birth-time terrain observation. A
failure after intervening terrain changes would require diagnosis, not silently
weakening the assertion. The driver remains prepared, not run.

## Updated native receipt

`native-authored-command.json` SHA-256:
`4a450da5531fc1945a74a181356c08de8e28c39b4cacf505e4a51766457935a0`.
`native-authored.json` SHA-256:
`ca9b650034f8cd7ab7445be27894d806cc734676b583690c525637b08797438d`.

Verified terminal passed/exit 0, clean 55c684c source/sourceAfter identity, all 12
explicit input hashes and both terminal raw-log hashes. Five authored producers
complete 315 controller visits. No replay was run for this review.

Mission 2 activation and next-visit controller states, ordered trail requests and
changed/notification cell lists match the earlier reviewed proof exactly. To
compare differently encoded terrain hashes, reconstructed the full zero-flag
terrain records from the hash-bound Mission 2 DAT and applied the prior retained
height deltas. Both resulting full-buffer hashes match the new snapshots.

Both current RNG snapshots contain zero from this harness's startup state. They
are not the earlier proof's explicitly supplied nonzero seeds. The interception
list is identical. Real trail initialization/cosmetic draws, notification consumers,
allocation/world registration and sound execution remain excluded. Later mixed
links remain explicit bridge-only slices. This evidence makes no full-world RNG,
mixed-class scheduling, absolute-clock, pixel/audio or spell-cast claim.

Updated native-harness acceptance is now supported; generic bridge regression,
check/build, TypeScript quality and candidate rendered acceptance still need their
own source-bound results before merge. Reviewer activity was limited to source,
JSON, Git-object and hash reads plus this ignored review artifact.
