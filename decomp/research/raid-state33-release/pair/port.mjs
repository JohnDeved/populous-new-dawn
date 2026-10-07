// Exactly one real dispatcher visit on reconstructed captured data. No world tick.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { deserialize, serialize } from 'node:v8'
import { Session } from 'node:inspector'
import { createHash } from 'node:crypto'
import { createWorldState } from '../../../../app/world-state.ts'
import { withCampaignTribe } from '../../../../app/campaign-runtime.ts'
import { stepComputerTasks } from '../../../../app/computer-runtime.ts'
import { computerPhase } from '../../../../app/computer.ts'

assert.equal(process.env.PND_STATE33_PAIR, 'approved-one-pair')
const bytes = readFileSync('decomp/research/raid-state33-release/captured-3227/snapshot.bin')
assert.equal(createHash('sha256').update(bytes).digest('hex'),
  '389ce3174fd613bb7841502ee737301a3e131451022ad8b7152f1613fa316562')
const raw = deserialize(bytes), w = createWorldState(2)
Object.assign(w, { units: raw.people.map(p => p.unit), buildings: raw.buildings,
  objectCells: raw.objectCells, buildingOrders: raw.orders, ai: raw.ai,
  campaignAIs: raw.campaignAIs, activeCampaignTribe: raw.activeCampaignTribe,
  selected: raw.selected, manaWorld: raw.manaWorld, manaTribes: raw.manaTribes,
  castingTribes: raw.castingTribes, tribeCount: raw.tribeCount, levelFlags2: raw.levelFlags2,
  outcome: raw.outcome, drawMode: raw.drawMode, randomState: raw.random, turn: raw.turn,
  motionRoutes: raw.motionRoutes, pathfinding: raw.pathfinding })
w.cosmeticRandom.randomState = raw.cosmetic
for (const cell of raw.cells) for (const [key, item] of Object.entries(cell.fields))
  if (item.present) w.land[key][cell.index] = item.value
const ai = w.campaignAIs[3]
assert.equal(ai.cursor, 2, 'Retain the real captured cursor before supplying the isolated visit')
ai.cursor = 1 // Explicit isolated-task dispatch projection, not a changed raw capture.
assert.equal(computerPhase(w.turn, 3), 'dispatch')
assert.deepEqual(ai.tasks[1].members, [10, 11])
for (const p of raw.people) {
  assert.equal(p.registered, w.objectCells.objects.get(p.id))
  assert.equal(p.unit.native, p.registered)
  assert.equal(p.registered.computerAssignment, 0)
  assert.equal(Object.hasOwn(p.unit, 'nativeFlags7f'), false)
}
const snapshot = () => structuredClone({
  units: w.units, buildings: w.buildings, objectCells: w.objectCells,
  pool: w.buildingOrders, campaignAIs: w.campaignAIs,
  selected: w.selected, motionRoutes: w.motionRoutes, pathfinding: w.pathfinding,
  random: w.randomState, cosmetic: w.cosmeticRandom.randomState,
  turn: w.turn, activeCampaignTribe: w.activeCampaignTribe, aiIsTribe3: w.ai === ai,
  owners: raw.people.map(p => ({ id: p.id, registeredIsNative:
    w.objectCells.objects.get(p.id) === p.unit.native, flags7fPresent: Object.hasOwn(p.unit, 'nativeFlags7f') })),
  cellInputs: raw.cells.map(cell => ({ index: cell.index, flags: w.land.flags[cell.index],
    buildingId: w.land.buildingIds[cell.index], head: w.objectCells.heads[cell.index] })),
})
const before = snapshot(), session = new Session()
session.connect()
const post = (method, params = {}) => new Promise((accept, reject) =>
  session.post(method, params, (error, value) => error ? reject(error) : accept(value)))
await post('Profiler.enable')
await post('Profiler.startPreciseCoverage', { callCount: true, detailed: true })
const value = withCampaignTribe(w, 3, () => stepComputerTasks(w, 3))
const coverage = (await post('Profiler.takePreciseCoverage')).result.filter(row => row.url.includes('/app/'))
await post('Profiler.stopPreciseCoverage')
session.disconnect()
const count = (file, name) => coverage.filter(row => row.url.endsWith('/app/' + file))
  .flatMap(row => row.functions).filter(fn => fn.functionName === name)
  .reduce((n, fn) => n + fn.ranges[0].count, 0)
const expectedCalls = [
  ['campaign-runtime.ts', 'withCampaignTribe', 1], ['computer-runtime.ts', 'stepComputerTasks', 1],
  ['computer.ts', 'dispatchComputerTask', 1], ['computer.ts', 'stepAttackTask', 1],
  ['computer-runtime.ts', 'computerAttackSettled', 1], ['computer-runtime.ts', 'computerAttackUnits', 1],
  ['computer-runtime.ts', 'castAttackTaskSpell', 0], ['person-orders.ts', 'clearPersonOrders', 0],
  ['live-people.ts', 'changeLivePersonState', 0], ['live-movement.ts', 'appendLiveOrders', 0],
  ['live-people.ts', 'createLivePerson', 0], ['world-turn.ts', 'tick', 0],
]
const calls = expectedCalls.map(([file, name, expected]) => ({ file, name, expected, actual: count(file, name) }))
const after = snapshot(), expected = structuredClone(before)
expected.campaignAIs[3].tasks[1].elapsed = 360
expected.campaignAIs[3].cursor = 2
const result = { kind: 'Actual frozen48a runtime visit; expected conservative release gap',
  node: process.version, semanticReturn: typeof value, supplied: { turn: 3227, cursor: 1, units: [10,11],
    staging: 'No shaman in supplied two-member world; unused by phase6', nativeFlags7f: 'absent', computerAssignment: 0 },
  beforeBase64: serialize(before).toString('base64'), afterBase64: serialize(after).toString('base64'),
  calls, coverage }
const output = JSON.stringify(result) + '\n'
assert.ok(Buffer.byteLength(output) < 2 * 1024 * 1024)
await new Promise((accept, reject) => process.stdout.write(output, error => error ? reject(error) : accept()))
assert.equal(typeof value, 'undefined')
for (const call of calls) assert.equal(call.actual, call.expected, call.name)
assert.deepEqual(after, expected, 'Only elapsed and explicit scheduler cursor may change in the frozen port')
