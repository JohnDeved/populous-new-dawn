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
3 turns and its existing flyby command adapter. Later recurring blocks remain
excluded because their game-command hosts are unbound; this is not full Mission 3
script or AI parity. Native mode-2 tooltip lookup also wraps byte coordinates that
the current browser lookup does not, so the later Vault callout is absent even
though the flyby and visible Skip introduction path run.
