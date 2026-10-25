# Preparation-plan mesh cleanup membership — issue #144

`GameScene.animate` calls `updateBuildingsFrame` in `app/scene-entities.ts`.
Preparation-plan cleanup previously searched `world.buildings` with `some` for
each existing plan mesh. It now rebuilds a reusable Scene-owned ID set on **every
call**, using exactly the existing `preparation` truthiness, then checks each plan
with `has`. Weak ownership holds only disposable derived data; no simulation
record, save validation or dirty/version signal is cached.

The removeFromParent/geometry.dispose/plans.delete order is unchanged. The later
preparation filter, pose/terrain signatures, geometry generation and all completed
building, smoke, Temple and drawing code are byte-identical to the base. Accepted
migrated `NaN` IDs preserve strict equality: cleanup and rebuild every repeated
frame. Completed-building cleanup still searches with `some` and remains outside
this slice.

`tests/plan-mesh-reconciliation.test.mjs` invokes the **actual full building-frame
caller**. Its wrapper reuses the existing smoke fixture while binding maintained
Scene planGeometry/y/locate/orientModel and `scene-assets.releaseGroup`; the shared
fixture remains unchanged. Texture loading and unrelated decoration construction
are supplied. Plans come from the shipped `addBuilding(plan:true)` initializer;
copies and lifecycle transitions are explicitly diagnostic. Controlled red huts
avoid unrelated smoke/Shake world mutations. No ordinary player placement,
browser/GPU, native raster or hardware timing claim is made.

Five cases **passed** on Node v24.19.0 at
`2773eaaa3e325b621bfec003abc49f18929ab6da`, based on
`79833890f3b3b06f91d0179dcc61cd0e012882ba`. They cover ordered stale geometry
disposal once, shared cursor-material retention, survivor mesh/geometry identity,
spawn, pose/terrainVersion geometry refresh, preparation↔built transitions,
accepted NaN migration, in-place IDs, loaded/empty worlds, independent Scenes and
land.flags/full-world/RNG equality. Source, tests, both underlying fixtures,
geometry/initializer/Scene/resource code, locks and TypeScript/Three importer bytes
are bound before and after in raw receipt
`work/orchestration/issue144-plans-focused-2773eaa.json`, exit 0, stdout SHA256
`1ca85dd31ad0a06d0a3cf62974317eb39524e035057bcad2863ce5f989da896b`.

The deterministic ID-read diagnostic uses a **preparation-only population with an
empty completed-building mesh map**. Old cleanup columns execute the frozen
previous membership expression; candidate columns execute the full caller for
that stated population. Mixed cleanup adds as many stale plans as survivors.

| Plans | Old survivor cleanup | New full frame | Old mixed cleanup | New mixed full frame |
| ----: | -------------------: | -------------: | ----------------: | -------------------: |
|    64 |                2,080 |            128 |             6,176 |                  128 |
|   256 |               32,896 |            512 |            98,432 |                  512 |
| 1,024 |              524,800 |          2,048 |         1,573,376 |                2,048 |

Separately, the same final test/helper inputs were overlaid on unmodified base
production in detached `/workspace/pnd-baseline-144-plans`. Its four lifecycle
cases passed; scaling **failed**, exit 1, with 2,144 actual full-caller ID reads at
64 preparation plans against the 192-read bound. Raw receipt
`work/orchestration/issue144-plans-baseline-focused-7983389.json`, stdout SHA256
`7d5f636339e96ecee046fa0d4d6b2add821c6f52b6cbf28fc34e7931022eba2e`, is retained.
No assertions, production source or config were changed for this baseline run.

Scoped Oxfmt and ESLint **passed**. Strict scoped Oxlint **failed** on candidate and
base with eight warnings and one error. The separate comparator **passed**: nine
diagnostics match exactly after normalizing only numeric line/column prefixes. It
also verifies paired input hashes, unchanged base production and the byte-identical
later building body. Raw failures remain separate; no lint rule was relaxed.

At this author checkpoint, standard check/build and independent final integration
review are **not-run**. Browser QA and representative hardware measurements are
**not-run**, with supported browser access blocked in this executor. This proves
bounded plan-membership work, not whole-building-caller complexity, FPS, wall-time
improvement, native raster equivalence, deployment behavior or completion of #144.
