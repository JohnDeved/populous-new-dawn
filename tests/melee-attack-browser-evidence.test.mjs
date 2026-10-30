import assert from 'node:assert/strict'
import test from 'node:test'
import meleeAttack, { installMeleeFrameObserver, meleeAttackMapping, assertMeleeRouteReady,
  readMeleeRouteState, meleeTargetPoint, meleeCameraInput, shiftClickMeleeTarget } from '../scripts/tutorial-browser/melee-attack.mjs'
import { meleeRunningProtocol, validateMeleeRunningObservation } from '../scripts/tutorial-browser/melee-attack-running-evidence.mjs'
import { validateRecoilObservation } from '../scripts/tutorial-browser/melee-recoil-evidence.mjs'
import { spriteDirection } from '../app/projection.ts'
import { minimapPick } from '../app/minimap.ts'
import rules from '../app/original-rules.json' with { type: 'json' }
import units from '../app/original-units.json' with { type: 'json' }

test('functional melee artwork context uses a fixed 960x720 viewport at DPR1', async () => {
  const stop = new Error('stop before browser creation')
  const browser = { async newContext(options) {
    assert.deepEqual(options, { viewport: { width: 960, height: 720 }, deviceScaleFactor: 1 })
    throw stop
  } }
  await assert.rejects(meleeAttack({ browser }), error => error === stop)
})

// Independent original data, not the production melee pose selector. Synthetic
// observations exercise evidence rejection; they do not claim a rendered run.
const mapping = {}
for (const [action, row] of [['attack', 10], ['strike', 8], ['special', 16]]) {
  const [object, draw] = rules.animationObjects[rules.personAnimationObjects[row * 9 + 7]]
  mapping[`shaman:${action}`] = { object, draw, step: rules.animationDescriptors[draw].step, frameCount: units.frameCounts[object],
    duration: (rules.animationDescriptors[draw].step + 1) * units.frameCounts[object],
    directions: units.shamanSources[object] }
}

test('public attack input presses Shift for the real click and releases it on success or failure', async () => {
  for (const failure of [null, 'down', 'click']) {
    const calls = [], point = { x: 818, y: 294 }
    const page = { keyboard: {
      async down(key) { calls.push(['down', key]); if (failure === 'down') throw Error('supplied keydown failure') },
      async up(key) { calls.push(['up', key]) },
    }, mouse: { async click(x, y) { calls.push(['click', x, y]); if (failure === 'click') throw Error('supplied click failure') } } }
    if (failure) await assert.rejects(shiftClickMeleeTarget(page, point), /supplied .* failure/)
    else await shiftClickMeleeTarget(page, point)
    assert.deepEqual(calls, failure === 'down'
      ? [['down', 'Shift'], ['up', 'Shift']]
      : [['down', 'Shift'], ['click', 818, 294], ['up', 'Shift']])
  }
})

test('one fixed minimap corridor offset retains nearest input and scales backing pixels into CSS', () => {
  const minimap = { width: 200, height: 192, rect: { x: 0, y: 0, width: 200, height: 192 },
    center: { x: -25344, y: 23808 }, heading: 1549, target: { x: 25344, y: -32512 } }
  const before = structuredClone(minimap), original = meleeCameraInput(minimap)
  assert.deepEqual(minimap, before)
  assert.deepEqual([original.nearest.x, original.nearest.y], [132, 42])
  assert.deepEqual(original.nearest.native, { x: 25292, y: 32963 })
  assert.deepEqual(original.offsetBacking, { x: 0, y: 12 })
  assert.deepEqual(original.backing, { x: 132, y: 54 })
  assert.deepEqual([original.x, original.y], [132, 54])
  assert.deepEqual(original.native, { x: 28566, y: 32817 })
  const scaled = meleeCameraInput({ ...minimap, rect: { x: 11, y: 13, width: 100, height: 384 } })
  assert.deepEqual([scaled.nearest.x, scaled.nearest.y], [77, 97])
  assert.deepEqual([scaled.x, scaled.y], [77, 121])
  assert.deepEqual(scaled.backing, original.backing); assert.deepEqual(scaled.native, original.native)
  const recoil = meleeCameraInput(minimap, true)
  assert.deepEqual(recoil.offsetBacking, { x: 0, y: 0 })
  assert.deepEqual([recoil.x, recoil.y], [original.nearest.x, original.nearest.y])
  assert.deepEqual(recoil.native, original.nearest.native)
  const scaledRecoil = meleeCameraInput({ ...minimap, rect: { x: 11, y: 13, width: 100, height: 384 } }, true)
  assert.deepEqual([scaledRecoil.x, scaledRecoil.y], [scaled.nearest.x, scaled.nearest.y])
  assert.deepEqual(scaledRecoil.native, recoil.native)
  assert.throws(() => meleeCameraInput(minimap, 'yes'))
  assert.deepEqual(minimap, before)
})

test('fixed minimap offset rejects invalid dimensions and an out-of-bounds shifted point without clamping', () => {
  const minimap = { width: 200, height: 192, rect: { x: 0, y: 0, width: 200, height: 192 },
    center: { x: -25344, y: 23808 }, heading: 1554 }
  minimap.target = minimapPick(minimap.width, minimap.height, minimap.center, minimap.heading, { x: 100, y: 188 })
  const before = structuredClone(minimap)
  assert.throws(() => meleeCameraInput(minimap), /must remain inside the minimap/)
  assert.deepEqual(minimap, before)
  for (const change of [{ width: 0 }, { height: -1 }, { rect: { ...minimap.rect, height: 0 } },
    { rect: { ...minimap.rect, x: NaN } }])
    assert.throws(() => meleeCameraInput({ ...minimap, ...change }))
})

// Supplied DOM/event fixture, not browser acceptance. The bounds reproduce the
// second hosted failure; owner selection below is explicit test input.
async function withPointerFixture(ownerAt, run, { failWait = false, hoveredId = 20 } = {}) {
  const bounds = { x: 813, y: 466, width: 22, height: 37 }, attempts = [], saved = [], moves = []
  const element = (tagName, className, rect) => ({ tagName, className,
    getAttribute: () => null, getBoundingClientRect: () => rect })
  const canvas = element('CANVAS', '', { x: 200, y: 0, width: 1240, height: 1000 })
  const badge = element('BUTTON', 'paused-badge', { x: 723, y: 410, width: 193, height: 79 })
  const scene = { renderer: { domElement: canvas, info: { render: { frame: 108 } } },
    hoveredObject: null, pointerScreen: null }
  const replacements = { window: { testSceneRef: { current: scene } },
    document: { elementFromPoint: (x, y) => ownerAt({ x, y }) ? canvas : badge } }
  const descriptors = new Map(Object.keys(replacements).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]))
  const save = () => saved.push(structuredClone(attempts))
  const page = { evaluate: (fn, arg) => fn(arg),
    mouse: { async move(x, y) {
      assert.equal(ownerAt({ x, y }), true, 'blocked points must not receive synthetic movement')
      moves.push({ x, y }); scene.pointerScreen = { clientX: x, clientY: y }; scene.hoveredObject = hoveredId
    } },
    async waitForFunction(fn, arg) {
      assert.equal(fn(arg), false, 'a pointer move alone must not satisfy the later-render requirement')
      if (failWait) throw Error('supplied pointer-render timeout')
      scene.renderer.info.render.frame++
      assert.equal(fn(arg), true, 'the same predicate requires supplied pointer coordinates and a later render')
    } }
  try {
    for (const [key, value] of Object.entries(replacements))
      Object.defineProperty(globalThis, key, { configurable: true, writable: true, value })
    return await run({ page, bounds, attempts, saved, moves, save })
  } finally {
    for (const [key, descriptor] of descriptors)
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else delete globalThis[key]
  }
}

