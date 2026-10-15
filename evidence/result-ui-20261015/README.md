# Result UI restoration evidence

Refs #457. This is an in-progress source-backed presentation slice.

- Native source packet: `native/`. Reference PNG is a static reconstruction from
  source artwork and exact layout arithmetic, not an original-game screenshot.
- Source explanation and adaptations: `decomp/research/original-result-ui.md`.
- Importer validates original hashes, source geometry, titles and all224 glyphs.
- Focused component/layout tests pass5/5 at the initial implementation checkpoint.
- Full-game before captures failed twice during Vite route readiness (SIGKILL),
  including warmed-cache768MB heap. No browser launched; no lifecycle claim follows.
- Comparable before screenshots use byte-extracted baseline JSX/styles with exact
  production HUD scaling, explicit outcome/time fixtures and an empty battlefield.
  Actions are inert in that baseline. These are presentation fixtures only.
- Full final validation, after screenshots and independent implementation review
  are pending. No gameplay parity credit, native pixel equivalence or hardware
  performance claim is made.
