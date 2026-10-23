import { withoutCampaignPopup } from './support/world-input-page.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { createContext, runInContext, runInNewContext } from 'node:vm'
import { withMission10Context } from '../scripts/tutorial-browser/mission10-profile.mjs'
import { browserConfiguration } from '../scripts/tutorial-browser/browser-config.mjs'
import { validateMission10Profile } from '../scripts/integration-queue/profile-recovery.mjs'
import { mission10ReceiptFixture, compactMission10Fixture, mission10EvidenceFixture } from './support/mission10-profile-receipt.mjs'
import { createMission10Input, readMission10Ground, readMission10Minimap, mission10BoatPoint, readMission10Selection, readMission10Observation } from '../scripts/tutorial-browser/mission10-input.mjs'
import { checkpointCodec } from '../scripts/tutorial-browser/checkpoint-codec.mjs'
import { createWorld } from '../app/world-initialization.ts'
import { createLivePerson } from '../app/live-people.ts'
const sha = '1'.repeat(40)

test('M10 companion requires complete source-bound Save/Load, all public selections and cleanup', () => {
  const template = mission10ReceiptFixture(sha)
  const good = compactMission10Fixture(template), evidence = mission10EvidenceFixture(template)
  assert.equal(validateMission10Profile(good, sha, evidence), true)
  for (const mutate of [
    v => { delete v.phases[0].binding }, v => { v.phases[0].binding.pop() },
    v => { v.phases[1].binding.push(true) }, v => { v.phases[1].binding.reverse() },
    v => { delete v.phases[0].saved }, v => { v.phases[0].saved.pop() },
    v => { delete v.phases[1].loaded }, v => { v.phases[1].loaded.push('extra') }, v => { v.phases[1].loaded.reverse() },
    v => { v.phases[0].saved[0] = 1 }, v => { v.phases[1].saved = [...v.phases[0].saved] }, v => { v.phases[1].loaded[0] = 1 },
    v => { v.phases[0].saved[0] = 4 }, v => { v.phases[1].loaded[0] = 4 },
    v => { v.phases[0].saved[0] = 2 }, v => { v.phases[1].loaded[0] = 2 },
    v => { delete v.artifacts }, v => { v.artifacts.path = 'mission10-created/private.json' },
    v => { v.artifacts.bytes = 0 }, v => { v.phases[0].receiptName = 'mission10-created/receipt.json' },
    v => { v.phases[1].resultName = 'unretained.json' },
    v => { v.phases.pop() }, v => { v.phases.reverse() }, v => { v.sourceCommit = '2'.repeat(40) },
    v => { v.phases[1].binding[0] = 'b'.repeat(64) }, v => { v.phases[1].binding[2] = false },
    v => { v.phases[1].binding[3] = '44444444-4444-4444-4444-444444444444' },
    v => { v.phases[1].binding[4] = v.phases[0].binding[4] }, v => { v.phases[1].binding[5] = null },
    v => { v.phases[0].binding[6] = false }, v => { v.phases[1].binding[7] = false },
    v => { v.phases[1].checkpointAtStart = 'b'.repeat(64) }, v => { v.phases[1].loaded[5] = 'b'.repeat(64) },
    v => { v.phases[0].selection = [] }, v => { delete v.phases[1].selection },
    v => { v.phases[0].publicActions.splice(1, 1) }, v => { v.phases[1].publicActions.pop() },
    v => { v.phases[0].screenshots.pop() }, v => { v.phases[1].receiptSha256 = '' },
  ]) {
    const copy = structuredClone(good); mutate(copy)
    assert.throws(() => validateMission10Profile(copy, sha, evidence), /Mission 10/)
  }
  for (const mutate of [
    r => { r[0].selection = [] }, r => { r[1].selection.pop() }, r => { r[0].selection[0].checks.pop() },
    r => { r[0].selection[0].checks[0].selected.shift() }, r => { r[0].selection[0].checks[0].cleared = [63] },
    r => { r[0].selection[0].checks[0].preserved = false }, r => { r[0].selection[0].checks[0].name = 'Select and focus shaman' },
    r => { r[0].selection[0].checks[1].modifier = 'Shift' }, r => { r[0].selection[0].occupants[0].vehicle = 0 },
    r => { r[1].selection[1].occupants[0].vehicle = 62 }, r => { delete r[0].selection[0].query },
    r => { r[0].selection[0].query.people[0].push('junk') }, r => { r[0].selection[0].checks[4].selected.pop() },
    r => { r[0].selection[0].checks[5].selected.push(999) }, r => { r[1].selection[1].checks[4].selected = [63, 111, 112, 113, 114] },
  ]) {
    const raw = structuredClone(evidence); mutate(raw)
    assert.throws(() => validateMission10Profile(good, sha, raw))
  }
  assert.throws(() => validateMission10Profile(good, sha), /bound raw evidence missing/)
  assert.throws(() => validateMission10Profile(undefined, sha, evidence), /Mission 10/)
})