test('public target helper retains blocked first candidate and requires actual hover at exposed second', async () => {
  await withPointerFixture(point => point.y >= 489, async ({ page, bounds, attempts, saved, moves, save }) => {
    assert.deepEqual(await meleeTargetPoint(page, bounds, attempts, save), { x: 824, y: 490 })
    assert.deepEqual(moves, [{ x: 824, y: 490 }])
    assert.equal(attempts.length, 2)
    assert.deepEqual(attempts[0].point, { x: 824, y: 484 })
    assert.equal(attempts[0].status, 'blocked'); assert.equal(attempts[0].before.canvasOwnsPoint, false)
    assert.equal(attempts[0].before.owner.className, 'paused-badge')
    assert.equal(attempts[1].after.id, 20); assert.equal(attempts[1].after.canvasOwnsPoint, true)
    assert.deepEqual(attempts[1].after.pointerScreen, { clientX: 824, clientY: 490 })
    assert.equal(attempts[1].after.stamp, 109)
    assert.deepEqual(saved.at(-1), attempts)
  })
})

test('all blocked fixed target candidates fail closed with their complete saved owner trace', async () => {
  await withPointerFixture(() => false, async ({ page, bounds, attempts, saved, moves, save }) => {
    await assert.rejects(meleeTargetPoint(page, bounds, attempts, save), /Public pointer route must identify/)
    assert.deepEqual(attempts.map(attempt => attempt.point), [
      { x: 824, y: 484 }, { x: 824, y: 490 }, { x: 820, y: 484 }, { x: 827, y: 484 }, { x: 824, y: 478 },
    ])
    assert.ok(attempts.every(attempt => attempt.status === 'blocked' && !attempt.before.canvasOwnsPoint))
    assert.deepEqual(moves, []); assert.equal(saved.length, 5); assert.deepEqual(saved.at(-1), attempts)
  })
})

test('exposed target candidates cannot pass on the wrong hover winner and pending waits retain trace', async () => {
  await withPointerFixture(() => true, async ({ page, bounds, attempts, saved, save }) => {
    await assert.rejects(meleeTargetPoint(page, bounds, attempts, save), /Public pointer route must identify/)
    assert.equal(attempts.length, 5); assert.ok(attempts.every(attempt => attempt.after.id === 13))
    assert.deepEqual(saved.at(-1), attempts)
  }, { hoveredId: 13 })
  await withPointerFixture(() => true, async ({ page, bounds, attempts, saved, save }) => {
    await assert.rejects(meleeTargetPoint(page, bounds, attempts, save), /supplied pointer-render timeout/)
    assert.equal(attempts.length, 1); assert.equal(attempts[0].status, 'moving')
    assert.deepEqual(saved.at(-1), attempts)
  }, { failWait: true })
})

test('browser mapping reads all original Shaman attack rows independently of observed poses', () => {
  const actual = meleeAttackMapping()
  assert.deepEqual(Object.keys(actual).sort(), ['shaman:attack', 'shaman:special', 'shaman:strike'])
  for (const action of ['attack', 'strike', 'special'])
    assert.deepEqual(actual[`shaman:${action}`], mapping[`shaman:${action}`])
  assert.deepEqual([actual['shaman:strike'].object, actual['shaman:strike'].draw], [456, 14])
  actual['shaman:strike'].directions[0].frames[0] = -1
  assert.equal(meleeAttackMapping()['shaman:strike'].directions[0].frames[0], 998,
    'a caller cannot mutate the retained tables through an earlier mapping result')
})

test('ordinary M2 startup rejects hidden Warrior13 and admits the visible authored Shaman20 route', async () => {
  const { createWorld, canPickUnit, select, command } = await import('../app/model.ts')
  const { finishLevelStart } = await import('./level-start-fixture.mjs')
  const { advanceGame } = await import('../app/game-clock.ts')
  const { zoomPreset } = await import('../app/camera-view.ts')
  const world = finishLevelStart(createWorld(2)), clock = { animationTime: 0, animationFrame: 0 }
  while (world.turn < 120) advanceGame(world, clock, 1 / 12)
  const hidden = world.units.find(unit => unit.id === 13), target = world.units.find(unit => unit.id === 20)
  assert.deepEqual([hidden.x, hidden.z, hidden.inside], [103.03515625, 117.01171875, 71])
  assert.equal(canPickUnit(world, hidden), false, 'the first hosted case targeted an ineligible occupant')
  assert.equal(canPickUnit(world, target), true)
  const state = { sceneAvailable: true, sceneStoreMatch: true, selected: [54], paused: true, speed: 1,
    inputMask: 0, drawMode: 0, target: { ...target, visible: target.inside === null, pickable: canPickUnit(world, target) },
    camera: { preset: zoomPreset(0, false), overview: false, transitioning: false, active: 0, resultActive: 0 } }
  const before = structuredClone(state)
  assert.doesNotThrow(() => assertMeleeRouteReady(state)); assert.deepEqual(state, before)
  assert.doesNotThrow(() => assertMeleeRouteReady({ ...state, paused: false }, false))
  assert.throws(() => assertMeleeRouteReady(state, false), /Expected values to be strictly equal/)
  assert.throws(() => assertMeleeRouteReady({ ...state, paused: false }), /Expected values to be strictly equal/)
  assert.throws(() => assertMeleeRouteReady({ ...state, target: { ...state.target, inside: 71 } }), /outside/)
  assert.throws(() => assertMeleeRouteReady({ ...state, target: { ...state.target, pickable: false } }), /eligible/)
  assert.throws(() => assertMeleeRouteReady({ ...state, target: { ...state.target, visible: false } }), /visible/)
  for (const changed of [{ preset: 4 }, { overview: true }, { transitioning: true }, { active: 1 }])
    assert.throws(() => assertMeleeRouteReady({ ...state, camera: { ...state.camera, ...changed } }))
  assert.throws(() => assertMeleeRouteReady({ ...state, drawMode: 4 }))
  select(world, 'shaman'); assert.equal(command(world, target), true)
  const actor = world.units.find(unit => unit.id === 54)
  assert.equal(actor.target, 20)
  for (let turns = 0; turns < 400 && !['attack', 'strike', 'special'].includes(actor.fight?.action); turns++)
    advanceGame(world, clock, 1 / 12)
  assert.ok(['attack', 'strike', 'special'].includes(actor.fight?.action), 'eligible public target reaches ordinary melee')
  assert.equal(actor.fight.motion.object, mapping[`shaman:${actor.fight.action}`].object)
  assert.ok(world.units.some(unit => unit.id === actor.fight.opponent && unit.team === 'green'))
})

