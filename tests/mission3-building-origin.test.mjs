import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld } from '../app/world-initialization.ts'
import { advanceGame } from '../app/game-clock.ts'
import { stepComputerTasks } from '../app/computer-runtime.ts'
import { withCampaignTribe } from '../app/campaign-runtime.ts'
import { addBuilding } from '../app/construction-runtime.ts'
import { migrateCheckpoint } from '../app/game-store.ts'

const tasks = w => w.campaignAIs[2].tasks.filter(t => t.flags & 1 && t.type === 0)
const clock = () => ({
  animationTime: 0,
  animationFrame: 0,
  afterTurn() {},
  worshipVisit() {},
  presentationHidden: () => false,
})
function produce(w) {
  w.turn = 61
  withCampaignTribe(w, 2, () => stepComputerTasks(w, 2))
}

test('M3 first Tower retains loaded origin after the live Shaman moves', () => {
  const w = createWorld(3)
  const shaman = w.units.find(u => u.team === 'yellow' && u.kind === 'shaman')
  assert.ok(shaman)
  shaman.x = 20
  shaman.z = 20
  produce(w)
  assert.equal(tasks(w).length, 1)
  assert.equal(tasks(w)[0].requested, 4)
  assert.equal(tasks(w)[0].origin, 0x60da)
})

for (const origin of [0, 0x52de])
  test(`M3 school allocation keeps established base ${origin}, not Tower anchor`, () => {
    const w = createWorld(3)
    addBuilding(w, 'yellow', 'tower', { x: 20, z: 20 }, true)
    w.campaignAIs[2].constructionBase = origin
    produce(w)
    assert.equal(tasks(w).length, 1)
    assert.equal(tasks(w)[0].requested, 5)
    assert.equal(tasks(w)[0].origin, origin)
  })

test('M3 natural Temple and housing retain accepted base across checkpoint replay', () => {
  const w = createWorld(3),
    c = clock()
  while (w.turn < 550) advanceGame(w, c, 1 / 12)
  assert.equal(w.campaignAIs[2].constructionBase, 0x52de)
  const restored = migrateCheckpoint(structuredClone(w))
  const resumed = { ...clock(), animationTime: c.animationTime, animationFrame: c.animationFrame }
  const requested = new Set()
  while (w.turn < 3000) {
    advanceGame(w, c, 1 / 12)
    advanceGame(restored, resumed, 1 / 12)
    for (const t of tasks(w))
      if (t.requested !== 4) {
        assert.equal(t.origin, w.campaignAIs[2].constructionBase)
        requested.add(t.requested)
      }
  }
  assert.deepEqual(restored, w)
  assert.ok(requested.has(5), 'natural Temple allocation')
  assert.ok(requested.has(1), 'natural housing allocation')
  for (const kind of ['tower', 'temple', 'hut'])
    assert.ok(
      w.buildings.some(b => b.team === 'yellow' && b.kind === kind && b.progress === 1 && b.hp > 0),
      `completed ${kind}`
    )
})
