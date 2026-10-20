import assert from 'node:assert/strict'
import test from 'node:test'
import { installShamanCastingObserver } from '../scripts/tutorial-browser/shaman-casting-observer.mjs'
import { castingArtworkReference as reference, validateShamanCastingEvidence } from '../scripts/tutorial-browser/shaman-casting-evidence.mjs'
import native from './fixtures/shaman-casting-native.json' with { type: 'json' }
import { createStartedWorld, retainFixtureUnits } from './level-start-fixture.mjs'
import { addUnit } from '../app/model.ts'
import { createLivePerson } from '../app/live-people.ts'
import { cast } from '../app/live-command.ts'
import { advanceGame } from '../app/game-clock.ts'

// Supplied observations exercise the evidence contract, not a browser pass.
function evidence() {
  const casts = ['ordinary', 'subsequent'].map((label, index) => {
    const turn = 100 + index * 30, f2 = index ? 11 : 3, shot = 200 + index
    const person = { id: 4, hp: 100, state: 10, previousState: 0, object: 424, draw: 14,
      f1: 0, f2, timer: 0, counter: 254, stamp: turn, vehicle: 0, flags2: 0, flags4: 0,
      flight: false, lift: 0, casting: false, orderModel: 0, sameOwner: true }
    const before = { turn, paused: false, suspended: false, speed: 1, level: 1, inputMask: 0,
      mode: 'blast', cheatsUsed: !!index, stock: 4, storedStock: 4, casts: index,
      nativeCasts: index, cooldown: 0, tribeFlags: 0, gameFlags: 0, mana: 19,
      person, projectiles: [], waves: [] }
    const after = structuredClone(before)
    Object.assign(after, { mode: null, stock: 3, storedStock: 3, casts: index + 1,
      nativeCasts: index + 1, cooldown: 12,
      projectiles: [{ id: shot, caster: 4, phase: 'windup', remaining: 6 }] })
    Object.assign(after.person, { state: 22, previousState: 10, object: 520, timer: 10, casting: true })
    const logical = Array.from({ length: 12 }, (_, i) => {
      const visit = i + 1, state = structuredClone(after)
      Object.assign(state, { turn: turn + visit, cooldown: 12 - visit,
        waves: visit === 9 ? [300 + index] : [],
        projectiles: visit < 6 ? [{ id: shot, caster: 4, phase: 'windup', remaining: 6 - visit }]
          : visit === 6 ? [{ id: shot, caster: 4, phase: 'flying', remaining: 0 }] : [] })
      Object.assign(state.person, { timer: visit < 10 ? 10 - visit : 0,
        state: visit < 10 ? 22 : 10, object: visit < 10 ? 520 : 424,
        f2: (f2 + visit - 1) % 12, counter: (254 + visit) & 255, casting: visit < 6 })
      return state
    })
    const frames = [1, 2, 2, 7, 10].map((visit, i) => {
      const frame = structuredClone(logical[visit - 1])
      const phase = (f2 + visit) % 12, direction = reference.directions[2],
        raw = direction.frames[phase % direction.frames.length],
        imported = Number(Object.keys(reference.renderSources).find(key => reference.renderSources[key] === raw))
      Object.assign(frame.person, { f2: phase })
      return { ...frame, stamp: turn + i, direction: 2, visible: true, submittedLayers: 2,
        frame: imported, flip: direction.flip, renderedDraw: 14,
        cropPlanned: i < 2, ...(i < 2 ? { cropFile: `shaman-casting-${label}-${i}.png`,
          bodyCanvasOwned: true, bodyInCanvas: true, cropOverlayClear: true } : {}) }
    })
    const crops = frames.slice(0, 2).map(frame => ({ file: frame.cropFile, turn: frame.turn,
      stamp: frame.stamp, f2: frame.person.f2, frame: frame.frame, opaqueColors: 12 }))
    return { label, trusted: true, button: 0, before, after, shot, logical, frames, crops,
      done: true, terminal: { turn: turn + 12, reason: 'twelve-natural-visits' } }
  })
  return { casts, closed: true, restored: true, errors: [] }
}