test('ordinary M2 center fighter keeps each attack entry but can choose a different opponent after expiry', async () => {
  const { createWorld, select, command } = await import('../app/model.ts')
  const { finishLevelStart } = await import('./level-start-fixture.mjs')
  const { advanceGame } = await import('../app/game-clock.ts')
  const world = finishLevelStart(createWorld(2)), clock = { animationTime: 0, animationFrame: 0 }
  while (world.turn < 134) advanceGame(world, clock, 1 / 12)
  select(world, 'shaman'); assert.equal(command(world, world.units.find(unit => unit.id === 20)), true)
  const actor = world.units.find(unit => unit.id === 54), entries = []
  let person, previous, firstTurn
  // Ordinary simulation only: no World/position/health/RNG/AI edits or browser claim.
  for (let turn = 0; turn < 450; turn++) {
    advanceGame(world, clock, 1 / 12)
    if (firstTurn !== undefined && world.turn >= firstTurn + 10) break
    const fight = actor.fight
    if (!['attack', 'strike', 'special'].includes(fight?.action)) continue
    firstTurn ??= world.turn; person ??= fight.motion
    assert.equal(fight.motion, person)
    const entry = { started: fight.started, action: fight.action, opponent: fight.opponent, group: fight.group }
    const duration = mapping[`shaman:${fight.action}`].duration
    assert.equal(fight.remaining, duration - 1 - (world.turn - fight.started))
    if (previous) {
      assert.equal(entry.group, previous.group)
      if (entry.started === previous.started) assert.deepEqual(entry, previous)
      else assert.ok(entry.started >= previous.started + mapping[`shaman:${previous.action}`].duration)
    }
    if (!previous || entry.started !== previous.started) entries.push(entry)
    previous = entry
  }
  assert.deepEqual(entries, [
    { started: 395, action: 'special', opponent: 13, group: 1252 },
    { started: 400, action: 'attack', opponent: 1207, group: 1252 },
  ])
})

test('ordinary M2 command observes descriptor-derived first-entry expiry without changing gameplay state', async () => {
  const { createWorld, select, command } = await import('../app/model.ts')
  const { finishLevelStart } = await import('./level-start-fixture.mjs')
  const { advanceGame } = await import('../app/game-clock.ts')
  const world = finishLevelStart(createWorld(2)), clock = { animationTime: 0, animationFrame: 0 }
  while (world.turn < 130) advanceGame(world, clock, 1 / 12)
  select(world, 'shaman'); assert.equal(command(world, world.units.find(unit => unit.id === 20)), true)
  let entry, person, original
  const poses = []
  // Actual command/clock/combat only; no HP, position, enemy, RNG or AI edits.
  // This is a simulation endpoint regression, not rendered browser evidence.
  for (let visit = 0; visit < 450; visit++) {
    advanceGame(world, clock, 1 / 12)
    const actor = world.units.find(unit => unit.id === 54), fight = actor?.fight
    assert.ok(actor && actor.hp > 0, 'the authored first entry must reach its native endpoint alive')
    if (!entry) {
      if (!['attack', 'strike', 'special'].includes(fight?.action)) continue
      entry = { started: fight.started, action: fight.action, group: fight.group, opponent: fight.opponent }
      original = mapping[`shaman:${entry.action}`]; person = fight.motion
      assert.equal(world.turn, entry.started)
    }
    const endExclusive = entry.started + original.duration - 1
    assert.equal(fight.motion, person)
    for (const key of ['started', 'group', 'opponent']) assert.equal(fight[key], entry[key])
    assert.equal(person.object, original.object); assert.equal(person.draw, original.draw)
    assert.equal(person.stamp, world.turn)
    if (world.turn === endExclusive) {
      assert.equal(fight.action, 'approach'); assert.equal(fight.animation, entry.action)
      assert.equal(fight.remaining, undefined); assert.equal(fight.nativeAttackAnimation, true)
      assert.deepEqual([person.f1, person.f2], [0, original.duration - 1])
      assert.deepEqual(poses, Array.from({ length: original.duration - 1 }, (_, index) =>
        [entry.started + index, original.duration - 1 - index, 0, index]))
      return
    }
    assert.ok(world.turn < endExclusive); assert.equal(fight.action, entry.action)
    poses.push([world.turn, fight.remaining, person.f1, person.f2])
  }
  assert.fail('ordinary first-entry endpoint was not reached within the bounded simulation')
})

