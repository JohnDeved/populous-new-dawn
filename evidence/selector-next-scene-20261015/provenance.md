# Next selector scene static evidence preservation

Evidence-only branch based on verified main `762be79c810d8ae5d9e05d8e44e283bdff94b47b`, verified against GitHub API and git ls-remote on 2026-10-15. This does not alter main, PR464 or its working checkout.

- Archive: `selector-next-scene-20261015.tar.gz`
- Archive SHA-256: `24bd3b0d502c31762ce036a4b519a5934fed6a82c4fe2105b13aaf95e4f110e0`
- Size: 377899 bytes; all116 manifest-listed members verified after copy and from the archive itself.
- Packets: selector-camera, selector-sun, selector-backdrop, selector-scene-review (including depth-producer supplement), selector-text.
- Camera/sun/backdrop/scene geometry have the bounded independent ACCEPT retained in selector-scene-review. That review's boundaries remain authoritative. The NEW title/tooltip/cursor packet is NOT YET INDEPENDENTLY REVIEWED and must be reviewed before integration.
- Original EXE SHA-256: `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`. No game executable or source assets are bundled. Data-derived samples and bounded raw disassembly are research evidence, not original-game screenshots.
- This text pass used static disassembly and source-data decoding only. No original execution/emulation, builds, heavy tests, browser work, or runtime/repository edits. Font title/tooltip and cursor proof does not establish full-frame parity or campaign progression.
- Supporting older panel/body packets remain referenced by the packet's original paths and existing project research. Internal absolute paths are provenance from the research machine, not portable runtime dependencies.

Archive text findings establish Western bitmap font slots3/11, exact title format `%02d : %s`, tooltip mouse-icon glyphs and placement/delay, no frame submission in the selector tooltip loop, and plspanel frame12 cursor/top-left hotspot. Preserve All missions/Tutorial/checkpoint/Back compatibility outside native proof.

Local durable copy: `/workspace/shared/populous-selector-next-scene-evidence/selector-next-scene-20261015.tar.gz`. This branch is evidence preservation only and makes no test/parity/release claim.
