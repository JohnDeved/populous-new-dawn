import assert from 'node:assert/strict'
import test from 'node:test'
import { pathToFileURL } from 'node:url'
import { loadSchoolGuardFixture, observeSchoolGuard } from './support/school-guard-trace.mjs'

// An optional exact baseline root runs identical public caller assertions;
// it never supplies a replacement owner or new candidate-only API/export.
const baseline = process.env.PND_SCHOOL_GUARD_BASELINE
const api = await loadSchoolGuardFixture(baseline ? pathToFileURL(`${baseline}/app/`) : undefined)
const {
  createStartedWorld,
  retainFixtureUnits,
  addBuilding,
  addUnit,
  command,
  tick,
  guardShaman,
  dismantleBuilding,
  selectBuildingOccupants,
  setSelection,
  currentPersonOrder,
  emptyPersonOrder,
  migrateCheckpoint,
  random,
  releasePersonOrderReference,
  allocatePersonOrder,
  attachPersonOrder,
  orderEffects,
  skipIntroduction,
} = api
const order = (w, p) => currentPersonOrder(w.buildingOrders, p)
const phase = p => [p.object, p.draw, p.f1, p.f2, p.stamp]
function until(w, predicate, limit = 500) {
  for (let i = 0; i < limit && !predicate(); i++) tick(w, 1 / 12)
  assert.ok(predicate(), 'real training reaches required admission')
}
function admitted(kind = 'firewarriorHut', count = 1) {
  const w = createStartedWorld(1)
  // Normal ticks do not run Scene's camera consumer. Use the same shipped
  // Skip-introduction caller as mission6-natural-marker-bridge, not flag writes.
  const introduction = { inputMask: w.inputMask, flags: w.flyby.flags, warmup: w.flyby.warmup }
  if (w.flyby.flags & 1 && w.flyby.warmup > 0)
    skipIntroduction({ world: w, flybyCamera: { x: 0, y: 0, angle: 0, zoom: 0 }, onChange() {} })
  assert.equal(w.inputMask, 0, `public introduction completion: ${JSON.stringify(introduction)}`)
  console.info(
    'school-introduction',
    JSON.stringify({
      before: introduction,
      after: { inputMask: w.inputMask, flags: w.flyby.flags, warmup: w.flyby.warmup },
    })
  )
  retainFixtureUnits(w, u => u.kind === 'shaman')
  w.terrain.fill(3)
  w.terrainVersion++
  w.manaWorld.gameFlags = 32 // Disclosed mechanics gate, not public natural-mana proof.
  const b = addBuilding(w, 'blue', kind, { x: -2, z: 32 }, true)
  const units = Array.from({ length: count }, (_, i) =>
    addUnit(w, 'blue', 'brave', { x: 7 + i, z: 33 })
  )
  setSelection(
    w,
    units.map(u => u.id)
  )
  assert.equal(command(w, b), true)
  until(w, () => units.every(u => u.inside === b.id && u.entry?.person.substate === 13))
  for (const u of units) {
    const p = u.entry.person
    assert.equal(p.state, 10)
    assert.equal(p.commandStatus, 8)
    assert.ok(p.flags2 & 0x800000)
    assert.equal(p.building, b.id)
    assert.equal(b.admission.occupants.filter(id => id === u.id).length, 1)
    assert.equal(order(w, p).model, 8)
  }
  setSelection(w, [])
  return { w, b, units, u: units[0], p: units[0].entry.person }
}
function selectPanel(w, b, u, group = false) {
  const before = {
    inputMask: w.inputMask,
    landFlags: w.land.landFlags,
    team: b.team,
    hp: b.hp,
    progress: b.progress,
    occupants: [...b.admission.occupants],
    inside: u.inside,
    unitHp: u.hp,
    flags4: u.entry.person.flags4,
    selectionFlags: u.entry.person.selectionFlags,
    selected: [...w.selected],
  }
  selectBuildingOccupants(w, b, u.id, group)
  assert.ok(
    w.selected.includes(u.id),
    `actual panel selection prerequisites: ${JSON.stringify(before)}`
  )
  assert.equal(!!(u.entry.person.flags3 & 0x10000000), !group)
}
function departed(w, b, u, p, inside, nextId) {
  assert.equal(
    w.units.find(unit => unit.id === u.id),
    u
  )
  assert.equal(u.native, p)
  assert.equal(u.entry, undefined)
  assert.equal(u.inside, null)
  assert.equal(p.building, null)
  assert.equal(p.flags2 & 0x800000, 0)
  assert.equal(p.renderFlags & 16, 0)
  assert.equal(b.admission.inside, inside - 1)
  assert.ok(!b.admission.occupants.includes(u.id))
  assert.equal(p.commandStatus, 30)
  assert.equal(order(w, p).model, 30)
  assert.equal(p.guardInputPending, undefined)
  assert.equal(u.guard, false)
  assert.equal(w.nextId, nextId)
  assert.equal(w.objectCells.objects.get(p.id), p)
  assert.ok(!w.pathfinding.people.has(p.id) || w.pathfinding.people.get(p.id) === p)
}
function oneVisit(trace, p) {
  for (const event of [
    'prepare',
    'physics',
    'departure',
    'remove-occupant',
    'restore-occupant',
    'guard',
    'adopt',
  ])
    assert.equal(trace.filter(row => row.event === event).length, 1, `${event} exactly once`)
  assert.equal(
    trace.filter(row => row.event === 'training').length,
    0,
    'never misdispatch command30 as training'
  )
  assert.ok(
    trace.every(row => row.owner === p),
    'same physical person throughout'
  )
  const index = name => trace.findIndex(row => row.event === name)
  assert.ok(index('prepare') < index('startup'))
  assert.ok(index('startup') < index('departure'))
  assert.ok(index('restore-occupant') < index('physics'))
  assert.ok(index('physics') < index('guard'))
  assert.ok(index('guard') < index('adopt'))
  // Each native speed helper draws once. This fixture has no other per-owner
  // RNG consumer between startup/Guard recovery and publication.
  const speeds = trace.filter(row => row.event === 'speed')
  assert.ok(speeds.length >= 2)
  const expected = { randomState: speeds[0].randomState }
  for (const row of speeds) {
    assert.equal(row.randomState, expected.randomState)
    random(expected)
  }
  assert.equal(trace.find(row => row.event === 'adopt').randomState, expected.randomState)
}
for (const group of [false, true])
  test(`actual admitted school panel ${group ? 'group' : 'single'} G retains one person and one visit`, () => {
    const { w, b, u, p } = admitted()
    selectPanel(w, b, u, group)
    const before = phase(p),
      old = order(w, p),
      counter = p.counter,
      inside = b.admission.inside,
      nextId = w.nextId,
      randomState = w.randomState
    guardShaman(w)
    assert.equal(u.entry?.person, p)
    assert.equal(u.native, null)
    assert.equal(u.inside, b.id)
    assert.equal(p.building, b.id)
    assert.equal(b.admission.inside, inside)
    assert.equal(old.references, 0)
    assert.equal(order(w, p).model, 30)
    assert.equal(p.guardInputPending, true)
    assert.deepEqual(phase(p), before)
    assert.equal(w.randomState, randomState)
    const trace = observeSchoolGuard(u.id, () => tick(w, 1 / 12))
    departed(w, b, u, p, inside, nextId)
    oneVisit(trace, p)
    assert.equal(p.counter, (counter + 1) & 255)
    const second = observeSchoolGuard(u.id, () => tick(w, 1 / 12))
    assert.equal(second.filter(row => row.event === 'prepare').length, 1)
    assert.equal(second.filter(row => row.event === 'physics').length, 1)
    assert.equal(p.counter, (counter + 2) & 255)
  })