// Explicit supplied World/canvas/RAF diagnostic. No browser, actual game method,
// rendering, screenshot pixels, original-game timing or live campaign claim.
function withObserverFixture(run, observerInput = mapping) {
  const world = structuredClone({ turn: 40, paused: false, randomState: 12345,
    terrain: new Uint8Array([1, 2, 3]), selected: [54],
    units: [{ id: 54, kind: 'shaman', team: 'blue', hp: 120, heading: Math.PI,
      fight: { action: 'strike', animation: 'strike', started: 40, nativeAttackAnimation: true,
        group: 1252, opponent: 13, remaining: 3,
        motion: { id: 54, state: 25, speed: 0, class: 1, model: 7, workFlags: 1252,
          flags2: 0x1080, flags4: 0, object: 456, draw: 14, f1: 0, f2: 0, stamp: 40 } } }] })
  const layers = [
    { visible: true, userData: { piece: 90 } },
    { visible: true, userData: { piece: 91 } },
    { visible: false, userData: { piece: 92 } },
  ]
  const submitted = new Set([layers[0], layers[2]]), sourceCalls = [], drawCalls = [], cancellations = []
  const copies = [], operations = [], faults = { copy: null, readback: null, encoding: null }
  const rect = { width: 720, height: 500, left: 15, top: 25 }
  const canvas = { tagName: 'CANVAS', className: 'battlefield', width: 1440, height: 1000,
    isConnected: true, getBoundingClientRect: () => rect }
  const group = { visible: true, userData: { layers, frame: 998, frameFlip: false } }
  const noGameMethod = () => assert.fail('observer must not call a game update/render/pick method')
  const scene = { world, renderer: { domElement: canvas, info: { render: { frame: 100 } }, render: noGameMethod },
    gameClock: { animationFrame: 80 }, cameraBearing: 0, unitMeshes: new Map([[54, group]]),
    render: noGameMethod, animate: noGameMethod, updateUnitsFrame: noGameMethod,
    view: { painter: { source(layer) { sourceCalls.push(layer); return submitted.has(layer) ? { layer } : null } } },
    picking: { pick: noGameMethod, personBounds(id, actualRect) {
      assert.equal(id, 54); assert.equal(actualRect, rect)
      return { x: 100, y: 80, width: 30, height: 45 }
    } } }
  const pending = new Map(), window = { testSceneRef: { current: scene }, testStore: { getWorld: () => world } }
  let nextRaf = 1000, inCallback = false, clockMs = 1234
  const request = callback => { const id = ++nextRaf; pending.set(id, callback); return id }
  const unrelated = request(() => assert.fail('observer must not run an unrelated RAF'))
  const document = { visibilityState: 'visible', elementFromPoint: () => canvas, querySelectorAll: () => [], createElement(tag) {
    assert.equal(tag, 'canvas')
    const index = copies.length
    let captured
    const copy = { width: 0, height: 0,
      getContext(type) {
        assert.equal(type, '2d')
        return {
          drawImage(...args) {
            assert.equal(inCallback, true, 'copying is synchronous with the observer callback')
            assert.equal(captured, undefined, 'a private crop canvas is drawn exactly once')
            if (faults.copy === index) throw Error('supplied copy failure')
            assert.equal(args[0], canvas)
            assert.deepEqual(args.slice(1), [176, 136, copy.width, copy.height, 0, 0, copy.width, copy.height])
            captured = { stamp: scene.renderer.info.render.frame, turn: world.turn,
              frame: group.userData.frame, f2: world.units[0].fight.motion.f2 }
            drawCalls.push(captured)
            operations.push(['copy', index])
          },
          getImageData(...args) {
            assert.equal(inCallback, false, 'pixel readback/scan must wait until after the observation')
            operations.push(['readback', index])
            if (faults.readback === index) throw Error('supplied readback failure')
            assert.ok(captured, 'copy must be read after the same callback draws it')
            assert.deepEqual(args, [0, 0, copy.width, copy.height])
            return { data: new Uint8ClampedArray([0, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 0]) }
          },
        }
      },
      toDataURL(type) {
        assert.equal(inCallback, false, 'encoding must wait until after the observation')
        operations.push(['encoding', index])
        if (faults.encoding === index) throw Error('supplied encoding failure')
        assert.equal(type, 'image/png'); assert.ok(captured)
        return `data:image/png;base64,${Buffer.from(JSON.stringify(captured)).toString('base64')}`
      },
    }
    copies.push(copy)
    return copy
  } }
  const replacements = { window, document, requestAnimationFrame: request,
    cancelAnimationFrame(id) { cancellations.push(id); pending.delete(id) },
    performance: { now: () => ++clockMs }, getComputedStyle: () => ({ display: 'block', visibility: 'visible', opacity: '1' }) }
  const descriptors = new Map(Object.keys(replacements).map(key =>
    [key, Object.getOwnPropertyDescriptor(globalThis, key)]))
  try {
    for (const [key, value] of Object.entries(replacements))
      Object.defineProperty(globalThis, key, { configurable: true, writable: true, value })
    const before = structuredClone(world)
    // Match page.evaluate's serialization boundary: no module closure/import
    // may accidentally satisfy an undeclared browser dependency in this fixture.
    new Function(`return (${installMeleeFrameObserver.toString()})`)()(observerInput)
    assert.deepEqual(world, before, 'installation preserves the supplied World')
    const observation = window.__pndMeleeObservation
    const next = (timestamp = 1234) => {
      const entries = [...pending].filter(([id]) => id !== unrelated)
      assert.equal(entries.length, 1, 'only one observer RAF may be pending')
      const [id, callback] = entries[0]
      pending.delete(id)
      const before = structuredClone(world)
      inCallback = true
      try { callback(timestamp) } finally { inCallback = false }
      assert.deepEqual(world, before, 'each read/crop callback preserves the complete supplied World')
      return { id, callback }
    }
    return run({ world, scene, group, layers, window, next, pending, unrelated,
      observation, sourceCalls, drawCalls, cancellations, copies, operations, faults })
  } finally {
    try {
      const before = structuredClone(world)
      window.__pndMeleeObservation?.retain()
      assert.deepEqual(world, before, 'stopping/retaining crops preserves the complete supplied World')
    }
    finally {
      for (const [key, descriptor] of descriptors)
        if (descriptor) Object.defineProperty(globalThis, key, descriptor)
        else delete globalThis[key]
    }
  }
}

test('supplied observer keeps same-frame crop metadata and counts only visible submitted layers without World writes', () => {
  withObserverFixture(({ world, scene, group, layers, next, observation, sourceCalls, drawCalls }) => {
    next()
    const { result } = observation, first = result.samples[0], crop = result.crops[0]
    assert.equal(result.error, null); assert.equal(result.done, false)
    assert.equal(first.submittedLayers, 1)
    assert.deepEqual(first.pieces, [90, 91])
    assert.deepEqual(sourceCalls, layers.slice(0, 2), 'hidden layers are never counted as visible submissions')
    assert.equal(first.cropFile, crop.filename)
    assert.deepEqual([crop.turn, crop.stamp, crop.frame, crop.object, crop.f2], [40, 100, 998, 456, 0])
    assert.deepEqual(crop.clip, { x: 176, y: 136, width: 108, height: 138 })
    assert.equal(crop.opaqueColors, undefined); assert.equal(crop.png, undefined)
    scene.renderer.info.render.frame = 101; scene.gameClock.animationFrame = 81
    next()
    assert.equal(result.samples.length, 2); assert.equal(result.crops.length, 1)
    assert.equal(result.samples[1].cropFile, undefined, 'a held native frame is not recaptured')
    assert.deepEqual([result.samples[1].f2, result.samples[1].frame], [0, 998])
    // These explicit fixture transitions are not game/simulation invocations.
    world.turn = 41; world.units[0].fight.motion.f2 = 1; world.units[0].fight.motion.stamp = 41
    scene.renderer.info.render.frame = 102; scene.gameClock.animationFrame = 82; group.userData.frame = 999
    next()
    assert.equal(result.samples.length, 3); assert.equal(result.crops.length, 2)
    assert.equal(result.samples[2].cropFile, 'melee-attack-frame-1.png')
    assert.deepEqual(drawCalls, [{ stamp: 100, turn: 40, frame: 998, f2: 0 }, { stamp: 102, turn: 41, frame: 999, f2: 1 }])
    const before = structuredClone(world)
    observation.retain()
    assert.deepEqual(world, before)
    assert.equal(crop.opaqueColors, 2)
    assert.deepEqual(JSON.parse(Buffer.from(crop.png.split(',')[1], 'base64').toString()), drawCalls[0],
      'deferred encoding belongs to the exact earlier observed render stamp')
  })
})

test('running observer captures first four distinct poses and ends only on the first native expiry', () => {
  withObserverFixture(fixture => {
    const { observation, pending, unrelated } = fixture
    retainCompleteSpecialFrames(fixture)
    assert.equal(observation.result.samples.length, 6)
    assert.equal(observation.result.crops.length, 4)
    assert.deepEqual(observation.result.samples.map(s => s.cropPlanned), [true, false, true, true, true, false])
    assert.equal(observation.result.done, false, 'neither four crops nor an advancing pair ends the native entry')
    completeObserverEntry(fixture)
    assert.equal(observation.result.done, true); assert.equal(observation.result.samples.length, 6)
    assert.deepEqual([...pending.keys()], [unrelated])
    assert.equal(validateMeleeRunningObservation(observation.result, mapping).sequenceCount, 1)
  })
})

