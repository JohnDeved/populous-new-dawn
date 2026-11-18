import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld } from '../app/world-initialization.ts'
import { stepComputerTasks } from '../app/computer-runtime.ts'
import { advanceGame } from '../app/game-clock.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { addBuilding } from '../app/construction-runtime.ts'
import { unitAnimationSource } from '../app/unit-animation-source.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import script from '../app/original-script-eight.json' with { type: 'json' }

const active = w => w.ai.tasks.filter(t => t.flags & 1 && t.type === 0)
function fixture() {
  const w = createWorld(8)
  w.turn = 62 // Supplied producer boundary; natural episode below is separate.
  return w
}

test('M8 original startup enables housing without Tower or school targets', () => {
  assert.equal(script.sha256, '441938566197d62880c924e1b1108dfbef5b95e1ee096c21ef88e9240ee63b98')
  const w = createWorld(8)
  assert.equal(w.ai.flags & 0x400, 0x400)
  assert.equal(w.ai.states & 1, 1)
  assert.deepEqual(
    [2, 3, 4, 35, 36, 9, 10].map(i => w.ai.attributes[i]),
    [0, 0, 0, 0, 0, 2, 10]
  )
  assert.equal(w.units.filter(u => u.team === 'red' && u.kind === 'brave').length, 6)
  assert.equal(w.buildings.length, 0)
})

for (const state of ['ordinary', 'moved', 'dead', 'missing', 'zero'])
  test(`M8 housing retains loaded origin with ${state} Shaman/base`, () => {
    const w = fixture(),
      shaman = w.units.find(u => u.team === 'red' && u.kind === 'shaman')
    if (state === 'moved') Object.assign(shaman, { x: 24, z: -40 })
    if (state === 'dead') shaman.hp = 0
    if (state === 'missing') w.units = w.units.filter(u => u !== shaman)
    if (state === 'zero') w.ai.constructionBase = 0
    const rng = w.randomState
    stepComputerTasks(w, 1)
    assert.deepEqual(
      active(w).map(t => [t.requested, t.origin, t.phase, t.extra]),
      [[1, state === 'zero' ? 0 : 0x18f6, 0, 0]]
    )
    assert.equal(w.randomState, rng)
  })

for (const gate of [
  'disabled',
  'limit',
  'full',
  'zeroHousing',
  'oneWorker',
  'wrongCadence',
  'towerEnabled',
])
  test(`M8 housing respects ${gate} gate`, () => {
    const w = fixture()
    if (gate === 'towerEnabled') w.ai.flags &= ~0x400
    if (gate === 'disabled') w.ai.states &= ~1
    if (gate === 'limit') w.ai.attributes[9] = 0
    if (gate === 'full') for (const t of w.ai.tasks) Object.assign(t, { flags: 1, type: 1 })
    if (gate === 'zeroHousing') w.ai.attributes[10] = 0
    if (gate === 'wrongCadence') w.turn = 61
    if (gate === 'oneWorker') {
      let kept = false
      for (const u of w.units.filter(u => u.team === 'red' && u.kind !== 'shaman')) {
        if (!kept) kept = true
        else u.hp = 0
      }
    }
    stepComputerTasks(w, 1)
    assert.equal(active(w).length, 0)
  })

for (const mode of ['completed', 'plan', 'underConstruction', 'damagedCompleted', 'otherTribe'])
  test(`M8 housing capacity uses ${mode} owner`, () => {
    const w = fixture()
    w.ai.attributes[10] = 1
    const b = addBuilding(
      w,
      mode === 'otherTribe' ? 'blue' : 'red',
      'hut',
      { x: 0, z: 0 },
      mode !== 'plan',
      mode === 'plan' ? { plan: true } : undefined
    )
    if (mode === 'underConstruction') b.progress = 0.5
    if (mode === 'damagedCompleted') b.hp /= 2
    stepComputerTasks(w, 1)
    assert.equal(active(w).length, Number(['underConstruction', 'otherTribe'].includes(mode)))
  })

test('M8 capacity equality stops further housing requests', () => {
  const w = fixture()
  addBuilding(w, 'red', 'hut', { x: 0, z: 0 }, true)
  w.ai.attributes[10] = 3
  stepComputerTasks(w, 1)
  assert.equal(active(w).length, 0)
})

const clock = () => ({
  animationTime: 0,
  animationFrame: 0,
  afterTurn() {},
  worshipVisit() {},
  presentationHidden: () => false,
})
test('M8 original roster completes housing through ordinary builders, timber and checkpoint continuation', () => {
  const w = createWorld(8),
    c = clock(),
    start = performance.now()
  let replay,
    rc,
    recruited = false,
    progress = false,
    complete = false
  while (w.turn < 900) {
    assert.ok(
      performance.now() - start < 20000,
      'bounded functional simulation, not a performance claim'
    )
    advanceGame(w, c, 1 / 12)
    if (replay) advanceGame(replay, rc, 1 / 12)
    if (w.turn === 63)
      assert.deepEqual(
        active(w).map(t => [t.requested, t.origin]),
        [[1, 0x18f6]]
      )
    if (w.turn === 64) {
      assert.equal(w.buildings.length, 1)
      assert.ok(w.buildings[0].preparation)
      replay = migrateCheckpoint(structuredClone(w))
      rc = { ...clock(), animationTime: c.animationTime, animationFrame: c.animationFrame }
      assert.deepEqual(replay, w)
    }
    recruited ||= active(w).some(
      t =>
        t.members.length === 2 &&
        t.members.every(id => {
          const u = w.units.find(u => u.id === id)
          const p = unitAnimationSource(u) ?? u.native
          return p && currentPersonOrder(w.buildingOrders, p)?.model === 6
        })
    )
    progress ||= w.buildings.some(b => b.team === 'red' && b.progress > 0 && b.progress < 1)
    complete ||= w.buildings.some(b => b.team === 'red' && b.progress === 1)
    assert.equal(w.status, 'playing')
    if (replay && (w.turn % 64 === 0 || w.turn === 900)) assert.deepEqual(replay, w)
  }
  assert.ok(recruited)
  assert.ok(progress)
  assert.ok(complete)
  // Native 004f6520 excludes the in-progress state1 owner after its plan is consumed.
  assert.equal(w.buildings.length, 3)
  assert.ok(w.buildings.every(b => b.team === 'red' && b.kind === 'hut'))
  assert.equal(w.ai.constructionBase, undefined, 'a Hut does not establish a Tower base')
})
