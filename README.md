# Issue 16 startup logo review artifacts

Artifact-only branch; do not merge into development branches.

Source base: `96becd8826afc5a4256a12ccebf3caa61729e24b`.
Source candidate: `252dc89f59fc1afada67b06c24e3e1af0435fd0e`.

Actual Home rendered in Chromium 153.0.8010.12 at 1280x960. Browser sandbox enabled. Local compositor output, not original-game screenshots or hardware performance evidence. The native executable was read as data, never executed.

`before-menu.png`: unchanged baseline opens the menu immediately.
`logo-1s.png`, `logo-3s.png`, `logo-6s.png`: candidate natural playback, without seeking or changed playback rate.
`after-natural-menu.png`: candidate after natural completion. Byte-identical to `before-menu.png`.
`pointer-down-stopped.png`: playback paused on trusted left-button down; release subsequently opens only the menu.
`media-failure.png`: explicitly injected 404, truthful failure with a working exit.

The browser receipt records 13 passing checks: ordering, framing, fresh keys versus repeats/releases, held-at-entry key, left/middle/right interruption without click-through, keyboard sound control, Options return without replay/storage writes, and injected failure recovery. Only the injected 404 produced a console error. Autoplay refusal and visibility lifecycle are component-tested; audio was unmuted, not acoustically measured.

`native-static.json` is the source/input-bound static PE/TGQ geometry checker receipt, not native execution proof. Full `npm run check` is currently pending; build has not started. Independent code/browser review accepted the candidate conditionally on those standard gates. This artifact set makes no full startup parity claim.

Missing work: native initial timed-page visibility/early-skip ordering, separate language-selected New Game intro, unavailable BLOGOJAP/P3INTROJ/P3INTROC. Credits/Rolling Demo/Coming Soon remain owned by other workers.
