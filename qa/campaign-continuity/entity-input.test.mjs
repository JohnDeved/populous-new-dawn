import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import * as probes from './command-probes.mjs'
const source = readFileSync(new URL('./scenario.mjs', import.meta.url), 'utf8')
const section = (name, next) => source.slice(source.indexOf(`  const ${name} =`), source.indexOf(`  const ${next} =`))
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor

test('integer interior selection rejects a fractional edge and competing canvas pixels', () => {
  const inspect = ({ x, y }) => ({ x, y, canvasOwned: x !== 18, hitId: y >= 10 && x >= 10 ? 29 : null })
  const hit = probes.findEntityInput([{ x: 10.2, y: 9.8 }, { x: 13.2, y: 13.1 }], 29, inspect)
  assert.deepEqual(hit, { x: 13, y: 13, interiorRadius: 2 })
  assert.equal(probes.findEntityInput([{ x: 17, y: 13 }], 29, inspect), null)
  assert.equal(probes.findEntityInput([{ x: 13, y: 13 }], 28, inspect), null)
})

test('context diagnostics reject a disabled or substituted target and retain observation turn', () => {
  const hit = { id: 29, collection: 'shrines' }
  const observed = { turn: 50, targetId: 29, selected: [30], context: { model: 20, enabled: true } }
  assert.equal(probes.requireEntityContext(hit, observed, { turn: 49, selected: [30] }), undefined)
  for (const patch of [{ context: { model: 3, enabled: false } }, { targetId: 28 }, { turn: 48 }, { selected: [31] }])
    assert.throws(() => probes.requireEntityContext(hit, { ...observed, ...patch }, { turn: 49, selected: [30] }))
})

test('actual entityHit chooses an integer interior point using the current picker and canvas ownership', async () => {
  const previousWindow = globalThis.window, previousDocument = globalThis.document
  const canvas = {}, target = { id: 29, x: 0, z: 0 }
  const owns = (x, y) => x >= 200 && y >= 0
  const picks = ({ clientX: x, clientY: y }) => x >= 812 && x <= 832 && y >= 288.5 && y <= 325 ? 29 : null
  const scene = { world: { turn: 664, shrines: [target] }, renderer: { domElement: canvas },
    container: { getBoundingClientRect: () => ({ x: 0, y: 0, width: 1440, height: 1000 }) },
    screen: () => ({ x: 814.1875 / 720 - 1, y: 1 - 438.625 / 500 }),
    shrineMeshes: new Map(), picking: { pickPerson: () => null }, pickUnit: () => null,
    pickWorldObject: event => picks(event) === 29 ? target : null }
  globalThis.window = { testSceneRef: { current: scene } }
  globalThis.document = { elementFromPoint: (x, y) => owns(x, y) ? canvas : null }
  const moduleURL = new URL('./command-probes.mjs', import.meta.url).href
  const page = { evaluate: (fn, arg) => new Function(`return (${fn.toString().replaceAll('/qa/campaign-continuity/command-probes.mjs', moduleURL)})`)()(arg) }
  try {
    const hit = await new AsyncFunction('page', `${section('entityHit', 'resolveId')} return entityHit('shrines', 29);`)(page)
    assert.equal(Number.isInteger(hit.x) && Number.isInteger(hit.y), true)
    for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) {
      assert.equal(owns(hit.x + dx, hit.y + dy), true)
      assert.equal(picks({ clientX: hit.x + dx, clientY: hit.y + dy }), 29)
    }
  } finally { globalThis.window = previousWindow; globalThis.document = previousDocument }
})

test('actual candidate order prefers interior anchors and retains an occluded-anchor scan fallback', async () => {
  const previousWindow = globalThis.window, previousDocument = globalThis.document
  const moduleURL = new URL('./command-probes.mjs', import.meta.url).href
  try {
    for (const collection of ['shrines', 'units']) for (const occluded of [false, true]) {
      const canvas = {}, target = { id: 29, x: 0, z: 0 }, child = { visible: true, userData: { nativeModel: 45 } }
      const group = { position: target, traverse: fn => fn(child) }
      const fallbackY = collection === 'units' ? 380 : 270
      const hit = ({ clientX: x, clientY: y }) =>
        (Math.abs(x - 400) <= 20 && Math.abs(y - fallbackY) <= 10 ||
         !occluded && Math.abs(x - 400) <= 15 && Math.abs(y - 400) <= 15) ? target : null
      const scene = { world: { turn: 10, [collection]: [target] }, renderer: { domElement: canvas },
        container: { getBoundingClientRect: () => ({ x: 0, y: 0, width: 1000, height: 1000 }) },
        screen: () => ({ x: -0.2, y: 0.2 }), shrineMeshes: new Map([[29, { g: group }]]), unitMeshes: new Map([[29, group]]),
        view: { projection: {} }, pickUnit: event => collection === 'units' ? hit(event) : null, pickWorldObject: hit,
        picking: { pickPerson: event => collection === 'units' ? hit(event)?.id ?? null : null,
          personBounds: () => ({ x: 390, y: 390, width: 20, height: 20 }),
          model: () => [{ kind: 'model', points: [{ x: 390, y: 390 }, { x: 410, y: 390 }, { x: 400, y: 420 }] }] } }
      globalThis.window = { testSceneRef: { current: scene } }
      globalThis.document = { elementFromPoint: () => canvas }
      const page = { evaluate: (fn, arg) => new Function(`return (${fn.toString().replaceAll('/qa/campaign-continuity/command-probes.mjs', moduleURL)})`)()(arg) }
      const point = await new AsyncFunction('page', 'collection', `${section('entityHit', 'resolveId')} return entityHit(collection, 29);`)(page, collection)
      assert.ok(point)
      if (occluded) assert.ok(point.y < fallbackY + 10, 'Retain the existing eligible broad-scan fallback')
      else assert.deepEqual({ x: point.x, y: point.y }, { x: 400, y: 400 }, 'Interior triangle anchor wins over the first top-edge scan hit')
    }
  } finally { globalThis.window = previousWindow; globalThis.document = previousDocument }
})

