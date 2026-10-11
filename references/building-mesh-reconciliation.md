# Completed-building mesh cleanup membership — issue #144

`GameScene.animate` calls `updateBuildingsFrame` in `app/scene-entities.ts`.
Completed-building cleanup previously searched `world.buildings` with `some`
for every cached group. It now rebuilds a reusable Scene-owned ID set on **every
call**, immediately after the unchanged preparation phase, using exactly
`!preparation` truthiness. Weak ownership retains disposable derived IDs only;
no simulation record, save validation or guessed dirty/version signal is cached.

The releaseHutSmoke/objects.remove/releaseGroup/buildingMeshes.delete order is
unchanged. The entire earlier plan phase and all later signature/model, health,
transform, Temple, wave, smoke and puff code are byte-identical to the base.
Accepted migrated `NaN` IDs preserve strict equality: cleanup and rebuild on every
repeated frame. Other scene cleanup, occupancy and puff scans are outside this slice.

`tests/building-mesh-reconciliation.test.mjs` invokes the **actual full building
caller** through the unchanged plan-scene wrapper, maintained Scene transforms and
real `scene-assets.releaseGroup`. Texture loading and unrelated decorations are
supplied. Red populations use the shipped `addBuilding` initializer; copies and
transitions are explicitly diagnostic. Controlled quiet states avoid unrelated
smoke/Shake writes. The blue case reuses `fullHutScene`'s actual command8 admission
and clock visits to obtain a naturally allocated puff, then performs controlled
root removal. It proves real material-dispose observer unsubscribe by calling
`notifyHutOccupancy` afterward, without replacing the listener or notification.
It does not claim ordinary player demolition or a browser-rendered flow.

Six cases **passed** on Node v24.19.0 at
`651b989768907a33e37d1d4ac435a71074885e47`, based on exact main
`7cb339d01713b3ec3c7e1f46bbdd6d78a5fca86f`. They cover ordered stale removal,
single owned geometry/material disposal, shared atlas/cursor retention, survivor
identity and spawning, maintained transforms, stage/resource signature replacement
with the initializer's team health material, current/legacy checkpoint cache reuse,
completed↔preparation transitions, accepted NaN migration, in-place IDs, loaded/empty
worlds, independent Scenes, real smoke teardown and independent puff ownership.
Whole-world/land.flags and gameplay/cosmetic RNG equality are asserted only after
the stated controlled setup or after smoke roots/puff allocation have completed.
The raw receipt binds source, actual fixtures, observer/initializer/resource code,
locks and TypeScript/Three importer bytes before/after:
`work/orchestration/issue144-buildings-focused-651b989.json`, exit 0, stdout SHA256
`cba413f5a7bcda8d3d37181eacc09f82b4794fa04c49c6a1a8a4c117a4ba6b0a`.

The deterministic ID-read diagnostic uses a **completed-only population with an
empty preparation map, zero units and quiet secondary effects**. Old columns
execute the frozen previous cleanup expression; new columns execute the actual
full caller for that bounded population. Mixed cleanup adds equally many stale
groups. This does not measure remaining occupancy/puff costs or wall time.

| Buildings | Old survivor cleanup | New full frame | Old mixed cleanup | New mixed full frame |
| --------: | -------------------: | -------------: | ----------------: | -------------------: |
|        64 |                2,080 |            128 |             6,176 |                  128 |
|       256 |               32,896 |            512 |            98,432 |                  512 |
|     1,024 |              524,800 |          2,048 |         1,573,376 |                2,048 |

Separately, the same final test and unchanged fixture/lock inputs were overlaid
on pristine base production in detached `/workspace/pnd-baseline-144-buildings`.
Its five lifecycle cases passed; scaling **failed**, exit 1, with 2,144 actual
full-caller ID reads at 64 buildings against the 192-read bound. Raw receipt
`work/orchestration/issue144-buildings-baseline-focused-7cb339d.json`, stdout SHA256
`afb5a52dc5a7f6a836457ac984fc6f85560bda84ee57c96ec3d04a05a903f2de`,
is retained. No assertions, production source or config were changed for this run.

Scoped Oxfmt and ESLint **passed**. Strict scoped Oxlint **failed** on candidate
and base with eight warnings and one error. The separate comparison **passed**:
nine diagnostics match exactly after normalizing only numeric line/column prefixes;
paired inputs, unchanged base production, earlier plan phase and the complete
post-cleanup body are also checked. Raw failures remain separate; no lint rule
was relaxed. The ignored comparator source is embedded in the portable proof.

At this author checkpoint, standard check/build and independent final integration
review are **not-run**. Browser QA and representative hardware measurements are
**not-run**, with supported browser access blocked in this executor. This proves
bounded cleanup membership work, not whole-caller complexity, FPS, hardware timing,
native raster equivalence, deployment behavior or completion of #144.