function browserFixture() {
  let connected = true, closes = 0
  const browser = { isConnected: () => connected }
  const context = { browser: () => browser, close: async () => { closes++; connected = false } }
  return { context, count: () => closes }
}
test('persistent context uses official sandboxed configuration and terminates before successful return', async () => {
  const f = browserFixture(), cleanup = { verified: false }, controller = new AbortController()
  const value = await withMission10Context({
    chromium: { launchPersistentContext: async (path, options) => {
      assert.equal(path, '/task/only'); assert.equal(options.chromiumSandbox, true)
      assert.deepEqual(options.args, ['--headless', '--remote-debugging-pipe', '--user-data-dir=/task/only', 'about:blank'])
      assert.equal(options.serviceWorkers, 'block'); assert.equal(options.acceptDownloads, false)
      return f.context
    } }, dataDir: '/task/only', launch: browserConfiguration().launch, signal: controller.signal, cleanup,
  }, async () => 'observed')
  assert.equal(value, 'observed'); assert.equal(cleanup.verified, true); assert.equal(f.count(), 1)
})
test('abort during unresolved Chrome launch closes that exact late context without running the scenario', async () => {
  const f = browserFixture(), cleanup = { verified: false }, controller = new AbortController()
  let resolveLaunch
  const running = withMission10Context({ chromium: { launchPersistentContext: () => new Promise(resolve => { resolveLaunch = resolve }) },
    dataDir: '/task/only', launch: browserConfiguration().launch, signal: controller.signal, cleanup },
  () => assert.fail('Aborted scenario must not run'))
  controller.abort(Error('outer deadline')); resolveLaunch(f.context)
  await assert.rejects(running, /outer deadline/)
  assert.equal(cleanup.verified, true); assert.equal(f.count(), 1)
})
test('abort during active scenario and scenario failure both close the context; unknown cleanup fails closed', async () => {
  for (const abort of [false, true]) {
    const f = browserFixture(), cleanup = { verified: false }, controller = new AbortController()
    await assert.rejects(withMission10Context({ chromium: { launchPersistentContext: async () => f.context },
      dataDir: '/task/only', launch: browserConfiguration().launch, signal: controller.signal, cleanup }, async () => {
      if (abort) controller.abort(Error('outer deadline'))
      throw Error('route failed')
    }), /route failed/)
    assert.equal(cleanup.verified, true); assert.equal(f.count(), 1)
  }
  const cleanup = { verified: false }
  await assert.rejects(withMission10Context({ chromium: { launchPersistentContext: async () => ({
    browser: () => ({ isConnected: () => true }), close: async () => {},
  }) }, dataDir: '/task/only', launch: browserConfiguration().launch, signal: new AbortController().signal, cleanup }, async () => {}), /terminate/)
  assert.equal(cleanup.verified, false)
})

