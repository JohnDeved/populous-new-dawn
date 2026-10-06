# PR224 Erosion activation gate evidence

Source head: `47d2e2dc229f35352f1a7a1cfb948789053c9b1c`.
Base: accepted main `b28b031f6917f6d814536ba10a7d46e7be71de05`.
[PR224](https://github.com/JohnDeved/populous-new-dawn/pull/224) fixes issue223, Refs #8.

`npm run check` passed all 1,242 tests; `npm run build` passed. Both are exact-head, source-stable receipts. Source review accepted432f28e; `main-adoption.json` proves the same five Erosion deltas after adoption of accepted Guard main, with only both topic-index links retained in the documentation conflict.

Global quality gates retain their failing statuses. Format reports the two inherited files. ESLint reports284 global findings and Oxlint1,409. The sole changed runtime file introduces no findings: ESLint210→208 and Oxlint281→279. The new test has no ESLint findings. All other diagnostic files were verified byte-unchanged from the accepted base. See `gates-47d2e2d/quality-comparison.json`; no global lint pass is claimed.

Fallow health/duplication exited0 with advisory findings; unused exited1 with inherited advisory categories. Two unsuccessful Oxlint comparison setup attempts remain preserved: ignored work path, then unsupported parent-relative path. The valid absolute read-only baseline used the unchanged accepted Guard app source and the candidate-owned binary/config; no dependency copy/link/install occurred.

The initial failure-first test receipt includes actual remaining64≠63 and missing activation notifications, plus the disclosed Mission10 fixture correction10→8. The passing candidate receipt's exact code/test correspondence is retained. This evidence branch contains only source, patch, normalized receipts, raw command output and review. It excludes original EXE/DAT, dependency/tool assets, profiles and unrelated files.

[Reviewed native producer proof](https://github.com/JohnDeved/populous-new-dawn/tree/d6e59a309c1c0cd72895e4152829f1bbd5509432) has separate supplied-state and intercepted-consumer limits. No full-game cadence, audio-playback, native allocation-failure or ordinary rendering claim is added here. Actual UI/IndexedDB checkpoint and rendered activation/retirement acceptance remain pending, including exact runtime composition with the pre-activation recorder.

All runtime sessions are terminal; `lane-release.json` records clean source/lock identities and CPU lane release. Dependencies are parked for a coordinator-directed transfer. `manifest.json` fingerprints every other published file.
