import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld } from '../app/world-initialization.ts'
import { advanceGame } from '../app/game-clock.ts'
import { stepComputerTasks } from '../app/computer-runtime.ts'
import { withCampaignTribe } from '../app/campaign-runtime.ts'
import { addBuilding } from '../app/construction-runtime.ts'
import { buildingModel } from '../app/building-shapes.ts'
import { createLivePerson } from '../app/live-people.ts'
import { migrateCheckpoint } from '../app/game-store.ts'

const active = w => w.campaignAIs[3].tasks.filter(t => t.flags & 1 && t.type === 0)
function fixture() {
  const w = createWorld(11)
  addBuilding(w, 'green', 'tower', { x: 0, z: 0 }, true)
  w.turn = 188 // Controlled producer boundary; not a natural-history fixture.
  w.campaignAIs[3].constructionBase = 0xda7a
  return w
}
function produce(w) {
  withCampaignTribe(w, 3, () => stepComputerTasks(w, 3))
}

for (const mode of ['completed', 'underConstruction', 'plan', 'damagedCompleted', 'otherTribe'])
  test(`M11 continued housing counts ${mode} capacity`, () => {
    const w = fixture()
    w.campaignAIs[3].attributes[10] = 3
    const b = addBuilding(
      w,
      mode === 'otherTribe' ? 'blue' : 'green',
      'hut',
      { x: 12, z: 12 },
      mode !== 'plan',
      mode === 'plan' ? { plan: true } : undefined
    )
    if (mode === 'underConstruction') b.progress = 0.5
    if (mode === 'damagedCompleted') b.hp /= 2
    produce(w)
    assert.equal(active(w).length, Number(['underConstruction', 'otherTribe'].includes(mode)))
  })

test('M11 earlier housing requests do not permanently disable ordinary growth', () => {
  const w = fixture()
  w.campaignAIs[3].flags |= 0x40000000 // Former port-only latch may exist in current-format checkpoints.
  addBuilding(w, 'green', 'hut', { x: 12, z: 12 }, true)
  produce(w)
  assert.equal(active(w).length, 1)
  assert.equal(active(w)[0].requested, 1)
  assert.equal(active(w)[0].origin, 0xda7a)
})

for (const gate of ['disabled', 'limit', 'full', 'wrongCadence', 'zeroTarget'])
  test(`M11 continued housing respects ${gate}`, () => {
    const w = fixture(),
      ai = w.campaignAIs[3]
    if (gate === 'disabled') ai.states &= ~1
    if (gate === 'limit') ai.attributes[9] = 0
    if (gate === 'full') for (const t of ai.tasks) Object.assign(t, { flags: 1, type: 1 })
    if (gate === 'wrongCadence') w.turn = 187
    if (gate === 'zeroTarget') ai.attributes[10] = 0
    produce(w)
    assert.equal(active(w).length, 0)
  })

for (const available of [0, 1, 2])
  test(`M11 construction requires two idle workers, available=${available}`, () => {
    const w = fixture()
    for (const [i, u] of w.units.filter(u => u.team === 'green' && u.kind !== 'shaman').entries()) {
      u.native = createLivePerson(w, u)
      u.native.state = 17
      if (i >= available) u.native.computerAssignment = 1
    }
    produce(w)
    assert.equal(active(w).length, Number(available >= 2))
  })

test('M11 moving native records cannot masquerade as idle presentation fallbacks', () => {
  const w = fixture()
  for (const u of w.units.filter(u => u.team === 'green' && u.kind !== 'shaman')) {
    u.native = createLivePerson(w, u)
    assert.equal(u.native.state, 10)
  }
  produce(w)
  assert.equal(active(w).length, 0)
})

test('M11 established base zero remains authoritative', () => {
  const w = fixture()
  w.campaignAIs[3].constructionBase = 0
  produce(w)
  assert.equal(active(w).length, 1)
  assert.equal(active(w)[0].origin, 0)
})

const clock = () => ({
  animationTime: 0,
  animationFrame: 0,
  afterTurn() {},
  worshipVisit() {},
  presentationHidden: () => false,
})
test('M11 ordinary Matak expands beyond one Hut with full checkpoint continuation', () => {
  const w = createWorld(11),
    c = clock(),
    start = performance.now()
  let replay, rc
  while (w.turn < 3000) {
    assert.ok(performance.now() - start < 30000, 'bounded functional run, not a speed claim')
    advanceGame(w, c, 1 / 12)
    if (replay) advanceGame(replay, rc, 1 / 12)
    if (w.turn === 256) {
      replay = migrateCheckpoint(structuredClone(w))
      rc = { ...clock(), animationTime: c.animationTime, animationFrame: c.animationFrame }
      assert.deepEqual(replay, w)
    }
    if (replay && (w.turn % 256 === 0 || w.turn === 3000)) assert.deepEqual(replay, w)
    assert.equal(w.status, 'playing')
  }
  assert.ok(
    w.buildings.filter(b => b.team === 'green' && b.kind === 'hut' && b.progress === 1).length >= 5
  )
  for (const team of ['yellow', 'green'])
    assert.ok(w.buildings.some(b => b.team === team && buildingModel(b) === 4 && b.progress === 1))
  assert.equal(
    w.buildings.filter(b => b.team === 'yellow' && b.kind === 'hut').length,
    0,
    'Chumara expansion remains outside this binding'
  )
})
