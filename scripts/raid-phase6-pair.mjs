// Two supplied task visits through the real live task dispatcher. No world tick.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { Session } from 'node:inspector'
import { createWorldState, addUnit } from '../app/world-state.ts'
import { createComputerQueue } from '../app/computer.ts'
import { withCampaignTribe } from '../app/campaign-runtime.ts'
import { stepComputerTasks } from '../app/computer-runtime.ts'

const packetPath = resolve(process.argv[2]), directory = dirname(packetPath)
const packet = JSON.parse(readFileSync(packetPath, 'utf8'))
assert.deepEqual(packet.cases.map(row => row.case), ['captured-combat-timeout', 'captured-moving-not-settled'])
const session = new Session(), rows = []
session.connect()
const post = (method, params = {}) => new Promise((accept, reject) =>
  session.post(method, params, (error, value) => error ? reject(error) : accept(value)))
await post('Profiler.enable')
await post('Profiler.startPreciseCoverage', { callCount: true, detailed: true })
for (const entry of packet.cases) {
  const fixturePath = resolve(directory, entry.fixture)
  const f = JSON.parse(readFileSync(fixturePath, 'utf8'))
  const rawPool = readFileSync(resolve(dirname(fixturePath), 'orders-input.bin'))
  const w = createWorldState(6)
  Object.assign(w, { units: [], buildings: [], fights: [], selected: [], turn: f.world.turn })
  w.objectCells.objects.clear(); w.objectCells.heads.fill(0); w.pathfinding.people.clear()
  const selected = []
  for (const person of f.people) {
    const captured = person.capturedUnit
    assert.equal(captured.flight, false)
    w.nextId = person.id
    const u = addUnit(w, captured.team, captured.kind, captured)
    Object.assign(u, { hp: captured.hp, x: captured.x, z: captured.z,
      target: captured.target, inside: captured.inside, work: captured.work,
      fighting: captured.fighting, flight: null, casting: null, lift: 0,
      path: structuredClone(captured.path) })
    // Preserve both recorded alternatives. The selected registry record may be
    // fight.motion while u.native still contains a different return command.
    const p = structuredClone(captured.p)
    u.native = captured.native ? structuredClone(captured.native) : null
    if (captured.fight) u.fight = { ...structuredClone(captured.fight), motion: p }
    else { u.fight = null; u.native = p }
    w.objectCells.objects.set(u.id, p)
    selected.push(p)
  }
  // Preserve actual captured chain IDs/links. Uncaptured neighbours are opaque
  // cell-index supplies, never live units or native task members in this proof.
  for (const person of f.people) {
    const { cell, chain } = person.capturedUnit
    assert.ok(chain.includes(person.id))
    w.objectCells.heads[cell] = chain[0]
    for (const [index, id] of chain.entries()) {
      if (!w.objectCells.objects.has(id)) w.objectCells.objects.set(id, {
        id, opaqueCellNeighbor: true, x: (cell % 128) * 512 + 256,
        y: Math.floor(cell / 128) * 512 + 256, h: 0, flags2: 0x20000,
        flags3: 0, cellPrevious: chain[index - 1] ?? 0,
        cellNext: chain[index + 1] ?? 0, displacement: { x: 0, y: 0, h: 0 },
      })
      const p = w.objectCells.objects.get(id)
      assert.equal(p.cellPrevious, chain[index - 1] ?? 0)
      assert.equal(p.cellNext, chain[index + 1] ?? 0)
      assert.equal((p.y >> 9) * 128 + (p.x >> 9), cell)
      assert.ok(p.flags2 & 0x20000)
    }
  }
  w.buildingOrders.records = Array.from({ length: 800 }, (_, id) => ({
    model: rawPool.readUInt8(id * 10), flags: rawPool.readUInt8(id * 10 + 1),
    ...Object.fromEntries(['references', 'object', 'a', 'b'].map((key, index) =>
      [key, rawPool.readUInt16LE(id * 10 + 2 + index * 2)])),
  }))
  w.buildingOrders.cursor = 1
  w.buildingOrders.active = Object.keys(f.pool.knownOrders).length
  Object.assign(w.campaignAIs[2], createComputerQueue())
  const ai = w.campaignAIs[2]
  ai.tasks[0] = structuredClone(f.task.observed)
  ai.tasks[1].flags = 1 // Explicit opaque active-count carrier, never selected.
  ai.cursor = 0
  w.randomState = f.world.simulationRandom
  w.cosmeticRandom.randomState = f.world.cosmeticRandom
  const encodedPool = () => {
    const raw = Buffer.alloc(8000)
    for (const [id, order] of w.buildingOrders.records.entries()) {
      raw.writeUInt8(order.model, id * 10); raw.writeUInt8(order.flags, id * 10 + 1)
      for (const [index, key] of ['references', 'object', 'a', 'b'].entries())
        raw.writeUInt16LE(order[key], id * 10 + 2 + index * 2)
    }
    return raw.toString('hex')
  }
  const snapshot = () => structuredClone({
    tasks: ai.tasks, cursor: ai.cursor, selected, units: w.units,
    registryIdentities: selected.map((p, i) => w.objectCells.objects.get(w.units[i].id) === p),
    nativeIdentities: selected.map((p, i) => w.units[i].native === p),
    fightIdentities: selected.map((p, i) => w.units[i].fight?.motion === p),
    capturedCellMetadata: f.people.map(p => ({ id: p.id, cell: p.capturedUnit.cell,
      chain: p.capturedUnit.chain, inChain: p.capturedUnit.inChain })),
    heads: [...w.objectCells.heads], registry: [...w.objectCells.objects],
    pathOwners: [...w.pathfinding.people.keys()], poolHex: encodedPool(),
    poolCursor: w.buildingOrders.cursor, poolActive: w.buildingOrders.active,
    simulationRandom: w.randomState, cosmeticRandom: w.cosmeticRandom.randomState,
    turn: w.turn, activeCampaignTribe: w.activeCampaignTribe,
    restoredAIIdentity: w.ai !== ai,
  })
  const before = snapshot()
  const setupCoverage = (await post('Profiler.takePreciseCoverage')).result
  const value = withCampaignTribe(w, 2, () => stepComputerTasks(w, 2))
  const coverage = (await post('Profiler.takePreciseCoverage')).result.filter(row => row.url.includes('/app/'))
  const count = (file, name) => coverage.filter(row => row.url.endsWith(`/app/${file}`))
    .flatMap(row => row.functions).filter(fn => fn.functionName === name)
    .reduce((total, fn) => total + fn.ranges[0].count, 0)
  const calls = [
    ['campaign-runtime.ts', 'withCampaignTribe', 1],
    ['computer-runtime.ts', 'stepComputerTasks', 1],
    ['computer.ts', 'dispatchComputerTask', 1],
    ['computer.ts', 'stepAttackTask', 1],
    ['computer-runtime.ts', 'computerAttackUnits', 1],
    ['computer-runtime.ts', 'computerAttackReady', f.captureTurn === 8370 ? 1 : 4],
    ['computer-runtime.ts', 'castAttackTaskSpell', 0],
    ['live-movement.ts', 'appendLiveOrders', 0],
    ['live-people.ts', 'createLivePerson', 0],
    ['live-people.ts', 'registerLivePerson', 0],
    ['live-building-combat.ts', 'startLiveCombatResponse', 0],
    ['person-orders.ts', 'currentPersonOrder', f.captureTurn === 8370 ? 0 : 4],
    ['person-order-start.ts', 'startPersonOrders', 0],
    ['preacher-conversion.ts', 'stepPreachingOrder', 0],
    ['world-turn.ts', 'tick', 0],
  ].map(([file, name, expected]) => ({ file, name, expected, actual: count(file, name) }))
  rows.push({ case: f.case, before, after: snapshot(), semanticReturn: typeof value,
    calls, coverage, setupCoverage })
}
await post('Profiler.stopPreciseCoverage')
session.disconnect()
await new Promise((accept, reject) => process.stdout.write(JSON.stringify({ nodeVersion: process.version, rows }) + '\n',
  error => error ? reject(error) : accept()))
for (const row of rows) for (const call of row.calls)
  assert.equal(call.actual, call.expected, `${row.case}:${call.name}`)
