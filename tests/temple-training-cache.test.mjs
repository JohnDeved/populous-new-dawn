import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import test from 'node:test'
import { createTempleTrainingEpoch } from '../scripts/local-render/temple-training-witness.mjs'
import {
  assertTempleIdleReadiness,
  assertTempleFreshRequest,
} from '../scripts/local-render/temple-training-contract.mjs'

// Supporting renderer/controller contract only. The completed Temple, admission,
// DOM, canvas and projection are supplied; actual public renderer, ObjectPanels
// building methods and live training producer run. No browser, natural acquisition,
// construction, travel or native presentation claim is made by this fixture.
// Before the reviewed product is merged, explicitly select its clean public root.
const localRoot = fileURLToPath(new URL('../', import.meta.url)),
  runtimeRoot = resolve(process.env.PND_TEMPLE_RUNTIME_ROOT || localRoot),
  publicHead = '54f19225a6f005fd4c44b894272c1da829ec421d',
  fromRuntime = name => import(pathToFileURL(resolve(runtimeRoot, 'app', name)).href),
  source = name => readFileSync(resolve(runtimeRoot, 'app', name), 'utf8'),
  sha256 = text => createHash('sha256').update(text).digest('hex')
if (process.env.PND_TEMPLE_RUNTIME_ROOT) {
  assert.equal(
    execFileSync('git', ['rev-parse', 'HEAD'], { cwd: runtimeRoot, encoding: 'utf8' }).trim(),
    publicHead
  )
  assert.equal(
    execFileSync('git', ['status', '--porcelain', '--', 'app'], {
      cwd: runtimeRoot,
      encoding: 'utf8',
    }).trim(),
    '',
    'an explicit public runtime must have unchanged app sources'
  )
}
const [
  model,
  entry,
  requests,
  people,
  renderer,
  secondary,
  reservations,
  tooltip,
  threshold,
  personPanel,
] = await Promise.all([
  fromRuntime('model.ts'),
  fromRuntime('live-building-entry.ts'),
  fromRuntime('training-panel-requests.ts'),
  fromRuntime('live-people.ts'),
  fromRuntime('building-panels.ts'),
  fromRuntime('secondary-effects.ts'),
  fromRuntime('scene-secondary-effects.ts'),
  fromRuntime('scene-tooltip-runtime.ts'),
  fromRuntime('tooltip-controller.ts'),
  fromRuntime('person-panel.ts'),
])

// Extract one contiguous production class prefix, including its fields and all
// building-owner methods. Node's built-in TS transform handles the constructor
// property without loading the full Scene, three, typescript or borrowed packages.
const panelSource = source('object-panels.ts'),
  classStart = panelSource.indexOf('export class ObjectPanels {'),
  classEnd = panelSource.indexOf(
    '  open(id: number, immediate = false, automatic = false) {',
    classStart
  )
assert.ok(
  classStart >= 0 && classEnd > classStart,
  'bind the exact production building-method region'
)
const bindings = {
    secondaryEffectCount: secondary.secondaryEffectCount,
    getTooltipController: tooltip.getTooltipController,
    tooltipThreshold: threshold.tooltipThreshold,
    syncSecondaryReservations: reservations.syncSecondaryReservations,
    dismantlingCampPanel: renderer.dismantlingCampPanel,
    retainedBuildingPanel: renderer.retainedBuildingPanel,
    stepPersonPanel: personPanel.stepPersonPanel,
  },
  ObjectPanels = new Function(
    ...Object.keys(bindings),
    `${stripTypeScriptTypes(panelSource.slice(classStart, classEnd).replace('export class', 'class') + '}', { mode: 'transform' })}; return ObjectPanels`
  )(...Object.values(bindings))

const nop = () => {}
function element(tag) {
  return {
    tag,
    children: [],
    hidden: false,
    hovered: false,
    removed: false,
    style: {},
    dataset: {},
    attributes: {},
    classList: { add: nop, toggle: nop },
    appendChild(child) {
      this.children.push(child)
      return child
    },
    addEventListener: nop,
    setAttribute(name, value) {
      this.attributes[name] = value
    },
    matches(selector) {
      return selector === ':hover' && this.hovered
    },
    contains(target) {
      return target === this || this.children.some(child => child.contains(target))
    },
    remove() {
      this.removed = true
    },
    get firstElementChild() {
      return this.children[0]
    },
    get lastElementChild() {
      return this.children.at(-1)
    },
    getContext: () => ({ drawImage: nop, fillRect: nop }),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
  }
}

