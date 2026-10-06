# Firewarrior packing repair review

**ACCEPT for source/probe readiness** at
`2ea28387a340d4d7d5f365ae27ed9ac75c51dc93`, delta from `dc9c2b2d`.
The source/data repair resolves the demonstrated8192 texture-limit regression:
the atlas is again2048×8128, with new artwork confined to previously empty tail
subslots. No blocking packing, coordinate-consumer or preservation-check defect
was found. This is not a runtime, browser, full-suite or merge acceptance.

The earlier review and its immutable evidence boundaries remain in
firing-candidate-source-dc9c2b2d.md. The exact ranged runtime, port caller, native
probe, sixteen fixtures and frozen owned policy have not changed. The prior18/18
focused result belongs to dc9c2b2d, not automatically to this new source tree.

## Independent read-only findings

- HEAD was exact and tracked status clean. The seven app/public changes and
  their bytes match candidate-sources.json.
- Every old5,091 frame and4,042 piece record remains byte-for-byte equivalent
  to b020 data; old animation entries and other metadata, including dimensions,
  columns32/cell64, frameCounts and source720/728, are unchanged. All new frame
  indices remain identical to dc9c2b2d. The only new-piece record changes are
  atlasX/atlasY on the80 appended pieces.
- All80 placements match the predeclared deterministic four-per-cell formula.
  Each reserved32×32 subslot is inside the atlas, wholly transparent in b020,
  disjoint from every other new subslot, and outside every old piece cell.
- Independent in-memory PNG reconstruction equals the candidate's complete
  decoded image: b020 pixels plus exactly the original source pixels of those
  new pieces at their explicit coordinates. This checks all untouched bytes,
  including padding, more strongly than checking only nonzero baseline bytes.
- The three current generated outputs equal their retained packed-stage outputs.
  Original HSPR/PAL input hashes and the current atlas provenance hash agree.
  The author's packed-static-shaman report is tied to the exact current script
  hash and atlas hash; its reported5116 original frames/4122 pieces/360 sources/
  16 resting directions and b020 preservation are retained.
- All eight historical frame/piece prefix hashes in shaman-appearance.test.mjs
  independently match. Its original animation hash matches after removing only
  the known restingGesture/firing additions. The previous stale totals are now
  exactly5116/4122, and its2048×8128 assertion again matches the artifact.

Python verification of the above completed with exit0 in approximately2.50s.
Python syntax parsing of all changed Python readers/importer also passed.
`git diff --check dc9c2b2d HEAD` passed. No Node, npm, dependency operation,
native machine code, browser, full importer, or other runtime execution was
performed by this review. Only this ignored review file was written.

## Importer and consumer review

The append remains after all existing Shaman and resting imports. It resolves the
same row15/object94/source56/draw13 and exactly80 unique non-shadow pieces, then
asserts their contiguous indices begin at4042 and the existing grid is2048/64/32.
That exact boundary fails closed if a future full-import sequence drifts; it
cannot silently repack another family. The full import still creates its
established grid before calling this bounded append.

New destinations must be zero in any pre-existing image rows. Rows beyond an
earlier full-import baseline are newly allocated; deterministic cells4042..4061
are disjoint from all Shaman/resting slots created earlier in the same append.
Fixed indices,80-piece count, max32 dimensions and deterministic subslots prove
non-overlap; the independent verifier and Node regression also test it directly.
Every repeated-import existing firing piece must already have its expected
coordinates, so the importer refuses to reinterpret dc9c2b2d's unpacked records
as an authorized baseline. Height comes from real rectangle extents plus retained
old height rather than total piece count. The retained repeated import reports
zero additions and unchanged hashes; this review did not repeat a mutation.

spriteAtlasOrigin preserves the legacy formula when coordinates are absent and
uses explicit coordinates when present. The shipped GPU UV owner and canvas HUD
portrait owner both use it. Mirrored U offset, piece dimensions, layer offsets,
scaling, V normalization and texture filtering remain unchanged. All generated
new pieces have both integer coordinates, and the regressions enforce this.

