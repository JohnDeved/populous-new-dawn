import assert from 'node:assert/strict'
import test from 'node:test'
import { installShamanCastingObserver } from '../scripts/tutorial-browser/shaman-casting-observer.mjs'
import { castingArtworkReference as reference, validateShamanCastingEvidence } from '../scripts/tutorial-browser/shaman-casting-evidence.mjs'
import native from './fixtures/shaman-casting-native.json' with { type: 'json' }
import { createStartedWorld, retainFixtureUnits } from './level-start-fixture.mjs'
import { addUnit, createWorld, select } from '../app/model.ts'
import { createLivePerson } from '../app/live-people.ts'
import { cast } from '../app/live-command.ts'
import { advanceGame } from '../app/game-clock.ts'
import { readFileSync } from 'node:fs'
import { beginOrdinaryCastingWitness } from '../scripts/tutorial-browser/shaman-casting.mjs'

// Supplied observations exercise the evidence contract, not a browser pass.
function evidence() {
  const casts = ['ordinary', 'subsequent'].map((label, index) => {
    const turn = 100 + index * 30, f2 = index ? 11 : 3, shot = 200 + index
    const person = { id: 4, hp: 100, state: 19, previousState: 17, object: 424, draw: 14,
      angle: 0, heading: 0, turnAngle: 0, turnY: 0,
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
        state: visit < 10 ? 22 : visit === 10 ? 10 : 19, object: visit < 10 ? 520 : 424,
        f2: (f2 + visit - 1) % 12, counter: (254 + visit) & 255, casting: visit < 6 })
      return state
    })
    const frames = [1, 2, 2, 2, 7, 10].map((visit, i) => {
      const frame = structuredClone(logical[visit - 1])
      const phase = (f2 + visit) % 12, direction = reference.directions[2],
        raw = direction.frames[phase % direction.frames.length],
        imported = Number(Object.keys(reference.renderSources).find(key => reference.renderSources[key] === raw))
      Object.assign(frame.person, { f2: phase })
      return { ...frame, at: [100, 150, 200, 450, 600, 700][i],
        suspended: !!index && (i === 2 || i === 3),
        stamp: turn + i, direction: 2, cameraBearing: (0x380 + 2 * 256) * Math.PI / 1024,
        heading: Math.PI, visible: true, submittedLayers: 2,
        frame: imported, flip: direction.flip, renderedDraw: 14,
        cropPlanned: i < 2, ...(i < 2 ? { cropFile: `shaman-casting-${label}-${i}.png`,
          bodyCanvasOwned: true, bodyInCanvas: true, cropOverlayClear: true } : {}) }
    })
    const crops = frames.slice(0, 2).map(frame => ({ file: frame.cropFile, turn: frame.turn,
      stamp: frame.stamp, f2: frame.person.f2, frame: frame.frame, opaqueColors: 12 }))
    return { label, trusted: true, button: 0, before, after, shot, logical, frames, crops,
      done: true, terminal: { turn: turn + 12, reason: 'twelve-natural-visits' } }
  })
  const frozen = structuredClone(casts[1].logical[1])
  frozen.suspended = true
  frozen.person.f2 = casts[1].frames[2].person.f2
  return { casts, closed: true, restored: true, errors: [],
    holds: [{ label: 'subsequent', before: { at: 160, stamp: 131, state: frozen },
      after: { at: 510, stamp: 133, state: structuredClone(frozen) } }] }
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
  assert.deepEqual(result.activeCastPauseHold, { status: 'passed', kind: 'F9 presentation suspension',
    durationMs: 350, renderedFrames: 2 })
  assert.deepEqual(supplied, before)
})

function renderedHeading(record, frame, camera, angle, direction) {
  frame.cameraBearing = camera * Math.PI / 1024
  frame.heading = Math.PI - angle * Math.PI / 1024
  frame.person.angle = angle & 2047
  frame.direction = direction
  const expected = reference.directions[direction],
    source = expected.frames[frame.person.f2 % expected.frames.length]
  frame.frame = Number(Object.keys(reference.renderSources).find(key => reference.renderSources[key] === source))
  frame.flip = expected.flip
  const crop = record.crops.find(crop => crop.stamp === frame.stamp)
  if (crop) crop.frame = frame.frame
}

