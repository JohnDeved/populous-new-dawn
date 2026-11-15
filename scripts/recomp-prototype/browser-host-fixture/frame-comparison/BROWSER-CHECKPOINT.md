# Browser ownership and descriptor checkpoint

This preserves authored synthetic browser-owner fixtures and descriptor validation for #1020. No original game code, frames or binaries are included.

`owner-core.mjs` holds memory/palette state behind a transport-neutral ordered command handler. The dedicated browser worker delegates to it. The test verifies four distinct frame/palette generations, rejects malformed/shared input, and checks exact Canvas2D output. The standalone runner requires installed Playwright plus Chrome 156.0.8078.79 at /opt/google/chrome/chrome and serves only fixture files over loopback. It preserves browser/context/server cleanup receipts; worker termination is requested, not independently observed. No active CI workflow is added.

Verified previous run: https://github.com/JohnDeved/populous-new-dawn/actions/runs/42850966024 at f4d2e304295cdc5f2e53db452b478540cf711809 completed successfully. Both isolated and nonisolated pages matched four synthetic frames exactly. Shared-input rejection was checked only in the isolated page; unavailable on the nonisolated page, not a passing control there. This run does not validate later file changes or original-game rendering.

Run Node checks from repository root:

```sh
node --max-old-space-size=64 scripts/recomp-prototype/browser-host-fixture/frame-comparison/test-owner-core.mjs
node --max-old-space-size=64 scripts/recomp-prototype/browser-host-fixture/frame-comparison/test-capture-presentation.mjs
node --max-old-space-size=64 scripts/recomp-prototype/browser-boundary-fixture/surface-descriptor/test.mjs
```

`decode.mjs` validates a copied full-surface DirectDraw-style descriptor; `capture-presentation.mjs` composes it with bounded sparse reads and normalization. Full-surface provenance, software-renderer path and exclusive ownership are caller assertions, not synchronization or independently authenticated evidence. Rectangle locks and hybrid Direct3D paths are unsupported. Resolved palettes must be copied nonshared arrays. Real presentation-thread ownership, original runtime integration and reference-versus-port capture alignment remain unfinished.
