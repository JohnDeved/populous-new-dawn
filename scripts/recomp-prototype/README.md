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

## Inspect original input identities

Before planning any original-code experiment, use the data-only preflight below.
It reads selected binaries as bytes and never loads, translates, executes, copies,
modifies, downloads, or uploads them. Node 24 is sufficient; no third-party install
or game runtime is needed. Keep reports outside the checkout.

```sh
node scripts/recomp-prototype/inspect-inputs.mjs \
  --profile openpoptb-software --game-root /path/to/verified/game \
  > /path/to/private/input-identity.json
```

`reference-inputs.json` pins the upstream project revision, original binary hashes,
renderer, platform, and source/license links. `openpoptb-software` checks the base
software executable plus both required DLLs. `populous-recomp-web` checks its own
D3D executable pin separately; it is not the original software-renderer route.
Names are matched case-insensitively only when unique. Missing, mismatched,
ambiguous, nonregular, symlinked, changed, or oversized inputs fail with exit 1;
unknown profiles fail with exit 1, and malformed argument lists fail with exit 2. There is no hash override or force option.
Files are limited to 32 MiB each. Use an owned, immutable input directory with no
symlink ancestors or `..` path components; this check is not a concurrent-writer
security sandbox.

Exit 0 means **only the selected binary hashes match the declared profile**. The
report fingerprints this inspector and its profile manifest and explicitly leaves
asset identities, the actual upstream checkout, toolchain, runtime readiness,
licensing entitlement, startup, rendering and capture unverified. A report is not
permission to execute code and cannot be reused after inputs change. Matching DLLs
do not compensate for an unsupported executable. Original files and generated game
output stay private; upstream MIT licensing does not cover them.

Do not use the upstream OpenPopTB `build.sh` as a fail-closed gate: at the pinned
revision its hash checks only warn, and it may also translate optional UW/D3D
executables found in the same directory. This preflight is not a wrapper around
that script and does not validate those optional files. A later bounded launch
must independently enforce its exact input set and source/toolchain identities.
No executable compatibility adaptation is provided here. The retained research
D3D binary (`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`)
does not match the browser candidate's pin. #1020 remains open.

Run the authored regression without original files:

```sh
node --test tests/recomp-input-preflight.test.mjs
```

## Reproduce focused checks

From repository root (Node 24; no dependency install required):

```sh
for f in scripts/recomp-prototype/browser-boundary-fixture/test*.mjs \
         scripts/recomp-prototype/browser-boundary-fixture/surface-descriptor/test.mjs \
         scripts/recomp-prototype/browser-host-fixture/frame-comparison/test*.mjs \
         scripts/recomp-prototype/browser-host-fixture/test.mjs \
         scripts/recomp-prototype/browser-host-fixture/test-guest-call-contract.mjs; do
  timeout --kill-after=2s 30s node --max-old-space-size=64 "$f" || exit "$?"
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

