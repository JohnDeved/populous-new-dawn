# Original startup movie inventory and call boundaries

Research date: 2026-10-16 UTC. This is data-only recovery and bounded static
inspection. No installer or game was executed or emulated, no media player was
implemented, and no runtime parity is claimed.

The recovered base-game archive contains seven FMV files. The native New Game
route selects one intro filename and calls the movie wrapper once. **Do not play
P3INTRO1, P3INTRO2 and P3INTRO3 consecutively based on their names.** A separate,
guarded initialization call requests the Bullfrog logo. The follow-up traces establish conditional entry linkage, lobby/language
producers, and current-clip input termination. Visible native ordering and
held-input/next-screen behavior are not established.

## Source identity

The source was [PopulousTB-Setup.zip](https://the-beginning.b-cdn.net/wp-content/downloads/other/PopulousTB-Setup.zip),
322,676,040 bytes, SHA-256
`6aa6c366809ea1d9575ec1d31a24527a95c7332f0a1d2ab692f7a602e7e10702`.
This matches the retained input in `engineering/native-research.md` at
`c9e3cbc8003be7c9b3fc489d794297679476d2b9`; it establishes continuity with that
research input, not independent publisher authenticity.

The inner installer is 323,091,880 bytes, SHA-256
`c5d3ad2a1b369e636df85a6061b832c18f2dc33526a03383f61abd7b5518c52d`.
The inspected `d3dpoptb.exe` is 2,275,840 bytes, SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`,
matching `decomp/tools.json`. See [provenance](original-startup-movies/provenance.json)
and [retained source identities](original-startup-movies/retained-sources.json).

The existing `scripts/extract-reference.py`, using pinned
`binary-refinery==0.10.11`, parsed the installer and integrity-checked selected
members without executing it. The complete installer index contains 1,549
members, including exactly seven FMV members, all in Component0. The compact
[member summary](original-startup-movies/installer-member-summary.json) records
the full-index hash, selected members and absent referenced names.

## Recovered inventory

Original member case is preserved below. Extracted filenames are lowercase.

| Member under Fmv | Bytes | Video packets | Nominal seconds |
|---|---:|---:|---:|
| BLOGO.TGQ | 3,522,168 | 188 | 7.52 |
| OUTRO.TGQ | 30,325,864 | 2,094 | 83.76 |
| P3INTRO1.TGQ | 45,412,912 | 3,201 | 128.04 |
| p3intro2.tgq | 45,412,912 | 3,201 | 128.04 |
| p3intro3.tgq | 35,849,176 | 3,201 | 128.04 |
| POP3MASK.TGQ | 4,872,172 | 300 | 12.00 |
| Trailer.tgq | 32,317,876 | 2,425 | 97.00 |

Total: 197,713,080 bytes. [The inventory](original-startup-movies/movie-inventory.json)
includes individual SHA-256 hashes and probe results. FFprobe 7.1.5 reports EA
containers, TQI video at 25 fps, and ADPCM EA audio at 22,050 Hz/stereo. Coded
sizes are 320×352, except Trailer at 320×240. These are not verified native display
sizes or aspect ratios. Nominal seconds are video packets divided by 25, not
measured playback durations. No full audiovisual decode or review was performed.
A single reported audio stream does not prove only one selectable audio program.

## Bounded native findings

- **New Game intro:** `004c3340` reads `[0089bc6a]`, subtracts one and dispatches
  through eleven entries at `004c34ec`, plus a default branch. Branches choose
  `p3intro1`, `p3intro2`, `p3intro3`, `p3introc` or `p3introj`, then converge on
  one call to `0049cc80` at `004c344a`. Some branches also vary an integer
  argument between 0, 2, 3 and 4. The [selector-producer trace](original-startup-boundaries.md#3-language-selector-producer)
  establishes language-resource selection. The extra argument's full semantics
  remain unproved. See [intro caller](original-startup-movies/intro-caller.asm).
- **Menu route:** [retained menu research](original-menus.md) maps New Game to
  callback `004c3520`: it selects the first-time Tutorial recommendation when
  `[00895daa]&0x40` is clear, otherwise it calls `004c3340`. The disassembly
  independently confirms that direct call at `004c3536`. Intro filenames alone
  therefore do not establish boot playback.
- **Logo:** `00523170` chooses `FMV\blogojap.tgq` when `[0089bc6a] == 11`,
  otherwise `FMV\blogo.tgq`. Initialization calls it at `004a51d3` only when
  byte `[008956aa] == 0`, then continues to `00458b00`. The [startup-boundary trace](original-startup-boundaries.md) identifies
  the lobby-detection latch and conditional entry-to-frontend linkage, while
  preserving the distinction between calls and observed visible playback. See
  [logo caller](original-startup-movies/logo-caller.asm) and
  [initialization boundary](original-startup-movies/logo-startup-caller.asm).
- **Skip boundary:** wrapper `0049cc80` installs callback `0049cc50` at
  `[0098d400]` and conditionally reaches lower movie routine `0057ae00`.
  The callback calls `00526a80`, consumes and clears `[005ca864]`, and returns
  1 if that flag was nonzero, otherwise 0. The [input/player trace](original-movie-input-player.md) binds delivered
  keyboard/button down events to current-loop termination and common cleanup,
  not Escape-only or a propagated all-flow skip. Held-at-entry and next-screen
  event carry-over remain unproved. See
  [wrapper](original-startup-movies/movie-wrapper.asm) and
  [callback](original-startup-movies/movie-callback.asm).
- **Other names:** Coming Soon callback `004c3540` requests `trailer.tgq`.
  OUTRO and POP3MASK references do not place those movies at startup. Referenced
  `blogojap`, `p3introj` and `p3introc` are absent from this archive's member index.
  [String addresses](original-startup-movies/movie-strings.json) were checked
  against executable sections. A raw-byte BLOGO candidate at `0057e0fb` was
  rejected as an unrelated relative CALL, not a filename-pointer instruction;
  [its bounded disassembly](original-startup-movies/logo-other-caller.asm) is retained.

## Reproduction and remaining work

Use the retained extractor against a local, checksum-verified source archive:

```sh
python scripts/extract-reference.py PopulousTB-Setup.zip game \
  --component Component0 'fmv/*' d3dpoptb.exe poptb.exe readme.txt
ffprobe -v error -show_format -show_streams -of json game/fmv/blogo.tgq
ffprobe -v error -count_packets -show_entries \
  stream=index,codec_name,codec_type,width,height,r_frame_rate,duration,nb_read_packets,sample_rate,channels \
  -of json game/fmv/blogo.tgq
objdump -d -Mintel --start-address=0x4c3340 --stop-address=0x4c3560 game/d3dpoptb.exe
```

[Raw probe JSON and tool versions](original-startup-movies/README.md) accompany
the inventory. The [startup-boundary trace](original-startup-boundaries.md) and
[input/player trace](original-movie-input-player.md) supply the bounded
follow-up evidence. Native visible ordering, held-input/transition behavior
and missing-media recovery remain open. Browser conversion, distribution rights,
autoplay policy and display scaling require separate decisions. Mission-flyby
“Skip introduction” and `process_video_commands` at `004a4960` are not evidence
for startup FMV behavior.

The evidence package contains only research text, metadata, hashes and bounded
assembly excerpts. It excludes the archive, installer, executable/media binaries,
decoded media and full executable disassembly. Native boot/skip interaction,
browser playback and game build/tests were not run for this research-only change.
