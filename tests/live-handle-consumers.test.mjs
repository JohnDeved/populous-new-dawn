import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { deserialize } from 'node:v8'
import test from 'node:test'
import { createWorldState, addUnit } from '../app/world-state.ts'
import { createLivePerson, registerLivePerson } from '../app/live-people.ts'
import { requestComputerPreacher, stepComputerTasks } from '../app/computer-runtime.ts'
import { withCampaignTribe } from '../app/campaign-runtime.ts'
import { addBuilding } from '../app/construction-runtime.ts'
import { processBuilderWork } from '../app/live-construction-runtime.ts'
import { BuilderTask } from '../app/building-workers.ts'
import { startLiveCombatResponse } from '../app/live-building-combat.ts'
import { currentPersonOrder } from '../app/person-orders.ts'

// Supplied allocation-boundary fixtures exercise live callers, not ordinary
// acquisition, mission completion, or changed native word-sized leaf defaults.
for (const id of [17, 65536, 287375]) {
  test(`live Preacher request retains selected owner ${id}`, () => {
    const w = createWorldState(3)
    w.nextId = id
    const u = addUnit(w, 'yellow', 'preacher', { x: 25, z: -41 })
    const p = (u.native = createLivePerson(w, u))
    p.state = 17
    p.flags3 |= 1
    registerLivePerson(w, p)
    w.ai.states |= 0x800
    const flags = p.flags3
    assert.equal(requestComputerPreacher(w, 2, 0x2020), true)
    const task = w.ai.tasks.find(task => task.flags & 1 && task.type === 11)
    assert.ok(task)
    assert.deepEqual([task.entity, task.target, task.phase], [id, 0x2020, 4])
    assert.equal(p.flags3, flags & ~1)
    assert.equal(u.native, p)
    assert.equal(w.objectCells.objects.get(id), p)
    assert.equal(requestComputerPreacher(w, 2, 0x2020), false)
    assert.equal(w.ai.tasks.filter(task => task.flags & 1 && task.type === 11).length, 1)
    w.ai.cursor = w.ai.tasks.indexOf(task)
    stepComputerTasks(w, 2)
    assert.equal(task.phase, 5)
    assert.equal(p.state, 14)
    assert.equal(u.native, p)
    assert.equal(w.objectCells.objects.get(id), p)
  })

  test(`live construction search retains builder owner ${id}`, () => {
    const w = createWorldState(1)
    const b = addBuilding(w, 'blue', 'hut', { x: 25, z: -41 }, false, { plan: true })
    w.nextId = id
    const u = addUnit(w, 'blue', 'brave', { x: 25, z: -41 })
    const p = (u.native = createLivePerson(w, u))
    registerLivePerson(w, p)
    u.work = b.id
    u.builder = { task: BuilderTask.Fetch, busy: 0, phase: 0, restart: true }
    processBuilderWork(w, u, b)
    const search = w.timberSearches.records[b.timberSearch]
    assert.ok(search.flags & 1)
    assert.equal(search.person, id)
    assert.equal(search.tribe, 0)
    assert.equal(u.builder.person, p)
    assert.equal(u.native, null)
    assert.equal(w.objectCells.objects.has(id), false)
    assert.equal(u.builder.phase, 17)
    const index = b.timberSearch
    w.turn = 1 // Re-enter the search without the eight-turn timber scan.
    processBuilderWork(w, u, b)
    assert.equal(b.timberSearch, index)
    assert.equal(w.timberSearches.records[index], search)
    assert.equal(search.person, id)
    assert.equal(w.timberSearches.active, 1)
  })
}

