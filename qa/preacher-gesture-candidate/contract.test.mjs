import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createCandidateTracker, requireUpdatedPhase } from './observe.mjs'
import { compareBodyPixels } from './pixels.mjs'
import { gestureProjection, requireSavedGesture, requireSameGestureCheckpoint } from './checkpoint.mjs'
import { requireGesturePause } from './pause-input.mjs'

const sample = (turn, person, phase = 'afterTurn') => ({ turn, now: turn * 84, phase,
  sameActor: true, sameWorld: true, owner: 'native', hp: 30, kind: 'preacher', team: 'blue', inside: null,
  busy: false, status: 'playing', paused: false, speed: 1, visibility: 'visible', landFlags: 0,
  listeners: [], threats: [], site: { collision: 0 }, order: { id: 7, model: 17, flags: 0 },
  rng: { simulation: turn, cosmetic: 1 }, person: { class: 1, model: 4, tribe: 0, vehicle: 0, disguise: 0,
    flags2: 0, flags3: 0x40000, flags4: 0, state: 10, commandStatus: 17, substate: 3, timer: turn,
    counter: turn & 255, object: 168, draw: 14, f1: 0, f2: 0, statusFlags: 2, assignment: 16,
    speed: 0, stamp: turn - 1, ...person } })

test('native birth hold, final frame and return updater are distinct checked phases', () => {
  for (const [source, last] of [[176, 9], [184, 17]]) {
    requireUpdatedPhase(sample(16, { object: source, f1: 1, f2: 0 }),
      sample(16, { object: source, f1: 0, f2: 0, stamp: 16 }, 'beforeTurn'))
    requireUpdatedPhase(sample(25, { object: source, f1: 0, f2: last - 1 }),
      sample(25, { object: source, f1: 0, f2: last, stamp: 25 }, 'beforeTurn'))
    assert.throws(() => requireUpdatedPhase(sample(16, { object: source, f1: 1, f2: 0 }),
      sample(16, { object: source, f1: 0, f2: 1, stamp: 16 }, 'beforeTurn')))
  }
  requireUpdatedPhase(sample(26, { f1: 0, f2: 0 }), sample(26, { f1: 0, f2: 1, stamp: 26 }, 'beforeTurn'))
  assert.throws(() => requireUpdatedPhase(sample(26, {}), sample(26, { f2: 0, stamp: 26 }, 'beforeTurn')))
})

// Supplied protocol records, never an ordinary-game witness. Decision cells are
// fixed at16/32; both exact native10/18-frame ownership intervals are explicit.
function suppliedLoop({ omit184 = false, damageReturn = false } = {}) {
  const tracker = createCandidateTracker(), move = sample(-1, { commandStatus: 3 })
  move.order.model = 3; tracker.observe(move)
  let previous = { object: 160, draw: 19, f1: 0, f2: 0, substate: 2, timer: 4 }
  for (let turn = 0; turn <= 846 && tracker.progress.status !== 'failed'; turn++) {
    tracker.observe(sample(turn - 1, { ...previous, stamp: turn - 1 }, 'beforeTurn'))
    let p = { ...previous, substate: turn === 0 || turn > 840 && turn < 845 ? 2 : turn === 840 ? 4 : 3,
      timer: turn <= 840 ? turn : turn === 846 ? 1 : turn === 845 ? 0 : 4, object: 168, draw: 14 }
    if (turn === 0 || turn > 840 && turn < 846) p = { ...p, object: 160, draw: 19, f1: 1, f2: 0 }
    if (turn === 1 || turn === 846) Object.assign(p, { object: 168, draw: 14, f1: 1, f2: 0 })
    for (const [birth, source, count] of [[16, 176, 10], ...omit184 ? [] : [[32, 184, 18]]]) {
      if (turn === birth) Object.assign(p, { object: source, draw: 14, f1: 1, f2: 0, statusFlags: 3 })
      else if (turn > birth && turn < birth + count) Object.assign(p, { object: source, draw: 14, f1: 0, f2: turn - birth - 1, statusFlags: 3 })
      else if (turn === birth + count) Object.assign(p, { object: 168, draw: 14, f1: 0, f2: damageReturn ? 1 : 0, statusFlags: 2 })
    }
    const row = sample(turn, p); tracker.observe(row)
    const count = { 160: 4, 168: 6, 176: 10, 184: 18 }[p.object]
    previous = { ...p, f1: p.f1 ? p.f1 - 1 : p.draw === 19 ? 1 : 0,
      f2: p.f1 ? p.f2 : (p.f2 + 1) % count }
    tracker.observe(sample(turn, { ...previous, stamp: turn }, 'render-after-updater'))
  }
  return tracker
}

