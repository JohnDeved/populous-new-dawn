import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import test from 'node:test'

import models from '../app/original-models.json' with { type: 'json' }
import { createWorld } from '../app/world-initialization.ts'
import { tutorialLevel } from '../app/mission-data.ts'
import {
  WORSHIP_OBELISK_MODEL,
  WORSHIP_STONE_HEAD_MODEL,
  worshipAppearanceModel,
} from '../app/worship-appearance.ts'

test('mode-3 worship uses the original Obelisk model without changing other head families', () => {
  assert.equal(WORSHIP_OBELISK_MODEL, 8)
  assert.equal(WORSHIP_STONE_HEAD_MODEL, 45)
  assert.equal(worshipAppearanceModel(3), 8)
  for (const mode of [0, 1, 2, 4, 5, undefined]) assert.equal(worshipAppearanceModel(mode), 45)
})

test('original worship model 8 is the reviewed bank-2 geometry', () => {
  const model = models[8]
  assert.ok(model)
  assert.deepEqual(
    { scale: model.scale, points: model.p.length / 3, faces: model.faces.length / 2, tiles: model.tiles.length, panelHeight: model.panelHeight },
    { scale: 160, points: 156, faces: 29, tiles: 29, panelHeight: 534 }
  )
  assert.equal(
    crypto.createHash('sha256').update(JSON.stringify(model)).digest('hex'),
    '1dcc048a1c88b18a7c76de6aef3de662213efe56ba1bb88d28c757a97268fbd4'
  )
})

test('linked tutorial mode-3 Obelisk retains its authored mode and model', () => {
  const world = createWorld(tutorialLevel),
    trigger = world.shrines.find(shrine => shrine.name === 'Tutorial Obelisk trigger')
  assert.ok(trigger?.linkedShrine)
  assert.deepEqual(
    { mode: trigger.linkedShrine.mode, model: trigger.linkedShrine.model, name: trigger.linkedShrine.name },
    { mode: 3, model: 8, name: 'Obelisk' }
  )
})