test('input state copies existing rect, projection, body version and cache without invoking scene work', () => {
  const cannotCall = () => { throw Error('Diagnostic must not update or re-pick') }
  const canvas = { getBoundingClientRect: () => ({ left: 200, top: 0, width: 1240, height: 1000 }) }
  const mesh = { visible: true, userData: { nativeModel: 45, stoneHeadFrame: 7, stage: 4 },
    geometry: { attributes: { position: { version: 91 } }, getAttribute: cannotCall },
    matrixWorld: { elements: [1, 0, 0, 1] }, updateWorldMatrix: cannotCall }
  const shrine = { id: 29, kind: 'bridge', model: 45, x: -5, z: 25, active: true, enabled: true,
    stoneHead: { family: 45, f1: 28, stamp: 715, flags3: 0, renderFlags: 0 } }
  const scene = { world: { turn: 715, shrines: [shrine] }, frame: 951, gameClock: { animationFrame: 1430 },
    renderer: { domElement: canvas }, shrineMeshes: new Map([[29, { g: { children: [mesh] } }]]),
    view: { center: { x: 1, y: 2 }, rawCenter: { x: 3, y: 4 }, projection: { width: 1240, height: 1000, depth: Infinity, matrix: [1, 2, 3] } },
    cameraPosition: { x: 777, y: 57109, angle: 1435 }, picking: { lastKey: 'prior', lastId: 29, lastKind: 'model', pick: cannotCall },
    pick: cannotCall, updateView: cannotCall }
  const observed = probes.entityInputState(scene, { collection: 'shrines', id: 29 }, { x: 806, y: 289 })
  assert.deepEqual(observed.localPixel, { x: 606, y: 289 })
  assert.equal(observed.body.positionVersion, 91); assert.equal(observed.frame, 951)
  scene.view.projection.matrix[0] = 9; shrine.stoneHead.f1 = 99; mesh.matrixWorld.elements[0] = 8
  assert.equal(observed.projection.matrix[0], 1); assert.equal(observed.target.stoneHead.f1, 28)
  assert.equal(observed.body.matrixWorld[0], 1); assert.equal(observed.cache.lastId, 29)
  assert.equal(JSON.parse(JSON.stringify(observed)).projection.depth, 'Infinity', 'Never silently turn an observed nonfinite scalar into null')
})

test('actual clickOrder rejects stale or disabled entity input after the before-state read, and accepts a fresh target', async () => {
  for (const fault of ['stale', 'disabled', null]) {
    const calls = [], before = { turn: 20, lastOrderTurn: 19, selected: [30], effects: [], units: [], observation: { name: 'entry', orderMarkerCursor: 0, orderMarkers: [] } }
    const execute = new AsyncFunction('deps', `
      const { assert, calls, fault, before } = deps;
      const read = async () => { calls.push('read'); return before; }, requireOrderable = () => {};
      const requireDeclaredPreacherOrder = () => {}, sermonPlan = null, capturePendingSermon = async () => {};
      const prepareEntityClick = async () => { calls.push('entity preparation'); if (fault) throw Error(fault); };
      const finishEntityClick = async () => { calls.push('observer restored'); };
      const page = { mouse: { click: async () => calls.push('click'), move: async () => calls.push('move') } };
      const log = () => {}, acceptedOrderEvidence = () => { calls.push('unchanged acceptance assertion'); return {}; };
      ${section('clickOrder', 'groundHit')}
      return clickOrder({ id: 29, collection: 'shrines', x: 814, y: 300 });
    `)
    const run = execute({ assert, calls, fault, before })
    if (fault) {
      await assert.rejects(run, new RegExp(fault)); assert.ok(!calls.includes('click'))
    } else {
      await run
      assert.ok(calls.indexOf('read') < calls.indexOf('entity preparation'))
      assert.ok(calls.indexOf('entity preparation') < calls.indexOf('click'))
      assert.ok(calls.indexOf('click') < calls.indexOf('observer restored'))
      assert.ok(calls.indexOf('observer restored') < calls.indexOf('unchanged acceptance assertion'))
    }
  }
})

