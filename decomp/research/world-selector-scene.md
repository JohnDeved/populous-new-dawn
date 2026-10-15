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
Final repairs, lifecycle checks and standard gates are still pending.
