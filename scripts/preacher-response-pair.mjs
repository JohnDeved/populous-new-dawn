// One supplied-state call to the unchanged production response entry point.
// Run only through the reviewed native-pair launcher. No world turn is advanced.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { Session } from 'node:inspector'
import { fileURLToPath } from 'node:url'
import { createWorldState, addUnit } from '../app/world-state.ts'
import { startLiveCombatResponse } from '../app/live-building-combat.ts'

const fixture = JSON.parse(readFileSync(process.argv[2], 'utf8'))
assert.equal(fixture.case, 'moving-preacher-near-one-enemy-brave')
const poolBytes = readFileSync(new URL('../decomp/research/preacher-response-trigger/orders-input.bin', import.meta.url))
const w = createWorldState(fixture.world.mission)
w.units = []
w.buildings = []
w.fights = []
w.selected = []
w.nextId = 1
w.turn = fixture.world.turn
w.levelFlags2 = fixture.world.levelFlags2
w.manaWorld.gameFlags = fixture.world.gameFlags
w.outcome.alliances = [...fixture.world.alliances]
w.land.flags.fill(0)
w.land.categories.fill(fixture.world.category)
w.land.owners.fill(0)
w.land.buildingIds.fill(0)
w.objectCells.heads.fill(0)
w.objectCells.objects.clear()
w.pathfinding.people.clear()
w.buildingOrders.records = Array.from({ length: 800 }, (_, id) => {
  const offset = id * 10
  return {
    model: poolBytes.readUInt8(offset), flags: poolBytes.readUInt8(offset + 1),
    references: poolBytes.readUInt16LE(offset + 2), object: poolBytes.readUInt16LE(offset + 4),
    a: poolBytes.readUInt16LE(offset + 6), b: poolBytes.readUInt16LE(offset + 8),
  }
})
w.buildingOrders.cursor = fixture.pool.cursor
w.buildingOrders.active = fixture.pool.active
const people = fixture.people.map(row => {
  const u = addUnit(w, row.unit.team, row.unit.kind, row.unit)
  assert.equal(u.id, row.native.id)
  u.hp = row.unit.hp
  // Explicitly supplied post-registration state. No registrar runs after freezing.
  const p = structuredClone({ ...row.native, ...row.portExtras })
  u.native = p
  w.objectCells.objects.set(p.id, p)
  return p
})
w.objectCells.heads[fixture.world.cell] = fixture.world.cellHead
w.randomState = fixture.world.simulationRandom
w.cosmeticRandom.randomState = fixture.world.cosmeticRandom
assert.equal(people[0].flags2, 0x20000)
assert.equal(people[1].flags2, 0x20000)
assert.equal(people[0].cellNext, people[1].id)
assert.equal(people[1].cellPrevious, people[0].id)

function encodedPool() {
  const bytes = Buffer.alloc(8000)
  w.buildingOrders.records.forEach((o, id) => {
    bytes.writeUInt8(o.model, id * 10)
    bytes.writeUInt8(o.flags, id * 10 + 1)
    for (const [index, key] of ['references', 'object', 'a', 'b'].entries())
      bytes.writeUInt16LE(o[key], id * 10 + 2 + index * 2)
  })
  return bytes.toString('hex')
}
function snapshot() {
  return structuredClone({
    people, units: w.units, pool: w.buildingOrders,
    poolHex: encodedPool(), turn: w.turn, levelFlags2: w.levelFlags2,
    gameFlags: w.manaWorld.gameFlags, alliances: w.outcome.alliances,
    simulationRandom: w.randomState, cosmeticRandom: w.cosmeticRandom.randomState,
    registration: people.map((p, i) => ({
      id: p.id, retainedNative: w.units[i].native === p,
      registryIdentity: w.objectCells.objects.get(p.id) === p,
      cellNext: p.cellNext, cellPrevious: p.cellPrevious, flags2: p.flags2,
    })),
    cellHeads: Array.from(w.objectCells.heads),
    objectIds: [...w.objectCells.objects.keys()],
    pathOwners: [...w.pathfinding.people.keys()],
  })
}

const session = new Session()
session.connect()
const post = (method, params = {}) => new Promise((resolve, reject) =>
  session.post(method, params, (error, result) => error ? reject(error) : resolve(result)))
await post('Profiler.enable')
await post('Profiler.startPreciseCoverage', { callCount: true, detailed: true })
const before = snapshot()
assert.equal(before.poolHex, poolBytes.toString('hex'))
const result = startLiveCombatResponse(w, w.units[0]) // The sole production invocation.
const after = snapshot()
const coverage = await post('Profiler.takePreciseCoverage')
await post('Profiler.stopPreciseCoverage')
session.disconnect()
const appCoverage = coverage.result.filter(row => row.url.includes('/app/'))
const count = (file, name) => appCoverage
  .filter(row => row.url.endsWith(`/app/${file}`))
  .flatMap(row => row.functions)
  .filter(fn => fn.functionName === name)
  .reduce((total, fn) => total + fn.ranges[0].count, 0)
const expectedCalls = [
  ['live-building-combat.ts', 'startLiveCombatResponse', 1],
  ['live-combat.ts', 'allocateLiveCombatResponse', 1],
  ['live-combat.ts', 'startPreacherResponse', 1],
  ['melee-engagement.ts', 'automaticCombatScanner', 1],
  ['melee-engagement.ts', 'canAutoEngage', 1],
  ['melee-engagement.ts', 'engagementRange', 2],
  ['combat-targets.ts', 'detectCombatThreat', 1],
  ['person-orders.ts', 'allocatePersonOrder', 0],
  ['combat-orders.ts', 'shareCombatOrder', 0],
  ['live-people.ts', 'registerLivePerson', 0],
  ['live-resting.ts', 'cancelLiveResting', 0],
  ['live-pathfinding.ts', 'clearLivePath', 0],
  ['live-movement.ts', 'stepLivePreaching', 0],
  ['preacher-conversion.ts', 'stepPreachingOrder', 0],
  ['person-order-start.ts', 'startPersonOrders', 0],
  ['person-order-update.ts', 'stepPersonOrders', 0],
  ['world-turn.ts', 'tick', 0],
]
const calls = expectedCalls.map(([file, name, expected]) => ({ file, name, expected, actual: count(file, name) }))
const output = { kind: 'supplied-production-response', runner: fileURLToPath(import.meta.url),
  nodeVersion: process.version, result, before, after, calls, coverage: appCoverage }
// Emit complete observations even when a predicted assertion fails afterward.
console.log(JSON.stringify(output))
for (const row of calls) assert.equal(row.actual, row.expected, `${row.file}:${row.name}`)
assert.equal(result, false)
assert.deepEqual(after, before, 'The pinned production path is predicted to make no persistent writes')