test('delivered pointer observation calls each original picker once, preserves its result and restores all wrappers', () => {
  const listeners = new Map(), canvas = { addEventListener: (name, fn, capture) => listeners.set(name + !!capture, fn),
    removeEventListener: (name, fn, capture) => { assert.equal(listeners.get(name + !!capture), fn); listeners.delete(name + !!capture) } }
  const counts = { person: 0, unit: 0, object: 0 }, target = { id: 29 }
  const scene = { world: { turn: 40 }, renderer: { domElement: canvas },
    picking: { pickPerson() { assert.equal(this, scene.picking); counts.person++; return null } },
    pickUnit() { assert.equal(this, scene); counts.unit++; return null },
    pickWorldObject() { assert.equal(this, scene); counts.object++; return target } }
  const originals = [scene.picking.pickPerson, scene.pickUnit, scene.pickWorldObject]
  const observer = probes.observeEntityPointer(scene, { elementFromPoint: () => canvas })
  const event = { type: 'pointerup', clientX: 814, clientY: 300, button: 0, buttons: 0, target: canvas, isTrusted: true }
  listeners.get('pointeruptrue')(event)
  assert.deepEqual(counts, { person: 0, unit: 0, object: 0 }, 'Capture does not call any picker before the real handler')
  assert.equal(scene.pickUnit(event), null); assert.equal(scene.picking.pickPerson(event), null)
  assert.equal(scene.pickWorldObject(event), target)
  listeners.get('pointerupfalse')(event)
  const result = observer.finish()
  assert.deepEqual(counts, { person: 1, unit: 1, object: 1 })
  assert.deepEqual([scene.picking.pickPerson, scene.pickUnit, scene.pickWorldObject], originals)
  assert.equal(listeners.size, 0); assert.deepEqual(result.errors, [])
  assert.deepEqual(result.events[0].picks.map(p => [p.name, p.id]), [['pickUnit', null], ['pickPerson', null], ['pickWorldObject', 29]])
  assert.equal(result.events[0].canvasOwned, true); assert.equal(result.events[0].x, 814)
})

test('pointer observation preserves a thrown original error and still restores wrappers', () => {
  const canvas = { addEventListener() {}, removeEventListener() {} }, failure = new Error('original picker failure')
  let count = 0
  const scene = { renderer: { domElement: canvas }, world: { turn: 1 },
    pickUnit() { count++; throw failure }, pickWorldObject: () => null, picking: { pickPerson: () => null } }
  const original = scene.pickUnit, observer = probes.observeEntityPointer(scene, { elementFromPoint: () => canvas })
  assert.throws(() => scene.pickUnit({}), error => error === failure)
  assert.equal(count, 1); assert.equal(observer.finish().restored, true); assert.equal(scene.pickUnit, original)
})

