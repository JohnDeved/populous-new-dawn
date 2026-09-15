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

The browser binds only the startup message and complete flyby blocks. Later attack
AI and message 51 remain excluded. The optional completion message block depends
only on population and Vault state but is not needed for this playable slice.
`scripts/check-native-mission7-opening.py` executes the original interpreter and
compares the bounded schedule with the live Mission 7 campaign path.
