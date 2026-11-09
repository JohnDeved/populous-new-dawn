# Original movie input and player boundary, static evidence only

Date: 2026-10-16. Continuation of [the startup-boundary trace](original-startup-boundaries.md). No subject executable, installer, emulator or player was run. No implementation or publication.

Input: recovered `game/d3dpoptb.exe`, SHA-256 `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`. Addresses below are preferred image virtual addresses, image base 00400000. Evidence uses bounded GNU objdump output, raw PE data and explicitly identified external API documentation. This is control-flow evidence, not observed gameplay.

Evidence directory: [input-player](original-startup-movies/input-player/). All evidence filenames below are relative to it.

## Main result

For a successfully opened movie reaching its polling loop, the supplied callback treats queued keyboard key-down or supported mouse-button-down events as a request to stop that current playback. It does not require Escape specifically. Key/button releases alone do not set that request. Mouse movement and wheel offset do not enter the shown button enqueue path. The request is consumed and cleared, then the player follows its ordinary exit/resource cleanup path. The wrapper does not propagate a skip result to its callers, and the retained logo/New Game callers continue after the movie call. This is not evidence of a separate “skip all startup flow” command.

Do not translate this into guarantees about every physical key, focus/acquisition failures, input latency, a held key at movie entry, or whether later events can reach the next frontend screen. Those boundaries remain below.

## 1. The flag and callback table

Evidence: `movie-callbacks.asm`, `input-dispatch.asm`, `input-dequeue-count.asm`, `bounded-data.json`.

- On disk, dword 005ca864 is zero. Five-dword callback record at 005ca868 is `{0049cc10,0049cc30,0,0,0}`.
- 0049cc10 and 0049cc30 set `[005ca864]=1` only when argument 2 is nonzero (0049cc17 / 0049cc37). Neither tests the first argument's key/button code. They each return 1 even for a release; the dispatcher ignores that return, so their return value itself is NOT the movie-stop condition.
- 0049cc50 calls `00526a80(record,0,0)`, then tests the flag. If set, 0049cc6a clears it and 0049cc74 returns 1; otherwise it returns 0.
- 00526a80 first calls 0052a710 (OS-message-pump boundary; not fully traced here), obtains queue count through 00526d10, and processes up to that snapshot when the requested limit is zero. It does not stop dispatching merely because the flag became set.
- For converted type-1 events, the dispatch table routes codes f0-f2 and f4-f6 to record+4, other codes to record+0. The enhanced handlers at +0c/+10 are null. Both active calls receive argument 2 as boolean `event.state >= 1`. Type-3 handler +8 is null. Unknown/zero event type can end this dispatch pass early; “drains the entire queue” is too strong.
- 00526c10 uses destructive queue read 0052c680 with mode 1. Raw type 1 becomes a key-style type-1 event, raw type 2 a coordinate-bearing type-1 event. The raw state byte is zero-extended into the converted state word. Raw types 3/4 convert to zero; type 5 converts to type 3.

The retained direct-reference inventory finds just the two flag setters and callback read/clear. This search does not prove absence of indirect writes.

## 2. Where the input states come from

Evidence: `keyboard-producer.asm`, `mouse-producer.asm`, `directinput-import-thunk.asm`, `input-ring.asm`, `imports.txt`, data formats/GUIDs/switch tables in `bounded-data.json`.

Both producer functions use the imported DirectInputCreateA thunk 00584f38 → IAT 00d0c5a8, request DirectInput version 0500, create the device through COM slot +0c, set the data format through +2c, and retrieve buffered 16-byte events through +28. These slot interpretations and GUID identities match Microsoft's SDK header [1].

### Keyboard

0052c880 creates GUID at 00590948: `6f1d2b61-d5a0-11cf-bfc7-444553540000` (GUID_SysKeyboard). Its format at 00584f20 has state size 256 and 256 object entries; the reproducer verifies sequential offsets 0..255. At 0052ca96 onward, each retrieved event takes its code from the low byte of dwOfs and computes state `(dwData & 0x80) >> 7`; 0052cb08 enqueues raw type 1. There is no Escape-only filter or repeat generator in this producer-to-movie-handler path.

Microsoft documents the high bit as the pressed state, and buffered keyboard events as state changes, without Control Panel character-repeat behavior [2]. Thus this static path is event-based, not a held-key polling/repeat loop. That is an API-contract interpretation, not a test of this game on a particular OS/device.

### Mouse

0052cd40 creates GUID at 00590938: `6f1d2b60-d5a0-11cf-bfc7-444553540000` (GUID_SysMouse). Format at 00584fb0 uses 16-byte state with axes at offsets 0/4/8 and four button bytes at 0c..0f, consistent with the SDK DIMOUSESTATE layout [1].

The 0052cf6f switch processes offsets 0/4 as accumulated movement, skips offset 8 and other nonbutton offsets, and routes 0c..0f to the raw type-2 path. Its state is again `(dwData & 0x80) >> 7`. With the normal successful state-update guard, offsets 0c/0d become internal codes f0/f1; 0e/0f both become f2. Enqueue is at 0052d094. Consequently the shown producer supports down events from these four button slots, not just the first one. No physical left/right/handedness naming is required by this evidence.

The linear-disassembly direct-call inventory finds only these two callers of enqueue 0052c5b0. Do not treat that as proof excluding every indirect producer. Acquisition, lock failure, buffer overflow and physical-device mapping remain external/edge conditions, not guaranteed successful input delivery.

