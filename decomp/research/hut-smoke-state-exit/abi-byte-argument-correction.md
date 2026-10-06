# Minimal fire-allocation ABI correction

Source-only candidate following the failed attempt at original source
`07e54532b41a2d1b04d16db5f8dffd48648962b4`. That attempt and its original
probe/manifest/launcher labels remain immutable in
[attempt-01](../../../references/verification/hut-smoke-state-exit-2026-10-06/attempt-01/result.md).
The corrected probe has not run and needs a new source review and explicit
one-case grant. No runtime source changes are proposed.

Only the existing supplied `004ed8a0` leaf's argument decoding changes:

1. Retain all four raw 32-bit stack arguments.
2. Decode class, model and tribe from their low bytes; retain the point pointer
   as a full 32-bit value.
3. Write raw and decoded values to stderr, flushed before the existing assertion.
4. Continue to require exactly class5/model10/tribe0 and the same staged
   allocation-parameter contract. Return the same supplied allocation failure.

The original caller at `00408972` loads only DL before pushing EDX at `00408975`.
Literal pushes supply model10/class5. The allocator reads class as a byte at
`004ed8a5`, model as a byte at `004ed8cd`, and copies class/model/tribe from byte
loads at `004eda3b/004eda3f/004eda43`. The point load at `004eda4a` remains a
DWORD. The retained attempt-01 disassemblies and original `004ed8a0.c` establish
these widths. No numerical raw argument value is invented for the failed run.

Every root, list, count, child, resident, RNG, frame, visit, instruction and resource
assertion remains unchanged. No real native call is newly intercepted, and no
supplied consumer expands. The fresh proposed output directory ends in `a02`;
the original `a01` output and terminal receipt cannot be reused or overwritten.

`one-case-abi-correction-manifest.json` and
`one-case-abi-correction-launch.json` describe this unexecuted candidate. The
original `one-case-draft-manifest.json` remains the exact historical input to
attempt 01 and must not be used to launch this changed probe.