test('actual mixed and terrain wrappers preserve arguments, prototype methods, errors and immutable cache observations', () => {
  const listeners = new Map(), canvas = {
    getBoundingClientRect: () => ({ left: 200, top: 0, width: 1240, height: 1000 }),
    addEventListener: (type, fn, capture) => listeners.set(type + !!capture, fn),
    removeEventListener: (type, fn, capture) => { assert.equal(listeners.get(type + !!capture), fn); listeners.delete(type + !!capture) },
  }
  const event = { type: 'pointerup', clientX: 806, clientY: 289, button: 0, buttons: 0,
    ctrlKey: false, shiftKey: false, altKey: false, metaKey: false, pointerType: 'mouse', target: canvas, isTrusted: true }
  const point = { x: -5, z: 25 }, failure = new Error('real mixed picker failed'), calls = []
  let fail = false, scene
  const picking = Object.assign(Object.create({ pick(argument) {
    assert.equal(this, picking); assert.equal(argument, event); calls.push('mixed')
    this.lastKey = '715,806,289'; this.lastId = 777; this.lastKind = 'model'
    if (fail) throw failure
    return 777
  } }), { lastKey: '714,808,291', lastId: 29, lastKind: 'model', pickPerson() { return null } })
  scene = Object.assign(Object.create({ pick(argument) {
    assert.equal(this, scene); assert.equal(argument, event); calls.push('ground'); return point
  } }), { renderer: { domElement: canvas }, world: { turn: 715 }, picking,
    pickUnit: () => null, pickWorldObject: () => null })
  const originalMixed = picking.pick, originalGround = scene.pick
  const observer = probes.observeEntityPointer(scene, { elementFromPoint: () => canvas })
  listeners.get('pointeruptrue')(event)
  assert.deepEqual(calls, [], 'Capture must not diagnose by invoking a picker')
  assert.equal(picking.pick(event), 777); assert.equal(scene.pick(event), point)
  assert.equal(scene.pickWorldObject(event), null, 'Mixed model winner can remain distinct from a recognized world object')
  fail = true; assert.throws(() => picking.pick(event), error => error === failure)
  listeners.get('pointerupfalse')(event)
  const observed = observer.finish()
  assert.deepEqual(calls, ['mixed', 'ground', 'mixed'])
  assert.equal(observed.restored, true); assert.deepEqual(observed.errors, [])
  assert.equal(picking.pick, originalMixed); assert.equal(scene.pick, originalGround)
  assert.equal(Object.hasOwn(picking, 'pick'), false); assert.equal(Object.hasOwn(scene, 'pick'), false)
  const [mixed, ground, object, thrown] = observed.events[0].picks
  assert.equal(mixed.id, 777); assert.equal(mixed.after.lastKind, 'model'); assert.equal(object.id, null)
  assert.deepEqual(ground.point, point); assert.equal(thrown.threw, true); assert.match(thrown.error, /real mixed picker failed/)
  assert.equal(mixed.receiverMatches, true); assert.equal(mixed.args.clientX, 806)
  picking.lastKey = 'later'; scene.world.turn++
  assert.equal(mixed.before.lastKey, '714,808,291'); assert.equal(mixed.after.lastKey, '715,806,289')
  assert.equal(observed.events[0].state.turn, 715); assert.equal(observed.events[0].state.armedWorldMatches, true)
  assert.equal(listeners.size, 0)
})

test('actual entity preparation rejects disabled context before any final picker and rejects a stale final target', async () => {
  const moduleURL = new URL('./command-probes.mjs', import.meta.url).href
  const prepareSource = section('prepareEntityClick', 'finishEntityClick').replaceAll('./command-probes.mjs', moduleURL)
  assert.ok(prepareSource.length > 0)
  for (const fault of ['disabled', 'stale', null]) {
    const calls = [], before = { turn: 20, selected: [30] }
    const execute = new AsyncFunction('assert', 'calls', 'fault', 'before', `
      const log = entry => calls.push(entry.action), page = { evaluate: async (fn, input) => {
        calls.push(input.hit ? 'final synchronous picker' : 'detached clone');
        return input.hit ? { valid: fault !== 'stale', turn: 22 } :
          { turn: 21, selected: [30], targetId: 29, context: { model: 20, enabled: fault !== 'disabled' } };
      } };
      ${prepareSource}
      await prepareEntityClick({ id: 29, collection: 'shrines', x: 814, y: 300 }, before);
    `)
    const run = execute(assert, calls, fault, before)
    if (fault) await assert.rejects(run, fault === 'disabled' ? /enabled detached-clone/ : /became stale/)
    else await run
    assert.equal(calls.includes('final synchronous picker'), fault !== 'disabled')
    assert.equal(calls[0], 'detached clone')
  }
})

test('actual delivery and finalizer bodies preserve the original partial-click error and retain a separate cleanup error', async () => {
  for (const cleanupFault of [false, true]) for (const partial of [[], [{ type: 'pointerdown', x: 814, y: 300 }]]) {
    const primary = new Error('original browser input delivery failed'), failures = [], logs = []
    const execute = new AsyncFunction('deps', `
      const { assert, primary, failures, logs, cleanupFault, partial } = deps;
      const level = 1, before = { turn: 20, lastOrderTurn: 19, selected: [30] };
      const read = async () => before, requireOrderable = () => {}, requireDeclaredPreacherOrder = () => {};
      const sermonPlan = null, capturePendingSermon = async () => {}, prepareEntityClick = async () => {};
      const log = entry => logs.push(entry);
      const page = { mouse: { click: async () => { throw primary; } },
        evaluate: async () => ({ restored: !cleanupFault, errors: [], events: partial }) };
      ${section('finishEntityClick', 'clickOrder')}
      ${section('clickOrder', 'groundHit')}
      await clickOrder({ id: 29, collection: 'shrines', x: 814, y: 300 });
    `)
    await assert.rejects(execute({ assert, primary, failures, logs, cleanupFault, partial }), error => error === primary)
    assert.equal(logs.some(entry => entry.action === 'entity-delivered-pointer-observation'), true)
    assert.equal(failures.length, cleanupFault ? 1 : 0)
    if (cleanupFault) {
      assert.match(failures[0].error, /Restore the actual picker/)
      assert.match(failures[0].primaryError, /original browser input delivery failed/)
    }
  }
})
