# Mission 3 recurring flyby

The supplied executable is SHA256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`;
the Mission 3 script remains SHA256
`d5dfcd826f77909a64cca03ca9d9e3d351d2a7cb3f63eb8ba811b59916e83601`.
The level and header hashes remain those recorded in
[the opening note](mission3-opening.md).

The self-contained recurring block is script codes `833..<984`. Its `EVERY`
condition is `(15 & (turn + sign8(tribe) + 31)) == 0`, so Chumara tribe 2 first
enters it on turn 15. It clears user variable 10, checks user variable 24,
executes the original flyby, then sets variable 24 to one. It performs no internal
reads and consumes no simulation RNG.

Native execution emitted 26 commands from `START_FLYBY` through `END_FLYBY`.
The native handlers produced 22 queued events, flags `0x15`, warmup 6, the end
camera `{x: 42, y: 166, angle: 1144, zoom: 0}`, and input-mask request `0x40`.
Re-evaluation on turn 31 emitted no commands because variable 24 was already one.
Only external leaf `004af0a0` was intercepted; the PopScript interpreter and
flyby handlers executed in the hash-verified native executable.

The browser executes exactly this bounded original block through ordinary Mission
3 turns and its existing flyby command adapter. The interval-profile block below
is also live; other later recurring blocks remain excluded because their
game-command hosts are unbound. This is not full Mission 3 script or AI parity.
Native mode-2 tooltip lookup also wraps byte coordinates that the current browser
lookup does not, so the later Vault callout is absent even though the flyby and
visible Skip introduction path run.

## Chumara settlement and first Preacher

Turn-zero producer attributes request one Tower and one Temple, with one active
construction task and no Warrior Training Hut or housing. Chumara producer
opportunities are turns `61,125,189,253,...`. Native `004e5580` first allocates a
type-0 Tower task at the Shaman cell, then a Temple from the accepted construction
base after the Tower completes; neither allocation consumes RNG.

Codes `308..<457` are not a construction profile. Opcode `1173` writes the active
tribe's spell-use interval byte at `tribe+0x53f+4*index` and leaves the separate
producer attribute table unchanged. The logical spell range is `0..21`; the native
handler does not bounds-check it, so the browser rejects indexes outside its live
spell array. Values truncate to one byte.

For Chumara, the block first executes on native turn 122. Population below 73 sets
intervals `{2:8,3:64,4:72,5:32,6:40,7:70,8:64,10:168,11:80,12:66,13:152,14:140,15:100,16:128,17:8,19:48}`;
population 73 or above halves that profile except for its authored values at 8 and
13. Native literals above 255 truncate. The browser now runs this exact block on
ordinary Mission 3 turns, preserves it in checkpoints, and consumes interval 17
through the existing successful-cast cooldown path as `8 << 6` turns.

The complete `729..<768` block runs for tribe 2 when `(turn+2)&15 == 0`. After a
Temple completes it sets housing target 15, requests person model 4 (Preacher)
through a type-6 Temple task, and sets user variable 23. Re-evaluation emits no
second request and consumes no RNG. The next free construction opportunity then
requests a Hut. The verified sequence is Tower → Temple → one Preacher → huts.

The focused native probe used the same executable and script hashes above plus
level SHA256 `eb239eabebbcde37c1e1633b149d48977cedf432348a12fc5ee6b4be74c049bf`
and header SHA256 `219dd7611a4e3f6c2d4e78620a4d5bb9cf61bf0e9c66c21b2b43b89c8ba4d3f0`.
It executed the interpreter, construction producer, explicit training allocation,
task writer, and construction-base/count helpers in the hash-verified executable.
Building availability, completed Temple id, population, and available people were
controlled leaves. The interval-profile probe supplied only the internal population
read; the interpreter, opcode dispatcher, spell constants, neighboring-state
preservation, and cooldown consumer ran natively. Terrain acceptance, worker
movement, timber, construction, Temple admission, and checkpoint restoration
require live browser evidence.

## Later-block reachability and PND02 boundary

A structured walk of the same imported script plus byte inspection of the existing
native dispatcher classified the later commands that were previously unresolved:

| Command | Ordinary reachability | Role |
| --- | --- | --- |
| `1168` | Every 32 turns from turn 30 while variable 20 is clear | Counts Blue state-23 conversion victims for an optional anti-preaching message. |
| `1074` | Every 128 turns from turn 123 after Chumara has a Preacher and population above eight | Allocates a delayed Chumara AI person task. |
| `1103` | The same schedule when Blue has at most three people near marker 7 or Chumara population is at least eight | Retargets qualifying Chumara AI orders. |
| later `1030(OFF)` | Every 32 turns from turn 30 once Chumara population exceeds fourteen | Disables an AI state bit during prolonged play. |

All four branches are reachable missing Mission 3 AI/tutorial parity, but none reads
or writes the objective, victory, reward, profile, or continuation state. The
rendered-control route accepted in `744ad67` wins Mission 3, records completion, and
offers Mission 4 while these later blocks remain excluded. They are therefore not
required for PND02 natural-completion acceptance and must not be added as isolated
command stubs. A later full-Mission-3 slice should bind `1168` with its state-23
consumer or one complete AI block containing `1074`/`1103`.

The classification used executable SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`,
the script/level/header hashes above, reviewed interpreter export `0048cc60`, and
byte inspection of `004913f0`, `004f21f0`, `004f4520`, and `004f3280`. No native
game run, Ghidra project, CrossOver bottle, fixture recording, or parity update was
used.
