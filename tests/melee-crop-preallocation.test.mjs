import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
// Execute only the unchanged serialization boundary's exact exported observer.
// No application imports, rendering, model, browser or held source is executed.
const source = readFileSync(new URL('../scripts/tutorial-browser/melee-attack.mjs', import.meta.url), 'utf8')
const start = source.indexOf('export function installMeleeFrameObserver(')
assert.ok(start >= 0)
const end = source.indexOf('\nexport default async function meleeAttack', start)
assert.ok(end > start)
const installMeleeFrameObserver = new Function(`return (${source.slice(start + 7, end)})`)()
const mapping = {"shaman:attack": {"object": 456, "draw": 14, "step": 0, "frameCount": 4, "duration": 4, "directions": [{"frames": [998, 999, 1000, 1001], "flip": false, "source": 456}, {"frames": [1002, 1003, 1004, 1005], "flip": false, "source": 457}, {"frames": [1006, 1007, 1008, 1009], "flip": false, "source": 458}, {"frames": [1010, 1011, 1012, 1013], "flip": false, "source": 459}, {"frames": [1014, 1015, 1016, 1017], "flip": false, "source": 460}, {"frames": [1010, 1011, 1012, 1013], "flip": true, "source": 461}, {"frames": [1006, 1007, 1008, 1009], "flip": true, "source": 462}, {"frames": [1002, 1003, 1004, 1005], "flip": true, "source": 463}]}, "shaman:strike": {"object": 456, "draw": 14, "step": 0, "frameCount": 4, "duration": 4, "directions": [{"frames": [998, 999, 1000, 1001], "flip": false, "source": 456}, {"frames": [1002, 1003, 1004, 1005], "flip": false, "source": 457}, {"frames": [1006, 1007, 1008, 1009], "flip": false, "source": 458}, {"frames": [1010, 1011, 1012, 1013], "flip": false, "source": 459}, {"frames": [1014, 1015, 1016, 1017], "flip": false, "source": 460}, {"frames": [1010, 1011, 1012, 1013], "flip": true, "source": 461}, {"frames": [1006, 1007, 1008, 1009], "flip": true, "source": 462}, {"frames": [1002, 1003, 1004, 1005], "flip": true, "source": 463}]}, "shaman:special": {"object": 552, "draw": 14, "step": 0, "frameCount": 5, "duration": 5, "directions": [{"frames": [1018, 1019, 1020, 1021, 1022], "flip": false, "source": 552}, {"frames": [1023, 1024, 1025, 1026, 1027], "flip": false, "source": 553}, {"frames": [1028, 1029, 1030, 1031, 1032], "flip": false, "source": 554}, {"frames": [1033, 1034, 1035, 1036, 1037], "flip": false, "source": 555}, {"frames": [1038, 1039, 1040, 1041, 1042], "flip": false, "source": 556}, {"frames": [1033, 1034, 1035, 1036, 1037], "flip": true, "source": 557}, {"frames": [1028, 1029, 1030, 1031, 1032], "flip": true, "source": 558}, {"frames": [1023, 1024, 1025, 1026, 1027], "flip": true, "source": 559}]}}
function withObserverFixture(run, observerInput = mapping, setupFault = null) {
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
  const request = callback => { if (setupFault?.kind === 'raf' && copies.length) throw setupFault.error; const id = ++nextRaf; pending.set(id, callback); return id }
  const unrelated = request(() => assert.fail('observer must not run an unrelated RAF'))
  const document = { visibilityState: 'visible', elementFromPoint: () => canvas, querySelectorAll: () => [], createElement(tag) {
    assert.equal(tag, 'canvas'); if (setupFault?.kind === 'create' && copies.length === setupFault.index) throw setupFault.error
    const index = copies.length
    let captured
    const copy = { width: 0, height: 0,
      getContext(type) {
        assert.equal(type, '2d'); if (setupFault?.kind === 'null-context' && index === setupFault.index) return null; if (setupFault?.kind === 'context' && index === setupFault.index) throw setupFault.error
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
    copies.push(copy); if (setupFault) setupFault.copies = copies
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


test('four private contexts are prepared before any observer RAF and no canvas is created while sampling', () => {
  withObserverFixture(({ copies, next, observation }) => {
    assert.equal(copies.length, 4)
    assert.ok(copies.every(copy => copy.width === 0 && copy.height === 0))
    const original = document.createElement
    document.createElement = () => assert.fail('no allocation in the observed callback')
    try { next(); assert.equal(observation.result.error, null); assert.equal(observation.result.crops.length, 1) }
    finally { document.createElement = original }
  })
})

test('unused slots are released on stop and retention never draws or encodes them', () => {
  withObserverFixture(({ copies, observation, operations }) => {
    assert.equal(copies.length, 4)
    observation.stop(); observation.retain()
    assert.ok(copies.every(copy => copy.width === 0 && copy.height === 0))
    assert.deepEqual(operations, [])
    assert.equal(observation.result.retention.copyCount, 0)
  })
})

test('partial preallocation preserves falsey creation/context failure and releases earlier buffers', () => {
  for (const kind of ['create', 'context', 'raf']) for (const error of [undefined, null, 0, false]) {
    const fault = { kind, error, index: 2, copies: [] }
    let threw = false
    try { withObserverFixture(() => assert.fail('installation should fail'), mapping, fault) }
    catch (actual) { threw = true; assert.equal(actual, error) }
    assert.equal(threw, true)
    assert.equal(fault.copies.length, kind === 'create' ? 2 : kind === 'context' ? 3 : 4)
    assert.ok(fault.copies.every(copy => copy.width === 0 && copy.height === 0))
  }
})

test('all four distinct samples retain exact source rectangles and once-only captured content', () => {
  withObserverFixture(({ world, scene, group, next, observation, copies, operations, drawCalls }) => {
    const fight = world.units[0].fight
    Object.assign(fight, { action: 'special', animation: 'special' })
    Object.assign(fight.motion, { object: 552 })
    for (let phase = 0; phase < 4; phase++) {
      world.turn = 40 + phase; fight.remaining = 4 - phase
      fight.motion.f2 = phase; fight.motion.stamp = world.turn
      group.userData.frame = 1018 + phase; scene.renderer.info.render.frame = 100 + phase
      next()
    }
    assert.equal(copies.length, 4)
    assert.equal(observation.result.crops.length, 4)
    assert.ok(copies.every(copy => copy.width === 108 && copy.height === 138))
    assert.ok(observation.result.crops.every(c => c.clip.x === 176 && c.clip.y === 136 && c.clip.width === 108 && c.clip.height === 138))
    assert.deepEqual(operations, [['copy', 0], ['copy', 1], ['copy', 2], ['copy', 3]])
    observation.retain()
    assert.deepEqual(observation.result.crops.map(c=>JSON.parse(Buffer.from(c.png.split(',')[1], 'base64').toString())), drawCalls)
    assert.ok(copies.every(copy=>copy.width === 0 && copy.height === 0))
    const saved = structuredClone(observation.result); observation.retain(); assert.deepEqual(observation.result,saved)
  })
})

test('failed drawing releases the used slot and all unused slots without retry or encoding', () => {
  withObserverFixture(({ copies, next, observation, faults, operations }) => {
    faults.copy = 0; next()
    assert.match(observation.result.error, /supplied copy failure/)
    assert.equal(copies.length, 4)
    assert.ok(copies.every(copy => copy.width === 0 && copy.height === 0))
    observation.retain(); assert.deepEqual(operations, [])
  })
})

test('held pose remains deduplicated and missed exact expiry remains a failure', () => {
  withObserverFixture(({ next, world, scene, observation, drawCalls }) => {
    next(); scene.renderer.info.render.frame++; next()
    assert.equal(drawCalls.length, 1)
    world.turn = 44; world.units[0].fight.action = 'ready'; scene.renderer.info.render.frame++; next()
    assert.match(observation.result.error, /missed its exact native expiry turn/)
    assert.equal(observation.result.endpoint, null)
  })
})

test('missing preallocated 2D context fails before sampling and releases every partial buffer', () => {
  const fault = { kind: 'null-context', index: 2, copies: [] }
  assert.throws(() => withObserverFixture(() => assert.fail('installation must fail'), mapping, fault), /lacks its 2D copy context/)
  assert.equal(fault.copies.length, 3)
  assert.ok(fault.copies.every(copy => copy.width === 0 && copy.height === 0))
})
