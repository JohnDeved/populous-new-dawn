# Mission 12 native opening findings

## Bounded question

Establish the exact turn-zero setup and earliest time-dependent playable opening branch across `cpscr060/061/062`, including presentation, AI state/tasks, arguments, cadence/gates, RNG, and observable failures needed for one faithful opening slice. This stops before the later Mission 12 AI program.

Base commit: `7330e9c7fb842f584173cb9bef6bcc84468a852a` (working tree clean when research began).

## Supplied inputs and tool provenance

All observations use the assignment's adjacent, byte-verified files:

| input | SHA-256 |
|---|---|
| `d3dpoptb.exe` | `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f` |
| `levels/levl2012.dat` | `9e59947f8e4c9cbdbed386f432f4fca8f080f64c197bd99a5dc569beae05114b` |
| `levels/levl2012.hdr` | `d9d72fb5ee6e8bfbf1a19a6396e8d44b3caea928346622c2b398073c138a2184` |
| `levels/cpscr060.dat` | `e5644f4eaaa07469eab29f36efbb17d55943786a9c3095c0c367bedd543c8e5f` |
| `levels/cpscr061.dat` | `1e8b113de058229dff57234a1d2e259fc32b48cfee8e9f58a24936ceb5f47326` |
| `levels/cpscr062.dat` | `6fd69dd20a8a2087241bf66e4b9a6f97c6fbd4256d44d2846644ffff0643b306` |
| `language/lang00.dat` | `e826c478746d666a3ea9ea36cb7804d1d226d5f83084230987b1de293066cf7d` |

The runnable probe uses CPython 3.9.6, Unicorn 2.1.4, the native initializer `00461d70`, interpreter `0048c6b0`, command dispatcher/handlers, producer `004e5580`, and native task writer. New pseudocode was exported with `python3 scripts/decomp.py export ... --output work/orchestration/mission12-opening/native`, Ghidra 12.1.3 and its configured Java 21 runtime. Pseudocode is evidence, not recovered source; names not already established by native behavior are not promoted.

The header assigns tribe 1/2/3 to script 60/61/62 exactly.

## Exact turn-zero contract

All three native scripts terminate normally with AI `states=0x1b8fef`, `flags=0x120`, defence radius `7`, marker value `0`, ten inactive task slots, and no simulation-RNG draw. Attribute arrays are 48 bytes; every omitted index below is zero:

| tribe/script | nonzero `attribute[index]=value` | coordinate latch | defence position |
|---|---|---|---|
| 1 / 60 | `0=20,2=1,3=1,4=1,6=20,7=25,8=30,9=3,10=50,12=40,13=25,15=2,17=35,18=125,19=100,20=8,24=255,25=3,27=128,28=5,31=1,32=64,33=5,35=1,37=5,39=24,40=5,41=1,43=12` | `(218,200)` / `0xc8da` | `(226,214)` / `0xd6e2` |
| 2 / 61 | `0=20,1=1,5=5,6=20,7=20,8=20,9=4,10=18,12=30,13=30,14=2,15=2,16=10,17=40,18=125,19=100,20=8,24=128,25=3,27=128,28=20,29=1,31=1,32=64,33=4,35=1,37=7,40=20,41=1,43=12` | `(6,18)` / `0x1206` | `(6,18)` / `0x1206` |
| 3 / 62 | `0=20,2=1,6=20,7=20,8=20,9=4,10=18,12=34,13=34,14=2,15=2,17=34,18=125,19=100,20=8,24=255,25=3,27=128,28=20,29=1,31=1,32=64,33=4,37=7,40=5,41=1,43=12` | `(14,180)` / `0xb40e` | `(48,208)` / `0xd030` |

Scripted spell entries are:

- tribe 1: slot 0 `(model=3,mana=500000,range=128,people=3,mode=0)`; slot 1 `(4,100000,256,6,0)`.
- tribe 2: slot 0 `(7,250000,128,4,0)`.
- tribe 3: slot 0 `(3,600000,128,2,0)`; slot 1 `(7,250000,128,4,0)`.

