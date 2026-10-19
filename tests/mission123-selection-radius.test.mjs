import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld } from '../app/world-initialization.ts'
import { tick } from '../app/world-turn.ts'
import { addBuilding } from '../app/construction-runtime.ts'
import { computerSelectionWorld, stepComputerTasks } from '../app/computer-runtime.ts'
import { createComputerQueue, requestConstruction } from '../app/computer.ts'
import { campaignCommand } from '../app/campaign-command-runtime.ts'
import { campaignPosition } from '../app/campaign-runtime.ts'
import { createLivePerson } from '../app/live-people.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { nativePosition } from '../app/world-terrain-runtime.ts'
import { browserPosition } from '../app/world-coordinates.ts'
import { buildingOutsidePoint, buildingPose, buildingPosition } from '../app/building-shapes.ts'
import { allocatePersonOrder, attachPersonOrder } from '../app/person-orders.ts'
import { orderEffects } from '../app/live-movement.ts'
import { missionScript } from '../app/mission-data.ts'
import rules from '../app/original-rules.json' with { type: 'json' }

// Supplied caller states prove this radius component, not an ordinary attack
// improvement or original object-allocation/cadence equivalence. In particular,
// the existing Tornado stage/wood/work adapter remains outside this claim.
const teams = ['blue', 'red', 'yellow', 'green']
const cellOf = p => ((p.x >>> 8) & 254) | (p.y & 0xfe00)
const row = w =>
  computerSelectionWorld(w, w.activeCampaignTribe).world.tribes[w.activeCampaignTribe]
const legacyRow = w => {
  const shaman = w.units.find(
    u => u.team === teams[w.activeCampaignTribe] && u.kind === 'shaman' && u.hp > 0
  )
  return {
    hasBase: !!(w.ai.flags & 0x100),
    base: w.ai.defencePosition,
    shaman: shaman ? cellOf(nativePosition(w, shaman)) : 0,
    radius: w.ai.defenceRadius,
  }
}
function knownWorld(level = 2, base = 0, radius = 0) {
  const w = createWorld(level)
  w.ai.constructionBase = base
  w.ai.constructionRadius = radius
  w.ai.constructionBuildings = []
  return w
}
function radiusVisit(w, expectedRadius) {
  w.turn = (51 - w.activeCampaignTribe) & 63
  const expected = structuredClone(w)
  expected.ai.constructionRadius = expectedRadius
  stepComputerTasks(w, w.activeCampaignTribe)
  // Includes the actual early-response invalidation prepass, tasks, cursor,
  // selection owner, orders, RNG, entities and every unrelated field.
  assert.deepEqual(w, expected)
}
function memberAt(w, x, y) {
  const b =
    w.buildings.find(building => building.team === teams[w.activeCampaignTribe]) ?? w.buildings[0]
  assert.ok(b)
  Object.assign(b, browserPosition({ x: x << 8, y: y << 8 }))
  return b
}

for (const level of [1, 2, 3])
  test(`Mission ${level} startup initializes zero radius and authored reference membership`, () => {
    const w = createWorld(level),
      tribe = w.activeCampaignTribe
    assert.equal(w.ai.constructionRadius, 0)
    const expected = w.buildings.filter(b => b.team === teams[tribe])
    assert.deepEqual(w.ai.constructionBuildings, expected)
    for (const b of expected) assert.ok(w.ai.constructionBuildings.includes(b))
    assert.equal(w.ai, w.campaignAIs[tribe])
  })

test('later missions and generic queues do not acquire supported-owner history', () => {
  const w = createWorld(4)
  assert.equal(Object.hasOwn(w.ai, 'constructionRadius'), false)
  assert.equal(Object.hasOwn(w.ai, 'constructionBuildings'), false)
  assert.equal(Object.hasOwn(createComputerQueue(), 'constructionRadius'), false)
  assert.deepEqual(row(w), legacyRow(w))
})

