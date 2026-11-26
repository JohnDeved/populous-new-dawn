import assert from 'node:assert/strict'
import test from 'node:test'
import { addBuilding, addUnit, createWorld } from '../app/model.ts'
import { joinBattle } from '../app/combat-runtime.ts'
import { combatPerson, combatWorld } from '../app/live-combat.ts'
import { liveBuildingHasDefenders } from '../app/live-building-combat.ts'
import { stepCombatPursuit, beginCombatPursuit } from '../app/combat-pursuit.ts'
import { startCombatResponse } from '../app/combat-orders.ts'
import { createPersonOrderPool } from '../app/person-orders.ts'
import { attackCombatBuilding } from '../app/combat-building.ts'
import { buildingFootprintCells, buildingPose } from '../app/building-shapes.ts'
import { setCellObject, insertObjectIntoCell } from '../app/object-cells.ts'
import { ensureBuildingDamage } from '../app/building-damage.ts'

const no = () => {}
const target = { x: 10000, y: 10000, class: 1, flags2: 0, vehicle: 0 }
const move = extra => ({
  assignment: 0, flags2: 0, flags4: 0, flags3: 0, timer: 2, model: 2,
  state: 10, physics: 2, x: 0, y: 0, goalX: 10000, goalY: 10000,
  heading: 0, vehicle: 0, counter: 1, ...extra,
})
const rng = () => ({ randomState: 1 })

test('00439850 obstruction overrides arrival once without extending pursuit timer', () => {
  const p = move({ goalX: 0, goalY: 0, flags4: 0x10000000 })
  const close = { ...target, x: 0, y: 0 }
  const effects = { animation: no, destination: assert.fail }
  assert.equal(stepCombatPursuit(rng(), p, close, 8, effects), 3)
  assert.deepEqual([p.timer, p.flags4], [1, 0])
  assert.equal(stepCombatPursuit(rng(), p, close, 8, effects), 2)
  assert.equal(stepCombatPursuit(rng(), move({ goalX: 0, goalY: 0 }), close, 8, effects), 1)
})

test('00520300 approach sets infantry vehicle destination but ranged fire stops locally', () => {
  const order = { model: 21 }
  const events = []
  const point = { x: 40, y: 50 }
  const effects = { animation: no, destination: p => events.push(['stop', p.x, p.y]),
    canFire: () => true, commandPosition: o => { assert.equal(o, order); return point },
    vehicleDestination: (p, mode) => events.push(['vehicle', p.x, p.y, mode]) }
  const foot = move({ assignment: 8 })
  assert.equal(beginCombatPursuit(rng(), foot, order, target, effects), false)
  assert.equal(foot.assignment & 8, 0)
  assert.deepEqual(events.splice(0), [['vehicle', 40, 50, 1]])
  const firewarrior = move({ model: 6, physics: 6, assignment: 8 })
  assert.equal(beginCombatPursuit(rng(), firewarrior, order, target, effects), false)
  assert.deepEqual(events, [['stop', 0, 0]])
})

test('0051e150 an already-encountering defender cannot be allocated again', () => {
  const w = createWorld(10)
  const a = addUnit(w, 'blue', 'warrior', { x: 27, z: -5 })
  const b = addUnit(w, 'green', 'brave', { x: 27.1, z: -5 })
  const c = addUnit(w, 'blue', 'warrior', { x: 27.2, z: -5 })
  joinBattle(w, a, b)
  assert.equal(a.fight.group, b.fight.group)
  const existing = w.fights.find(f => f.id === b.fight.group)
  assert.deepEqual(existing.encounter, [a.id, b.id])
  assert.deepEqual([a.fight.motion.state, b.fight.motion.state], [29, 29])
  joinBattle(w, c, b)
  assert.ok(!c.fight)
  assert.deepEqual(existing.members, [a.id, b.id])
})

test('0051e300 damaged building footprint only recognizes hostile non-neutral people', () => {
  const w = createWorld(10)
  const b = addBuilding(w, 'green', 'hut', { x: 24, z: -5 }, false, { plan: true })
  assert.equal(ensureBuildingDamage(b).state, 1)
  const [cell] = buildingFootprintCells(buildingPose(b))
  const pos = { x: (cell & 127) << 9, y: (cell >> 7) << 9 }
  const put = (id, tribe, cls) => {
    const p = { id, tribe, class: cls, flags2: 0, cellNext: 0, cellPrevious: 0 }
    setCellObject(w.objectCells, id, p)
    insertObjectIntoCell(w.objectCells, p, pos)
  }
  const result = () => liveBuildingHasDefenders(w, b, 1)
  put(100001, 1, 1); put(100002, 255, 1); put(100003, 2, 2)
  assert.equal(result(), false)
  put(100004, 2, 1)
  assert.equal(result(), true)
})

test('0051e5e0 retains the threat if all authored response order slots are exhausted', () => {
  const w = createWorld(10)
  const a = addUnit(w, 'blue', 'warrior', { x: 27, z: -5 })
  addUnit(w, 'green', 'brave', { x: 27.1, z: -5 })
  const p = { ...combatPerson(a), h: 0, commands: [], commandCursor: 0,
    commandStatus: 0, immediateCommand: 0, state: 0 }
  const pool = createPersonOrderPool()
  for (const order of pool.records) order.references = 1
  const before = p.flags2
  const peers = () => assert.fail('no peer traversal without an order')
  const world = combatWorld(w, p, 4).world
  assert.equal(startCombatResponse(world, pool, p, peers, {}), 2)
  assert.deepEqual([p.flags2, p.immediateCommand], [before, 0])
})

test('004da170 building-entry reveal clears the native hidden bit and applies viewer mask once', () => {
  const w = createWorld(10)
  const b = addBuilding(w, 'green', 'hut', { x: 24, z: -5 })
  const building = { ...ensureBuildingDamage(b), ...buildingPose(b), class: 2, tribe: 2 }
  for (const [tribe, flags, render] of [[1, 0, 0x10], [3, 8, 0x10], [3, 0, 0x4000]]) {
    const context = { ...rng(), playerTribe: 1, tribes: [{}, { flags }] }
    const p = move({ tribe, flags4: 0x1000, renderFlags: 0x4010, assignment: 16, animationMode: 31 })
    const events = []
    const e = { animation: no, destination: no, directDestination: no, sound: (id, arg) => events.push([id, arg]) }
    assert.equal(attackCombatBuilding(context, p, building, e), 'continue')
    assert.deepEqual([p.flags4 & 0x1000, p.renderFlags, p.timer, events], [0, render, 63, [[53, 0]]])
    assert.equal(attackCombatBuilding(context, p, building, e), 'continue')
    assert.deepEqual(events, [[53, 0]])
  }
})
