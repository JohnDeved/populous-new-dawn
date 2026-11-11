# Synthetic framebuffer comparison and ownership

Authored test tooling for #1020. No original-game execution or screenshots are included.

- `compare.mjs` compares bounded RGBA captures with matching scenario, camera/input hashes, seed, tick and dimensions. It retains separate source/runner identities; supplied metadata is not independently authenticated. Reports exact equality and numeric pixel differences, not perceptual equivalence.
- `normalize-surface.mjs` converts copied RGB565 little-endian or indexed8 rows with explicit pitch and resolved XRGB palette to opaque RGBA. It does not implement gamma management or Direct3D compositing.
- `capture-surface.mjs` reads only visible rows from a bounded 32-bit guest address range. Sequential reads are not atomic; the caller must own or pause/join the renderer and palette.
- `surface-owner-worker.mjs` is a Node-only synthetic single-owner worker, fixed 2×2 surface and at most 32 commands. It rejects shared input backing before mutation, orders pixel/palette transactions and transfers independent captures with sequence/generation. It is not a protocol for arbitrary concurrent original-game renderers.

Run from repository root:

```sh
for f in scripts/recomp-prototype/browser-host-fixture/frame-comparison/test*.mjs; do
  timeout --kill-after=2s 15s node --max-old-space-size=64 "$f" || exit "$?"
done
```

Synthetic checks cover exact comparison metadata, all 65,536 RGB565 values, padding/palette handling, high-address page crossing, final address 0xffffffff, ordered frame generations, shared-input rejection and unchanged state after rejected commands. The worker test awaits termination; old-space limits are not total process RSS caps.

Browser ownership validation and connection to an original runtime remain future work. A real adapter must identify the execution thread owning every pixel and palette mutation, capture at its presentation boundary, and prove any required pause/join or locking. Metadata labels alone do not establish original-game provenance or matched execution.
