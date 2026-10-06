import assert from 'node:assert/strict'
import test from 'node:test'
import { createSermonTracker, chainPhaseObservers } from './observe.mjs'
import { withHidden } from './pixels.mjs'

const sample = (turn, phase = 'afterTurn', substate = 3, timer = turn) => ({
  phase, now: turn * 84, turn, sameActor: true, sameWorld: true, owner: 'native', hp: 20,
  kind: 'preacher', team: 'blue', inside: null, busy: false, status: 'playing', paused: false,
  speed: 1, visibility: 'visible', landFlags: 0, listeners: [], threats: [], site: { collision: 0 },
  order: { id: 41, model: 17, flags: 0 },
  person: { class: 1, model: 4, tribe: 0, vehicle: 0, disguise: 0, flags2: 0, flags3: 0x40000,
    flags4: 0, state: 10, commandStatus: 17, substate, timer, draw: 14, object: substate === 2 ? 160 : 168,
    speed: 0, statusFlags: 2, assignment: 0, counter: turn & 255, stamp: turn - (phase === 'afterTurn' ? 1 : 0) },
})
const enter = tracker => tracker.observe(sample(0, 'afterTurn', 2, 4))
const loop = tracker => { for (let n = 1; n <= 840; n++) tracker.observe(sample(n, 'afterTurn', n === 840 ? 4 : 3)) }

test('one complete adjacent loop requires a separately observed updated restart', () => {
  const tracker = createSermonTracker(); enter(tracker); loop(tracker)
  assert.equal(tracker.progress.status, 'observing')
  assert.equal(tracker.progress.opportunities, 52)
  tracker.observe(sample(841, 'afterTurn', 2, 840))
  tracker.observe(sample(842, 'afterTurn', 2, 3))
  tracker.observe(sample(843, 'afterTurn', 2, 2))
  tracker.observe(sample(844, 'afterTurn', 2, 1))
  tracker.observe(sample(845, 'afterTurn', 3, 0))
  tracker.observe(sample(846, 'afterTurn', 3, 1))
  assert.equal(tracker.progress.status, 'observing', 'afterTurn is still before the logical updater')
  const stale = sample(846, 'render-after-updater', 3, 1); stale.person.stamp--
  tracker.observe(stale); assert.equal(tracker.progress.status, 'observing')
  tracker.observe(sample(846, 'beforeTurn', 3, 1))
  assert.equal(tracker.progress.status, 'passed'); assert.equal(tracker.progress.terminalTurn, 840)
})

test('prearmed observation requires the real move and fails on a missed fresh entry', () => {
  const tracker = createSermonTracker({ requireMove: true })
  tracker.observe(sample(55)); assert.equal(tracker.progress.status, 'awaiting-move')
  const move = sample(56); move.order.model = 3; move.person.commandStatus = 3
  tracker.observe(move); assert.equal(tracker.progress.status, 'waiting-entry')
  tracker.observe(sample(57)); assert.equal(tracker.progress.status, 'failed')
  assert.match(tracker.progress.reason, /entry was missed/)
  const normal = createSermonTracker({ requireMove: true }); normal.observe(move)
  normal.observe(sample(57, 'afterTurn', 2, 4)); assert.equal(normal.progress.entryTurn, 57)
})

test('missing/duplicate controller visits, interruption and listener acquisition fail closed', () => {
  for (const repair of [row => { row.turn++ }, row => { row.turn-- }, row => { row.person.timer++ },
    row => { row.listeners = [7] }, row => { row.sameActor = false }, row => { row.order.id++ },
    row => { row.person.object = 176 }, row => { row.person.speed = 1 },
    row => { row.site.collision = 3 }, row => { row.threats = [{ id: 8 }] },
    row => { row.paused = true }, row => { row.owner = 'fight' }, row => { row.person.flags3 = 0 }]) {
    const tracker = createSermonTracker(); enter(tracker); tracker.observe(sample(1))
    const row = sample(2); repair(row); tracker.observe(row)
    assert.equal(tracker.progress.status, 'failed', JSON.stringify(row))
    assert.ok(tracker.rows.includes(row), 'Failure keeps the actual observation')
  }
})

test('finite ceilings preserve partial traces rather than accepting a timeout', () => {
  const visits = createSermonTracker({ maxVisits: 2 }); enter(visits)
  visits.observe(sample(1)); visits.observe(sample(2)); assert.equal(visits.progress.status, 'failed')
  const time = createSermonTracker(); enter(time)
  const row = sample(1); row.now = 120000; time.observe(row)
  assert.equal(time.progress.status, 'failed'); assert.equal(time.rows.length, 2)
})

test('passive chaining preserves exact call receiver, arguments, result and descriptors', () => {
  const calls = [], records = [], clock = {}, renderer = {}, scene = {}, camera = {}
  for (const name of ['beforeTurn', 'afterTurn']) clock[name] = function (arg) { calls.push([this, name, arg]); return name }
  renderer.render = function (...args) { calls.push([this, 'render', ...args]); return 71 }
  const descriptors = [Object.getOwnPropertyDescriptors(clock), Object.getOwnPropertyDescriptors(renderer)]
  const chain = chainPhaseObservers(clock, renderer, row => records.push(row), phase => ({ phase, turn: 1 }),
    args => args[0] === scene && args[1] === camera)
  assert.equal(clock.beforeTurn(23), 'beforeTurn'); assert.equal(clock.afterTurn(29), 'afterTurn')
  assert.equal(renderer.render(scene, camera), 71); renderer.render(scene, camera)
  assert.deepEqual(records.map(r => r.phase), ['beforeTurn', 'afterTurn', 'render-after-updater'])
  assert.equal(calls.length, 4); assert.equal(calls[0][0], clock); assert.equal(calls[2][0], renderer)
  assert.deepEqual(calls[2].slice(2), [scene, camera])
  assert.deepEqual(chain.finish(), { errors: [], restored: true })
  assert.deepEqual(Object.getOwnPropertyDescriptors(clock), descriptors[0])
  assert.deepEqual(Object.getOwnPropertyDescriptors(renderer), descriptors[1])
})

test('original exceptions survive, diagnostic errors do not interrupt runtime, replacements are not clobbered', () => {
  const error = Error('original'), clock = { afterTurn() { throw error } }, renderer = { render() { return 7 } }
  const chain = chainPhaseObservers(clock, renderer, () => { throw Error('diagnostic') },
    phase => ({ phase, turn: 1 }), () => true)
  assert.throws(() => clock.afterTurn(), candidate => candidate === error)
  assert.equal(renderer.render(), 7); assert.match(chain.errors[0], /diagnostic/)
  const replacement = () => 9; clock.beforeTurn = replacement
  assert.equal(chain.finish().restored, false); assert.equal(clock.beforeTurn, replacement)
})

test('pixel isolation restores each original visibility even if readback throws', () => {
  const objects = [{ visible: true }, { visible: false }], error = Error('readback')
  assert.throws(() => withHidden(objects, () => {
    assert.deepEqual(objects.map(x => x.visible), [false, false]); throw error
  }), candidate => candidate === error)
  assert.deepEqual(objects.map(x => x.visible), [true, false])
  assert.equal(withHidden(objects, () => 42), 42)
  assert.deepEqual(objects.map(x => x.visible), [true, false])
})
