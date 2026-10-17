# Bounded startup guard, language selector and frontend transition trace

Research-only draft, 2026-10-16 UTC. No game/installer execution, emulation, installation, media playback, browser implementation or publication. Subject: recovered d3dpoptb.exe, SHA-256 `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`. Addresses are preferred-image VAs, base `00400000`.

Evidence directory: [startup-boundaries](original-startup-movies/startup-boundaries/). All evidence filenames below are relative to it.

## Useful results

- The logo guard `[008956aa]` is produced by a startup lobby-detection helper, not an identified skip-intro preference.
- The movie selector `[0089bc6a]` is the language-resource selector derived from the registry value named `Language`, also used to select `lang%02d.dat`.
- There is now a direct, instruction-validated entry-to-guarded-logo chain. Frontend state selection occurs before the logo request, not simply after it. A separate initial frontend state 20 has a timed/input transition to main menu 0. This does not prove what was actually visible on a native run.

## 1. Entry chain and order

The PE entry address is `0055d6c0`. Its normal CRT route calls `00583ef0` at `0055d819`; that wrapper calls `0047fe90` at `00583f0a`; the app routine calls `004a4450` at `0047febd`.

Within `004a4450`, language setup is called at `004a44f9`, then the large initializer `004a4f70` is called at `004a457a`, subject to earlier initialization/error/early-exit branches. Within that initializer:

1. `004a4fdb` calls lobby-detection setup `00499800`.
2. `004a51ab` calls frontend initialization/selection `00458790`.
3. `004a51ca` tests `[008956aa]`; only zero calls logo selector `00523170` at `004a51d3`.
4. Both branches converge at `004a51d8`, calling `00458b00`, followed by more display/state initialization. The initializer eventually returns at `004a5300`.

The base movie research already proves `00523170` chooses `FMV\\blogojap.tgq` for language selector 11 and `FMV\\blogo.tgq` otherwise. This is a reachable guarded startup request, not proof of successful playback. `00458b00` itself only makes a short helper call with two local values of 100; do not label that call “show main menu.”

Evidence: `entry-*.asm`, `startup-initializer.asm`, `imports-and-entry.txt`; [logo caller](original-startup-movies/logo-caller.asm).

## 2. Logo guard producer and justified meaning

`00499800` zeroes `[008956aa]` at `00499815`, clears associated state, then calls `00413db0` at `0049986b`. If that returns nonzero it sets the byte to 1 at `00499877`, saving an output value in `[00894cf5]` and its low byte in `[0089c6f0]`.

`00413db0` allocates its network object and calls IAT `[00d0c978]` at `00413e45`. The import names this precisely as `weanetr.dll`'s decorated `MLDPlay::AreWeLobbied`, accepting a lobby-info structure and output parameters. An allocation failure returns false. Return code `0x20` from the import follows cleanup and returns false; other codes reach service enumeration, set a related flag when code is `0x1000`, and return true. The external library's complete status-code contract was not inspected.

Accordingly, the strongest justified label is a **lobby-detection-result/startup-lobby mode latch**. It governs more than logo suppression: frontend initialization branches to menu 8 when set, and networking session cleanup callbacks clear it. The clearers at `004c3632` and `004c38e2` follow imported `MLDPlay::DestroySession` calls. It is not established as a user-controlled “skip videos” option, previous-viewed flag or input-skip state.

Evidence: `logo-guard-producer.asm`, `lobby-detection.asm`, `guard-clearers.asm`, `imports-and-entry.txt`. The saved import excerpt names AreWeLobbied; DestroySession is also visible in the subject's import table, not inferred from callback names.

## 3. Language selector producer

`00492ff0` receives the current selector as a fallback argument (`004a44f3`–`004a44f9`). It opens/creates the registry key via `00529e80`, using the string pointer at `[005cd954]` → `Populous: The Beginning`, beneath `software\\Bullfrog Productions Ltd`, rooted at handle constant `80000002` on this call's zero-mode branch. No registry access was performed during this research; those are original program instructions.

It asks `0052a390` for the value literal `Language` (`005ca2d0`). This reads through `0052a0e0` → imported `RegQueryValueExA`, checks accepted value types and returns a numeric result. The producer interprets the low 16 bits, separates the low 10 bits from the high 6 bits, and maps them through a switch. Successful key access reaches the store `[0089bc6a] = esi` at `004930d7`; unreadable/unsupported Language values use the caller argument. If the key helper itself fails, this store is bypassed, and the fallback is used locally. Do not claim every fallback branch rewrites the global.

The resulting selector also formats `lang%02d.dat` (`005ca2c0`) and calls `00492e60` at `00493114`. Together with the registry value's literal name, this establishes language-resource selection without guessing from movie filename suffixes.

Exact mapping from the encoded value's low 10 bits to selector:

