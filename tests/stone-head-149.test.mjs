import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createWorld } from '../app/world-initialization.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { missionData } from '../app/mission-data.ts'
import { modelStage, modelDepthBias, modelTextureModes } from '../app/model-faces.ts'
import { animateStoneHeads } from '../app/stone-head-animation.ts'
import { stoneHeadAngle } from '../app/stone-head-orientation.ts'
import {
  findStoneHead149Source,
  originalStoneHead149Source,
  stoneHead149Model,
} from '../app/stone-head-149.ts'

const models = JSON.parse(readFileSync(new URL('../app/original-models.json', import.meta.url))),
  provenance = JSON.parse(
    readFileSync(new URL('../public/original/provenance.json', import.meta.url))
  )
const rootTotem = world => world.shrines.find(shrine => shrine.name === 'Totem Pole')
const heads = world =>
  world.shrines.flatMap(shrine => [shrine, ...(shrine.linkedShrine ? [shrine.linkedShrine] : [])])

test('base149 retains 51 original faces and existing atlas coverage without key model slots', () => {
  const model = models[149],
    stage = modelStage(model, 4)
  assert.equal(model.scale, 160)
  assert.equal(model.panelHeight, 503)
  assert.equal(model.faces.length, 102)
  assert.equal(model.normals.length, 51)
  assert.equal(model.biases.length, 51)
  assert.equal(stage.p.length, 258 * 3)
  assert.equal(stage.uv.length, 258 * 2)
  assert.deepEqual(stage.p, model.p)
  assert.equal(modelDepthBias(model, 4).length, 258)
  assert.equal(modelTextureModes(model, 4).length, 258)
  assert.deepEqual(
    [...new Set(model.tiles)].sort((a, b) => a - b),
    [159, 167]
  )
  assert.deepEqual(
    [...new Set(model.modes)].sort((a, b) => a - b),
    [4, 6, 7]
  )
  assert.ok(stage.uv.every(value => value >= 0 && value <= 1))
  const atlas = readFileSync(new URL('../public/original/atlas.png', import.meta.url))
  assert.deepEqual([atlas.readUInt32BE(16), atlas.readUInt32BE(20)], [256, 1024])
  assert.equal(
    createHash('sha256').update(atlas).digest('hex'),
    'fdb5c2af7ca43debb5d943036969df29949773b6b94c0b7ce99ffc5d946b27b0'
  )
  assert.equal(
    provenance.staticStoneHead149.decodedSha256,
    '4500fc0e919cc8362f22900a100918f7aceb4c779212a09f2fb9c6724ee19a53'
  )
  assert.equal(provenance.modelIds.filter(id => id === 149).length, 1)
  for (const id of [150, 151]) {
    assert.equal(Object.hasOwn(models, id), false)
    assert.equal(provenance.modelIds.includes(id), false)
  }
})

test('authored default149 roots and linked Mission10 Totem select the base mesh', () => {
  const expected = [
    [3, 101, 102],
    [5, 96, 125],
    [5, 101, 102],
    [5, 113, 114],
    [10, 119, 118],
    [10, 58, 59],
  ]
  for (const [mission, triggerIndex, sceneryIndex] of expected) {
    const world = createWorld(mission),
      shrine = heads(world).find(
        shrine => originalStoneHead149Source(mission, shrine)?.triggerIndex === triggerIndex
      )
    assert.ok(shrine, `Missing authored trigger ${mission}/${triggerIndex}`)
    assert.deepEqual(originalStoneHead149Source(mission, shrine), { triggerIndex, sceneryIndex })
    assert.equal(shrine.model, 45, 'Controller fallback is not rewritten')
    assert.equal(stoneHead149Model(shrine, mission), 149)
  }
  const root = rootTotem(createWorld(10))
  assert.equal(stoneHeadAngle(root, 10), 0)
  assert.equal(stoneHeadAngle(root.linkedShrine, 10), Math.PI)
})

