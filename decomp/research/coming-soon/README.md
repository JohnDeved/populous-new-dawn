# Coming Soon: source-bound implementation proposal

Issue #16, main `c96f042f5475861cb339ea7d24aa666d6775cfd8`.
This proposal is **not shipped, review-ready, or accepted**. The menu integration
must not be published without a deployable media strategy and the required runtime
and rendered-browser gates. #934 owns the separate Credits integration.

## Original facts

The exact original `d3dpoptb.exe` is
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
The original `fmv/trailer.tgq` is 32,317,876 bytes, SHA-256
`ee3d455f715a9b35a1d974c3918bc3600e98d43d64ec87124a3460e2848b9dfe`.
Original installers and executables were read as data, never executed or emulated.

The complete bounded caller `004c3540` requests the trailer with both horizontal
and vertical expansion. All 2,425 `pIQT` frames are 320×240, at 25 fps. The wrapper
flags `0x0ba4265c` and requested 640×480 surface produce the rectangle
`[0, 0, 640, 480]`, not BLOGO's vertically inset rectangle. The post-movie caller
performs restoration calls and returns; their full semantics remain unproved.
The adjacent byte checks and assembly support these finite claims only.

`python3 scripts/check-static-coming-soon.py GAME_ROOT NEW_OUTPUT_DIRECTORY`
reproduces that static proof. Native input evidence remains in
`../original-movie-input-player.md`: delivered downs stop the current clip, not an
entire startup flow. Browser release gating is a compatibility adaptation.

## Conversion result and concrete delivery blockers

The accepted BLOGO importer supplies the unchanged bounded, one-decoder-at-a-time
comparison helper. A first lossless VP9 file expanded to 640×480 was 110,079,661
bytes, above GitHub's 100 MiB blob ceiling. It remains retained as research output.

The second conversion preserves the coded 320×240 resolution and uses uniform
nearest-neighbor presentation for both axes. All decoded YUV bytes, after expanding
both original and candidate to 640×480, match across **all 2,425 frames**.
Decoded SHA-256:
`4d96e7f6f1f33504b95a23e696182d745d16e7d0ae6d9f4cdcef888b63f2ab63`.
The WebM is 80,054,836 bytes, SHA-256
`60b08ae8032065f01ff4d1f31a88f64df6114675ec5e0bd99f24dcb98f375e60`.
The intact file is retained outside public assets. Four exact byte parts are now
materialized in the proposal and hash-bound by the generated Worker manifest.