test('every observer visit retains timing and state through the inspected alive native endpoint', () => {
  withObserverFixture(({ world, scene, next, observation }) => {
    const fight = world.units[0].fight
    world.turn = 39; world.paused = true; fight.action = 'approach'; next(100)
    world.turn = 40; world.paused = false; fight.action = 'strike'; scene.renderer.info.render.frame++; next(120)
    scene.renderer.info.render.frame++; next(140)
    world.turn = 42; scene.renderer.info.render.frame++; next(160)
    world.turn = 43; fight.action = 'approach'; fight.remaining = undefined
    scene.renderer.info.render.frame++; next(180)
    const { result } = observation
    assert.deepEqual(result.visits.map(v => [v.turn, v.stamp, v.action, v.started, v.alive, v.stage]), [
      [39, 100, 'approach', 40, true, 'observed'], [40, 101, 'strike', 40, true, 'attack'],
      [40, 102, 'strike', 40, true, 'attack'], [42, 103, 'strike', 40, true, 'attack'],
      [43, 104, 'approach', 40, true, 'entry-complete'],
    ])
    assert.deepEqual(result.visits.map(v => v.rafTimestampMs), [100, 120, 140, 160, 180])
    assert.deepEqual(result.visits.map(v => v.actorInspected), [true, true, true, true, true])
    assert.deepEqual(result.visits.map(v => v.cropCopyMs > 0), [false, true, false, false, false])
    assert.ok(result.visits.every(v => v.observerMs > 0 && v.observerMs >= v.cropCopyMs))
    assert.ok(result.visits.slice(1).every((v, index) => v.timestampMs > result.visits[index].timestampMs))
    assert.equal(result.samples.length, 3); assert.equal(result.retention, null)
    assert.equal(result.crops[0].png, undefined)
  })
})

test('retention encodes only the first four immutable copies after the entry and releases every backing store', () => {
  withObserverFixture(fixture => {
    const { world, scene, group, observation, copies, operations, drawCalls, cancellations } = fixture
    retainCompleteSpecialFrames(fixture)
    completeObserverEntry(fixture)
    const { result } = observation, samples = structuredClone(result.samples), terminal = structuredClone(result.terminal)
    assert.deepEqual(operations, [['copy', 0], ['copy', 1], ['copy', 2], ['copy', 3]])
    assert.equal(copies.length, 4)
    assert.ok(copies.every(copy => copy.width === 108 && copy.height === 138))
    assert.equal(result.retention, null, 'even the terminal RAF does not scan or encode')
    world.turn = 70; world.units[0].fight.motion.f2 = 99
    scene.renderer.info.render.frame = 900; group.userData.frame = 777
    const before = structuredClone(world)
    assert.equal(observation.retain(), result)
    assert.deepEqual(world, before); assert.deepEqual(result.samples, samples); assert.deepEqual(result.terminal, terminal)
    assert.deepEqual(result.crops.map(crop => JSON.parse(Buffer.from(crop.png.split(',')[1], 'base64').toString())), drawCalls)
    assert.deepEqual(result.crops.map(crop => [crop.turn, crop.stamp, crop.frame, crop.f2]),
      drawCalls.map(copy => [copy.turn, copy.stamp, copy.frame, copy.f2]))
    assert.ok(result.crops.every(crop => crop.opaqueColors === 2 && crop.copyMs > 0 && crop.readbackScanMs > 0 && crop.encodingMs > 0))
    assert.deepEqual(operations, [['copy', 0], ['copy', 1], ['copy', 2], ['copy', 3],
      ['readback', 0], ['encoding', 0], ['readback', 1], ['encoding', 1],
      ['readback', 2], ['encoding', 2], ['readback', 3], ['encoding', 3]])
    assert.ok(copies.every(copy => copy.width === 0 && copy.height === 0))
    assert.deepEqual([result.retention.copyCount, result.retention.done], [4, true])
    assert.ok(result.retention.durationMs > 0)
    const retained = structuredClone(result), calls = structuredClone(operations), cancelled = [...cancellations]
    observation.stop(); observation.retain(); observation.retain()
    assert.deepEqual(result, retained); assert.deepEqual(operations, calls); assert.deepEqual(cancellations, cancelled)
  })
})

test('deferred readback and encoding failures retain timeline and other crops, release copies and never retry', () => {
  for (const stage of ['readback', 'encoding']) withObserverFixture(fixture => {
    const { observation, copies, operations, faults } = fixture
    retainValidObserverPair(fixture)
    completeObserverEntry(fixture)
    const { result } = observation, terminal = structuredClone(result.terminal), visits = structuredClone(result.visits)
    faults[stage] = 0
    observation.retain()
    assert.match(result.error, /Melee crop retention failed: Error: supplied .* failure/)
    assert.match(result.crops[0].error, /supplied .* failure/)
    assert.equal(result.crops[0].png, undefined)
    assert.match(result.crops[1].png, /^data:image\/png;base64,/)
    assert.equal(result.crops[0].encodingMs === null, stage === 'readback')
    assert.ok(copies.every(copy => copy.width === 0 && copy.height === 0))
    assert.equal(result.retention.done, true)
    assert.deepEqual(result.terminal, terminal); assert.deepEqual(result.visits, visits)
    assert.throws(() => validateMeleeRunningObservation(result, mapping), /must not fail/)
    const calls = structuredClone(operations), retained = structuredClone(result)
    faults[stage] = null; observation.retain()
    assert.deepEqual(operations, calls); assert.deepEqual(result, retained)
  })
})

test('private copy dimensions remain capped and out-of-canvas bodies still fail their visibility contract', () => {
  withObserverFixture(({ scene, next, observation, copies }) => {
    scene.picking.personBounds = () => ({ x: 100, y: 80, width: 1000, height: 1000 })
    next()
    assert.deepEqual(copies.map(copy => [copy.width, copy.height]), [[256, 256]])
    assert.deepEqual(observation.result.crops[0].clip, { x: 176, y: 136, width: 256, height: 256 })
    assert.equal(observation.result.samples[0].bodyInCanvas, false)
    observation.retain()
    assert.deepEqual(copies.map(copy => [copy.width, copy.height]), [[0, 0]])
  })
})

test('failed synchronous copy releases its buffer and records the error visit without encoding', () => {
  withObserverFixture(({ next, observation, copies, operations, faults, pending, unrelated }) => {
    faults.copy = 0; next()
    const { result } = observation
    assert.match(result.error, /supplied copy failure/)
    assert.equal(result.visits.length, 1); assert.equal(result.visits[0].stage, 'error')
    assert.ok(result.visits[0].observerMs >= result.visits[0].cropCopyMs && result.visits[0].cropCopyMs > 0)
    assert.deepEqual([result.samples.length, result.crops.length], [0, 0])
    assert.deepEqual(copies.map(copy => [copy.width, copy.height]), [[0, 0]])
    assert.deepEqual([...pending.keys()], [unrelated])
    observation.retain()
    assert.deepEqual(operations, []); assert.equal(result.retention.copyCount, 0)
  })
})

test('all-visit storage fails explicitly at its independent bound and never changes the attack sample cap', () => {
  withObserverFixture(({ world, scene, next, observation, pending, unrelated }) => {
    world.units[0].fight.action = 'approach'
    const { result } = observation
    assert.equal(result.visitLimit, 75 * 240)
    for (let index = 0; index < result.visitLimit; index++) { scene.renderer.info.render.frame++; next() }
    assert.equal(result.visits.length, result.visitLimit)
    assert.equal(result.visits.at(-1).stage, 'error'); assert.equal(result.visits.at(-1).actorInspected, false)
    assert.match(result.error, /bounded visit storage/)
    assert.equal(result.samples.length, 0); assert.deepEqual([...pending.keys()], [unrelated])
  })
  withObserverFixture(({ scene, next, observation }) => {
    for (let index = 0; index < 1201; index++) { scene.renderer.info.render.frame++; next() }
    assert.equal(observation.result.visits.length, 1201)
    assert.match(observation.result.error, /bounded sample storage/)
  })
})