test('production helpers keep native coordinate/minimap math and strict canvas/ground aim checks', async () => {
  const priorWindow = globalThis.window, priorDocument = globalThis.document, canvas = {}
  const scene = { mini: { width: 100, height: 80, getBoundingClientRect: () => ({ x: 2, y: 3, width: 200, height: 160 }) },
    viewPoint: { x: 27, z: -27 }, cameraBearing: Math.PI / 2,
    renderer: { domElement: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }) } },
    world: { turn: 2, vehicles: [{ id: 62, x: 2048 + 27 * 256, y: 27 * 256 - 2048 }] },
    screen: () => ({ x: 0, y: 0 }), pickUnit: () => null, picking: { pickPerson: () => null },
    pickWorldObject: () => null, pick: () => ({ x: 27, z: -27 }) }
  globalThis.window = { testSceneRef: { current: scene } }
  globalThis.document = { elementFromPoint: () => scene.renderer.domElement, querySelectorAll: () => [] }
  try {
    const geometry = readMission10Minimap({ x: 27, z: -27 })
    assert.deepEqual(geometry.center, { x: 8960, y: 4864 }); assert.equal(geometry.heading, 512)
    assert.deepEqual(geometry.target, geometry.center)
    assert.equal(readMission10Ground({ x: 27, z: -27 }).inspected, 1)
    scene.pick = () => ({ x: 27.351, z: -27 })
    assert.throws(() => readMission10Ground({ x: 27, z: -27 }), /0.35/)
    scene.pick = () => ({ x: 27, z: -27 }); scene.pickWorldObject = () => ({ id: 62 })
    const hit = await mission10BoatPoint({ evaluate: (fn, arg) => fn(arg) }, 62)
    assert.deepEqual(hit.target, { x: 27, z: -27 })
    globalThis.document.elementFromPoint = () => canvas
    await assert.rejects(mission10BoatPoint({ evaluate: (fn, arg) => fn(arg) }, 62), /exposed/)
  } finally { globalThis.window = priorWindow; globalThis.document = priorDocument }
})

function installedPlaywrightRealm() {
  const packagePath = createRequire(import.meta.url).resolve('playwright-core/package.json')
  const bundle = readFileSync(resolve(dirname(packagePath), 'lib/coreBundle.js'), 'utf8')
  assert.match(bundle, /isFunction: typeof pageFunction === "function"/)
  const generated = bundle.slice(bundle.indexOf('// packages/playwright-core/src/generated/utilityScriptSource.ts'))
  const literal = generated.match(/\bsource\d* = ('(?:\\.|[^'\\])*');/)?.[1]
  assert.ok(literal, 'Installed Playwright must expose its supported injected evaluator')
  const realm = createContext({ module: { exports: {} }, structuredClone })
  runInContext(runInNewContext(literal), realm)
  return realm
}

test('fixedGround invokes the actual serialized callback in one task under supported Playwright evaluation semantics', async () => {
  // Run the installed, lock-bound evaluator/serializers, not a canned evaluate
  // result or fn(arg) mock. This is a Node VM boundary test, not rendered QA.
  const realm = installedPlaywrightRealm()
  runInContext(`globalThis.utility = new UtilityScript(globalThis, false);
    globalThis.codec = (${checkpointCodec.toString()});
    globalThis.world = codec(${JSON.stringify(checkpointCodec(createWorld(10, 'scalable')))}, true);
    globalThis.inspections = [];
    globalThis.canvas = { getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }) };
    globalThis.scene = { world, renderer: { domElement: canvas },
      screen: target => { inspections.push(['screen', target, world.turn]); return { x: 0, y: 0 } },
      pickUnit: () => null, picking: { pickPerson: () => null }, pickWorldObject: () => null,
      pick: () => ({ x: 27, z: -27 }) };
    globalThis.window = { testSceneRef: { current: scene } };
    globalThis.document = { elementFromPoint: () => canvas, querySelectorAll: () => [] };`, realm)
  const before = runInContext('JSON.stringify(codec(world))', realm), controller = new AbortController()
  let calls = 0, returned, callbackType
  const page = { async evaluate(fn, arg) {
    calls++; callbackType = typeof fn
    // Playwright marks strings isFunction:false, and functions true. Its
    // injected evaluator also performs real argument and return serialization.
    realm.isFunction = typeof fn === 'function'
    realm.expression = typeof fn === 'function' ? `(${fn.toString()})` : fn
    realm.argument = structuredClone(arg)
    const value = runInContext(`parseEvaluationResultValue(utility.evaluate(isFunction, true, expression, 1,
      serializeAsCallArgument(argument, value => ({ fallThrough: value }))))`, realm)
    assert.notEqual(typeof value?.then, 'function', 'Geometry and World capture must be synchronous')
    returned = structuredClone(value)
    return returned
  } }
  assert.equal(await page.evaluate('target => ({ target })', { x: 27, z: -27 }), undefined,
    'The old arrow-string is not invoked and reproduces the hosted undefined result')
  const report = { actions: [] }
  const input = createMission10Input({ page: withoutCampaignPopup(page), signal: controller.signal, report, save() {}, originalShamanId: null })
  calls = 0
  const ground = await input.fixedGround({ x: 27, z: -27 })
  assert.equal(callbackType, 'function'); assert.equal(calls, 1, 'Geometry and World still share one task after DOM-only popup preparation')
  assert.deepEqual(ground.point, { x: 27, z: -27 })
  assert.equal(ground.inspected, 1); assert.equal(ground.context.model, 3); assert.equal(ground.context.enabled, true)
  const snapshot = checkpointCodec(returned.transfer, true)
  assert.deepEqual(snapshot.capacityPolicy, { version: 1, mode: 'scalable' })
  assert.equal(snapshot.turn, ground.turn)
  assert.ok(snapshot.land.heights instanceof Int16Array)
  assert.ok(snapshot.buildingFootprints instanceof Map)
  assert.deepEqual(structuredClone(realm.inspections), [['screen', { x: 27, z: -27 }, ground.turn]])
  assert.equal(runInContext('JSON.stringify(codec(world))', realm), before,
    'Geometry observation and detached Node command validation must not mutate the live World')
  for (const change of ['document.elementFromPoint = () => null', 'scene.pick = () => ({ x: 27.351, z: -27 })']) {
    runInContext('document.elementFromPoint = () => canvas', realm); runInContext(change, realm)
    await assert.rejects(input.fixedGround({ x: 27, z: -27 }), /0.35/)
    const failure = report.actions.at(-1)
    assert.equal(failure.label, 'rally-ground-rejection')
    assert.equal(failure.inspected, 91 * 91)
    assert.equal(failure.rejected[change.includes('elementFromPoint') ? 'owner' : 'aim'], 91 * 91)
    assert.deepEqual(failure.center, { x: 50, y: 50 })
    assert.deepEqual(failure.popups, [])
  }
  runInContext('scene.pick = () => ({ x: -67, z: 45 })', realm)
  await assert.rejects(input.fixedGround({ x: -67, z: 45 }), /ordinary ground command/)
  assert.equal(runInContext('JSON.stringify(codec(world))', realm), before)
  controller.abort(Error('outer deadline')); calls = 0
  await assert.rejects(input.fixedGround({ x: 27, z: -27 }), /outer deadline/)
  assert.equal(calls, 0)
})

