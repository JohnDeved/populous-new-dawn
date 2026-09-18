import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import test from 'node:test'

import models from '../app/original-models.json' with { type: 'json' }
import { createWorld } from '../app/world-initialization.ts'
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
