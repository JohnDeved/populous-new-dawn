import assert from 'node:assert/strict'
import test from 'node:test'
import { installShamanCastingObserver, installShamanCastingInputTiming } from '../scripts/tutorial-browser/shaman-casting-observer.mjs'
import { castingArtworkReference as reference, validateShamanCastingEvidence } from '../scripts/tutorial-browser/shaman-casting-evidence.mjs'
import native from './fixtures/shaman-casting-native.json' with { type: 'json' }
import { createStartedWorld, retainFixtureUnits } from './level-start-fixture.mjs'
import { addUnit, createWorld, select } from '../app/model.ts'
import { createLivePerson } from '../app/live-people.ts'
import { cast } from '../app/live-command.ts'
import { advanceGame } from '../app/game-clock.ts'
import { readFileSync } from 'node:fs'
import { beginOrdinaryCastingWitness, prepareCastingF9 } from '../scripts/tutorial-browser/shaman-casting.mjs'

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
    holds: [{ label: 'subsequent', samples: [160, 510].map(at => ({ at, frameTime: at, stamp: 131, state: structuredClone(frozen) })), before: { at: 160, stamp: 131, state: frozen },
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
    durationMs: 350, renderedFrames: 2, retainedRenderedFrames: 0, rafStateSamples: 2, rafStateSpanMs: 350 })
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