const response = JSON.parse(
  readFileSync(
    new URL('../decomp/research/preacher-response-trigger/fixture.json', import.meta.url)
  )
)
function preacherFixture(firstId = 1) {
  const w = createWorldState(3)
  w.nextId = firstId
  w.turn = 0
  w.levelFlags2 = 0
  w.manaWorld.gameFlags = 0
  w.outcome.alliances.fill(0)
  for (const field of ['categories', 'flags', 'buildingIds', 'owners']) w.land[field].fill(0)
  Object.assign(w.buildingOrders.records[1], { model: 3, references: 1, a: 0x2300, b: 0x2100 })
  w.buildingOrders.cursor = 2
  w.buildingOrders.active = 1
  for (const row of response.people) {
    const u = addUnit(w, row.unit.team, row.unit.kind, row.unit)
    u.hp = 50
    u.native = structuredClone({ ...row.native, ...row.portExtras, id: u.id })
    u.native.cellPrevious = row.native.cellPrevious ? firstId : 0
    u.native.cellNext = row.native.cellNext ? firstId + 1 : 0
    w.objectCells.objects.set(u.id, u.native)
  }
  w.objectCells.heads[2064] = firstId
  w.randomState = response.world.simulationRandom
  w.cosmeticRandom.randomState = response.world.cosmeticRandom
  return { w, source: w.units[0], enemy: w.units[1] }
}
const responseSnapshot = w =>
  structuredClone({
    units: w.units,
    orders: w.buildingOrders,
    registry: w.objectCells,
    paths: w.pathfinding.people,
    random: w.randomState,
    cosmetic: w.cosmeticRandom.randomState,
  })
function expectSermon({ w, source, enemy }) {
  const p = source.native,
    oldEnemy = structuredClone(enemy)
  const seeds = [w.randomState, w.cosmeticRandom.randomState]
  assert.equal(startLiveCombatResponse(w, source), true)
  assert.equal(source.native, p)
  assert.equal(w.objectCells.objects.get(source.id), p)
  assert.equal(currentPersonOrder(w.buildingOrders, p)?.model, 32)
  assert.equal(p.immediateCommand, 2)
  assert.deepEqual(p.commands, [1, 0, 0, 0, 0, 0, 0, 0])
  assert.equal(w.buildingOrders.records[1].references, 1)
  assert.deepEqual(enemy, oldEnemy)
  assert.deepEqual([w.randomState, w.cosmeticRandom.randomState], seeds)
}

for (const id of [1, 65536, 287375]) {
  test(`automatic Preacher fallback traverses exact live chain ${id}`, () => {
    const f = preacherFixture(id)
    assert.equal(f.source.native.cellNext, id + 1)
    expectSermon(f)
    assert.equal(f.source.native.cellNext, id + 1)
    assert.equal(f.enemy.native.cellPrevious, id)
  })
}

for (const handle of [37, 65536, 287375]) {
  test(`automatic Preacher reverse threat retains vehicle handle ${handle}`, () => {
    const f = preacherFixture()
    f.enemy.native.vehicle = handle
    expectSermon(f)
    assert.equal(f.enemy.native.vehicle, handle)
  })

  test(`automatic Preacher fallback recognizes occupied group handle ${handle}`, () => {
    const f = preacherFixture(),
      { w, enemy } = f
    const peer = addUnit(w, 'red', 'preacher', { x: 25.25, z: -41 })
    peer.hp = 50
    // Listening suppresses the generic primary hit. Its owned occupied-group
    // word then permits the separate brave's fallback threat, at either width.
    peer.native = structuredClone({
      ...enemy.native,
      id: peer.id,
      model: 4,
      state: 23,
      x: 0x2140,
      cellPrevious: 0,
      cellNext: 0,
      workFlags: handle,
    })
    registerLivePerson(w, peer.native)
    const before = structuredClone(peer)
    expectSermon(f)
    assert.deepEqual(peer, before)
  })

  test(`automatic Preacher fallback still rejects occupied enemy group ${handle}`, () => {
    const f = preacherFixture()
    f.enemy.native.workFlags = handle
    const before = responseSnapshot(f.w)
    assert.equal(startLiveCombatResponse(f.w, f.source), false)
    assert.deepEqual(responseSnapshot(f.w), before)
  })
}

