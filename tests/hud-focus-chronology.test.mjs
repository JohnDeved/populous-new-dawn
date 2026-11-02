import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
const tree = file => ts.createSourceFile(file, fs.readFileSync(new URL('../app/' + file, import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true, file.endsWith('tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
const execute = (source, bindings, tail) => new Function(...Object.keys(bindings), ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText + ';' + tail)(...Object.values(bindings))
const runtime = tree('scene-input-runtime.ts'), camera = tree('scene-camera-runtime.ts'), page = tree('page.tsx'), source = tree('scene.ts')
const functions = (ast, names) => { const nodes = ast.statements.filter(n => ts.isFunctionDeclaration(n) && names.includes(n.name?.text)); assert.equal(nodes.length, names.length); return nodes.map(n => n.getText(ast).replace(/^export /, '')).join('\n') }
const sceneClass = source.statements.find(n => ts.isClassDeclaration(n) && n.name?.text === 'GameScene')
const methods = sceneClass.members.filter(n => ts.isMethodDeclaration(n) && ['chooseFollowers', 'chooseTransport', 'advanceInputTime'].includes(n.name.getText(source)))
assert.equal(methods.length, 3)
const callers = []
function visit(n) { if (ts.isFunctionDeclaration(n) && n.name?.text === 'followerControl') callers.push(n); ts.forEachChild(n, visit) }
visit(page); assert.equal(callers.length, 1)
function fixture(kind, effect = 'move') {
  let now = 100
  const sentinel = { phase: effect }, target = owners => { if (effect === 'throwLookup') throw sentinel; return owners[0]?.id }
  const calls = [], owner = { id: 7, x: 2, y: 3 }, world = { units: [{ team: 'blue', hp: 1 }], vehicles: [owner], people: [owner], inputMask: 0, manaWorld: { gameFlags: 0 }, castingTribes: [{ flags: 0 }], cameras: { phase: 'idle' }, mode: null }
  const helpers = execute(functions(runtime, ['chooseFollowers', 'chooseTransport']), {
    hudTaskPeople: w => w.people, hudPeople: w => w.people, hudTransports: w => w.vehicles,
    focusTaskFollower: target, focusHudPerson: target, focusTransport: target,
    browserPosition: p => ({ x: p.x, y: p.y }), isShaman: () => true,
  }, 'return {chooseFollowers, chooseTransport}')
  const { focus } = execute(functions(camera, ['focus']), { withSimulationCamera: (_c, run) => run(), nativePosition: (_w, p) => p, requestCameraFocus: (_m, _p, target) => { calls.push(['request', target.x, target.y]); if (effect === 'throwFocus') throw sentinel } }, 'return {focus}')
  const Scene = execute('class Scene {' + methods.map(n => n.getText(source)).join('\n') + '}', {
    ...helpers, performance: { now: () => { const value = now; now += 100; return value } }, previewGroundZoom() {},
    advanceGame(w, _clock, seconds) {
      calls.push(['drain', seconds, w.castingTribes[0].flags])
      if (!seconds) return
      if (effect === 'move') { owner.x = 20; owner.y = 30 }
      if (effect === 'remove') { w.people = []; w.vehicles = [] }
      if (effect === 'mask') w.inputMask = 1
      if (effect === 'retire') scene.disposed = true
    },
  }, 'return Scene')
  const scene = new Scene()
  Object.assign(scene, { world, started: true, disposed: false, inputDepth: 0, previous: 0, modalSuspended: false, gameClock: {}, overviewStage: 0, overviewActive: false, hudFocus: [], hudTaskFocus: [], hudTransportFocus: [], cameraPosition: { x: 0, y: 0 }, cameraMotion: {}, tooltip: { draw: 1 },
    focus(p, options) { calls.push(['focus', p.x, p.y]); focus(this, p, options) }, captureCamera() {}, cancelOverview() {}, objectPanels: { open(id) { calls.push(['open', id]) } }, onChange() { calls.push(['change']) }, publishCameraInput() { calls.push(['publish']) } })
  const followerControl = execute(callers[0].getText(page), { engine: { current: scene }, followerPress: { current: null } }, 'return followerControl')
  const controls = followerControl(7, kind === 'task' ? 1 : undefined, kind === 'vehicle' ? 1 : undefined)
  const run = () => controls.onContextMenu({ button: 2, ctrlKey: false, shiftKey: false, currentTarget: { disabled: false }, preventDefault() { calls.push(['prevent']) } })
  return { calls, scene, world, run, sentinel }
}
for (const kind of ['follower', 'task', 'vehicle']) {
  test(`${kind}: direct React focus resolves coordinates after elapsed work`, () => {
    const f = fixture(kind); f.run()
    assert.deepEqual(f.calls.slice(0, 3), [['prevent'], ['drain', .1, 0], ['focus', 20, 30]])
    assert.deepEqual(f.calls.filter(c => c[0] === 'request'), [['request', 20, 30]])
    assert.deepEqual(f.calls.slice(-3), [['open', 7], ['change'], ['publish']])
    assert.equal(f.scene.previous, 100)
  })
  test(`${kind}: target removed by elapsed work is not focused or opened`, () => {
    const f = fixture(kind, 'remove'); f.run()
    assert.deepEqual(f.calls, [['prevent'], ['drain', .1, 0], ['change'], ['publish']])
  })
  for (const effect of ['mask', 'retire']) test(`${kind}: ${effect} during entry drain cancels owner writes`, () => {
    const f = fixture(kind, effect); f.run()
    assert.deepEqual(f.calls, effect === 'retire' ? [['prevent'], ['drain', .1, 0]] : [['prevent'], ['drain', .1, 0], ['publish']])
    assert.equal(f.world.castingTribes[0].flags, 0)
    assert.deepEqual(f.scene.hudFocus, [])
    assert.deepEqual(f.scene.hudTaskFocus, [])
    assert.deepEqual(f.scene.hudTransportFocus, [])
  })
}

for (const kind of ['follower', 'task', 'vehicle']) {
  for (const effect of ['throwLookup', 'throwFocus']) test(`${kind}: ${effect} preserves error and releases input depth`, () => {
    const f = fixture(kind, effect)
    assert.throws(f.run, error => error === f.sentinel)
    assert.equal(f.scene.inputDepth, 0)
    assert.deepEqual(f.calls.at(-1), ['publish'])
    assert.equal(f.calls.filter(c => c[0] === 'drain').length, 1)
  })
  test(`${kind}: existing outer input owner suppresses nested drain and retains its depth`, () => {
    const f = fixture(kind); f.scene.inputDepth = 1; f.run()
    assert.equal(f.scene.inputDepth, 1)
    assert.equal(f.calls.filter(c => c[0] === 'drain').length, 0)
    assert.deepEqual(f.calls.filter(c => c[0] === 'request'), [['request', 2, 3]])
    assert.deepEqual(f.calls.at(-1), ['publish'])
  })
}
