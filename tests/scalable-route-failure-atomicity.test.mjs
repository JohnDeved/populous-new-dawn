import assert from 'node:assert/strict'
import test from 'node:test'
import {
  attachPersonRoute, createMotionRoutes, releasePersonRoute,
  setDirectPersonDestination,
} from '../app/person-routes.ts'

// Damaged supplied ownership isolates rejection boundaries. This is not a
// naturally reached gameplay state, a save-loader test, or a capacity benchmark.
const person = () => ({
  motionGroup: 0, motionIndex: 7, goalX: 100, goalY: 200,
  destinationX: 300, destinationY: 400, turnAngle: 500, turnY: 600,
  flags2: 128,
})
const rejectsWithoutMutation = (routes, owner, action) => {
  const before = structuredClone({ routes, owner })
  const records = routes.records, references = routes.references
  assert.throws(action, /Invalid scalable motion-route count/)
  assert.strictEqual(routes.records, records)
  assert.strictEqual(routes.references, references)
  assert.deepEqual({ routes, owner }, before)
}

test('scalable attachment rejects active-count overflow before publishing ownership', () => {
  const routes = createMotionRoutes(true), owner = person()
  routes.active = Number.MAX_SAFE_INTEGER
  routes.last = 17
  routes.cursor = 23
  routes.records[109 + 2] = 5
  rejectsWithoutMutation(routes, owner, () => attachPersonRoute(routes, owner, 1))
})

test('last-owner release rejects active-count underflow without losing route ownership', () => {
  for (const reserved of [false, true]) {
    const routes = createMotionRoutes(true), owner = person()
    routes.records[109 + 2] = 1
    attachPersonRoute(routes, owner, 1, reserved)
    owner.motionIndex = 7
    routes.active = 0
    rejectsWithoutMutation(routes, owner, () => releasePersonRoute(routes, owner))
  }
})

test('direct destination cannot partially update goals when route release rejects ownership', () => {
  const routes = createMotionRoutes(true), owner = person()
  routes.records[109 + 2] = 1
  attachPersonRoute(routes, owner, 1)
  owner.motionIndex = 7
  routes.active = 0
  rejectsWithoutMutation(routes, owner,
    () => setDirectPersonDestination(routes, owner, { x: -1, y: 65538 }))
  // Repair only the supplied diagnostic input, then prove the same public
  // function's valid branch releases ownership and publishes wrapped goals.
  routes.active = 1
  setDirectPersonDestination(routes, owner, { x: -1, y: 65538 })
  assert.equal(routes.active, 0)
  assert.equal(routes.references[1], 0)
  assert.equal(routes.records[109 + 2], 0)
  assert.deepEqual(owner, {
    motionGroup: 0, motionIndex: 0, goalX: 65535, goalY: 2,
    destinationX: 65535, destinationY: 2, turnAngle: 65535, turnY: 2,
    flags2: 0x1000,
  })
})
