import assert from 'node:assert/strict'
import test from 'node:test'
import { validateMeleeAttackFrames } from '../scripts/tutorial-browser/melee-attack-evidence.mjs'
import { installMeleeFrameObserver, meleeAttackMapping, assertMeleeRouteReady,
  readMeleeRouteState, meleeTargetPoint, meleeCameraInput, shiftClickMeleeTarget } from '../scripts/tutorial-browser/melee-attack.mjs'
import { minimapPick } from '../app/minimap.ts'
import rules from '../app/original-rules.json' with { type: 'json' }
import units from '../app/original-units.json' with { type: 'json' }

// Independent original data, not the production melee pose selector. Synthetic
// observations exercise evidence rejection; they do not claim a rendered run.
const mapping = {}
for (const [kind, model, team] of [['shaman', 7, 'blue'], ['warrior', 3, 'red']]) {
  for (const [action, row] of [['attack', 10], ['strike', 8], ['special', 16]]) {
    const [object, draw] = rules.animationObjects[rules.personAnimationObjects[row * 9 + model]]
    mapping[`${kind}:${action}`] = { object, draw, step: rules.animationDescriptors[draw].step,
      directions: kind === 'shaman' ? units.shamanSources[object]
        : Object.values(units.animations[`${team}-${kind}`]).find(directions => directions[0].source === object) }
  }
}

function sample(overrides = {}) {
  const result = { turn: 40, animationFrame: 80, id: 54, kind: 'shaman', action: 'strike', started: 40,
    f1: 0, f2: 0, direction: 0, visible: true, submittedLayers: 2, canvasConnected: true,
    sceneStoreMatch: true, paused: false, nativeAttackAnimation: true, stamp: 100, ...overrides }
  const original = mapping[`${result.kind}:${result.action}`] ?? mapping['shaman:strike']
  const direction = original.directions[result.direction] ?? original.directions[0]
  return { object: original.object, draw: original.draw,
    frame: direction.frames[result.f2 % direction.frames.length], flip: direction.flip, ...result }
}

const evidence = () => [
  sample({ cropFile: 'shaman-strike-frame0.png' }),
  sample({ stamp: 101, animationFrame: 81 }),
  sample({ stamp: 102, turn: 41, animationFrame: 82, f2: 1, cropFile: 'shaman-strike-frame1.png' }),
]

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

test('original mapped attack frames, same-turn hold, logical advance and native crops pass without mutation', () => {
  const samples = evidence(), before = structuredClone({ samples, mapping })
  const result = validateMeleeAttackFrames(samples, mapping)
  assert.equal(result.sampleCount, 3)
  assert.equal(result.sequenceCount, 1)
  assert.deepEqual(result.shamanSequence, {
    id: 54, kind: 'shaman', action: 'strike', started: 40, sampleCount: 3,
    firstTurn: 40, lastTurn: 41, heldPairs: 1, distinctF2: [0, 1], distinctFrames: [998, 999],
    crops: [
      { cropFile: 'shaman-strike-frame0.png', stamp: 100, turn: 40, direction: 0, f2: 0, frame: 998 },
      { cropFile: 'shaman-strike-frame1.png', stamp: 102, turn: 41, direction: 0, f2: 1, frame: 999 },
    ],
  })
  assert.deepEqual({ samples, mapping }, before)
})

test('baseline idle424 fails original strike456 expectation independently of the marker', () => {
  assert.equal(mapping['shaman:strike'].object, 456)
  for (const marker of [undefined, false, true]) {
    const samples = evidence().map(s => ({ ...s, object: 424, nativeAttackAnimation: marker }))
    assert.throws(() => validateMeleeAttackFrames(samples, mapping), /expected original attack object 456/)
  }
})

test('all three attack states use their original rows and natural RAF may skip logical turns', () => {
  for (const action of ['attack', 'strike', 'special']) {
    const samples = [sample({ action, cropFile: 'first.png' }), sample({ action, stamp: 101 }),
      sample({ action, stamp: 116, turn: 43, animationFrame: 87, f2: 3, cropFile: 'later.png' })]
    assert.equal(validateMeleeAttackFrames(samples, mapping).shamanSequence.action, action)
  }
})

