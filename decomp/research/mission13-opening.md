# Mission 13 native opening findings

## Bounded question and prior knowledge

Establish the hash-verified Mission 13 level/header/scripts, active populations,
turn-zero state, opening message, first one-shot flyby, and authored knowledge links.
Stop before later AI, objectives, victory, Balloon construction/vehicles, or a whole-game
integration claim. Existing Mission 12 research supplied the initializer/interpreter
probe pattern; the reviewed campaign/flyby exports already cover every native routine
needed here, so Ghidra was not started and no new export was required.

Base commit: `6eb55b26c24a11693c43e9bc443ca762645e4d4e` (working tree clean at assignment start).

## Supplied inputs and tool provenance

| input | SHA-256 |
|---|---|
| `d3dpoptb.exe` | `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f` |
| `levels/levl2013.dat` | `5ad694a1f60e0df174ef300fb763d5fc1c48f4b520d1a743bdb1a4b930fc9c3f` |
| `levels/levl2013.hdr` | `aebcd04cce2e61b5d1c275c725b6ca448c66d67b1a71f168231414609b2f75f9` |
| `levels/cpscr029.dat` | `d5f2bfe673291a5a299efcb0b5f65e8e619465fad41efa0cc9a328a5658f407b` |
| `levels/cpscr030.dat` | `74226e5cc971c4d34898d6d464980726001694d2ed19734920a65971ed5ff10c` |
| `language/lang00.dat` | `e826c478746d666a3ea9ea36cb7804d1d226d5f83084230987b1de293066cf7d` |

The executable hash matches `decomp/tools.json`. The probe uses
`.tools/decomp/oracle/bin/python` (CPython 3.9.6, Unicorn 2.1.4), native initializer
`00461d70`, interpreter `0048c6b0`, dispatcher/handlers `0048cc60`, native message
allocation/opening, and the executable message table at `005ae310`. Existing manifest-
verified exports include `00461d70`, `0048c6b0`, `0048cc60`, `00430f30`, and flyby
`00448ec0`, `00448ee0`, `00449000`, `00449060`, `00449240`.

## Level populations, script mapping, and knowledge links

The header is 616 bytes, declares four tribe slots, and maps Red/Yellow/Green to
scripts `30/30/29`. Raw level records show that Red is absent. Active authored people
are Blue `6 Braves + 1 Shaman`, Yellow `6 + 1`, Green `6 + 1`, plus 146 neutral
Wildmen. Thus active Yellow shares `cpscr030` with the unused Red slot; Green uses
`cpscr029`.

Every authored class-6/model-6 knowledge trigger and its one-based level link decodes
as follows. Reward names use the already-reviewed building/spell model tables; the
links and positions are direct supplied-byte observations.

| trigger index / position | mode | linked record(s) | reward |
|---|---:|---|---|
| `5` / `(91,9)` | 4 | `4`: class 6/model 2, payload `(2,15)` | **Balloon Hut building knowledge** |
| `8` / `(-131,-59)` | 0 | `7`: class 6/model 2, payload `(11,8)` | Firestorm |
| `26` / `(19,55)` | 0 | `24` at `(17,55)`, payload `(11,19)` | Magical Shield |
| `30` / `(-43,-131)` | 0 | `27`: class 7/model 17; `28` at `(-47,-135)`, payload `(11,16)` | decorative co-link + Volcano |
| `264` / `(-23,59)` | 4 | `265`: class 6/model 2, payload `(11,14)` | Earthquake |

The model-15 payload proves authored Balloon Hut knowledge, not Balloon Hut
construction, Balloon production, boarding, flight, combat, or art.

## Exact native turn-zero state

Only active enemy tribes were executed. Both native scripts finish with
`states=0x1b8bef`, `flags=0x30`, marker value `0`, defence position `0`, defence radius
`11`, no task allocation, and unchanged simulation RNG `0x87654321`.

- Yellow / script 30: coordinate latch `(138,172)` / `0xac8a`; all 64 variables are
  zero. Nonzero attributes are
  `0=20,5=7,6=15,7=15,8=20,9=4,10=18,12=40,13=25,14=10,15=3,17=35,18=150,21=8,24=128,25=3,27=128,28=20,29=1,31=1,32=128,33=5,38=7,40=10,41=1,43=12`.
- Green / script 29: coordinate latch `(176,186)` / `0xbab0`; variable `1=10`, all
  others zero. Nonzero attributes are
  `0=30,5=5,6=20,7=20,8=20,9=4,10=18,12=40,13=25,14=2,15=2,17=35,18=125,20=8,24=128,25=3,27=128,28=20,29=1,31=1,32=64,33=4,37=7,40=15,41=1,43=12`.