test('spell45, Obelisk8, Angel157 and Vault154 remain outside static149', () => {
  for (const mission of [1, 5, 22]) {
    const world = createWorld(mission)
    for (const shrine of heads(world).filter(shrine =>
      ['bridge', 'lightning', 'convertWild', 'angel', 'vault', 'mana', 'inert'].includes(
        shrine.kind
      )
    )) {
      assert.equal(stoneHead149Model(shrine, mission), shrine.model)
      assert.equal(originalStoneHead149Source(mission, shrine), null)
    }
  }
})

test('source qualification rejects ambiguous identity, reward flags, missing links and scenery', () => {
  const root = rootTotem(createWorld(10)),
    original = missionData(10).level.objects
  assert.deepEqual(findStoneHead149Source(original, root), { triggerIndex: 119, sceneryIndex: 118 })
  for (const mode of [1, 3]) {
    const objects = structuredClone(original),
      trigger = objects.find(object => object.index === 119)
    objects.push({ index: 999, type: 6, model: 2, x: 0, z: 0, angle: 0, settings: [0, 0, mode] })
    trigger.settings[6] = 1000 & 255
    trigger.settings[7] = 1000 >>> 8
    assert.equal(findStoneHead149Source(objects, root), null)
  }
  const duplicate = structuredClone(original)
  duplicate.push({ ...duplicate.find(object => object.index === 119), index: 999 })
  assert.equal(findStoneHead149Source(duplicate, root), null)
  const dangling = structuredClone(original)
  dangling.find(object => object.index === 119).settings[6] = 255
  dangling.find(object => object.index === 119).settings[7] = 255
  assert.equal(findStoneHead149Source(dangling, root), null)
  assert.equal(
    findStoneHead149Source(
      original.filter(object => object.index !== 118),
      root
    ),
    null
  )
  for (const changed of [{ range: root.range + 1 }, { angle: root.angle + 0.2 }, { x: root.x + 1 }])
    assert.equal(findStoneHead149Source(original, { ...root, ...changed }), null)
})

test('old null/absent presentation and new checkpoints derive149 without mutating saved state', () => {
  for (const legacy of [false, true]) {
    const saved = createWorld(10),
      root = rootTotem(saved)
    for (const shrine of [root, root.linkedShrine]) {
      shrine.stoneHead = null
      if (legacy) {
        delete shrine.mode
        delete shrine.stoneHead
      }
    }
    const before = structuredClone(saved)
    for (let visit = 0; visit < 36; visit++)
      for (const shrine of [root, root.linkedShrine])
        assert.equal(stoneHead149Model(shrine, 10), 149)
    assert.deepEqual(
      saved,
      before,
      'Presentation reads must not touch work, rewards, RNG or checkpoints'
    )
    const loaded = migrateCheckpoint(structuredClone(saved)),
      loadedRoot = rootTotem(loaded)
    assert.equal(stoneHead149Model(loadedRoot, 10), 149)
    assert.equal(stoneHead149Model(loadedRoot.linkedShrine, 10), 149)
    animateStoneHeads(loaded)
    assert.equal(loadedRoot.stoneHead, null, 'No 149 animation state is initialized')
    assert.equal(stoneHead149Model(loadedRoot, 10), 149)
  }
})

test('static presentation never replaces a different model or an active morph family', () => {
  const root = rootTotem(createWorld(10))
  for (const changed of [
    { kind: 'vault' },
    { mode: 3 },
    { morph: { from: 45 } },
    { stoneHead: { family: 45 } },
  ])
    assert.equal(stoneHead149Model({ ...root, ...changed }, 10), 45)
  assert.equal(stoneHead149Model({ ...root, model: 8 }, 10), 8)
  assert.equal(stoneHead149Model({ ...root, active: false, enabled: false, remaining: 0 }, 10), 149)
  assert.equal(stoneHead149Model({ ...root, x: 999, z: 999 }, 10), 45)
})