for (const [name, base, points, margin, old, expected] of [
  ['empty membership uses unsigned margin', 0, [], 258, 0, 2],
  ['established zero is present', 0, [[12, 16]], 3, 0, 13],
  ['odd base bytes are retained', 0x0101, [[2, 2]], 0, 0, 0],
  ['building high bytes are masked even', 0, [[7, 9]], 0, 0, 5],
  ['axes wrap before squaring', 0xfefe, [[2, 2]], 0, 0, 2],
  ['maximum squared distance then square root and halving', 0, [[128, 128]], 0, 0, 90],
  ['whole squared distance precedes axis halving', 0x0101, [[4, 4]], 0, 0, 2],
  ['full candidate is compared before byte storage', 0, [[128, 128]], 255, 250, 89],
  ['candidate 256 writes zero', 0, [[2, 0]], 255, 255, 0],
  ['equal candidate retains byte', 0, [[12, 16]], 3, 13, 13],
  ['smaller candidate retains byte', 0, [[12, 16]], 3, 17, 17],
])
  test(`actual radius visit: ${name}`, () => {
    const w = knownWorld(2, base, old)
    w.ai.attributes[14] = margin
    w.ai.constructionBuildings = points.map(([x, y]) => memberAt(w, x, y))
    radiusVisit(w, expected)
  })

test('radius maximum scans every saved member and retains valid response targets', () => {
  const w = knownWorld(),
    own = w.buildings.filter(b => b.team === 'green')
  assert.ok(own.length >= 3)
  for (const [b, x] of [
    [own[0], 40],
    [own[1], 80],
    [own[2], 20],
  ])
    Object.assign(b, browserPosition({ x: x << 8, y: 0 }))
  w.ai.constructionBuildings = own.slice(0, 3)
  w.ai.attributes[14] = 2
  const free = w.ai.tasks.filter(t => !(t.flags & 1))
  Object.assign(free[0], { flags: 1, type: 9, responseScan: { entity: own[0].id } })
  Object.assign(free[1], { flags: 1, type: 8, phase: 1, entity: own[1].id })
  radiusVisit(w, 42)
})

test('absence of a base skips accumulation without changing the radius visit', () => {
  const w = knownWorld()
  delete w.ai.constructionBase
  w.ai.constructionBuildings = [memberAt(w, 128, 128)]
  w.ai.attributes[14] = 255
  radiusVisit(w, 0)
})

test('radius consumes retained references with current coordinates even after removal', () => {
  const w = knownWorld(),
    b = memberAt(w, 12, 16)
  w.ai.constructionBuildings = [b]
  // Keep the old shape metadata deliberately different: the consumer reads the
  // stored model-origin coordinates, not a new pose calculation.
  Object.assign(b, browserPosition({ x: 80 << 8, y: 0 }))
  b.hp = 0
  w.buildings = w.buildings.filter(other => other !== b)
  assert.ok(!w.buildings.includes(b))
  assert.equal(w.ai.constructionBuildings[0], b)
  w.ai.attributes[14] = 2
  radiusVisit(w, 42)
})

test('actual object turn rebuild admits incomplete class 2, excludes plans and uses shallow references', () => {
  const w = createWorld(2),
    b = w.buildings.find(building => building.team === 'green' && building.kind === 'hut')
  b.progress = 0.5
  const plan = addBuilding(w, 'green', 'hut', b, false, { plan: true })
  const prison = addBuilding(w, 'green', 'prison', b)
  tick(w, 1 / 12)
  assert.ok(w.buildings.includes(b) && b.progress < 1)
  assert.ok(
    Array.isArray(w.ai.constructionBuildings),
    'the real object turn must capture membership'
  )
  assert.ok(
    w.ai.constructionBuildings.includes(b),
    'incomplete allocated building joins the snapshot'
  )
  assert.ok(!w.ai.constructionBuildings.includes(plan), 'preparation is a separate class-9 owner')
  assert.ok(!w.ai.constructionBuildings.includes(prison), 'model 19 is excluded')
  assert.ok(w.ai.constructionBuildings.every(member => member.team === 'green'))
  for (const member of w.ai.constructionBuildings) assert.ok(w.buildings.includes(member))
})

