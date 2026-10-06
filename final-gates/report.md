# Final Erosion integration gates

Final source [c172e144](https://github.com/JohnDeved/populous-new-dawn/commit/c172e144a6552f10e062d08745b036a251585c82) has tree `bc53defe66d98341c3e619164c4c8eeb23405120` and application tree `84d4a529d361106feb3f760917a71b247e1c0c25`. It normally merges the reviewed combined ordinary-capture branch into PR222, retaining PR224’s `47d2e2d` activation fix by ancestry. Its only tree delta from actual-run `b3285f6` is three documentation files; application, scripts, tests and QA bytes are identical.

- [Final check](check.json): passed 1,296/1,296 tests, typecheck and structural checks on exact c172. CPU 0–3, 900-second cap, 02:21:19.120–02:24:38.170 UTC.
- [Fresh final production build](build.json): passed on exact c172, CPU 0–3, 600-second cap, 02:31:37.926–02:31:55.570 UTC. The earlier build correspondence is historical context; this fresh build is the final gate.
- [Scoped formatting](format-scoped.json): passed. [Scoped ESLint](eslint-scoped.json) retains 208 world-turn and one harness diagnostic; [comparison](quality-correspondence.json) matches every diagnostic against the [accepted historical baseline](historical-c91-lint.json). Other 22 scoped files have no ESLint findings. No global quality pass is claimed.

Every command receipt binds source and input hashes before/after and its raw stdout/stderr. [Index](gate-index.json) and [manifest](manifest.json) list exact receipt bytes. No browser/native rerun was used for documentation or merge metadata.

The independently accepted [actual ordinary capture and native same-input replay](https://github.com/JohnDeved/populous-new-dawn/blob/d4b877ad56ca62f78fc6c49ee07cb4b5837c1f85/report.md) remain labelled at actual source b328, with all limitations and failed startup/input receipts preserved. Actual native audio policy, downstream queue/walk-mask/render consumers, full engine timing, UI restore and general FPS parity remain outside that result.
