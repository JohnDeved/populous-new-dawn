# Shared Temple material baseline RED

Test commit `68aa333d49a821c975e85c2a42e31f137e2fb22f` adds three test changes
against runtime base `219384134d21200f80df0496a4866fb02fb200db`. No runtime or
generated assets change. This is the failure-first regression slice for
[the reviewed contract](https://github.com/JohnDeved/populous-new-dawn/blob/0d338b5829aa205d1131a3ff1629d4fd1fcc5f1e/decomp/research/shared-temple-material-contract.md).

`focused.json` is the unchanged source-bound command receipt: **failed/exit1,
expected RED**, 34 tests,14 pass/20 fail,8.37 seconds. Its before/after source and
explicit input hashes match. The complete TAP is embedded; stderr is empty.
The command ran sequentially on CPU4 with a55-second child timeout after
coordination. Syntax checks and targeted oxfmt completed successfully before
the test commit. No full suite/build/browser/native run was performed.

Concrete baseline failures include:

- initial M1/c resource is absent, as are M2/s and same-bank nonintro missions;
- the actual M3 Red building renderer lacks an animated material;
- the actual Yellow completion caller cannot join the running tile94 phase;
- the actual overlay sprite caller selects `temple-sparkles-p` for a supplied
  M1/c resource instead of preserving `effects` and the command RGB.

Other expected failures cover the agreed bank/atlas snapshot and material APIs.
They are not missing imports. The existing nominal-clock and M3 lifecycle
controls, authored M1/M3 reward callers, independent6/82 timing and new negative
provenance controls pass. Assertions after each first failure remain future GREEN
acceptance, not already demonstrated behavior.

The constructor-binding fixture is owned by the theme implementation, not this
test branch. `world-environment-scene.input.txt` preserves the exact supplied
input, SHA256 `1f1c9c6df121ef1b0b8c311cab7e9af2d2686d22fc9aae20642f1d165181a5fc`.
It was present untracked at `tests/support/world-environment-scene.mjs` during
the run and is explicitly hashed in the receipt. Reproduction requires that
exact input at that path; the combined product branch owns its tracked copy.
The helper executes the production constructor assignment when present and
otherwise reaches the unchanged baseline callers, without importing a missing
proposed environment module.

`inputs.json` records the authorized existing dependency directory identity and
both lock hashes. Dependencies were reused read-only through the approved
symlink; no installation, dependency copy/move or write occurred.

Tests use actual GameStore/Scene/material/overlay callers with supplied
buildings, commands, texture images, canvas and GPU leaves. They establish
controlled regression behavior, not ordinary play, original pixels or hardware
performance. The product author must integrate the tests with its shared fixture,
implement the runtime, obtain GREEN and the remaining reviewed gates, and retain
ordinary rendered Temple/theme evidence before a runtime acceptance claim.
