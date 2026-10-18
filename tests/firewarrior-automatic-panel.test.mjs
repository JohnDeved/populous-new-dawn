// Failure-first supplied model8 caller proof. Actual picked input, admission,
// fixed turns and automatic callback run; completed building is supplied. DOM/projection/texture IO
// and frame deltas are supplied; this is not the ordinary browser witness.
import assert from 'node:assert/strict'
import test from 'node:test'
import { firewarriorPanelFixture } from './support/firewarrior-panel-scene.mjs'

const nop = () => {}
const records = scene => scene.objectPanels.buildingRecords
const reservation = school => `building-panel:${school.id}`

function startScene(t, scene) {
  if (!('window' in globalThis)) {
    Object.defineProperty(globalThis, 'window', { configurable: true, value: {} })
    t.after(() => {
      delete globalThis.window
    })
  }
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
}

async function clickBuilding({ scene, point }, button = 0) {
  const { pointerDown, pointerUp } = await import('../app/scene-input-runtime.ts'),
    event = {
      ...point,
      button,
      buttons: button === 2 ? 2 : 1,
      pointerId: 81,
      currentTarget: scene.renderer.domElement,
      preventDefault: nop,
      shiftKey: false,
      ctrlKey: false,
      altKey: false,
      metaKey: false,
    }
  pointerDown(scene, event)
  pointerUp(scene, { ...event, buttons: 0 })
}

test('actual supplied model8 Firewarrior Hut input reserves its automatic owner synchronously before frontend paint or conversion', async t => {
  const fixture = await firewarriorPanelFixture(t),
    { scene, world, school, api, frame, paint } = fixture,
    { pointerMove } = await import('../app/scene-input-runtime.ts'),
    { stepLiveTraining } = await import('../app/live-building-entry.ts')
  startScene(t, scene)
  frame(0)
  const brave = world.units.find(
    unit => unit.team === 'blue' && unit.kind === 'brave' && unit.hp > 0 && unit.inside === null
  )
  assert.ok(brave)
  api.setSelection(world, [brave.id])
  await clickBuilding(fixture)
  const person = brave.entry?.person
  assert.ok(person, 'actual input must establish entry.person')
  const order = world.buildingOrders.records[person.commands[person.commandCursor]]
  assert.equal(order.model, 8)
  assert.equal(order.a, school.id)
  assert.equal(records(scene).has(school.id), false)
  pointerMove(scene, { clientX: 799, clientY: 1, buttons: 0 })
  const request = scene.objectPanels.requestAutomaticTraining
  let observed
  scene.objectPanels.requestAutomaticTraining = function (id) {
    const result = request.call(this, id)
    if (id === school.id && !observed) {
      observed = {
        activity: !!(school.admission.activity & 0x80),
        entered: brave.inside === school.id && brave.entry?.person === person,
        trained: world.stats.trained,
        automatic: records(scene).get(id)?.automatic ?? false,
        latched: this.automaticTrainingLatches.has(id),
        phase: records(scene).get(id)?.phase ?? null,
        reservations: world.secondaryEffects.reservations.filter(
          owner => owner === reservation(school)
        ),
      }
      paint()
      observed.visible = scene.buildingPanels.get(id)?.hidden === false
    }
    return result
  }
  world.speed = 1
  for (let visits = 0; visits < 4000 && !observed; visits++) frame(1 / 12)
  assert.ok(observed, `actual Firewarrior Hut callback must run by turn ${world.turn}`)
  t.diagnostic(JSON.stringify({ school: school.id, brave: brave.id, turn: world.turn, observed }))
  assert.deepEqual(observed, {
    activity: true,
    entered: true,
    trained: 0,
    automatic: true,
    latched: true,
    phase: -1,
    reservations: [reservation(school)],
    visible: false,
  })
  assert.ok(records(scene).get(school.id).phase >= 0)
  paint()
  const panel = scene.buildingPanels.get(school.id)
  assert.equal(panel?.hidden, false)
  assert.match(panel.attributes['aria-label'], /^Firewarrior training: 1 of 5 occupants;/)

  // After real input/admission, supply affordability to isolate the callback's
  // ordering against same-call conversion. No natural mana timing claim.
  school.timer = 1000000000
  stepLiveTraining(world, school)
  assert.equal(world.stats.trained, 1)
  assert.ok(world.units.some(unit => unit.team === 'blue' && unit.kind === 'firewarrior'))
  assert.equal(school.admission.activity & 0x80, 0)
  assert.equal(records(scene).has(school.id), true)
})

