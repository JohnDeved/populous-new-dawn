# Pinned framework repair

`vinext@1.0.0-beta.2.patch` requires the metadata filename prefix before accepting
its optional numeric suffix. Without it, the scanner treats `stone-head-149.ts`
as a Twitter image route and the deployed root document advertises a nonexistent
localhost image. No game asset is moved or modified.

The patch is bound to the exact package version and pnpm lock hash. Regression
coverage in `tests/site-metadata.test.mjs` exercises the installed scanner against
valid metadata filenames, unrelated numbered filenames, and the real app tree.
Remove the patch only after a framework upgrade passes those tests and deployed
HTML has no unintended social images. Explicit empty layout image arrays alone
were insufficient in the deployed framework pipeline.