test('reissue before adoption shares native producer without eager departure; post-adoption cancellation keeps its existing visit', () => {
  const { w, b, u, p } = admitted()
  selectPanel(w, b, u)
  guardShaman(w)
  const first = order(w, p)
  guardShaman(w)
  assert.equal(first.references, 0)
  assert.equal(order(w, p).model, 30)
  assert.equal(u.inside, b.id)
  assert.equal(u.entry?.person, p)
  setSelection(w, [])
  guardShaman(w)
  assert.equal(order(w, p).model, 30, 'no-selection does not cancel unadopted school')
  oneVisit(
    observeSchoolGuard(u.id, () => tick(w, 1 / 12)),
    p
  )
  guardShaman(w)
  assert.equal(order(w, p), undefined)
  assert.equal(p.guardInputPending, true)
  tick(w, 1 / 12)
  assert.equal(p.guardInputPending, undefined)
  assert.equal(u.native, p)
  assert.equal(u.inside, null)
})

test('protection after genuine producer retains occupancy and owner, then adopts on the first eligible visit', () => {
  const { w, b, u, p } = admitted()
  selectPanel(w, b, u)
  guardShaman(w)
  p.flags2 |= 0x100000 // Explicit mechanics control after real admission/producer.
  const before = b.admission.inside,
    counter = p.counter
  const trace = observeSchoolGuard(u.id, () => tick(w, 1 / 12))
  assert.equal(trace.filter(row => row.event === 'prepare').length, 1)
  assert.equal(trace.filter(row => row.event === 'physics').length, 1)
  assert.equal(trace.filter(row => row.event === 'departure').length, 0)
  assert.equal(u.native, null)
  assert.equal(u.entry?.person, p)
  assert.equal(u.inside, b.id)
  assert.equal(b.admission.inside, before)
  assert.equal(p.guardInputPending, true)
  assert.equal(p.counter, (counter + 1) & 255)
  p.flags2 &= ~0x100000
  oneVisit(
    observeSchoolGuard(u.id, () => tick(w, 1 / 12)),
    p
  )
})

