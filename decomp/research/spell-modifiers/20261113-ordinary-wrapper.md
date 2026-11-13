# Spell ordinary-dispatch wrapper (#1008)

13 November 2026. Source-only continuation of ddffa215. No game implementation or test run.

The retained `decomp/research/demo131-entry.md` and `rolling-demo-control.md` identify ordinary command wrapper **0043e890**, distinct from playback reader004b3920. `scripts/check-static-demo131-entry.py` (blob541303397a15b37c57658e95073c30b4fd9d402c) includes a 0x46-byte window and reviewed expected instructions: test playback flag at0043e890, branch at0043e89b, command-byte check `[esi+0xc]` at0043e8b6, and call to process_tribe_cmd0043e8e0 at0043e8bd. Its historical static proof is not a fresh execution here.

The retained initial-turn producer at004a55ec writes command0x1b and calls this wrapper at004a5604; its active-tribe/mode conditions are documented in demo131-entry. This is a source-backed ordinary-dispatch consumer boundary, not proof that right-click emitter00479cf0 reaches it or that spell arguments have the correct layout.

Generated0043e890.c is absent from current main532cd9ef. The required next artifact is the matched original emitter00479cf0 body and its command-buffer write/read linkage into0043e890, not another playback-only trace. Existing intercepted-emitter checks still do not establish that link. Original EXE identity remains SHA2563a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f.
