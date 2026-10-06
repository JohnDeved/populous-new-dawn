# Independent PR242 source and final gate review

ACCEPT. No blockers for exact head `d185c88ec604356df8dc665506270963b53e185b` against actual main `a00eadc811e227559f9a2713eedbee5cd08af1c1`. Reviewed tree: `a3f9e52824b5f9baf3839beadc5f032ec766a3c9`.

## Runtime and ownership

The sole runtime change adds `p.timer < 840` to the existing status-bit predicate surrounding the complete turning mode block. It applies after the existing signed-short timer increment. Canonical original bytes increment/store AX, compare 840, and jump at 0043a7fb to 0043aa63 before all three turning mode bodies. I checked the canonical EXE identity, complete sermon range hash and all 151 selected original instruction bytes from the accepted proposal. The new predicate is the smallest matching correction: it preserves interruption handling outside this branch, below-cutoff gesture and turning logic, mode dispatch, the terminal state/entry write, and the later even-counter acquisition and order completion paths.

Mode0 cutoff has independently accepted original producer evidence and an actual production-caller failure followed by success. Modes1/2 tests are explicitly source-backed branch regressions, with equal angle/heading and in-range phases. They do not assert new native execution or resolve unrelated heading/width differences. Shared controller code changes at the same original branch; command32 odd-visit expiry/release remains an explicit residual. Route, queue, arrival and turning behavior below the cutoff are not rewritten.

## Complete changed source and focused evidence

The 14-file main-to-head diff includes the inherited actual production-caller test, supplied fixture and provenance. Their previously accepted source bodies and native expected rows remain unchanged. The seven-line final README addition identifies the old 0105 source/launch binding as historical failure provenance. Its hashes are not presented as candidate validators. All 48 source/focused packet members and source files match the candidate; generated full diff SHA256 is `3c813f26a3f791521e7595d231b86bf5cb784fa705f39eadc5327dbca11bb870`.

The frozen failure-first controller suite at 48086268 has precisely six cutoff failures and 15 passing controls. After the one predicate, all 21 tests pass. The unchanged real caller test also passes, including its actual private acquisition, sole physics counter advancement, complete world guards and all three Preacher-only updater calls. I independently compared all nine measured native phase rows: every mapped field, both RNGs and order ownership match; complete listener snapshots remain unchanged. The prior actual-caller failed test/receipt is preserved and independently accepted.

The maintained 27-case/63-visit checker removes only the obsolete turning assignment/mode/RNG allowance and changes the exact residual count from two to one. Every state byte remains required equal. I independently compared all 252 retained phase snapshots and 73 request states/orderings. The existing odd32 native0/port1 return and exact release are retained, together with 44 complete raw-event difference rows. Historical native hashes and event boundaries are unchanged. The updated checker itself failed before the patch and passed afterward. Focused runs at 0f092253 carry to d185c88e because the only intervening change is the historical README note.

## Quality, full check and build

Scoped Oxfmt and ESLint pass. Oxlint exits zero with one re-export warning; retained canonical a00 bytes produce the identical filename-normalized diagnostic under the same config. No new TypeScript quality issue is present.

Full `npm run check` passes TypeScript, all 1,365 tests with zero failures/skips, parity and orchestration in 351.517 seconds. The serial production build exits zero in 27.810 seconds and completes all five stages. Proxy/npm notices, route-classification notice, chunk-size and plugin-timing warnings are retained in raw streams and do not claim a rendered check.

Both CPU0–3 jobs respect the granted 900s/180s deadlines with 20s cleanup grace. Their streams and receipts match hashes, all 3,684 tracked-file hashes match the frozen head, and the identical before/after fingerprint is `c85a62d86d0d714c30e41ee016be2fc79e20a9caa8da2079eb12473ac259a4f4`. Dependency directory device27/inode1978923, root and installed locks remain stable. Both owned process groups are empty. All 63 planner selections have explicit dispositions: full check/build, 12 portable checks included in the full suite, and 49 unrelated native/browser routes excluded with no result claimed. All unknown changed paths were inspected.

Source/focused packet manifest: `a38461e118caf52f3b38f099f123acaa79f2f1e38d1cfdcc2867c3d23acabc62`.
Standard packet manifest: `95de1b81afcbba41c0e6d485abe2f65183883f9d6a384f5e22216ba04c5757ff`.
Full-check receipt: `46c54e30435a8c9c3e446c736ac09cd45c0de8d3148b81a9565f3952256dbef1`.
Build receipt: `1f7489a123ea9820c371336a94fde06fd0f0f4a8c74635d15e51468d16dfaf41`.

## Scope

Acceptance concerns terminal turning state and simulation-RNG ownership. The five listeners, terrain and schedule remain supplied. Ordinary five-listener acquisition history, visible improvement, native whole-world/physics equivalence, Tower/vehicle paths and broad issue214 parity remain unproved. No new original or browser run was required for this correction. This independent review performed source/data reads and offline comparisons only; it did not run application, native, package or browser jobs.
