# Preacher terminal restart: reviewed implementation evidence

Candidate: bd07a6302bb0170e9d6dc235983c2a961694d753, [draft PR #241](https://github.com/JohnDeved/populous-new-dawn/pull/241).
Base: d35835caba6f6d89d9ca97a4f87a4b68744a6bbf. The feature branch is unchanged by this evidence publication.

The controller restores the terminal entry bit and invokes the original speed/animation stop before entry restarts. The new phase 4 call uses the existing primitive through the animation adapter, avoiding the broader route/path cleanup callback. Clock and render cadence are unchanged.

Independent review accepted the exact code, focused evidence and standard/scoped quality evidence. The separately coordinated ordinary observation and final integration acceptance remain pending.

- [Code and focused evidence archive](code-and-focused.tar.gz): complete committed diff, exact changed source, accepted field proposal, native-derived fixture, four expected initial failures, six passing focused regressions, and maintained replay before/after outputs.
- [Independent code review](code-review/review.md)
- [Standard and quality archive](standard-and-quality.tar.gz): raw check/build/format/lint streams, source-bound receipts, baseline warning attribution, dependency transfer and terminal cleanup identities.
- [Independent standard/quality review](standard-review/review.md)
- [Publication hashes and complete archive-member inventory](manifest.json)

One full npm check passed TypeScript, all 1,349 tests, parity consistency and orchestration validation with no failed or skipped tests. It finished in 349.76 seconds under its 900-second cap. One production build passed in 32.20 seconds. Both ran serially on CPU 0–3, preserved source/tree/locks and ended with no owned process-group members.

Scoped Oxfmt and ESLint passed. Oxlint exited 0 with one prefer-export-from warning, reproduced byte-for-byte after filename-only normalization on the exact base source. No new finding or source edit was introduced. This is scoped quality attribution; a repository-wide clean lint result is not claimed.

The maintained replay continues to use the unchanged 27 native cases and 63 visits. All 73 requests pass. Only the exact positive-listener turning/RNG and odd command 32 expiry/return residuals remain, with 44 raw-event rows retained. The old checker failed because terminal flags had become equal; the corrected checker requires equality instead of permitting that mismatch. Its before/after current-port output bytes are identical. Historical b2 expectations and evidence remain immutable.

The [accepted original component proof](https://github.com/JohnDeved/populous-new-dawn/blob/4af98d2ed4a1dd5648e0d9b9a6e0173c08468a5c/references/verification/preacher-terminal-restart-2026-10-06/README.md) establishes the supplied-case sequence 168/14 → 48/16 → 160/19. No additional original instruction was run for this implementation.

The [retained ordinary render audit](https://github.com/JohnDeved/populous-new-dawn/blob/aa328370822b355f603d09022503775761be1e4a/references/verification/preacher-terminal-restart-2026-10-06/retained-render-audit/README.md) shows that both existing streams skip the intermediate phase 4-to-2 render. Model reachability and adjacent rendered families do not establish boundary pixels or visible improvement. Shared Tower/vehicle and whole-controller parity remain unproved.

Dependency device 27/inode 1978923 and both exact locks were preserved during the gates. The terminal gate-time owner was the fix tree; the coordinator later handed the real directory to passive QA, leaving the fix tree's exact lock-only stub. Gate receipts are historical and are not a claim about its later location. No package/browser job remains owned by this evidence task.

Related work: #214. Its broader animation scope remains open. No browser launch, deployment, parity recording or merge is authorized by these artifacts.