function exhaust(w) {
  assert.equal(w.capacityPolicy.mode, 'classic', 'fixed-pool mechanics fixture')
  assert.equal(w.buildingOrders.scalable, undefined, 'retain valid classic checkpoint shape')
  for (let id = 1; id < w.buildingOrders.records.length; id++) {
    const record = w.buildingOrders.records[id]
    if (!record.references) Object.assign(record, emptyPersonOrder(), { model: 3, references: 1 })
  }
  w.buildingOrders.active = w.buildingOrders.records.slice(1).filter(o => o.references).length
}
test('native slot0 exhaustion reaches real occupied21, retains its next visit and accepts panel-selected repeat G', () => {
  const { w, b, u, p } = admitted()
  selectPanel(w, b, u)
  exhaust(w)
  const old = order(w, p),
    id = u.id,
    inside = b.admission.inside,
    nextId = w.nextId
  guardShaman(w)
  assert.equal(old.references, 0)
  assert.equal(order(w, p), undefined)
  assert.equal(p.guardInputPending, true)
  assert.equal(u.inside, b.id)
  const trace = observeSchoolGuard(id, () => tick(w, 1 / 12))
  assert.deepEqual(
    trace.filter(row => row.event === 'initialize').map(row => row.state),
    [10, 17, 21]
  )
  const speeds = trace.filter(row => row.event === 'speed')
  assert.ok(speeds.length >= 2, 'nested idle/occupied initialization draws are observed')
  const expectedRng = { randomState: speeds[0].randomState }
  for (const row of speeds) {
    assert.equal(row.randomState, expectedRng.randomState)
    random(expectedRng)
  }
  assert.equal(
    trace.filter(row => row.event === 'owner-rng-commit').at(-1).randomState,
    expectedRng.randomState
  )
  assert.equal(
    w.randomState,
    expectedRng.randomState,
    'committed nested owner RNG is not overwritten'
  )
  assert.equal(trace.filter(row => row.event === 'prepare').length, 1)
  assert.equal(trace.filter(row => row.event === 'physics').length, 1)
  assert.equal(trace.filter(row => row.event === 'departure').length, 0)
  assert.equal(u.entry?.person, p)
  assert.equal(u.native, null)
  assert.equal(p.state, 21)
  assert.equal(u.inside, b.id)
  assert.equal(b.admission.inside, inside)
  assert.equal(p.guardInputPending, undefined)
  assert.equal(w.nextId, nextId)
  const counter = p.counter
  tick(w, 1 / 12)
  assert.equal(p.state, 21)
  assert.equal(p.counter, (counter + 1) & 255)
  setSelection(w, [])
  selectPanel(w, b, u)
  guardShaman(w)
  const first = order(w, p)
  assert.equal(first.model, 30)
  // Release one explicitly synthetic pool filler before reissue: allocation is
  // before clear, so the first successful repeat alone consumes the freed slot.
  const filler = w.buildingOrders.records.find(o => o.references === 1 && o.model === 3)
  releasePersonOrderReference(w.buildingOrders, filler)
  guardShaman(w)
  assert.equal(first.references, 0)
  oneVisit(
    observeSchoolGuard(id, () => tick(w, 1 / 12)),
    p
  )
  departed(w, b, u, p, inside, nextId)
})

