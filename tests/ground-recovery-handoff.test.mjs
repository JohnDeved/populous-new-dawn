import { createCampaignFixtureStore } from './support/campaign-fixture.mjs'
import assert from 'node:assert/strict'
import test from 'node:test'
import { browserPosition, tick } from '../app/model.ts'
import { createLivePerson, moveLivePerson, collisionWorld } from '../app/live-people.ts'
import { groundVelocity, recoverGroundObstacle } from '../app/person-motion.ts'
import { unsupportedGround, limitPersonVelocity } from '../app/person-physics.ts'
import { allocatePersonOrder } from '../app/person-orders.ts'
import { personStepCollision } from '../app/person-collision.ts'
import { terrainPointHeight } from '../app/native-terrain.ts'

// Supplied motion boundary on authored M22 terrain, derived from a separately
// retained ordinary failed-recovery witness. This is not an ordinary acquisition.
async function fixture() {
  const store = await createCampaignFixtureStore([22])
  assert.equal(store.startMission(22), true)
  const w = store.getWorld(),
    u = w.units.find(u => u.id === 89)
  Object.assign(u, browserPosition({ x: 10085, y: 33991 }))
  u.native = createLivePerson(w, u)
  const p = u.native
  Object.assign(p, {
    x: 10085,
    y: 33991,
    h: 334,
    heading: 1175,
    angle: 1175,
    speed: 60,
    flags2: 33692160,
    flags3: 264192,
    flags4: 537395456,
    physics: 18,
    turnAngle: 8960,
    turnY: 33536,
    slowTurn: 0,
    velocity: { x: 156, y: -192, z: 182 },
    state: 10,
    counter: 60,
    motionMode: 48,
    recoveryCounter: 0,
  })
  return { store, w, u, p }
}

function recovery(w, p) {
  const c = collisionWorld(w),
    probes = [],
    to = { x: p.x, y: p.y, h: p.h }
  const success = recoverGroundObstacle(
    structuredClone(p),
    to,
    false,
    (x, y) => terrainPointHeight(w.land, { x, y }),
    point => {
      const code = personStepCollision(c, p, point)
      probes.push(code)
      return code
    }
  )
  return { success, probes }
}

test('failed unsupported recovery retains limited ground velocity and defers physics', async () => {
  const { store, w, u, p } = await fixture()
  assert.deepEqual(recovery(w, p), { success: false, probes: Array(22).fill(3) })
  assert.equal(unsupportedGround(w.land, p, p.physics), true)
  moveLivePerson(w, u, p)
  assert.equal(u.flight, p)
  assert.equal(u.native, p)
  assert.equal(w.objectCells.objects.get(u.id), p)
  assert.deepEqual(p.velocity, { x: -2, y: 0, z: -3 })
  assert.deepEqual([p.x, p.y, p.h, p.counter], [10085, 33991, 334, 60])
  assert.ok(p.flags2 & 0x80000)
  await store.saveCheckpoint()
  assert.ok(store.loadCheckpoint())
  const restored = store.getWorld()
  const comparable = world => {
    const copy = structuredClone(world)
    for (const i of [0, 2]) copy.shrines[i].reward ??= 'mana'
    return copy
  }
  for (let n = 0; n < 30; n++) {
    const before = p.counter
    tick(w, 1 / 12)
    tick(restored, 1 / 12)
    assert.deepEqual(comparable(restored), comparable(w))
    if (u.flight === p) assert.equal(p.counter, (before + 1) & 255)
  }
})

for (const y of [-192, 65535, 10000])
  test(`failed recovery projects signed vertical velocity ${y}`, async () => {
    const { w, u, p } = await fixture()
    p.velocity.y = y
    const expected = { x: 0, y: Math.max(0, (y << 16) >> 16), z: 0 }
    groundVelocity(expected, p, p.speed, p.heading, (x, y) => terrainPointHeight(w.land, { x, y }))
    limitPersonVelocity(p.physics, expected)
    moveLivePerson(w, u, p)
    assert.equal(u.flight, p)
    assert.deepEqual(p.velocity, expected)
  })

test('supported failure, successful alternate recovery and turning do not enter flight', async () => {
  for (const boundary of ['supported', 'alternate', 'turning', 'stopped']) {
    const { w, u, p } = await fixture()
    if (boundary === 'supported') {
      w.land.heights.fill(334)
      w.land.flags.fill(4)
      w.land.walkMasks[0].fill(255)
      assert.equal(recovery(w, p).success, false)
      assert.equal(unsupportedGround(w.land, p, p.physics), false)
    } else if (boundary === 'alternate') {
      Object.assign(p, { x: 9573, y: 33479, h: 712, heading: 0, angle: 0 })
      assert.equal(recovery(w, p).success, true)
    } else if (boundary === 'turning') {
      p.flags2 = (p.flags2 & ~(0x800 | 0x200000)) | 0x1000 | 128
      p.turnAngle = (p.heading + 1024) & 2047
    } else p.speed = 0
    const velocity = { ...p.velocity }
    moveLivePerson(w, u, p)
    assert.equal(u.flight, undefined, boundary)
    assert.equal(p.flags2 & 0x80000, 0, boundary)
    assert.deepEqual(p.velocity, velocity, boundary)
  }
})

// Explicit queued-owner fixture; the recovery branch must not finish the order.
test('failed recovery preserves a supplied attached order and exact owner', async () => {
  const { w, u, p } = await fixture(),
    id = allocatePersonOrder(w.buildingOrders)
  assert.ok(id)
  Object.assign(w.buildingOrders.records[id], {
    model: 3,
    flags: 128,
    references: 1,
    a: 8960,
    b: 33536,
  })
  w.buildingOrders.active++
  p.commands[0] = id
  p.commandCursor = 0
  p.commandStatus = 3
  const before = structuredClone(w.buildingOrders)
  moveLivePerson(w, u, p)
  assert.equal(u.native, p)
  assert.equal(u.flight, p)
  assert.equal(w.objectCells.objects.get(u.id), p)
  assert.deepEqual(w.buildingOrders, before)
  assert.equal(p.commands[0], id)
  assert.equal(p.counter, 60)
})
