import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { createWorldState, addUnit } from '../app/world-state.ts'
import { createComputerQueue } from '../app/computer.ts'
import { withCampaignTribe } from '../app/campaign-runtime.ts'
import { stepComputerTasks } from '../app/computer-runtime.ts'

const packet = new URL('../decomp/research/raid-phase6-settlement/', import.meta.url)
const fixture = name => JSON.parse(readFileSync(new URL(`${name}/fixture.json`, packet), 'utf8'))

function suppliedVisit(f) {
  const w = createWorldState(6)
  Object.assign(w, { units: [], buildings: [], fights: [], selected: [], turn: f.world.turn })
  w.objectCells.objects.clear()
  w.objectCells.heads.fill(0)
  w.pathfinding.people.clear()
  for (const row of f.people) {
    const c = row.capturedUnit
    w.nextId = row.id
    const u = addUnit(w, c.team, c.kind, c)
    Object.assign(u, {
      hp: c.hp, x: c.x, z: c.z, target: c.target, inside: c.inside, work: c.work,
      fighting: c.fighting, flight: null, casting: null, lift: 0, path: structuredClone(c.path),
    })
    const p = structuredClone(c.p)
    u.native = c.native ? structuredClone(c.native) : null
    if (c.fight) u.fight = { ...structuredClone(c.fight), motion: p }
    else { u.fight = null; u.native = p }
    w.objectCells.objects.set(u.id, p)
  }
  const raw = readFileSync(new URL(`${f.case}/orders-input.bin`, packet))
  w.buildingOrders.records = Array.from({ length: 800 }, (_, id) => ({
    model: raw.readUInt8(id * 10), flags: raw.readUInt8(id * 10 + 1),
    ...Object.fromEntries(['references', 'object', 'a', 'b'].map((key, i) =>
      [key, raw.readUInt16LE(id * 10 + 2 + i * 2)])),
  }))
  w.buildingOrders.cursor = 1
  w.buildingOrders.active = Object.keys(f.pool.knownOrders).length
  Object.assign(w.campaignAIs[2], createComputerQueue())
  const ai = w.campaignAIs[2]
  ai.tasks[0] = structuredClone(f.task.observed)
  ai.tasks[1].flags = 1
  ai.cursor = 0
  w.randomState = f.world.simulationRandom
  w.cosmeticRandom.randomState = f.world.cosmeticRandom
  return { w, ai, task: ai.tasks[0] }
}

function step(context, expectedElapsed, expectedPhase) {
  const { w, ai, task } = context
  const before = structuredClone({
    units: w.units, registry: [...w.objectCells.objects], pool: w.buildingOrders,
    random: w.randomState, cosmetic: w.cosmeticRandom.randomState, members: task.members,
  })
  assert.equal(withCampaignTribe(w, 2, () => stepComputerTasks(w, 2)), undefined)
  assert.deepEqual({ elapsed: task.elapsed, phase: task.phase },
    { elapsed: expectedElapsed, phase: expectedPhase })
  assert.equal(ai.cursor, 1)
  assert.equal(task.flags, 1)
  assert.deepEqual({
    units: w.units, registry: [...w.objectCells.objects], pool: w.buildingOrders,
    random: w.randomState, cosmetic: w.cosmeticRandom.randomState, members: task.members,
  }, before)
}

for (const name of ['captured-combat-timeout', 'captured-moving-not-settled']) {
  test(`actual phase6 caller matches retained native ${name}`, () => {
    const f = fixture(name), context = suppliedVisit(f)
    assert.ok(f.people.every(p => p.capturedUnit.p.computerAssignment === 0))
    step(context, f.expected.nativeElapsed, f.expected.nativePhase)
  })
}

// Source-backed boundaries of 004d14f0/004df0e0; these are portable controls,
// not additional native invocations or reconstructed ordinary gameplay.
function oneMember() {
  const context = suppliedVisit(fixture('captured-moving-not-settled'))
  const { w, task } = context, u = w.units[3], p = u.native
  w.units = [u]
  w.objectCells.objects.clear()
  w.objectCells.objects.set(u.id, p)
  task.members = [u.id]
  task.elapsed = 0
  Object.assign(p, { state: 10, substate: 0, speed: 0, commandPhase: 0,
    immediateCommand: 254, commandCursor: 0, commands: [247, 0, 0, 0, 0, 0, 0, 0] })
  Object.assign(w.buildingOrders.records[254], { model: 32, flags: 32 })
  Object.assign(w.buildingOrders.records[247], { model: 17, flags: 0 })
  return { ...context, u, p }
}

test('stopped active sermon settles; its current immediate command owns eligibility', () => {
  const stopped = oneMember()
  step(stopped, 2, 23)
  const moving = oneMember()
  moving.p.speed = 1
  step(moving, 2, 6)
  const cancelled = oneMember()
  cancelled.w.buildingOrders.records[254].flags |= 1
  step(cancelled, 2, 6)
  const masked = oneMember()
  masked.w.buildingOrders.records[254].model = 21
  step(masked, 2, 6)
})

test('state flags require zero speed and do not make stationary attack19 settled', () => {
  const idle = oneMember()
  idle.p.state = 17
  step(idle, 2, 23)
  const moving = oneMember()
  Object.assign(moving.p, { state: 17, speed: 1 })
  step(moving, 2, 6)
  const attack = oneMember()
  attack.w.buildingOrders.records[254].model = 19
  step(attack, 2, 6)
})

test('a later combat member still forces elapsed after an earlier unsettled member', () => {
  const context = suppliedVisit(fixture('captured-moving-not-settled'))
  const p = context.w.units[3].native
  p.state = 29
  step(context, 1801, 23)
})

test('the original airborne timeout bit is consumed from the registered owner', () => {
  const context = oneMember()
  context.p.flags2 |= 0x80000
  context.p.speed = 10
  step(context, 1801, 23)
})

test('unknown owned records stay unsettled; unreleased state33 retains sermon eligibility', () => {
  const missing = oneMember()
  missing.w.objectCells.objects.delete(missing.u.id)
  step(missing, 2, 6)
  const unknown = oneMember()
  delete unknown.p.state
  step(unknown, 2, 6)
  const unreleased = oneMember()
  Object.assign(unreleased.p, { state: 33, substate: 1 })
  step(unreleased, 2, 23)
})

test('unknown consumed order fields cannot admit a settled sermon', () => {
  const malformed = [
    c => { delete c.p.immediateCommand },
    c => { c.p.immediateCommand = 65536 },
    c => { c.p.immediateCommand = -1 },
    c => { c.p.immediateCommand = 0; delete c.p.commandCursor },
    c => { c.p.immediateCommand = 0; c.p.commandCursor = 256 },
    c => { c.p.immediateCommand = 0; delete c.p.commands },
    c => { c.p.immediateCommand = 0; c.p.commands[0] = 65536 },
    c => { delete c.w.buildingOrders.records[254].flags },
    c => { c.w.buildingOrders.records[254].flags = 256 },
    c => { delete c.w.buildingOrders.records[254].model },
    c => { c.w.buildingOrders.records[254].model = 256 },
  ]
  for (const mutate of malformed) {
    const context = oneMember()
    mutate(context)
    step(context, 2, 6)
  }
})

test('valid immediate sermons never consume an unknown shadowed queue', () => {
  const immediate = oneMember()
  delete immediate.p.commands
  delete immediate.p.commandCursor
  step(immediate, 2, 23)
  const queued = oneMember()
  queued.p.immediateCommand = 0
  step(queued, 2, 23)
})