function semantic(w, id, building) {
  return structuredClone({
    unit: w.units.find(u => u.id === id),
    building: w.buildings.find(b => b.id === building),
    orders: w.buildingOrders,
    randomState: w.randomState,
    nextId: w.nextId,
    turn: w.turn,
  })
}
for (const boundary of ['before', 'pending', 'adopted', 'exhausted'])
  test(`current clone/migrate preserves ${boundary} occupied-G continuation (not public Save/Load)`, () => {
    const { w, b, u } = admitted()
    selectPanel(w, b, u)
    if (boundary === 'exhausted') exhaust(w)
    if (boundary !== 'before') guardShaman(w)
    if (boundary === 'adopted' || boundary === 'exhausted') tick(w, 1 / 12)
    const copy = migrateCheckpoint(structuredClone(w))
    const advance = world => {
      const target = world.units.find(v => v.id === u.id)
      if (boundary === 'before' || boundary === 'exhausted') guardShaman(world)
      for (let i = 0; i < 4; i++) tick(world, 1 / 12)
      const person = target.native ?? target.entry?.person
      assert.equal(person.id, u.id)
      assert.equal(world.objectCells.objects.get(u.id), person)
      return semantic(world, u.id, b.id)
    }
    assert.deepEqual(advance(copy), advance(w))
  })

// Conversion is intentionally still processed before the source person visit.
// Find its real funded boundary by normal ticks; never force occupied/state21,
// storedMana or trainingCost. Gate32 above is released before this search.
function conversionBoundary() {
  const { w, b, u } = admitted()
  w.manaWorld.gameFlags &= ~32
  for (let i = 0; i < 500; i++) {
    const before = structuredClone(w)
    tick(w, 1 / 12)
    if (!w.units.some(v => v.id === u.id && v.hp > 0))
      return { w: before, building: b.id, id: u.id }
  }
  assert.fail('normal funding did not reach conversion boundary within 500 ticks')
}
for (const tail of [false, true])
  test(`funded conversion retains existing replacement priority and cleans pending Guard${tail ? ' while inheriting real pooled tail' : ''}`, () => {
    const boundary = conversionBoundary(),
      w = boundary.w
    const u = w.units.find(v => v.id === boundary.id),
      p = u.entry.person,
      b = w.buildings.find(v => v.id === boundary.building),
      old = order(w, p)
    const control = structuredClone(w),
      existing = new Set(w.units.map(v => v.id))
    tick(control, 1 / 12)
    const normalCreated = control.units.filter(v => !existing.has(v.id) && v.hp > 0)
    assert.ok(normalCreated.length)
    selectPanel(w, b, u)
    guardShaman(w)
    const guard = order(w, p)
    assert.equal(guard.model, 30)
    assert.equal(old.references, 0)
    let tailId
    if (tail) {
      // Explicit queue mechanics control; actual occupancy/admission is untouched.
      tailId = allocatePersonOrder(w.buildingOrders)
      Object.assign(w.buildingOrders.records[tailId], {
        model: 3,
        flags: 0,
        a: p.x + 2048,
        b: p.y,
      })
      attachPersonOrder(w.buildingOrders, p, tailId, p.commandCursor + 1, orderEffects(w))
      assert.equal(w.buildingOrders.records[tailId].references, 1)
    }
    const trace = observeSchoolGuard(u.id, () => tick(w, 1 / 12))
    assert.equal(
      trace.filter(row => row.event === 'prepare').length,
      0,
      'conversion wins before old person visit'
    )
    assert.equal(p.class, 0)
    assert.equal(u.hp, 0)
    assert.equal(p.guardInputPending, undefined)
    assert.equal(guard.references, 0)
    assert.equal(old.references, 0)
    assert.ok(!p.commands.some(Boolean))
    assert.equal(p.immediateCommand, 0)
    const created = w.units.filter(v => !existing.has(v.id) && v.hp > 0)
    assert.deepEqual(
      created.map(v => [v.id, v.kind]),
      normalCreated.map(v => [v.id, v.kind])
    )
    for (const v of created) {
      const q = v.native ?? v.entry?.person
      assert.notEqual(q, p)
      assert.equal(q.guardInputPending, undefined)
      assert.equal(order(w, q).model, 3)
      assert.ok(!q.commands.some(id => id && w.buildingOrders.records[id] === guard))
      if (tail) assert.ok(q.commands.includes(tailId))
    }
    if (tail) assert.equal(w.buildingOrders.records[tailId].references, created.length)
    assert.equal(w.nextId, control.nextId)
  })

