# Mission 8 Dakini last stand

The imported `cpscr016.dat` identity is SHA-256
`441938566197d62880c924e1b1108dfbef5b95e1ee096c21ef88e9240ee63b98`.
Its complete code interval `[1832,1867)` is an EVERY-63 block with offset 54.
For tribe 1 this fires at turn 9 modulo 64. If own population is below eight
and Blue-attributed kills of this tribe exceed five, variable 42 sums the
completed Hut counts (internal ids 1066, 1067, 1068). A zero sum invokes
command 1221 ON. The preceding construction/raid programs and following
warning branches are not enabled by this change.

The existing runtime maps the exact counters and dispatches command 1221
through the ordinary forced-attack consumer. Reused reviewed native routine
semantics are documented in [Mission 4](mission4.md): 0048cc60 sets flags2
bit 0x40, 0041ca10/0041cc20 issues command 28 to eligible surviving people,
and ordinary outcome processing still owns victory. No new executable run
or full Mission 8 parity is claimed.

At main base `e5b258422caecd6d050fe508b05259b8cbbd1757`, the new three
behavior tests failed (no activation); the imported-source identity test passed.
With the five-line binding, all four tests and the two existing Mission 8
roster/land-order tests pass. They cover all three completed Hut models,
incomplete-Hut exclusion, kill-credit direction, population/kill thresholds,
wrong and repeated cadence, preserved mode bits, ordinary tick dispatch to
the living Blue Shaman, and current-format checkpoint continuation. The scenario
supplies a one-Warrior Red remnant, kill credits and the cadence turn, not
an earned battle or natural whole-mission victory. The authored Blue party,
Warrior and terrain are retained.

Changed-file ESLint passed. Orchestration planning was run; it selects the broad
campaign native/browser matrix and standard check/build, which remain unrun
in this focused, no-heavy-job task. Source-slice identity is not a fresh native
executable oracle. Rendered controls, public persistent Save/Load, natural
campaign completion, Full/build, performance and visual acceptance remain open.
The candidate must remain Draft until those applicable gates are satisfied.