test('new allocation waits for the next completed object turn', () => {
  const w = knownWorld()
  tick(w, 1 / 12)
  const previous = w.ai.constructionBuildings
  const b = addBuilding(
    w,
    'green',
    'hut',
    w.buildings.find(building => building.team === 'green')
  )
  assert.ok(!previous.includes(b))
  assert.equal(w.ai.constructionBuildings, previous)
  tick(w, 1 / 12)
  assert.notEqual(w.ai.constructionBuildings, previous)
  assert.ok(w.ai.constructionBuildings.includes(b))
})

test('an actual Hut upgrade precedes the completed-object membership capture', () => {
  const w = createWorld(1),
    b = w.buildings.find(building => building.team === 'blue' && building.kind === 'hut')
  // Supplied ownership/resident/timber inputs reach the genuine upgrade body in
  // one object turn; all authored entities and startup orders remain present.
  b.team = 'red'
  const resident = w.units.find(u => u.team === 'red' && u.kind === 'brave')
  assert.equal(resident.native, null)
  Object.assign(resident, { inside: b.id, work: b.id, path: [] })
  b.builders = [resident.id, 0, 0, 0, 0, 0]
  b.counter = 15
  const [upgradeWork] = rules.hutUpgradeWork
  b.upgrade = upgradeWork
  b.timer = -20000
  const entrance = buildingOutsidePoint(buildingPose(b)),
    [wood] = w.trees
  Object.assign(wood, browserPosition(entrance), { model: 11, logs: 3 })
  tick(w, 1 / 12)
  assert.equal(b.level, 2, 'the real upgrade must occur before claiming its membership')
  assert.deepEqual({ x: b.x, z: b.z }, browserPosition(buildingPosition(buildingPose(b))))
  assert.ok(Array.isArray(w.ai.constructionBuildings), 'the upgrade turn must capture membership')
  assert.ok(w.ai.constructionBuildings.includes(b))
  assert.equal(
    w.ai.constructionBuildings.find(member => member.id === b.id),
    b
  )
})

function checkpoint(w, legacy = false) {
  const saved = structuredClone(w),
    tribe = saved.activeCampaignTribe
  if (legacy) {
    for (const u of saved.units) {
      if (u.team === teams[tribe]) u.team = 'red'
      for (const p of [u.native, u.flight]) if (p?.tribe === tribe) p.tribe = 1
    }
    for (const b of saved.buildings) if (b.team === teams[tribe]) b.team = 'red'
    for (const footprint of saved.buildingFootprints.values())
      if (footprint.tribe === tribe) footprint.tribe = 1
    delete saved.campaignAIs
    delete saved.activeCampaignTribe
    delete saved.spellScans
    delete saved.respawns
    delete saved.respawnPoints
  }
  return migrateCheckpoint(saved)
}

for (const legacy of [false, true])
  test(`${legacy ? 'legacy single-AI' : 'modern'} checkpoint keeps radius, shared and removed references`, () => {
    const w = knownWorld(),
      own = w.buildings.filter(b => b.team === 'green')
    w.ai.constructionRadius = 23
    w.ai.constructionBuildings = own.slice(0, 2)
    const [, removed] = own
    w.buildings = w.buildings.filter(b => b !== removed)
    const restored = checkpoint(w, legacy)
    assert.equal(restored.ai, restored.campaignAIs[3])
    assert.equal(restored.ai.constructionRadius, 23)
    assert.equal(
      restored.ai.constructionBuildings[0],
      restored.buildings.find(b => b.id === own[0].id)
    )
    assert.ok(!restored.buildings.includes(restored.ai.constructionBuildings[1]))
    Object.assign(restored.ai.constructionBuildings[1], browserPosition({ x: 120 << 8, y: 0 }))
    Object.assign(restored.ai.constructionBuildings[0], browserPosition({ x: 0, y: 0 }))
    restored.ai.attributes[14] = 2
    radiusVisit(restored, 62)
  })

