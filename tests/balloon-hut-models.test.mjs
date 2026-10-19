import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { deserialize } from 'node:v8'
import models from '../app/original-models.json' with { type: 'json' }
import provenance from '../public/original/provenance.json' with { type: 'json' }
import { buildingObject, buildingModel } from '../app/building-shapes.ts'
import { modelStage, modelTextureModes, modelDepthBias } from '../app/model-faces.ts'
import { collapseBuildingFaces } from '../app/building-debris.ts'
import { advanceGame } from '../app/game-clock.ts'
import { normalizeHistoricalFixture, createHistoricalFixtureHarness } from './helpers/historical-checkpoint.ts'
const hash = b => createHash('sha256').update(b).digest('hex')
const ids = [87, 88, 89, 90],
  hashes = [
    'd85de141d8a6bd8b58d4a0bde9f0a5987a331675841408d49dfeaf1d9022dcbf',
    'b38c61d0a7a92a31773d024d045b4a231d2c79148cebf9df2421d14e24b0c592',
    'f9ab90372aeaebaeb5917073e439632f4f7b139e841831e9ba496c2708ed5f34',
    '03e9f225ded9870914b173ebac45fb4919f1720a26c7a757fdb6724a1462f5d9',
  ]
const checkpoint = () => {
  const bytes = gunzipSync(
    readFileSync(
      new URL('../references/fixtures/m16-balloon-hut/before-damage.v8.gz', import.meta.url)
    )
  )
  assert.equal(hash(bytes), '47a887f51011e65fa7bd6be8ff70f719c5b62653de29304e5c2be9996a0f770d')
  return normalizeHistoricalFixture(deserialize(bytes))
}
test('four authentic Balloon Hut owners append without changing prior meshes or atlas', () => {
  assert.equal(
    hash(
      JSON.stringify(
        Object.fromEntries(Object.entries(models).filter(([id]) => !ids.includes(+id)))
      )
    ),
    '92fad05e2ba22b54196ed40a87a3307fff5cf69ffe1e94fae7909a6e3dad1d96'
  )
  assert.equal(
    hash(readFileSync(new URL('../public/original/atlas.png', import.meta.url))),
    'fdb5c2af7ca43debb5d943036969df29949773b6b94c0b7ce99ffc5d946b27b0'
  )
  for (const [i, team] of ['blue', 'red', 'yellow', 'green'].entries()) {
    const b = { kind: 'balloonHut', team, level: 1 },
      id = ids[i],
      m = models[id]
    assert.equal(buildingModel(b), 15)
    assert.equal(buildingObject(b), id)
    assert.ok(provenance.modelIds.includes(id))
    assert.equal(hash(JSON.stringify(m)), hashes[i])
    assert.equal(m.faces.length / 2, 117)
    assert.equal(m.scale, 160)
    assert.ok(m.tiles.every(t => Number.isInteger(t) && t >= 0 && t < 256))
    assert.ok([24 + i, 112 + i, 226 + i].every(t => m.tiles.includes(t)))
    for (let stage = 0; stage <= 4; stage++) {
      const mesh = modelStage(m, stage),
        count = mesh.p.length / 3
      assert.ok(count > 0)
      assert.equal(mesh.uv.length, count * 2)
      assert.equal(modelTextureModes(m, stage).length, count)
      assert.equal(modelDepthBias(m, stage).length, count)
      assert.ok(mesh.p.every(Number.isFinite) && mesh.uv.every(Number.isFinite))
    }
  }
})
test('each Balloon Hut mesh supplies finite structural and terrain-collapse fragments', () => {
  const w = checkpoint(),
    b = w.buildings.find(b => b.id === 299),
    source = { x: 50000, y: 50000, h: 128, angle: 0, flags3: 0, tribe: 0, stage: 4 }
  assert.equal(buildingObject(b), 89)
  for (const id of ids)
    for (const stage of [-1, 0, 1, 2, 3, 4]) {
      const rng = { randomState: 123456 },
        fragments = [...collapseBuildingFaces(w.land, models[id], source, stage, rng)]
      assert.ok(fragments.length > 0)
      assert.notEqual(rng.randomState, 123456)
      for (const f of fragments) {
        assert.ok([f.x, f.y, f.h, ...f.vertices.flat(), ...f.uv].every(Number.isFinite))
        assert.ok(f.face < 117)
      }
    }
})
test('ordinary M16 defeated Balloon Hut damage continues beyond the actual crash through historical clone/normalization', async () => {
  {
    const store = createHistoricalFixtureHarness()
    store.startMission(16)
    const w = store.getWorld()
    const historical = checkpoint()
    for (const key of Object.keys(w)) if (!Object.hasOwn(historical, key)) delete w[key]
    Object.assign(w, historical)
    assert.deepEqual(w, historical, 'no fresh-world fields may leak into the archive')
    assert.equal(w.turn, 40406)
    const b = w.buildings.find(b => b.id === 299)
    assert.equal(buildingObject(b), 89)
    const originalEffects = new Set(w.effects.map(e => e.id))
    assert.ok(await store.saveCheckpoint())
    assert.ok(store.loadCheckpoint())
    const twin = store.getWorld(),
      clocks = [w, twin].map(() => ({ animationTime: 0, animationFrame: 0 }))
    let debris = false
    for (let i = 0; i < 180; i++) {
      for (const [j, world] of [w, twin].entries()) advanceGame(world, clocks[j], 1 / 12)
      assert.deepEqual(w, twin)
      debris ||= w.effects.some(
        e => e.debris && !originalEffects.has(e.id) && Math.hypot(e.x - b.x, e.z - b.z) < 20
      )
    }
    assert.ok(debris, 'Actual damage emits new nearby debris instead of skipping the face loop')
    assert.ok(!w.buildings.some(x => x.id === 299) || b.hp < 260)
    assert.equal(w.units.find(u => u.id === 8286).native.vehicle, 8830)
  }
})