test('hosted adapter declares native availability but never seeds checkpoints or bypasses public Save', () => {
  const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')
  const input = read('scripts/tutorial-browser/mission10-input.mjs')
  assert.doesNotMatch(input, /import\(['"]\/(?:app|qa)\//)
  assert.match(input, /createMoveContextProbe\(snapshot\)/)
  const adapter = read('scripts/tutorial-browser/mission10-profile.mjs')
  assert.doesNotMatch(adapter, /seedRecords|readwrite|setWorld|\.tick\(|\.advance\(/)
  assert.match(adapter, /source\.status, ''/)
  assert.match(adapter, /prepareCampaignFixture\(page, 10\)/)
  assert.match(adapter, /launchCampaignMission\(page, 10\)/)
  assert.doesNotMatch(adapter, /showAllMissions|launchDebugMission|startDebugMission/)
  assert.match(adapter, /mode, 'created'/)
  assert.match(adapter, /lease\.finish\(phase, cleanup\.verified\)/)
  assert.match(read('scripts/local-render/mission10-boat-checkpoint.mjs'), /name: 'Save Game'/)
})


test('fused observation retains all fields and owner aliases in one synchronous installed-Playwright evaluation', async () => {
  const w = createWorld(10, 'scalable'), party = [63, 111, 112, 113, 114]
  w.paused = true; w.selected = [111]; w.turn = 379
  const u = w.units.find(p => p.id === 111), owner = u.native ??= createLivePerson(w, u)
  u.flight = owner; u.entry = { person: owner }; u.builder = { person: owner }
  w.pathfinding.people.set(u.id, owner)
  const separate = w.units.find(p => p.id === 112)
  separate.native ??= createLivePerson(w, separate)
  w.pathfinding.people.set(separate.id, structuredClone(separate.native))
  const realm = installedPlaywrightRealm()
  runInContext(`globalThis.utility = new UtilityScript(globalThis, false);
    globalThis.codec = (${checkpointCodec.toString()});
    globalThis.world = codec(${JSON.stringify(checkpointCodec(w))}, true);
    globalThis.scene = { world, cameraPosition: { x: 1, y: 2, angle: 0 }, renderer: { getContext: () => ({
      RENDERER: 1, getExtension: () => null, getParameter: () => 'fixture renderer', isContextLost: () => false }) } };
    globalThis.window = { testSceneRef: { current: scene } };
    globalThis.document = { querySelectorAll: () => [{ textContent: 'Boat', getClientRects: () => [{}] }] };`, realm)
  const before = runInContext('JSON.stringify(codec(world))', realm)
  const reference = structuredClone(runInContext(`(${readMission10Selection.toString()})()`, realm))
  let calls = 0
  const page = { async evaluate(fn, arg) {
    calls++; assert.equal(typeof fn, 'function')
    realm.expression = `(${fn.toString()})`; realm.argument = structuredClone(arg)
    const value = runInContext(`parseEvaluationResultValue(utility.evaluate(true, true, expression, 1,
      serializeAsCallArgument(argument, value => ({ fallThrough: value }))))`, realm)
    assert.notEqual(typeof value?.then, 'function', 'No await or intervening RAF task inside the snapshot')
    return structuredClone(value)
  } }
  for (const label of ['boarded-strip-paused', 'loaded: Select warrior single cleared', 'unloaded: Select follower Shift selected']) {
    calls = 0
    const row = await readMission10Observation(page, { label, party, boatId: 62 })
    assert.equal(calls, 1); assert.deepEqual(row.selectionState, reference)
    assert.deepEqual(Object.keys(row), ['label', 'wallTime', 'turn', 'time', 'level', 'renderer', 'contextLost',
      'counts', 'paused', 'inputMask', 'selected', 'status', 'orders', 'randomState', 'boat', 'party', 'panels', 'selectionState'])
    assert.equal(row.turn, w.turn); assert.equal(row.time, w.time); assert.equal(row.level, 10)
    assert.equal(row.paused, true); assert.equal(row.inputMask, w.inputMask); assert.equal(row.status, w.status)
    assert.deepEqual(row.selected, w.selected); assert.deepEqual(row.orders, w.buildingOrders); assert.equal(row.randomState, w.randomState)
    assert.deepEqual(row.counts, { units: w.units.length, vehicles: w.vehicles.length, buildings: w.buildings.length, secondary: w.secondaryEffects.slots.length })
    const boat = w.vehicles.find(v => v.id === 62)
    assert.deepEqual(row.boat, { id: boat.id, x: boat.x, y: boat.y, active: boat.active, passengers: [...boat.passengers] })
    assert.deepEqual(row.party, party.map(id => { const u = w.units.find(u => u.id === id); return { id, kind: u.kind, hp: u.hp, x: u.x, z: u.z,
      vehicle: u.native?.vehicle, state: u.native?.state, flags2: u.native?.flags2, flags4: u.native?.flags4, path: u.path, work: u.work, commands: u.native?.commands, commandStatus: u.native?.commandStatus } }))
    assert.deepEqual(row.panels, [{ text: 'Boat', visible: true }]); assert.equal(row.renderer, 'fixture renderer'); assert.equal(row.contextLost, false)
    assert.deepEqual(row.selectionState.people.find(p => p.id === 111).ownerAliases,
      { native: 'native', flight: 'native', fight: null, entry: 'native', builder: 'native', route: 'native' })
    assert.equal(row.selectionState.people.find(p => p.id === 112).ownerAliases.route, 'route')
    assert.equal(runInContext('JSON.stringify(codec(world))', realm), before, 'Capture must not mutate or adopt live state')
  }
  calls = 0
  const ordinary = await readMission10Observation(page, { label: 'authored-start', party, boatId: 62 })
  assert.equal(calls, 1); assert.equal(Object.hasOwn(ordinary, 'selectionState'), false)
  runInContext('world.paused = false', realm)
  await assert.rejects(readMission10Observation(page, { label: 'boarded-strip-paused', party, boatId: 62 }))
  for (const mutate of [r => { delete r.selectionState }, r => { r.selectionState.turn++ }, r => { r.selectionState.selected = [] }]) {
    runInContext('world.paused = true', realm)
    const corrupt = { evaluate: async (...args) => { const row = await page.evaluate(...args); mutate(row); return row } }
    await assert.rejects(readMission10Observation(corrupt, { label: 'boarded-strip-paused', party, boatId: 62 }))
  }
})
