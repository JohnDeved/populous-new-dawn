# Ordinary acquisition: second-gift replacement

Issue #30; separate proof-only extension after the accepted
[handoff](worship-grant-handoff.md) and [presentation](worship-grant-presentation.md)
research in PR #208. Those two probes and their receipts are unchanged.

## Dynamic result

The three bounded original-byte cases confirm **replacement**, not a queue or
independent flight slots. Each starts ordinary Bridge acquisition, then hands off
a distinct Lightning gift at UI visit 10, 26 or 30. The second original
`00481550 → 004841b0/00481490` call resets the singleton spell and companion
state, installs new handle 902/model 3 in place of handle 900/model 12, and keeps
the old gift's remaining timer unchanged.

| Replacement boundary | Older timer at replacement | Existing pulse | Older payout |
| --- | --- | --- | --- |
| UI visit 10 | 76 | inactive | Own unchanged 76-object-visit countdown |
| UI visit 26 | 76 | active | Own unchanged 76-object-visit countdown |
| UI visit 30 | 1 | active | Its own next object visit, while the new controller is active |

All 25 pulse-state bytes at `00988a68` are identical immediately before/after the
replacement handoff. Later original UI updates can legitimately move/reinitialize
and retire that pulse. The new controller only clamps its new saved gift handle;
it does not revive the old flight or clamp the older timer. New companion, spell
and pulse presentation finishes after 34 new UI visits in all three cases.

Actual `004facf0` visits execute the stock/gift updates for both records. The
post-clamp older gift awards one Bridge shot and one gift count immediately on
its next object visit, while the new Lightning gift remains pending at 76.
Lightning awards only after its own new arrival clamp. For the other two cases,
the old Bridge gift independently completes its untouched countdown later.
Both packed counters end at `0x11`; each record requests deletion exactly once.
An additional inactive UI visit causes no repeated award. Gameplay RNG remains
unchanged throughout; original presentation uses the existing cosmetic stream.

## Reproduction and frozen evidence

[probe-native-worship-grant-replacement.py](../../scripts/probe-native-worship-grant-replacement.py)
SHA-256 `3b21c881745c7c04cf0fd7ba2fa241f83558ca7302def7d3225c6d0b7d9c0444`.
The first run passed all three cases under a 20-second private-process timeout;
the probe reports 3.130 seconds before receipt serialization. Raw result SHA-256:
`1436642482fb5e5297fceff03374822ca73a68875239182e082f656e4bb7d343`.

```sh
timeout --signal=TERM --kill-after=2s 20s python -B \
  scripts/probe-native-worship-grant-replacement.py "$POPULOUS_EXE" \
  --output work/orchestration/worship-grant-replacement/native-check
```

The original PE/search/constant/HFX/palette/AL identities and full immutable-region
guards are reused from the accepted presentation proof. No new gameplay-owning
intercept is introduced: `004ef180` deletion bookkeeping is supplied as already
disclosed in the accepted first handoff proof; the real reward timer, shot/gift
arithmetic and original UI controllers execute unchanged. Sprite/raster, clip,
device, rendered-origin and main-panel fixture boundaries remain explicit in the
prior note and the result. The source keeps that harness self-contained.

These tests intentionally separate UI visits from object visits. They do not
measure natural frame/object cadence, prove simultaneous worship-head ordering,
execute global object-list removal, provide native GPU pixels or implement a
browser adapter. The fixture starts at an already initialized phase-zero reward;
the accepted first proof owns the ordinary producer-to-handoff edge. This result
only closes the required dynamic replacement/payout boundary before considering
an elapsed-time, HUD-coordinate, pause/checkpoint and resize adapter.
