import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld } from '../app/world-initialization.ts'
import { stepComputerTasks } from '../app/computer-runtime.ts'
import { withCampaignTribe } from '../app/campaign-runtime.ts'
import { addBuilding } from '../app/construction-runtime.ts'
import { createLivePerson } from '../app/live-people.ts'

const tasks = w => w.campaignAIs[3].tasks.filter(t => t.flags & 1 && t.type === 0)
function produce(w) {
  w.turn = 60 // Controlled producer boundary, not a natural history.
  withCampaignTribe(w, 3, () => stepComputerTasks(w, 3))
}
function established() {
  const w = createWorld(14)
  addBuilding(w, 'green', 'tower', { x: -111, z: -59 }, true)
  w.campaignAIs[3].constructionBase = 0x3298
  return w
}
test('M14 first Green Tower uses immutable loaded origin', () => {
  const w = createWorld(14)
  const shaman = w.units.find(u => u.team === 'green' && u.kind === 'shaman')
  shaman.x += 30
  shaman.z += 30
  produce(w)
  assert.equal(tasks(w).length, 1)
  assert.equal(tasks(w)[0].requested, 4)
  assert.equal(tasks(w)[0].origin, 0x3298)
})
for (const origin of [0, 0x52de])
  test(`M14 housing retains stored origin ${origin}`, () => {
    const w = established()
    w.campaignAIs[3].constructionBase = origin
    produce(w)
    assert.equal(tasks(w).length, 1)
    assert.equal(tasks(w)[0].requested, 1)
    assert.equal(tasks(w)[0].origin, origin)
  })
for (const mode of ['completed', 'underConstruction', 'plan', 'otherTribe'])
  test(`M14 counts ${mode} capacity`, () => {
    const w = established()
    w.campaignAIs[3].attributes[10] = 3
    const b = addBuilding(
      w,
      mode === 'otherTribe' ? 'blue' : 'green',
      'hut',
      { x: -121, z: -59 },
      mode !== 'plan',
      mode === 'plan' ? { plan: true } : undefined
    )
    if (mode === 'underConstruction') b.progress = 0.5
    produce(w)
    assert.equal(tasks(w).length, Number(['underConstruction', 'otherTribe'].includes(mode)))
  })
for (const available of [0, 1, 2])
  test(`M14 requires two idle workers: ${available}`, () => {
    const w = established()
    for (const [i, u] of w.units.filter(u => u.team === 'green' && u.kind !== 'shaman').entries()) {
      u.native = createLivePerson(w, u)
      u.native.state = 17
      if (i >= available) u.native.computerAssignment = 1
    }
    produce(w)
    assert.equal(tasks(w).length, Number(available >= 2))
  })
for (const gate of ['disabled', 'limit', 'zeroTarget'])
  test(`M14 respects ${gate}`, () => {
    const w = established(),
      ai = w.campaignAIs[3]
    if (gate === 'disabled') ai.states &= ~1
    if (gate === 'limit') ai.attributes[9] = 0
    if (gate === 'zeroTarget') ai.attributes[10] = 0
    produce(w)
    assert.equal(tasks(w).length, 0)
  })

for (const tribe of [1, 2])
  test(`M14 tribe ${tribe} remains outside the Green settlement binding`, () => {
    const w = createWorld(14)
    w.turn = 60
    withCampaignTribe(w, tribe, () => stepComputerTasks(w, tribe))
    assert.equal(w.campaignAIs[tribe].tasks.filter(t => t.flags & 1 && t.type === 0).length, 0)
  })

test('M14 ordinary Green settlement grows and resumes the complete saved world', async () => {
  const { createGameStore } = await import('../app/game-store.ts')
  const { advanceGame } = await import('../app/game-clock.ts')
  const store = createGameStore()
  store.startMission(14)
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
        w.buildings.some(b => b.team === 'green' && b.progress > 0 && b.progress < 1),
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
  const buildings = w.buildings.filter(b => b.team === 'green' && b.hp > 0)
  assert.equal(buildings.filter(b => b.kind === 'tower' && b.progress === 1).length, 1)
  assert.equal(buildings.filter(b => b.kind === 'hut' && b.progress === 1).length, 2)
  assert.equal(buildings.filter(b => b.kind === 'hut' && b.progress === 0).length, 1)
  assert.equal(buildings.length, 4)
  assert.ok(
    w.units.filter(u => u.team === 'green' && u.hp > 0).length > 7,
    'ordinary housing births, not injected followers'
  )
  assert.ok(w.campaignAIs[3].constructionBase !== undefined)
  for (const team of ['red', 'yellow']) {
    assert.equal(w.buildings.filter(b => b.team === team).length, 0)
    assert.equal(w.units.filter(u => u.team === team && u.hp > 0).length, 7)
  }
})
