// Supporting observer composition only. Scene request/dispatch and event trust
// are supplied; real selection helpers and the retained evidence assertions run.
// Actual Page/Scene/elapsed producer coverage belongs to the product contracts;
// the ordinary browser scenario supplies genuine input and rendering evidence.
import assert from 'node:assert/strict'
import test from 'node:test'
import { createNearbyFollowerWitness } from '../scripts/local-render/follower-nearby-witness.mjs'
import { assertNearbyEvidence } from '../scripts/local-render/follower-nearby-contract.mjs'
import { selectTaskFollowers } from '../app/hud-tasks.ts'

function fixture({ own = false, readError = null, installFailure = false, maxEvents = 128 } = {}) {
  const world = { castingTribes: [{ flags: 0x4000 }], turn: 12, selected: [] },
    people = [{ id: 1, model: 2, category: 2, x: 256, y: 256,
      flags4: 0x20000000, flags3: 0, selectionFlags: 0, assignment: 0 }],
    listeners = [], calls = [], result = {}, root = {
      addEventListener(type, callback, capture) {
        assert.equal(this, root)
        if (installFailure && listeners.length === 1) throw Error('Supplied listener installation failure')
        listeners.push({ type, callback, capture })
      },
      removeEventListener(type, callback, capture) {
        assert.equal(this, root)
        const index = listeners.findIndex(item => item.type === type && item.callback === callback && item.capture === capture)
        if (index >= 0) listeners.splice(index, 1)
      },
    }, store = { getWorld: () => world }
  let pending = null, current = true, thrown = null, now = 0
  const prototype = {
    isCurrent: () => current,
    requestNearbyFollowers() {
      assert.equal(this, scene)
      calls.push('request')
      if (thrown) throw thrown
      this.onSound(world.castingTribes[0].flags & 128 ? 111 : 110, 1, 0)
      if (pending !== null) return false
      pending = !(world.castingTribes[0].flags & 128)
      return true
    },
    onSound(...args) { assert.equal(this, scene); calls.push(['cue', ...args]); return result },
    dispatchNearbyFollowers(time) {
      assert.equal(this, scene)
      calls.push(['dispatch', time])
      if (pending !== null) {
        world.castingTribes[0].flags = (world.castingTribes[0].flags & ~128) | (pending ? 128 : 0)
        pending = null
      }
      return result
    },
    cancelNearbyFollowers() { assert.equal(this, scene); pending = null; return result },
    chooseFollowers(model, modifiers, focus, category) {
      assert.equal(this, scene)
      assert.equal(focus, false)
      selectTaskFollowers(people, model, category, { x: 0, y: 0 },
        modifiers.shiftKey ? 'all' : modifiers.ctrlKey ? 'five' : 'single',
        !!(world.castingTribes[0].flags & 128))
      world.selected = people.filter(person => person.selectionFlags & 128).map(person => person.id)
      return result
    },
  }, scene = Object.assign(Object.create(prototype), { world })
  if (own) Object.defineProperty(scene, 'requestNearbyFollowers', {
    value: prototype.requestNearbyFollowers, configurable: true, writable: true, enumerable: false,
  })
  const descriptor = Object.getOwnPropertyDescriptor(scene, 'requestNearbyFollowers'),
    read = () => {
      if (readError) throw readError
      return { flags: world.castingTribes[0].flags, nearby: !!(world.castingTribes[0].flags & 128),
        turn: world.turn, selected: [...world.selected], center: { x: 0, y: 0 },
        people: structuredClone(people), classPeople: structuredClone(people),
        focus: Array(8).fill(0), taskFocus: Array(48).fill(0), panels: [] }
    },
    api = createNearbyFollowerWitness({ scene, store, root, read, maxEvents })
  const fire = async (action, { type = 'pointerup', microtask = false, trusted = true } = {}) => {
    const button = { getAttribute: () => 'Nearby followers' },
      event = { type, isTrusted: trusted, eventPhase: 1, button: 0, detail: 1,
        target: { closest: () => button }, timeStamp: ++now }
    for (const item of [...listeners]) if (item.type === type && item.capture) item.callback(event)
    if (microtask) await Promise.resolve()
    event.eventPhase = 3
    const value = action()
    for (const item of [...listeners]) if (item.type === type && !item.capture) item.callback(event)
    event.eventPhase = 0
    return value
  }
  return { api, scene, world, store, root, prototype, descriptor, calls, listeners, result, fire,
    replace: () => { current = false }, failOriginal: error => { thrown = error } }
}