for (const base of [undefined, 0, 0x8062])
  test(`missing legacy radius with base ${base} has an explicit compatibility boundary`, () => {
    const w = knownWorld()
    if (base === undefined) delete w.ai.constructionBase
    else w.ai.constructionBase = base
    delete w.ai.constructionRadius
    delete w.ai.constructionBuildings
    const restored = checkpoint(w)
    assert.equal(restored.ai.constructionRadius, base === undefined ? 0 : undefined)
    assert.equal(
      restored.ai.constructionBuildings,
      undefined,
      'Load cannot recreate prior membership'
    )
    assert.deepEqual(row(restored), legacyRow(restored))
    tick(restored, 1 / 12)
    assert.ok(Array.isArray(restored.ai.constructionBuildings))
    if (base !== undefined) {
      assert.equal(
        restored.ai.constructionRadius,
        undefined,
        'a rebuild cannot reconstruct a historical maximum'
      )
      assert.deepEqual(row(restored), legacyRow(restored))
    }
  })

for (const invalid of [null, -1, 256, 1.5, NaN, '7'])
  test(`malformed radius ${String(invalid)} stays unknown even without a base`, () => {
    const w = knownWorld()
    delete w.ai.constructionBase
    w.ai.constructionRadius = invalid
    const restored = checkpoint(w)
    assert.ok(Object.is(restored.ai.constructionRadius, invalid))
    assert.deepEqual(row(restored), legacyRow(restored))
    restored.ai.constructionBase = 0
    radiusVisit(restored, invalid)
  })

for (const invalid of [undefined, null, {}, [null], [{ x: NaN, z: 0 }]])
  test(`missing or malformed membership ${JSON.stringify(invalid)} retains the whole old adapter`, () => {
    const w = knownWorld(2, 0x8062, 0)
    w.ai.constructionBuildings = invalid
    w.ai.flags |= 0x100
    w.ai.defencePosition = 0x1234
    w.ai.defenceRadius = 37
    assert.deepEqual(row(w), legacyRow(w))
    radiusVisit(w, 0)
    tick(w, 1 / 12)
    assert.ok(Array.isArray(w.ai.constructionBuildings))
    assert.equal(row(w).base, 0x8062)
    assert.equal(row(w).radius, 0)
  })

for (const [name, base, extra, valid, beforeRadius, afterRadius] of [
  ['first base resets known byte', undefined, 0, true, 41, 0],
  ['first base resets malformed history', undefined, 0, true, null, 0],
  ['present zero preserves radius', 0, 0, true, 41, 41],
  ['present nonzero preserves radius', 0x8062, 0, true, 41, 41],
  ['exact request preserves radius', undefined, 1, true, 41, 41],
  ['missing plan preserves radius', undefined, 0, false, 41, 41],
])
  test(`actual phase-3 construction dispatcher: ${name}`, () => {
    const w = knownWorld(2, 0, beforeRadius)
    if (base === undefined) delete w.ai.constructionBase
    else w.ai.constructionBase = base
    assert.equal(requestConstruction(w.ai, 4, 0x8062), true)
    const task = w.ai.tasks.find(t => t.flags & 1 && t.type === 0),
      b = w.buildings.find(building => building.team === 'green' && building.kind === 'tower')
    Object.assign(task, { phase: 3, extra, entity: valid ? b.id : 0xffff })
    w.ai.cursor = w.ai.tasks.indexOf(task)
    w.turn = 1
    const rng = w.randomState,
      orders = structuredClone(w.buildingOrders)
    stepComputerTasks(w, 3)
    assert.equal(task.phase, 4)
    assert.equal(
      w.ai.constructionBase,
      base === undefined && !extra && valid ? cellOf(buildingOutsidePoint(buildingPose(b))) : base
    )
    assert.deepEqual(w.buildingOrders, orders)
    assert.equal(w.randomState, rng)
    assert.equal(w.ai.constructionRadius, afterRadius)
  })

