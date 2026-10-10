// Supporting observer composition only. Scene request/dispatch and event trust
// are supplied; real selection helpers and the retained evidence assertions run.
// Actual Page/Scene/elapsed producer coverage belongs to the product contracts;
// the ordinary browser scenario supplies genuine input and rendering evidence.
import assert from 'node:assert/strict'
import test from 'node:test'
import { createNearbyFollowerWitness } from '../scripts/local-render/follower-nearby-witness.mjs'
import { assertNearbyEvidence } from '../scripts/local-render/follower-nearby-contract.mjs'
import { selectTaskFollowers, focusTaskFollower } from '../app/hud-tasks.ts'
import { browserPosition } from '../app/world-coordinates.ts'

function fixture({ own = false, readError = null, installFailure = false, removeFailure = false, maxEvents = 128, largeRead = false } = {}) {
  const world = { castingTribes: [{ flags: 0x4000 }], turn: 12, selected: [] },
    people = [{ id: 1, model: 2, category: 2, x: 256, y: 256,
      flags4: 0x20000000, flags3: 0, selectionFlags: 0, assignment: 0 }],
    focus = Array(8).fill(0), taskFocus = Array(48).fill(0), panels = [],
    listeners = [], calls = [], result = {}, root = {
      addEventListener(type, callback, capture) {
        assert.equal(this, root)
        if (installFailure && listeners.length === 1) throw Error('Supplied listener installation failure')
        listeners.push({ type, callback, capture })
      },
      removeEventListener(type, callback, capture) {
        assert.equal(this, root)
        if (removeFailure) throw Error(`Removal failed: ${type} ${capture}`)
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
    focus(point, options) { assert.equal(this, scene); calls.push(['focus', point, options]); return result },
    chooseFollowers(model, modifiers, focus, category) {
      assert.equal(this, scene)
      if (focus) {
        const index = model * 6 + category,
          id = focusTaskFollower(people, model, category, { x: 0, y: 0 }, taskFocus[index],
            modifiers.shiftKey, !!(world.castingTribes[0].flags & 128))
        taskFocus[index] = id
        if (id) { this.focus(browserPosition(people.find(p => p.id === id)), { animate: true }); panels.push(id) }
        return result
      }
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
        focus: [...focus], taskFocus: [...taskFocus], panels: [...panels],
        ...(largeRead ? { suppliedLargeValue: 'x'.repeat(2 * 1024 * 1024) } : {}) }
    },
    api = createNearbyFollowerWitness({ scene, store, root, read, maxEvents })
  const fire = async (action, { type = 'pointerup', microtask = false, trusted = true,
    label = 'Nearby followers', button = 0 } = {}) => {
    const targetButton = { getAttribute: () => label },
      event = { type, isTrusted: trusted, eventPhase: 1, button, detail: 1,
        target: { closest: () => targetButton }, timeStamp: ++now }
    for (const item of [...listeners]) if (item.type === type && item.capture) item.callback(event)
    if (microtask) await Promise.resolve()
    event.eventPhase = 3
    try {
      const value = action()
      for (const item of [...listeners]) if (item.type === type && !item.capture) item.callback(event)
      return value
    } finally { event.eventPhase = 0 }
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
  assert.equal(await f.fire(() => f.scene.chooseFollowers(2, { shiftKey: false, ctrlKey: false }, false, 2),
    { type: 'click', label: 'Idle Braves' }), f.result)
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
  assert.equal(broken.api.status().closed, true, 'Observation failure immediately detaches')
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
  assert.equal(bounded.scene.dispatchNearbyFollowers, bounded.prototype.dispatchNearbyFollowers)
  const large = fixture({ largeRead: true })
  assert.equal(await large.fire(() => large.scene.requestNearbyFollowers()), true)
  const evidence = large.api.take()
  assert.equal(evidence.closed, true)
  assert.equal(evidence.overflow, true)
  assert.ok(Buffer.byteLength(JSON.stringify(evidence)) <= evidence.maxBytes)
  const failed = fixture({ readError: Error('retained original observation error') })
  await failed.fire(() => failed.scene.requestNearbyFollowers())
  const failedEvidence = failed.api.take({ phases: ['entry'], nearby: true })
  assert.match(failedEvidence.errors[0], /retained original observation error/)
  assert.match(failedEvidence.errors.at(-1), /endpoint was not sealed/)
  assert.equal(failedEvidence.exported, true)
  assert.throws(() => assertNearbyEvidence(failedEvidence, { phases: ['entry'], nearby: true }))
  assert.throws(() => failed.api.take(), /already exported/)
})

test('wrong control/event/modifiers/focus recipient, detached commits and empty endpoints fail', async () => {
  const f = fixture()
  await f.fire(() => f.scene.requestNearbyFollowers())
  f.scene.dispatchNearbyFollowers(100)
  await f.fire(() => f.scene.chooseFollowers(2, { shiftKey: false, ctrlKey: false }, true, 2),
    { type: 'contextmenu', button: 2, label: 'Idle Braves' })
  const evidence = f.api.take({ phases: ['entry'], nearby: true })
  assertNearbyEvidence(evidence, { phases: ['entry'], nearby: true })
  const tamper = change => {
    const wrong = structuredClone(evidence)
    change(wrong)
    assert.throws(() => assertNearbyEvidence(wrong, { phases: ['entry'], nearby: true }))
  }
  tamper(value => { value.records[0].input.label = 'Planet overview' })
  tamper(value => { value.records[0].input.type = 'pointerdown' })
  tamper(value => { value.records[0].admitted = false })
  tamper(value => { value.records[1].phase = 'unrelated' })
  tamper(value => { value.records[2].input.shift = true })
  tamper(value => { value.records[2].input.type = 'click' })
  tamper(value => { value.records[2].focusCalls[0].point.x++ })
  tamper(value => { value.records[2].focusCalls = [] })
  tamper(value => { value.terminal.nearby = false })
  tamper(value => { value.records = []; value.requests = 0; value.commits = 0 })
})

test('synchronous endpoint sealing rejects unfinished/wrong phases and retains every bounded cleanup failure', async () => {
  const pending = fixture()
  await pending.fire(() => pending.scene.requestNearbyFollowers())
  const state = pending.api.seal({ phases: ['entry'], nearby: true })
  assert.equal(state.closed, true)
  assert.match(state.errors[0], /unfinished requests/)
  assert.equal(pending.listeners.length, 0)
  assert.equal(pending.scene.dispatchNearbyFollowers, pending.prototype.dispatchNearbyFollowers)
  const wrong = fixture()
  await wrong.fire(() => wrong.scene.requestNearbyFollowers())
  wrong.scene.dispatchNearbyFollowers(100)
  assert.match(wrong.api.seal({ phases: ['different'], nearby: true }).errors[0], /wrong phases/)
  const stale = fixture()
  stale.replace()
  assert.match(stale.api.seal({ phases: ['entry'], nearby: true }).errors[0], /owner changed/)
  const cleanup = fixture({ removeFailure: true })
  for (const name of ['requestNearbyFollowers', 'onSound', 'dispatchNearbyFollowers', 'chooseFollowers', 'focus', 'cancelNearbyFollowers'])
    cleanup.scene[name] = () => 'foreign owner'
  const evidence = cleanup.api.take()
  assert.equal(evidence.errorCount, 20)
  assert.equal(evidence.errors.length, 20)
  assert.ok(Buffer.byteLength(JSON.stringify(evidence)) <= evidence.maxBytes)
})