// Use the public occupant/G/dismantle producers after actual training admission.
// Pause is supplied mechanics state, not a browser key/focus or rendered proof.
for (const scenario of [
  { name: 'ordinary no-G control', count: 1, repeats: 0, group: false },
  { name: 'pending G', count: 1, repeats: 1, group: false },
  { name: 'repeated pending G', count: 1, repeats: 2, group: false },
  { name: 'mixed pending and ordinary occupants', count: 2, repeats: 1, group: false },
  { name: 'shared pending G occupants', count: 2, repeats: 1, group: true },
])
  test(`school dismantling supersedes ${scenario.name} without stealing the next visit`, () => {
    const { w, b, u, units } = admitted('camp', scenario.count),
      people = units.map(unit => unit.entry.person),
      nextId = w.nextId,
      turn = w.turn,
      retiredGuards = []
    w.paused = true
    selectPanel(w, b, u, scenario.group)
    assert.deepEqual(
      [...w.selected].sort((a, b) => a - b),
      (scenario.group ? units.map(unit => unit.id) : [u.id]).sort((a, b) => a - b)
    )
    for (let visit = 0; visit < scenario.repeats; visit++) {
      guardShaman(w)
      const guard = order(w, people[0])
      assert.equal(guard.model, 30)
      retiredGuards.push(guard)
      for (const person of people) {
        const selected = w.selected.includes(person.id)
        assert.equal(person.guardInputPending, selected ? true : undefined)
        assert.equal(order(w, person).model, selected ? 30 : 8)
      }
    }
    tick(w, 1 / 12)
    assert.equal(w.turn, turn, 'supplied pause retains the before-first-turn boundary')
    dismantleBuilding(w, b)
    assert.ok(b.admission.activity & 0x8000)
    assert.equal(b.admission.inside, 0)
    assert.ok(!b.admission.occupants.some(id => units.some(unit => unit.id === id)))
    const replacement = order(w, people[0])
    assert.equal(replacement.model, 10)
    assert.equal(replacement.a, b.id)
    assert.equal(replacement.references, units.length)
    for (const guard of retiredGuards) {
      assert.notEqual(guard, replacement)
      assert.equal(guard.references, 0, 'superseded Guard has no retained queue reference')
    }
    for (const [index, unit] of units.entries()) {
      const person = people[index]
      assert.equal(unit.entry?.person, person)
      assert.equal(unit.entry.orders, w.buildingOrders)
      assert.equal(unit.native, null)
      assert.equal(unit.inside, null)
      assert.equal(person.building, null)
      assert.equal(person.flags2 & 0x800000, 0)
      assert.equal(person.flags2 & 16, 16, 'ordinary departure retains native deferred preparation')
      assert.equal(person.guardInputPending, undefined, 'actual replacement retires only the G marker')
      assert.equal(order(w, person), replacement)
      assert.equal(person.commandStatus, 10)
      assert.equal(w.objectCells.objects.get(person.id), person)
    }
    tick(w, 1 / 12)
    assert.equal(w.turn, turn)
    w.paused = false
    const trace = observeSchoolGuard(u.id, () => tick(w, 1 / 12))
    assert.equal(w.turn, turn + 1)
    assert.equal(trace.filter(row => row.event === 'entry').length, 1)
    assert.equal(trace.filter(row => row.event === 'prepare').length, 1)
    assert.equal(trace.filter(row => row.event === 'adopt').length, 1)
    assert.equal(trace.filter(row => row.event === 'guard').length, 0)
    assert.equal(trace.filter(row => row.event === 'training').length, 0)
    assert.ok(trace.every(row => row.owner === people[0]))
    for (const [index, unit] of units.entries()) {
      const person = people[index]
      assert.equal(unit.entry?.person, person)
      assert.equal(unit.native, null)
      assert.equal(person.guardInputPending, undefined)
      assert.equal(order(w, person), replacement)
      assert.equal(person.commandStatus, 10)
      assert.ok(person.substate > 0, 'ordinary dismantling body advances from startup')
      assert.equal(w.objectCells.objects.get(person.id), person)
    }
    assert.equal(w.nextId, nextId)
    assert.equal(replacement.references, units.length)
    for (const guard of retiredGuards) assert.equal(guard.references, 0)
  })