function fixture(t) {
  const world = model.createWorld(3),
    temple = model.addBuilding(world, 'blue', 'temple', { x: 24, z: 70 }, true),
    brave = model.addUnit(world, 'blue', 'brave', { x: 26, z: 71 }),
    admission = entry.buildingAdmission(world, temple),
    canvas = element('canvas'),
    hud = element('hud'),
    doc = {
      activeElement: null,
      querySelector: () => null,
      createElement: element,
      elementFromPoint: () => hud,
      addEventListener: nop,
      removeEventListener: nop,
    },
    globals = new Map()
  for (const [name, value] of Object.entries({
    document: doc,
    getComputedStyle: () => ({ getPropertyValue: () => '1' }),
  })) {
    globals.set(name, Object.getOwnPropertyDescriptor(globalThis, name))
    Object.defineProperty(globalThis, name, { configurable: true, value })
  }
  t.after(() => {
    for (const [name, descriptor] of globals) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor)
      else delete globalThis[name]
    }
  })
  Object.assign(world, { paused: false, status: 'playing', speed: 1, unlockedTemple: true })
  const scene = {
    world,
    renderer: { domElement: canvas },
    container: element('container'),
    buildingPanels: new Map(),
    overviewStage: 0,
    overviewActive: false,
    hoveredObject: temple.id,
    pointerScreen: { clientX: 20, clientY: 575 },
    frame: 1,
    gameClock: { animationFrame: 1, afterTurn: nop },
    isCurrent: () => true,
    visible: () => true,
    screen: () => ({ x: 0, y: 0 }),
    dispose: nop,
    tooltip: {},
  }
  scene.objectPanels = new ObjectPanels(scene)
  const release = requests.bindTrainingPanelRequests(world, scene.objectPanels)
  t.after(release)
  const epoch = createTempleTrainingEpoch({
    scene,
    store: { getWorld: () => world },
    targetId: temple.id,
    doc,
  })
  epoch.setTrainee(brave.id)
  t.after(() => {
    if (!epoch.status().closed) epoch.close()
  })
  const paint = () => renderer.renderBuildingPanels(scene, { complete: true, naturalWidth: 2048 }),
    current = () => epoch.status().current,
    step = () => scene.objectPanels.stepBuildingInspections(false),
    admit = () => {
      const person = people.createLivePerson(world, brave)
      people.registerLivePerson(world, person)
      brave.native = null
      brave.entry = { person, orders: world.buildingOrders }
      brave.inside = temple.id
      brave.work = temple.id
      Object.assign(admission, {
        inside: 1,
        activity: admission.activity | 128,
        storedMana: 0,
        trainingCost: 3500,
      })
      admission.occupants[0] = brave.id
    }
  return { world, scene, temple, brave, admission, doc, epoch, paint, current, step, admit }
}

function cachedHidden(f) {
  f.paint()
  const panel = f.scene.buildingPanels.get(f.temple.id)
  assert.ok(panel && !panel.hidden, 'production hover rendering must first create the cache')
  assert.equal(f.current().reservations, 1, 'the visible manual cache owns capacity')
  f.scene.hoveredObject = null
  f.paint()
  assert.equal(f.scene.buildingPanels.get(f.temple.id), panel)
  assert.equal(panel.hidden, true)
  assert.deepEqual(
    {
      record: f.current().record,
      latch: f.current().latch,
      reservations: f.current().reservations,
    },
    { record: null, latch: false, reservations: 0 }
  )
  return panel
}

test('production Temple renderer hides a live cache, automatic ownership acquires it without paint, then normal retirement deletes it', t => {
  t.diagnostic(
    JSON.stringify({
      runtimeRoot,
      publicHead,
      objectPanelsSha256: sha256(panelSource),
      buildingPanelsSha256: sha256(source('building-panels.ts')),
    })
  )
  const f = fixture(t),
    panel = cachedHidden(f)
  assert.doesNotThrow(() => assertTempleIdleReadiness(f.current()))
  f.admit()
  entry.stepLiveTraining(f.world, f.temple)
  const request = f.epoch.status().firstRequest
  assert.ok(request)
  assert.doesNotThrow(() => assertTempleFreshRequest(request, f.temple.id, f.brave.id))
  assert.deepEqual(request.before.dom, {
    present: true,
    hidden: true,
    focused: false,
    hovered: false,
  })
  assert.deepEqual(
    request.after.dom,
    request.before.dom,
    'the synchronous callback neither creates nor reveals DOM'
  )
  assert.equal(f.scene.buildingPanels.get(f.temple.id), panel)
  f.paint()
  assert.equal(panel.hidden, true, 'production phase -1 cannot reveal the cached node')
  f.step()
  assert.deepEqual(f.scene.objectPanels.buildingRecords.get(f.temple.id), {
    phase: 0,
    remaining: 2,
    hold: 16,
    automatic: true,
  })
  f.paint()
  assert.equal(panel.hidden, false, 'the first actual controller visit permits frontend painting')
  for (let visit = 0; visit < 3; visit++) f.step()
  assert.deepEqual(f.scene.objectPanels.buildingRecords.get(f.temple.id), {
    phase: 1,
    remaining: 15,
    hold: 16,
    automatic: true,
  })
  f.paint()
  assert.equal(f.scene.buildingPanels.get(f.temple.id), panel)
  assert.equal(panel.hidden, false)
  assert.equal(f.current().reservations, 1)
  for (let visit = 0; visit < 4; visit++) f.step()
  assert.equal(f.epoch.status().heldVisits, 4)

  // Supplied activity/admission expiry isolates the real controller's normal
  // exit path. This does not claim natural mana funding or a conversion outcome.
  f.admission.activity &= ~128
  f.admission.inside = 0
  f.admission.occupants.fill(0)
  f.brave.inside = null
  f.brave.work = null
  const phases = []
  for (let visit = 0; visit < 4; visit++) {
    f.step()
    const record = f.scene.objectPanels.buildingRecords.get(f.temple.id)
    phases.push(record ? [record.phase, record.remaining] : null)
  }
  assert.deepEqual(phases, [[2, 2], [2, 1], [2, 0], null])
  assert.equal(panel.removed, true)
  assert.equal(f.scene.buildingPanels.has(f.temple.id), false)
  assert.deepEqual(
    {
      record: f.current().record,
      latch: f.current().latch,
      reservations: f.current().reservations,
      present: f.current().dom.present,
    },
    { record: null, latch: false, reservations: 0, present: false }
  )
  assert.doesNotThrow(() => assertTempleIdleReadiness(f.current()))
  assert.deepEqual(f.epoch.close().errors, [])
})