Marker entries `(slot: primary,secondary,[quota0..3])` are tribe 1: `1:1,2,[0,0,4,0]`; `2:3,4,[0,0,4,0]`; `3:5,6,[0,2,4,1]`; `4:7,8,[0,4,1,2]`; `5:9,10,[0,4,1,2]`. Tribe 3: `1:16,17,[0,4,3,2]`; `2:18,19,[0,0,3,0]`; `3:20,21,[0,2,2,1]`; `4:22,23,[0,2,2,1]`. Tribe 2 has none.

The complete ordered opcode/argument trace is in `probe-result.json`. Three setup commands require explicit integration:

- Script 60 word 317, opcode 1138 `(tribe-selector 1119, 300000)`: native `004919e0` resolves the selector/value and calls the game's mana-add routine, so tribe 1 receives `+300000` mana.
- Words 324/328, opcode 1085 `(marker 77 -> variable 16)` and `(marker 78 -> variable 18)`: supplied header/terrain decode to marker 77 packed `0x02f2`, cell `(121,1)`, height `447`; marker 78 packed `0xf8fa`, cell `(125,124)`, height `0`.
- Word 332, opcode 1190 `(6,88,14)`: `00491350 -> 004f1fe0 -> 00499aa0` scans the wrapped 29x29 cell square and ORs byte `+0x7f` with `2` on every class-1/model-1 object. In the supplied level the exact object indices are `0,1,2,3,4,5,81,82,83,84,85,87,88,89,90,91,92,93,94,95` (20 objects). The downstream meaning of that object flag is not established here.

## Turn-zero presentation and failure gate

Script 60 words 337/340 execute opcode 1174 `(message 0)` then 1187 `(open)`. Message 0 resolves through the executable to language string 686:

> For the first time we must face all three Enemy tribes. I must prepare for a mighty struggle.

Native result at 480-pixel height: slot `0`, type `1`, flags `0x20050`, lifetime `0`, speed `1205`, sound cue `0xe3`. Audio RNG advances once, `0x12345678 -> 0x32be789b`; simulation RNG `0x87654321` is unchanged. If `levelFlags & 0x01000000`, allocation/open is suppressed: no slot, sound, or audio-RNG change (`0x12345678` remains), and the open helper receives no valid last slot. This is the exact no-presentation failure path.

## Earliest time-dependent playable branch

The earliest branch is the tribe-1 flyby at host turn `7`, before any AI construction producer. Its outer cadence is `(7 & (turn + 1)) == 0`; its inner gate is variable 25 equal to zero. Source words are `1318..<1449`. At turn 7 it executes, sets variable 25 to `1`, and leaves simulation RNG unchanged. Turn 15 satisfies the cadence again but the latch blocks every command; running through turn 16 records no second visit.

Exact command order/arguments:

1. flyby on (`1208`); end `(28,88,1500,0)` (`1214`).
2. positions (`1209`): `(28,88,1,15)`, `(238,18,40,30)`, `(222,210,130,25)`, `(22,156,180,25)`, `(48,202,210,25)`, `(28,88,275,25)`.
3. angles (`1210`): `(1232,1,45)`, `(1600,56,30)`, `(406,76,30)`, `(1142,106,30)`, `(2000,136,50)`, `(200,186,35)`, `(900,221,45)`, `(1500,266,34)`.
4. zooms (`1211`): `(-60,1,55)`, `(10,60,25)`, `(-30,90,45)`, `(0,145,50)`, `(-40,200,45)`, `(0,250,50)`.
5. flyby start (`1206`).

The established browser/native flyby representation is 20 events, flags `0x15`, warmup `6`, end `{x:28,y:88,angle:1500,zoom:0}`, with input-lock mask `0x40` while active.

## Earliest construction-producer branch and failure

