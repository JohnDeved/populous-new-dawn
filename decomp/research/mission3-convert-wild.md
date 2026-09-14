# Mission 3 Chumara Convert Wild

The supplied executable SHA256 `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`
and Mission 3 script SHA256 `d5dfcd826f77909a64cca03ca9d9e3d351d2a7cb3f63eb8ba811b59916e83601`
separate two adjacent turn-zero commands. Interpreter opcode 1115 resolves internal
spell 1244 to model 17 and grants tribe 2 one low-nibble stock, capped by the native
spell limit. Opcode 1197 only sets tribe field `+0x941` bit `0x2`; its person-removal
consumer is unrelated to spell ownership.

Mission 3 enables `STATE_SHAMAN_GET_WILDS` and defines only a Swarm spell entry.
Convert Wild therefore uses the native special AI path, not a fabricated model-17
entry. Opcode 1073 seeds the type-2 task from Mission 3 marker 99 at packed coordinate
`0x52dc`; the first tribe-2 producer opportunity is host turn 61. Native targeting
tests that center and four cardinal cells six packed-coordinate units away, retaining
only strictly denser 7×7 Wildman areas. Casting still requires model-17 mana even
with stock; allocation consumes the stock without debiting mana. The live effect then
replaces eligible Wildmen with Chumara Braves and consumes gameplay RNG only for its
sparkles.

The browser binds these imported startup writes and carries marker 99 through its
existing native-derived target, payment, cast, and Convert Wild effect path. It does
not model the intervening type-2 task phases or issue their target-directed Shaman
command; native evidence does not prove arrival before phase 8, and Mission 3's target
is already in spell range. The ordinary turn-61 opportunity spends the single shot,
and the live effect completes the conversion. The focused and browser checks start
only through Mission 3 data and ordinary turns; they inject neither stock nor followers.
No parity ledger update or native recording was made.

Evidence: reviewed exports `0048cc60`, `004615f0`, `004623e0`, `004c29a0`,
`004c2cd0`, `004d0860`, `004d11b0`, and `004d32b0`; the existing native spell-casting
check passed 1,024 payment/stock cases plus its range and target suites.