test('directional artwork and flip use original modulo selection, not a bounded directional f2 assumption', () => {
  const samples = evidence()
  // Warrior strike direction2 has only five rendered frames; native object104 has seven.
  const warrior = sample({ id: 13, kind: 'warrior', direction: 2, f2: 6, stamp: 100 })
  assert.equal(mapping['warrior:strike'].directions[2].frames.length, 5)
  samples.splice(1, 0, warrior)
  assert.doesNotThrow(() => validateMeleeAttackFrames(samples, mapping))
  const changedDirection = sample({ direction: 7, stamp: 101, animationFrame: 81 })
  samples.splice(3, 0, { ...changedDirection, stamp: 102 })
  samples.at(-1).stamp = 103
  assert.doesNotThrow(() => validateMeleeAttackFrames(samples, mapping))
})

test('missing samples, original mapping, directions and frame lists cannot pass', () => {
  for (const samples of [undefined, null, [], {}])
    assert.throws(() => validateMeleeAttackFrames(samples, mapping), /samples required/)
  for (const original of [undefined, null, {}, { 'shaman:strike': {} },
    { 'shaman:strike': { ...mapping['shaman:strike'], directions: [] } },
    { 'shaman:strike': { ...mapping['shaman:strike'], directions: Array(8).fill({ frames: [], flip: false }) } }])
    assert.throws(() => validateMeleeAttackFrames(evidence(), original), /mapping|directions|frame list/)
})

test('frame, draw, flip and native marker mismatches fail independently', () => {
  for (const [change, message] of [
    [{ draw: 15 }, /expected original attack draw/],
    [{ frame: 0, nativeAttackAnimation: false }, /displayed frame must match/],
    [{ flip: true }, /displayed flip must match/],
    [{ nativeAttackAnimation: false }, /ownership marker required/],
    [{ nativeAttackAnimation: undefined, sourceOwned: true }, /ownership marker required/],
  ]) {
    const samples = evidence(); Object.assign(samples[0], change)
    assert.throws(() => validateMeleeAttackFrames(samples, mapping), message)
  }
})

test('absent or invisible submitted body layers, stale scene and paused frames fail', () => {
  for (const [key, value, message] of [
    ['submittedLayers', undefined, /submitted on this renderer stamp/],
    ['submittedLayers', 0, /submitted on this renderer stamp/],
    ['submittedLayers', [], /submitted on this renderer stamp/],
    ['visible', false, /visible attack body/],
    ['canvasConnected', false, /connected game canvas/],
    ['sceneStoreMatch', false, /scene\/store identity/],
    ['paused', true, /unpaused gameplay/],
  ]) {
    const samples = evidence(); samples[0][key] = value
    assert.throws(() => validateMeleeAttackFrames(samples, mapping), message)
  }
})

test('recoil, wrong authored identity and Warrior-only evidence cannot satisfy Shaman attack acceptance', () => {
  for (const action of ['recoil', 'approach', 'idle', undefined]) {
    const samples = evidence(); samples[0].action = action
    assert.throws(() => validateMeleeAttackFrames(samples, mapping), /recoil is not attack evidence/)
  }
  for (const change of [{ id: 55 }, { kind: 'warrior' }]) {
    const samples = evidence(); Object.assign(samples[0], change)
    assert.throws(() => validateMeleeAttackFrames(samples, mapping), /authored M2/)
  }
  const warriors = evidence().map(s => sample({ ...s, id: 13, kind: 'warrior',
    object: mapping['warrior:strike'].object, draw: mapping['warrior:strike'].draw,
    frame: mapping['warrior:strike'].directions[s.direction].frames[s.f2] }))
  assert.throws(() => validateMeleeAttackFrames(warriors, mapping), /Shaman54 attack sequence required/)
})

test('native f1 and f2 cannot advance within a logical turn, even when direction changes', () => {
  for (const change of [{ f1: 1 }, { f2: 1 }, { f2: 1, direction: 1 }]) {
    const samples = evidence(); samples[1] = sample({ stamp: 101, animationFrame: 81, ...change })
    assert.throws(() => validateMeleeAttackFrames(samples, mapping), /same logical turn must retain native f1\/f2/)
  }
})