test('active-cast hold requires timed RAF state samples, exact frozen state and rendered resume', () => {
  const corruptions = [
    r => { delete r.holds }, r => { r.holds = [] }, r => { r.holds[0].label = 'ordinary' },
    r => { r.holds[0].after = null }, r => { r.holds[0].after.at-- },
    r => { r.holds[0].after.state.turn++ }, r => { r.holds[0].after.state.person.f2++ },
    r => { r.holds[0].after.state.projectiles[0].remaining-- },
    r => { for (const edge of ['before', 'after']) r.holds[0][edge].state.person.state = 10 },
    r => { for (const edge of ['before', 'after']) r.holds[0][edge].state.person.casting = false },
    r => { r.holds[0].samples = [] },
    r => { r.holds[0].samples.pop() },
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
function observerFixture({ ownRender = false, ownModal = false, installFailure = false } = {}) {
  const names = ['window', 'document', 'getComputedStyle', 'performance'],
    saved = names.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]),
    listeners = [], calls = [], person = { ...evidence().casts[0].before.person },
    world = { turn: 100, paused: false, speed: 1, outcome: { level: 1 }, inputMask: 0,
      mode: 'blast', shots: { blast: 4 }, manaWorld: { gameFlags: 0, spells: [{ stocks: [0, 0, 4] }] },
      manaTribes: [{ available: 19 }], castingTribes: [{ cooldown: 0, flags: 0 }],
      stats: { cast: 0 }, spellCasts: [[0, 0, 0]], projectiles: [], effects: [],
      units: [{ id: 4, hp: 100, team: 'blue', kind: 'shaman', native: person, heading: 0, lift: 0 }] }
  const returned = {}, thrown = new Error('original failure')
  let failTurn = false, failRender = false, failModal = false, readbackCount = 0
  const modal = function (...args) {
    calls.push(['modal', this, args])
    if (failModal) throw thrown
    this.modalSuspended = args[0]
    return returned
  }
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
  Object.setPrototypeOf(scene, { setModalSuspended: modal })
  if (ownModal) Object.defineProperty(scene, 'setModalSuspended', { value: modal, writable: true, configurable: true })
  let offset = 0, rafId = 0
  const realPerformance = globalThis.performance, rafs = new Map()
  globalThis.performance = { now: () => realPerformance.now() + offset }
  const win = { requestAnimationFrame(callback) { rafs.set(++rafId, callback); return rafId },
    cancelAnimationFrame(id) { rafs.delete(id) }, testSceneRef: { current: scene }, testStore: { getWorld: () => world, hasUsedCheats: () => false },
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
  installShamanCastingInputTiming()
  const dispatch = (capture, trusted = true) => listeners.find(row => row.type === 'pointerup' && row.capture === capture)?.callback({
    target: canvas, button: 0, isTrusted: trusted, clientX: 110, clientY: 120,
  })
  const allocate = (label = 'ordinary', arm = true) => {
    if (arm) win.shamanCastingObserver.arm(label)
    dispatch(true)
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
    win.shamanCastingInputTiming.close()
    for (const [name, descriptor] of saved)
      if (descriptor) Object.defineProperty(globalThis, name, descriptor)
      else delete globalThis[name]
  }
  return { world, person, scene, renderer, group, canvas, win, calls, returned, thrown, listeners,
    turn, render, modal, allocate, dispatch, cleanup,
    rafs, rafStep(ms = 1) { offset += ms; const entries = [...rafs]; rafs.clear(); for (const [, callback] of entries) callback(performance.now()) },
    readbacks: () => readbackCount,
    failModal: () => { failModal = true },
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

function armSubsequent(f) {
  f.allocate()
  for (let i = 0; i < 12; i++) { f.world.turn++; f.scene.gameClock.afterTurn() }
  f.world.mode = 'blast'; f.world.projectiles = []
  f.win.shamanCastingObserver.arm('subsequent')
}

function subscribeFixture(f) {
  const messages = [], token = 'fixture-subsequent'
  f.win.firstRender = message => { messages.push(message); return Promise.resolve() }
  f.win.shamanCastingObserver.subscribeFirstRunningCast({ binding: 'firstRender', token, before: f.world.stats.cast })
  return { messages, token }
}

function subsequentFixture(f) {
  armSubsequent(f)
  f.allocate('subsequent', false)
}

test('first-copy notification excludes prior, missing, paused and suspended renders without selecting artwork', () => {
  const f = observerFixture()
  try {
    installShamanCastingObserver()
    const observer = f.win.shamanCastingObserver
    assert.throws(() => subscribeFixture(f), /pre-input subsequent/)
    armSubsequent(f)
    const { messages, token } = subscribeFixture(f)
    assert.equal(messages.length, 0)
    f.allocate('subsequent', false)
    assert.equal(messages.length, 0, 'Allocation alone cannot notify')
    f.world.paused = true
    f.renderer.render(f.scene.scene, f.scene.camera)
    f.world.paused = false; f.scene.modalSuspended = true
    f.renderer.render(f.scene.scene, f.scene.camera)
    assert.equal(messages.length, 0, 'Paused/suspended frames cannot notify')
    assert.throws(() => observer.beginHold(), /requires a running render/)
    f.scene.modalSuspended = false
    f.group.userData.frame = -1; f.group.userData.frameFlip = 'wrong'
    const before = structuredClone(f.world), calls = f.calls.length
    f.renderer.render(f.scene.scene, f.scene.camera)
    assert.equal(messages.length, 1, 'The first completed copy notifies even with incorrect artwork')
    const first = f.renderer.info.render.frame
    f.renderer.render(f.scene.scene, f.scene.camera)
    assert.equal(messages.length, 1, 'The ordinary next render cannot notify twice')
    assert.equal(observer.status().casts[1].runningFrameStamp, first)
    assert.equal(f.calls.length, calls + 2)
    assert.deepEqual(f.world, before)
    observer.disarmFirstRunningCast(token)
    f.scene.modalSuspended = true; observer.beginHold(); f.rafStep(); f.rafStep(351); observer.endHold()
    f.scene.modalSuspended = false
    for (let i = 0; i < 12; i++) { f.world.turn++; f.scene.gameClock.afterTurn() }
    const result = observer.finish(), frames = result.casts[1].frames
    assert.deepEqual(frames.map(frame => [frame.paused, frame.suspended]),
      [[true, false], [false, true], [false, false], [false, false]])
    assert.equal(frames[2].frame, -1, 'Incorrect first-frame artwork remains evidence')
    assert.equal(result.holds.length, 1)
    const invalid = evidence()
    invalid.casts[1].frames[0].frame = -1
    assert.throws(() => validateShamanCastingEvidence(invalid), /Original VFRA frame\/flip/)
  } finally { f.cleanup() }
})

test('notification fails closed on stale owner, expired windup, first-copy failure or changed allocation', () => {
  for (const failure of ['scene', 'person', 'shot', 'expired', 'crop', 'counter', 'late-counter', 'binding', 'unsubmitted']) {
    const f = observerFixture()
    try {
      installShamanCastingObserver(); armSubsequent(f)
      const { messages } = subscribeFixture(f)
      if (failure === 'counter') f.world.stats.cast++
      f.allocate('subsequent', false)
      if (failure === 'late-counter') f.world.stats.cast++
      if (failure === 'scene') f.win.testSceneRef.current = {}
      if (failure === 'person') f.world.units[0].native = { ...f.person }
      if (failure === 'shot') f.world.projectiles[0] = { ...f.world.projectiles[0] }
      if (failure === 'expired') f.world.units[0].casting = null
      if (failure === 'crop') f.scene.picking.personBounds = () => null
      if (failure === 'binding') f.win.firstRender = () => Promise.resolve()
      if (failure === 'unsubmitted') f.group.userData.layers = []
      assert.equal(f.renderer.render(f.scene.scene, f.scene.camera), f.returned)
      const result = f.win.shamanCastingObserver.finish()
      assert.equal(messages.length, 1, failure)
      assert.equal(messages[0].kind, 'invalid', failure)
      assert.ok(result.errors.length > 0, failure)
      assert.ok(!result.timing.events.some(row => row.event === 'first-render-notification'), failure)
      if (failure === 'crop') assert.equal(result.casts[1].crops.length, 0)
    } finally { f.cleanup() }
  }
})

test('page timing retains first completed copy and notification without driving callbacks or replacing crops', () => {
  const f = observerFixture()
  try {
    installShamanCastingObserver(); armSubsequent(f)
    const { token, messages } = subscribeFixture(f)
    f.allocate('subsequent', false)
    const before = structuredClone(f.world), calls = f.calls.length
    f.renderer.render(f.scene.scene, f.scene.camera)
    f.person.f2++
    f.renderer.render(f.scene.scene, f.scene.camera)
    before.units[0].native.f2++
    f.win.shamanCastingObserver.disarmFirstRunningCast(token)
    const result = f.win.shamanCastingObserver.finish(), events = result.timing.events,
      rows = events.filter(row => row.label === 'subsequent')
    assert.equal(result.timing.clock, 'page.performance.now')
    assert.deepEqual(rows.map(row => row.event),
      ['notification-armed', 'allocation', 'first-running-render', 'crop-complete', 'first-render-notification', 'crop-complete'])
    assert.equal(rows[4].firstRunningStamp, rows[2].stamp)
    assert.equal(rows[4].copiedAt, rows[3].at)
    assert.ok(rows[2].enteredAt <= rows[2].renderedAt)
    assert.ok(rows[2].renderedAt <= rows[3].at && rows[3].at <= rows[4].at)
    assert.ok(events.every((row, i) => i === 0 || row.at >= events[i - 1].at))
    assert.equal(messages[0].pageAt, rows[4].at)
    assert.equal(f.calls.length, calls + 2)
    assert.deepEqual(f.world, before)
    assert.deepEqual(result.errors, [])
  } finally { f.cleanup() }
})

test('renderer never awaits binding delivery and retains a failed first copy without a replacement', async () => {
  const f = observerFixture(), delivery = deferred(), messages = []
  try {
    installShamanCastingObserver(); armSubsequent(f)
    f.win.firstRender = message => { messages.push(message); return delivery.promise }
    f.win.shamanCastingObserver.subscribeFirstRunningCast({ binding: 'firstRender', token: 'pending', before: f.world.stats.cast })
    f.allocate('subsequent', false)
    const world = structuredClone(f.world)
    assert.equal(f.renderer.render(f.scene.scene, f.scene.camera), f.returned)
    assert.equal(messages.length, 1)
    assert.deepEqual(f.world, world)
    delivery.reject(Error('binding failed'))
    await Promise.resolve()
    f.person.f2++
    f.renderer.render(f.scene.scene, f.scene.camera)
    const result = f.win.shamanCastingObserver.finish()
    assert.match(result.errors[0], /notification delivery failed/)
    assert.equal(result.casts[1].crops.length, 1)
    assert.equal(result.casts[1].frames.length, 1)
    assert.equal(result.restored, true)
  } finally { delivery.resolve(); f.cleanup() }
})

test('early trusted F9 timing precedes production immediate propagation stop and is removed at finish', () => {
  const f = observerFixture()
  try {
    let handled = 0
    const production = event => { handled++; event.stopImmediatePropagation() }
    f.win.addEventListener('keydown', production, true)
    const key = (isTrusted = true, key = 'F9') => {
      let stopped = false
      const event = { isTrusted, key, repeat: false, stopImmediatePropagation() { stopped = true } }
      for (const row of [...f.listeners]) {
        if (row.type !== 'keydown') continue
        row.callback(event)
        if (stopped) break
      }
    }
    key()
    installShamanCastingObserver(); f.allocate(); key()
    for (let i = 0; i < 12; i++) { f.world.turn++; f.scene.gameClock.afterTurn() }
    f.world.mode = 'blast'; f.world.projectiles = []; f.allocate('subsequent')
    const world = structuredClone(f.world), calls = f.calls.length
    key(false); key(true, 'F8'); key()
    const result = f.win.shamanCastingObserver.finish(), keys = result.timing.events.filter(row => row.event === 'trusted-f9-keydown')
    assert.equal(keys.length, 1)
    assert.deepEqual([keys[0].key, keys[0].repeat, keys[0].isTrusted, keys[0].label], ['F9', false, true, 'subsequent'])
    assert.equal(keys[0].state.person.sameOwner, true)
    assert.equal(handled, 5)
    assert.deepEqual(f.world, world); assert.equal(f.calls.length, calls)
    assert.equal(result.restored, true)
    assert.deepEqual(f.listeners, [{ type: 'keydown', callback: production, capture: true }])
    key(); assert.equal(handled, 6); assert.equal(keys.length, 1)
    f.win.removeEventListener('keydown', production, true)
  } finally { f.cleanup() }
})

test('modal timing calls the original once with exact receiver, arguments, result and thrown object, then restores descriptors', () => {
  for (const ownModal of [false, true]) {
    const f = observerFixture({ ownModal }), descriptor = Object.getOwnPropertyDescriptor(f.scene, 'setModalSuspended')
    try {
      installShamanCastingObserver(); subsequentFixture(f)
      const world = structuredClone(f.world), receiver = { modalSuspended: false }, extra = {}
      assert.equal(f.scene.setModalSuspended.call(receiver, true, extra), f.returned)
      assert.equal(receiver.modalSuspended, true)
      assert.equal(f.scene.modalSuspended, false)
      assert.equal(f.scene.setModalSuspended(true), f.returned)
      f.failModal()
      assert.throws(() => f.scene.setModalSuspended(false), error => error === f.thrown)
      const result = f.win.shamanCastingObserver.finish(), calls = f.calls.filter(row => row[0] === 'modal'),
        rows = result.timing.events.filter(row => row.event.startsWith('modal-setter'))
      assert.equal(calls.length, 3)
      assert.equal(calls[0][1], receiver); assert.deepEqual(calls[0][2], [true, extra])
      assert.equal(calls[1][1], f.scene); assert.deepEqual(calls[1][2], [true])
      assert.deepEqual(rows.map(row => row.event), Array(3).fill(['modal-setter-entry', 'modal-setter-exit']).flat())
      assert.deepEqual(rows.filter(row => row.event.endsWith('exit')).map(row => row.completed), [true, true, false])
      assert.deepEqual(rows.filter(row => row.event.endsWith('entry')).map(row => row.receiverOwned), [false, true, true])
      assert.equal(rows[2].state.suspended, false); assert.equal(rows[3].state.suspended, true)
      assert.ok(rows.every((row, i) => i % 2 === 0 || row.at >= row.enteredAt))
      assert.deepEqual(f.world, world); assert.deepEqual(result.errors, [])
      assert.equal(result.restored, true)
      assert.deepEqual(Object.getOwnPropertyDescriptor(f.scene, 'setModalSuspended'), descriptor)
      assert.equal(f.listeners.length, 0)
    } finally { f.cleanup() }
  }
})

test('timing ownership loss and bounded overflow retain failure without suppressing the original modal call', () => {
  for (const failure of ['modal-owner', 'input-owner', 'overflow', 'crop']) {
    const f = observerFixture(), replacement = () => 'replacement'
    try {
      installShamanCastingObserver(); subsequentFixture(f)
      if (failure === 'modal-owner') f.scene.setModalSuspended = replacement
      else if (failure === 'input-owner') f.win.shamanCastingInputTiming.record = replacement
      else if (failure === 'overflow') {
        const listener = f.listeners.find(row => row.type === 'keydown').callback
        for (let i = 0; i < 40; i++) listener({ key: 'F9', isTrusted: true, repeat: true })
      } else {
        f.scene.picking.personBounds = () => null
        f.renderer.render(f.scene.scene, f.scene.camera)
      }
      const world = structuredClone(f.world)
      if (failure !== 'modal-owner') {
        assert.equal(f.scene.setModalSuspended(true), f.returned)
        assert.equal(f.calls.filter(row => row[0] === 'modal').length, 1)
      }
      const result = f.win.shamanCastingObserver.finish()
      assert.ok(result.errors.length > 0)
      assert.ok(result.timing.events.length <= 32)
      assert.equal(result.casts.length, 2); assert.equal(result.closed, true)
      assert.deepEqual(f.world, world)
      if (failure === 'modal-owner') assert.equal(f.scene.setModalSuspended, replacement)
      if (failure === 'input-owner') assert.equal(f.win.shamanCastingInputTiming.record, replacement)
      if (failure === 'crop') {
        assert.equal(result.casts[1].frames.length, 1)
        assert.equal(result.casts[1].crops.length, 0)
        assert.ok(result.timing.events.some(row => row.event === 'first-running-render'))
        assert.ok(!result.timing.events.some(row => row.event === 'crop-complete'))
      }
      assert.equal(result.restored, failure !== 'modal-owner' && failure !== 'input-owner')
    } finally { f.cleanup() }
  }
})

test('failed modal wrapper installation restores previously installed callbacks and removes early input timing', () => {
  const f = observerFixture()
  try {
    Object.defineProperty(f.scene, 'setModalSuspended', { value: f.modal, writable: false, configurable: false })
    const descriptor = Object.getOwnPropertyDescriptor(f.scene, 'setModalSuspended')
    assert.throws(installShamanCastingObserver, TypeError)
    assert.deepEqual(Object.getOwnPropertyDescriptor(f.scene, 'setModalSuspended'), descriptor)
    assert.equal(f.scene.gameClock.afterTurn, f.turn); assert.equal(f.renderer.render, f.render)
    assert.equal(f.listeners.length, 0); assert.deepEqual(f.calls, [])
  } finally { f.cleanup() }
})

function deferred() {
  let resolve, reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

function notificationPage(f, { click = Promise.resolve(), keyboard = Promise.resolve(), renderOnClick = true } = {}) {
  const frame = {}, calls = [], callbacks = [], messages = [], listeners = new Map()
  let closed = false, disposed = 0, bindingName
  const page = {
    mainFrame: () => frame, isClosed: () => closed,
    on(name, callback) { listeners.set(name, callback) },
    off(name, callback) { if (listeners.get(name) === callback) listeners.delete(name) },
    evaluate: async (callback, value) => callback(value),
    async exposeBinding(name, callback) {
      bindingName = name; callbacks.push(callback)
      f.win[name] = message => {
        messages.push(message)
        try { return Promise.resolve(callback({ page, frame }, message)) }
        catch (error) { return Promise.reject(error) }
      }
      return { async dispose() { disposed++; delete f.win[name] } }
    },
    mouse: { click(x, y) {
      calls.push(['click', x, y]); f.allocate('subsequent', false)
      if (renderOnClick) f.renderer.render(f.scene.scene, f.scene.camera)
      return click
    } },
    keyboard: { press(key) {
      calls.push(['key', key])
      f.listeners.find(row => row.type === 'keydown').callback({ key, isTrusted: true, repeat: false })
      return keyboard
    } },
  }
  return { page, frame, calls, messages, callbacks, listeners,
    binding: () => bindingName, disposed: () => disposed,
    close() { closed = true; listeners.get('close')?.() },
    navigate() { listeners.get('framenavigated')?.(frame) },
  }
}

test('prearmed first-copy notification dispatches exactly one public F9 only after click completion', async () => {
  for (const notificationFirst of [true, false]) {
    const f = observerFixture(), click = deferred(), report = {}
    let dispatch
    try {
      installShamanCastingObserver(); armSubsequent(f)
      const p = notificationPage(f, { click: click.promise, renderOnClick: notificationFirst })
      dispatch = await prepareCastingF9(p.page, report, f.world.stats.cast, performance.now() + 12000)
      assert.deepEqual(p.calls, [])
      const action = dispatch.click({ x: 110, y: 120 })
      assert.deepEqual(p.calls, [['click', 110, 120]])
      if (notificationFirst) assert.equal(p.messages[0].kind, 'ready')
      click.resolve(); await Promise.resolve()
      if (!notificationFirst) {
        assert.deepEqual(p.calls, [['click', 110, 120]])
        f.renderer.render(f.scene.scene, f.scene.camera)
        assert.deepEqual(p.calls, [['click', 110, 120], ['key', 'F9']], 'Dispatch starts in the notification callback')
      }
      await action
      await dispatch.close()
      assert.deepEqual(p.calls, [['click', 110, 120], ['key', 'F9']])
      assert.equal(p.disposed(), 1); assert.equal(p.listeners.size, 0)
      const host = report.castingNotification, operations = report.castingHostTiming.operations
      assert.equal(host.clock, 'host.performance.now')
      assert.equal(host.pageNotification.clock, 'page.performance.now')
      assert.ok(host.dispatchAt >= host.clickCompletedAt && host.dispatchAt >= host.receivedAt)
      assert.deepEqual(operations.map(row => [row.operation, row.completed]), [['pointer-click', true], ['keyboard-press', true]])
      assert.ok(operations[1].start >= operations[0].end)
      assert.deepEqual(f.win.shamanCastingObserver.finish().errors, [])
    } finally { await dispatch?.close().catch(() => {}); f.cleanup() }
  }
})

test('duplicate, stale and invalidated notifications reject without a second or premature input', async () => {
  for (const failure of ['duplicate', 'token', 'frame', 'person', 'expired', 'observer', 'first-copy']) {
    const f = observerFixture(), click = deferred(), report = {}
    let dispatch
    try {
      installShamanCastingObserver(); armSubsequent(f)
      const p = notificationPage(f, { click: click.promise })
      dispatch = await prepareCastingF9(p.page, report, f.world.stats.cast, performance.now() + 12000)
      if (failure === 'first-copy') f.scene.picking.personBounds = () => null
      const action = dispatch.click({ x: 1, y: 2 })
      if (failure === 'first-copy') assert.equal(p.messages[0].kind, 'invalid')
      else if (failure === 'expired') {
        f.world.units[0].casting = null; f.world.turn++; f.scene.gameClock.afterTurn()
      } else if (failure === 'observer') {
        f.win.testSceneRef.current = {}; f.renderer.render(f.scene.scene, f.scene.camera)
      } else {
        const message = { ...p.messages[0] }, source = { page: p.page, frame: p.frame }
        if (failure === 'token') message.token += '-stale'
        if (failure === 'frame') source.frame = {}
        if (failure === 'person') message.personId++
        assert.throws(() => p.callbacks[0](source, message))
      }
      click.resolve()
      await assert.rejects(action)
      await assert.rejects(dispatch.close())
      assert.deepEqual(p.calls, [['click', 1, 2]])
      assert.equal(p.disposed(), 1); assert.equal(p.listeners.size, 0)
      assert.ok(report.castingNotification.failure)
    } finally { click.resolve(); await dispatch?.close().catch(() => {}); f.cleanup() }
  }
})

test('partially acknowledged subscription setup is disarmed and disposed before propagating its original failure', async () => {
  const f = observerFixture(), report = {}, thrown = Error('subscription reply lost')
  try {
    installShamanCastingObserver(); armSubsequent(f)
    const p = notificationPage(f), evaluate = p.page.evaluate
    let calls = 0
    p.page.evaluate = async (callback, value) => {
      const result = await evaluate(callback, value)
      if (++calls === 1) throw thrown
      return result
    }
    await assert.rejects(prepareCastingF9(p.page, report, f.world.stats.cast, performance.now() + 12000), error => error === thrown)
    assert.equal(calls, 2)
    assert.equal(p.disposed(), 1); assert.equal(p.listeners.size, 0)
    f.allocate('subsequent', false)
    f.renderer.render(f.scene.scene, f.scene.camera)
    assert.deepEqual(p.calls, []); assert.deepEqual(p.messages, [])
    assert.deepEqual(f.win.shamanCastingObserver.finish().errors, [])
  } finally { f.cleanup() }
})

test('rejected click or keyboard preserves the first failure and closes notification ownership', async () => {
  for (const fails of ['click', 'keyboard']) {
    const f = observerFixture(), click = deferred(), keyboard = deferred(), report = {}, thrown = Error(fails)
    let dispatch
    try {
      installShamanCastingObserver(); armSubsequent(f)
      const p = notificationPage(f, { click: click.promise, keyboard: keyboard.promise })
      dispatch = await prepareCastingF9(p.page, report, f.world.stats.cast, performance.now() + 12000)
      const action = dispatch.click({ x: 1, y: 2 })
      if (fails === 'click') click.reject(thrown)
      else { click.resolve(); await Promise.resolve(); keyboard.reject(thrown) }
      await assert.rejects(action, error => error === thrown)
      await assert.rejects(dispatch.close(), error => error === thrown)
      assert.deepEqual(p.calls, fails === 'click' ? [['click', 1, 2]] : [['click', 1, 2], ['key', 'F9']])
      assert.equal(report.castingHostTiming.operations.at(-1).completed, false)
      assert.equal(p.disposed(), 1)
    } finally { click.resolve(); keyboard.resolve(); await dispatch?.close().catch(() => {}); f.cleanup() }
  }
})

test('timeout, close, navigation and cleanup suppress late notifications and pending-click dispatch', async () => {
  for (const stop of ['timeout', 'close', 'navigation', 'cleanup', 'deadline']) {
    const f = observerFixture(), click = deferred(), report = {}
    let dispatch
    try {
      installShamanCastingObserver(); armSubsequent(f)
      const p = notificationPage(f, { click: click.promise })
      dispatch = await prepareCastingF9(p.page, report, f.world.stats.cast,
        stop === 'deadline' ? performance.now() - 1 : performance.now() + 12000).catch(error => {
        assert.equal(stop, 'deadline'); return null
      })
      if (!dispatch) { assert.deepEqual(p.calls, []); assert.equal(p.disposed(), 1); continue }
      const action = dispatch.click({ x: 1, y: 2 })
      if (stop === 'timeout') { report.timedOut = true; dispatch.cancel(Error('watchdog')) }
      if (stop === 'close') p.close()
      if (stop === 'navigation') p.navigate()
      if (stop === 'cleanup') await dispatch.close()
      click.resolve()
      await assert.rejects(action)
      await dispatch.close().catch(() => {})
      assert.throws(() => p.callbacks[0]({ page: p.page, frame: p.frame }, p.messages[0]), /cancelled|closed|deadline/)
      assert.deepEqual(p.calls, [['click', 1, 2]])
      assert.equal(p.disposed(), 1); assert.equal(p.listeners.size, 0)
    } finally { click.resolve(); await dispatch?.close().catch(() => {}); f.cleanup() }
  }
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
    f.renderer.render(f.scene.scene, f.scene.camera)
    f.scene.modalSuspended = true
    const world = structuredClone(f.world), calls = f.calls.length
    observer.beginHold()
    assert.equal(f.calls.length, calls, 'Starting a hold cannot drive callbacks')
    f.renderer.render(f.scene.scene, f.scene.camera)
    f.renderer.render(f.scene.scene, f.scene.camera)
    f.rafStep(); f.rafStep(351)
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
      return { click: async () => actions.push(['button', String(name)]) }
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
    ['button', 'Resume game'], ['button', 'Pause game'], ['button', 'Select and focus shaman'],
    ['install'], ['arm'], ['title', 'spells'], ['button', '/^Blast, [1-9][0-9]* shots$/'],
    ['button', 'Resume game'], ['move', 500, 300], ['pointer', 500, 300], ['button', 'Pause game'],
  ])
  assert.match(actions.find(([kind]) => kind === 'wait')[2], /order\?\.model !== 18/)
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
      "window.shamanCastingObserver.arm('subsequent')", 'await prepareCastingF9(page, report, target.before, started + spellTestLimitMs)',
      'await castingDispatch.click(target)',
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
    end = source.indexOf('\n  if (failed) throw failure', start),
    body = source.slice(start, end).replace(/\n {2}}\s*$/, ''),
    failureStart = source.indexOf('  const recordFailure = error => {'),
    failureEnd = source.indexOf('\n  const diagnostics =', failureStart),
    failureOwner = source.slice(failureStart, failureEnd)
  assert.ok(start > 0 && end > start)
  assert.ok(failureStart >= 0 && failureEnd > failureStart)
  const { assertSpellTestDeadline, closeSpellTestContext } = await import('../scripts/tutorial-browser/spell-test-menu.mjs')
  for (const expired of [false, true]) for (const attempted of [false, true]) for (const retentionFails of [false, true]) {
    const calls = [], original = new Error('original F9 failure'), report = { status: 'failed' },
      page = { isClosed: () => false },
      bindings = { castingDispatch: undefined, started: performance.now() - (expired ? 75001 : 0), assertSpellTestDeadline, closeSpellTestContext, clearTimeout: () => calls.push('clearTimer'), timer: 1, page, output: 'output', report,
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
      `return (async () => { let failed = true; ${failureOwner}\n${body}\nreturn { failure, castingRetentionAttempted } })()`)
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


test('retained modal frame accepts independent RAF observations without fabricating rendered samples', () => {
  const result = evidence()
  result.casts[1].frames = result.casts[1].frames.filter(frame => !frame.suspended)
  const accepted = validateShamanCastingEvidence(result).activeCastPauseHold
  assert.equal(accepted.renderedFrames, 0)
  assert.equal(accepted.rafStateSamples, 2)
  assert.equal(accepted.rafStateSpanMs, 350)
})

test('RAF hold evidence rejects missing, duplicate, brief, out-of-bounds or advanced observations', () => {
  for (const mutate of [
    r => { delete r.holds[0].samples },
    r => { r.holds[0].samples[1].at = r.holds[0].samples[0].at },
    r => { r.holds[0].samples[1].frameTime = r.holds[0].samples[0].frameTime },
    r => { r.holds[0].samples[1].at-- },
    r => { r.holds[0].samples[0].at-- },
    r => { r.holds[0].samples[1].at++ },
    r => { r.holds[0].samples[0].stamp-- },
    r => { r.holds[0].samples[1].stamp = r.holds[0].after.stamp + 1 },
    r => { r.holds[0].samples[1].frameTime = r.holds[0].samples[1].at + 1 },
    r => { r.holds[0].samples[1].state.turn++ },
    r => { r.holds[0].samples[1].state.person.f2++ },
    r => { r.holds[0].samples[1].state.person.sameOwner = false },
    r => { r.holds[0].samples[1].state.projectiles[0].remaining-- },
    r => { r.holds[0].samples[1].state.suspended = false },
  ]) {
    const result = evidence(); mutate(result)
    assert.throws(() => validateShamanCastingEvidence(result), undefined, String(mutate))
  }
})

test('owned hold RAF sampler observes without drawing and cancels on completion, error and finish', () => {
  for (const end of ['success', 'finish', 'owner', 'person', 'shot', 'missing', 'end-owner']) {
    const f = observerFixture()
    try {
      installShamanCastingObserver()
      const observer = f.win.shamanCastingObserver
      f.allocate()
      for (let i = 0; i < 12; i++) { f.world.turn++; f.scene.gameClock.afterTurn() }
      f.world.mode = 'blast'; f.person.state = 10; f.world.projectiles = []
      f.allocate('subsequent'); f.renderer.render(f.scene.scene, f.scene.camera)
      f.scene.modalSuspended = true
      const world = structuredClone(f.world), calls = f.calls.length, stamp = f.renderer.info.render.frame
      observer.beginHold()
      if (end === 'missing') assert.throws(() => observer.endHold(), /RAF state observations/)
      else {
        f.rafStep()
        if (end === 'owner' || end === 'end-owner') f.win.testSceneRef.current = {}
        if (end === 'person') f.world.units[0].native = { ...f.person }
        if (end === 'shot') f.world.projectiles[0] = { ...f.world.projectiles[0] }
        if (end === 'end-owner') {
          assert.throws(() => observer.endHold(), /changed/)
          assert.equal(f.rafs.size, 0, 'Ownership failure at end also cancels pending sampler')
        } else f.rafStep(351)
        if (end === 'success') observer.endHold()
      }
      const result = observer.finish()
      assert.equal(f.rafs.size, 0)
      f.rafStep(400)
      assert.equal(f.calls.length, calls, 'Sampler never submits rendering or advances simulation')
      assert.equal(f.renderer.info.render.frame, stamp)
      assert.deepEqual(f.world, world)
      if (['owner', 'person', 'shot', 'end-owner'].includes(end)) assert.ok(result.errors.length)
      else assert.deepEqual(result.errors, [])
      assert.equal(result.restored, true)
      assert.equal(result.closed, true)
      assert.equal(Object.keys(result.holds[0]).includes('person'), false)
    } finally { f.cleanup() }
  }
})


test('RAF coverage wait belongs only to the installed active-cast hold and retains its order and bound', async () => {
  const source = readFileSync(new URL('../scripts/tutorial-browser/spell-test-menu.mjs', import.meta.url), 'utf8'),
    start = source.indexOf('    await page.evaluate(() => window.shamanCastingObserver.beginHold())'),
    endLine = '    await page.evaluate(() => window.shamanCastingObserver.endHold())',
    end = source.indexOf(endLine, start) + endLine.length,
    prefix = source.slice(0, source.indexOf('await beginOrdinaryCastingWitness(page)'))
  assert.ok(start > 0 && end > start)
  assert.equal(prefix.includes('holdRafCoverageMs'), false, 'Initial live hold has no installed casting observer')
  assert.equal(source.split('holdRafCoverageMs').length - 1, 1)
  const calls = [], saved = Object.getOwnPropertyDescriptor(globalThis, 'window')
  let open = false
  globalThis.window = { shamanCastingObserver: {
    beginHold() { open = true; calls.push('begin') },
    status() { assert.equal(open, true); calls.push('sample'); return { errors: [], holdRafCoverageMs: 350 } },
    endHold() { assert.equal(open, true); open = false; calls.push('end') },
  } }
  const page = {
    evaluate: async callback => callback(),
    waitForTimeout: async ms => { assert.equal(open, true); assert.equal(ms, 350); calls.push('wait350') },
    waitForFunction: async (predicate, argument, options) => {
      assert.equal(open, true); assert.equal(argument, null)
      assert.deepEqual(options, { polling: 'raf', timeout: 1000 })
      assert.equal(predicate(), true); calls.push('coverage')
    },
  }
  try {
    await new Function('page', `return (async () => { ${source.slice(start, end)} })()`)(page)
    assert.deepEqual(calls, ['begin', 'wait350', 'sample', 'coverage', 'end'])
  } finally {
    if (saved) Object.defineProperty(globalThis, 'window', saved)
    else delete globalThis.window
  }
})


test('RAF hold accepts the exact failed-artifact shape: last suspended render precedes hold with unchanged stamp', () => {
  const result = evidence(), hold = result.holds[0], frames = result.casts[1].frames
  frames[2].at = 155
  frames.splice(3, 1)
  hold.before.stamp = 132; hold.after.stamp = 132
  for (const sample of hold.samples) sample.stamp = 132
  const accepted = validateShamanCastingEvidence(result).activeCastPauseHold
  assert.equal(accepted.renderedFrames, 0)
  assert.equal(accepted.retainedRenderedFrames, 1)
  assert.equal(accepted.rafStateSpanMs, 350)
  for (const corrupt of [
    r => { r.casts[1].frames[2].person.timer-- },
    r => { r.casts[1].frames[2].stamp-- },
    r => { r.casts[1].frames[2].at = 511 },
  ]) {
    const invalid = structuredClone(result); corrupt(invalid)
    assert.throws(() => validateShamanCastingEvidence(invalid))
  }
})