test('idle readiness rejects actual visible, focused or hovered cache and leaked owners independently', t => {
  const f = fixture(t),
    panel = cachedHidden(f)
  const rejected = () =>
    assert.throws(() => assertTempleIdleReadiness(f.current()), assert.AssertionError)
  panel.hidden = false
  assert.equal(f.current().dom.hidden, false)
  rejected()
  panel.hidden = true
  f.doc.activeElement = panel.children[1]
  assert.equal(f.current().dom.focused, true)
  rejected()
  f.doc.activeElement = null
  panel.hovered = true
  assert.equal(f.current().dom.hovered, true)
  rejected()
  panel.hovered = false
  f.scene.objectPanels.buildingRecords.set(f.temple.id, {
    phase: 2,
    remaining: 0,
    hold: 16,
    automatic: true,
  })
  rejected()
  f.scene.objectPanels.buildingRecords.delete(f.temple.id)
  f.scene.objectPanels.automaticTrainingLatches.add(f.temple.id)
  rejected()
  f.scene.objectPanels.automaticTrainingLatches.clear()
  f.world.secondaryEffects.reservations.push(`building-panel:${f.temple.id}`)
  rejected()
  f.world.secondaryEffects.reservations.length = 0
  assert.doesNotThrow(() => assertTempleIdleReadiness(f.current()))
})

test('fresh acquisition preserves existing DOM state while rejecting leaked owners and synchronous DOM changes', t => {
  const f = fixture(t)
  cachedHidden(f)
  f.admit()
  entry.stepLiveTraining(f.world, f.temple)
  const row = f.epoch.status().firstRequest,
    check = candidate => assertTempleFreshRequest(candidate, f.temple.id, f.brave.id)
  assert.doesNotThrow(() => check(row))
  const absent = structuredClone(row)
  for (const side of ['before', 'after'])
    absent[side].dom = { present: false, hidden: null, focused: false, hovered: false }
  assert.doesNotThrow(() => check(absent))
  const existingVisible = structuredClone(row)
  for (const side of ['before', 'after']) existingVisible[side].dom.hidden = false
  assert.doesNotThrow(
    () => check(existingVisible),
    'unchanged prior paint is not paint caused by this callback'
  )
  for (const side of ['before', 'after'])
    for (const [key, value] of [
      ['hidden', false],
      ['focused', true],
      ['hovered', true],
    ]) {
      const wrong = structuredClone(row)
      wrong[side].dom[key] = value
      assert.throws(() => check(wrong), assert.AssertionError, `${side}: ${key}`)
    }
  for (const [key, value] of [
    ['record', { automatic: true }],
    ['latch', true],
    ['reservations', 1],
  ]) {
    const wrong = structuredClone(row)
    wrong.before[key] = value
    assert.throws(() => check(wrong), assert.AssertionError, `preexisting ${key}`)
  }
  const created = structuredClone(absent)
  created.after.dom = structuredClone(row.after.dom)
  assert.throws(
    () => check(created),
    assert.AssertionError,
    'synchronously creating even hidden DOM is observable'
  )
  const removed = structuredClone(row)
  removed.after.dom = structuredClone(absent.after.dom)
  assert.throws(
    () => check(removed),
    assert.AssertionError,
    'the callback must also preserve an existing hidden cache'
  )
})
