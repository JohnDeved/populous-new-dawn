# Building plan lifecycle: supplied-boundary caller regression

Production source parent: a4b481d5b64dd2f4a017af349e3042e31487f9c4.

Three tests exercise actual `prepareBuildingSite`, without mocking or extracting it:
- completed camp preparation allocates in place, preserving object/ID and cardinality;
- the same boundary holds for Tower preparation;
- expired unattended preparation removes only that target, retaining another plan.

The supplied world removes units/trees and supplies work, grade and departed worker state. It does not model ordinary task site creation, worker registration/travel, natural construction completion, checkpoint continuation, native count equivalence, browser behavior or school production. No product behavior is changed.

On 2026-10-29 the equivalent external-path fixture passed 3/3, zero skipped/cancelled, empty stderr. Independent review rehashed 5,529 source paths and dependencies; production source was exact parent, with one explicitly pinned unrelated panel-test overlay that was not imported/executed. The test filename/import paths were subsequently relocated into `tests/`; this import-only relocation is reviewed, not described as a new test run.

A prior absolute-path Node test discovery attempt failed before any tests ran. Its stderr/terminal receipt is preserved separately from the corrected cwd-relative passed attempt. Corrected execution had no additional read permissions. Failed evidence is not discarded and neither attempt counts as a product fix.

Remaining issue #256 prerequisites include actual producer/task/site ordering, repair/destruction/native membership and checkpoint histories, additive school targets and dynamic knowledge ownership. Three passing caller cases do not close these gates.
