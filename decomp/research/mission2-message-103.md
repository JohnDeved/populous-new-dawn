# Mission 2 Tornado instruction

Mission 2 script words 400–441 sample the head at `(204, 96)` every 64 turns.
When its remaining count falls below three, opcode `1176` resolves message 103
through the executable's table at `0x005ae310` to language string 642:

> Use the Tornado Spell to destroy the Enemy and their buildings before they have a chance to react.

The original interpreter and message dispatcher produce type 3, flags `0x2d1`,
cue `0xe3`, and one shared RNG draw. Script variable 11 prevents a second
notification; variable 9 is only the temporary shared message guard.

`scripts/check-native-messages.py` executes this exact Mission 2 branch twice at
turn 49 for tribe 3 and compares the native message records, variables, RNG, and
cue request with the browser implementation. Only sound playback is intercepted.
The shipped browser regression separately reaches the branch by commanding the
Shaman through the Totem bridge and followers to the Tornado head.

Inputs: executable SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`,
`levels/cpscr074.dat` SHA-256
`03931ad1bc69860177c0a0d7d850db46b268683bf95b274926e18fe1f8a5d9db`,
and `language/lang00.dat` SHA-256
`e826c478746d666a3ea9ea36cb7804d1d226d5f83084230987b1de293066cf7d`.
