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
  const w = createWorld(13)
  addBuilding(w, 'yellow', 'tower', { x: 115, z: 67 }, true)
  w.campaignAIs[2].constructionBase = 0xb47a
  return w
}
test('M13 first Yellow Tower uses immutable loaded origin', () => {
  const w = createWorld(13)
  const shaman = w.units.find(u => u.team === 'yellow' && u.kind === 'shaman')
  shaman.x += 30
  shaman.z += 30
  produce(w)
  assert.equal(tasks(w).length, 1)
  assert.equal(tasks(w)[0].requested, 4)
  assert.equal(tasks(w)[0].origin, 0xb47a)
})
for (const origin of [0, 0x52de])
  test(`M13 housing retains stored origin ${origin}`, () => {
    const w = established()
    w.campaignAIs[2].constructionBase = origin
    produce(w)
    assert.equal(tasks(w).length, 1)
    assert.equal(tasks(w)[0].requested, 1)
    assert.equal(tasks(w)[0].origin, origin)
  })
for (const mode of ['completed', 'underConstruction', 'plan', 'otherTribe'])
  test(`M13 counts ${mode} capacity`, () => {
    const w = established()
    w.campaignAIs[2].attributes[10] = 3
    const b = addBuilding(
      w,
      mode === 'otherTribe' ? 'blue' : 'yellow',
      'hut',
      { x: 105, z: 67 },
      mode !== 'plan',
      mode === 'plan' ? { plan: true } : undefined
    )
    if (mode === 'underConstruction') b.progress = 0.5
    produce(w)
    assert.equal(tasks(w).length, Number(['underConstruction', 'otherTribe'].includes(mode)))
  })
for (const available of [0, 1, 2])
  test(`M13 requires two idle workers: ${available}`, () => {
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
  test(`M13 respects ${gate}`, () => {
    const w = established(),
      ai = w.campaignAIs[2]
    if (gate === 'disabled') ai.states &= ~1
    if (gate === 'limit') ai.attributes[9] = 0
    if (gate === 'zeroTarget') ai.attributes[10] = 0
    produce(w)
    assert.equal(tasks(w).length, 0)
  })
test('M13 Green producer remains unbound', () => {
  const w = createWorld(13)
  w.turn = 60
  withCampaignTribe(w, 3, () => stepComputerTasks(w, 3))
  assert.equal(w.campaignAIs[3].tasks.filter(t => t.flags & 1).length, 0)
})

test('M13 ordinary Yellow settlement grows and resumes the complete saved world', async () => {
  const { createGameStore } = await import('../app/game-store.ts')
  const { advanceGame } = await import('../app/game-clock.ts')
  const store = createGameStore()
  store.startMission(13)
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
    if (w.turn === 512) {
      assert.ok(
        w.buildings.some(b => b.team === 'yellow' && b.progress > 0 && b.progress < 1),
        'save actual construction in flight'
      )
      assert.equal(await store.saveCheckpoint(false), false, 'Node session Save without IndexedDB')
      assert.ok(store.loadCheckpoint())
      replay = store.getWorld()
      rc = { ...clock(), animationTime: c.animationTime, animationFrame: c.animationFrame }
      assert.deepEqual(replay, w)
    }
    if (replay && (w.turn % 128 === 0 || w.turn === 3000)) assert.deepEqual(replay, w)
    assert.equal(w.status, 'playing')
  }
  assert.ok(
    w.buildings.some(b => b.team === 'yellow' && b.kind === 'tower' && b.progress === 1 && b.hp > 0)
  )
  assert.equal(
    w.buildings.filter(b => b.team === 'yellow' && b.kind === 'hut' && b.progress === 1 && b.hp > 0)
      .length,
    6
  )
  assert.ok(
    w.units.filter(u => u.team === 'yellow' && u.hp > 0).length > 7,
    'ordinary housing births, not injected followers'
  )
  assert.equal(
    w.buildings.filter(b => b.team === 'green').length,
    0,
    'Green remains outside this binding'
  )
  assert.equal(w.units.filter(u => u.team === 'green' && u.hp > 0).length, 7)
  assert.ok(w.campaignAIs[2].constructionBase !== undefined)
})