for (const own of [false, true]) test(`request, cue, deferred commit and actual selection; own descriptor ${own}`, async () => {
  const f = fixture({ own })
  f.api.mark('two-releases')
  assert.equal(await f.fire(() => f.scene.requestNearbyFollowers(), { microtask: true }), true)
  assert.equal(await f.fire(() => f.scene.requestNearbyFollowers()), false)
  assert.equal(f.world.castingTribes[0].flags, 0x4000)
  assert.equal(f.scene.dispatchNearbyFollowers(100), f.result)
  assert.equal(f.world.castingTribes[0].flags, 0x4080)
  assert.equal(await f.fire(() => f.scene.chooseFollowers(2, { shiftKey: false, ctrlKey: false }, false, 2)), f.result)
  assert.deepEqual(f.world.selected, [1])
  const summary = f.api.status()
  assert.equal(summary.requests, 2)
  assert.equal(summary.commits, 1)
  assert.equal(summary.selections, 1)
  assert.equal(typeof summary.records, 'number', 'Polling must not export records')
  const evidence = f.api.take()
  assertNearbyEvidence(evidence)
  assert.deepEqual(evidence.records.filter(row => row.kind === 'request').map(row => row.admitted), [true, false])
  assert.equal(f.listeners.length, 0)
  assert.deepEqual(Object.getOwnPropertyDescriptor(f.scene, 'requestNearbyFollowers'), f.descriptor)
  assert.equal(f.scene.dispatchNearbyFollowers, f.prototype.dispatchNearbyFollowers)
  assert.throws(() => f.api.take(), /already exported/)
  assert.deepEqual(f.api.close(), f.api.status())
})

test('observer failures never replace original result or exact thrown object', async () => {
  const token = Error('original request failure'), f = fixture()
  f.failOriginal(token)
  await assert.rejects(f.fire(() => f.scene.requestNearbyFollowers()), error => error === token)
  const evidence = f.api.take()
  assert.equal(evidence.records[0].threw, true)
  assert.throws(() => assertNearbyEvidence(evidence))
  const broken = fixture({ readError: Error('read-only snapshot failed') })
  assert.equal(await broken.fire(() => broken.scene.requestNearbyFollowers()), true)
  assert.ok(broken.api.take().errorCount > 0)
  assert.equal(broken.listeners.length, 0)
})

test('foreign method ownership is preserved and remaining resources still restore', () => {
  const f = fixture(), foreign = () => 'foreign'
  f.scene.requestNearbyFollowers = foreign
  const evidence = f.api.take()
  assert.equal(f.scene.requestNearbyFollowers, foreign)
  assert.equal(f.scene.dispatchNearbyFollowers, f.prototype.dispatchNearbyFollowers)
  assert.equal(f.listeners.length, 0)
  assert.match(evidence.errors[0], /ownership changed/)
})

test('captured listener remover survives replacement; installation failure rolls back', () => {
  const f = fixture()
  f.root.removeEventListener = () => { throw Error('foreign remover must not run') }
  assert.equal(f.api.take().errorCount, 0)
  assert.equal(f.listeners.length, 0)
  const broken = fixture({ installFailure: true })
  assert.equal(broken.api.status().closed, true)
  assert.equal(broken.listeners.length, 0)
  assert.equal(broken.scene.requestNearbyFollowers, broken.prototype.requestNearbyFollowers)
  assert.match(broken.api.take().errors[0], /installation failure/)
})

test('stale owners, absent trusted dispatch and overflow cannot claim ordinary proof', async () => {
  const stale = fixture()
  stale.replace()
  assert.throws(() => stale.api.snapshot(), /owner changed/)
  stale.api.close()
  const untrusted = fixture()
  await untrusted.fire(() => untrusted.scene.requestNearbyFollowers(), { trusted: false })
  assert.throws(() => assertNearbyEvidence(untrusted.api.take()))
  const absent = fixture()
  absent.scene.requestNearbyFollowers()
  assert.throws(() => assertNearbyEvidence(absent.api.take()))
  const bounded = fixture({ maxEvents: 1 })
  await bounded.fire(() => bounded.scene.requestNearbyFollowers())
  assert.equal(bounded.scene.dispatchNearbyFollowers(100), bounded.result)
  assert.equal(bounded.api.take().overflow, true)
})
