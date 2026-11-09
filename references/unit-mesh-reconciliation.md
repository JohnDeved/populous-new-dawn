# Unit mesh cleanup membership — issue #144

`GameScene.animate` calls `updateUnitsFrame` in `app/scene-entities.ts`. Previously,
each existing unit mesh searched `world.units` with `some`. Cleanup now rebuilds a
reusable Scene-owned ID set from the current world on **every call**, then checks
each mesh with `has`. A weak Scene key owns only this derived set; no simulation
record or dirty/version signal is cached.

The mesh-map iteration and remove/release/delete order are unchanged. Signature
replacement and the complete per-unit drawing body are unchanged. Replacing a
world or changing an ID in place takes effect on the next call. Other entity,
effect and drawing scans remain outside this bounded #144 change.

`NaN` IDs accepted by existing checkpoint migration continue to be removed and
rebuilt each frame, preserving the previous strict-comparison behavior. A focused
actual migrated-checkpoint regression covers this edge; save validation is unchanged.

`node --test tests/unit-mesh-reconciliation.test.mjs` passed all four tests on
Node v24.19.0 at candidate `6151fb145c0436785a070fcd255591969c1273ae`, based on
`8ad7a0c1d94654bb6d1979eb6dce7aaafc7adb9e`. The existing Node fixture imports the
actual frame caller, mesh creation and animation, supplying texture loading,
projection and motion leaves. Lifecycle assertions use the unchanged production
`scene-assets.releaseGroup`, checking ordered calls and stale selection material
and cloned texture disposal. They also check survivor identity, spawn/signature
replacement, empty/reloaded worlds, independent Scenes and full-world/RNG equality.

The deterministic diagnostic counts unit-ID reads. Its old-cleanup reference is
the previous `some` membership expression, not a full baseline renderer. The new
measurement invokes the **full actual unit-frame caller**, after initial mesh
creation. The mixed case adds the same number of stale mesh IDs as survivors.

| Units | Old survivor cleanup | New full frame | Old mixed cleanup | New mixed full frame |
| ----: | -------------------: | -------------: | ----------------: | -------------------: |
|    64 |                2,080 |            192 |             6,176 |                  192 |
|   256 |               32,896 |            768 |            98,432 |                  768 |
| 1,024 |              524,800 |          3,072 |         1,573,376 |                3,072 |

Raw author receipt: `work/orchestration/issue144-focused-6151fb1.json` and its
`.artifacts/stdout.log`. It binds source, test, fixture, package lock and installed
lock hashes before/after; source remained clean. Receipt status **passed**, exit
0; stdout SHA256 `f9f1e46de5104a00a0bbf0ba9e610c4469685092d559d28362badf8856225694`.

The same test was then run against the unmodified exact base in isolated detached
`/workspace/pnd-baseline-144`, with only the new test overlaid as an explicit hashed
input. Its three lifecycle cases passed; its scaling case **failed**, exit 1,
with 2,208 actual full-frame ID reads for 64 survivors against the 256-read bound.
The failed raw receipt is `work/orchestration/issue144-baseline-8ad7a0c.json` in that
worktree, stdout SHA256
`00a07ed38764d362e19ed0fca52f680779ffc8df57dedaaf98342bf11d044191`.
It also hashes the actual TypeScript/Three importer modules. The failure confirms
the regression distinguishes the old caller from the candidate; no assertions or
author production inputs were changed for this baseline run.

After formatting the test/note, candidate `41b1b2a31f0b819e45da11a4ecadd745fde0d4dd`
again passed all four focused cases, plus scoped Oxfmt and ESLint. Strict scoped
Oxlint **failed** with eight warnings and one error; the unmodified exact base
also failed with the same diagnostic multiset after removing only shifted line
and column numbers. Those raw failures remain separate from the passing checks;
no rule, assertion or configuration was relaxed. Production source is unchanged.

At this author checkpoint, standard check/build and independent final review are
**not-run**. Candidate focused checks passed; the baseline failure is retained
separately. Browser QA and representative hardware measurements
are **not-run**; supported browser access is blocked in this executor. The ID-read
result establishes bounded algorithmic work, not FPS, wall-time improvement,
native raster equivalence, deployment behavior or completion of the whole issue.