test('Firewarrior Hut independent controls yield to active training, failed capacity and fresh automatic entry', async t => {
  const fixture = await firewarriorPanelFixture(t),
    { scene, world, school, paint } = fixture,
    { stepLiveTraining } = await import('../app/live-building-entry.ts')
  startScene(t, scene)
  paint()
  assert.equal(
    scene.buildingPanels.has(school.id),
    true,
    'existing Firewarrior manual hover remains available'
  )
  // Dismantling remains independent of automatic training ownership.
  scene.hoveredObject = null
  school.admission.activity |= 0x8000
  paint()
  const panel = scene.buildingPanels.get(school.id)
  assert.equal(panel.hidden, false, 'dismantling remains independent without hover or records')
  assert.equal(records(scene).has(school.id), false)
  school.admission.activity &= ~0x8000
  panel.matches = () => true
  paint()
  assert.equal(panel.hidden, false, 'inactive held controls remain independently visible')
  panel.matches = () => false
  scene.hoveredObject = school.id

  school.admission.activity |= 0x80 // Supplied negative authority/capacity boundary only.
  panel.matches = () => true
  paint()
  assert.equal(
    panel.hidden,
    true,
    'active legacy hover/held DOM must yield before source allocation'
  )
  assert.ok(!world.secondaryEffects.reservations.includes(reservation(school)))
  for (let id = 0; id < 32; id++) scene.objectPanels.panels.set(100000 + id, {})
  scene.tooltipController.dwell = 2
  stepLiveTraining(world, school)
  paint()
  assert.equal(records(scene).has(school.id), false)
  assert.equal(scene.objectPanels.automaticTrainingLatches.has(school.id), false)
  assert.equal(scene.tooltipController.dwell, 2, 'failed allocation cannot accelerate D')
  assert.equal(panel.hidden, true, 'hover cannot bypass failed automatic capacity')
  assert.ok(!world.secondaryEffects.reservations.includes(reservation(school)))

  scene.objectPanels.panels.delete(100000)
  school.admission.activity |= 0x80
  stepLiveTraining(world, school)
  assert.equal(records(scene).get(school.id)?.automatic, true)
  assert.equal(scene.objectPanels.automaticTrainingLatches.has(school.id), true)
  assert.equal(records(scene).get(school.id).phase, -1)
  paint()
  assert.equal(panel.hidden, true, 'existing legacy DOM cannot bypass fresh phase -1')
  scene.objectPanels.stepBuildingInspections(false)
  paint()
  assert.equal(scene.buildingPanels.get(school.id), panel)
  assert.equal(panel.hidden, false)
  assert.deepEqual(
    world.secondaryEffects.reservations.filter(owner => owner === reservation(school)),
    [reservation(school)]
  )
})