test('distinct renderer visits, same-turn hold and advancing-turn artwork are all required', () => {
  const noHold = evidence().filter((_, index) => index !== 1)
  assert.throws(() => validateMeleeAttackFrames(noHold, mapping), /same-turn\/direction hold/)
  const duplicatedVisit = evidence(); duplicatedVisit[1].stamp = 100; duplicatedVisit[1].animationFrame = 80
  assert.throws(() => validateMeleeAttackFrames(duplicatedVisit, mapping), /duplicate person observation/)
  const noAdvance = evidence(); noAdvance[2] = sample({ stamp: 102, turn: 41, animationFrame: 82, cropFile: 'later.png' })
  assert.throws(() => validateMeleeAttackFrames(noAdvance, mapping), /advance native f2 and artwork/)
  const directionOnly = evidence(); directionOnly[2] = sample({ stamp: 102, turn: 41, animationFrame: 82,
    direction: 1, cropFile: 'later.png' })
  assert.throws(() => validateMeleeAttackFrames(directionOnly, mapping), /advance native f2 and artwork/)
})

test('hold, advance and crops cannot be stitched across separate action/start sequences', () => {
  for (const change of [{ started: 41 }, { action: 'attack' }]) {
    const samples = evidence(); Object.assign(samples[2], change)
    assert.throws(() => validateMeleeAttackFrames(samples, mapping), /One held Shaman54 sequence must advance/)
  }
})

test('at least two unique native-frame crop files must show distinct advancing frames in the qualifying sequence', () => {
  const absent = evidence().map(s => { const copy = { ...s }; delete copy.cropFile; return copy })
  assert.throws(() => validateMeleeAttackFrames(absent, mapping), /Two to four native-frame crop/)
  const one = evidence(); delete one[2].cropFile
  assert.throws(() => validateMeleeAttackFrames(one, mapping), /Two to four native-frame crop/)
  const duplicate = evidence(); duplicate[2].cropFile = duplicate[0].cropFile
  assert.throws(() => validateMeleeAttackFrames(duplicate, mapping), /each native-frame crop must have its own file/)
  const repeatedFrame = evidence(); repeatedFrame[1].cropFile = 'held.png'; delete repeatedFrame[2].cropFile
  assert.throws(() => validateMeleeAttackFrames(repeatedFrame, mapping), /crops of distinct native f2\/artwork/)
  const otherSequence = evidence(); delete otherSequence[2].cropFile
  otherSequence.push(sample({ turn: 42, started: 42, stamp: 103, animationFrame: 84, cropFile: 'other.png' }))
  assert.throws(() => validateMeleeAttackFrames(otherSequence, mapping), /crops of distinct native f2\/artwork/)
  const tooMany = evidence()
  for (let index = 0; index < 3; index++) tooMany.push(sample({ turn: 42 + index, f2: (index + 2) % 4,
    stamp: 103 + index, animationFrame: 84 + index * 2, cropFile: `extra${index}.png` }))
  assert.throws(() => validateMeleeAttackFrames(tooMany, mapping), /Two to four native-frame crop/)
})

