import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import test from 'node:test'

import models from '../app/original-models.json' with { type: 'json' }
import { createWorld } from '../app/world-initialization.ts'
import { migrateLegacyWorshipAppearance } from '../app/game-store.ts'
import { tutorialLevel } from '../app/mission-data.ts'
import {
  WORSHIP_ANGEL_MODEL,
  WORSHIP_OBELISK_MODEL,
  WORSHIP_STONE_HEAD_MODEL,
  worshipAppearanceModel,
} from '../app/worship-appearance.ts'

test('proved worship modes use their original static models without changing other head families', () => {
  assert.equal(WORSHIP_OBELISK_MODEL, 8)
  assert.equal(WORSHIP_ANGEL_MODEL, 157)
  assert.equal(WORSHIP_STONE_HEAD_MODEL, 45)
  assert.equal(worshipAppearanceModel(3), 8)
  assert.equal(worshipAppearanceModel(5), 157)
  for (const mode of [0, 1, 2, 4, undefined]) assert.equal(worshipAppearanceModel(mode), 45)
})

test('original worship model 8 is the reviewed bank-2 geometry', () => {
  const model = models[8]
  assert.ok(model)
  assert.deepEqual(
    {
      scale: model.scale,
      points: model.p.length / 3,
      faces: model.faces.length / 2,
      tiles: model.tiles.length,
      panelHeight: model.panelHeight,
    },
    { scale: 160, points: 156, faces: 29, tiles: 29, panelHeight: 534 }
  )
  assert.equal(
    crypto.createHash('sha256').update(JSON.stringify(model)).digest('hex'),
    '1dcc048a1c88b18a7c76de6aef3de662213efe56ba1bb88d28c757a97268fbd4'
  )
})

test('original worship model 157 is the reviewed static Angel-head geometry', () => {
  const model = models[157]
  assert.ok(model)
  assert.deepEqual(
    {
      scale: model.scale,
      points: model.p.length / 3,
      faces: model.faces.length / 2,
      tiles: [...new Set(model.tiles)].sort((a, b) => a - b),
      panelHeight: model.panelHeight,
    },
    { scale: 160, points: 525, faces: 120, tiles: [161, 182, 184, 221, 249], panelHeight: 706 }
  )
  assert.equal(
    crypto.createHash('sha256').update(JSON.stringify(model)).digest('hex'),
    'b7504236b474eef4157b0cc7e4060f9a893d82ef632e3468df80f896c7f39070'
  )
})

test('legacy appearance migration recovers recursive authored modes and preserves existing families', () => {
  const tutorial = createWorld(tutorialLevel),
    trigger = tutorial.shrines.find(shrine => shrine.name === 'Tutorial Obelisk trigger'),
    linked = trigger.linkedShrine,
    linkedBefore = {
      id: linked.id,
      x: linked.x,
      z: linked.z,
      range: linked.range,
      angle: linked.angle,
      kind: linked.kind,
      name: linked.name,
      work: linked.work,
      uses: linked.uses,
      remaining: linked.remaining,
      reward: linked.reward,
    }
  linked.model = 45
  delete linked.mode
  linked.work = 17
  linked.uses = 2
  linkedBefore.work = linked.work
  linkedBefore.uses = linked.uses
  migrateLegacyWorshipAppearance(tutorial)
  assert.deepEqual({ mode: linked.mode, model: linked.model }, { mode: 3, model: 8 })
  assert.deepEqual(
    {
      id: linked.id,
      x: linked.x,
      z: linked.z,
      range: linked.range,
      angle: linked.angle,
      kind: linked.kind,
      name: linked.name,
      work: linked.work,
      uses: linked.uses,
      remaining: linked.remaining,
      reward: linked.reward,
    },
    linkedBefore
  )

  const mission22 = createWorld(22),
    mode3 = mission22.shrines.filter(shrine => shrine.mode === 3),
    mode3Before = mode3.map(shrine => ({ id: shrine.id, model: shrine.model, mode: shrine.mode }))
  migrateLegacyWorshipAppearance(mission22)
  assert.deepEqual(
    mode3.map(shrine => ({ id: shrine.id, model: shrine.model, mode: shrine.mode })),
    mode3Before
  )
  assert.ok(mode3.every(shrine => shrine.model === 8))

  const ordinaryWorld = createWorld(5),
    ordinary = ordinaryWorld.shrines.find(shrine => shrine.mode === 0 && shrine.model === 45),
    ordinaryBefore = structuredClone(ordinary)
  migrateLegacyWorshipAppearance(ordinaryWorld)
  assert.deepEqual(ordinary, ordinaryBefore)

  const vaultWorld = createWorld(3),
    vault = vaultWorld.shrines.find(shrine => shrine.kind === 'vault'),
    vaultBefore = structuredClone(vault)
  assert.ok(vault)
  migrateLegacyWorshipAppearance(vaultWorld)
  assert.deepEqual(vault, vaultBefore)
})

test('linked tutorial mode-3 Obelisk retains its authored mode and model', () => {
  const world = createWorld(tutorialLevel),
    trigger = world.shrines.find(shrine => shrine.name === 'Tutorial Obelisk trigger')
  assert.ok(trigger?.linkedShrine)
  assert.deepEqual(
    {
      mode: trigger.linkedShrine.mode,
      model: trigger.linkedShrine.model,
      name: trigger.linkedShrine.name,
    },
    { mode: 3, model: 8, name: 'Obelisk' }
  )
})