test('casting browser expectations retain original object and VFRA evidence, not live helper output', () => {
  assert.deepEqual([reference.object, reference.draw], native.objects[109])
  assert.deepEqual(reference.directions, native.cycles.filter(c => c.team === 'blue'))
  assert.equal(reference.frameCount, 12)
  assert.match(reference.provenance.sha256['d3dpoptb.exe'], /^[a-f0-9]{64}$/)
  for (const direction of reference.directions)
    for (const frame of direction.frames) assert.ok(Object.values(reference.renderSources).includes(frame))
})

test('two complete observations distinguish logical callbacks from submitted render phases without mutation', () => {
  const supplied = evidence(), before = structuredClone(supplied)
  const result = validateShamanCastingEvidence(supplied)
  assert.deepEqual(result.casts.map(c => [c.label, c.projectileVisits, c.personVisits, c.cooldownVisits]),
    [['ordinary', 6, 10, 12], ['subsequent', 6, 10, 12]])
  assert.equal(result.activeCastPauseHold.status, 'pending',
    'No paused frames means no browser pause/freeze proof')
  assert.deepEqual(supplied, before)
})

test('rejects contaminated ordinary stock, duplicate allocations, missing expiry and invalid subsequent casts', () => {
  const corruptions = [
    r => { r.closed = false }, r => { r.restored = false }, r => { r.errors.push('observer failed') },
    r => { r.casts.reverse() }, r => { r.casts[0].trusted = false },
    r => { r.casts[0].before.cheatsUsed = true }, r => { r.casts[0].before.stock = 0 },
    r => { r.casts[0].before.person.orderModel = 18 },
    r => { r.casts[0].before.storedStock-- },
    r => { r.casts[0].after.stock++ }, r => { r.casts[0].after.storedStock++ },
    r => { r.casts[0].after.mana-- }, r => { r.casts[0].after.casts++ },
    r => { r.casts[0].after.nativeCasts++ }, r => { r.casts[0].after.cooldown = 0 },
    r => { r.casts[0].after.projectiles.push({ ...r.casts[0].after.projectiles[0], id: 999 }) },
    r => { r.casts[0].after.person.f2 = 0 }, r => { r.casts[0].logical.shift() },
    r => { r.casts[0].logical[5].projectiles[0].phase = 'windup' },
    r => { r.casts[0].logical[5].person.casting = true },
    r => { r.casts[0].logical[5].person.state = 10 },
    r => { r.casts[0].logical[9].person.state = 22 },
    r => { r.casts[0].logical[3].person.f2++ },
    r => { r.casts[0].logical[3].person.counter++ },
    r => { r.casts[0].logical[3].person.sameOwner = false },
    r => { r.casts[0].logical[3].waves = [999] },
    r => { r.casts[0].logical[8].waves = [] },
    r => { r.casts[0].terminal.turn-- }, r => { r.casts[0].done = false },
    r => { r.casts[1].before.cooldown = 1 }, r => { r.casts[1].before.casts++ },
    r => { r.casts[1].before.person.id++ }, r => { r.casts[1].frames[0].person.flight = true },
  ]
  for (const mutate of corruptions) {
    const invalid = evidence(); mutate(invalid)
    assert.throws(() => validateShamanCastingEvidence(invalid), undefined, String(mutate))
  }
})