## 3. Current player exit, not all-flow skip

Evidence: `movie-wrapper.asm`, `player-create.asm`, `player-entry.asm`, `player-run-and-destroy.asm`, `player-loop.asm`, `callers-continue.asm`.

1. 0049cc80 zeroes config at 0098d350 and writes flags 0ba4260c (or 0ba4264c), optionally ORing 10 / 4000. All these variants have callback bit 00040000 set and thread bit 00010000 clear. It writes callback 0049cc50 at config+00b0 (0098d400), then calls 0057ae00(filename,handle,config) at 0049ce76 when `[005cdc4c]` is nonzero.
2. 0057ae00 calls 00579960. The latter allocates internal state, stores its config pointer at internal+0, and on successful initialization stores internal into config+0. 0057ae00 sets internal+03d8 to 1 (enabling the post-loop destroy call) and calls 0057a8e0.
3. With thread bit clear, 0057a8e0 directly calls 0057a960 synchronously; 0057a960 calls loop 0057a9a0.
4. At 0057ab00 the loop tests callback bit 00040000; 0057ab09 loads config+00b0, 0057ab13 calls it, and nonzero at 0057ab17 branches to 0057ac49. Other completion/state paths also converge there. The callback does not select another movie, change the caller's menu, or request a whole-flow abort in this path.
5. 0049ce7b onward ignores the player return. The logo function 00523170 returns after its wrapper call; the accepted first package shows startup continuing afterward. The New Game selector branches converge on the one wrapper call at 004c344a; 004c344f proceeds to 0042bf20 / 00426b60 rather than testing a skip result. This remains ONE selector-selected intro, not three sequential clips.

Important return-value trap: the synchronous 0057a8e0 path returns 1, which makes 0057ae00 return 0 even after a normal completed run. Do not label a zero player return as uniquely “failure” or “skipped.” The wrapper does not inspect it anyway.

## 4. Cleanup and repeat/release limits

Evidence: `player-exit-helpers.asm`, `player-run-and-destroy.asm`, `memory-release-boundary.asm`, `movie-wrapper.asm`, `input-helper-boundary.asm`, `input-ring.asm`.

- The common exit at 0057ac49 records a tick, invokes 0057dfe0, releases/nulls the COM object at config+5c via 0057e350, calls the zero-return stub 0057adf0, and sets state config+9c to 5.
- 0057dfe0's conditional Sleep/InterlockedExchange loop watches internal worker fields +3b8/+3bc, not keyboard/button release state. It is not evidence for “wait until key released.”
- Because internal+3d8 was set, 0057a960 then calls 0057a800: elapsed value → config+90; 0057a860 closes the owned mmio handle unless flag80000, frees buffers and clears internal slots; additional helper calls 0057e170 / 0057bf40 are retained as cleanup edges, not fully interpreted here; state becomes 6, config+0 is nulled, and internal memory is passed to release routine 0055bdd0. That routine has allocator-specific bookkeeping and a HeapFree branch (IAT 00d0c6a8); the allocator subhelpers are not recursively audited.
- Back in the wrapper, thread priority is restored, two COM references at config+14/+18 are released, and display/restoration helpers run before return. Their full behavior was not recursively audited. Do not claim total input-queue flushing or complete restoration on every error path.
- The callback consumes the flag only once per poll. Several down events in the same processed snapshot collapse into the same boolean request. Releases do not clear an already-set request; only the consumer clears it. Destructive ring reads copy one 10-byte record, advance the read index and decrement the count.
- There is no release gate in the retained callback/loop/normal-return code. The wrapper's initial 00526fd0 is specifically NOT a queue flush: it returns a conditional field via 0052e060. Other wrapper helpers are unexpanded boundaries.
- Still unknown: held-at-entry behavior, late queued events after the count snapshot, exact frontend carry-over after return, latency, focus loss/reacquisition, every error/missing-file recovery, and physical input quirks. No claim of an explicit release-before-next-screen rule or guaranteed suppression of the next screen's input.

## External interpretation sources

[1] Microsoft SDK `dinput.h`, read 2026-10-16: https://raw.githubusercontent.com/microsoft/win32metadata/main/generation/WinSDK/RecompiledIdlHeaders/um/dinput.h . Relevant declarations: GUID_SysMouse/GUID_SysKeyboard; IDirectInputDeviceA vtable; DIDEVICEOBJECTDATA; DIMOUSESTATE. Header used only to identify ABI/constants, not to infer original game control flow.

[2] Microsoft, Buffered Keyboard Data: https://learn.microsoft.com/en-us/previous-versions/windows/desktop/ee416238(v=vs.85) . Used only for high-bit/down and buffered-repeat contract. No claim that modern documentation substitutes for runtime verification.

## Reproduce and review

Run `python original-startup-movies/input-player/reproduce.py INPUT_EXE OUTPUT_DIRECTORY`; the script checks the exact SHA-256, reads PE bytes, invokes objdump as a data disassembler and emits 16 bounded assembly files plus data/import/reference evidence. It never loads or executes the subject. `range-manifest.json` fixes every retained code range; table bytes are explicitly scoped. `reference-inventory.txt` is only a linear-disassembly search aid. The parent evidence-directory `SHA256SUMS` covers these files except itself. No game/media bytes are copied as standalone executable artifacts.
