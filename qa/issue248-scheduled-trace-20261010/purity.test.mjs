import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { serialize, deserialize } from 'node:v8'
import { compileFunction } from 'node:vm'
import { stripTypeScriptTypes } from 'node:module'
import { collectDefenseTargets } from '../../app/computer-defense.ts'
import { objectsInCell } from '../../app/object-cells.ts'
import { currentPersonOrder } from '../../app/person-orders.ts'
import { buildingModel, buildingPose, buildingPosition } from '../../app/building-shapes.ts'
import { nativeUnitModel } from '../../app/unit-kinds.ts'
import { tribeForTeam } from '../../app/world-types.ts'

// No createWorld, tick, computer scheduler, runtime module import, or simulation.
// Evaluate only these exact source regions with their explicitly audited helpers.
const read = path => readFileSync(new URL(path, import.meta.url), 'utf8')
const region = (source, start, end) => {
  assert.equal(source.split(start).length, 2)
  assert.equal(source.split(end).length, 2)
  return source.slice(source.indexOf(start), source.indexOf(end))
}
const combat = region(read('../../app/live-combat.ts'),
  'export const nativePersonModel =', '// Adapt existing live ownership')
const combatPerson = compileFunction(stripTypeScriptTypes(combat.replace(/^export /gm, '')) +
  '\nreturn combatPerson;', ['nativeUnitModel', 'tribeForTeam'])(nativeUnitModel, tribeForTeam)
const response = region(read('../../app/computer-runtime.ts'),
  'const defensePerson =', 'function requestComputerDefense(')
const responseBindings = { combatPerson, buildingModel, buildingPose, buildingPosition,
  tribeForTeam, objectsInCell,
  nativeCellIndex: cell => (cell >>> 9) * 128 + ((cell & 254) >>> 1) }
const computerResponseWorld = compileFunction(stripTypeScriptTypes(response) +
  '\nreturn computerResponseWorld;', Object.keys(responseBindings))(...Object.values(responseBindings))
const observer = read('./observe.mjs')
const helpers = region(observer, 'function assertNeutral(', 'const computerMock = mock.module(')
const hash = bytes => createHash('sha256').update(bytes).digest('hex')

function suppliedWorld() {
  const person = (id, model, order, tribe = 2) => ({ id, class: 1, model, tribe,
    state: 10, flags2: 0x20000, flags3: 0, flags4: 0, computerAssignment: 1,
    x: 0, y: 0, h: 0, speed: 0, assignment: 0, vehicle: 0, disguise: 0,
    immediateCommand: 0, commandCursor: 0, commands: [order, 0, 0, 0, 0, 0, 0, 0],
    cellNext: 0, cellPrevious: 0 })
  const people = [person(1, 3, 1), person(2, 4, 2), person(3, 2, 0, 0), person(4, 3, 0)]
  const units = people.map((p, i) => ({ id: p.id, team: p.tribe === 2 ? 'yellow' : 'blue',
    kind: i === 1 ? 'preacher' : i === 2 ? 'brave' : 'warrior', hp: i === 3 ? 0 : 100,
    x: -8, z: -8, inside: null, work: null, path: [], native: p, nativeFlags7f: 0 }))
  units[1].fight = { motion: people[1], group: 0 }
  units[1].native = { ...people[1], commands: [1, 0, 0, 0, 0, 0, 0, 0] }
  const task = { flags: 1, type: 20, phase: 16, target: 0, members: [1, 2, 4, 999],
    entity: 5, retries: 0, damage: 0, extra: 20, requested: 4, retreatPercent: 25 }
  const heads = new Uint16Array(16384)
  heads[0] = 3
  return { turn: 100, randomState: 1, cosmeticRandom: { randomState: 2 }, units,
    buildings: [{ id: 5, kind: 'hut', team: 'blue', level: 1, hp: 100,
      progress: 1, angle: 0, anchor: { x: 0, y: 0 }, x: -8, z: -8 }],
    campaignAIs: [null, null, { cursor: 0, flags: 0, selectionOwner: 10, tasks: [task] }],
    outcome: { alliances: [0, 0, 0, 0] }, land: { flags: new Uint32Array(16384) },
    landVersion: 1, terrainVersion: 2,
    objectCells: { heads, objects: new Map(people.map(p => [p.id, p])) },
    buildingOrders: { records: [null, { model: 19, flags: 0, a: 0, b: 0x0808 },
      { model: 17, flags: 0, a: 128, b: 128 }] } }
}
function fixture(world, responseHelper = computerResponseWorld, worldByteLimit = 16 * 1024 * 1024) {
  const writes = new Map(), events = []
  const bindings = { world, runtime: { computerResponseWorld: responseHelper,
    computerAttackTargetsRemain() { throw new Error('Forbidden optional active world query') } },
    collectDefenseTargets, objectsInCell, currentPersonOrder, hash, serialize, structuredClone, assert,
    byteLimits: { world: worldByteLimit }, output: 'controlled-fixture',
    writeFileSync(path, bytes, options) { assert.equal(options.flag, 'wx'); assert.ok(!writes.has(path));
      writes.set(path, Buffer.from(bytes)) }, emit: event => events.push(event) }
  return { writes, events,
    run: () => compileFunction(helpers + '\nreturn snapshot(0);', Object.keys(bindings))(...Object.values(bindings)) }
}

