# Mission 7 opening and Invisibility path

The supplied executable is SHA256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`;
Mission 7 `cpscr021.dat` is
`e461c70a5294a5d3b6d2f53a45bcd67cf77562c9848617b6fe856cc4a2b3fa53`.
The imported level and header hashes are respectively
`a22326653fb6ca36792d2b79576dce9a8c014736129ffd3de4d3ba816423b752`
and `5bbe0a02845d1a9182fcd63dcaa67dcb918051caecce4c3ebd261640282e41b7`.

Turn-zero codes `254..<259` display type-1 message 50/string 668, open it,
play cue `0xe3`, and consume one message RNG draw. The complete opening flyby is
codes `1892..<1978`: `EVERY 7`, variable-31 latch, 15 commands, no internal
reads, and no RNG. For Chumara tribe 2 it fires on turn 6, creates 11 events,
sets flags `0x15`, warmup 6, ends at `{x:198,y:228,angle:1200,zoom:0}`, and
requests input mask `0x40`. It visits the Erosion head at `(136,126)` and the
Invisibility Vault at `(104,54)`.

Convert Wild is rechargeable from level-header bit 17; no script command grants
or casts it. The level supplies 59 Wildmen. The Vault is also level-driven: its
type-4 trigger targets 100 work and its linked type-11 reward is spell model 6,
Invisibility. Script presentation does not gate worship or delivery.

The browser binds the startup message, complete flyby, and the bounded settlement
block described below. Later attack AI and message 51 remain excluded. Message 51
is a raid warning gated by variable26; it must not be bound as a standalone
completion message.
`scripts/check-native-mission7-opening.py` executes the original interpreter and
compares the bounded schedule with the live Mission 7 campaign path.


## Chumara settlement and training

The retained original `cpscr021.dat` words447 through594 (inclusive) form the
settlement prefix of EVERY255. The projection preserves that header and inserts
its closing ENDIF before the next independent flyby block. The original later
sibling starts595 and the full EVERY ends637; remote towers and later raids are
not included. Native scheduling uses `(turn + tribe) & 255`, so tribe2 executes
at254,510,... rather than256.

Live internal reads are self Temple1070/model5, self camp1072/model7,
self medium/large huts1067/1068/models2/3, Blue camp1088/model7 and
Blue Temple1086/model5. Each1136 includes incomplete buildings for exactly the
next building read, which consumes the flag. Marker population queries use the
live tribe/marker owners. The script requests Temple attribute2 when Blue
schools/nearby people or the own camp qualify; upgraded own housing requests
camp attribute3 and increases housing target10 from20 to30. Above50 population,
Preacher/Warrior percentage targets6/7 become25/35. Initial targets are20/20.

Retained static exports004e5580 and004f6480 establish school-target selection
before housing and count both existing construction and pending plans. The
adapter is enabled only for Mission7 tribe2. Original producer-table scheduling
is used, retaining one-success-per-opportunity ordering/history; the first
tribe2 production opportunity is61. Native004e59a0 admits training when
available Braves plus housing orders are at least school capacity (five), with
the model RNG draw preceding the capacity rejection. Both camp/Warrior and
Temple/Preacher admission are enabled for this exact tribe/mission.

The script also changes attribute0 (capped40) and Convert state1030 at population
thresholds. Those values are retained faithfully, but this change does not bind
all their downstream behavior: automatic Convert production remains enabled
only for Mission3. Words298..446/opcode1173 concern spell-recovery intervals,
not construction target producers, and remain excluded. Later patrols, raids,
message51 and native Wildman wandering remain separate work.

`tests/mission7-settlement.test.mjs` checks cadence, live building ownership,
one-shot incomplete reads, both school capacity boundaries, and ordinary
initial-roster plan production with checkpoint replay. Controlled school/read
fixtures are explicitly separate from natural settlement proof. The dedicated
`node scripts/check-mission7-settlement.mjs` exercises fresh imported actors
through natural building completion, hut births and both trained classes without
resource, position, entity or order injection. It is not a player victory,
rendered-browser or original-executable execution claim. Earlier current-port
Mission7 victory at12640 predates this stronger settlement and is historical;
a new ordinary player route is required for the changed runtime.
