# Balloon raw command-position review

Decision: **ACCEPT for the bounded implementation/native/source deliverable.**
No actionable defect found in the reviewed diff. This is not merge readiness or
complete issue acceptance: standard aggregate/build and rendered browser gates
remain with the parent and were intentionally not run in this review.

- Issue / draft PR: #198 / https://github.com/JohnDeved/populous-new-dawn/pull/199
- Base: `76df601a76c54b291cc7867021c45022382720dd`
- Head: `dcc8a851afdad6ac14d033b121f7f382232ca7c2`
- Reviewer: fresh internal read-only review, 2026-10-04 UTC.
- Initial and final tracked worktree status: clean; only ignored review artifacts written.
- Read `AGENTS.md`, `GOAL.md`, the local populous-engineering skill, engineering
  protocol/native-research/worker-handoff instructions, and README TypeScript quality guidance.
- Inspected the complete eight-file base-to-head diff and relevant actual callers.

## Findings and acceptance reasoning

1. `app/live-movement.ts:161` implements the exact raw branch of the retained
   `004389c0` leaf. Any descriptor bit in `4 | 0x800 | 0x242` keeps the existing
   explicit unsupported boundary; otherwise both payload words are masked to
   unsigned 16-bit values. Command 16's descriptor is `0x400`, so `[tribe, 0]`
   is the native destination. Using the person's current position or the separate
   object-first focus helper would be incorrect. The existing command whitelist
   and descriptor validation precede this consumer.
2. Actual reachability is present: the followers panel in `app/page.tsx:1061`
   invokes `disguiseSelectedSpies`, which creates command 16 and appends it through
   `appendLiveOrders`, state initialization, and `startLiveOrders`. The regression
   stages Spy population/location but uses the authored Mission 22 Balloon and
   ordinary boarding command. It exercises startup, completion, 63-turn rest,
   replacement disguise, and a pending-command checkpoint that resumes once.
   Command 15 signed values and all three encoded-position boundaries are tested.
3. Configuration gates match retained `00432df0`: cancellation bypasses the
   command configuration; the model-specific special flag is recomputed before
   testing vehicle presence and airborne flag. The native matrix covers commands
   15/16, person models 2/5/6, vehicle absent/present, airborne and stale-special
   combinations, cancelled/current/immediate commands, and six word-boundary pairs.
   The observation hook only counts entry into `004389c0`; it does not modify native
   memory/registers or supply a return. Each emulation must reach its return sentinel.
   `native_cpu` maps the hash-verified original PE without replacing code/leaves.
4. Source scheduling and vehicle ownership code are unchanged. In particular,
   `stepLiveVehicle` and `stepLiveMovement` retain the non-driver scheduling boundary.
   The docs correctly avoid claiming ordinary Spy acquisition, non-driver completion,
   no movement on the completion visit, a complete mission, or parity credit.
5. The remaining seven diff files are proportional supporting work: three related
   research/index updates, the new native probe, the source regression additions,
   and project-map evidence routing. No imported assets, native exports, parity
   files, hosting configuration, or unrelated gameplay behavior were changed.

## Evidence checked

The following source-bound receipts were inspected, including before/after source
identity, raw artifact bytes, stdout/stderr hashes, and currently readable input
hashes. All final receipts bind the clean exact head above.

- `native-input-bound-dcc8a85.json`: passed; 35 descriptor identities, 126 raw
  leaves, 1,152 complete configuration/position compositions. EXE and Python
  executable inputs are explicitly bound before/after.
- `source-final-dcc8a85.json`: passed; all eight transport regressions.
- `format-scoped-dcc8a85.json`: passed for maintained changed TypeScript.
- `eslint-scoped-dcc8a85.json`: passed for maintained changed TypeScript.
- `oxlint-scoped-dcc8a85.json`: failed with 18 existing diagnostics. Independently
  normalized and compared against `oxlint-baseline-absolute-dcc8a85.json`; all 18
  rule/message diagnostics are identical. The baseline source SHA-256 was checked
  directly against `git show` for the exact supplied base. This remains a failed
  quality tool result, not a passing gate.
- `structural-dcc8a85.json`: passed (124 checks).
- `failure-first.json`: retained the expected old `Unported live movement order
  consumer` throw at the exact pre-repair base with dirty test fingerprint.
- `format-final-eb7784e.json`: failed only for `app/render-view.ts` and
  `app/viewport-bounds.ts`; both current files independently verified byte-identical
  to the exact base. Final changed TypeScript has its own passing scoped receipt.

Retained exports `00432df0.c` and `004389c0.c` match their manifest SHA-256 values;
manifest original EXE identity is
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.

Independent review reruns passed with no source/input drift:

- `reviewer-source-dcc8a85.json`: `node --test tests/transport-idle.test.mjs`,
  exit 0, eight tests passed.
- `reviewer-native-dcc8a85.json`: the new probe using the existing verified Python
  and EXE, exit 0, 126 leaves and 1,152 compositions passed. EXE and Python inputs
  are explicitly bound; `PYTHONDONTWRITEBYTECODE=1` prevented Python cache writes.
- `git diff --check <base> <head>`: exit 0.

## TypeScript quality and remaining gates

The five-line callback reuses imported descriptors and the existing failure helper;
there are no new abstractions, imports, cycles, duplicated resolvers, or decompiler
variables. Its bit operations reflect the required native word representation.
No introduced TypeScript quality defect was found. Fallow remains advisory and was
not rerun for this local callback; no deletion or broader refactoring is proposed.

Still **not run / not established** here: `npm run check`, `npm run build`, rendered
browser gameplay acceptance, complete native gameplay, and hardware performance.
The native comparison intentionally excludes startup speed/RNG, full vehicle
movement, and non-driver scheduling. Parent-owned final gates and any resulting
substantive repair review remain necessary before a merge-readiness claim.
