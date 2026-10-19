// Failure-first M3 caller proof. Actual acquisition, construction, picked input,
// admission, fixed turns and automatic callback run. DOM/projection/texture IO
// and frame deltas are supplied; this is not the ordinary browser witness.
import assert from 'node:assert/strict'
import test from 'node:test'
import { templePanelFixture } from './support/temple-panel-scene.mjs'

const nop = () => {}
const records = scene => scene.objectPanels.buildingRecords
const reservation = temple => `building-panel:${temple.id}`

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

test('actual M3 Temple input reserves its automatic owner synchronously before frontend paint or conversion', async t => {
  const fixture = await templePanelFixture(t),
    { scene, world, temple, api, frame, paint } = fixture,
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
  assert.equal(order.a, temple.id)
  assert.equal(records(scene).has(temple.id), false)
  pointerMove(scene, { clientX: 799, clientY: 1, buttons: 0 })
  const request = scene.objectPanels.requestAutomaticTraining
  let observed
  scene.objectPanels.requestAutomaticTraining = function (id) {
    const result = request.call(this, id)
    if (id === temple.id && !observed) {
      observed = {
        activity: !!(temple.admission.activity & 0x80),
        entered: brave.inside === temple.id && brave.entry?.person === person,
        trained: world.stats.trained,
        automatic: records(scene).get(id)?.automatic ?? false,
        latched: this.automaticTrainingLatches.has(id),
        phase: records(scene).get(id)?.phase ?? null,
        reservations: world.secondaryEffects.reservations.filter(
          owner => owner === reservation(temple)
        ),
      }
      paint()
      observed.visible = scene.buildingPanels.get(id)?.hidden === false
    }
    return result
  }
  world.speed = 1
  for (let visits = 0; visits < 4000 && !observed; visits++) frame(1 / 12)
  assert.ok(observed, `actual Temple callback must run by turn ${world.turn}`)
  t.diagnostic(JSON.stringify({ temple: temple.id, brave: brave.id, turn: world.turn, observed }))
  assert.deepEqual(observed, {
    activity: true,
    entered: true,
    trained: 0,
    automatic: true,
    latched: true,
    phase: -1,
    reservations: [reservation(temple)],
    visible: false,
  })
  assert.ok(records(scene).get(temple.id).phase >= 0)
  paint()
  const panel = scene.buildingPanels.get(temple.id)
  assert.equal(panel?.hidden, false)
  assert.match(panel.attributes['aria-label'], /^Preacher training: 1 of 5 occupants;/)

  // After real input/admission, supply affordability to isolate the callback's
  // ordering against same-call conversion. No natural mana timing claim.
  temple.timer = 1000000000
  stepLiveTraining(world, temple)
  assert.equal(world.stats.trained, 1)
  assert.ok(world.units.some(unit => unit.team === 'blue' && unit.kind === 'preacher'))
  assert.equal(temple.admission.activity & 0x80, 0)
  assert.equal(records(scene).has(temple.id), true)
})

test('Temple independent controls yield to active training, failed capacity and fresh automatic entry', async t => {
  const fixture = await templePanelFixture(t),
    { scene, world, temple, paint } = fixture,
    { stepLiveTraining } = await import('../app/live-building-entry.ts')
  startScene(t, scene)
  paint()
  assert.equal(
    scene.buildingPanels.has(temple.id),
    false,
    'manual hover now requires a retained record'
  )
  // Completed Temple manual inspection supersedes PR293's intentional inactive
  // hover exclusion. Establish the same independent DOM through dismantling;
  // preserve every downstream automatic authority/capacity assertion below.
  scene.hoveredObject = null
  temple.admission.activity |= 0x8000
  paint()
  const panel = scene.buildingPanels.get(temple.id)
  assert.equal(panel.hidden, false, 'dismantling remains independent without hover or records')
  assert.equal(records(scene).has(temple.id), false)
  temple.admission.activity &= ~0x8000
  panel.matches = () => true
  paint()
  assert.equal(panel.hidden, false, 'inactive held controls remain independently visible')
  panel.matches = () => false
  scene.hoveredObject = temple.id

  temple.admission.activity |= 0x80 // Supplied negative authority/capacity boundary only.
  panel.matches = () => true
  paint()
  assert.equal(
    panel.hidden,
    true,
    'active legacy hover/held DOM must yield before source allocation'
  )
  assert.ok(!world.secondaryEffects.reservations.includes(reservation(temple)))
  for (let id = 0; id < 32; id++) scene.objectPanels.panels.set(100000 + id, {})
  scene.tooltipController.dwell = 2
  stepLiveTraining(world, temple)
  paint()
  assert.equal(records(scene).has(temple.id), false)
  assert.equal(scene.objectPanels.automaticTrainingLatches.has(temple.id), false)
  assert.equal(scene.tooltipController.dwell, 2, 'failed allocation cannot accelerate D')
  assert.equal(panel.hidden, true, 'hover cannot bypass failed automatic capacity')
  assert.ok(!world.secondaryEffects.reservations.includes(reservation(temple)))

  scene.objectPanels.panels.delete(100000)
  temple.admission.activity |= 0x80
  stepLiveTraining(world, temple)
  assert.equal(records(scene).get(temple.id)?.automatic, true)
  assert.equal(scene.objectPanels.automaticTrainingLatches.has(temple.id), true)
  assert.equal(records(scene).get(temple.id).phase, -1)
  paint()
  assert.equal(panel.hidden, true, 'existing legacy DOM cannot bypass fresh phase -1')
  scene.objectPanels.stepBuildingInspections(false)
  paint()
  assert.equal(scene.buildingPanels.get(temple.id), panel)
  assert.equal(panel.hidden, false)
  assert.deepEqual(
    world.secondaryEffects.reservations.filter(owner => owner === reservation(temple)),
    [reservation(temple)]
  )
})