test('rejects stale/wrong rendered source, render-clock drift, obscured or swapped crop evidence', () => {
  const corruptions = [
    r => { r.frames[0].person.state = 10 },
    r => { r.frames[1].person.state = 10 },
    r => { for (const frame of r.frames) frame.person.state = 10 },
    r => { r.frames[0].person.object = 648 }, r => { r.frames[0].frame = 0 },
    r => { r.frames[0].flip = !r.frames[0].flip }, r => { r.frames[0].renderedDraw = 13 },
    r => { r.frames[0].visible = false }, r => { r.frames[0].submittedLayers = 0 },
    r => { r.frames[2].person.f2++ }, r => { r.frames[1].stamp = r.frames[0].stamp },
    r => { r.frames[1].direction = 3 }, r => { r.frames[1].cropPlanned = false },
    r => { r.frames[0].bodyCanvasOwned = false }, r => { r.frames[0].bodyInCanvas = false },
    r => { r.frames[0].cropOverlayClear = false }, r => { r.frames[0].suspended = true },
    r => { r.crops.reverse() }, r => { r.crops[0].opaqueColors = 1 },
    r => { r.crops[0].error = 'readback failed' }, r => { r.crops[0].stamp++ },
    r => { r.crops.pop() }, r => { r.frames.length = 1 },
  ]
  for (const mutate of corruptions) for (const cast of [0, 1]) {
    const invalid = evidence(); mutate(invalid.casts[cast])
    assert.throws(() => validateShamanCastingEvidence(invalid), undefined, `${cast}: ${mutate}`)
  }
})

// This fake browser checks observer transparency and cleanup, not real pixels.
function observerFixture({ ownRender = false, installFailure = false } = {}) {
  const names = ['window', 'document', 'getComputedStyle'],
    saved = names.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]),
    listeners = [], calls = [], person = { ...evidence().casts[0].before.person },
    world = { turn: 100, paused: false, speed: 1, outcome: { level: 1 }, inputMask: 0,
      mode: 'blast', shots: { blast: 4 }, manaWorld: { gameFlags: 0, spells: [{ stocks: [0, 0, 4] }] },
      manaTribes: [{ available: 19 }], castingTribes: [{ cooldown: 0, flags: 0 }],
      stats: { cast: 0 }, spellCasts: [[0, 0, 0]], projectiles: [], effects: [],
      units: [{ id: 4, hp: 100, team: 'blue', kind: 'shaman', native: person, heading: 0, lift: 0 }] }
  const returned = {}, thrown = new Error('original failure')
  let failTurn = false, failRender = false, readbackCount = 0
  const turn = function (...args) {
    calls.push(['turn', this, args])
    if (failTurn) throw thrown
    return returned
  }
  const render = function (...args) {
    calls.push(['render', this, args])
    if (failRender) throw thrown
    renderer.info.render.frame++
    return returned
  }
  const canvas = { isConnected: true, width: 640, height: 480,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 640, height: 480 }) },
    renderer = Object.create({ render })
  if (ownRender) Object.defineProperty(renderer, 'render', { value: render, writable: true, configurable: true })
  Object.assign(renderer, { domElement: canvas, info: { render: { frame: 0 } } })
  const group = { visible: true, userData: { layers: [{ visible: true }], frame: 120, frameFlip: false, draw: 14 } },
    scene = { world, renderer, gameClock: { afterTurn: turn }, scene: {}, camera: {},
      modalSuspended: false, cameraBearing: 0, unitMeshes: new Map([[4, group]]),
      view: { painter: { source: () => ({}) } },
      picking: { personBounds: () => ({ x: 100, y: 100, width: 30, height: 50 }) } }
  const win = { testSceneRef: { current: scene }, testStore: { getWorld: () => world, hasUsedCheats: () => false },
    addEventListener(type, callback, capture) {
      if (installFailure && listeners.length === 1) throw Error('listener installation failed')
      listeners.push({ type, callback, capture })
    },
    removeEventListener(type, callback, capture) {
      const i = listeners.findIndex(row => row.type === type && row.callback === callback && row.capture === capture)
      if (i >= 0) listeners.splice(i, 1)
    } }
  globalThis.window = win
  globalThis.document = {
    elementFromPoint: () => canvas, querySelectorAll: () => [],
    createElement: () => ({ width: 0, height: 0, toDataURL() { readbackCount++; return 'data:image/png;base64,AA==' },
      getContext: () => ({ drawImage() {}, getImageData: () => ({ data: [1, 2, 3, 255, 4, 5, 6, 255] }) }) }),
  }
  globalThis.getComputedStyle = () => ({ display: 'block', visibility: 'visible', opacity: '1' })
  const dispatch = (capture, trusted = true) => listeners.find(row => row.capture === capture)?.callback({
    target: canvas, button: 0, isTrusted: trusted, clientX: 110, clientY: 120,
  })
  const allocate = () => {
    win.shamanCastingObserver.arm('ordinary'); dispatch(true)
    Object.assign(world, { mode: null }); world.stats.cast++; world.spellCasts[0][2]++
    world.shots.blast--; world.manaWorld.spells[0].stocks[2]--
    world.castingTribes[0].cooldown = 12
    world.projectiles.push({ id: 200, caster: 4, team: 'blue', spell: 'blast', phase: 'windup', remaining: 6 })
    Object.assign(person, { state: 22, object: 520, timer: 10, casting: true })
    world.units[0].casting = {}
    dispatch(false)
  }
  const cleanup = () => {
    win.shamanCastingObserver?.finish()
    for (const [name, descriptor] of saved)
      if (descriptor) Object.defineProperty(globalThis, name, descriptor)
      else delete globalThis[name]
  }
  return { world, person, scene, renderer, group, canvas, win, calls, returned, thrown, listeners,
    turn, render, allocate, dispatch, cleanup, readbacks: () => readbackCount,
    fail: () => { failTurn = true; failRender = true } }
}