test('invalid clocks, direction, byte phase, countdown and chronology fail closed', () => {
  for (const [key, value, message] of [
    ['turn', NaN, /integer turn/], ['animationFrame', -1, /integer animationFrame/],
    ['stamp', undefined, /integer stamp/], ['started', 41, /cannot start after/],
    ['direction', 8, /direction outside/], ['f2', 256, /native f2 must fit/],
    ['f1', 2, /descriptor countdown/], ['frame', undefined, /integer frame/],
  ]) {
    const samples = evidence(); samples[0][key] = value
    assert.throws(() => validateMeleeAttackFrames(samples, mapping), message)
  }
  for (const key of ['stamp', 'turn', 'animationFrame']) {
    const samples = evidence(); samples[2][key] = samples[1][key] - 1
    assert.throws(() => validateMeleeAttackFrames(samples, mapping), /chronological|cannot start after/)
  }
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

// Explicit supplied World/canvas/RAF diagnostic. No browser, actual game method,
// rendering, screenshot pixels, original-game timing or live campaign claim.
function withObserverFixture(run) {
  const world = structuredClone({ turn: 40, paused: false, randomState: 12345,
    terrain: new Uint8Array([1, 2, 3]), selected: [54],
    units: [{ id: 54, kind: 'shaman', team: 'blue', hp: 120, heading: Math.PI,
      fight: { action: 'strike', started: 40, nativeAttackAnimation: true,
        motion: { object: 456, draw: 14, f1: 0, f2: 0, stamp: 40 } } }] })
  const layers = [
    { visible: true, userData: { piece: 90 } },
    { visible: true, userData: { piece: 91 } },
    { visible: false, userData: { piece: 92 } },
  ]
  const submitted = new Set([layers[0], layers[2]]), sourceCalls = [], drawCalls = [], cancellations = []
  const rect = { width: 720, height: 500, left: 15, top: 25 }
  const canvas = { width: 1440, height: 1000, isConnected: true, getBoundingClientRect: () => rect }
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
  let nextRaf = 1000
  const request = callback => { const id = ++nextRaf; pending.set(id, callback); return id }
  const unrelated = request(() => assert.fail('observer must not run an unrelated RAF'))
  const document = { visibilityState: 'visible', createElement(tag) {
    assert.equal(tag, 'canvas')
    let captured
    const copy = { width: 0, height: 0,
      getContext(type) {
        assert.equal(type, '2d')
        return {
          drawImage(...args) {
            assert.equal(args[0], canvas)
            assert.deepEqual(args.slice(1), [176, 136, 108, 138, 0, 0, 108, 138])
            captured = { stamp: scene.renderer.info.render.frame, turn: world.turn,
              frame: group.userData.frame, f2: world.units[0].fight.motion.f2 }
            drawCalls.push(captured)
          },
          getImageData(...args) {
            assert.ok(captured, 'copy must be read after the same callback draws it')
            assert.deepEqual(args, [0, 0, copy.width, copy.height])
            return { data: new Uint8ClampedArray([0, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 0]) }
          },
        }
      },
      toDataURL(type) {
        assert.equal(type, 'image/png'); assert.ok(captured)
        return `data:image/png;base64,${Buffer.from(JSON.stringify(captured)).toString('base64')}`
      },
    }
    return copy
  } }
  const replacements = { window, document, requestAnimationFrame: request,
    cancelAnimationFrame(id) { cancellations.push(id); pending.delete(id) },
    performance: { now: () => 1234 } }
  const descriptors = new Map(Object.keys(replacements).map(key =>
    [key, Object.getOwnPropertyDescriptor(globalThis, key)]))
  try {
    for (const [key, value] of Object.entries(replacements))
      Object.defineProperty(globalThis, key, { configurable: true, writable: true, value })
    const before = structuredClone(world)
    installMeleeFrameObserver()
    assert.deepEqual(world, before, 'installation preserves the supplied World')
    const observation = window.__pndMeleeObservation
    const next = () => {
      const entries = [...pending].filter(([id]) => id !== unrelated)
      assert.equal(entries.length, 1, 'only one observer RAF may be pending')
      const [id, callback] = entries[0]
      pending.delete(id)
      const before = structuredClone(world)
      callback(1234)
      assert.deepEqual(world, before, 'each read/crop callback preserves the complete supplied World')
      return { id, callback }
    }
    return run({ world, scene, group, layers, window, next, pending, unrelated,
      observation, sourceCalls, drawCalls, cancellations })
  } finally {
    try { window.__pndMeleeObservation?.stop() }
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
    assert.equal(crop.opaqueColors, 2)
    assert.deepEqual(JSON.parse(Buffer.from(crop.png.split(',')[1], 'base64').toString()), drawCalls[0],
      'supplied readback metadata belongs to the exact observed render stamp')
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
    assert.equal(result.samples[2].cropFile, result.crops[1].filename)
    assert.deepEqual(drawCalls, [
      { stamp: 100, turn: 40, frame: 998, f2: 0 }, { stamp: 102, turn: 41, frame: 999, f2: 1 },
    ])
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
