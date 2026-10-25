import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { addUnit, browserPosition } from '../app/model.ts'
import { createWorldState } from '../app/world-state.ts'
import { createLivePerson, registerLivePerson } from '../app/live-people.ts'
import { stepLivePreaching } from '../app/live-movement.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { terrainPointHeight } from '../app/native-terrain.ts'
import { stepObjectAnimation } from '../app/animation.ts'
import units from '../app/original-units.json' with { type: 'json' }
import fixture from './fixtures/preacher-terminal-turning-live.json' with { type: 'json' }

// Provisional native expectations require the separate native-result review before
// execution. This supplied fixture owns neither ordinary listener history nor the
// whole-world scheduler. Every measured preaching visit uses the unchanged caller.
function setup() {
  const w = createWorldState(3), s = fixture.supplies
  for (const cell of s.groundCorners) w.land.heights[cell] = s.groundHeight
  w.land.flags[s.centerCell] = s.centerFlags
  w.land.categories[s.centerCell] = s.centerCategory
  w.land.buildingIds[s.centerCell] = s.centerBuilding
  w.land.landFlags = 0
  w.landVersion = w.terrainVersion
  w.nextId = fixture.preacher.id
  const supplied = [
    { ...fixture.preacher, fields: fixture.ordinaryPerson },
    ...fixture.listeners,
  ]
  for (const record of supplied) {
    const u = addUnit(w, record.team, record.kind, browserPosition(record.fields))
    assert.equal(u.id, record.id)
    u.hp = record.hp
    u.native = createLivePerson(w, u)
    Object.assign(u.native, structuredClone(record.fields))
    if (record.commands) u.native.commands = [...record.commands]
    u.heading = Math.PI - u.native.angle * Math.PI / 1024
  }
  const preacher = w.units[0], p = preacher.native
  p.counter = s.storedCounter
  // These exact absent-value properties are assigned by physics/adoption. Supply
  // them before snapshotting, rather than masking arbitrary wrapper mutations.
  preacher.entry = undefined
  preacher.supportHeight = undefined
  const { id, ...order } = s.order
  Object.assign(w.buildingOrders.records[id], order)
  w.buildingOrders.cursor = id
  w.buildingOrders.active = 1
  for (const u of [...w.units].reverse()) registerLivePerson(w, u.native)
  Object.assign(w.manaWorld, { gameFlags: 0, levelFlags: 0, loadFlags: 0, playerTribe: 0 })
  w.manaTribes.forEach(tribe => { tribe.flags2 = 0 })
  w.levelFlags2 = 0
  w.turn = s.initialWorldTurn
  w.randomState = s.simulationRandom
  w.cosmeticRandom.randomState = s.cosmeticRandom
  return { w, preacher, p }
}

function assertOwners(w, preacher, p) {
  assert.deepEqual(w.units.map(u => u.id), fixture.supplies.listOrder)
  assert.equal(w.units.length, 6)
  assert.equal(preacher.native, p)
  assert.equal(w.objectCells.objects.size, 6)
  assert.equal(w.objectCells.heads[fixture.supplies.centerCell], p.id)
  assert.equal(w.objectCells.heads.filter(Boolean).length, 1)
  for (let i = 0; i < w.units.length; i++) {
    const u = w.units[i], person = u.native
    assert.equal(w.objectCells.objects.get(u.id), person)
    assert.equal(person.id, u.id)
    assert.equal(person.class, 1)
    assert.equal(person.model, i ? 2 : 4)
    assert.equal(person.physics, i ? 2 : 15)
    assert.equal(person.tribe, i ? 1 : 0)
    assert.equal(u.hp, i ? 50 : 55)
    assert.equal(person.life, u.hp * 20)
    assert.equal(u.inside, null)
    assert.equal(u.flight, undefined)
    assert.equal(person.vehicle, 0)
    assert.equal(person.cellPrevious, w.units[i - 1]?.id ?? 0)
    assert.equal(person.cellNext, w.units[i + 1]?.id ?? 0)
    assert.equal((person.y >>> 9) * 128 + (person.x >>> 9), fixture.supplies.centerCell)
    assert.equal(person.state, i ? 23 : 10)
    assert.equal(person.workTarget, i ? p.id : 0)
  }
  assert.equal(currentPersonOrder(w.buildingOrders, p), w.buildingOrders.records[26])
  assert.deepEqual(p.commands, [26, 0, 0, 0, 0, 0, 0, 0])
  assert.equal(p.immediateCommand, 0)
  assert.equal(p.commandStatus, 17)
  assert.equal(w.buildingOrders.records[26].flags, 0)
  assert.equal(w.pathfinding.people.size, 0)
  assert.equal(w.motionRoutes.active, 0)
  assert.deepEqual(preacher.path, [])
  assert.equal(terrainPointHeight(w.land, p), 155)
  assert.equal(p.h, 155)
}