test('observers forward exact callback receiver/result/throws, never manufacture turns or renders, and restore descriptors', () => {
  for (const ownRender of [false, true]) {
    const f = observerFixture({ ownRender }), descriptor = Object.getOwnPropertyDescriptor(f.renderer, 'render'),
      originalWorld = structuredClone(f.world)
    try {
      installShamanCastingObserver()
      assert.equal(f.scene.gameClock.afterTurn.call(f.scene.gameClock, 7), f.returned)
      assert.equal(f.renderer.render.call(f.renderer, f.scene.scene, f.scene.camera), f.returned)
      assert.deepEqual(f.calls.map(c => c[0]), ['turn', 'render'])
      assert.equal(f.calls[0][1], f.scene.gameClock); assert.deepEqual(f.calls[0][2], [7])
      assert.equal(f.calls[1][1], f.renderer); assert.deepEqual(f.calls[1][2], [f.scene.scene, f.scene.camera])
      assert.deepEqual(f.world, originalWorld)
      f.fail()
      assert.throws(() => f.scene.gameClock.afterTurn(), error => error === f.thrown)
      assert.throws(() => f.renderer.render(f.scene.scene, f.scene.camera), error => error === f.thrown)
      const result = f.win.shamanCastingObserver.finish()
      assert.deepEqual(result.errors, []); assert.equal(result.restored, true)
      assert.equal(f.scene.gameClock.afterTurn, f.turn)
      assert.deepEqual(Object.getOwnPropertyDescriptor(f.renderer, 'render'), descriptor)
      assert.equal(f.listeners.length, 0); assert.equal(f.readbacks(), 0)
    } finally { f.cleanup() }
  }
})

test('a live allocation is observed synchronously and readback waits until detached retention', () => {
  const f = observerFixture()
  try {
    installShamanCastingObserver(); f.allocate()
    f.renderer.render(f.scene.scene, f.scene.camera)
    f.person.f2++; f.world.turn++
    f.renderer.render(f.scene.scene, f.scene.camera)
    assert.equal(f.readbacks(), 0)
    const before = structuredClone(f.world), result = f.win.shamanCastingObserver.finish()
    assert.deepEqual(result.errors, [])
    assert.equal(result.casts[0].before.stock, 4)
    assert.equal(result.casts[0].after.stock, 3)
    assert.equal(result.casts[0].shot, 200)
    assert.equal(result.casts[0].crops.length, 2)
    assert.equal(f.readbacks(), 2); assert.deepEqual(f.world, before)
    assert.equal(f.win.shamanCastingObserver.finish(), result)
    assert.equal(f.readbacks(), 2)
  } finally { f.cleanup() }
})

