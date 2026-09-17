import assert from 'node:assert/strict'
import test from 'node:test'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import models from '../app/original-models.json' with { type: 'json' }
import { originalTrainingHutObject } from '../app/training-hut-appearance.ts'
import { buildingObject, buildingModel } from '../app/building-shapes.ts'
import { createWorld } from '../app/world-initialization.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { modelStage, modelTextureModes, modelDepthBias } from '../app/model-faces.ts'

const previousIds = [
  5, 13, 14, 15, 16, 17, 18, 30, 45, 79, 80, 81, 82, 83, 84, 85, 86,
  91, 92, 93, 94, 95, 96, 97, 99, 103, 104, 106, 107, 108, 109, 110,
  111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124,
  125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138,
  139, 140, 141, 142, 143, 144, 152, 153, 154, 155,
]
const families = { temple: 95, spyHut: 91, camp: 103, firewarriorHut: 99 }
const teams = ['blue', 'red', 'yellow', 'green']

test('training append preserves all70 pre-existing original models, including vehicles', () => {
  const original = Object.fromEntries(previousIds.map(id => [id, models[id]]))
  assert.equal(previousIds.length, 70)
  assert.ok(previousIds.every(id => Object.hasOwn(models, id)))
  const hash = createHash('sha256').update(JSON.stringify(original)).digest('hex')
  assert.equal(hash, '440ff2c9cf4859b2e59669993ce1490ed518abe58ddf5fb69cbc00792d7c8bb3')
})

test('all original training types and owners resolve to actual meshes, not Blue substitutes', () => {
  for (const [kind, base] of Object.entries(families)) for (const [owner, team] of teams.entries()) {
    const b = { kind, team, level: 1 }
    assert.equal(originalTrainingHutObject(b), base + owner)
    assert.ok(models[base + owner])
    assert.deepEqual(b, { kind, team, level: 1 }, 'Appearance selection must not mutate gameplay')
  }
  const explicit = { kind: 'camp', team: 'yellow', level: 1, object: 104 }
  assert.equal(originalTrainingHutObject(explicit), 104, 'Stored original mesh remains authoritative')
  assert.throws(() => originalTrainingHutObject({ ...explicit, object: 900 }), /Missing original/)
  for (const kind of ['hut', 'tower', 'boatHouse', 'balloonHut', 'prison'])
    assert.equal(originalTrainingHutObject({ kind, team: 'green', level: 1 }), undefined)
  assert.equal(originalTrainingHutObject({ kind: 'temple', team: 'wild', level: 1 }), undefined)
})

test('the five recovered training variants retain original geometry, color tiles and all stages', () => {
  for (const [id, blue, faces, coloredTiles] of [
    [98, 95, 147, [27, 47, 229]],
    [100, 99, 144, [25, 41]],
    [101, 99, 144, [26, 42]],
    [102, 99, 144, [27, 43]],
    [105, 103, 107, [26, 34, 228]],
  ]) {
    const data = models[id]
    assert.equal(data.scale, 160)
    assert.equal(data.faces.length / 2, faces)
    assert.ok(coloredTiles.every(tile => data.tiles.includes(tile)))
    assert.notDeepEqual(data.p, models[blue].p, 'Original tribe geometry differs from Blue')
    assert.ok(data.p.every(Number.isFinite) && data.uv.every(Number.isFinite))
    for (let stage = 0; stage <= 4; stage++) {
      const geometry = modelStage(data, stage), count = geometry.p.length / 3
      assert.ok(count > 0)
      assert.equal(geometry.uv.length, count * 2)
      assert.equal(modelTextureModes(data, stage).length, count)
      assert.equal(modelDepthBias(data, stage).length, count)
      assert.ok(geometry.uv.every(Number.isFinite))
    }
  }
})

test('authored Mission16/17/22 training assets and identities survive checkpoint reconstruction', () => {
  for (const mission of [16, 17, 22]) {
    const world = createWorld(mission)
    const identities = w => w.buildings.filter(b => buildingModel(b) >= 5 && buildingModel(b) <= 8)
      .map(b => ({ id: b.id, kind: b.kind, team: b.team, object: buildingObject(b), mesh: originalTrainingHutObject(b), progress: b.progress, anchor: b.anchor, admission: b.admission }))
    const before = identities(world)
    assert.ok(before.some(b => [98, 100, 101, 102, 105].includes(b.mesh)))
    assert.ok(before.every(b => b.object === b.mesh))
    const restored = migrateCheckpoint(structuredClone(world))
    assert.deepEqual(identities(restored), before)
  }
})

test('the live building factory opts into original training selection without tint or gameplay changes', () => {
  const source = readFileSync(new URL('../app/scene-entities.ts', import.meta.url), 'utf8')
  const factory = source.slice(source.indexOf('function makeBuilding('), source.indexOf('\nfunction makeVehicle('))
  assert.ok(factory.includes('originalTrainingHutObject(b)'))
  assert.ok(factory.includes('nativeModel(renderId'))
  assert.ok(factory.includes('signature: `${id}-${stage}`'))
  assert.ok(!factory.includes('.material.color'))
})