Native producer cadence is `(turn + signedTribe + 1) & 63 == 0`: tribe 3 first at turn `60`, tribe 2 at `61`, tribe 1 at `62`. The supplied level contains exactly six Braves and one Shaman for each enemy. Calling native `004e5580` with those supplied facts allocates the first free task identically for all three: `flags=1,type=0,model=4` (Guard Tower), `exact=0,phase=0`, with origin at that tribe's current base:

| tribe | supplied Shaman object | base/origin | first turn |
|---|---:|---:|---:|
| 1 | 221 | `0xd0ee` | 62 |
| 2 | 195 | `0x12ee` | 61 |
| 3 | 182 | `0xb82a` | 60 |

Return is `1`; RNG remains `0x12345678`. With available Braves forced to zero, return is `0`, no task is active, and RNG remains `0x89abcdef`. This is the exact bounded producer failure path.

## Supplied/intercepted leaves and integration limits

- Turn-zero runs execute the native initializer, interpreter, and command handlers. Only audio playback is intercepted; message state and audio RNG execute natively.
- The flyby run executes the native interpreter/gates but intercepts `0048cc60` to record game-command calls. It proves command timing/order/arguments, not rendering.
- Producer runs execute native `004e5580` and the task write. `004f6020` current-base cell and `004f67b0` available-Brave count are intercepted, with values derived from the supplied raw level. The bare harness does not run full world loading/base ownership; live integration must obtain the origin and Brave count from the loaded world.
- Opcode 1190 target enumeration is a supplied-level static decode plus byte-verified routines. The harness did not load a complete native world object list, and this work does not establish the consumer of object flag bit `2`.
- No community symbol is treated as fact. No later Mission 12 AI branch, rendering behavior, campaign completion condition, or browser equivalence is claimed.

## Runnable probe and result

Run from the repository root:

```sh
.tools/decomp/oracle/bin/python scripts/check-native-mission12-opening.py work/orchestration/ceo-release/native-run/d3dpoptb.exe --output work/orchestration/mission12-opening/native/probe-result.json >/dev/null
```

Expected stderr: `PASS: Mission 12 startup, message/failure guard, first producers, and turn-7 flyby` and exit `0`.

| artifact | SHA-256 |
|---|---|
| `scripts/check-native-mission12-opening.py` | hash recorded by the current native check receipt |
| `probe-result.json` | `2921d845f78f7d4bb07cc394bd2964e6f4f9a4a7fc514f991ff05aaa7c8e8074` |
| `00491350.c` | `4aa85777a78709fd3d25b1692c1c76e493920f57683ed2268952ed3abf271279` |
| `004919e0.c` | `19e0b87401cca755b0c9bef93a4f78a3083e36da98c9e464fa6e7306c244aa5e` |
| `00499aa0.c` | `cab95906b765aed1e809a5f80f53aeab0ef7f15618bb32846279e7d3dfcde32c` |
| `004f1fe0.c` | `a5db7a08a014bf9612dbbc91fea03286c22d33d1aa47afe722546a4dbe647500` |
| `004f6020.c` | `21ada6683311b6a0b0a5f6030306ccee1262a8b7a6be0e630d5698a9c34fa8eb` |

## Proposed durable handoff and next implementation step

Parent review should promote this note to `decomp/research/mission12-opening.md`, the probe to `scripts/check-native-mission12-opening.py`, and only the five missing exports above to `decomp/generated/` plus `decomp/exports.json`; then index the note under the existing native-evidence headings. Existing exports already cover the initializer, interpreter, message/flyby handlers, producer, and task writer; no new exports are needed for this bounded slice.

The next implementation step is to encode the three scripts' exact turn-zero arrays/configuration and the one-shot turn-7 flyby in the live campaign path, use live loaded-world facts for the producer origins/counts, and add a browser check pairing message suppression, variable-25 one-shot behavior, flyby events, and turn-60/61/62 Guard Tower task allocation/failure. Keep opcode 1190's flag consumer explicitly unresolved unless its downstream use is traced.