| Low 10 bits (hex) | Selector |
|---|---:|
| 04 | 9, except high 6 bits == 2 gives 10 |
| 07 | 2 |
| 09 | 0 |
| 0a | 4 |
| 0c | 1 |
| 10 | 3 |
| 11 | 11 |
| 13 | 6 |
| 15 | 7 |
| 19 | 8 |
| 1d | 5 |
| Other / unsupported | Caller fallback |

These are decoded byte-table facts, not asserted human-language labels or a reconstruction of installation defaults. The original movie wrapper's extra integer argument remains opaque here. No evidence here changes the already-established single selected New Game intro call into a sequential three-movie boot sequence.

Evidence: `language-selector.asm`, `registry-open.asm`, `registry-read.asm`, `bounded-data.json`.

## 4. Frontend initial state and main-menu linkage

`00458790` ultimately examines the lobby latch at `00458a39`. If set, it selects menu 8. If clear, and `[0059d104] == 0`, it zeroes `[00749cec]` and selects menu 20 (`14` hex) through `0045a3c0`. The on-disk initial `[0059d104]` is zero. If that flag is already nonzero, other demo/return conditions apply, including a route to `004c5cd0`. This is a conditional initializer, not proof that every possible entry condition selects menu 20.

The first-pass block at `004587e3` tests `[0059d138]` (on-disk initial value 1), clears it, and calls `00459f40` at `0045887f`. That helper counts the menu records through their sentinel at `0045a12b`–`0045a14b`, then populates each menu item count at record +4 by walking its item-list sentinel (`0045a151`–`0045a184`). This matters because those counts are zero on disk and the menu setter skips item initialization unless the count is positive. The bounded full record/list bytes include both sentinels; menu 20 has 13 items. The timer-before-logo claim is conditional on this normal first-pass initialization path.

Menu 20 record `005d9f18` has item-list `005d9bf8`, whose first item is type 1, descriptor `005d7328`. Its initializer is `004c5b60`, updater `004c5c00`. Page record 0 at `005da028` supplies timeout `0x1388` (5000), callback `004c5cd0`, and page-content pointer `005d9f78`. Its next record is a sentinel. The page's visual content/text is not established by this pass.

The menu setter initializes type 1 via descriptor +4. `004c5b60` stores imported `GetTickCount` in descriptor +0c if timeout is nonnegative. The type-1 update dispatch uses descriptor +8. `004c5c00` adds that stored start tick to the page timeout, reads GetTickCount, and when the current tick is strictly unsigned-greater than start tick plus threshold calls `0045d7f0`, which dispatches the page callback. `004c5cd0` sets `[0059d104] = 1` and calls the menu setter with 0. The retained original-menus evidence identifies menu 0 as the main menu, record `005d9c98`, list `005d9660`.

There are also input-dependent dispatches to the same page callback in `00459000` and `0045a500` while current menu equals 20. This report deliberately does not assign keyboard or mouse names to these numeric event boundaries. They are frontend-page dismissal paths, not proof of FMV skip behavior.

**Timing caution:** menu 20 selection and its initializer occur before the logo request in this call chain. Therefore the 5000-ms threshold is not proof of a guaranteed five-second page after the logo. Actual visibility, clock effects across playback, and first-frame/update ordering require additional tracing or authorized native observation. Do not present this as a measured or fully established visual boot sequence.

Evidence: `frontend-first-pass.asm`, `frontend-count-initializer.asm`, `frontend-select.asm`, `frontend-menu-set.asm`, `frontend-page-timer.asm`, `frontend-update-type1.asm`, `frontend-dispatch.asm`, `frontend-input-boundary.asm`, `bounded-data.json`.

Retained naming source: https://github.com/JohnDeved/populous-new-dawn/blob/c9e3cbc8003be7c9b3fc489d794297679476d2b9/decomp/research/original-menus.md . The existing menu note supplies menu naming, not runtime observation.

## Reproduction and limits

Run `python original-startup-movies/startup-boundaries/reproduce.py PATH_TO_AUTHORIZED_D3DPOPTB_EXE OUTPUT_DIRECTORY`. It verifies the exact EXE hash, parses PE sections as bytes, uses GNU objdump only to disassemble bounded ranges, and emits data records and range manifests. No target code is loaded as a process. The evidence-directory `SHA256SUMS` covers all included evidence and reproducers. No game/installer/media binaries are included.

This closes the direct entry linkage, lobby-guard producer and language-selector producer at a static level. Remaining: exact native visible page ordering/content, complete external lobby status semantics, possible indirect/bulk global writers/default initialization, remaining held-input/transition behavior and missing-media behavior. The [movie input/player trace](original-movie-input-player.md) narrows the delivered-event, current-clip termination and normal cleanup boundaries. No player implementation is justified solely by this trace.
