// Controlled caller/observer composition only. Actual M3 acquisition, construction,
// Scene/pointer/tooltip/painter/training and Page Escape run; DOM, projection,
// texture IO, trusted-event flags, PNG bytes and frame deltas are supplied.
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import ts from 'typescript'
import { templePanelFixture } from './support/temple-panel-scene.mjs'
import { createTempleTrainingEpoch } from '../scripts/local-render/temple-training-witness.mjs'
import { createTempleManualObservation } from '../scripts/local-render/temple-manual-witness.mjs'
import { assertTempleManualObservation } from '../scripts/local-render/temple-manual-contract.mjs'
import {
  assertTempleFreshRequest,
  assertTempleReusedRequest,
  assertTempleLifecycle,
} from '../scripts/local-render/temple-training-contract.mjs'

const nop = () => {}
function events(owner) {
  const listeners = []
  owner.addEventListener = (type, fn, capture = false) => listeners.push({ type, fn, capture })
  owner.removeEventListener = (type, fn, capture = false) => {
    const index = listeners.findIndex(
      item => item.type === type && item.fn === fn && item.capture === capture
    )
    assert(index >= 0)
    listeners.splice(index, 1)
  }
  return {
    listeners,
    fire(type, event, capture) {
      for (const item of [...listeners])
        if (item.type === type && item.capture === capture) item.fn(event)
    },
  }
}
function pageEscape({ world, scene, api }) {
  const source = ts.createSourceFile(
    'page.tsx',
    readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8'),
    ts.ScriptTarget.Latest,
    true
  )
  let handler
  const visit = node => {
    if (
      ts.isVariableDeclaration(node) &&
      node.name.getText(source) === 'key' &&
      node.initializer?.getText(source).includes('store.change(cancelInteraction)')
    )
      handler = node.initializer
    ts.forEachChild(node, visit)
  }
  visit(source)
  assert(handler, 'Actual Page keyboard handler required')
  const code = ts.transpileModule(`(${handler.getText(source)})`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText
  return Function(
    'ready',
    'world',
    'store',
    'engine',
    'SPELLS',
    'spellHudVisibility',
    'tutorialLevel',
    'cancelInteraction',
    'update',
    `return ${code}`
  )(
    true,
    world,
    { getWorld: () => world, change: fn => fn(world) },
    { current: scene },
    [],
    nop,
    0,
    api.cancelInteraction,
    nop
  )
}
async function fixture(t, mode = 'expiry', options = {}) {
  const f = await templePanelFixture(t),
    { scene, world, temple } = f,
    runtime = await import('../app/scene-input-runtime.ts'),
    canvas = scene.renderer.domElement,
    canvasEvents = events(canvas),
    docEvents = events(document)
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
  globalThis.window = { testSceneRef: { current: scene }, testStore: { getWorld: () => world } }
  t.after(() => {
    scene.releaseTrainingPanelRequests?.()
    if (oldWindow) Object.defineProperty(globalThis, 'window', oldWindow)
    else delete globalThis.window
  })
  Object.assign(scene, {
    started: false,
    disposed: false,
    terrainLoad: { signal: { aborted: false } },
    drawMinimap: nop,
    listen: nop,
    mini: {},
    acknowledgePointer: nop,
    orderSound: nop,
  })
  assert.equal(scene.start(), true)
  world.speed = 1
  scene.gameClock.afterTurn ??= nop
  document.elementFromPoint = () => canvas
  document.activeElement = null
  canvas.getBoundingClientRect = () => ({
    left: 0,
    top: 0,
    width: 800,
    height: 600,
    right: 800,
    bottom: 600,
  })
  canvas.isConnected = true
  canvas.closest = () => null
  scene.cameraPosition = { ...f.api.nativePosition(world, temple), angle: 0 }
  scene.cameraVelocity = { forward: 0, side: 0, turn: 0 }
  scene.cameraMotion = { active: 0 }
  scene.captureCamera = nop
  const create = document.createElement
  document.createElement = tag => {
    const result = create(tag)
    result.getAttribute = name => result.attributes[name] ?? null
    result.querySelector = name => result.children.find(child => child.tag === name)
    result.toDataURL = () => 'data:image/png;base64,Y29udHJvbGxlZC1maXh0dXJl'
    return result
  }
  scene.tooltipElement.getAttribute = name => scene.tooltipElement.attributes[name] ?? null
  scene.renderBuildingPanels = f.paint
  const { syncSecondaryReservations } = await import('../app/scene-secondary-effects.ts')
  // Renderer/listener teardown is supplied; actual ObjectPanels disposal and
  // reservation synchronization remain in the controlled lifecycle contract.
  scene.dispose = () => {
    scene.objectPanels.dispose()
    for (const panel of scene.buildingPanels.values()) panel.remove()
    scene.buildingPanels.clear()
    syncSecondaryReservations(scene)
    scene.disposed = true
  }
  const epoch = createTempleTrainingEpoch({
    scene,
    store: window.testStore,
    targetId: temple.id,
    controller: scene.tooltipController,
    trackInspection: mode === 'approach',
  })
  const manual = createTempleManualObservation({
    scene,
    snapshot: epoch.snapshot,
    mode,
    ...options,
  })
  t.after(() => {
    try {
      if (!manual.status().closed) manual.take()
    } finally {
      if (!epoch.status().closed) epoch.close()
    }
  })
  const fire = (type, patch = {}) => {
    const e = {
      type,
      ...f.point,
      clientX: f.point.clientX,
      clientY: f.point.clientY,
      target: canvas,
      currentTarget: canvas,
      button: 2,
      buttons: type === 'pointerup' ? 0 : 2,
      pointerId: 87,
      isTrusted: true,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      preventDefault: nop,
      ...patch,
    }
    docEvents.fire(type, e, true)
    canvasEvents.fire(type, e, true)
    runtime[
      { pointerdown: 'pointerDown', pointerup: 'pointerUp', pointermove: 'pointerMove' }[type]
    ](scene, e)
    canvasEvents.fire(type, e, false)
  }
  const frame = (dt = 1 / 24) => {
    f.frame(dt)
    scene.renderBuildingPanels()
  }
  const until = predicate => {
    for (let count = 0; count < 2000 && !predicate(); count++) {
      assert.deepEqual(manual.status().errors, [])
      frame()
    }
    assert(predicate())
    assert.deepEqual(manual.status().errors, [])
  }
  return { ...f, epoch, manual, fire, frame, until, canvasEvents, docEvents }
}

test('actual Temple dwell, trusted held-input observer and natural expiry complete atomically', async t => {
  const f = await fixture(t)
  f.until(() => f.manual.status().frame)
  f.manual.armInput()
  f.fire('pointerdown')
  f.frame()
  assert.equal(f.manual.status().reused, true)
  f.fire('pointermove', { clientY: 599 })
  f.until(() => f.manual.status().heldVisits >= 4)
  f.fire('pointerup', { clientY: 599 })
  f.manual.finishInput()
  f.until(() => f.manual.status().complete === 'expiry')
  const status = f.manual.status()
  for (let i = 0; i < 30; i++) f.frame()
  assert.deepEqual(
    f.manual.status(),
    status,
    'Finished observation stays detached during valid later gameplay'
  )
  const evidence = f.manual.take()
  assertTempleManualObservation(evidence)
  assert.throws(() => f.manual.take(), /only once/)
  for (const mutate of [
    r => {
      r.reuse.after.record.identity++
    },
    r => {
      r.input.events[0].trusted = false
    },
    r => {
      r.firstDisplay.after.controller.output.text = 'Wrong title'
    },
    r => {
      r.terminal.reservations = 1
    },
    r => {
      r.terminalKind = null
    },
    r => {
      r.input.events[0].picks.find(p => p.owner === 'scene' && p.name === 'pickWorldObject').id++
    },
    r => {
      r.input.events[0].after.armedWorldMatches = false
    },
    r => {
      r.release.args[0]++
    },
  ]) {
    const invalid = structuredClone(evidence)
    mutate(invalid)
    assert.throws(() => assertTempleManualObservation(invalid))
  }
})

test('actual Page Escape and explicit approach input feed the same record into the real training producer', async t => {
  const f = await fixture(t, 'approach'),
    { scene, world, temple, epoch, manual } = f
  // Actual public selection caller; the browser journey invokes this via its HUD.
  const { nativeUnitModel } = await import('../app/unit-kinds.ts')
  scene.chooseFollowers(nativeUnitModel('brave'), { ctrlKey: false, shiftKey: false })
  assert.equal(world.selected.length, 1)
  const traineeId = world.selected[0]
  epoch.armInput(traineeId)
  f.fire('pointerdown', { button: 0, buttons: 1 })
  f.fire('pointerup', { button: 0, buttons: 0 })
  const trainInput = epoch.finishInput()
  assert.equal(trainInput.events[1].state.trainee.order.model, 8)
  assert.equal(trainInput.events[1].state.trainee.order.a, temple.id)
  pageEscape(f)({
    key: 'Escape',
    code: 'Escape',
    target: { closest: () => null },
    preventDefault: nop,
  })
  assert.deepEqual(world.selected, [])
  manual.armInput()
  f.fire('pointerdown')
  f.frame()
  f.fire('pointerup')
  manual.finishInput()
  f.until(() => manual.status().complete === 'approach')
  const first = epoch.status().firstRequest,
    evidence = manual.take()
  assertTempleManualObservation(evidence)
  assertTempleReusedRequest(first, temple.id, traineeId, evidence)
  assert.throws(() => assertTempleFreshRequest(first, temple.id, traineeId))
  const changed = structuredClone(evidence)
  changed.creation.after.record.identity++
  assert.throws(() => assertTempleReusedRequest(first, temple.id, traineeId, changed))
  assert.equal(world.units.find(unit => unit.id === traineeId).inside, temple.id)
  // The reused record is still manually renewed before the automatic step.
  for (let i = 0; i < 4; i++) f.frame()
  f.fire('pointermove', { clientY: 599, buttons: 0 })
  for (let i = 0; i < 8; i++) f.frame()
  scene.dispose()
  const lifecycle = epoch.close(),
    options = {
      targetId: temple.id,
      traineeId,
      initialPreachers: [],
      initialTrained: 0,
      complete: false,
      manual: evidence,
    }
  assertTempleLifecycle(lifecycle, options)
  const missingRenewal = structuredClone(lifecycle)
  const renewal = missingRenewal.records.findIndex(
    row =>
      row.kind === 'renew' &&
      row.ordinal > lifecycle.records.find(row => row.kind === 'request').ordinal &&
      row.after.record?.remaining !== row.before.record?.remaining
  )
  assert(renewal >= 0, 'Real manual renewal must be observed after automatic reuse')
  missingRenewal.records.splice(renewal, 1)
  assert.throws(() => assertTempleLifecycle(missingRenewal, options))
})

test('row overflow preserves its error, detaches actual callers and rejects premature success', async t => {
  const f = await fixture(t, 'expiry', { maxRows: 1 })
  for (let i = 0; i < 5; i++) f.frame()
  const state = f.manual.status()
  assert.equal(state.closed, true)
  assert.equal(state.complete, null)
  assert.match(state.errors.join('\n'), /row cap exceeded/)
  const exported = f.manual.take()
  assert.equal(exported.rows.length, 1)
  assert.throws(() => assertTempleManualObservation(exported))
  f.frame()
  assert.deepEqual(f.manual.status(), state)
})

test('actual idle host step composes with maintained input and the observed Scene callers', async t => {
  const f = await fixture(t),
    { scene, world, temple } = f
  f.manual.take()
  const { createTempleManualSteps } =
      await import('../scripts/local-render/temple-manual-inspection.mjs'),
    witnessModule = await import('../scripts/local-render/temple-manual-witness.mjs'),
    output = mkdtempSync(resolve(tmpdir(), 'temple-manual-caller-')),
    screenshots = [],
    labels = [],
    report = { actions: [] }
  t.after(() => rmSync(output, { recursive: true, force: true }))
  window.templeTraining = { snapshot: f.epoch.snapshot }
  scene.resultCamera = { active: 0 }
  let at = { x: f.point.clientX, y: f.point.clientY },
    buttons = 0,
    spellsVisible = false
  const canvas = scene.renderer.domElement,
    hud = {
      closest: selector => (selector === '[data-tooltip-hud]' ? hud : null),
      getAttribute: () => 'blast',
    }
  document.elementFromPoint = (x, y) => (x === 10 && y === 10 ? hud : canvas)
  const page = {
    async evaluate(fn, arg) {
      const text = fn.toString()
      // Only minimap projection and rendered interior search are supplied. The
      // real host caller, input admission, observer, Scene and dispatch run.
      if (text.includes('minimapPick')) return { x: 1, y: 1 }
      if (text.includes('findEntityInput')) {
        assert.equal(scene.picking.pick(f.point), temple.id)
        return {
          x: f.point.clientX,
          y: f.point.clientY,
          rejection: null,
          id: temple.id,
          collection: 'buildings',
        }
      }
      return Function(
        'imports',
        `return (${text.replaceAll('import(', 'imports(')})`
      )(async path => {
        assert.equal(path, '/scripts/local-render/temple-manual-witness.mjs')
        return witnessModule
      })(arg)
    },
    async waitForFunction(fn) {
      for (let i = 0; i < 100 && !fn(); i++) f.frame()
      assert(fn())
    },
    async waitForTimeout() {
      f.frame()
    },
    getByRole(role, options) {
      assert.equal(role, 'button')
      const source = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8'),
        suffix = source.match(/t === 'spells' \? '([^']+)'/)[1]
      assert.equal(options.name, `spells ${suffix}`, 'Driver uses the actual public Page label')
      return {
        async click() {
          spellsVisible = true
          labels.push(options.name)
        },
      }
    },
    locator(selector) {
      assert.equal(selector, '[data-tooltip-hud="blast"]')
      return {
        async hover() {
          assert(spellsVisible)
          at = { x: 10, y: 10 }
          f.fire('pointermove', { clientX: 10, clientY: 10, buttons: 0 })
          f.frame()
        },
      }
    },
    mouse: {
      async click(x, y) {
        assert.deepEqual([x, y], [1, 1], 'Supplied minimap projection only')
      },
      async move(x, y) {
        at = { x, y }
        f.fire('pointermove', { clientX: x, clientY: y, buttons })
        f.frame()
      },
      async down() {
        buttons = 2
        f.fire('pointerdown', { clientX: at.x, clientY: at.y, buttons })
        f.frame()
      },
      async up() {
        buttons = 0
        f.fire('pointerup', { clientX: at.x, clientY: at.y, buttons })
        f.frame()
      },
    },
    async screenshot({ path }) {
      screenshots.push({ path, status: window.templeManual.status() })
    },
  }
  const steps = createTempleManualSteps({ output }),
    result = await steps.idle({
      page,
      signal: new AbortController().signal,
      report,
      save: nop,
      targetId: temple.id,
      target: temple,
      shamanId: world.units.find(u => u.kind === 'shaman' && u.team === 'blue').id,
      deadlineAt: Date.now() + 30000,
    })
  assertTempleManualObservation(result)
  assert.equal(report.manual.expiry.status, 'passed')
  assert.equal(screenshots.length, 3)
  assert(screenshots[0].status.frame && !screenshots[0].status.reused)
  assert(screenshots[1].status.heldVisits >= 4 && !screenshots[1].status.released)
  assert.equal(screenshots[2].status.complete, 'expiry')
  assert.deepEqual(labels, ['spells 1–3'])
  assert.equal(window.templeManual, undefined)
})
