# Shrine mesh cleanup membership — issue #144

`GameScene.animate` calls `updateShrinesFrame` in `app/scene-entities.ts`.
Shrine cleanup previously searched `world.shrines` with `some` for every cached
entry. It now clears and rebuilds a reusable Scene-owned ID set on **every call**,
using exactly `model` truthiness. The WeakMap retains disposable derived IDs only;
it neither mutates simulation state nor depends on a guessed dirty/version signal.

The Vault marker remove/release, model remove/release and map-delete order is
unchanged. All earlier Scene code except the new owner declaration, and the entire
cleanup body and later creation, geometry, animation, marker and visibility body,
are byte-identical to the base. Accepted migrated `NaN` IDs retain strict-equality
semantics: removal and recreation on every repeated frame. Other cleanup scans are
outside this slice.

`tests/shrine-mesh-reconciliation.test.mjs` invokes the **actual full shrine caller**
through `tests/support/shrine-scene.mjs`: maintained initial shrine factories,
Scene height/locate/orient methods and real `scene-assets.releaseGroup`. Texture IO
and projection use the existing Node fixture. Authored campaign templates, copies,
model changes and loads are explicitly controlled diagnostics; these tests do not
claim ordinary player interactions or browser-rendered flows.

Six cases **passed** on Node v24.19.0 at
`dbb5e48d7eda875959eea833037c4b733ec23773`, based on exact main
`5516c1c230654d54f239804a6885bde370bdfa43`. They cover model-zero eligibility,
ordered owned geometry/material disposal, shared atlases, surviving identities,
spawn/pose/visibility, authored camp/temple Vault marker ownership, the shipped
Vault opening descriptor and morph geometry, unchanged repeated-frame caches,
accepted NaN migration, in-place IDs, loaded/empty worlds and independent Scenes.
Authored models 45/149 consume their maintained Stone Head frame geometry; legacy
missing state is compared with the real initializer's legitimate writes. Full-world
and RNG equality are asserted after controlled setup or that explicit initializer.
The raw receipt binds sources, factories, resource/animation/initializer inputs,
original model data, locks and TypeScript/Three importer bytes before/after:
`work/orchestration/issue144-shrines-focused-dbb5e48.json`, exit 0, stdout SHA256
`2ecbb45d9d62069da7d7fa8b1a1a410eed9a5226448ca5482ca41dd32c0e0f18`.

The deterministic ID-read diagnostic uses an **initialized shrine-only model8
population**, without Stone Head initialization, Vault markers or morphs. Old
columns execute the frozen previous cleanup expression; new columns execute the
actual full caller for that population. Mixed cleanup adds equally many stale
groups. This measures ID reads, excluding wall time and hardware performance.

| Shrines | Old survivor cleanup | New full frame | Old mixed cleanup | New mixed full frame |
| ------: | -------------------: | -------------: | ----------------: | -------------------: |
|      64 |                2,080 |            192 |             6,176 |                  192 |
|     256 |               32,896 |            768 |            98,432 |                  768 |
|   1,024 |              524,800 |          3,072 |         1,573,376 |                3,072 |

Separately, the same final test/helper and unchanged fixture/lock inputs were
overlaid on pristine base production in detached `/workspace/pnd-baseline-144-shrines`.
Its five lifecycle cases passed; scaling **failed**, exit 1, with 2,208 actual
full-caller ID reads at 64 shrines against the 256-read bound. Raw receipt
`work/orchestration/issue144-shrines-baseline-focused-5516c1c.json`, stdout SHA256
`7772db6ec807e8312bee4864b53f7089e58aab10eb33f1df0318665cfac04fe0`,
is retained. No assertions, production source or config were changed for that run.

Scoped Oxfmt and ESLint **passed**. Strict scoped Oxlint **failed** on candidate
and base with eight warnings and one error. The separate comparison **passed**:
nine diagnostics match after normalizing only numeric line/column prefixes; raw
artifacts, paired inputs, unchanged base production, earlier Scene code and the
complete cleanup/later body also match. Raw failures remain distinct; no lint rule
was relaxed. The ignored comparator source is embedded in the portable proof.

At this author checkpoint, standard check/build and independent final integration
review are **not-run**. Browser QA and representative hardware measurements are
**not-run**, with supported browser access blocked in this executor. This establishes
bounded cleanup membership work, not whole-frame complexity, FPS, hardware timing,
native raster equivalence, deployment behavior or completion of #144.