function retainSpecialFrames({ world, scene, group, next }, turns) {
  const unit = world.units[0], person = unit.fight.motion, m = mapping['shaman:special']
  world.fights = [{ id: 1252, members: [54, 13] }]
  for (const turn of turns) {
    world.turn = turn
    Object.assign(unit.fight, { action: 'special', animation: 'special', started: 40,
      group: 1252, opponent: 13, remaining: m.duration - 1 - (turn - 40) })
    Object.assign(person, { object: m.object, draw: m.draw, f1: 0, f2: turn - 40, stamp: turn })
    const artwork = m.directions[spriteDirection(0, 0)]
    Object.assign(group.userData, { draw: m.draw, frame: artwork.frames[turn - 40], frameFlip: artwork.flip })
    scene.renderer.info.render.frame++; scene.gameClock.animationFrame = turn * 2
    next()
  }
}
const retainValidObserverPair = fixture => retainSpecialFrames(fixture, [40, 41])
const retainCompleteSpecialFrames = fixture => retainSpecialFrames(fixture, [40, 40, 41, 42, 43, 43])

function completeObserverEntry({ world, scene, group, next, observation }) {
  const { entry } = observation.result, fight = world.units[0].fight, m = mapping[`shaman:${entry.action}`]
  world.turn = entry.endExclusive
  Object.assign(fight, { action: 'approach', remaining: undefined })
  Object.assign(fight.motion, { f1: 0, f2: m.duration - 1, stamp: world.turn })
  const artwork = m.directions[spriteDirection(0, 0)]
  Object.assign(group.userData, { frame: artwork.frames[m.duration - 1], frameFlip: artwork.flip })
  scene.renderer.info.render.frame++; scene.gameClock.animationFrame = world.turn * 2
  return next()
}

test('real observer requires the actor alive before and at exact first-entry completion', () => {
  for (const turn of [42, 44]) for (const actor of ['dead', 'missing']) {
    withObserverFixture(fixture => {
      const { world, scene, next, observation, pending, unrelated } = fixture
      retainValidObserverPair(fixture)
      const { result } = observation, samples = structuredClone(result.samples), crops = structuredClone(result.crops)
      if (actor === 'dead') world.units[0].hp = 0
      if (actor === 'missing') world.units.length = 0
      world.turn = turn; scene.renderer.info.render.frame = 110; next()
      assert.deepEqual(result.samples, samples, 'an earlier valid pair cannot excuse early death')
      assert.deepEqual(result.crops, crops)
      assert.equal(result.endpoint, null); assert.equal(result.done, true)
      assert.deepEqual(result.terminal, { turn, stamp: 110, reason: 'error' })
      assert.match(result.error, /Shaman54 disappeared or died/)
      assert.throws(() => validateMeleeRunningObservation(result, mapping), /must not fail/)
      assert.deepEqual([...pending.keys()], [unrelated])
      const terminal = structuredClone(result.terminal)
      world.turn = 60; scene.renderer.info.render.frame = 120; observation.stop()
      assert.deepEqual(result.terminal, terminal, 'retention cannot rewrite an early-death terminal')
    })
  }
})

test('native expiry completes the first entry before later natural death without reclassifying any old receipt', () => {
  withObserverFixture(fixture => {
    const { world, scene, observation, pending, unrelated } = fixture
    retainCompleteSpecialFrames(fixture)
    const { callback } = completeObserverEntry(fixture), { result } = observation
    assert.equal(result.protocol, meleeRunningProtocol)
    assert.equal(result.error, null); assert.equal(result.done, true)
    assert.deepEqual(result.entry, { id: 54, kind: 'shaman', action: 'special', started: 40,
      fightGroup: 1252, opponent: 13, duration: 5, endExclusive: 44 })
    assert.equal(Object.isFrozen(result.entry), true)
    assert.deepEqual([result.endpoint.turn, result.endpoint.action, result.endpoint.f2], [44, 'approach', 4])
    const accepted = validateMeleeRunningObservation(result, mapping)
    assert.equal(accepted.obligations.firstEntry.status, 'passed')
    assert.equal(accepted.obligations.runningAdvancement.status, 'passed')
    const before = structuredClone(result)
    world.turn = 49; world.units.length = 0; scene.renderer.info.render.frame = 130
    callback(9999); observation.stop()
    assert.deepEqual(result, before, 'later death is outside an already observed, completed entry')
    assert.deepEqual([...pending.keys()], [unrelated])
  })
})

test('real observer rejects invalid actors before any first attack establishes an episode', () => {
  for (const actor of ['dead', 'missing', 'wrong-kind', 'wrong-team']) {
    withObserverFixture(({ world, scene, next, observation }) => {
      world.units[0].fight = null
      if (actor === 'dead') world.units[0].hp = 0
      if (actor === 'missing') world.units.length = 0
      if (actor === 'wrong-kind') world.units[0].kind = 'warrior'
      if (actor === 'wrong-team') world.units[0].team = 'green'
      world.turn = 60; scene.renderer.info.render.frame = 120; next()
      assert.equal(observation.result.firstAttackTurn, null)
      assert.equal(observation.result.entry, null); assert.equal(observation.result.samples.length, 0)
      assert.match(observation.result.error, /Shaman54 disappeared or died/)
      assert.deepEqual(observation.result.terminal, { turn: 60, stamp: 120, reason: 'error' })
    })
  }
})

test('native endpoint cannot excuse Scene/world/canvas/visibility replacement or an unexpected pause', () => {
  for (const invalid of ['scene', 'store', 'scene-world', 'canvas', 'hidden', 'paused']) {
    withObserverFixture(fixture => {
      const { world, scene, window, observation } = fixture
      retainValidObserverPair(fixture)
      if (invalid === 'scene') window.testSceneRef.current = { ...scene }
      if (invalid === 'store') window.testStore.getWorld = () => ({ ...world })
      if (invalid === 'scene-world') scene.world = { ...world }
      if (invalid === 'canvas') scene.renderer.domElement.isConnected = false
      if (invalid === 'hidden') document.visibilityState = 'hidden'
      if (invalid === 'paused') world.paused = true
      completeObserverEntry(fixture)
      assert.equal(observation.result.done, true); assert.equal(observation.result.endpoint, null)
      assert.match(observation.result.error, /lost its original Scene\/world|disconnected or document hidden|unexpectedly paused/)
      assert.equal(observation.result.terminal.reason, 'error')
    })
  }
})

test('external observer stop retains an incomplete reason and never invents native entry completion', () => {
  withObserverFixture(fixture => {
    const { world, scene, observation } = fixture
    retainValidObserverPair(fixture)
    world.turn = 42; scene.renderer.info.render.frame = 110
    const result = observation.stop()
    assert.equal(result.done, false); assert.equal(result.endpoint, null)
    assert.deepEqual(result.terminal, { turn: 42, stamp: 110, reason: 'stopped' })
    assert.throws(() => validateMeleeRunningObservation(result, mapping), /must finish/)
  })
})

