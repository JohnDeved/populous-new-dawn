# Boot logo: bounded browser restoration

Issue #16, base `96becd8826afc5a4256a12ccebf3caa61729e24b`.
The live issue and all four comments were read before selecting this slice.
The original game/installer was **not executed or emulated**.

## Source facts

The documented [native setup](../../../engineering/native-setup.md) recovered
the archive from its retained URL. SHA-256:
`6aa6c366809ea1d9575ec1d31a24527a95c7332f0a1d2ab692f7a602e7e10702`.
Component0 extraction used the existing extractor and binary-refinery 0.10.11.
The executable is
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`;
`fmv/blogo.tgq` is
`65602921453014c11b079b95f664a29c89727fb0b2d0dce4c40fee94665a80fa`.

Retained [startup ordering](../original-startup-boundaries.md) establishes
frontend initialization before the guarded logo request at `004a51d3`.
The guard is the lobby-detection latch, **not** a viewed-once preference.
`00523170` chooses BLOGO except language selector 11, which requests the absent
BLOGOJAP. This browser slice uses the available base-language BLOGO on each new
Home mount. Returning to the menu within that mount does not replay it.

New geometry evidence:

- `00523195` calls the wrapper with arguments `(BLOGO, 1, 0, 0, audioSelector)`.
  `0049cd3f` therefore writes flags `0x0ba4264c`; the vertical-double addition at
  `0049cd53` is not taken. `0049cdf0` requests a 640×480 surface.
- The BLOGO packets contain 188 `pIQT` frames, all coded 320×352.
  `00579f49` / `00579fcd` classify `pIQT` as type 4. The fourth dispatch slot at
  `0057cfb8` selects `0057d000`, which reads width/height from payload +0/+2.
- `0057c1e0` calls the dimension dispatcher, then `0057c750`. In the latter,
  flag 0x40 doubles width, 0x30 controls vertical doubling, and 0x04/0x08 center
  the result. These flags produce **[x=0,y=64,width=640,height=352]** on the
  requested surface. `0057bb30` obtains the actual surface size; failed driver
  calls or alternate surfaces are not covered by this static calculation.
- The [input/player trace](../original-movie-input-player.md) establishes
  delivered keyboard/button downs stopping the current clip, release-only
  events not stopping it, no character-repeat producer, and the caller
  continuing after the common cleanup. It does not prove whole-flow skipping
  or native held-input/next-screen behavior.

Reproduce the bounded byte checks and assembly:

```sh
python3 scripts/check-static-startup-logo.py GAME_ROOT NEW_OUTPUT_DIRECTORY
```

The adjacent assembly and `facts.json` are required original research proof, not
a native execution receipt. The checker reads the hash-verified PE and TGQ and
runs GNU objdump on finite ranges only.

## Shipped path and browser adaptations

Home retains its existing checkpoint/frontend preparation. Once that resolves,
the logo modal precedes the existing main menu. Completion changes only a
component-local presentation Boolean; it never creates a world, changes a save,
or writes a viewed flag. New Game, Tutorial, Load, mission-return and camera
introductions keep their existing owners.

The source-derived 640×480 composition scales uniformly to fit the viewport.
The bundled WebM is VP9 lossless video after nearest-neighbor horizontal expansion.
The importer compared **all decoded YUV bytes of all 188 frames** against the
expanded original. Audio is the original EA ADPCM decoded and transcoded to
Opus; it is not bit-exact audio. Conversion/tool/output hashes are in
`conversion.json`. Original ownership/licensing is unchanged.

```sh
python3 scripts/import-startup-logo.py GAME_ROOT NEW_OUTPUT_DIRECTORY
```

Explicit compatibility choices:

- Muted autoplay with an accessible, user-activated sound control. This does
  not change saved game sound preferences. Refused autoplay offers a real resume
  action. Decode failure offers a truthful message and working Skip.
- Fresh keydown skips, while browser repeat events are consumed without skipping.
  Tab is reserved for reaching the browser controls; Enter/Space on the sound
  control operates it. These exceptions are not native key-filter claims.
- Pointer down pauses immediately. The modal absorbs that pointer's release or
  cancellation before revealing the menu, preventing browser click-through.
  This is **not** evidence of a native release gate.
- Hidden tabs pause and resume the same clip. Unmount removes listeners, pauses
  and unloads the media; late playback promises cannot resume the next screen.

## Remaining gaps and handoff

This is a partial restoration, **not full startup parity**. Menu 20 is selected
before the original logo; its timer starts there. Its visible page content,
update ordering after playback, and early-skip timing still need proof. This
change does not invent that page or a five-second post-logo delay.

The separate New Game caller still needs its one language-selected intro
integrated; P3INTRO1/2/3 must not be played consecutively. `BLOGOJAP`, `P3INTROJ`
and `P3INTROC` are absent from the retained installer inventory. Their exact
content cannot be supplied by relabeling the available files.

Read-only entry findings for the other owners: Credits `004c5af0` queues state
12 via `00442a60`; it is not an identified credits movie. Rolling Demo
`004c5a80` calls `004b36e0(1,2)`; montage `rdmn001.dat` and all six recorded
snapshot families were successfully recovered. Its replay/snapshot reader
adapter remains engineering work, not unavailable content or the browser save
format. Coming Soon `004c3540` calls the movie wrapper for `trailer.tgq`, which
was recovered with SHA-256
`ee3d455f715a9b35a1d974c3918bc3600e98d43d64ec87124a3460e2848b9dfe`.
No implementation of these entries is included here.

Component regressions: `node --test tests/startup-logo.test.mjs`.
Actual Home witness: `scripts/local-render/startup-logo.mjs` through the existing
local-render harness. Browser screenshots/receipts belong to the PR handoff,
not this source directory. Neither static proof nor a software browser run
establishes native GPU pixel identity, acoustic output, hardware performance,
original persistence semantics, or issue closure.