for (const field of ['cellNext', 'workFlags', 'vehicle']) {
  test(`automatic Preacher fallback rejects unsafe ${field} without mutation`, () => {
    const f = preacherFixture(65536)
    const p = field === 'cellNext' ? f.source.native : f.enemy.native
    p[field] = Number.MAX_SAFE_INTEGER + 1
    const before = responseSnapshot(f.w)
    assert.equal(startLiveCombatResponse(f.w, f.source), false)
    assert.deepEqual(responseSnapshot(f.w), before)
  })
}

const releaseBytes = readFileSync(new URL('./fixtures/raid-state33-release.bin', import.meta.url))
assert.equal(
  createHash('sha256').update(releaseBytes).digest('hex'),
  '389ce3174fd613bb7841502ee737301a3e131451022ad8b7152f1613fa316562'
)
function releaseFixture(id) {
  const raw = deserialize(releaseBytes),
    w = createWorldState(2)
  Object.assign(w, {
    units: raw.people.map(p => p.unit),
    buildings: raw.buildings,
    objectCells: raw.objectCells,
    buildingOrders: raw.orders,
    ai: raw.ai,
    campaignAIs: raw.campaignAIs,
    activeCampaignTribe: raw.activeCampaignTribe,
    selected: raw.selected,
    manaWorld: raw.manaWorld,
    manaTribes: raw.manaTribes,
    castingTribes: raw.castingTribes,
    tribeCount: raw.tribeCount,
    levelFlags2: raw.levelFlags2,
    outcome: raw.outcome,
    drawMode: raw.drawMode,
    randomState: raw.random,
    turn: raw.turn,
    motionRoutes: raw.motionRoutes,
    pathfinding: raw.pathfinding,
  })
  w.cosmeticRandom.randomState = raw.cosmetic
  for (const cell of raw.cells)
    for (const [key, item] of Object.entries(cell.fields))
      if (item.present) w.land[key][cell.index] = item.value
  const ai = w.campaignAIs[3],
    task = ai.tasks[1],
    original = w.units[0]
  let u = original
  if (id !== original.id) {
    u = structuredClone(original)
    u.id = u.native.id = id
    u.native.cellPrevious = u.native.cellNext = 0
    u.native.flags2 &= ~0x20000
    w.units.push(u)
    registerLivePerson(w, u.native)
    // The existing low-ID owner keeps its own reference and is not admitted.
    w.buildingOrders.records[131].references++
  }
  Object.assign(task, { phase: 10, elapsed: 0, members: [id], target: 0 })
  ai.cursor = 1
  return { w, ai, task, u, p: u.native, original }
}

for (const id of [10, 65546, 287375]) {
  test(`ordinary attack release gate retains exact living owner ${id}`, () => {
    const { w, task, u, p, original } = releaseFixture(id)
    const before = structuredClone(original),
      hp = u.hp
    const order = w.buildingOrders.records[131],
      references = order.references
    withCampaignTribe(w, 3, () => stepComputerTasks(w, 3))
    assert.equal(task.phase, 23)
    assert.deepEqual(task.members, [])
    assert.equal(order.references, references - 1)
    assert.equal(p.state, 10)
    assert.equal(p.computerAssignment, 0)
    assert.equal(p.flags3 & 0x2000, 0)
    assert.equal(p.commands.includes(131), false)
    assert.equal(u.native, p)
    assert.equal(w.objectCells.objects.get(id), p)
    assert.equal(u.hp, hp)
    if (u !== original) {
      assert.deepEqual(original, before)
      assert.equal(w.objectCells.objects.get(original.id), original.native)
      assert.equal(original.native.commands.includes(131), true)
    }
  })
}

test('high-handle attack release still requires the exact registered owner identity', () => {
  const { w, task, u, p } = releaseFixture(65546)
  p.id = 10
  const before = structuredClone(u),
    references = w.buildingOrders.records[131].references
  withCampaignTribe(w, 3, () => stepComputerTasks(w, 3))
  assert.equal(task.phase, 10)
  assert.deepEqual(task.members, [65546])
  assert.equal(w.buildingOrders.records[131].references, references)
  assert.deepEqual(u, before)
})
