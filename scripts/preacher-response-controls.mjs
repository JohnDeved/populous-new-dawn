// Exactly four supplied controls through the actual production response caller.
// The accepted positive native row and its historical runner remain separate.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { Session } from 'node:inspector'
import { createWorldState, addUnit } from '../app/world-state.ts'
import { startLiveCombatResponse } from '../app/live-building-combat.ts'

const packet = resolve(process.argv[2]), directory = dirname(packet)
const controls = JSON.parse(readFileSync(packet, 'utf8'))
assert.deepEqual(controls.cases.map(row => row.case), [
  'stationary-sermon', 'reverse-alliance', 'allocation-exhaustion', 'primary21-sharing',
])
const rows = [], session = new Session()
session.connect()
const post = (method, params = {}) => new Promise((accept, reject) =>
  session.post(method, params, (error, value) => error ? reject(error) : accept(value)))
await post('Profiler.enable')
await post('Profiler.startPreciseCoverage', { callCount: true, detailed: true })
for (const entry of controls.cases) {
  const fixturePath = resolve(directory, entry.fixture)
  const f = JSON.parse(readFileSync(fixturePath, 'utf8'))
  const rawPool = readFileSync(resolve(dirname(fixturePath), 'orders-input.bin'))
  const w = createWorldState(3)
  Object.assign(w, { nextId: 1, turn: 0, levelFlags2: 0, units: [], buildings: [], fights: [], selected: [] })
  w.manaWorld.gameFlags = 0
  w.outcome.alliances = [...f.world.alliances]
  w.land.categories.fill(0); w.land.flags.fill(0); w.land.owners.fill(0); w.land.buildingIds.fill(0)
  w.objectCells.heads.fill(0); w.objectCells.objects.clear(); w.pathfinding.people.clear()
  w.buildingOrders.records = Array.from({ length: 800 }, (_, id) => ({
    model: rawPool.readUInt8(id * 10), flags: rawPool.readUInt8(id * 10 + 1),
    ...Object.fromEntries(['references', 'object', 'a', 'b'].map((key, i) => [key, rawPool.readUInt16LE(id * 10 + 2 + i * 2)])),
  }))
  w.buildingOrders.cursor = f.pool.cursor
  w.buildingOrders.active = f.pool.active
  const people = f.people.map(row => {
    const unit = addUnit(w, row.unit.team, row.unit.kind, row.unit)
    unit.hp = row.unit.hp
    unit.native = structuredClone({ ...row.native, ...row.portExtras })
    w.objectCells.objects.set(unit.id, unit.native)
    return unit.native
  })
  w.objectCells.heads[f.world.cell] = f.world.cellHead
  w.randomState = f.world.simulationRandom
  w.cosmeticRandom.randomState = f.world.cosmeticRandom
  const snapshot = () => {
    const pool = Buffer.alloc(8000)
    for (const [id, order] of w.buildingOrders.records.entries()) {
      pool.writeUInt8(order.model, id * 10)
      pool.writeUInt8(order.flags, id * 10 + 1)
      for (const [index, key] of ['references', 'object', 'a', 'b'].entries()) pool.writeUInt16LE(order[key], id * 10 + 2 + index * 2)
    }
    return structuredClone({
      people, units: w.units, poolHex: pool.toString('hex'), cursor: w.buildingOrders.cursor,
      active: w.buildingOrders.active, turn: w.turn, simulationRandom: w.randomState,
      cosmeticRandom: w.cosmeticRandom.randomState, heads: [...w.objectCells.heads],
      identities: people.map((p, i) => [w.units[i].native === p, w.objectCells.objects.get(p.id) === p]),
      registryIds: [...w.objectCells.objects.keys()], pathOwners: [...w.pathfinding.people.keys()],
    })
  }
  const before = snapshot()
  // Retain and reset all setup counts at the actual caller boundary. Counts
  // left across stop/start must not be attributed to this response invocation.
  const setupCoverage = (await post('Profiler.takePreciseCoverage')).result
  const result = startLiveCombatResponse(w, w.units[0])
  const coverage = (await post('Profiler.takePreciseCoverage')).result.filter(row => row.url.includes('/app/'))
  const count = (file, name) => coverage.filter(row => row.url.endsWith(`/app/${file}`))
    .flatMap(row => row.functions).filter(fn => fn.functionName === name)
    .reduce((total, fn) => total + fn.ranges[0].count, 0)
  const calls = [
    ['live-building-combat.ts', 'startLiveCombatResponse', 1],
    ['live-combat.ts', 'allocateLiveCombatResponse', 1],
    ['live-combat.ts', 'startPreacherResponse', 1],
    ['person-orders.ts', 'allocatePersonOrder', ['allocation-exhaustion', 'primary21-sharing'].includes(f.case) ? 1 : 0],
    ['person-orders.ts', 'prepareCellOrder', f.case === 'primary21-sharing' ? 1 : 0],
    ['person-orders.ts', 'prepareMovementOrder', 0],
    ['person-orders.ts', 'attachPersonOrder', f.case === 'primary21-sharing' ? 2 : 0],
    ['combat-orders.ts', 'shareCombatOrder', f.case === 'primary21-sharing' ? 1 : 0],
    ['live-people.ts', 'registerLivePerson', f.case === 'primary21-sharing' ? 2 : 0],
    ['preacher-conversion.ts', 'stepPreachingOrder', 0],
    ['person-order-start.ts', 'startPersonOrders', 0],
    ['world-turn.ts', 'tick', 0],
  ].map(([file, name, expected]) => ({ file, name, expected, actual: count(file, name) }))
  rows.push({ case: f.case, before, after: snapshot(), result, calls, coverage, setupCoverage })
}
await post('Profiler.stopPreciseCoverage')
session.disconnect()
await new Promise((accept, reject) => process.stdout.write(
  JSON.stringify({ nodeVersion: process.version, rows }) + '\n',
  error => error ? reject(error) : accept()
))
for (const row of rows) for (const call of row.calls) assert.equal(call.actual, call.expected, `${row.case}:${call.name}`)