test('Firewarrior Hut automatic renewal and phase2 reuse preserve clocks while held controls outlive only the retired record', async t => {
  const { scene, world, school, paint } = await firewarriorPanelFixture(t),
    { stepLiveTraining } = await import('../app/live-building-entry.ts')
  startScene(t, scene)
  scene.hoveredObject = null
  scene.pointerScreen = null
  school.admission.activity |= 0x80 // Supplied lifecycle boundary, separate from actual input above.
  const source = () => stepLiveTraining(world, school),
    step = () => scene.objectPanels.stepBuildingInspections(false)
  source()
  const record = records(scene).get(school.id)
  assert.ok(record)
  for (let visit = 0; visit < 4; visit++) step()
  assert.deepEqual(record, { automatic: true, phase: 1, remaining: 15, hold: 16 })
  paint()
  const panel = scene.buildingPanels.get(school.id)
  panel.matches = () => true
  step()
  assert.equal(record.remaining, 15)
  school.admission.activity &= ~0x80
  step()
  assert.equal(record.phase, 2)
  assert.equal(scene.objectPanels.automaticTrainingLatches.has(school.id), false)
  const remaining = record.remaining
  school.admission.activity |= 0x80
  source()
  assert.equal(records(scene).get(school.id), record)
  assert.equal(record.remaining, remaining)
  assert.equal(scene.objectPanels.automaticTrainingLatches.has(school.id), true)
  school.admission.activity &= ~0x80
  for (let visit = 0; visit < 3; visit++) step()
  assert.equal(records(scene).has(school.id), false)
  assert.equal(scene.objectPanels.automaticTrainingLatches.has(school.id), false)
  assert.equal(scene.buildingPanels.get(school.id), panel)
  assert.equal(panel.removed, undefined)
  assert.ok(world.secondaryEffects.reservations.includes(reservation(school)))
  panel.matches = () => false
  paint()
  assert.equal(panel.hidden, true)
  assert.ok(!world.secondaryEffects.reservations.includes(reservation(school)))
})

test('Firewarrior Hut automatic identity rejects mismatched native class/model and retires a dead owner', async t => {
  const { scene, world, school } = await firewarriorPanelFixture(t),
    { stepLiveTraining } = await import('../app/live-building-entry.ts'),
    { requestTrainingPanel } = await import('../app/training-panel-requests.ts')
  startScene(t, scene)
  school.admission.activity |= 0x80
  school.admission.class = 9
  stepLiveTraining(world, school)
  assert.equal(records(scene).has(school.id), false)
  school.admission.class = 2
  school.admission.model = 7
  // buildingAdmission restores model from kind before the simulation callback.
  // Exercise this supplied malformed identity at the real bound consumer seam.
  requestTrainingPanel(world, school.id)
  assert.equal(records(scene).has(school.id), false, 'Firewarrior Hut kind cannot impersonate camp model7')
  school.admission.model = 8
  school.admission.tribe = 1
  stepLiveTraining(world, school)
  assert.equal(records(scene).has(school.id), false)
  school.admission.tribe = world.manaWorld.playerTribe
  stepLiveTraining(world, school)
  assert.equal(records(scene).get(school.id)?.automatic, true)
  school.hp = 0
  scene.objectPanels.stepBuildingInspections(false)
  assert.equal(records(scene).has(school.id), false)
  assert.equal(scene.objectPanels.automaticTrainingLatches.has(school.id), false)
  assert.ok(!world.secondaryEffects.reservations.includes(reservation(school)))
})

function disposeScene(t, scene) {
  if (!('cancelAnimationFrame' in globalThis)) {
    Object.defineProperty(globalThis, 'cancelAnimationFrame', { configurable: true, value: nop })
    t.after(() => {
      delete globalThis.cancelAnimationFrame
    })
  }
  // Real disposal owns the records, binding and reservations. Only the unrelated
  // graphics/audio resources are supplied, as in the existing manual test.
  Object.assign(scene, {
    ownedSounds: new Map(),
    terrainLoad: { abort: nop },
    resize: { disconnect: nop },
    disposeListeners: [],
    globe: { dispose: nop },
    waterMap: { dispose: nop },
    terrainMap: { dispose: nop },
    pointerOutline: { remove: nop },
    spellPointer: { remove: nop },
  })
  scene.renderer.dispose = nop
  scene.renderer.domElement.remove = nop
  scene.tooltipElement.remove = nop
  scene.worshipPresentation.dispose = nop
  scene.dispose()
}

