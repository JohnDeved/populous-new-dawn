# Firing follow-up source review

Reviewed exact clean freeze
`6f93bf493139bb61e86e3b275269277c12c09593`, delta from df2a6744.

- **Corrected-test/full-gate readiness: ACCEPT.** The approved atlas append is
  tested against an independently verified original-pixel witness without
  weakening the historical pixel/layer preservation requirement. The coordinator's
  authorized bounded full retry can proceed.
- **Candidate QA/fake-GL/runtime-preflight source readiness: ACCEPT.** The actual
  Three ESM bundle inputs are now pinned and included in runtime/preflight/outer
  input guidance. This resolves the prior browser-provenance rejection.

These are source/readiness verdicts. Full check/build, fake-GL execution, actual
runtime preflight, browser execution and visual acceptance remain separate gates.
No runtime, native, browser, npm or producer command was executed by this reviewer.

## Pixel witness independently established

I independently decoded the b020 PNG using PNG chunks/CRC checks and zlib,
without importing the witness producer or importer. The original PNG SHA remains
9bdbe47bc816c0c75036c7899a6bccdb8aeb47931dc0f49d541c957082afbcbd.
Its complete2048×8128 RGBA byte stream hashes to
13263364f8d2c56a1dec6b73f26b734daa1068d59f9ff8328411027e6ad21184,
exactly the new witness value.

All five witness input hashes match the supplied original VSTART, VFRA, VELE,
HSPR and PAL files. Traversing source56–63 through those tables independently
derives the80 new piece sources after subtracting the original piece set. A
separate small RLE decoder over each original HSPR record and the palette
reproduced all80 dimensions and RGBA hashes. Every descriptor, source ordering
and deterministic atlas origin matches the witness and shipped piece metadata.
Every destination was zero in b020 and all rectangles are disjoint.

Clearing only the exact witnessed w×h rectangles from the current decoded image
reproduces **every byte** of the original b020 RGBA image, including all prior
occupied pixels, transparent texels, padding and remaining empty area. No whole
cell or larger region is masked. Witness file SHA256:
e22a5f28c06c135539e578077c6e0cae5c94a7d8b0084c7e1645bc930b76b449.

The new CI test faithfully implements that contract: exact appended descriptors,
each original new-piece pixel hash, then the entire restored historical pixel
hash. It also retains current PNG/provenance consistency, explicit PNG format,
dimensions, filter rows, existing3216 piece-hash count,576 native layer cases,
their frame/flip/draw/pixel assertions and the unrelated Brave-carry test. The
original unit-sprites fixture is unchanged. Ordinary CI requires neither Git
history nor the original game/baseline PNG.

The explicit --write-witness preparation option follows the full existing
native-input, frame/layer, old-prefix, empty-subslot and complete-atlas checks.
It uses exclusive creation (`open('x')`) and cannot overwrite an existing witness.
Normal verification does not create/update this fixture. The witness is an
original-data expectation established during this review, not a new expected
hash copied blindly from a failing candidate.

Independent read-only witness audit: exit0, approximately2.22s. Production
app/public bytes, native probe, owned policy and historical native fixtures remain
unchanged from df2. Earlier runtime/native correspondence therefore remains valid
with its original source labels.

## Focused and full-attempt receipts

Raw stdout/stderr artifacts, their recorded hashes, exact source identity and
before/after equality were independently checked:

- atlas-guard-before-01.json at df2: failed/1, the specific old whole-PNG assertion
  compares candidate5b43e27e… against original9bdbe47b…. Receipt SHA256
  449ed4bdb3abaf1799f363da9975fa8480c9f8a43a108cbdb67e4f93587e1adc.
- atlas-guard-after-01.json at6f93: passed/0,28 tests/28 passes, no cancellation,
  approximately5.84s. This includes sprite, firing phase/artwork, resting and
  Shaman preservation. Receipt SHA256
  397329407daf554d21bdf7cdabe3d780c5054c19a4b9fe8c670047f1fb05b767.

The previous full check is still failed/time-limited, exit124. The original
receipt's embedded stdout hash remains intact. The separate post-terminal log
hash matches its supplementary record and begins with that exact original stdout
prefix, adding7871 bytes of termination output. Its final summary is1307 tests:
1302 pass,1 fail,4 cancelled. Do not relabel the partial receipt as a completed
full gate or discard the cancellations. The source repair addresses the specific
atlas assertion; the newly authorized longer full run must establish the remaining
gate result. No build pass is inferred from that failed attempt.

## QA bundle provenance repair

upload-runtime.json now pins the actual installed three/build/three.module.js and
three.core.js alongside package and readable source files. Their hashes match:

- module: bbf5ed13fe4373f5bd38b14ea8e62e9f157327da5638edc6d3863e08b167c9c7
- core: 3718df126d69c125362a03340913204470d8c50238605150e57f808840fb7759

Runtime preflight iterates every manifest key into dependencyFiles and emits the
same paths as outerReceiptInputs. README supplies explicit receipt --input
guidance. The existing scenario's dynamic before/after manifest hashing covers
the added files. Independent source-to-bundle inspection again found complete
WebGLTextures, WebGLProperties and WebGLCapabilities function text byte-identical
inside the installed module. No observer, route, bounds, cleanup, runtime app or
historical baseline assertion changed in this QA repair.

browser-source-preflight-03.json passed/0 at6f93, with unchanged source/input
identity. Its338 source hashes and all checker hashes match current files; all
six Three manifest hashes match the installed tree. It correctly retains
runtimeReady=false and unrun Node/browser gates. Receipt SHA256:
c40cf1eb09c6f595eb8d0e280b278d5a78a0837d83360ea0c9176f709872df2a.

The earlier fake-GL/observer source acceptance stands, now without the bundle
provenance blocker. Run only the coordinated focused tests and runtime preflight;
a later browser launch still needs its separate grant and retained texture,
ordinary-input, screenshot and cleanup evidence. No new native replay is required
for this unchanged application and metadata/test-only follow-up.

Read-only receipt/QA source audit passed; `git diff --check df2a6744 HEAD` passed.
Only this ignored review file was written. No source or fixture edits were made
by the reviewer.
