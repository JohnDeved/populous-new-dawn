# Browser-local audio volume preferences

The existing Game settings master/music sliders now retain the player's choices
across a fresh page, mission restart, checkpoint load and mission changes on the
same browser origin. Defaults remain master 0.35 and music 0.65. A saved zero is
preserved, not replaced by the default.

Playback still starts muted on every new page. Restoring volumes creates no
AudioContext and never enables sound automatically; the existing explicit sound
button remains the playback gate. The audio mixer, source samples, cue selection,
RNG, music cadence and pause/resume lifecycle are unchanged.

## Storage boundary

`app/audio-preferences.ts` reads/writes only `populous-audio-preferences` in browser
localStorage. The version 1 JSON record contains `volume` and `musicVolume`, each a
finite number between 0 and 1. No enabled flag, game world, campaign progress, native
save format or original option-file representation is stored here.

Malformed JSON, unsupported versions or invalid values use fresh default values.
Reads do not rewrite or delete the original record. Only a real slider change
saves a replacement with the supported fields. Denied storage or quota failure
leaves the controls working for that session and displays a nonpersistent warning.
Changing audio never clears other browser keys or game/profile checkpoints.

The UI loads preferences at the existing asynchronous startup-ready boundary and
applies both to the live Soundscape before allowing the player to enter a world.
This keeps the server/hydrated initial markup consistent without introducing a
storage poller, playback timer, game-store field or cross-tab event machinery.
Separate open tabs retain their own current mix until reloaded or adjusted.

## Acceptance

`node --test tests/audio-preferences.test.mjs` covers absent/invalid/versioned/zero
values, read/write/getter failures, validation before writes, unrelated-key
preservation, and Soundscape default/disabled/reset behavior.

Run `scripts/check-browser-audio-preferences.mjs` through the shared queue's
`supervise` mode. It uses real mission/menu/range/enable/restart/checkpoint controls,
checks actual live Soundscape gain nodes, opens fresh pages and another mission,
and verifies corruption/denied-storage fallbacks. Audio objects are observed through
the same private React-tree test pattern as `browser-game.mjs`; they are not
replaced or injected. Negative storage cases are explicit browser-storage inputs.
No native/save-codec equivalence, waveform equivalence or hardware-performance
claim follows from this browser-local usability slice.
