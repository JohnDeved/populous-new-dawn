# Ordinary Mission10 Guard driver: source preflight decision

**ACCEPT revision3 for parent-controlled runtime validation.** This accepts source
preflight only. No browser/server/profile/dependency operation, game simulation,
full gate or screenshot capture occurred in this review; no runtime PASS or lane
grant is implied.

Candidate `c20a297f5f815ce404f796b08f77ea56396f96da`, full tree
`9af7241660efc11eb8969845ab7e587231d906bc`; baseline
`3b899125cc8cedef938823718ad5d44f49957b66`. The frozen packet remains in
`work/orchestration/native-guard-browser-preparation/`:

| Input | SHA256 |
| --- | --- |
| scenario.mjs | `1889980ca4e2b9288e2f069708c6da0a3f3b3d263693152454fee94670d1d086` |
| observer.mjs | `e3b4ef888ed57f0035309ac79e9b5b81e1634f14a5eaf1418306fa1c69e75a95` |
| guard-assertions.mjs | `7f1298c189f113b04a6c30fc2d3b903c74f9d2e24a2c139c4f193c47db2c1160` |
| checkpoint-guard.mjs | `fd4b3c0f15b12591dee45ad75b0ff70c8a37bf818e437ff449819e5d6b1e438f` |
| plan.md | `d1607bdc68d133acb7970b233d704521316a6758dc2d2539533c7f018fbf9718` |
| preparation-receipt.json | `90624ba41e75cb149384aec317fec4e77a1b4ddfba7f05e6c073ff6c408bda6e` |

All receipt input hashes match. Prior unexecuted revisions1/2 are retained
byte-for-byte, including their receipts. The earlier baseline observer remains
unchanged. The [initial rejection](review-initial.md) is superseded for this revision.

## Repairs verified

Both initially identified gaps are closed. After accepted Move, candidate reads
and every drained RAF row enforce fixed Unit/native identities for both actors
and fixed scene/world/epoch identity. Raw batches are retained before rejection.
Pins can change only through verified UI Load; that path verifies captured saved
target/queue/native aliases, records explicit old/new identities, and validates
renderer-source ownership on the raw rebind snapshot before committing the pin.
It does not silently reset on mismatch.

Checkpoint comparisons now include native `target`. Adopted Guard requires the
actual current active command30/a and configured native target to name the Shaman.
Pending initial G may retain target0 before preparation; paused replacement and
cancellation retain their previously adopted target. Queued-but-inactive Guard
cannot satisfy adoption. Load allows subsequent phase/status/marker evolution
without claiming the first resumed tick was observed.

Independent execution of `verify-preparation.mjs` passed9 source/provenance/pure-
mock checks, including6 negative identity/target cases and the newly added bad-raw-
Load-source case. [Result](source-checks-revision-03.json) SHA256
`8135dbf2e644f4ef507a4a291daeacbd31111cf60b49edf62a964f2885c37d81`;
[stderr](source-checks-revision-03.stderr) is empty. These checks import no running
game and do not exercise browser behavior.

## Remaining runtime contract

The previously reviewed acquisition/input/storage/budget paths are unchanged:
real hut149 training at4000 mana, actual source-Brave removal and new Firewarrior ID,
ordinary selection/minimap/right-drag/canvas delivery, clone-only command context,
integer5×5 hit checks, model3 ground acceptance and fresh acknowledgement/marker.
Current-runtime imports, sequential awaited committed IDB readback, synchronous
pre-auto-resume replacement capture and fresh asynchronous post-Load observations
remain correctly separated. No actor, mana, clock, camera or controller injection
is present.

Launch must still use the specified fresh ephemeral1440×1000 context, exact tested
runtime/packet identities, shipped1× clock and300-second outer envelope. Fixed
(25,-9)/(25,-1) visibility/native-ground reachability, pointer delivery, training
duration, screenshot/action latency and both checkpoint cycles need actual browser
confirmation. A cap, missing sample or failed assertion is an incomplete/failed
attempt; do not stretch windows or relabel it as success.

Review actual screenshots as pixels; mesh/UV observations alone are insufficient.
This single naturally trained follower does not establish multi-person/shared/
busy/exhaustion gameplay, every native visit, historical phase continuity, original
visible pixels, browser-restart persistence or hardware performance. Ordinary
Mission10 success remains unproved until the authorized attempt completes.
