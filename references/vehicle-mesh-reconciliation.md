# Vehicle mesh cleanup membership — issue #144

`GameScene.animate` calls `updateVehiclesFrame` in `app/scene-entities.ts`.
Previously, each existing mesh searched `world.vehicles` with `some`. Cleanup now
rebuilds a reusable Scene-owned ID set on **every call**, including exactly the
vehicles eligible under `active || destructionState`, and checks each mesh with
`has`. Weak ownership caches only this disposable derived set. Simulation records,
RNG and save validation are unchanged.

The mesh-map iteration, remove/release/delete order, subsequent vehicle filter and
complete drawing body are unchanged. Inactive destruction states 5 and 6 remain
drawn until the state clears. Surviving IDs keep their existing model and cached
appearance. World replacement and in-place ID/eligibility changes take effect on
the next call. Accepted migrated `NaN` IDs retain the original strict-comparison
behavior: remove/release/delete and rebuild on each repeated frame.

The focused command runs `tests/vehicle-mesh-reconciliation.test.mjs` and
`tests/follower-transport-owner-consumers.test.mjs`. The actual Node Scene fixture
supplies texture loading without constructing a browser renderer. It imports the
maintained frame/factory/model/UV code, actual Scene transforms and production
`scene-assets.releaseGroup`. Assertions cover geometry/material disposal once,
shared atlas preservation, removal order, survivor identity, spawn, inactive
destruction states, in-place changes, loaded/empty worlds, independent Scenes,
transforms and complete-world/RNG equality. The former VM-only vehicle appearance
case now exercises the actual caller while retaining apparent-owner, checkpoint,
legacy and cache assertions. Its damage and Blast cases remain byte-identical.

All eight cases **passed** on Node v24.19.0 at
`fd9dbc1f6cd3bc3f529c893b02b13677d12f7f8b`, based on
`860e8ae246b5237469b36a5f2c7794ce75731e95`. Raw receipt
`work/orchestration/issue144-vehicles-focused-fd9dbc1.json` binds the actual source,
tests, helpers, package/installed locks and TypeScript/Three importer modules before
and after. Exit 0; stdout SHA256
`91ffb4410a6ddd9f10d2c85ef63c1b99ac6f25b8fdbd42c57e8f6e1e967561ec`.

The deterministic diagnostic counts ID reads after initial mesh creation. The
old-cleanup reference is the frozen previous `some` expression; candidate counts
invoke the **full actual vehicle-frame caller**. Mixed cleanup adds as many stale
meshes as survivors.

| Vehicles | Old survivor cleanup | New full frame | Old mixed cleanup | New mixed full frame |
| -------: | -------------------: | -------------: | ----------------: | -------------------: |
|       64 |                2,080 |            128 |             6,176 |                  128 |
|      256 |               32,896 |            512 |            98,432 |                  512 |
|    1,024 |              524,800 |          2,048 |         1,573,376 |                2,048 |

Separately, the exact unmodified base production source was executed in detached
`/workspace/pnd-baseline-144-vehicles`, with the same final tests and helper overlaid
as explicitly hashed inputs. Its seven lifecycle/appearance/damage/Blast cases
passed; scaling **failed**, exit 1, at 64 survivors with 2,144 actual full-frame ID
reads against the 192-read bound. Raw receipt
`work/orchestration/issue144-vehicles-baseline-focused-860e8ae.json`, stdout SHA256
`a92042d15367bee51379faffb1bb789652e0dd727e76e03ec91e0429256966a2`, is retained.
No assertion, production source or config was changed to obtain this failure.

Scoped Oxfmt and ESLint **passed**. Strict scoped Oxlint **failed** on candidate and
base with eight warnings and one error. The separate receipt comparison **passed**:
the nine-diagnostic multisets match exactly after normalizing only numeric line
and column prefixes. Raw failures remain separate; no lint rule was relaxed.
Formatting covered the changed TypeScript/new files and the changed first consumer
case, preserving the inherited surrounding test text.

At this author checkpoint, standard check/build and independent final integration
review are **not-run**. Source review accepted the bounded change; final evidence
review remains pending. Browser QA and representative hardware measurements are
**not-run**, with supported browser access blocked in this executor. ID-read counts
establish algorithmic work only, not FPS, wall-time improvement, native raster
equivalence, deployment behavior or completion of the broader issue #144.