test('detached actual collector/adapter/command observations preserve both input graphs', () => {
  const world = suppliedWorld(), before = serialize(world), f = fixture(world)
  const result = f.run()
  assert.ok(before.equals(serialize(world)))
  assert.equal(f.writes.size, 0)
  assert.deepEqual(result.registeredCellLists.people, [3])
  assert.ok(result.defenseAdapterLists.people.includes(3))
  assert.ok(result.defenseAdapterLists.buildings.includes(5))
  assert.deepEqual(result.members[1].owner, ['fight'])
  assert.equal(result.members[1].currentOrder.model, 17)
  assert.equal(result.members[1].oldPredicateOrder.model, 19)
  assert.equal(result.derivedOldAll19PayloadPredicate, true)
  assert.equal(result.members[2].hp, 0)
  assert.equal(result.members[3].missingUnit, true)
  assert.equal(world.landVersion, 1)
})

test('a throwing mutating detached helper is rejected with exact before/after buffers', () => {
  const world = suppliedWorld(), before = serialize(world)
  const f = fixture(world, observed => {
    observed.landVersion = 99
    throw new Error('Controlled helper failure after mutation')
  })
  assert.throws(f.run, /detached projection input changed during observation/)
  assert.ok(before.equals(serialize(world)))
  assert.equal(f.events[0].kind, 'observer-helper-error')
  assert.equal(f.events[0].message, 'Controlled helper failure after mutation')
  assert.equal(f.events[1].scope, 'detached projection input')
  assert.equal(deserialize(f.writes.get('controlled-fixture.guard-before.bin')).landVersion, 1)
  assert.equal(deserialize(f.writes.get('controlled-fixture.guard-after.bin')).landVersion, 99)
})

test('a captured live-world mutation is rejected without terrain exemptions', () => {
  const world = suppliedWorld()
  const f = fixture(world, observed => {
    world.land.flags[7] = 123
    return computerResponseWorld(observed, 2)
  })
  assert.throws(f.run, /live world changed during observation/)
  assert.equal(f.events[0].scope, 'live world')
  assert.equal(deserialize(f.writes.get('controlled-fixture.guard-before.bin')).land.flags[7], 0)
  assert.equal(deserialize(f.writes.get('controlled-fixture.guard-after.bin')).land.flags[7], 123)
})

test('oversized input stops before querying the candidate adapter', () => {
  let called = false
  const f = fixture(suppliedWorld(), () => { called = true }, 8)
  assert.throws(f.run, /Serialized world byte bound/)
  assert.equal(called, false)
  assert.equal(f.writes.size, 0)
})