test('first entry cannot change or disappear before completion, even after valid advancement', () => {
  for (const change of [
    unit => { unit.fight = null }, unit => { unit.fight.motion = { ...unit.fight.motion } },
    unit => { unit.fight.started++ }, unit => { unit.fight.opponent++ }, unit => { unit.fight.group++ },
    unit => { unit.fight.action = 'attack' }, unit => { unit.fight.action = 'recoil' },
    unit => { unit.fight.action = 'approach' },
  ]) withObserverFixture(fixture => {
    const { world, scene, next, observation } = fixture
    retainValidObserverPair(fixture)
    change(world.units[0]); world.turn = 42; scene.renderer.info.render.frame++; next()
    assert.equal(observation.result.endpoint, null)
    assert.match(observation.result.error, /lost its first attack entry|changed its first attack before expiry/)
    assert.throws(() => validateMeleeRunningObservation(observation.result, mapping), /must not fail/)
  })
})

test('missing exact expiry, a continuing attack or a favorable later entry fails without replacement', () => {
  for (const scenario of ['missed-turn', 'still-attacking', 'countdown-not-cleared', 'later-entry']) {
    withObserverFixture(fixture => {
      const { world, scene, next, observation } = fixture
      retainValidObserverPair(fixture)
      const fight = world.units[0].fight
      world.turn = 44; fight.action = 'approach'; fight.remaining = undefined
      if (scenario === 'missed-turn') world.turn = 45
      if (scenario === 'still-attacking') fight.action = 'special'
      if (scenario === 'countdown-not-cleared') fight.remaining = 0
      if (scenario === 'later-entry') { fight.started = 45; fight.action = 'attack'; world.turn = 45 }
      scene.renderer.info.render.frame++; next()
      const { result } = observation
      assert.equal(result.samples.length, 2); assert.equal(result.endpoint, null)
      assert.match(result.error, /exact native expiry turn|native expiry transition|lost its first attack entry/)
      assert.throws(() => validateMeleeRunningObservation(result, mapping), /must not fail/)
    })
  }
})

test('single-pose coverage still fails at its observed endpoint and cannot wait for a later entry', () => {
  withObserverFixture(fixture => {
    retainSpecialFrames(fixture, [43])
    completeObserverEntry(fixture)
    const { result } = fixture.observation
    assert.equal(result.error, null); assert.equal(result.samples.length, 1)
    assert.throws(() => validateMeleeRunningObservation(result, mapping), /logical phase and artwork advancement/)
  })
})

test('late first observation never shifts the source-derived native endpoint', () => {
  withObserverFixture(fixture => {
    retainSpecialFrames(fixture, [41, 42, 43])
    completeObserverEntry(fixture)
    const { result } = fixture.observation
    assert.equal(result.firstAttackTurn, 41); assert.equal(result.entry.started, 40)
    assert.equal(result.entry.endExclusive, 44)
    assert.equal(validateMeleeRunningObservation(result, mapping).obligations.firstEntry.endExclusive, 44)
  })
})

test('missing first crop consumes its slot and cannot be replaced by a later eligible duplicate', () => {
  withObserverFixture(({ scene, next, observation }) => {
    const bounds = scene.picking.personBounds
    scene.picking.personBounds = () => null; next()
    scene.picking.personBounds = bounds; scene.renderer.info.render.frame++; next()
    assert.equal(observation.result.samples[0].cropPlanned, true)
    assert.equal(observation.result.samples[0].cropFile, undefined)
    assert.equal(observation.result.samples[1].cropPlanned, false)
    assert.equal(observation.result.crops.length, 0)
  })
})

test('observer crop direction agrees with retained projection across signed headings and wrapping', () => {
  withObserverFixture(({ world, scene, next, observation }) => {
    for (const camera of [-65537, -32768, -2049, -1, 0, 255, 256, 2047, 32768, 65537])
      for (const object of [-32769, -2048, -1, 0, 127, 128, 2048, 32767]) {
        scene.cameraBearing = camera * Math.PI / 1024
        world.units[0].heading = Math.PI - object * Math.PI / 1024
        scene.renderer.info.render.frame++; next()
        assert.equal(observation.result.samples.at(-1).direction, spriteDirection(
          Math.round(scene.cameraBearing * 1024 / Math.PI), Math.round((Math.PI - world.units[0].heading) * 1024 / Math.PI)))
      }
  })
})

test('running canvas readback retains actual DOM ownership and overlapping HUD exclusion evidence', () => {
  withObserverFixture(({ next, observation }) => {
    const badge = { tagName: 'BUTTON', className: 'paused-badge',
      getBoundingClientRect: () => ({ x: 100, y: 90, width: 50, height: 50 }) }
    document.elementFromPoint = () => badge; document.querySelectorAll = () => [badge]
    next()
    const sample = observation.result.samples[0]
    assert.equal(sample.bodyCanvasOwned, false); assert.equal(sample.cropOverlayClear, false)
    assert.equal(sample.cropVisibility.overlays[0].className, 'paused-badge')
    assert.equal(sample.cropVisibility.bodyOwner.tag, 'BUTTON')
  })
})

test('running observer rejects an unexpected pause before native entry completion', () => {
  withObserverFixture(({ world, scene, next, observation }) => {
    next(); world.paused = true; scene.renderer.info.render.frame++; next()
    assert.equal(observation.result.done, true)
    assert.match(observation.result.error, /unexpectedly paused/)
  })
})

test('supplied observer stops on Scene replacement and cancels only its own RAF', () => {
  withObserverFixture(({ scene, window, next, pending, unrelated, observation, drawCalls, cancellations }) => {
    next()
    const before = structuredClone(observation.result)
    window.testSceneRef.current = { ...scene }
    const { id, callback } = next()
    assert.equal(observation.result.done, true)
    assert.match(observation.result.error, /lost its original Scene\/world/)
    assert.deepEqual(observation.result.samples, before.samples)
    assert.deepEqual(observation.result.crops, before.crops)
    assert.deepEqual(cancellations, [id])
    assert.deepEqual([...pending.keys()], [unrelated])
    assert.equal(drawCalls.length, 1, 'replacement is detected before any further readback')
    callback(1235)
    assert.deepEqual([...pending.keys()], [unrelated], 'a stale cancelled observer callback cannot reschedule itself')
    assert.equal(drawCalls.length, 1)
    assert.deepEqual(cancellations, [id], 'stale callback does not cancel any other owner')
  })
})