That file exceeds the current **25 MiB per-static-asset limit** of the repository's
Cloudflare Workers ASSETS route. See the official
[platform limits](https://developers.cloudflare.com/workers/platform/limits/).
No hosting configuration, paid service, credentials, LFS or lossy substitution
was introduced. The source proposal now uses four exact byte parts and a narrow
existing-Worker stream route. Actual Worker/browser/resource acceptance remains
necessary before publication.

Audio is EA ADPCM decoded and transcoded to stereo Opus, not bit-exact audio parity.
All 2,424 source audio packet positions map to emitted frames. Source parsing and
four independently replayed FFmpeg 7.1.5 controls explain the retained sample-count
diagnostics at the source/reproduction level:

- Only the final audio chunk is anomalous: chunk offset 32,316,736, payload offset
  32,316,744, and payload length 1,124 bytes. It declares 1,015 samples per channel.
- The EA ADPCM decoder rounds that declaration to 1,008 samples (36 blocks), while
  the payload has capacity for 1,036 samples (37 blocks). This produces
  `mismatch in coded sample count`.
- The decoder consumes the 12-byte header, 36 × 30-byte stereo blocks, and its
  two-byte terminal skip: 1,094 bytes. The remaining 30 bytes are all zero.
  The generic decoder retains that tail for another decode call. Its zero sample
  count is rejected, producing `invalid number of samples in packet`.

The source trace is FFmpeg n7.1.5
[`adpcm.c`](https://github.com/FFmpeg/FFmpeg/blob/n7.1.5/libavcodec/adpcm.c)
(lines 917–924, 1065–1089, 1101–1104, 1651–1723, and 2287–2299) and
[`decode.c`](https://github.com/FFmpeg/FFmpeg/blob/n7.1.5/libavcodec/decode.c)
(lines 438–440 and 505–510). The ADPCM decoder has no delay capability, so the
generic decoder does not pass it a null drain packet. This replaces the earlier
`conversion.json` inference of a "flush error" and the later uncertainty about the
diagnostic's origin. It is not an instrumented trace of Debian's decoder binary.

The controls use the exact original 40-byte SCHl header and 1,072-byte first pIQT
chunk, one synthetic SCDl chunk, and an empty SCEl chunk. The video header is needed
for demux initialization; only audio is decoded to signed 16-bit little-endian PCM:

1. Unmodified final payload: exit 0, both sample-count diagnostics, 1,008 samples.
2. Its consumed 1,094-byte prefix: exit 0, neither sample-count diagnostic,
   byte-identical 1,008-sample PCM.
3. Full payload with only the declared count set to 1,036: exit 0, neither
   sample-count diagnostic, 1,036 samples.
4. The 30-byte zero remainder alone: expected exit 69, invalid-sample diagnostic,
   no PCM output.

All emitted PCM in these final-packet controls is zero, including the additional
block in control 3. The controls still log the guessed stereo channel layout.
Independent verification checked all 39 retained evidence-file hashes, the original
input and decoder hashes, every packet/frame position and size, and the four
control outcomes. Inputs stayed unchanged. Raw receipts, PCM and stderr are
retained outside the repository.

Total declared samples are 2,138,115 per channel; total emitted samples are
2,138,108. The seven-sample difference is about 0.317 ms at 22,050 Hz. This arithmetic
and silent final-packet output do not establish acoustic acceptance or original-game
decoder equivalence. No importer, historical conversion receipt, source media,
converted WebM, or byte part was changed for this diagnostic correction. No
acoustic playback was measured, and the Opus transcode remains lossy.

## Proposed browser path

Coming Soon opens an isolated modal inside the same mounted main menu. The existing
row and checkpoint state are retained; return restores Coming Soon focus. Menu
animation pauses while the modal is open. No world, save, viewed flag or global
audio preference is created or changed. BLOGO, New Game intros, Credits, Rolling
Demo and other entry owners are unchanged.

The movie uniformly fits a centered 4:3 frame. Minimal browser recovery controls
appear on hover/focus or blocked playback. It starts muted, with an explicit sound
control following BLOGO's compatibility policy. A refused play offers resume;
decode errors retain a truthful message and Skip. This does not imply native menu
movie volume or current saved game sound preferences have been recovered.

One session owns completion, play requests and cleanup. Held keyboard/pointer
inputs drain before revealing the menu, including natural end during a control
press. Stale promises cannot replace newer, hidden, stopped, failed or disposed
state. Visibility pauses/resumes the same clip. Unmount removes listeners,
pauses and unloads media. Window blur releases a stopped input gate if up events
are lost. These are explicit browser lifecycle adaptations.

## Verification status

- Direct production-session tests: 15 passed under Node 24.22.1 using its built-in
  TypeScript eraser. This is not typechecking, mounted React or a browser pass.
- Conversion: both attempts exit 0 and full video equality passes; decoder warning
  and asset-size limits above remain explicit. Raw receipts and exact used importer
  versions are retained. Original sources remained hash-identical.
- The byte-stream route has 21 passing direct-production contract tests under
  supplied Node ASSETS/FixedLengthStream boundaries. They cover range/validator
  semantics, bounded read-ahead, cancellation/cleanup, prefix discard and concurrent
  requests. This is not a workerd, HTTP/2/HTTP/3 or platform CPU/memory pass.
- Four tiny splitter fixtures pass; actual materialized part hashes and reassembly
  reproduce the intact WebM exactly. The original file remains unchanged.
- New component tests and affected menu tests are authored but **not run** because
  the approved JS dependency/runtime workspace is absent.
- TypeScript, format, lint, full `pnpm run check`, build, orchestration selection,
  actual browser screenshots, high-DPI, natural completion, repeat/reopen/failure,
  hidden/resume and performance acceptance: **blocked/not run**.
- `scripts/local-render/coming-soon.mjs` is a proposed actual-Home witness. It has
  not run. Its declared remaining high-DPI/visibility/autoplay gates must also pass.

Keep the feature disabled on published main until actual Worker delivery, exact-candidate checks,
actual rendered evidence, #934 composition and fresh independent review complete.

## Exact-byte Worker delivery

`scripts/split-coming-soon.py VERIFIED_WEBM NEW_OUTPUT_DIRECTORY` creates only
four ≤20 MiB static byte parts and emits `worker/coming-soon-media.json`. It checks
the pinned complete input, reads every generated part back and verifies their
reassembled SHA-256 before returning. Copy that emitted manifest unchanged.
Do not publish the intact 80 MB WebM as a static asset.

`worker/coming-soon.ts` handles only the existing trailer URL via `worker/index.ts`.
GET/206 streams through Cloudflare FixedLengthStream from one part at a time.
HEAD has a null body and performs no part fetch. Unsupported/malformed/multiple
ranges fall back to full 200; unsatisfiable single ranges return 416 with total
length. Strong If-Range, weak If-None-Match, content-bound ETag and revalidation
are explicit. Client cookies/authorization/ranges are not sent to ASSETS.

Upstream abort precedes cancellation; the owned reader lock is released even if
cancel rejects. A partial-read or missing/truncated part errors the stream instead
of fabricating a complete response. The binding's Range limitation still requires
stream-discarding a prefix, potentially almost 20 MiB for one requested byte.
Actual worst-case CPU, cancellation, repeated-seek and concurrency measurements
remain required. Null-body HEAD must be verified over actual HTTP/2 and HTTP/3;
Node tests cannot establish transport headers.