test('failed dismantle allocation leaves the real pending school G for its normal next visit', () => {
  const { w, b, u, p } = admitted('camp')
  selectPanel(w, b, u)
  guardShaman(w)
  const guard = order(w, p)
  assert.equal(guard.model, 30)
  assert.equal(p.guardInputPending, true)
  // Explicit fixed-pool mechanics control after the actual public G producer.
  // Fill the old training slot too; no replacement allocation may succeed.
  exhaust(w)
  const before = {
    commands: [...p.commands],
    immediateCommand: p.immediateCommand,
    commandCursor: p.commandCursor,
    commandStatus: p.commandStatus,
    deferred: p.flags2 & 16,
    phase: phase(p),
    inside: b.admission.inside,
    occupants: [...b.admission.occupants],
    nextId: w.nextId,
    pool: structuredClone(w.buildingOrders),
  }
  dismantleBuilding(w, b)
  assert.ok(b.admission.activity & 0x8000, 'the UI toggle can change despite failed assignment')
  assert.equal(u.entry?.person, p)
  assert.equal(u.native, null)
  assert.equal(u.inside, b.id)
  assert.equal(p.building, b.id)
  assert.ok(p.flags2 & 0x800000)
  assert.equal(p.guardInputPending, true, 'no actual replacement means no marker retirement')
  assert.equal(order(w, p), guard)
  assert.equal(guard.references, 1)
  assert.deepEqual(p.commands, before.commands)
  assert.equal(p.immediateCommand, before.immediateCommand)
  assert.equal(p.commandCursor, before.commandCursor)
  assert.equal(p.commandStatus, before.commandStatus)
  assert.equal(p.flags2 & 16, before.deferred)
  assert.deepEqual(phase(p), before.phase)
  assert.deepEqual(w.buildingOrders, before.pool)
  assert.equal(b.admission.inside, before.inside)
  assert.deepEqual(b.admission.occupants, before.occupants)
  const trace = observeSchoolGuard(u.id, () => tick(w, 1 / 12))
  oneVisit(trace, p)
  departed(w, b, u, p, before.inside, before.nextId)
  assert.equal(order(w, p), guard)
  assert.equal(guard.references, 1)
})