test('Temple automatic renewal and phase2 reuse preserve clocks while held controls outlive only the retired record', async t => {
  const { scene, world, temple, paint } = await templePanelFixture(t),
    { stepLiveTraining } = await import('../app/live-building-entry.ts')
  startScene(t, scene)
  scene.hoveredObject = null
  scene.pointerScreen = null
  temple.admission.activity |= 0x80 // Supplied lifecycle boundary, separate from actual input above.
  const source = () => stepLiveTraining(world, temple),
    step = () => scene.objectPanels.stepBuildingInspections(false)
  source()
  const record = records(scene).get(temple.id)
  assert.ok(record)
  for (let visit = 0; visit < 4; visit++) step()
  assert.deepEqual(record, { automatic: true, phase: 1, remaining: 15, hold: 16 })
  paint()
  const panel = scene.buildingPanels.get(temple.id)
  panel.matches = () => true
  step()
  assert.equal(record.remaining, 15)
  temple.admission.activity &= ~0x80
  step()
  assert.equal(record.phase, 2)
  assert.equal(scene.objectPanels.automaticTrainingLatches.has(temple.id), false)
  const remaining = record.remaining
  temple.admission.activity |= 0x80
  source()
  assert.equal(records(scene).get(temple.id), record)
  assert.equal(record.remaining, remaining)
  assert.equal(scene.objectPanels.automaticTrainingLatches.has(temple.id), true)
  temple.admission.activity &= ~0x80
  for (let visit = 0; visit < 3; visit++) step()
  assert.equal(records(scene).has(temple.id), false)
  assert.equal(scene.objectPanels.automaticTrainingLatches.has(temple.id), false)
  assert.equal(scene.buildingPanels.get(temple.id), panel)
  assert.equal(panel.removed, undefined)
  assert.ok(world.secondaryEffects.reservations.includes(reservation(temple)))
  panel.matches = () => false
  paint()
  assert.equal(panel.hidden, true)
  assert.ok(!world.secondaryEffects.reservations.includes(reservation(temple)))
})

test('Temple automatic identity rejects mismatched native class/model and retires a dead owner', async t => {
  const { scene, world, temple } = await templePanelFixture(t),
    { stepLiveTraining } = await import('../app/live-building-entry.ts'),
    { requestTrainingPanel } = await import('../app/training-panel-requests.ts')
  startScene(t, scene)
  temple.admission.activity |= 0x80
  temple.admission.class = 9
  stepLiveTraining(world, temple)
  assert.equal(records(scene).has(temple.id), false)
  temple.admission.class = 2
  temple.admission.model = 7
  // buildingAdmission restores model from kind before the simulation callback.
  // Exercise this supplied malformed identity at the real bound consumer seam.
  requestTrainingPanel(world, temple.id)
  assert.equal(records(scene).has(temple.id), false, 'Temple kind cannot impersonate camp model7')
  temple.admission.model = 5
  temple.admission.tribe = 1
  stepLiveTraining(world, temple)
  assert.equal(records(scene).has(temple.id), false)
  temple.admission.tribe = world.manaWorld.playerTribe
  stepLiveTraining(world, temple)
  assert.equal(records(scene).get(temple.id)?.automatic, true)
  temple.hp = 0
  scene.objectPanels.stepBuildingInspections(false)
  assert.equal(records(scene).has(temple.id), false)
  assert.equal(scene.objectPanels.automaticTrainingLatches.has(temple.id), false)
  assert.ok(!world.secondaryEffects.reservations.includes(reservation(temple)))
})
