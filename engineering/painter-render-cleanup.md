# Painter render cleanup prerequisite

This change does not batch transparent effects or alter painter ordering. It puts
both shipped render entry points (live renderSceneFrame and modal-suspended animate)
inside Painter.render, so a renderer exception cannot skip existing material/group
restoration merely because Three did not invoke scene.onAfterRender.

Each synchronous render records the current transparentMeshes stack length. Normal
afterRender and the finally path restore only entries above that checkpoint. The
normal callback is still invoked by Three, not by cleanup. After it has restored
its entries, finally has nothing to do. A nested render has a later checkpoint,
so its success or exception does not unwind the active outer render's entries.
The checkpoint stack is popped even if restoration throws. Direct existing
Painter.update/afterRender callers outside this wrapper retain the prior full
cleanup behavior.

This preserves the existing restoration record and mutation contract; it is not
an exception shield for arbitrary throwing mesh/material/geometry accessors or an
extension of geometry-replacement support. A future private-index geometry lease
must extend its own ownership records explicitly, not assume this prerequisite
already restores geometry objects, indices or draw ranges.

The render path adds one retained small numeric checkpoint stack per Painter and
one push/pop per synchronous render. It does not invoke callbacks twice, add scene
traversals or allocate a closure per frame. New cleanup tests remain serial;
existing helper and parallel classifications are not broadened. No performance
improvement is claimed.