The native sprite reader, static Shaman reader, two browser pixel-reference
readers and the independent firing verifier now use the same metadata semantics
with independent calculations. No expected native fixture or historical pixel hash
changed. The static Shaman addition allowlist expands only to the separately
proved firing family. The baseline ordinary browser observer remains historical;
its new candidate adaptation is separately in preparation and was not reviewed.

The new origin helper returns a small object per call, including each visible
sprite layer. That is an additional allocation in the render path; no performance
impact was measured here. Keep affected quality/performance conclusions bounded
and do not claim a speedup. It does not block the coordinated correctness runs.

## Remaining verification

New focused artwork/phase/resting/Shaman/sprite/portrait checks, standard
check/build, formatter/lint/quality receipts and actual candidate browser
acquisition/firing/recovery/pixel evidence remain required. Formatting is pending:
the inherited ranged conditional is102 characters under a100-character printWidth,
and the simplified HUD drawImage may be reformatted. Any resulting source delta
must be pinned and reviewed before native/browser runs.

The corrected atlas fits the previous8192 capability class; a rendered witness
must still record the actual context limit, decoded/source texture identity,
allocation/upload dimensions and no resize warning. Hardware performance and
original raster equivalence remain unclaimed.

## Passive upload observation proposal

There are existing transparent texSubImage2D examples in
scripts/check-browser-footprints.mjs:23–29,
scripts/check-browser-person-panic.mjs:303–318 and
scripts/check-browser-encounter.mjs:69–79. They forward the original call and
record timing/dimensions, but do not identify the initial unit-atlas allocation.
The texture-edges check accesses renderer.properties.get(map).__webglTexture,
but then creates/binds a framebuffer and reads pixels. That is not a passive
ordinary-scene upload observer and should not be imported wholesale.

The smallest proposed observer for the current Three0.185.1 path is:

1. Install owned transparent WebGL2 texStorage2D/texImage2D/texSubImage2D wrappers
   before application scene creation. Each calls its saved original exactly once
   with the original receiver and arguments, preserves return/throw behavior,
   and records only bounded metadata. Observer bookkeeping errors must invalidate
   QA without changing application calls. Do not invoke uploads, initialize a
   texture, render, tick, bind textures or change GL state from the observer.
2. At each relevant TEXTURE_2D call, read TEXTURE_BINDING_2D to capture the exact
   bound WebGLTexture. A WeakMap identity plus context identity avoids additional
   bindTexture/activeTexture hooks. Record allocation level/internal format/width/
   height, and upload overload, level, offsets, source dimensions/type/identity.
   Do not save image bytes or unbounded call histories.
3. WebGL calls can fail without throwing. Do not label a forwarded call successful
   solely because it returned. For the observed Three immutable-storage path,
   retain TEXTURE_IMMUTABLE_FORMAT before and after texStorage2D and
   TEXTURE_IMMUTABLE_LEVELS afterward. The first false→true allocation transition,
   matching expected levels and2048×8128 arguments, supplies positive allocation
   evidence for this handle. Do not consume gl.getError and thereby alter the
   application's error observation. A mutable texImage2D-only path is outside
   this narrowly reviewed proof; record it and fail the allocation claim rather
   than inventing dimension evidence.
4. At actual capture, correlate that handle/context with the live unit layer's
   SpriteMaterial map through its existing renderer property. Require the normal
   level0 upload for the same handle to use the original decoded2048×8128 image,
   at zero offsets, with the expected formats. Combine this with actual context
   MAX_TEXTURE_SIZE/renderer capability, completed source/version identity, full
   resize-warning capture and visible actor pixels. Allocation alone does not
   establish original texel colors or completed content upload.
5. Restore only owned wrappers, checking they have not been replaced by another
   owner; retain failures and counts. Source freeze and separate review are
   required before running this added observer. These are design instructions,
   not an implemented or tested checker.

For this pinned loader, matching source dimensions plus an adequate capability
already excludes Three's resize branch by source reasoning. The observer adds
direct allocation/upload evidence. texture.image by itself remains insufficient,
because Three can upload a resized temporary canvas while leaving it unchanged.
