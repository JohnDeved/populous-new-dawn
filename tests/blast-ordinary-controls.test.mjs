import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { controlSnapshot, activeCheckpointProjection, assertNoCast, assertCancellationSequence, assertCast, assertActivePause, assertFrozen } from '../qa/blast-ordinary/controls-evidence.mjs'
import { readActiveCheckpoint, observeControls } from '../qa/blast-ordinary/controls-observer.mjs'

// Synthetic evidence validates the QA assertions, not ordinary gameplay.
const state = () => ({ turn: 12, time: 1, pendingTime: 0, paused: false, mode: 'blast',
  stock: 4, castCount: 0, projectiles: [], payment: { shots: { blast: 4 } }, randomState: 1, cosmeticRandom: { randomState: 2 } })
const allocated = (targetId = 7) => {
  const before = state(), shot = { id: 100, spell: 'blast', team: 'blue', phase: 'windup', remaining: 6, target: { x: 3, z: -5 },
    ...(targetId === null ? {} : { blastTarget: { personId: targetId, shotPersonId: null, destination: { x: 1, y: 2, h: 3 } } }) }
  const after = { ...structuredClone(before), mode: null, stock: 3, castCount: 1, projectiles: [shot] }
  after.payment.shots.blast = 3
  return { event: { type: 'pointerup', button: 0, trusted: true, canvasOwned: true, x: 20, y: 30,
    observedAt: 1, before, after, targetSame: true, targetOwnerValid: true },
    pointer: { trusted: true, canvasOwned: true, canvasTarget: true, turn: 12, x: 20, y: 30,
      picks: [{ name: 'pickPerson', id: targetId }, { name: 'pick', owner: 'scene', point: { x: 2.4, z: -4.8 } }] } }
}
test('accepted person and ground controls require real handler ownership and one allocation', () => {
  for (const targetId of [7, null]) {
    const { event, pointer } = allocated(targetId)
    assert.equal(assertCast(event, pointer, { targetId }).id, 100)
    for (const mutate of [e => { e.trusted = false }, e => { e.after.stock = 2 }, e => { e.after.castCount = 2 }, e => { e.after.mode = 'blast' }, e => { e.after.projectiles[0].remaining = 5 }]) {
      const bad = structuredClone(event); mutate(bad)
      assert.throws(() => assertCast(bad, pointer, { targetId }))
    }
  }
  const { event, pointer } = allocated()
  pointer.picks[0].id = 8
  assert.throws(() => assertCast(event, pointer, { targetId: 7 }), /original person/)
  const ground = allocated(null); ground.event.after.projectiles[0].target.x++
  assert.throws(() => assertCast(ground.event, ground.pointer), /cell centering/)
})
test('cancel/rejection cannot hide payment, allocation or RNG changes', () => {
  const event = { trusted: true, before: state(), after: state() }
  event.after.mode = null
  assertNoCast(event)
  for (const mutate of [e => { e.after.stock-- }, e => { e.after.payment.shots.blast-- }, e => { e.after.projectiles.push({ id: 1 }) }, e => { e.after.randomState++ }, e => { e.after.turn++ }, e => { e.after.lastOrderTurn = 12 }]) {
    const bad = structuredClone(event); mutate(bad)
    assert.throws(() => assertNoCast(bad))
  }
})
test('each delivered cancellation must work even when later toggles restore final null', () => {
  const events = ['Digit1', 'Escape', 'Digit1', 2, 'Digit1', 'Digit1'].map((control, index) => ({
    type: control === 2 ? 'pointerup' : 'keydown', code: control === 2 ? null : control,
    button: control === 2 ? 2 : null, trusted: true, canvasOwned: true, repeat: false,
    before: { ...state(), mode: index % 2 ? 'blast' : null }, after: { ...state(), mode: index % 2 ? null : 'blast' },
  }))
  assertCancellationSequence(events)
  const maskedEscape = structuredClone(events)
  maskedEscape[1].after.mode = 'blast'
  maskedEscape[2].before.mode = 'blast'; maskedEscape[2].after.mode = null
  maskedEscape[3].before.mode = null
  for (const event of maskedEscape) assertNoCast(event)
  assert.equal(maskedEscape.at(-1).after.mode, null, 'The previous aggregate assertions would pass')
  assert.throws(() => assertCancellationSequence(maskedEscape), /input 2.*own mode transition/)
  for (const index of [3, 5]) {
    const failed = structuredClone(events); failed[index].after.mode = 'blast'
    assert.throws(() => assertCancellationSequence(failed), /own mode transition/)
  }
  for (const mutate of [value => value.splice(1, 1), value => value.push(structuredClone(value[5])), value => { value[3].button = 0 }, value => { value[3].canvasOwned = false }, value => { value[1].trusted = false }, value => { value[5].repeat = true }]) {
    const failed = structuredClone(events); mutate(failed)
    assert.throws(() => assertCancellationSequence(failed))
  }
})
test('active pause rejects late impact, untrusted input, blocked focus and wrong ordering', () => {
  const { event } = allocated(), before = structuredClone(event.after)
  const pause = { type: 'keydown', code: 'Space', repeat: false, blockedTarget: false, trusted: true,
    observedAt: 2, before, after: { ...structuredClone(before), paused: true } }
  assert.equal(assertActivePause(event, pause, 100, 7).id, 100)
  for (const mutate of [p => { p.observedAt = 0 }, p => { p.trusted = false }, p => { p.blockedTarget = true }, p => { p.repeat = true }, p => { p.after.projectiles = [] }, p => { p.after.projectiles[0].phase = 'arrived' }, p => { p.after.projectiles[0].blastTarget.personId = 8 }, p => { p.before.paused = true }]) {
    const bad = structuredClone(pause); mutate(bad)
    assert.throws(() => assertActivePause(event, bad, 100, 7))
  }
  assertFrozen(pause.after, structuredClone(pause.after))
  const advanced = structuredClone(pause.after); advanced.pendingTime = 0.1
  assert.throws(() => assertFrozen(pause.after, advanced), /pendingTime/)
})
function world() {
  const person = { id: 7, class: 1, flags2: 0, x: 1, y: 2, h: 3 }
  return { outcome: { level: 2 }, units: [{ id: 1, team: 'blue', kind: 'shaman', hp: 100, casting: { remaining: 0.5 } },
    { id: 7, team: 'blue', kind: 'brave', hp: 100, native: person }], selected: [],
    shots: { blast: 3 }, stats: { cast: 1 }, manaWorld: { gameFlags: 0, spells: [{ disabled: 2, stocks: [0, 0, 3] }] },
    manaTribes: [{ available: 12 }], spellCasts: [[0, 0, 1]], projectiles: allocated().event.after.projectiles,
    effects: [], randomState: 42, cosmeticRandom: { randomState: 10 }, turn: 12, time: 1, pendingTime: 0, paused: true }
}
test('checkpoint projection retains active target/shot/payment state without retaining live references', () => {
  const original = world(), before = structuredClone(original), projection = activeCheckpointProjection(original, 7)
  assert.deepEqual(original, before)
  original.projectiles[0].blastTarget.destination.x = 99
  original.units[1].native.x = 99
  original.manaTribes[0].available = 99
  assert.equal(projection.projectiles[0].blastTarget.destination.x, 1)
  assert.equal(projection.target.person.x, 1)
  assert.equal(projection.payment.mana.available, 12)
  assert.equal(controlSnapshot(original).stock, 3)
})
test('read-only checkpoint projection never creates a missing database', async () => {
  let opened = false
  assert.equal(await readActiveCheckpoint(7, { databases: async () => [], open() { opened = true } }), null)
  assert.equal(opened, false)
})
test('active checkpoint read waits for the readonly transaction and closes its connection', async () => {
  const request = {}, transaction = { objectStore(name) { assert.equal(name, 'checkpoints'); return { get(key) { assert.equal(key, 'latest'); return request } } } }
  let closed = false, committed = false
  const db = { transaction(name, mode) {
    assert.equal(name, 'checkpoints'); assert.equal(mode, 'readonly')
    queueMicrotask(() => { request.result = { version: 1, world: world() }; committed = true; transaction.oncomplete() })
    return transaction
  }, close() { closed = true } }
  const database = { databases: async () => [{ name: 'populous-new-dawn' }], open(name) {
    assert.equal(name, 'populous-new-dawn')
    const open = { result: db }; queueMicrotask(() => open.onsuccess()); return open
  } }
  assert.equal((await readActiveCheckpoint(7, database)).projectiles[0].id, 100)
  assert.equal(committed, true); assert.equal(closed, true)
})
class EventTargetFixture {
  listeners = []
  addEventListener(type, callback, capture) { this.listeners.push({ type, callback, capture }) }
  removeEventListener(type, callback, capture) { this.listeners = this.listeners.filter(row => row.type !== type || row.callback !== callback || row.capture !== capture) }
  emit(event, handler) {
    for (const row of this.listeners) if (row.type === event.type && row.capture) row.callback(event)
    handler?.()
    for (const row of this.listeners) if (row.type === event.type && !row.capture) row.callback(event)
  }
}
test('observation calls the original turn callbacks once and preserves foreign replacements on cleanup', () => {
  const w = world(), canvas = new EventTargetFixture(), win = new EventTargetFixture(), calls = []
  const clock = { beforeTurn(value) { calls.push(['before', this === clock, value]); return 42 }, afterTurn() { calls.push(['after', this === clock]); throw Error('original failure') } }
  const descriptor = Object.getOwnPropertyDescriptor(clock, 'beforeTurn'), scene = { world: w, gameClock: clock, renderer: { domElement: canvas } }
  const observer = observeControls(scene, () => ({ finish: () => ({ restored: true, errors: [], events: [] }) }), null, { elementFromPoint: () => canvas }, win)
  assert.equal(clock.beforeTurn(5), 42)
  assert.throws(() => clock.afterTurn(), /original failure/)
  assert.deepEqual(calls, [['before', true, 5], ['after', true]])
  const foreign = () => {}; clock.afterTurn = foreign
  const finished = observer.finish()
  assert.equal(finished.cleanupVerified, false)
  assert.match(finished.errors.join('\n'), /Foreign afterTurn/)
  assert.equal(clock.afterTurn, foreign)
  assert.deepEqual(Object.getOwnPropertyDescriptor(clock, 'beforeTurn'), descriptor)
  assert.equal(canvas.listeners.length + win.listeners.length, 0)
})
test('unsupported observer callback accessors fail before any pointer hooks attach', () => {
  const clock = {}; let read = false, attached = false
  Object.defineProperty(clock, 'beforeTurn', { get() { read = true; return () => {} } })
  assert.throws(() => observeControls({ world: world(), gameClock: clock, renderer: {} }, () => { attached = true }, null, {}, {}), /Unsupported/)
  assert.equal(read, false); assert.equal(attached, false)
})
test('controls QA excludes live world, clock, storage and DOM-state injection', () => {
  for (const name of ['controls-evidence.mjs', 'controls-observer.mjs', 'controls.mjs']) {
    const source = readFileSync(new URL(`../qa/blast-ordinary/${name}`, import.meta.url), 'utf8')
    assert.doesNotMatch(source, /\b(?:tick|advanceGame|beginCast|addUnit|setSelection|placeBuilding)\s*\(/)
    assert.doesNotMatch(source, /cancelAnimationFrame|\.animate\s*\(|\.renderer\.render\s*\(/)
    assert.doesNotMatch(source, /\b(?:world|w)\.(?:speed|paused|units|shots|manaWorld|mode|turn|randomState|terrain)\s*(?:=(?!=)|\+\+|--)/)
    assert.doesNotMatch(source, /\.dispatchEvent\s*\(|readwrite|\.put\s*\(|\.deleteDatabase\s*\(|force:\s*true/)
  }
})
