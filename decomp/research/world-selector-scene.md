# Shared original selector scene (work in progress)

Refs #17, #457. PR464 merged into main `7ed3ea04f483e3a9c7b0c3f788dda4a76c4d442d`; exact development base
`265444c6dc5ce58ec7e6427b123374a0de7dc44d`; no complete UI parity claim.
Canonical GitHub main at task start: `762be79c810d8ae5d9e05d8e44e283bdff94b47b`.

## Plan and evidence

Replace the adapted orbit diagram and separate enlarged preview with one scene:
all 25 authored bodies, their own imported textures, source-selected camera focus,
elapsed orbital motion, the existing adaptive screen-ring mesh and vertex light,
sun wobble/alpha annuli, textured orbit ribbons, point stars and a black clear.
Use GPU triangle/point rasterization with explicit transformed-lit coordinates and
depth writes rather than per-pixel JavaScript rasterization each animation frame.
Keep the original panel, existing opening availability/replay, all 23 direct
mission choices, Tutorial/checkpoint/Back and actual world launch ownership.

Source packets and independent depth supplement:
https://github.com/JohnDeved/populous-new-dawn/tree/4c0861be5a07e11a58cef7e027ca4fb704a34aeb/evidence/selector-next-scene-20261015
Portable packet SHA256: `24bd3b0d502c31762ce036a4b519a5934fed6a82c4fe2105b13aaf95e4f110e0`.
Verified supplied EXE SHA256: `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
Original executable is read as data, never executed or emulated here.
Title/tooltip/cursor binding and deterministic asset preparation received independent
static review on 2026-10-15 and are integrated separately from the scene math.
Native Western glyph title/tooltip images preserve dimensions and source strings;
the panel cursor is frame12 with hotspot(0,0). CSS cursor device scaling, source
palette RGB and per-selection palette switching are explicit browser adaptations.
Tooltip text waits strictly longer than500ms, follows the pointer and has no invented
frame. Keyboard selection remounts the tooltip owner, and resize/scroll clears it,
as explicit browser stale-tooltip prevention; the native same-ID timer normally
persists. Fallback/accessible button labels remain ordinary browser text. No type4 space sprites or fullscreen plsbackg are added.

## Deliberate modern compatibility choices

- One scene owner. Fresh lifecycle on every mount, zero first dt after assets load;
  visibility suspension resets presentation timestamps and drops hidden elapsed time.
  Native first dt was load-dependent and source-global state persisted on reentry.
- Source camera integrator and orbital update ordering at a fixed 1/120-second
  internal step, with interpolated uncapped presentation. This is a modern schedule,
  not a claim that the original ran at 120Hz. Cap elapsed catchup at one second.
- Keep progression anchor derived from the existing recommended opening mission
  separate from the camera-selected body. No campaign unlock semantics expansion.
- Ordinary UV spin at 0.6 units/second; sun phase rates use source RNG speed values
  times 30 per second. These chosen cosmetic rates have no historical FPS claim.
  Deterministic seeds replace unknown shared historical RNG state. Preserve sun
  phase ownership by vertex index across adaptive tessellation changes.
- Linear repeat RGB8/RGBA8 sampling, source vertex diffuse plus specular, source
  alpha/inverse-source-alpha blend, no culling, depth test/write. Modern GPU raster,
  perspective-correct color/UV interpolation, color precision and clipping differ from the unmeasured original device.
- The scene and panel share proportional 640x480 logical framing. Tessellation is
  logical-radius based, clamped to the existing safe [1,255] mesh range. High-DPI
  stars cover one logical pixel. Invalid centre/front depth is safely rejected;
  orbit segments crossing the near plane are omitted, as the source path does.
- Panel remains DOM art for accessibility; the final partial star batch is composed
  before the DOM panel rather than after it. This explicit overlay correction keeps
  controls legible; full original draw-order pixels are not claimed.

## Acceptance and delivery sequence

1. Commit/push this plan and source math WIP; create a dependent draft PR.
2. Build the integrated prototype and capture clean comparable before/after rendered
   screenshots before expensive final gates, serialized with the parent.
3. Add focused math, texture provenance, timing, clipping and lifecycle regressions.
4. Run source-bound typecheck/build/parity/orchestration/quality and full durable
   test-file batches. Preserve failed receipts; resume only missing batches.
5. Render selection transition, multiple viewport/DPR, responsive inputs, missing
   assets/context, repeated open/close, real launch and paused world identity.
6. Independent review and repairs; root alone merges. Headless/software-rendered
   screenshots are reconstruction evidence, not historical pixel or hardware FPS
   parity. #17 and #457 remain open for their remaining scope.

## Rendered prototype at `52e645ad`

The sandboxed Chrome/ANGLE software-rendered scene episode passed with clean
source fingerprint `7ef6e8668cbcad280b4e1c048799d5fe86ffb8a26baef9f8db982e537afb6f38`.
Naturally settled Mission 1 and Mission 2 centers were `(320,240)` logical pixels,
after 12.674 and 25.641 seconds. The projected nominal radius is
`400*8/hypot(200,66.6667) = 15.1789`; the source mesh's last submitted ring ends at
`sin(3*pi/8)` times that radius, giving the observed extent `14.0235` pixels.
A bounded readback before/after an actual ribbon draw changed 110 of 243 sampled
pixels. Responsive selection/progression and DPR checks passed; DPR4 backing was
capped to 4096x3072. Separate warmed CPU submission samples (299, after 5 discarded)
were p95 4.8 ms and max 31.4 ms on this software-rendered environment. They do not
measure GPU completion or establish hardware frame rate.

The native scene/title/panel is the default presentation; browser compatibility
controls are explicitly grouped behind the visible Browser controls toggle.
Final application source at `cd08f30aec9fcda2d78fda366d445f72e561828e` has passed
typecheck/parity/orchestration and reviewed scene/lifecycle/text checks. All429
test files have passing coverage with2760 tests, using a complete43-batch inventory
at70c1b946 plus entire repaired batches18/36 atcd08f30a. Initial11 failures are
retained; the intervening diff only repairs harness/test expectations and adds one
signal regression. No application subtree changed across those heads.

Canonical Cloudflare production-target build check116708241907 succeeded atcd08f30a;
the recorded Workers command invokes the full vinext build. Four local ordinary
Sites-target builds were killed with exit137, including a lower-heap attempt that
reached SSR output. They remain failed with no proven cause. Global lint/format/
unused findings are baseline-attributed, not passed; health/duplication checks pass.

Actual asset/context restoration, real visibility resume and paused-world identity
remain BLOCKED/NOT VERIFIED after retained browser/server failures. A remote-only
browser attempt failed before loading UI. Accepted evidence and limits are indexed
in evidence/selector-scene-validation-20261015. Root owns final merge; this does not
close the full original UI or campaign issues.

## Widescreen compatibility correction (2026-10-19)

The former CSS restricted the entire rendered scene to the panel's centered 4:3
frame. On 1920×1080 it rendered only 1440×1080, leaving two 240-pixel unused
bands; 3440×1440 left two 760-pixel bands. This is a modern display defect, not
an original-art constraint. The scene now uses the full available width while
retaining the original height and bottom anchor. The GPU maps native projected
coordinates around (320,240) with a uniform CSS scale of
`min(sceneWidth / 640, sceneHeight / 480)`, exposing more horizontal scene instead
of stretching it. Star clipping expands by half the extra logical width on each
side. The default/native 640×480 star bounds and all original projection, motion,
mesh, texture, lighting, and depth math remain unchanged. Backing allocation stays
capped at 4096 per axis independently of CSS geometry and DPR.

The panel, title, glyph positions, tooltips, and their original common art scale
are unchanged. There is no celestial picking handler in the shipped selector:
the canvas is aria-hidden inside a pointer-events:none scene, and mission input
uses the existing DOM panel buttons and keyboard handler. Therefore enlarging the
scene does not translate or stretch an interactive hit target. No cursor/help
sources, imported assets, profile rules, or gameplay parity credit change.

Portable regressions cover native/16:9/ultrawide/4K frames, repeated resize back to
4:3, DPR1/1.25/2, bounded backing allocation, circular screen geometry, native
panel/title relationships, and stars in both newly exposed margins. These do not
establish rendered acceptance. Required hosted acceptance is a comparable before
(base ce0c4f7e4415366f3f63807311b3d97d30952750) and candidate capture at 640×480,
1920×1080, 3440×1440 and 1920×1080 DPR2, opening Campaign from the shipped main
menu and waiting for the same settled Mission 1 scene. Inspect native center and
planet proportions, lateral stars/orbits, unchanged bottom art and glyph hitboxes,
hover tooltip and Start highlight. Repeat selection Mission 2 (locked), ArrowRight
back to Mission 1, resize 4:3→wide→4:3, and ordinary Mission 1 launch. Local browser
execution is blocked in this task; the parent coordinates hosted captures and full
check/build gates. Until those run, visual acceptance remains pending.
