import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { evaluatePage, pageNode, pageSource } from './support/follower-nearby-page.mjs'

// Execute the complete shipped scene-start effect, including its synchronous
// preamble. Only the dynamic Scene import and React/DOM leaves are supplied;
// real introduction progress and rendering remain the browser gate's job.
const sceneEffect = pageNode(node => ts.isCallExpression(node) &&
  node.expression.getText(pageSource) === 'useEffect' &&
  node.arguments[0]?.getText(pageSource).includes('const created = new GameScene'))
const emitted = ts.transpileModule(`(${sceneEffect.arguments[0].getText(pageSource)})`, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText

function startScene(width, paused) {
  const world = { paused, drawMode: 0 }, engine = { current: null }
  const constructed = Promise.withResolvers(), terrain = Promise.withResolvers(), ready = Promise.withResolvers()
  let starts = 0, disposals = 0
  class GameScene {
    constructor(_viewport, _minimap, _portrait, actualWorld) {
      assert.equal(actualWorld, world)
      this.world = actualWorld
      this.cameraPosition = { x: 0, y: 0 }
      this.ready = terrain.promise
      constructed.resolve(this)
    }
    start() { starts++; return true }
    dispose() { disposals++ }
  }
  const bindings = {
    startup: 'playing', world, window: { innerWidth: width }, engine,
    store: { getWorld: () => world, change: action => action(world), bindPresentation: () => ({}) },
    viewport: { current: {} }, minimap: { current: {} }, portrait: { current: {} },
    gamePreferencesRef: { current: {} }, tooltipSession: { current: {} }, audio: { current: null },
    update() {}, measureWorshipHud() {}, setHudCamera() {},
    setReady(value) { assert.equal(value, true); ready.resolve() },
    setError(message) { ready.reject(new Error(message)) },
  }
  const effect = new Function('require', ...Object.keys(bindings), `return ${emitted}`)(
    name => { assert.equal(name, './scene'); return { GameScene } }, ...Object.values(bindings))
  const cleanup = effect()
  return { world, engine, constructed: constructed.promise, finishLoading: () => terrain.resolve(),
    ready: ready.promise, cleanup, starts: () => starts, disposals: () => disposals }
}

for (const width of [640, 800, 899, 900, 1920]) {
  for (const paused of [false, true]) {
    test(`actual scene start preserves pause=${paused} at ${width}px without an advisory`, async () => {
      const f = startScene(width, paused)
      try {
        assert.equal(f.world.paused, paused, 'scene startup must not introduce a viewport-width pause')
        assert.equal(f.engine.current, null, 'the synchronous preamble runs before Scene import resolves')
        const scene = await f.constructed
        assert.equal(f.engine.current, scene)
        assert.equal(f.world.paused, paused, 'scene construction preserves new-game or checkpoint pause')
        f.finishLoading()
        await f.ready
        assert.equal(f.starts(), 1)
        assert.equal(f.world.paused, paused, 'terrain completion must not overwrite pause ownership')
      } finally { f.cleanup() }
      assert.equal(f.engine.current, null)
      assert.equal(f.disposals(), 1)
    })
  }
}

const inputSource = ts.createSourceFile('scene-input-runtime.ts',
  readFileSync(new URL('../app/scene-input-runtime.ts', import.meta.url), 'utf8'),
  ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
const installInput = inputSource.statements.find(node => ts.isFunctionDeclaration(node) &&
  node.name?.text === 'installInputListeners')
assert.ok(installInput)

for (const reason of ['blur', 'hidden']) {
  test(`actual ${reason} pause during scene loading remains owned after readiness at 800px`, async () => {
    const f = startScene(800, false)
    try {
      const scene = await f.constructed, window = {}, document = { hidden: false }, listeners = []
      let changes = 0, cancellations = 0
      Object.assign(scene, {
        renderer: { domElement: {} }, keys: new Set(['w']), previous: 42,
        onChange() { changes++ },
        listen(target, type, callback) { listeners.push({ target, type, callback }) },
      })
      // Real listener installation and pause callback; pointer-gesture teardown
      // is a supplied leaf, independently covered by pointer-interruption tests.
      evaluatePage(installInput.getText(inputSource).replace(/^export /, ''), {
        window, document, globalThis: window, cancelPointerGesture() { cancellations++ },
      })(scene, {})
      const emit = (target, type) => listeners.find(item => item.target === target && item.type === type).callback()
      emit(document, 'visibilitychange')
      assert.equal(f.world.paused, false, 'visible-tab notification alone must not pause')
      if (reason === 'hidden') {
        document.hidden = true
        emit(document, 'visibilitychange')
      } else emit(window, 'blur')
      assert.equal(f.world.paused, true)
      assert.equal(scene.keys.size, 0)
      assert.equal(scene.previous, null)
      assert.equal(changes, 1)
      assert.equal(cancellations, 1)
      f.finishLoading()
      await f.ready
      assert.equal(f.world.paused, true, 'removing the advisory must not blanket-resume the world')
    } finally { f.cleanup() }
  })
}