function preacher({
  radius = 2,
  base = 0x6060,
  location = 0x6064,
  queued = false,
  orderModel = 17,
  disabled = false,
  busy = false,
  oldAdapter = false,
} = {}) {
  const w = knownWorld(3, 0, radius),
    u = w.units.find(unit => unit.team === 'yellow' && unit.kind === 'brave')
  if (base === undefined) delete w.ai.constructionBase
  else w.ai.constructionBase = base
  assert.equal(u.native, null)
  u.kind = 'preacher'
  Object.assign(u, browserPosition({ x: (location & 255) << 8, y: location & 0xff00 }))
  u.native = createLivePerson(w, u)
  Object.assign(u.native, {
    state: queued ? 33 : 10,
    flags3: 0,
    assignment: 0,
    commandCursor: 2,
    workFlags: busy ? 1 : 0,
  })
  assert.equal(
    rules.personStateFlags[u.native.state] & 8,
    0,
    'idle eligibility must not hide the radius predicate'
  )
  const order = allocatePersonOrder(w.buildingOrders)
  assert.ok(order)
  Object.assign(w.buildingOrders.records[order], {
    model: orderModel,
    flags: disabled ? 1 : 0,
    a: 0x7777,
  })
  attachPersonOrder(w.buildingOrders, u.native, order, queued ? 2 : -1, orderEffects(w))
  w.ai.states |= 0x800
  w.ai.flags &= ~0x100
  w.ai.defencePosition = 0x1010
  w.ai.defenceRadius = 0
  const shaman = w.units.find(unit => unit.team === 'yellow' && unit.kind === 'shaman')
  Object.assign(shaman, browserPosition({ x: 0x1000, y: 0x1000 }))
  Object.assign(shaman.native, { x: 0x1000, y: 0x1000 })
  if (oldAdapter) {
    delete w.ai.constructionRadius
    w.ai.flags |= 0x100
    w.ai.defencePosition = location
  }
  return { w, u }
}
function preach(fixture, expected) {
  const { w, u } = fixture,
    orders = structuredClone(w.buildingOrders),
    rng = w.randomState
  const script = { ...missionScript(3), fields: [[0, 3]] }
  campaignCommand(w, 1074, [0], script)
  const task = w.ai.tasks.find(t => t.flags & 1 && t.type === 11)
  assert.deepEqual(w.buildingOrders, orders)
  assert.equal(w.randomState, rng)
  assert.equal(
    task?.entity ?? null,
    expected ? u.id : null,
    'real command 1074 must consume the correct center and radius'
  )
}
for (const queued of [false, true])
  test(`command 1074 admits the inclusive native radius through ${queued ? 'queued' : 'immediate'} preaching order`, () =>
    preach(preacher({ queued }), true))
test('command 1074 rejects the next cell outside the native radius', () =>
  preach(preacher({ location: 0x6066 }), false))
test('command 1074 preserves present zero radius at the exact base', () =>
  preach(preacher({ radius: 0, location: 0x6060 }), true))
test('command 1074 preserves established base zero', () =>
  preach(preacher({ base: 0, location: 4 }), true))
test('command 1074 absent base uses the loaded origin despite a moved live Shaman', () => {
  const fixture = preacher()
  delete fixture.w.ai.constructionBase
  const cell = cellOf(nativePosition(fixture.w, campaignPosition(fixture.w, 'yellow')))
  Object.assign(fixture.u, browserPosition({ x: (cell & 255) << 8, y: cell & 0xff00 }))
  Object.assign(fixture.u.native, { x: (cell & 255) << 8, y: cell & 0xff00 })
  preach(fixture, true)
})
for (const options of [{ orderModel: 3 }, { disabled: true }, { busy: true }])
  test(`command 1074 retains exclusion ${JSON.stringify(options)}`, () =>
    preach(preacher(options), false))
test('command 1074 retains the complete old adapter when established radius history is missing', () =>
  preach(preacher({ oldAdapter: true }), true))
