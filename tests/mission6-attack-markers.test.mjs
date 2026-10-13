import assert from 'node:assert/strict'
import test from 'node:test'
import { createComputerQueue, requestAttack, stepAttackTask } from '../app/computer.ts'
import { createWorld, nativeCellPoint } from '../app/model.ts'
import { missionData } from '../app/mission-data.ts'
import { createLivePerson, registerLivePerson } from '../app/live-people.ts'
import { stepComputerTasks } from '../app/computer-runtime.ts'
import { withCampaignTribe } from '../app/campaign-runtime.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import rules from '../app/original-rules.json' with { type: 'json' }

const input = {
  staging: 1234,
  select: () => [],
  settled: () => true,
  memberWithin: () => null,
  ready: () => true,
  activeMembers: () => 1,
  targetsRemain: () => true,
  random: () => 0,
}

test('authored attack markers survive staging, marker cast and 32 task visits', () => {
  const ai = createComputerQueue()
  requestAttack(ai, 9000, 0, 5, 128, [0, 88, 12, 0, 0, 1], 25, true, 3, 1, [12, 3, 2], {
    staging: 24206,
    spell: 16,
  })
  const t = ai.tasks[0]
  t.phase = 7
  assert.deepEqual(stepAttackTask(ai, 0, input), [])
  assert.equal(t.phase, 8)
  assert.deepEqual(stepAttackTask(ai, 0, input), [{ kind: 'move', target: 24206, replace: true }])
  assert.equal(t.stagingMarker, -1)
  assert.equal(t.phase, 6)
  assert.equal(t.fallback, 7)
  stepAttackTask(ai, 0, input)
  assert.equal(t.phase, 7)
  stepAttackTask(ai, 0, input)
  assert.equal(t.phase, 21)
  assert.equal(t.spellMarker, 16)
  const restored = structuredClone(ai)
  for (const a of [ai, restored]) stepAttackTask(a, 0, { ...input, markerSpell: () => 'finished' })
  assert.deepEqual(restored, ai)
  assert.equal(t.phase, 22)
  for (let i = 0; i < 31; i++) stepAttackTask(ai, 0, input)
  assert.equal(t.phase, 22)
  assert.equal(t.markerDelay, 1)
  stepAttackTask(ai, 0, input)
  assert.equal(t.phase, 7)
})

test('markerless legacy attacks keep the established phase7 route', () => {
  const ai = createComputerQueue(),
    t = ai.tasks[0]
  Object.assign(t, { flags: 1, type: 20, phase: 7, spells: [12, 3, 2] })
  stepAttackTask(ai, 0, input)
  assert.equal(t.phase, 9)
})

// Supplied caster fixtures isolate phase21. Fresh ordinary marker allocation,
// travel and the resulting land connection have their own campaign acceptance.
function fixture({
  mana = 150000,
  stock = 0,
  state = 17,
  atMarker = true,
  spells = [12, 3, 2],
  visits = 7,
} = {}) {
  const w = createWorld(6),
    ai = w.campaignAIs[3],
    shaman = w.units.find(u => u.team === 'green' && u.kind === 'shaman')
  if (atMarker) Object.assign(shaman, nativeCellPoint(missionData(6).level.markers[0]))
  shaman.native = createLivePerson(w, shaman)
  shaman.native.state = state
  shaman.native.computerAssignment = 1
  shaman.native.flags3 |= 0x2000
  shaman.nativeFlags7f = 3
  registerLivePerson(w, shaman.native)
  ai.tasks.forEach(t => (t.flags = 0))
  Object.assign(ai.tasks[0], {
    flags: 1,
    type: 20,
    phase: 21,
    fallback: 7,
    spellMarker: 16,
    attackVisits: visits,
    spells: [...spells],
    members: [shaman.id],
  })
  ai.cursor = 0
  w.turn = 0
  w.manaTribes[3].mana = mana
  w.manaWorld.spells[3].stocks[12] = stock
  const step = () => {
    ai.cursor = 0
    withCampaignTribe(w, 3, () => stepComputerTasks(w, 3))
  }
  return { w, ai, shaman, t: ai.tasks[0], step }
}

test('marker cast uses authored marker16, clears only byte0 and preserves affordable remainder', () => {
  const { w, t, step } = fixture()
  step()
  const p = w.projectiles.find(p => p.spell === 'bridge')
  assert.ok(p)
  assert.equal(
    ((p.destination.x >>> 8) & 254) | (p.destination.y & 0xfe00),
    missionData(6).level.markers[16]
  )
  assert.deepEqual(t.spells, [0, 3, 2])
  assert.equal(t.phase, 22)
  assert.equal(t.markerDelay, 32)
})

test('marker selector never skips empty byte0 to cast later Lightning or Blast', () => {
  const { w, t, step } = fixture({ spells: [0, 3, 2] })
  step()
  assert.equal(w.projectiles.length, 0)
  assert.equal(t.phase, 22)
  assert.deepEqual(t.spells, [0, 3, 2])
})

