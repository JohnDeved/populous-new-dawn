# Mission 1 Vault acquisition and construction witness

Refs #23; bounded evidence for PR269. Continuation08 passed on QA `2bb0a161e0bff6227d11cb57e53ea41767f8590e`, with product `8348cad7ff47fd597bfbf84caa09135b24f339dd` and observer `91c9453061e92aa2ada4f4c170904b47c7e56a98`.

The [reviewed ordinary06 prefix](https://github.com/JohnDeved/populous-new-dawn/blob/90fc9022d65c1cb91cd73d6cdd2b400ef060b1b1/decomp/research/mission1-vault-marker-save-20261008/milestone.md) earned and cast Bridge, crossed, cleared the guard and saved the real nonzero-cursor checkpoint at turn946. This continuation used the existing public Load Game entry and that unchanged checkpoint, then completed Vault acquisition and home-island Warrior Training Hut construction. It did not replay or reconstruct the prefix.

## Actual acquisition

- Trusted command33 reached the original Shaman30 and authored Vault2 at turn1016: acknowledged target2, registered order14/model33/a2 and valid queued phase0 ownership.
- Birth occurred at turn1231 with body HFX1077, independent glow cursor0/latch0, phase6 and remaining82.
- The same clock counted one presentation visit, animationFrame568→569, before the first actual GPU render. Draw43's draw-before-step recurrence predicted cursor4/latch0/HFX1417; all three matched. The HFX1077 body and glow were visible, with no observer errors.
- Turn1237 was exactly the sixth subsequent visit: phase0, remaining76, body/glow group hidden and knowledge still absent.
- Turn1313 was exactly visit82: remaining1 and no knowledge before the visit, then camp knowledge unlocked and the gift removed. The original Shaman retained100HP after acquisition.

[First actual birth render](acquisition-birth-first-real-render.png) · [First render after six-visit hide](acquisition-retirement-first-real-render.png)

## Construction and Save/Load

Actual selected home-island Braves placed camp1023 at `(6.703125,33.078125)` through the public building menu. The observer retained eight cargo-to-log deliveries; construction was complete by the retained turn2174 observation with progress1, eight logs and260HP. Both gameplay observers restored their callbacks without errors.

[Completed Warrior Training Hut](home-island-camp-completed.png)

Save/Load equality covers the bounded recorded Mission 1 snapshot, including the glow cursor, Bridge/land state and original Shaman. The full checkpoint digest identifies committed storage only; no full loaded-World digest comparison was performed. Loaded glow cursor12/latch2 matched saved946. Its full stored digest remained unchanged at run end.

The terminal receipt passed at `2026-10-08T04:36:31.931Z`, with stable source/runtime, no runtime errors and verified cleanup/continuation. The outer command also passed with exit0 at `2026-10-08T04:36:34.657Z`. [Evidence and image hashes](evidence.json) retain exact source, checkpoint, callback, lifecycle and construction values.

## Preserved limits and failed attempts

Ordinary06 and continuation07 remain failed. Their successful observations retain their original scope. In07, birth initialized cursor/latch0 and the first rendered metadata showed cursor8/latch1/HFX1418 in the same turn. Its strict first-render1417 checker failed and did not retain a birth PNG. The repaired08 observer independently counts real clock presentation visits, then checks the exact cursor/latch/HFX and preserves pixels before assertions. It does not relabel07's observed1418.

This proves Mission1 authored camp asset, per-visit animation and display mapping through the ordinary06→saved946→08 path. It does not establish native global animation ownership, whole-frame scheduling/cadence parity, native final raster, hardware performance or a before/after browser comparison. Other issue23 Tower artwork remains open. No full mission/campaign completion or parity credit is claimed. No raw original archive, extracted game data or browser profile is published.