async function replacementScene(t, scene, world) {
  const { ObjectPanels } = await import('../app/object-panels.ts'),
    { createTooltip } = await import('../app/tooltips.ts'),
    next = Object.assign(Object.create(Object.getPrototypeOf(scene)), scene, {
      world,
      tooltip: createTooltip(),
      tooltipController: undefined,
      tooltipInput: null,
      tooltipInspectionInputs: [],
      buildingPanels: new Map(),
      releaseTrainingPanelRequests: null,
    })
  next.objectPanels = new ObjectPanels(next)
  startScene(t, next)
  return next
}


test('Save preserves the current owner; Load clears transient ownership and stale bit23 cannot suppress the next request', async t => {
  const fixture = await firewarriorPanelFixture(t),
    { scene } = fixture,
    { createGameStore } = await import('../app/game-store.ts'),
    { stepLiveTraining } = await import('../app/live-building-entry.ts'),
    { getTooltipController } = await import('../app/scene-tooltip-runtime.ts'),
    { renderBuildingPanels } = await import('../app/building-panels.ts'),
    store = createGameStore()
  store.change(target => Object.assign(target, structuredClone(fixture.world)))
  scene.world = store.getWorld()
  scene.presentationBinding = store.bindPresentation(scene.world)
  const school = scene.world.buildings.find(b => b.id === fixture.school.id)
  school.admission.activity |= 0x80
  school.admission.flags3 |= 0x800000
  startScene(t, scene)
  stepLiveTraining(scene.world, school)
  const record = records(scene).get(school.id),
    session = getTooltipController(scene).session,
    sessionBefore = structuredClone(session),
    gameplay = structuredClone(school)
  assert.ok(record)
  await store.saveCheckpoint()
  assert.equal(store.hasCheckpoint(), true)
  assert.equal(records(scene).get(school.id), record)
  assert.equal(scene.objectPanels.automaticTrainingLatches.has(school.id), true)
  const savedWorld = structuredClone(store.getWorld())
  assert.equal('automaticTrainingLatches' in savedWorld, false)
  assert.equal('buildingRecords' in savedWorld, false)
  assert.equal(store.loadCheckpoint(), true)
  assert.equal(scene.presentationBinding.isCurrent(), false)
  assert.equal(scene.objectPanels.requestAutomaticTraining(school.id), 'automatic:rejected')
  disposeScene(t, scene)
  const restored = store.getWorld(),
    restoredSchool = restored.buildings.find(b => b.id === school.id)
  assert.deepEqual(restoredSchool, gameplay)
  assert.deepEqual(restored.secondaryEffects.reservations, [])
  // Supply the new current store binding before the actual start gate.
  scene.presentationBinding = store.bindPresentation(restored)
  const next = await replacementScene(t, scene, restored)
  assert.equal(records(next).size, 0)
  assert.equal(next.objectPanels.automaticTrainingLatches.size, 0)
  assert.equal(getTooltipController(next).session, session)
  assert.deepEqual(session, sessionBefore)
  restored.paused = true
  renderBuildingPanels(next, { complete: true, naturalWidth: 2048 })
  assert.equal(next.buildingPanels.size, 0, 'paused paint cannot replay an active saved request')
  assert.deepEqual(restored.secondaryEffects.reservations, [])
  restored.paused = false
  stepLiveTraining(restored, restoredSchool)
  assert.equal(records(next).get(school.id)?.automatic, true)
  assert.equal(next.objectPanels.automaticTrainingLatches.has(school.id), true)
  assert.equal(
    restoredSchool.admission.flags3 & 0x800000,
    0x800000,
    'the port neither reads nor clears saved bit23'
  )
  disposeScene(t, next)
  store.restart()
  assert.deepEqual(store.getWorld().secondaryEffects.reservations, [])
  assert.equal(
    store.getWorld().buildings.some(b => b.id === school.id && b.kind === 'firewarriorHut'),
    false
  )
  t.diagnostic(
    'Controlled in-session Save/Load only; typed committed IndexedDB belongs to the ordinary browser witness.'
  )
})

