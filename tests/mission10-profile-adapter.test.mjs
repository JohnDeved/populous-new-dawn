import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { createContext, runInContext, runInNewContext } from 'node:vm'
import { withMission10Context } from '../scripts/tutorial-browser/mission10-profile.mjs'
import { browserConfiguration } from '../scripts/tutorial-browser/browser-config.mjs'
import { validateMission10Profile } from '../scripts/integration-queue/profile-recovery.mjs'
import { mission10ReceiptFixture } from './support/mission10-profile-receipt.mjs'
import { createMission10Input, readMission10Ground, readMission10Minimap, mission10BoatPoint } from '../scripts/tutorial-browser/mission10-input.mjs'
import { checkpointCodec } from '../scripts/tutorial-browser/checkpoint-codec.mjs'
import { createWorld } from '../app/world-initialization.ts'
const sha = '1'.repeat(40)

test('M10 companion requires complete source-bound Save/Load, all public selections and cleanup', () => {
  const good = mission10ReceiptFixture(sha)
  assert.equal(validateMission10Profile(good, sha), true)
  for (const mutate of [
    v => { delete v.phases[0].binding }, v => { v.phases[0].binding.pop() },
    v => { v.phases[1].binding.push(true) }, v => { v.phases[1].binding.reverse() },
    v => { delete v.phases[0].saved }, v => { v.phases[0].saved.pop() },
    v => { delete v.phases[1].loaded }, v => { v.phases[1].loaded.push('extra') }, v => { v.phases[1].loaded.reverse() },
    v => { v.phases[0].saved[0] = 2 }, v => { v.phases[1].saved = [...v.phases[0].saved] }, v => { v.phases[1].loaded[0] = 2 },
    v => { delete v.artifacts }, v => { v.artifacts.path = 'mission10-created/private.json' },
    v => { v.artifacts.bytes = 0 }, v => { v.phases[0].receiptName = 'mission10-created/receipt.json' },
    v => { v.phases[1].resultName = 'unretained.json' },
    v => { v.phases.pop() }, v => { v.phases.reverse() }, v => { v.sourceCommit = '2'.repeat(40) },
    v => { v.phases[1].binding[0] = 'b'.repeat(64) }, v => { v.phases[1].binding[0] = 'b'.repeat(64) }, v => { v.phases[1].binding[2] = false },
    v => { v.phases[1].binding[3] = '44444444-4444-4444-4444-444444444444' },
    v => { v.phases[1].binding[4] = v.phases[0].binding[4] }, v => { v.phases[1].binding[5] = null },
    v => { v.phases[0].binding[6] = false }, v => { v.phases[1].binding[7] = false },
    v => { v.phases[1].checkpointAtStart = 'b'.repeat(64) }, v => { v.phases[1].loaded[5] = 'b'.repeat(64) },
    v => { v.phases[0].selection = [] }, v => { v.phases[1].selection.pop() },
    v => { v.phases[0].selection[0].checks.pop() }, v => { v.phases[0].selection[0].checks[0][3].shift() },
    v => { v.phases[0].selection[0].checks[0][2] = [63] }, v => { v.phases[0].selection[0].checks[0][4] = false },
    v => { v.phases[0].selection[0].checks[0][0] = 'Select and focus shaman' },
    v => { v.phases[0].selection[0].checks[1][1] = 'Shift' },
    v => { v.phases[0].selection[0].occupants[0][2] = 0 },
    v => { v.phases[1].selection[1].occupants[0][2] = 62 },
    v => { v.phases[0].publicActions.splice(1, 1) }, v => { v.phases[1].publicActions.pop() },
    v => { v.phases[0].screenshots.pop() }, v => { v.phases[1].receiptSha256 = '' },
  ]) {
    const copy = structuredClone(good); mutate(copy)
    assert.throws(() => validateMission10Profile(copy, sha), /Mission 10/)
  }
  for (const mutate of [
    v => { delete v.phases[0].selection[0].query },
    v => { v.phases[0].selection[0].query[3] += 'junk' },
    v => { v.phases[0].selection[0].checks[4][3].pop() },
    v => { v.phases[0].selection[0].checks[5][3].push(999) },
    v => { v.phases[1].selection[1].checks[4][3] = [63, 111, 112, 113, 114] },
  ]) { const bad = structuredClone(good); mutate(bad); assert.throws(() => validateMission10Profile(bad, sha)) }
  assert.throws(() => validateMission10Profile(undefined, sha), /Mission 10/)
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
  globalThis.document = { elementFromPoint: () => scene.renderer.domElement }
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

test('fixedGround invokes the actual serialized callback in one task under supported Playwright evaluation semantics', async () => {
  // Run the installed, lock-bound evaluator/serializers, not a canned evaluate
  // result or fn(arg) mock. This is a Node VM boundary test, not rendered QA.
  const packagePath = createRequire(import.meta.url).resolve('playwright-core/package.json')
  const bundle = readFileSync(resolve(dirname(packagePath), 'lib/coreBundle.js'), 'utf8')
  assert.match(bundle, /isFunction: typeof pageFunction === "function"/)
  const generated = bundle.slice(bundle.indexOf('// packages/playwright-core/src/generated/utilityScriptSource.ts'))
  const literal = generated.match(/\bsource\d* = ('(?:\\.|[^'\\])*');/)?.[1]
  assert.ok(literal, 'Installed Playwright must expose its supported injected evaluator')
  const realm = createContext({ module: { exports: {} } })
  runInContext(runInNewContext(literal), realm)
  runInContext(`globalThis.utility = new UtilityScript(globalThis, false);
    globalThis.codec = (${checkpointCodec.toString()});
    globalThis.world = codec(${JSON.stringify(checkpointCodec(createWorld(10)))}, true);
    globalThis.inspections = [];
    globalThis.canvas = { getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }) };
    globalThis.scene = { world, renderer: { domElement: canvas },
      screen: target => { inspections.push(['screen', target, world.turn]); return { x: 0, y: 0 } },
      pickUnit: () => null, picking: { pickPerson: () => null }, pickWorldObject: () => null,
      pick: () => ({ x: 27, z: -27 }) };
    globalThis.window = { testSceneRef: { current: scene } };
    globalThis.document = { elementFromPoint: () => canvas };`, realm)
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
  const input = createMission10Input({ page, signal: controller.signal, report: { actions: [] }, save() {}, originalShamanId: null })
  calls = 0
  const ground = await input.fixedGround({ x: 27, z: -27 })
  assert.equal(callbackType, 'function'); assert.equal(calls, 1)
  assert.deepEqual(ground.point, { x: 27, z: -27 })
  assert.equal(ground.inspected, 1); assert.equal(ground.context.model, 3); assert.equal(ground.context.enabled, true)
  const snapshot = checkpointCodec(returned.transfer, true)
  assert.equal(snapshot.turn, ground.turn)
  assert.ok(snapshot.land.heights instanceof Int16Array)
  assert.ok(snapshot.buildingFootprints instanceof Map)
  assert.deepEqual(structuredClone(realm.inspections), [['screen', { x: 27, z: -27 }, ground.turn]])
  assert.equal(runInContext('JSON.stringify(codec(world))', realm), before,
    'Geometry observation and detached Node command validation must not mutate the live World')
  for (const change of ['document.elementFromPoint = () => null', 'scene.pick = () => ({ x: 27.351, z: -27 })']) {
    runInContext('document.elementFromPoint = () => canvas', realm); runInContext(change, realm)
    await assert.rejects(input.fixedGround({ x: 27, z: -27 }), /0.35/)
  }
  runInContext('scene.pick = () => ({ x: -67, z: 45 })', realm)
  await assert.rejects(input.fixedGround({ x: -67, z: 45 }), /ordinary ground command/)
  assert.equal(runInContext('JSON.stringify(codec(world))', realm), before)
  controller.abort(Error('outer deadline')); calls = 0
  await assert.rejects(input.fixedGround({ x: 27, z: -27 }), /outer deadline/)
  assert.equal(calls, 0)
})

test('hosted adapter never admits dev-server imports or a seeded checkpoint and retains public Save submenu', () => {
  const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')
  const input = read('scripts/tutorial-browser/mission10-input.mjs')
  assert.doesNotMatch(input, /import\(['"]\/(?:app|qa)\//)
  assert.match(input, /createMoveContextProbe\(snapshot\)/)
  const adapter = read('scripts/tutorial-browser/mission10-profile.mjs')
  assert.doesNotMatch(adapter, /seedRecords|readwrite|setWorld|\.tick\(|\.advance\(/)
  assert.match(adapter, /source\.status, ''/)
  assert.match(adapter, /lease\.finish\(phase, cleanup\.verified\)/)
  assert.match(read('scripts/local-render/mission10-boat-checkpoint.mjs'), /name: 'Save Game'/)
})
