import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createCutoffTracker, requireUpdatePair, cutoffRenderKind } from './observe.mjs'
import { renderedOwnerMatches } from './render.mjs'
import { requireCutoffCleanup } from './scenario.mjs'
import { chainPhaseObservers } from '../preacher-gesture-baseline/observe.mjs'

function row(turn, p, phase = 'afterTurn') {
  return { turn, now: turn * 84, phase, sameActor: true, sameWorld: true, registeredOwner: true, owner: 'native',
    hp: 55, kind: 'preacher', team: 'blue', inside: null, busy: false, status: 'playing', paused: false,
    speed: 1, visibility: 'visible', landFlags: 0, listeners: [], threats: [], collision: 0, followingOrder: false,
    order: { id: 26, model: 17, flags: 0 }, rng: { simulation: turn, cosmetic: 10 },
    person: { id: 3160, class: 1, model: 4, tribe: 0, vehicle: 0, cargo: 0, disguise: 0,
      flags2: 0, flags3: 0x40000, flags4: 0, state: 10, commandStatus: 17, substate: 3, timer: turn,
      counter: turn & 255, object: 168, draw: 14, f1: 0, f2: 0, stamp: turn - 1,
      statusFlags: 2, assignment: 16, speed: 0, renderFlags: 384, ...p } }
}
// Supplied protocol records only; this is not an ordinary browser witness.
function suppliedLoop(mutate = () => {}) {
  const tracker = createCutoffTracker(), move = row(-1, { commandStatus: 3 }); move.order.model = 3; tracker.observe(move)
  let previous = { object: 48, draw: 16, f1: 0, f2: 0, timer: 840, substate: 2 }
  for (let turn = 0; turn <= 857 && tracker.progress.status !== 'failed'; turn++) {
    tracker.observe(row(turn - 1, { ...previous, stamp: turn - 1 }, 'beforeTurn'))
    let p = { ...previous, flags2: 0 }
    if (turn <= 7 || turn >= 849 && turn <= 856) {
      const offset = turn <= 7 ? turn : turn - 849
      Object.assign(p, { object: 160, draw: 19, timer: 7 - offset, substate: offset === 7 ? 3 : 2,
        flags2: offset === 7 ? 0x40000000 : 0 })
      if (offset === 0) Object.assign(p, { f1: 1, f2: 0 })
    } else if (turn === 848) Object.assign(p, { object: 48, draw: 16, substate: 2, timer: 840, flags2: 0x40000000,
      f2: previous.f2 < 6 ? previous.f2 : 0 })
    else {
      Object.assign(p, { object: 168, draw: 14, substate: turn === 847 ? 4 : 3,
        timer: turn === 857 ? 1 : turn - 7, flags2: turn === 847 ? 0x40000000 : 0 })
      if (turn === 8 || turn === 857) Object.assign(p, { f1: 1, f2: 0 })
    }
    const after = row(turn, p); mutate(after); tracker.observe(after)
    previous = { ...p, f1: p.f1 ? p.f1 - 1 : p.draw === 19 ? 1 : 0,
      f2: p.f1 ? p.f2 : (p.f2 + 1) % ({ 48: 6, 160: 4, 168: 6 }[p.object]) }
    // Deliberately render847 then849, skipping the real middle-reset848.
    if (turn !== 848) {
      const rendered = row(turn, { ...previous, stamp: turn }, 'render-after-updater')
      if (cutoffRenderKind(rendered, tracker.progress)) rendered.render = { outcome: 'render-state-only' }
      tracker.observe(rendered)
    }
  }
  return tracker
}

test('full ordinary protocol can prove reset/update while normal rendering skips its middle visit', () => {
  const tracker = suppliedLoop()
  assert.equal(tracker.progress.status, 'passed', tracker.progress.reason)
  assert.equal(tracker.progress.visits, 858)
  assert.deepEqual([tracker.progress.terminalTurn, tracker.progress.resetTurn, tracker.progress.nextEntryTurn], [847, 848, 849])
  assert.equal(tracker.progress.renders['middle-reset'], 'render-not-observed')
  assert.ok(tracker.rows.some(r => r.turn === 848 && r.updateWitness?.boundary === 'next-beforeTurn-after-update'))
  assert.equal(cutoffRenderKind(row(1, {}, 'render-after-updater'), { terminalTurn: null }), null)
})

test('controller snapshots and stale/wrong-owner phase records cannot supply updater evidence', () => {
  const a = row(10, { object: 48, draw: 16, f1: 0, f2: 5 })
  const b = row(10, { object: 48, draw: 16, f1: 0, f2: 0, stamp: 10 }, 'beforeTurn')
  requireUpdatePair(a, b)
  for (const mutate of [r => { r.phase = 'afterTurn' }, r => { r.person.stamp-- }, r => { r.sameActor = false },
    r => { r.registeredOwner = false }, r => { r.person.object = 168 }, r => { r.person.f2++ }]) {
    const wrong = structuredClone(b); mutate(wrong); assert.throws(() => requireUpdatePair(a, wrong))
  }
})

test('old missing terminal bit or missing real stop and next-entry reset fails', () => {
  for (const [turn, patch] of [[847, { flags2: 0 }], [848, { object: 168, draw: 14 }],
    [848, { f2: 99 }], [849, { f1: 0 }]]) {
    const result = suppliedLoop(r => { if (r.turn === turn) Object.assign(r.person, patch) })
    assert.equal(result.progress.status, 'failed')
  }
})

