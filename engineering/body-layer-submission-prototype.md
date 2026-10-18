# Owned body-layer submission prototype

Private experiment, not browser-pixel or performance acceptance. This does not
batch objects or change Three's sorting, shaders, scene identities, Painter
commands, or picking geometry.

## Exact omission

The shipped `animatePerson` factory registers only its new Sprite/material pair.
RenderView's own shader installation binds the default compile hook, generated
compile/program-key functions, current per-object draw callback and local uniforms.
The GameScene render sites supply their owned unit group map to the existing
Painter render lease. Generic callers without that map remain unchanged.

After complete Painter preparation, an owned opaque body layer may temporarily
have `material.visible = false` only when its current one-slot depth texture value
is exactly 2. The installed native sprite shader computes clip z = 2*2-1 = 3,
w = 1, and changes only xy afterward. All vertices therefore clip beyond the far
plane. Renderer capabilities must explicitly exclude logarithmic and reversed
depth. Non-null scene override materials, overview, blended materials, absent ranges, generic objects/clones,
changed material/map/compile/program-key/draw state and noncanonical visibility
fall back. This is not an inference from absence of a Painter command.

Preparation observes material sharing, including Points and native-ignored drawables, and
revokes the body capability before its ordinary per-object material cloning. Points
retain their original material, callbacks, culling and non-native preparation.
The shipped producer never shares these materials. `releaseBodyLayer` is the
explicit handoff before external/custom ownership of a registered layer or its
material. Arbitrary raw graph/material mutation from another object's draw or
compile hook is not an owned GameScene operation: custom callers must omit the
owned map or release the affected body layers before the render. Visible custom
object after-render/material render hooks conservatively disable suppression;
custom native-ignored draw hooks do likewise. Hidden custom hooks are not called
by Three and do not disable an otherwise owned frame.

The lease restores only its own changes in normal and throwing paths. A nested
render first restores outer material visibility, then uses the generic path;
outer finally cleanup remains idempotent. Logical `Object3D.visible`, hierarchy,
Sprite center/scale/atlas, Painter slots and commands remain unchanged. Existing
caller-owned material visibility false is neither admitted nor overwritten.

## Deliberately deferred internal state

An omitted draw does not invoke the stock per-draw uniform publication callback.
Its otherwise-unused draw-local native uniforms can remain stale. Production
reader audit finds only RenderView's draw callback and shader binding, with no
intervening gameplay, picking or frame-export consumer. The next submitted stock
draw unconditionally republishes the relevant range, atlas, size, anchor and basis.
A regression compares that next visible draw to the unsuppressed path. This is
not a promise of equality for unused internal draw state or WebGL program caches.
Custom readers require ownership handoff, not callback replay to manufacture
internal equality.

## Evidence and remaining gates

Controlled tests exercise actual RenderView/Painter with Three resources and
renderer IO leaves, including overview, depth modes, ownership release, cloning,
sharing, shader/callback replacement, nesting and exceptions. Private authored
Level 2 constructor comparisons cover camera rotation, overview and return, unit
motion, exact logical state/Painter depth/commands and native/ordinary pick results.
Those comparisons do not include unused per-draw uniforms or rasterized pixels.

Real renderer/browser pixel comparisons are required before shipping. Any later
whole-frame diagnostic must include admission, sharing observations, map
iteration, visibility toggles/restoration and all other added work. Fewer submitted
objects alone is not a measured CPU or GPU improvement. No public performance
claim or timing acceptance accompanies this prototype.