test('marker caster applies visit cadence and cast-state gates before payment', () => {
  for (const mode of ['cadence', 'cooldown']) {
    const f = fixture({ visits: mode === 'cadence' ? 0 : 7 })
    if (mode === 'cooldown') f.w.castingTribes[3].cooldown = 1
    f.step()
    assert.equal(f.w.projectiles.length, 0)
    assert.equal(f.t.phase, 21)
    assert.deepEqual(f.t.spells, [12, 3, 2])
  }
})

test('marker range refusal retains moving caster payload but clears settled caster byte0', () => {
  for (const state of [10, 33, 17, 19]) {
    const f = fixture({ state, atMarker: false })
    f.step()
    assert.equal(f.w.projectiles.length, 0)
    assert.equal(f.t.phase, 21)
    assert.deepEqual(f.t.spells, [[17, 19].includes(state) ? 0 : 12, 3, 2])
  }
})

test('marker stock funds cast, while mana and usage refusal remove byte0', () => {
  const funded = fixture({ mana: 0, stock: 1 })
  funded.step()
  assert.ok(funded.w.projectiles.some(p => p.spell === 'bridge'))
  for (const mode of ['mana', 'usage']) {
    const f = fixture({ mana: mode === 'mana' ? 0 : 150000 })
    if (mode === 'usage') {
      f.ai.flags |= 0x40000
      f.w.castingTribes[3].spells[12].used = rules.spellCharging[12].normalLimit
    }
    f.step()
    assert.equal(f.w.projectiles.length, 0)
    assert.deepEqual(f.t.spells, [0, 3, 2])
    assert.equal(f.t.phase, 22)
    if (mode === 'mana') {
      assert.equal(currentPersonOrder(f.w.buildingOrders, f.shaman.native)?.model, 3)
      assert.equal(f.shaman.native.computerAssignment, 0)
      assert.equal(f.shaman.native.flags3 & 0x2000, 0)
      assert.equal(f.shaman.nativeFlags7f, 2)
      assert.equal(f.shaman.native.state, 17)
      assert.equal(f.w.objectCells.objects.get(f.shaman.id), f.shaman.native)
    }
  }
})

test('absent tribe Shaman immediately returns marker task to fallback', () => {
  const f = fixture()
  f.w.units = f.w.units.filter(u => u !== f.shaman)
  f.step()
  assert.equal(f.t.phase, 7)
  assert.equal(f.t.markerDelay, undefined)
})

test('home cleanup preserves state and flags4 while replacing all queue slots at cursor zero', () => {
  const f = fixture({ mana: 0, spells: [0, 3, 2] }),
    p = f.shaman.native
  p.commandCursor = 3
  p.commands[3] = 100
  p.immediateCommand = 101
  for (const id of [100, 101])
    Object.assign(f.w.buildingOrders.records[id], { model: 3, references: 1, a: 100, b: 200 })
  f.w.buildingOrders.active = 2
  p.flags2 |= 0x8000000
  p.flags3 |= 0x200
  p.flags4 |= 512
  const state = p.state,
    flags4 = p.flags4
  f.step()
  assert.equal(p.state, state)
  assert.equal(p.flags4, flags4)
  assert.equal(p.commandCursor, 0)
  assert.equal(p.immediateCommand, 0)
  assert.deepEqual(p.commands.slice(1), [0, 0, 0, 0, 0, 0, 0])
  assert.equal(f.w.buildingOrders.records[100].references, 0)
  assert.equal(f.w.buildingOrders.records[101].references, 0)
  assert.equal(p.flags2 & 0x8000000, 0)
  assert.equal(p.flags3 & 0x2200, 0)
  const order = currentPersonOrder(f.w.buildingOrders, p)
  assert.equal(order.model, 3)
  assert.equal(order.a & 511, 0, 'home coordinates are the even cell origin, without +128')
  assert.equal(order.b & 511, 0)
})

test('home allocation failure retains queued orders and state but still clears Shaman assignment', () => {
  const f = fixture({ mana: 0, spells: [0, 3, 2] }),
    p = f.shaman.native
  for (const order of f.w.buildingOrders.records) order.references = 1
  p.commandCursor = 3
  p.commands[3] = 100
  p.flags4 |= 512
  const before = {
    commands: [...p.commands],
    cursor: p.commandCursor,
    state: p.state,
    flags4: p.flags4,
  }
  f.step()
  assert.deepEqual(
    { commands: p.commands, cursor: p.commandCursor, state: p.state, flags4: p.flags4 },
    before
  )
  assert.equal(p.computerAssignment, 0)
  assert.equal(p.flags3 & 0x2000, 0)
  assert.equal(f.shaman.nativeFlags7f, 2)
  assert.equal(f.w.objectCells.objects.get(f.shaman.id), p)
  assert.equal(f.t.phase, 22)
})
