import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { minimapPick } from '../app/minimap.ts'
import { browserPosition, distance } from '../app/world-coordinates.ts'

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8')
const script = read('scripts/check-browser-mission8-natural.mjs')
const root = ts.createSourceFile('mission8.mjs', script, ts.ScriptTarget.Latest, true)
const focus = root.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'focus')
assert.ok(focus)
// Execute the actual checker control flow and planner with browser/module doubles.
// This is not a rendered-input or earned-campaign claim.
const focusSource = focus.getText(root).replace(/import\(/g, 'loadModule(')
const short = value => (value << 16) >> 16
const nativePosition = (_world, point) => ({
  x: short(Math.round((point.x + 8) * 256)),
  y: short(Math.round((-point.z - 8) * 256)),
})

function fixture({ scale = 1, heading = 0, obstructed = false, dropClick = false,
  replaceScene = false, replaceWorld = false, mutate, picker = minimapPick,
  onPlan, onClick, onRender, onStep } = {}) {
  const calls = [], world = { turn: 0, selected: [241, 129, 130], inputMask: 0,
    status: 'playing', flyby: { flags: 0 }, outcome: { cameraRequest: 0 } },
    point = { x: -59, z: 79 },
    bounds = { left: 0, top: 0, width: 100 * scale, height: 96 * scale },
    mini = { width: 100, height: 96, getBoundingClientRect: () => bounds },
    scene = { world, mini, viewPoint: point, cameraBearing: heading * Math.PI / 1024,
      cameraPosition: { ...nativePosition(world, point), angle: heading },
      cameraMotion: { active: 0 }, frame: 0, wasFlying: false,
      resultCamera: { active: 0 }, resultRequest: 0,
      onChange() {},
      updateCameraMotion() {
        steps++
        this.cameraPosition = this.cameraMotion.target
        this.viewPoint = browserPosition(this.cameraPosition)
        this.cameraMotion.active = 0
        onStep?.(run)
      },
    }
  let disposed = 0, steps = 0, renders = 0, storeWorld = world
  const window = { mission8RafHeld: true, testSceneRef: { current: scene },
    testStore: { getWorld: () => replaceWorld ? {} : storeWorld } },
    document = {
      querySelector: () => null,
      elementFromPoint: (_x, y) => obstructed || y >= 85 * scale ? null : mini,
    },
    page = {
      evaluateHandle: async fn => {
        const handle = fn()
        handle.dispose = async () => { disposed++ }
        if (replaceScene) window.testSceneRef.current = { ...scene }
        return handle
      },
      evaluate: async (fn, argument) => {
        const result = await fn(argument)
        if (argument?.target && 'z' in argument.target) onPlan?.(run)
        return result
      },
      mouse: { click: async (clientX, clientY) => {
        calls.push({ clientX, clientY })
        if (!dropClick) {
          // Model the existing public pointerdown inverse, not the removed flag.
          scene.cameraMotion = { active: 1, target: {
            ...minimapPick(mini.width, mini.height,
              nativePosition(world, scene.viewPoint), heading, {
                x: ((clientX - bounds.left) / bounds.width) * mini.width,
                y: ((clientY - bounds.top) / bounds.height) * mini.height,
              }),
            angle: heading & 2047,
          } }
        }
        mutate?.(world)
        onClick?.(run)
      } },
    },
    render = async () => { renders++; onRender?.(run) },
    loadModule = async path => {
      if (path === '/app/minimap.ts') return { minimapPick: picker }
      assert.equal(path, '/app/model.ts')
      return { nativePosition, browserPosition, distance }
    },
    navigate = Function('assert', 'page', 'render', 'window', 'document', 'loadModule',
      `${focusSource}; return focus`)(assert, page, render, window, document, loadModule),
    run = { navigate, calls, scene, world, window, document, disposed: () => disposed,
      steps: () => steps, renders: () => renders,
      replaceCoherentWorld() {
        const replacement = structuredClone(world)
        scene.world = replacement
        storeWorld = replacement
        assert.deepEqual(replacement, world, 'Replacement has identical turn, selection and other values')
        assert.notEqual(replacement, world)
      },
    }
  return run
}

const interruptions = {
  popup: run => { run.document.querySelector = () => ({ open: true }) },
  modal: run => { run.scene.modalSuspended = true },
  inputMask: run => { run.world.inputMask = 4 },
  overviewActive: run => { run.scene.overviewActive = true },
  overviewStage: run => { run.scene.overviewStage = 'enter' },
  flyby: run => { run.world.flyby.flags = 1 },
  wasFlying: run => { run.scene.wasFlying = true },
  resultCamera: run => { run.scene.resultCamera.active = 1 },
  pendingResult: run => { run.world.outcome.cameraRequest = 1 },
  notPlaying: run => { run.world.status = 'won' },
  rafScheduled: run => { run.scene.frame = 42 },
  rafReleased: run => { run.window.mission8RafHeld = false },
}

test('M8 minimap route exposes the distant authored staging point through real-click intent', async () => {
  for (const scale of [0.8, 1, 1.5]) for (const heading of [0, 333, 1024]) {
    const run = fixture({ scale, heading }), target = { x: -41, z: -33 }
    await run.navigate(target)
    assert.ok(run.calls.length >= 1 && run.calls.length <= 4)
    assert.ok(run.calls.every(({ clientX, clientY }) => Number.isInteger(clientX) && Number.isInteger(clientY)))
    assert.ok(distance(run.scene.viewPoint, target) <= 5)
    assert.equal(run.world.turn, 0)
    assert.deepEqual(run.world.selected, [241, 129, 130])
    assert.equal(run.disposed(), 1)
  }
})

test('M8 route refuses hidden map points and non-progress instead of guessing a camera write', async () => {
  for (const [options, error] of [
    [{ obstructed: true }, /No genuine exposed minimap point/],
    [{ picker: (_width, _height, center) => center }, /make measurable progress/],
  ]) {
    const run = fixture(options)
    await assert.rejects(run.navigate({ x: -41, z: -33 }), error)
    assert.deepEqual(run.calls, [])
    assert.equal(run.disposed(), 1)
  }
})

test('M8 route rejects Scene/World replacement before sending input', async () => {
  for (const options of [{ replaceScene: true }, { replaceWorld: true }]) {
    const run = fixture(options)
    await assert.rejects(run.navigate({ x: -41, z: -33 }), /Scene or World changed/)
    assert.deepEqual(run.calls, [])
    assert.equal(run.disposed(), 1)
  }
})

test('M8 route rejects coherent same-Scene World replacement before input, settlement and after render', async () => {
  for (const stage of ['onPlan', 'onClick', 'onRender']) {
    const run = fixture({ [stage]: current => current.replaceCoherentWorld() })
    await assert.rejects(run.navigate({ x: -41, z: -33 }), /Scene or World changed/)
    assert.equal(run.calls.length, stage === 'onPlan' ? 0 : 1)
    assert.equal(run.steps(), stage === 'onRender' ? 1 : 0)
    assert.equal(run.disposed(), 1)
  }
})

test('M8 route checks actual overview, flyby, result and input ownership fields before clicking', async () => {
  for (const [name, interrupt] of Object.entries(interruptions)) {
    const run = fixture()
    interrupt(run)
    await assert.rejects(run.navigate({ x: -41, z: -33 }), /does not own ordinary input/, name)
    assert.deepEqual(run.calls, [])
    assert.equal(run.steps(), 0)
    assert.equal(run.disposed(), 1)
  }
  const run = fixture()
  run.scene.cameraMotion.active = 1
  await assert.rejects(run.navigate({ x: -41, z: -33 }), /Another camera journey/)
  assert.deepEqual(run.calls, [])
  assert.equal(run.disposed(), 1)
})

test('M8 route rechecks every ownership field after planning, click, each step and render', async () => {
  for (const stage of ['onPlan', 'onClick', 'onStep', 'onRender']) {
    for (const [name, interrupt] of Object.entries(interruptions)) {
      const run = fixture({ [stage]: interrupt })
      await assert.rejects(run.navigate({ x: -41, z: -33 }), /does not own ordinary input/, `${stage}: ${name}`)
      assert.equal(run.calls.length, stage === 'onPlan' ? 0 : 1)
      assert.equal(run.steps(), ['onStep', 'onRender'].includes(stage) ? 1 : 0)
      assert.equal(run.renders(), stage === 'onRender' ? 1 : 0)
      assert.equal(run.disposed(), 1)
    }
  }
})

test('M8 settlement advances only the clicked position and bearing, and rejects renewed motion after render', async () => {
  for (const axis of ['x', 'y', 'angle']) {
    const run = fixture({ onClick: current => { current.scene.cameraMotion.target[axis]++ } })
    await assert.rejects(run.navigate({ x: -41, z: -33 }), /Another camera journey/)
    assert.equal(run.calls.length, 1)
    assert.equal(run.steps(), 0)
    assert.equal(run.disposed(), 1)
  }
  const run = fixture({ onRender: current => { current.scene.cameraMotion.active = 1 } })
  await assert.rejects(run.navigate({ x: -41, z: -33 }), /Another camera journey/)
  assert.equal(run.steps(), 1)
  assert.equal(run.disposed(), 1)
})

test('M8 route fails on a dropped click, simulation advancement, or changed selection', async () => {
  for (const [options, error] of [
    [{ dropClick: true }, /did not reach its displayed target/],
    [{ mutate: world => world.turn++ }, /must not advance simulation/],
    [{ mutate: world => world.selected.pop() }, /must retain the party/],
  ]) {
    const run = fixture(options)
    await assert.rejects(run.navigate({ x: -41, z: -33 }), error)
    assert.equal(run.calls.length, 1)
    assert.equal(run.disposed(), 1)
  }
})

test('availability-only mission consumers observe passive tribe images, not camera controls', () => {
  for (const [name, count] of [['mission11', 7], ['mission3-opening', 1], ['mission4', 3],
    ['mission7', 1], ['mission8', 1], ['mission9', 1]]) {
    const source = read(`scripts/check-browser-${name}.mjs`)
    assert.doesNotMatch(source, /Focus (Dakini|Chumara|Matak) tribe/)
    assert.equal((source.match(/getByRole\('img', \{ name: '(Dakini|Chumara|Matak) tribe', exact: true \}\)\.waitFor\(\)/g) ?? []).length, count)
  }
})

test('journey consumers use public minimap and portrait controls while retaining interruption assertions', () => {
  const journey = read('scripts/check-browser-camera-focus.mjs'),
    input = read('scripts/check-browser-camera-input.mjs')
  for (const source of [journey, input, script])
    assert.doesNotMatch(source, /Focus (Dakini|Chumara|Matak) tribe/)
  assert.equal((journey.match(/await requestMinimapJourney\(\)/g) ?? []).length, 4)
  for (const expected of ['moving.motion.active,1', 'moving.point,before.point',
    'moving.motion.target.angle,before.angle', 'moving.preset,before.preset', 'moving.mode,null',
    'after.position,after.target', 'replacement,firstTarget', 'seam.target.x-seam.source.x',
    'window.testScene.overviewActive),true']) assert.ok(journey.includes(expected), expected)
  assert.match(input, /await portrait\.focus\(\)/)
  assert.match(input, /await portrait\.click\(\{button:'right'\}\)/)
  assert.match(input, /document\.activeElement===element/)
  assert.match(input, /Portrait right-click must start a journey before takeover/)
})
