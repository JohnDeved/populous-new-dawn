# Native object draw-hook preparation

This bounded #143 slice reuses the native `onBeforeRender` callback for each
Object3D and RenderView pair. The callback is created only on the private WeakMap
miss and is still assigned at its original position during every eligible
`prepare`. No warm-path closure or IIFE is added.

The shipped path is `GameScene.animate` → `renderSceneFrame` →
`RenderView.prepare`. Material/shader registration is already identity-cached;
indexed geometry conversion is already conditional. The object callback was
nevertheless recreated at each preparation of a retained Mesh, Sprite or Line.

The retained body reads the current draw material's native uniforms, current
object and parent metadata, and current view ranges/overview state. It captures
only the object and view identities. The per-view weak keys add no strong object
list, material/texture snapshot, Scene or World capture. New objects and views
receive their own callbacks. `nativeIgnore` still bypasses the entire visitor,
including the real SelectionOverlay's custom hook.

All other preparation remains unchanged: full traversal, frustum assignment,
geometry conversion/disposal, shared-material ownership/cloning, shader patches,
program keys, registration and Scene before/after hooks. Replacing a foreign
object callback is still the existing eligible-preparation policy.

Focused checks invoke actual `prepare` and generated hooks with current
metadata, range/overview/atlas changes, replacement draw materials, parent/view
changes, clones and ignore transitions. They retain real index conversion,
palette/native shader patch and material ownership checks, plus actual unit and
bank6 model13 factory/removal coverage with complete World/terrain/RNG equality.
Browser/GPU leaves use existing supplied fixture boundaries.

The paired five-file run passed all 18 candidate cases. Pristine main passed 17
and failed only the callback-reuse cost assertion (`mesh/64/warm-1`: 64 versus
zero new callback identities). All semantic cases passed in both roles.

The diagnostic emitted all 18 rows before assertions: Mesh and Sprite populations
64, 256 and 1024, each with cold, warm-1 and warm-2 preparations. For both object
kinds, the measured new callback identities were:

| Population | Candidate cold | Candidate warm-1 / warm-2 | Pristine cold / warm-1 / warm-2 |
| ---------- | -------------- | ------------------------- | ------------------------------- |
| 64         | 64             | 0 / 0                     | 64 / 64 / 64                    |
| 256        | 256            | 0 / 0                     | 256 / 256 / 256                 |
| 1024       | 1024           | 0 / 0                     | 1024 / 1024 / 1024              |

Every preparation still assigned N hooks in both roles. Draw-time uniform checks
ran outside the identity measurement. This observes the generated object-hook
identity boundary, rather than timing or total allocation bytes.

Fresh scoped Oxfmt and both ESLint checks passed. Strict Oxlint remained FAILED
in both roles with ten inherited warnings and no errors. The separate complete
diagnostic comparison passed after normalizing only numeric locations in
`app/render-view.ts`; rules, severity, messages, help, whitespace and multiplicity
were retained. The initial Oxfmt failure and its formatter-only repair remain
historical records. Full standard check/build are NOT RUN at this checkpoint.

Only this per-object callback boundary is targeted. Scene callbacks,
`ownMaterial` closures, material-array allocations and full scene traversal remain.
Total allocation bytes, GC behavior, hardware CPU/FPS, browser pixels, leak
freedom and complete #143 incremental-registration acceptance are not established.