test('missed entry, missing visits, recipient interruption and wall expiry fail closed', () => {
  const missed = createCutoffTracker(), move = row(-1, { commandStatus: 3 }); move.order.model = 3
  missed.observe(move); missed.observe(row(3, {})); assert.match(missed.progress.reason, /entry missed/)
  for (const mutate of [r => { r.followingOrder = true }, r => { r.sameWorld = false },
    r => { r.paused = true }, r => { r.now += 120000 }, r => { r.turn++ }]) {
    const result = suppliedLoop(r => { if (r.turn === 100) mutate(r) }); assert.equal(result.progress.status, 'failed')
  }
})

test('actual rendered source/frame/layers must match before pixels can be claimed', () => {
  const sample = row(848, { object: 48, draw: 16, f2: 0, stamp: 848 }, 'render-after-updater')
  const render = { turn: 848, source: 48, draw: 16, f1: 0, f2: 0, ownerMatches: true, meshVisible: true,
    objectsVisible: true, sceneVisible: true, canvasOwned: true, actualDraw: 16, actualFrame: 9, expectedFrame: 9,
    layers: [{ visible: true, piece: 3, uv: [1], scale: [2] }], expectedLayers: [{ visible: true, piece: 3, uv: [1], scale: [2] }] }
  assert.equal(renderedOwnerMatches(sample, render), true)
  for (const mutate of [r => { r.actualFrame = 8 }, r => { r.actualDraw = 14 }, r => { r.source = 168 }, r => { r.turn-- },
    r => { r.layers.push({ visible: true }) }, r => { r.layers[0].uv = [2] }]) {
    const stale = structuredClone(render); mutate(stale); assert.equal(renderedOwnerMatches(sample, stale), false)
  }
  assert.equal(renderedOwnerMatches({ ...sample, phase: 'afterTurn' }, render), false)
})

test('inherited chaining preserves original callback receivers/arguments/return and restores descriptors', () => {
  let calls = 0
  const clock = { beforeTurn(value) { assert.equal(this, clock); assert.equal(value, 7); calls++; return 9 }, afterTurn() { calls++; return 10 } }
  const renderer = { render(...args) { assert.equal(this, renderer); assert.deepEqual(args, ['scene', 'camera']); calls++; return 11 } }
  const original = Object.getOwnPropertyDescriptors(clock), render = renderer.render, rows = []
  const chain = chainPhaseObservers(clock, renderer, r => rows.push(r), phase => ({ phase, turn: 1 }), () => true)
  assert.equal(clock.beforeTurn(7), 9); assert.equal(clock.afterTurn(), 10); assert.equal(renderer.render('scene', 'camera'), 11)
  assert.equal(calls, 3); assert.equal(rows.length, 3); assert.deepEqual(chain.finish(), { errors: [], restored: true })
  assert.deepEqual(Object.getOwnPropertyDescriptors(clock), original); assert.equal(renderer.render, render)
  const broken = chainPhaseObservers(clock, renderer, () => { throw Error('read failed') }, () => ({}), () => true)
  clock.afterTurn(); assert.equal(broken.finish().errors.length, 1)
})

test('cleanup failures are fatal and inherited source inputs remain exact', () => {
  requireCutoffCleanup({ tail: { errors: [] }, restoration: { errors: [], restored: true } })
  for (const result of [{ error: 'failed' }, { restoration: { errors: [], restored: false } },
    { tail: { errors: ['capture failed'] } }, { pointer: { errors: ['owner changed'], restored: false } }])
    assert.throws(() => requireCutoffCleanup(result))
  const pins = JSON.parse(readFileSync(new URL('./source-inputs.json', import.meta.url)))
  for (const [path, hash] of Object.entries(pins.inheritedFiles))
    assert.equal(createHash('sha256').update(readFileSync(new URL(`../../${path}`, import.meta.url))).digest('hex'), hash, path)
})

test('passive callback source contains no forced renderer/tick/pause/layer/world mutation', () => {
  for (const file of ['observe.mjs', 'render.mjs']) {
    const source = readFileSync(new URL(file, import.meta.url), 'utf8')
    assert.doesNotMatch(source, /renderer\.render\s*\(|\b(?:tick|advanceGame|animateLiveObjects)\s*\(|nativeGuardRead\(|structuredClone\(/)
    assert.doesNotMatch(source, /(?:\bw|\bworld|\bnative|\bscene\.world|\blayer)\.[A-Za-z]+\s*=(?!=)/)
  }
})


test('a prolonged pre-loop phase cannot exceed900 visits or2800 retained rows', () => {
  const tracker = createCutoffTracker(), move = row(-1, { commandStatus: 3 }); move.order.model = 3; tracker.observe(move)
  let previous = { object: 160, draw: 19, f1: 1, f2: 0, substate: 2, timer: 1000 }
  for (let turn = 0; turn <= 900 && tracker.progress.status !== 'failed'; turn++) {
    tracker.observe(row(turn - 1, { ...previous, stamp: turn - 1 }, 'beforeTurn'))
    tracker.observe(row(turn, previous))
    previous = { ...previous, f1: previous.f1 ? previous.f1 - 1 : 1,
      f2: previous.f1 ? previous.f2 : (previous.f2 + 1) % 4 }
  }
  assert.match(tracker.progress.reason, /900 logical visit/)
  const rows = createCutoffTracker()
  for (let n = 0; n < 2801; n++) rows.observe(row(n, {}))
  assert.match(rows.progress.reason, /2800 compact phase/)
})
