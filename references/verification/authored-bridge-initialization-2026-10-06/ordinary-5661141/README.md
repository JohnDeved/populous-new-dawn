# Ordinary authored Bridge and native replay

Source `56611410b260fa4a7abc38d83ad3aec6678841f3`, PR226. [Actual browser receipt](browser-final-5661141-01/receipt.json) and [outer receipt](browser-command-5661141-01.json) both passed with stable inputs; no page errors. The normal Shaman worship route, observed initialized caches, active/completed Save/Load and one-use checks ran through shipped controls. [Independent browser review](browser-review-5661141-01.md).

The observed active controller is turn17, with endpoints47872,24832→51968,24832 and heightStep2. Ordinary Load resumes at controller39 with every cache preserved. This observes active progression; exact birth timing/init-only behavior belongs to the separate native/component proof.

[Captured initial/final terrain](browser-final-5661141-01/native-terrain.json), SHA-256 `f4f7eeb2faa278f6934275bfa4f8d4a95bb4617022e53259121f4cdbea665418`, was replayed using the original authored producer/controller and real native terrain queue. [Native command receipt](native-browser-command-5661141.json) passed on the final source; [raw replay report](native-browser-replay-5661141.json) records the result. Endpoints and all16,384 final heights match, with36 changed vertices. The raw-DAT zero-flags proof's slope0 is a separate input.

## Genuine screenshots

All images are unmodified1440×1000 captures from source5661141, using headless Chrome154 and software WebGL/SwiftShader. No unsafe browser flags were used. The normal flyby/reload changes camera angles, so this is sequential evidence rather than an identical-view pixel comparison.

- [Before reward](browser-final-5661141-01/authored-crossing-before.png): water separates the authored crossing endpoints.
- [Active crossing](browser-final-5661141-01/authored-crossing-active.png): trail rows and forming terrain are visible.
- [Completed causeway](browser-final-5661141-01/authored-crossing-complete.png): the authored terrain connection is visible.
- [Completed checkpoint restored](browser-final-5661141-01/authored-crossing-completed-restored.png): the restored Shaman scene is visible; one-use/no-active-bridge checks pass. No second full restored-height array was captured.

Active Save/Load cache equality is asserted by the driver; portable checkpoint tests separately cover retained terrain/controller continuation. The13 software fallback/ReadPixels/texture warnings are retained. This does not establish original-game pixels/audio, hardware performance, complete allocation/RNG/notification consumers, native absolute clock timing or full campaign parity.

The explicit [allowlist manifest](manifest.json) preserves byte-identical receipts, raw inputs, reports and PNGs. No browser profile, TMP directory, credential/environment file, dependency tree, original executable or other game binary is published. Final combined review and source-gate index are published separately when complete.