test('each moving heading/camera crop must independently project to its original directional chain', () => {
  for (const kind of ['native turn', 'camera turn']) {
    const supplied = evidence(), record = supplied.casts[0]
    if (kind === 'native turn') {
      renderedHeading(record, record.frames[0], 1408, 512, 0)
      renderedHeading(record, record.frames[1], 1408, 256, 1)
    } else renderedHeading(record, record.frames[1], 1664, 0, 3)
    assert.notEqual(record.frames[0].direction, record.frames[1].direction)
    assert.doesNotThrow(() => validateShamanCastingEvidence(supplied))

    // Internally consistent artwork/direction alone is not evidence that the
    // renderer chose the right heading bucket. Keep the other inputs stale.
    record.frames[1].cameraBearing += Math.PI / 4
    assert.throws(() => validateShamanCastingEvidence(supplied), /camera-relative direction/)
  }
})

test('original signed-short direction buckets cover all directions, seams and native-angle ownership', () => {
  const cases = [
    ...Array.from({ length: 8 }, (_, direction) => [896 + direction * 256, 0, direction]),
    [1151, 0, 0], [1152, 0, 1], [-1, 0, 4], [32767, 0, 4],
    [32768, 0, 4], [0, 32768, 4], [65536 + 896, 0, 0],
  ]
  for (const [camera, angle, direction] of cases) {
    const supplied = evidence(), record = supplied.casts[0]
    renderedHeading(record, record.frames[0], camera, angle, direction)
    assert.doesNotThrow(() => validateShamanCastingEvidence(supplied), `${camera}/${angle}/${direction}`)
    record.frames[0].person.angle = (angle + 256) & 2047
    assert.throws(() => validateShamanCastingEvidence(supplied), /native person angle/)
  }
})

