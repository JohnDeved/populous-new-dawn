# Early mission AI: Mission 3 periodic raid

## Complete authored path

Mission 3 CPSCR012 SHA256
`d5dfcd826f77909a64cca03ca9d9e3d351d2a7cb3f63eb8ba811b59916e83601`
contains a complete raid block at code words `796..<833`. The ordinary campaign
adapter previously omitted it, and its ATTACK adapter rejected the authored shape.
Both entry points are now bound without changing the script data or population.

The block tests `2047 & (turn + signed tribe) == 0`. For Chumara tribe 2 its
opportunities are turns 2046, 4094, etc. It requires Blue Warriors >2, Blue total
population >30 and Chumara total population >25. Its command is a three-person
normal attack against Blue, any building, damage threshold 8, no spells, and
options `[0,-1,-1,-1]`. Turn-zero away percentages select three Braves, not three
Warriors. Existing target selection, recruitment, movement and combat consumers
execute the request.

## Native evidence

Run `python scripts/check-native-early-mission-ai.py /path/to/d3dpoptb.exe` with
Unicorn installed and the adjacent `levels/cpscr012.dat`. The script verifies
executable SHA256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`
and the source script before executing isolated original instructions.

Seven paired native/portable cases cover adjacent schedule turns, all three strict
population boundaries, the first accepted opportunity and its recurrence. Native
`0048c6b0` interprets the entire block; `0048f350` resolves operands and the native
ATTACK dispatcher decodes the arguments. Only the three world population reads
and attack allocator `004e5fd0` are intercepted. The observed allocator arguments
are `[Chumara,Blue,3,1,0,8,0,0,0,0,0,0xffffffff,511,0xffffffff]`; the penultimate
raw `-1` marker operand becomes packed position 511 in the original decoder.
No RNG changes before the intercepted allocation. This probe does not certify
native target search, recruitment, pathfinding or combat integration.

## Natural simulation acceptance

`tests/early-mission-ai.test.mjs` starts shipped Mission 3, waits for real births,
builds three Huts and a Warrior Training Hut with selected Braves, grows Blue
past 30 people, and trains three Warriors through ordinary building admission.
Chumara independently builds/grows past 25 people. The next authored script
opportunity creates the correct raid, recruits three existing Braves, issues
movement orders and reaches real combat. The defending Blue tribe kills all
three raiders in this scenario, rather than the test forcing building damage or
victory. Raid checkpoint migration preserves task state and the next 100 turns'
queue/RNG behavior without adding a duplicate request.

These are Node executions of the shipped simulation and command path, not a
rendered browser test. Rendered validation is still required and currently blocked
by the available Linux browser runtime. No whole-mission parity or screenshot
claim follows from these tests.

## Mission 2 production finding and remaining work

The same native probe executes both complete turn-zero scripts and verifies all
48 attributes and state bits against the current browser values. Input/presentation
commands 1112 (Mission 2) and 1197/1174/1187 (Mission 3) are intercepted; SET and
state-bit commands execute natively. Direct startup interpreter inspection matched
all 48 current browser attributes
and AI state bits for Mission 2. CPSCR074 sets Warrior Training Hut target zero
and never assigns training preferences 5..8; Warrior preference 7 stays zero.
The previously reviewed `00485660` clears CPATR's first 48 bytes and `00486160`
copies that cleared profile, so the file is not an assumed replacement owner.
Opcode 1173 remains a spell-interval writer. No fabricated training preference or
construction target is introduced. Natural replacement Warrior production must
not be claimed without proving an actual other producer path.

Mission 3's later 1168/1074/1103 and 1030(OFF) branches remain outside this raid
slice. The automatic training availability inversion in `computer-runtime.ts`
also remains a separate necessary correction with its own live/native acceptance.