test('observer failures preserve originals and fail closed on owner replacement or installation errors', () => {
  const bad = observerFixture({ installFailure: true })
  try {
    assert.throws(installShamanCastingObserver, /listener installation failed/)
    assert.equal(bad.scene.gameClock.afterTurn, bad.turn)
    assert.equal(bad.renderer.render, bad.render); assert.equal(bad.listeners.length, 0)
  } finally { bad.cleanup() }
  const f = observerFixture()
  try {
    installShamanCastingObserver(); f.allocate()
    f.win.testSceneRef.current = {}
    assert.equal(f.scene.gameClock.afterTurn(), f.returned, 'Observer errors cannot throw from original turn')
    const result = f.win.shamanCastingObserver.finish()
    assert.match(result.errors[0], /Scene\/World/)
    assert.equal(result.restored, true)
  } finally { f.cleanup() }
})

test('second callback assignment failure restores the first callback and both full property descriptors', () => {
  const f = observerFixture()
  try {
    Object.defineProperty(f.scene.gameClock, 'afterTurn', {
      value: f.turn, writable: true, configurable: true, enumerable: false,
    })
    Object.defineProperty(f.renderer, 'render', {
      value: f.render, writable: false, configurable: false, enumerable: false,
    })
    const turnDescriptor = Object.getOwnPropertyDescriptor(f.scene.gameClock, 'afterTurn'),
      renderDescriptor = Object.getOwnPropertyDescriptor(f.renderer, 'render'),
      world = structuredClone(f.world)
    assert.throws(installShamanCastingObserver, TypeError)
    assert.deepEqual(Object.getOwnPropertyDescriptor(f.scene.gameClock, 'afterTurn'), turnDescriptor)
    assert.deepEqual(Object.getOwnPropertyDescriptor(f.renderer, 'render'), renderDescriptor)
    assert.equal(f.win.shamanCastingObserver, undefined)
    assert.equal(f.listeners.length, 0)
    assert.deepEqual(f.calls, [])
    assert.deepEqual(f.world, world)
  } finally { f.cleanup() }
})

test('actual game-clock callbacks are observed before logical animation, with no duplicated controller visits', () => {
  const f = observerFixture()
  try {
    const w = createStartedWorld(1)
    retainFixtureUnits(w, () => false)
    w.buildings = []; w.trees = []; w.shrines = []
    w.terrain.fill(3); w.terrainVersion++; w.manaWorld.gameFlags = 0
    const u = addUnit(w, 'blue', 'shaman', { x: 1, z: -1 })
    addUnit(w, 'red', 'brave', { x: 40, z: -40 })
    u.native = createLivePerson(w, u)
    u.native.f2 = 3
    Object.assign(f.world, w)
    Object.assign(f.scene.gameClock, { animationTime: 0, animationFrame: 0 })
    installShamanCastingObserver()
    f.world.mode = 'blast'
    f.win.shamanCastingObserver.arm('ordinary'); f.dispatch(true)
    assert.equal(cast(f.world, 'blast', { x: 9, z: -1 }), true)
    f.dispatch(false)
    const initialCounter = u.native.counter
    for (let visit = 1; visit <= 12; visit++) advanceGame(f.world, f.scene.gameClock, 1 / 12)
    const result = f.win.shamanCastingObserver.finish(), record = result.casts[0]
    assert.deepEqual(result.errors, [])
    assert.equal(record.logical.length, 12)
    assert.equal(record.done, true)
    for (const [i, state] of record.logical.entries()) {
      const visit = i + 1
      assert.equal(state.turn, record.after.turn + visit)
      if (visit < 10) {
        assert.deepEqual([state.person.state, state.person.timer, state.person.f2, state.person.counter],
          [22, 10 - visit, (3 + visit - 1) % 12, (initialCounter + visit) & 255])
      } else assert.notEqual(state.person.state, 22)
      assert.equal(state.person.casting, visit < 6)
      if (visit === 6) assert.equal(state.projectiles[0].phase, 'flying')
    }
    assert.equal(f.calls.filter(call => call[0] === 'turn').length, 12)
    assert.equal(f.world.stats.cast, 1)
  } finally { f.cleanup() }
})
