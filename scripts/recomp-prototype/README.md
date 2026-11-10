# Original-reference browser prototype

Refs #1020. This is a preservation checkpoint for authored, synthetic host tests.
It is **not a runnable Populous recompilation**, a shipped game feature, or a visual
parity claim. No original executables, DLLs, game assets, translated original code,
downloaded third-party source, credentials, or compiled binaries are included.

## Contents

- `browser-boundary-fixture`: indexed framebuffer/input model, bounded sparse
  guest memory, protected pages and copy boundaries. `c-memory` is a newly authored
  C implementation and synthetic threaded framebuffer test.
- `browser-host-fixture`: deterministic scheduler, JSPI/Worker stack experiments,
  guest-call convention models, native C tests, and browser harnesses.
- `c-wasm-trial` and `integrated-memory-trial`: pinned Emscripten trial sources.
  Their `workflow.yml` files are **inactive historical examples**, not files under
  `.github/workflows`. They retain original experiment paths and source hashes.
  Do not copy them into active workflows without reconciling paths, ownership,
  resource admission and review. No CI or deployment configuration is changed here.
- `SOURCE-MANIFEST.json`: SHA-256 of the preserved source snapshots, before any
  later development. Existing investigation data and failed attempts are retained
  separately and are not deleted by this checkpoint.

All small frames and instruction/calling-convention tests are synthetic. Platform
contracts inferred from source remain hypotheses until validated against the
original. The sparse Map model is not a drop-in implementation of direct C pointers.
The C sparse adapter is single-owner; the separate shared JS model does not establish
C pthread concurrency. Original startup, OS shims, memory escapes, actual renderer,
save/input behavior and deterministic comparison remain unfinished.

## Reproduce focused checks

From repository root (Node 24; no dependency install required):

```sh
for f in scripts/recomp-prototype/browser-boundary-fixture/test*.mjs \
         scripts/recomp-prototype/browser-host-fixture/test.mjs \
         scripts/recomp-prototype/browser-host-fixture/test-guest-call-contract.mjs; do
  timeout --kill-after=2s 30s node --max-old-space-size=64 "$f"
done
```

The stack tests are separate runtime-capability probes. JSPI requires a runtime
that exposes `WebAssembly.Suspending` and `WebAssembly.promising`.
Native tests require GCC, pthreads and UBSan. The supplied `c-memory/run-tests.sh`
compiles into its fixture directory; use an isolated copy and retain outcomes.
Browser harnesses require the reviewed installed Playwright/Chromium environment,
explicit output paths, and (for C tests) the corresponding WASM build. They must not
be launched concurrently with other heavy project jobs.

## Verified previous experiments

These links bind the original trial snapshots, not every file in this preservation
branch or future changes:

- [Canvas2D/input](https://github.com/JohnDeved/populous-new-dawn/actions/runs/42803983139):
  exact full-frame synthetic pixel checksum and Ctrl+Alt interior click. Earlier
  boundary-coordinate attempt failed; this does not prove subpixel-edge precision.
- [Worker/WASM stack](https://github.com/JohnDeved/populous-new-dawn/actions/runs/42804561189):
  blocking/resume and nonisolated rejection controls.
- [Emscripten C pthread](https://github.com/JohnDeved/populous-new-dawn/actions/runs/42806925330):
  nested stack, TLS and timeout controls.
- [C thread + sparse memory + Canvas2D](https://github.com/JohnDeved/populous-new-dawn/actions/runs/42807767378):
  exact 64-byte synthetic frame after pitched cross-page copying.

Full repository check/build, complete original-game execution and original-versus-
New-Dawn comparison are **not completed by this checkpoint**. Keep the PR Draft.
