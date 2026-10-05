# Ordinary spell reward: missing screen acquisition handoff

Issue #30; read-only gameplay research at main
`dcfb0dc2afe3e2501f964b109933e43d8bdbd451`, 2026-10-05.
This note corrects the completeness boundary of
[worship-acquisition-vfx.md](worship-acquisition-vfx.md). The existing world body,
glow, and six reward-object visits are supported. The old fixed-82 payout claim
excludes the local-player UI consumer and does not establish the full ordinary
spell acquisition sequence. No runtime, asset, fixture, or parity change is made.

## Three findings

1. **The phase-zero handoff is missing in the browser.** Original
   [004facf0](../generated/004facf0.c) decrements reward `+0x7f` from 1 to 0 on
   object visit 6. It hides the body, calls `00481550(reward)` when recipient
   `+0x7e` equals player `0089c6f0`, and removes the linked glow. The timer at
   `+0x7a` is 77 at the callback and 76 after that visit's decrement. For reward
   class `+0x7c == 11`, the dispatcher calls `004841b0` and `00481490`. The first
   starts a spell-specific screen controller at `0098c5a8`; the second starts a
   companion screen controller at `00988a88`. Current
   [world-turn.ts](../../app/world-turn.ts) only decrements `gift.phase`, and
   [scene-effects.ts](../../app/scene-effects.ts) hides the body/glow. Neither
   calls a corresponding screen acquisition consumer.

2. **The omitted controller can advance the reward deadline.** Real
   [00480ea0](../generated/00480ea0.c) invokes `00484320` for the active spell
   controller. Its arrival branch `004846e2..00484729` checks land flags
   `0089c661 & 8`, resolves the saved reward handle at controller `+0x69`, rejects
   removed/class-zero/non-class6/non-model2 records, and clamps a timer above 1
   to 1. It does not award stock. The next original `004facf0` visit grants the
   shot and gift counter and removes the reward. For the supplied visible start
   `(420,180)` and real 640x480 HUD rectangles, Lightning/Tornado first clamp on
   UI visit 28 and Bridge on visit 29; all three controllers retire on UI visit
   31. These are controller visits, not simulation turns or browser RAF counts.
   The browser instead always waits for its 82nd gift visit and emits grounded
   `birth`, whose effect helper uses draw 41/HFX1441 for 16 turns. The executed
   native payout makes no extra world-effect allocation. That browser birth is
   not a substitute for the omitted screen sequence.

3. **The original controller is coupled to a separately limited draw loop.**
   `00484320` increments its dword `+4` once per update at `0048480a`, without an
   elapsed-time input. Pause bit 2 skips time/motion; a pending phase transition
   is consumed before that test, so the first paused call can advance `+0x0f`
   and clear `+0x13` without moving. [00522570](../generated/00522570.c), verified
   against instructions `0052273d..0052276b`, calls `00480ea0(1)` before HUD and
   `00480ea0(0)` after HUD. Only the latter visits this controller. The scheduler
   requests limiter bit 4 through `0049cf90(4)` while any acquisition controller
   is active. Original bytes show this ORs `0096ead4`; `0049cfa0` clears bits.
   [0049cfe0](../generated/0049cfe0.c) selects 60 by default, 24 for bit 1, 20
   for bit 4, then 14 for bit 2, in that priority order. [004a4450](../generated/004a4450.c)
   samples `GetTickCount` before each main-loop iteration and waits against the
   computed deadline afterward. [0049cfc0](../generated/0049cfc0.c) selects that
   deadline only for interface 2 and nonzero limiter flags; otherwise a separate
   byte `0089ce62` controls pacing. [004a4960](../generated/004a4960.c) also gates
   drawing on window activation and other state. Thus bit 4 ordinarily requests
   a 20-FPS presentation deadline; this is not an unconditional exact 20-Hz clock.
   The isolated probe intercepts the limiter setters, so pacing is source/byte
   evidence, not an executed wall-clock proof. No modern timing constant is chosen.