The complete ordered setup/marker-entry command traces are in `probe-result.json`.

## Opening message and first bounded flyby/input schedule

Active Yellow script 30 words 287/290 execute opcode `1174(1)` then `1187` at turn
zero. Executable message 1 resolves to string 688:

> I sense a new threat an attack from the skies. I must make ready for the battle to come.

At 480-pixel height native state is slot 0, type 1, flags `0x20050`, lifetime 0,
speed 1205, sound `0xe3`; audio RNG advances `0x12345678 -> 0x32be789b` while simulation
RNG is unchanged. With level flag `0x01000000`, the message, sound, and audio RNG draw
are all suppressed.

Script 30 words `1655..<1808` are the first bounded time-dependent presentation
branch. Native `EVERY 7` includes signed tribe 2, so it fires at host turn **6**
(`7 & (turn + 2) == 0`), not turn 7. It sets variable 11 to 1; the next eligible
mask turn 14 is latched out, and no second visit occurs through turn 16. Ordered
commands are flyby on (`1208`), end `(248,58,350,0)` (`1214`), eight positions,
eight angles, eight zooms, then start (`1206`):

- positions: `(248,58,1,15)`, `(220,122,30,30)`, `(26,192,90,40)`,
  `(240,188,155,30)`, `(190,184,215,25)`, `(122,180,260,40)`,
  `(98,238,310,35)`, `(248,58,370,45)`;
- angles: `(600,1,35)`, `(1762,36,60)`, `(890,96,65)`, `(2000,161,45)`,
  `(1400,206,45)`, `(600,251,55)`, `(1300,306,75)`, `(350,381,34)`;
- zooms: `(-50,1,45)`, `(10,50,60)`, `(-40,115,35)`, `(0,155,45)`,
  `(-30,210,50)`, `(10,265,50)`, `(-40,320,50)`, `(0,375,40)`.

Existing reviewed flyby behavior turns this into 24 queued events, flags `0x15`,
six presentation-frame warmup, and input-lock mask `0x40` from `1206` until normal
completion or skip. The Mission 13 probe intercepts dispatch, so it proves native
turn/cadence/gate/order/arguments, not rendering or the UI input leaf. Native
near-target early input release remains outside the reviewed browser flyby owner.

## Supplied/intercepted leaves, unsupported integration, and limits

- Turn-zero executes native initializer, VM, command handlers, message state, and RNG.
  Only terminal audio playback `0048a050` is intercepted; cue and RNG are recorded.
- Flyby executes the native VM cadence and variable latch. `0048cc60` is intercepted
  to record/advance commands, so camera/render/input effects are not claimed here.
- Object/population/knowledge results are direct decodes of the hashed raw level;
  no native full-world object loader was run.
- No missing decoder/export blocks this slice. At final reinspection the parent's
  concurrent, unreviewed source diff had registered Mission 13, added the model-15
  `balloonHut` reward, extended the message allowlist, and bound exact Yellow words
  `1655..<1808` in `campaignRules`. Those parent-owned edits are outside this
  assignment and are not browser, checkpoint, or acceptance evidence.
- Script 29's later opcode `1096`, the scripts' later AI/attack/objective branches,
  victory, and natural completion remain unexamined. Community names are not proof.

## Runnable probe and result

```sh
.tools/decomp/oracle/bin/python \
  scripts/check-native-mission13-opening.py \
  work/orchestration/ceo-release/native-run/d3dpoptb.exe \
  --output work/orchestration/mission13-opening/native/probe-result.json
```

Exit `0`; stderr: `PASS: Mission 13 inputs, linked knowledge, turn-zero message, and turn-6 flyby`.

| artifact | SHA-256 |
|---|---|
| `check-native-mission13-opening.py` | `30dcf8f4c3ef94370c9f0e109847691b451dd45975a6546751c6b69fbd02f152` |
| `probe-result.json` | `983b8e6957274070fc97c2372aad9cb2043c126bb29210d9ef0c26d233ec88d7` |
| `probe-stderr.txt` | `eb2afb9a82d0e747ce77fa40572c7dc79e18bafaff660b2a581fb580574e69cf` |

## Live integration boundary

The bounded browser acceptance follows Mission 12 continuation into Mission 13 and
covers populations, linked knowledge, the message, variable-11 one-shot behavior,
flyby/input lock, movement, checkpoint/restart, and profile retention. It does not
claim later Mission 13 AI/objectives/victory or Balloon construction and behavior.