test('rejects contaminated ordinary stock, duplicate allocations, missing expiry and invalid subsequent casts', () => {
  const corruptions = [
    r => { r.closed = false }, r => { r.restored = false }, r => { r.errors.push('observer failed') },
    r => { r.casts.reverse() }, r => { r.casts[0].trusted = false },
    r => { r.casts[0].before.cheatsUsed = true }, r => { r.casts[0].before.stock = 0 },
    r => { r.casts[0].before.person.state = 10 },
    r => { r.casts[0].before.person.state = 17 },
    r => { r.casts[1].before.person.state = 10 },
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
    r => { delete r.frames[0].cameraBearing }, r => { r.frames[0].heading = NaN },
    r => { r.frames[0].cameraBearing += Math.PI / 4 },
    r => { r.frames[0].heading += Math.PI / 4 },
    r => { r.frames[0].person.angle = 256 },
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

test('active-cast hold requires timed suspended renders, exact frozen state and rendered resume', () => {
  const corruptions = [
    r => { delete r.holds }, r => { r.holds = [] }, r => { r.holds[0].label = 'ordinary' },
    r => { r.holds[0].after = null }, r => { r.holds[0].after.at-- },
    r => { r.holds[0].after.state.turn++ }, r => { r.holds[0].after.state.person.f2++ },
    r => { r.holds[0].after.state.projectiles[0].remaining-- },
    r => { for (const edge of ['before', 'after']) r.holds[0][edge].state.person.state = 10 },
    r => { for (const edge of ['before', 'after']) r.holds[0][edge].state.person.casting = false },
    r => { r.casts[1].frames = r.casts[1].frames.filter(f => !f.suspended) },
    r => { r.casts[1].frames.splice(3, 1) },
    r => { r.casts[1].frames[2].suspended = false },
    r => { r.casts[1].frames[2].person.state = 10 },
    r => { r.casts[1].frames[2].person.timer-- },
    r => { r.casts[1].frames[3].at = 511 },
    r => { r.casts[1].frames[4].suspended = true },
    r => { r.casts[1].frames.splice(4, 1) },
  ]
  for (const mutate of corruptions) {
    const invalid = evidence(); mutate(invalid)
    assert.throws(() => validateShamanCastingEvidence(invalid), undefined, String(mutate))
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
  const allocate = (label = 'ordinary') => {
    win.shamanCastingObserver.arm(label); dispatch(true)
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
    assert.deepEqual(result.casts[0].frames.map(frame =>
      [frame.cameraBearing, frame.heading, frame.person.angle, frame.person.heading]),
    [[f.scene.cameraBearing, f.world.units[0].heading, f.person.angle, f.person.heading],
      [f.scene.cameraBearing, f.world.units[0].heading, f.person.angle, f.person.heading]])
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

test('active-cast hold markers observe existing suspension without changing World or driving draws', () => {
  const f = observerFixture()
  try {
    installShamanCastingObserver()
    const observer = f.win.shamanCastingObserver
    assert.throws(() => observer.beginHold(), /subsequent-cast/)
    f.allocate()
    for (let i = 0; i < 12; i++) { f.world.turn++; f.scene.gameClock.afterTurn() }
    f.world.mode = 'blast'; f.person.state = 10; f.world.projectiles = []
    f.allocate('subsequent')
    assert.throws(() => observer.beginHold(), /F9 must suspend/)
    f.scene.modalSuspended = true
    const world = structuredClone(f.world), calls = f.calls.length
    observer.beginHold()
    assert.equal(f.calls.length, calls, 'Starting a hold cannot drive callbacks')
    f.renderer.render(f.scene.scene, f.scene.camera)
    f.renderer.render(f.scene.scene, f.scene.camera)
    observer.endHold()
    assert.throws(() => observer.endHold(), /must be open/)
    const result = observer.finish()
    assert.deepEqual(result.errors, [])
    assert.equal(result.holds.length, 1)
    assert.deepEqual(result.holds[0].before.state, result.holds[0].after.state)
    assert.equal(result.holds[0].after.stamp - result.holds[0].before.stamp, 2)
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

test('ordinary cast driver uses only public controls/pointer and stops after its existing natural clock window', async () => {
  const actions = [], page = {
    getByRole(role, { name }) {
      assert.equal(role, 'button')
      return { click: async options => actions.push(['button', String(name), ...(options ? [options] : [])]) }
    },
    getByTitle(title, options) {
      assert.deepEqual(options, { exact: true })
      return { click: async () => actions.push(['title', title]) }
    },
    async evaluate(fn) {
      const source = fn.toString()
      if (fn === installShamanCastingObserver) { actions.push(['install']); return }
      if (source.includes('hasUsedCheats()')) return false
      if (source.includes(".arm('ordinary')")) { actions.push(['arm']); return { stock: 4, cheatsUsed: false } }
      if (source.includes('getWorld().mode')) return 'blast'
      assert.match(source, /s\.screen\(point/)
      return { x: 500, y: 300 }
    },
    async waitForFunction(fn, argument) { actions.push(['wait', argument ?? null, fn.toString()]) },
    mouse: { move: async (...point) => actions.push(['move', ...point]),
      click: async (...point) => actions.push(['pointer', ...point]) },
  }
  const result = await beginOrdinaryCastingWitness(page)
  assert.deepEqual(result, { target: { x: 500, y: 300 }, before: { stock: 4, cheatsUsed: false } })
  assert.deepEqual(actions.filter(([kind]) => kind !== 'wait'), [
    ['button', 'Resume game'], ['button', 'Pause game'], ['button', 'Select shaman'],
    ['button', 'Select shaman', { button: 'right' }],
    ['install'], ['arm'], ['title', 'spells'], ['button', '/^Blast, [1-9][0-9]* shots$/'],
    ['button', 'Resume game'], ['move', 500, 300], ['pointer', 500, 300], ['button', 'Pause game'],
  ])
  const waits = actions.filter(([kind]) => kind === 'wait')
  assert.match(waits[0][2], /order\?\.model !== 18/)
  assert.match(waits[1][2], /s\.world\.selected\.includes\(u\.id\)/)
  assert.match(waits[1][2], /!s\.cameraMotion\.active && !s\.viewTransition && !s\.resultCamera\.active/)
  assert.ok(actions.findIndex(action => action[2]?.button === 'right') < actions.indexOf(waits[1]))
  assert.ok(actions.indexOf(waits[1]) < actions.findIndex(([kind]) => kind === 'install'))
  assert.match(actions.filter(([kind]) => kind === 'wait').at(-1)[2], /cast\.done/)
  assert.equal(actions.filter(([kind]) => kind === 'wait').at(-1)[1], 'ordinary')
})

test('actual ordinary-readiness callback admits naturally resting Mission 1, not opening state 10', async t => {
  const { loadSceneFixture } = await import('./support/bloodlust-scene.mjs')
  await loadSceneFixture()
  const { skipIntroduction } = await import('../app/scene-camera-runtime.ts')
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'window'),
    authored = createWorld(1), clock = { animationTime: 0, animationFrame: 0 },
    scene = { world: authored, flybyCamera: { x: 0, y: 0, angle: 0, zoom: 0 }, onChange() {} },
    stop = new Error('Captured production readiness callback')
  let world = authored, ready
  globalThis.window = { testStore: { getWorld: () => world, hasUsedCheats: () => false } }
  t.after(() => {
    if (descriptor) Object.defineProperty(globalThis, 'window', descriptor)
    else delete globalThis.window
  })
  await assert.rejects(beginOrdinaryCastingWitness({
    getByRole: () => ({ click: async () => {} }),
    evaluate: async callback => callback(),
    waitForFunction: async callback => { ready = callback; throw stop },
  }), error => error === stop)
  const u = authored.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman'), p = u.native,
    openingOrder = p.immediateCommand || p.commands[p.commandCursor]
  assert.equal(p.state, 10)
  assert.equal(authored.buildingOrders.records[openingOrder].model, 18)
  assert.equal(ready(), false)
  // CPU caller regression: the real clock and public Skip implementation finish
  // startup. No entity, stock, state, order, input mask or readiness is injected.
  while (!(authored.flyby.flags & 1) && authored.turn < 144) advanceGame(authored, clock, 1 / 12)
  assert.ok(authored.flyby.flags & 1, 'Authored camera introduction must start')
  assert.equal(authored.levelStart.find(site => site.shaman === u.id).phase, 4)
  assert.equal(p.state, 19)
  assert.equal(ready(), false, 'The live introduction still owns input')
  skipIntroduction(scene)
  assert.equal(authored.inputMask, 0)
  const before = structuredClone(authored)
  assert.equal(ready(), true)
  assert.deepEqual(authored, before, 'Readiness only observes the actual World')

  for (const mutate of [
    w => { w.status = 'won' }, w => { w.paused = true }, w => { w.inputMask = 64 },
    w => { w.shots.blast = 0 }, w => { w.castingTribes[0].cooldown = 1 },
    w => { w.units = [] },
    ...[
      u => { u.hp = 0 }, u => { u.flight = u.native }, u => { u.lift = 1 },
      u => { u.native.state = 10 }, u => { u.native.state = 17 }, u => { u.native.state = 22 },
      u => { u.native.vehicle = 1 }, u => { u.native.flags2 |= 0x100000 },
      u => { u.native.flags4 |= 128 },
      u => { u.native.immediateCommand = openingOrder },
    ].map(change => w => change(w.units.find(unit => unit.id === u.id))),
  ]) {
    world = structuredClone(authored)
    mutate(world)
    const unchanged = structuredClone(world)
    assert.equal(!!ready(), false, String(mutate))
    assert.deepEqual(world, unchanged)
  }
  world = authored
  select(authored, 'shaman')
  assert.deepEqual(authored.selected, [u.id])
  for (let index = 0; index < 2; index++) {
    assert.equal(ready(), true, 'Both the pre-grant cast and recovered caster rest in 19')
    assert.equal(p.state, evidence().casts[index].before.person.state)
    assert.equal(cast(authored, 'blast', { x: u.x + 5, z: u.z + 5 }), true)
    assert.equal(p.previousState, 10, 'Public cast cancels resting before admitting state22')
    for (let visit = 1; visit <= 12; visit++) {
      advanceGame(authored, clock, 1 / 12)
      assert.equal(!!ready(), visit === 12, 'Wait for both native pose recovery and cooldown')
      if (visit === 10) assert.equal(p.state, 10, 'Default state10 is only the expiry transition')
      if (visit >= 11) assert.equal(p.state, 19)
    }
  }
})

test('ordinary Mission 1 casting retains native ground turning rather than a fixed render direction', async () => {
  const { loadSceneFixture } = await import('./support/bloodlust-scene.mjs')
  await loadSceneFixture()
  const { skipIntroduction } = await import('../app/scene-camera-runtime.ts'),
    w = createWorld(1), clock = { animationTime: 0, animationFrame: 0 },
    scene = { world: w, flybyCamera: { x: 0, y: 0, angle: 0, zoom: 0 }, onChange() {} }
  while (!(w.flyby.flags & 1) && w.turn < 144) advanceGame(w, clock, 1 / 12)
  skipIntroduction(scene)
  while (w.turn < 164) advanceGame(w, clock, 1 / 12)
  select(w, 'shaman')
  const u = w.units.find(u => u.team === 'blue' && u.kind === 'shaman'), p = u.native,
    target = p.heading, retainedDestination = [p.turnAngle, p.turnY], counter = p.counter
  assert.equal(p.state, 19)
  assert.equal(p.flags2 & 128, 0)
  assert.equal(cast(w, 'blast', { x: u.x + 5, z: u.z + 5 }), true)
  assert.deepEqual([p.turnAngle, p.turnY], retainedDestination,
    'Original004c1b80 updates the direct turn target only when flags2 bit128 is set')
  let expected = p.heading, turning = false
  const angles = new Set([expected])
  for (let visit = 1; visit < 10; visit++) {
    // Original004e6d00 requests turning every fourth class-counter visit.
    // Verified executable005a7d64 (physics18 field0) is signed-short256.
    if (!((counter + visit) & 3)) turning = true
    if (turning) {
      const delta = ((target - expected + 1024) & 2047) - 1024
      expected = (expected + Math.sign(delta) * Math.min(Math.abs(delta), 256)) & 2047
      turning = Math.abs(delta) > 256
    }
    advanceGame(w, clock, 1 / 12)
    assert.deepEqual([p.state, p.angle, p.heading], [22, expected, expected])
    assert.equal(Math.round((Math.PI - u.heading) * 1024 / Math.PI) & 2047, expected)
    angles.add(p.angle)
  }
  assert.ok(angles.size > 1, 'Natural physics turns while the native cast pose remains active')
  assert.equal(p.heading, target)
})

test('actual F9 episode retains grant/input/hold/refill/save order and existing episode bounds', () => {
  const source = readFileSync(new URL('../scripts/tutorial-browser/spell-test-menu.mjs', import.meta.url), 'utf8'),
    runner = readFileSync(new URL('../scripts/tutorial-browser/run.mjs', import.meta.url), 'utf8'),
    sequence = [
      'report.unpausedHoldAndResume = true', 'await beginOrdinaryCastingWitness(page)',
      "await button('Unlock + refill all spells').click()", "await button('Refill mana').click()",
      'await button(`Test Blast, ${unlocked.shots.blast} shots`).click()',
      "window.shamanCastingObserver.arm('subsequent')", 'await page.mouse.click(target.x, target.y)',
      'const casting = await snapshot()', 'window.shamanCastingObserver.beginHold()',
      'await page.waitForTimeout(350)', 'window.shamanCastingObserver.endHold()',
      "await button('Refill available charges').click()", 'const refilled = await snapshot()',
      'report.refillPreservesLiveCasting = true', "await page.keyboard.press('F9')",
      "await waitForCastingWitness(page, 'subsequent')", 'castingRetentionAttempted = true',
      'await retainCastingWitness(page, output)', "await button('Menu').click()",
      "await button('Save Game').click()", 'existing save/profile are unchanged',
    ]
  let position = 0
  for (const snippet of sequence) {
    const next = source.indexOf(snippet, position)
    assert.ok(next >= position, snippet); position = next + snippet.length
  }
  assert.equal((source.match(/browser\.newContext\(/g) ?? []).length, 1)
  assert.match(source, /export const spellTestLimitMs = 75000/)
  assert.equal((source.match(/setTimeout\(/g) ?? []).length, 1)
  assert.match(source, /Math\.max\(0, spellTestLimitMs - \(performance\.now\(\) - started\)\)/)
  assert.match(source, /assert\.deepEqual\(refilled\.projectiles, casting\.projectiles\)/)
  assert.match(source, /assert\.deepEqual\(refilled\.shaman, casting\.shaman\)/)
  assert.match(source, /assert\.deepEqual\(refilled\.castingTribes, casting\.castingTribes\)/)
  assert.match(source, /actual Shaman windup must still be active/)
  assert.match(source, /normal cast spent one real charge/)
  assert.doesNotMatch(source, /world\.[a-zA-Z]+\s*=|\.tick\(|advanceGame\(|--no-sandbox/)
  assert.equal((runner.match(/receipt\.spellTestMenu =/g) ?? []).length, 1)
})

test('actual F9 failure cleanup retains at most once and closes context even if retention fails', async () => {
  const source = readFileSync(new URL('../scripts/tutorial-browser/spell-test-menu.mjs', import.meta.url), 'utf8'),
    marker = '\n  } finally {\n',
    start = source.lastIndexOf(marker) + marker.length,
    end = source.indexOf('\n  if (failure) throw failure', start),
    body = source.slice(start, end).replace(/\n {2}}\s*$/, '')
  assert.ok(start > 0 && end > start)
  const { assertSpellTestDeadline, closeSpellTestContext } = await import('../scripts/tutorial-browser/spell-test-menu.mjs')
  for (const expired of [false, true]) for (const attempted of [false, true]) for (const retentionFails of [false, true]) {
    const calls = [], original = new Error('original F9 failure'), report = { status: 'failed' },
      page = { isClosed: () => false },
      bindings = { started: performance.now() - (expired ? 75001 : 0), assertSpellTestDeadline, closeSpellTestContext, clearTimeout: () => calls.push('clearTimer'), timer: 1, page, output: 'output', report,
        diagnostics: { stop: () => calls.push('stopDiagnostics') },
        context: { close: async () => calls.push('closeContext') },
        retainCastingWitness: async (actualPage, output, options) => {
          calls.push('retain')
          assert.equal(actualPage, page); assert.equal(output, 'output')
          assert.deepEqual(options, { validate: false })
          if (retentionFails) throw Error('retention failed')
          return { status: 'incomplete' }
        },
        resolve: (...args) => args.join('/'),
        writeFileSync: (path, bytes) => { assert.equal(path, 'output/f9-cheats.json'); assert.ok(JSON.parse(bytes).contextClosed); calls.push('writeReceipt') },
      }
    const run = new Function(...Object.keys(bindings), 'failure', 'castingRetentionAttempted',
      `return (async () => { ${body}\nreturn { failure, castingRetentionAttempted } })()`)
    const result = await run(...Object.values(bindings), original, attempted)
    assert.equal(result.failure, original)
    assert.equal(result.castingRetentionAttempted, attempted || !expired)
    assert.deepEqual(calls, [...(!attempted && !expired ? ['retain'] : []), 'closeContext', 'clearTimer', 'stopDiagnostics', 'writeReceipt'])
    if (expired && !attempted) assert.match(report.castingRetentionError, /absolute deadline/)
    else assert.equal(report.castingRetentionError?.includes('retention failed'), !attempted && retentionFails ? true : undefined)
  }
})


test('successful casting retention checks the same absolute deadline before admission and after completion', async () => {
  const source = readFileSync(new URL('../scripts/tutorial-browser/spell-test-menu.mjs', import.meta.url), 'utf8'),
    start = source.indexOf("    await waitForCastingWitness(page, 'subsequent')"),
    end = source.indexOf("    diagnostics.stage('blocked save and checkpoint load')", start),
    body = source.slice(start, end),
    { assertSpellTestDeadline: actualDeadline } = await import('../scripts/tutorial-browser/spell-test-menu.mjs')
  assert.ok(start >= 0 && end > start)
  for (const [afterWait, afterRetention, expectedCalls, fails] of [
    [74999, 74999, 1, false], [75000, 75000, 0, true], [75001, 75001, 0, true],
    [74999, 75000, 1, true], [74999, 75001, 1, true],
  ]) {
    let now = 74998, calls = 0
    const report = {}, retained = { status: 'passed' },
      bindings = { page: {}, output: 'output', report, started: 0,
        waitForCastingWitness: async () => { now = afterWait },
        assertSpellTestDeadline: (report, started) => actualDeadline(report, started, () => now),
        retainCastingWitness: async () => { calls++; now = afterRetention; return retained },
      },
      run = new Function(...Object.keys(bindings), `return (async () => {
        let castingRetentionAttempted = false;
        try { ${body}; return { castingRetentionAttempted }; }
        catch (error) { return { castingRetentionAttempted, error }; }
      })()`),
      result = await run(...Object.values(bindings))
    assert.equal(calls, expectedCalls)
    assert.equal(result.castingRetentionAttempted, expectedCalls === 1)
    if (fails) assert.match(String(result.error), /absolute deadline/)
    else { assert.equal(result.error, undefined); assert.equal(report.shamanCasting, retained) }
  }
})