The bounded source-only bit-2 caller lookup finds direct setters in the RDDATA
recorded-game/montage start, restart and cleanup family: `004b2700`, `004b2d20`,
[004b30e0](../generated/004b30e0.c), [004b36e0](../generated/004b36e0.c),
[004b3920](../generated/004b3920.c), and `004b4370`. For example, `004b36e0`
sets limiter bit 2, saves the session rate, changes it to 14, and loads the RDDATA
montage; its failure/finish paths clear the bit. The existing
[Rolling Demo entry evidence](demo131-entry.md#rolling-demo-exact-remaining-provenance-boundary)
binds that family to recorded playback. The acquisition setter preserves other
limiter bits, and neither the local-recipient handoff nor `00484320` rejects bit 2.
Therefore simultaneous recorded-playback and acquisition state is allowed by
these consumers and would select 14 FPS. No bit-2 producer was found in the
ordinary unrecorded Mission 1–2 worship path. A naturally reached recording of
those exact heads, all possible serialized flags, and indirect writers were not
proved by this bounded lookup; do not erase that qualification or claim every
acquisition necessarily uses 20 FPS.

## Source placement and authored boundary

`00481900` uses the reward's renderer-written signed screen coordinates
`+0x68/+0x6a` only when object render flag bit 1 is set and both coordinates are
strictly inside the current viewport. An edge, an offscreen coordinate, or a clear
visible bit uses the midpoint returned by `0044b770`. The viewport fixture is
`(100,0,540,480)`, giving fallback `(370,240)`. These supplied rendered coordinates
do not prove original world projection.

`004841b0` stores the model at controller `+0x80` and gift handle at `+0x69`, calls
the spell-panel opener `0044bb30`, and uses `0044be00`'s rectangle midpoint as
destination `+0x6b/+0x6d`. The probe executes the original spell-panel constructor
`0044c650(2)`, child constructors/refresh, model-slot resolver `004c2fe0`, and actual
rectangle lookup. Only the existing main panel's occupied root slot is supplied.
Original 640x480 results:

| Model | Rectangle x1,y1,x2,y2 | Destination |
| --- | --- | --- |
| 3 Lightning | 65,343,96,386 | 80,364 |
| 4 Tornado | 33,299,64,342 | 48,320 |
| 12 Bridge | 33,343,64,386 | 48,364 |

The spell controller expands/rotates the spell body while moving via a center
stage toward that control, then shrinks it. Source `00484870` selects the same
spell-descriptor body object `005a80de + model*62`. The native scheduler also
requests six pulse frames starting at HFX1288 at the destination. Complete
companion-controller and final-pixel evidence remains separate; the probe records
spell raster arguments but supplies its raster function.

Raw supplied level records at offset `0x14043`, stride 55, narrow reachability:

- Mission 1 head 28 at `(11,1)` links reward 29 with settings `[11,3,3,1]`.
- Mission 1 head 30 at `(-5,25)` links reward 31 with `[11,12,3,1]`.
- Mission 2 ordinary head 63 at `(-59,-105)` links reward 62 with `[11,4,3,1]`.
- Mission 2 head 25 is a distinct mode-4 Vault, linked spell model 5/grant mode 1;
  it is outside this ordinary mode-0 implementation proposal.
- Mission 3 has no class-11 reward linked from a class6/model6 worship head in
  its 2,000 raw records. Its building-knowledge path must not be called an
  ordinary spell-grant variant.

Current live import is [world-initialization.ts](../../app/world-initialization.ts):
linked class6/model2 sources become spell rewards via `linkedReward`. The ordinary
`stepWorship` completion branch in `world-turn.ts` invokes `createGift`, which
sets phase 6/timer 82 at the head. The retained
[normal command-path regression](../../tests/worship-acquisition-vfx.test.mjs)
reaches the actual Mission 1 Bridge head; its existing assertion of fixed-82 stock
timing does not exercise the omitted original UI consumer.

## Bounded executable proof and limits

Run the new [probe](../../scripts/probe-native-worship-grant-handoff.py) with a
fresh ignored output directory:

```sh
timeout --signal=TERM --kill-after=2s 20s python -B \
  scripts/probe-native-worship-grant-handoff.py "$POPULOUS_EXE" \
  --output work/orchestration/worship-grant-handoff/native-check
```

The frozen 17-case probe SHA-256 is
`23eea61d2b1060260083d54557108d13f737e9cc807e7313ba18cefa6667f50e`.
It passed with exit 0 in 0.85 seconds wall on the current Linux executor. Cases
cover three ordinary models; visible, invisible, outside and exact-edge sources;
bit-8 arrival suppression; glow allocation failure; nonlocal and 255 recipients;
pause instruction ordering; absent, removed, wrong-class and wrong-model saved
reward handles; and an already-one timer. Local arrivals additionally execute the
next reward visit and verify one stock/gift award plus removal, with no new glow.
The source stays frozen; the pacing audit did not alter that matrix.

Every call guards the complete mapped original search table, all 244 configured
constant targets, and all five read-only PE regions before and after execution;
setup also guards them. Inputs:

| Input | SHA-256 |
| --- | --- |
| d3dpoptb.exe | 3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f |
| data/mwsearch.dat | 0c39b12d160658863c2df89aa34484dff459e48ea0b5634658b7473ca940fae0 |
| levels/levl2001.dat | 97cdb6e170f68b462b5b36c42c99a598b0466e0131a105f30612f50d7f16e40c |
| levels/levl2002.dat | 83f5c446975398b163ef00526567f7a86b2666d26f9f026231ec0b36bf5a289f |
| levels/levl2003.dat | eb239eabebbcde37c1e1633b149d48977cedf432348a12fc5ee6b4be74c049bf |

`constant.dat` is checked by `configure_native_constants`; HFX metadata is checked
against the retained `original-hud.json` hash. Original-byte execution uses
Unicorn 2.1.4; new static disassembly uses system GNU objdump. No Ghidra job ran.
New instruction ranges were inspected directly in the pinned executable; existing
reviewed exports provide the processor, scheduler and outer-loop context.

Supplied/intercepted boundaries are explicit in the probe and result:
`004ed8a0` glow storage/failure; `004edcf0/004ef180` removal bookkeeping;
`004010b0` sunlight; `0048a050/0048a810` sound device;
`0044b770` landscape rectangle; `0044b130` panel refresh after actual construction;
`00479f00` display request; `00484870` spell raster; `00482290` companion processor;
`00516270/005162e0` palette/pulse raster; `0049cf90/0049cfa0` limiter setters;
and `004811a0` arrival UI. Nothing intercepts `004facf0`, its class-11 handoff,
the spell controller, original movement/distance/angle arithmetic, or stock grants.
The render-loop callback and reward-object visits are intentionally separate.

Two failed harness attempts are retained privately with exact sources/logs: the
first omitted the correct palette/pulse raster leaf, and the second incorrectly
expected pause to precede pending phase advancement. The final assertions follow
original instruction order. They did not require a native-code change or relaxed
runtime acceptance. Failed artifacts and game/tool binaries are not part of this
published research source. Native helper composition is not original-game replay,
current rendered parity, natural wall-clock timing, or hardware performance.

## Smallest implementation boundary and acceptance

Keep the repair on the ordinary local-player class-11 phase-1-to-0 gift boundary.
Reuse original spell body/pulse assets and existing world/presentation ownership.
Represent enough controller state to survive checkpoints, use the real rendered
source and current spell-control destination, and request `remaining = 1` through
the proved arrival gate. The next ordinary gift turn must remain the sole stock
award/deletion owner. Remove or replace only the unsupported ordinary-spell payout
birth; mana, building knowledge, mode-4 Vaults, Shaman death and later casts remain
outside this slice. No second world completion effect or new generic framework is
supported by this evidence.

Before implementation, finish the companion `00482290` and final raster contract;
review any elapsed-time modernization against limiter overlap, the first-frame
deadline boundary, pause ordering and source/HUD coordinate ownership. Do not
translate UI visits directly into 12-Hz turns, the existing 24-Hz animation clock,
or browser RAF frames. Acceptance must include ordinary Mission 1 worship (Bridge
and Lightning), Mission 2 Tornado, actual rendered start/center/target behavior,
cue/cleanup/arrival timing, cap and gift-counter preservation, checkpoint before
and during handoff, no replay or duplicate award, and equivalent elapsed behavior
at 30/60/120/144 Hz plus irregular frames. No code change or parity credit is
justified until those open presentation/timing boundaries are resolved.
