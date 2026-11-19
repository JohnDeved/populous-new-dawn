import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld } from '../app/world-initialization.ts'
import { stepComputerTasks } from '../app/computer-runtime.ts'
import { withCampaignTribe } from '../app/campaign-runtime.ts'
import { addBuilding } from '../app/construction-runtime.ts'
import { createLivePerson } from '../app/live-people.ts'

const tasks = w => w.campaignAIs[2].tasks.filter(t => t.flags & 1 && t.type === 0)
function produce(w) {
  w.turn = 61 // Controlled producer boundary, not a natural history.
  withCampaignTribe(w, 2, () => stepComputerTasks(w, 2))
}
function established() {
  const w = createWorld(18)
  addBuilding(w, 'yellow', 'tower', { x: -45, z: -127 }, true)
  addBuilding(w, 'yellow', 'boatHouse', { x: -55, z: -117 }, true)
  w.campaignAIs[2].constructionBase = 0x76da
  return w
}
test('M18 first Yellow Tower uses immutable loaded origin', () => {
  const w = createWorld(18)
  const shaman = w.units.find(u => u.team === 'yellow' && u.kind === 'shaman')
  shaman.x += 30
  shaman.z += 30
  produce(w)
  assert.equal(tasks(w).length, 1)
  assert.equal(tasks(w)[0].requested, 4)
  assert.equal(tasks(w)[0].origin, 0x76da)
})
for (const origin of [0, 0x52de])
  test(`M18 housing retains stored origin ${origin}`, () => {
    const w = established()
    w.campaignAIs[2].constructionBase = origin
    produce(w)
    assert.equal(tasks(w).length, 1)
    assert.equal(tasks(w)[0].requested, 1)
    assert.equal(tasks(w)[0].origin, origin)
  })
for (const mode of ['completed', 'underConstruction', 'plan', 'otherTribe'])
  test(`M18 counts ${mode} capacity`, () => {
    const w = established()
    w.campaignAIs[2].attributes[10] = 3
    const b = addBuilding(
      w,
      mode === 'otherTribe' ? 'blue' : 'yellow',
      'hut',
      { x: -55, z: -127 },
      mode !== 'plan',
      mode === 'plan' ? { plan: true } : undefined
    )
    if (mode === 'underConstruction') b.progress = 0.5
    produce(w)
    assert.equal(tasks(w).length, Number(['underConstruction', 'otherTribe'].includes(mode)))
  })
for (const available of [0, 1, 2])
  test(`M18 requires two idle workers: ${available}`, () => {
    const w = established()
    for (const [i, u] of w.units
      .filter(u => u.team === 'yellow' && u.kind !== 'shaman')
      .entries()) {
      u.native = createLivePerson(w, u)
      u.native.state = 17
      if (i >= available) u.native.computerAssignment = 1
    }
    produce(w)
    assert.equal(tasks(w).length, Number(available >= 2))
  })
for (const gate of ['disabled', 'limit', 'zeroTarget'])
  test(`M18 respects ${gate}`, () => {
    const w = established(),
      ai = w.campaignAIs[2]
    if (gate === 'disabled') ai.states &= ~1
    if (gate === 'limit') ai.attributes[9] = 0
    if (gate === 'zeroTarget') ai.attributes[10] = 0
    produce(w)
    assert.equal(tasks(w).length, 0)
  })

test('M18 Yellow requests its authored Boat House before housing', () => {
  const w = established()
  w.buildings = w.buildings.filter(b => b.kind !== 'boatHouse')
  produce(w)
  assert.equal(tasks(w).length, 1)
  assert.equal(tasks(w)[0].requested, 13)
  assert.equal(tasks(w)[0].origin, 0x76da)
})
for (const tribe of [1, 3])
  test(`M18 tribe ${tribe} is not admitted to Yellow construction`, () => {
    const w = createWorld(18)
    w.turn = tribe === 1 ? 63 : 60
    withCampaignTribe(w, tribe, () => stepComputerTasks(w, tribe))
    assert.equal(w.campaignAIs[tribe].tasks.filter(t => t.flags & 1 && t.type === 0).length, 0)
  })

test('M18 Yellow naturally completes its Boat House and housing through full checkpoint continuation', async () => {
  const { createGameStore } = await import('../app/game-store.ts')
  const { advanceGame } = await import('../app/game-clock.ts')
  const store = createGameStore()
  store.startMission(18)
  const w = store.getWorld()
  const clock = () => ({
    animationTime: 0,
    animationFrame: 0,
    afterTurn() {},
    worshipVisit() {},
    presentationHidden: () => false,
  })
  const c = clock(),
    start = performance.now()
  let replay, rc
  while (w.turn < 3000) {
    assert.ok(performance.now() - start < 45000, 'bounded functional run, not a performance claim')
    advanceGame(w, c, 1 / 12)
    if (replay) advanceGame(replay, rc, 1 / 12)
    if (!replay && w.buildings.some(b => b.team === 'yellow' && b.progress > 0 && b.progress < 1)) {
      assert.equal(await store.saveCheckpoint(false), false, 'Node session Save without IndexedDB')
      assert.ok(store.loadCheckpoint())
      replay = store.getWorld()
      rc = { ...clock(), animationTime: c.animationTime, animationFrame: c.animationFrame }
      assert.deepEqual(replay, w)
    }
    if (replay && (w.turn % 128 === 0 || w.turn === 3000)) assert.deepEqual(replay, w)
    assert.equal(w.status, 'playing')
  }
  assert.ok(replay, 'checkpoint captured actual construction in flight')
  for (const kind of ['tower', 'boatHouse', 'hut'])
    assert.ok(
      w.buildings.some(b => b.team === 'yellow' && b.kind === kind && b.progress === 1 && b.hp > 0),
      `natural completed ${kind}`
    )
  assert.ok(
    w.units.filter(u => u.team === 'yellow' && u.hp > 0).length > 7,
    'ordinary housing births'
  )
  assert.equal(w.units.filter(u => u.team === 'green' && u.hp > 0).length, 7)
  assert.equal(w.buildings.filter(b => b.team === 'green' && b.hp > 0).length, 0)
  assert.ok(w.campaignAIs[2].constructionBase !== undefined)
})