function snapshot(w, p) {
  return {
    worldTurn: w.turn,
    person: structuredClone(p),
    nativeMappedFields: Object.fromEntries(fixture.nativeMappedFields.map(key => [key, p[key]])),
    nativeOnlyMaxLifeSupply: fixture.nativeOnlyPreacherMaxLifeSupply,
    listeners: structuredClone(w.units.slice(1)),
    order: { ...currentPersonOrder(w.buildingOrders, p) },
    simulationRandom: w.randomState,
    cosmeticRandom: w.cosmeticRandom.randomState,
  }
}

function saveReport(report) {
  if (!process.env.PND_PREACHER_TERMINAL_OUTPUT) return
  const root = fileURLToPath(new URL('../', import.meta.url))
  const path = resolve(root, process.env.PND_PREACHER_TERMINAL_OUTPUT)
  assert.ok(relative(root, path).startsWith('work/orchestration/'))
  assert.ok(path.endsWith('.json'))
  // Parent creates an isolated ignored directory. Never overwrite an old receipt.
  writeFileSync(path, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' })
}

test('real five-listener preaching caller preserves the original terminal turning cutoff', () => {
  assert.equal(fixture.provenance.expectationStatus, 'reviewed-native-result',
    'Promote provisional predictions only after the sibling native result is independently accepted')
  assert.ok(fixture.provenance.nativeResult)
  const { w, preacher, p } = setup()
  const report = { provenance: fixture.provenance, status: 'running', rows: [] }
  try {
    assertOwners(w, preacher, p)
    const observed = Object.fromEntries(Object.keys(fixture.ordinaryPerson).map(key => [key, p[key]]))
    assert.deepEqual({ ...observed, counter: fixture.ordinaryPerson.counter, cellNext: 0 },
      fixture.ordinaryPerson, 'Only the declared counter/topology override changes the full observed person')
    assert.equal(w.nextId, 3170)
    assert.equal(w.selected.length, 0)
    assert.equal(w.outcome.alliances[0] & 2, 0)
    assert.equal(p.speed, 0)
    assert.equal(p.assignment, 272)
    assert.equal(p.statusFlags, 2)
    assert.equal(p.animationMode, 0)
    const expected = structuredClone(w), expectedPerson = expected.units[0].native
    report.initial = snapshot(w, p)
    for (const target of fixture.expectedRows) {
      w.turn = expected.turn = target.worldTurn
      const row = { beforeWrapper: snapshot(w, p) }
      report.rows.push(row)
      // Actual physics owns the sole person-counter increment. No supplied
      // acquisition callback, private export, module mock or helper replay.
      stepLivePreaching(w, preacher)
      row.afterWrapper = snapshot(w, p)
      Object.assign(expectedPerson, {
        counter: target.counter, timer: target.timer, substate: target.substate,
        assignment: target.assignment, statusFlags: target.statusFlags,
        animationMode: target.animationMode,
      })
      if (target.substate === 4) expectedPerson.flags2 = (expectedPerson.flags2 | 0x40000000) >>> 0
      expected.randomState = target.simulationRandom
      assertOwners(w, preacher, p)
      assert.equal(p.counter, target.counter)
      assert.equal(p.statusFlags, 0, 'Five actual owned listeners must clear the count>4 status threshold')
      assert.equal(p.assignment, 336, 'The production acquisition result must set assignment64')
      if (target.substate !== 4) assert.deepEqual(w, expected, 'All first/second wrapper effects are exact')

      p.stamp = expectedPerson.stamp = w.turn
      row.beforeUpdater = snapshot(w, p)
      // Preacher only: a global animation pass would also mutate all listeners.
      stepObjectAnimation(p, { counter: w.turn, levelFlags: 0, levelFlags2: 0 }, units,
        () => { throw new Error('Unexpected footprint') })
      expectedPerson.f2 = target.postUpdaterF2
      row.afterUpdater = snapshot(w, p)

      // Keep the live world untouched. Defer exactly the two terminal outputs
      // under investigation so other world changes fail before the cutoff check.
      const guarded = structuredClone(w)
      guarded.randomState = expected.randomState
      guarded.units[0].native.animationMode = expectedPerson.animationMode
      assert.deepEqual(guarded, expected, 'No other person, listener, order, terrain or world mutation')
      assert.deepEqual({ animationMode: p.animationMode, simulationRandom: w.randomState },
        { animationMode: target.animationMode, simulationRandom: target.simulationRandom },
        'Original cutoff must skip terminal turning and its simulation RNG draw')
    }
    assert.equal(report.rows.length, 3)
    report.status = 'passed'
  } catch (error) {
    report.status = 'failed'
    report.error = { name: error.name, message: error.message.slice(0, 4000) }
    throw error
  } finally {
    saveReport(report)
  }
})