test('route diagnostics and attack observations retain actual interception identities without World writes', () => {
  withObserverFixture(({ world, scene, group, next, observation }) => {
    world.units[0].fight.group = 9; world.units[0].fight.opponent = 19
    world.fights = [{ id: 9, members: [54, 13, 19] }]
    world.units.push({ id: 20, kind: 'shaman', team: 'green', hp: 100, inside: null, x: 91, z: 119 },
      { id: 13, kind: 'warrior', team: 'green', hp: 90, inside: 71 })
    scene.unitMeshes.set(20, { visible: true, userData: { pickable: true, frame: 1 } })
    scene.unitMeshes.set(13, { visible: false, userData: { pickable: false, frame: 2 } })
    scene.cameraPosition = { x: 1, y: 2, angle: 1537 }
    scene.cameraMotion = { active: 0, target: { x: 3, y: 4 } }
    scene.resultCamera = { active: 0 }; scene.viewPreset = 2; scene.overviewActive = false
    scene.viewTransition = null
    const before = structuredClone(world), state = readMeleeRouteState()
    assert.deepEqual(world, before)
    assert.deepEqual([state.target.id, state.target.inside, state.target.visible, state.target.pickable], [20, null, true, true])
    assert.deepEqual([state.hiddenPriorTarget.inside, state.hiddenPriorTarget.visible, state.hiddenPriorTarget.pickable], [71, false, false])
    assert.equal(state.camera.preset, 2); assert.equal(state.camera.overview, false)
    assert.deepEqual(state.actor.fight, { group: 9, action: 'strike', opponent: 19 })
    next()
    assert.equal(observation.result.samples[0].opponent, 19)
    assert.deepEqual(observation.result.samples[0].participants, [54, 13, 19])
    assert.equal(group.userData.frame, 998); assert.deepEqual(world, before)
  })
})

test('explicit recoil mode retains the first ordinary phase and exact original expiry without changing attack default', () => {
  const recoilMapping = meleeAttackMapping(true)
  const original = recoilMapping['shaman:recoil']
  const [object, draw] = rules.animationObjects[rules.personAnimationObjects[9 * 9 + 7]]
  assert.deepEqual(original, { object, draw, step: 0, frameCount: 5, duration: 7, knockbackDuration: 4,
    directions: units.shamanSources[object] })
  assert.deepEqual(meleeAttackMapping(), mapping, 'default attack mapping stays byte-for-byte equivalent')
  for (const knockback of [false, true]) {
    withObserverFixture(({ world, scene, group, next, observation, pending, unrelated }) => {
      const fight = world.units[0].fight, person = fight.motion, duration = knockback ? 4 : 7
      world.fights = [{ id: fight.group, members: [54, 13] }]
      Object.assign(fight, { action: 'recoil', animation: 'recoil', knockback, nativeRecoilAnimation: true })
      Object.assign(person, { object, draw, f1: 0, f2: 0 })
      group.userData.draw = draw
      const direction = spriteDirection(0, 0)
      for (let elapsed = 0; elapsed < duration; elapsed++) {
        world.turn = fight.started + elapsed
        scene.gameClock.animationFrame = world.turn * 2
        scene.renderer.info.render.frame = 100 + elapsed
        person.stamp = world.turn; person.f2 = elapsed % 5
        group.userData.frame = original.directions[direction].frames[person.f2]
        group.userData.frameFlip = original.directions[direction].flip
        fight.remaining = duration - 1 - elapsed
        if (elapsed === duration - 1) {
          fight.action = knockback ? 'push' : 'approach'; fight.remaining = undefined
        }
        next()
      }
      observation.retain()
      assert.deepEqual([...pending.keys()], [unrelated])
      const result = observation.result, before = structuredClone(result)
      const accepted = validateRecoilObservation(result, recoilMapping)
      assert.deepEqual(result, before, 'acceptance never mutates supplied evidence')
      assert.equal(accepted.nativeFiveFrameLoopObserved, !knockback)
      assert.equal(accepted.duration, duration)
      assert.deepEqual(result.samples.map(sample => sample.f2), knockback ? [0, 1, 2] : [0, 1, 2, 3, 4, 0])
      for (const mutate of [
        r => { r.protocol = 'running-original-entry-v2' }, r => { r.done = false },
        r => { r.error = 'failed' }, r => { r.entry.started++ }, r => { r.entry.duration++ },
        r => { r.entry.knockback = !knockback }, r => { r.firstAttackTurn++ },
        r => { r.samples[0].turn++ }, r => { r.samples[1].f2 = 4 },
        r => { r.samples[1].frame++ }, r => { r.samples[1].nativeRecoilAnimation = false },
        r => { r.samples[1].personIdentityMatch = false }, r => { r.samples[1].opponent++ },
        r => { r.samples[1].fightMotionSourceAdmitted = false },
        r => { r.samples[1].logicalStamp-- }, r => { r.samples[1].remaining++ },
        r => { r.samples[1].cropOverlayClear = false }, r => { delete r.samples[0].cropFile },
        r => { r.samples[0].cropFile = 'melee-attack-frame-0.png' },
        r => { r.samples.splice(1, 1) }, r => { r.samples[1].submittedLayers = 0 },
        r => { r.endpoint.action = 'recoil' }, r => { r.endpoint.knockback = !knockback },
        r => { r.endpoint.nativeRecoilAnimation = false }, r => { r.endpoint.f2++ },
        r => { r.endpoint.hp = 0 }, r => { r.endpoint.alive = false },
        r => { r.endpoint.personIdentityMatch = false }, r => { r.endpoint.logicalStamp-- },
        r => { r.endpoint.documentVisible = false }, r => { r.endpoint.flight = true },
        r => { r.endpoint.personFlags4 |= 0x400 }, r => { r.terminal.reason = 'stopped' },
        r => { r.terminal.turn++ }, r => { r.terminal.stamp-- },
      ]) {
        const invalid = structuredClone(result); mutate(invalid)
        assert.throws(() => validateRecoilObservation(invalid, recoilMapping))
      }
    }, { mode: 'recoil', mapping: recoilMapping })
  }
})

test('explicit recoil observer cannot substitute late entry, changed identity or skipped expiry', () => {
  for (const fault of ['late-entry', 'changed-entry', 'missed-expiry']) {
    withObserverFixture(({ world, scene, next, observation }) => {
      const fight = world.units[0].fight
      Object.assign(fight, { action: 'recoil', animation: 'recoil', nativeRecoilAnimation: true, remaining: 6 })
      if (fault === 'late-entry') fight.started--
      next()
      if (fault !== 'late-entry') {
        if (fault === 'changed-entry') fight.opponent++
        else world.turn += 7
        scene.renderer.info.render.frame++; next()
      }
      assert.equal(observation.result.done, true)
      assert.ok(observation.result.error)
      assert.equal(observation.result.terminal.reason, 'error')
    }, { mode: 'recoil', mapping: meleeAttackMapping(true) })
  }
})

test('recoil observer waits for the first processed entry without accepting an unprocessed assignment', () => {
  withObserverFixture(({ world, scene, next, observation }) => {
    const fight = world.units[0].fight
    fight.action = 'recoil'; fight.remaining = undefined
    next()
    assert.equal(observation.result.done, false)
    assert.equal(observation.result.firstAttackTurn, null)
    assert.deepEqual(observation.result.samples, [])
    world.turn++; scene.renderer.info.render.frame++
    Object.assign(fight, { started: world.turn, remaining: 6, animation: 'recoil', nativeRecoilAnimation: true })
    next()
    assert.equal(observation.result.error, null)
    assert.equal(observation.result.entry.started, world.turn)
    assert.equal(observation.result.samples.length, 1)
  }, { mode: 'recoil', mapping: meleeAttackMapping(true) })
})