test('finite full window requires both naturally born families and exact return ownership', () => {
  const tracker = suppliedLoop()
  assert.equal(tracker.progress.status, 'passed', tracker.progress.reason)
  assert.equal(tracker.progress.families[176].returns, 1); assert.equal(tracker.progress.families[184].returns, 1)
  assert.equal(suppliedLoop({ omit184: true }).progress.status, 'failed')
  assert.equal(suppliedLoop({ damageReturn: true }).progress.status, 'failed')
})

test('ordinary pauses consume the unchanged wall window, and missed entry cannot be repaired later', () => {
  const tracker = createCandidateTracker(), move = sample(-1, { commandStatus: 3 }); move.order.model = 3
  tracker.observe(move); tracker.observe(sample(0, { substate: 2, object: 160, draw: 19, f1: 1 }))
  tracker.permitOrdinaryPause(true)
  const late = sample(0, { substate: 2, object: 160, draw: 19, f1: 0, stamp: 0 }, 'render-after-updater')
  late.now = 120000; late.paused = true; tracker.observe(late)
  assert.equal(tracker.progress.status, 'failed'); assert.match(tracker.progress.reason, /120-second/)
  const missed = createCandidateTracker(); missed.observe(move); missed.observe(sample(1, {}))
  assert.equal(missed.progress.status, 'failed'); assert.match(missed.progress.reason, /entry was missed/)
})

test('checkpoint projection binds exact active phase, queue, alias and both RNGs', () => {
  const native = sample(16, { object: 176, f1: 0, f2: 3, statusFlags: 3 }).person
  native.commands = [7]; native.commandCursor = 0; native.immediateCommand = 0
  const unit = { id: 4, team: 'blue', kind: 'preacher', hp: 30, x: 35, z: 90, inside: null, native }
  const world = { outcome: { level: 3 }, turn: 16, time: 16 / 12, paused: true, speed: 1,
    randomState: 71, cosmeticRandom: { randomState: 19 }, units: [unit],
    objectCells: { objects: new Map([[4, native]]) }, buildingOrders: { records: { 7: { model: 17, flags: 0 } } } }
  const saved = gestureProjection({ version: 1, world }, 4); requireSavedGesture(saved)
  requireSameGestureCheckpoint(saved, structuredClone(saved))
  for (const change of [p => p.native.f2++, p => p.native.f1++, p => p.native.counter++,
    p => p.cosmeticRng++, p => p.simulationRng++, p => p.order.id++, p => { p.paused = false },
    p => { p.registeredOwner = false }]) {
    const altered = structuredClone(saved); change(altered)
    assert.throws(() => requireSameGestureCheckpoint(saved, altered))
  }
})

test('retained raw RGBA body differences are independently countable', () => {
  const before = new Uint8Array(16), hidden = new Uint8Array(16)
  before[0] = 17; before[6] = 2; before[15] = 255
  assert.equal(compareBodyPixels(before, hidden, 2), 2, 'Alpha-only differences do not count as visible body colour')
  assert.throws(() => compareBodyPixels(before, hidden.subarray(0, 8), 2))
})

test('Pause proof requires actual trusted events and frozen gesture phase at click', () => {
  const event = { trusted: true, button: 0, x: 12, y: 14, targetMatches: true, pointOwned: true,
    sceneWorldSame: true, nativeOwnerSame: true, sourceIsNative: true, object: 176, draw: 14,
    state: 10, substate: 3, commandStatus: 17, statusFlags: 3, order: { model: 17 },
    turn: 17, now: 100, f1: 0, f2: 1, counter: 16, timer: 17 }
  const trace = { point: { x: 12, y: 14 }, events: ['pointerdown', 'pointerup', 'click'].map(type => ({ ...event, type, paused: type === 'click' })) }
  requireGesturePause(trace, { ...event, now: 99 })
  const changed = structuredClone(trace); changed.events[2].f2++
  assert.throws(() => requireGesturePause(changed, event))
})

test('accepted inherited inputs remain byte-identical', () => {
  const provenance = JSON.parse(readFileSync(new URL('./provenance.json', import.meta.url)))
  for (const [path, expected] of Object.entries(provenance.inheritedFiles))
    assert.equal(createHash('sha256').update(readFileSync(new URL(`../../${path}`, import.meta.url))).digest('hex'), expected, path)
})
