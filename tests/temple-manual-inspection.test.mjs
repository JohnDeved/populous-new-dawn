// Actual M3 acquisition/build, picked input, controller/painter and store callers.
// DOM, projection, texture IO and frame deltas are supplied. This is controlled
// caller evidence, not an ordinary browser, committed IDB or native timing proof.
import assert from 'node:assert/strict'
import test from 'node:test'
import { templePanelFixture } from './support/temple-panel-scene.mjs'
import { checkpointObservation } from '../scripts/local-render/checkpoint-observer.mjs'

const nop = () => {}
const records = scene => scene.objectPanels.buildingRecords
const reservation = temple => `building-panel:${temple.id}`
const visible = (scene, temple) => scene.buildingPanels.get(temple.id)?.hidden === false

function eventFor({ scene, point }, pointerId = 87) {
  return {
    ...point,
    button: 2,
    buttons: 2,
    pointerId,
    currentTarget: scene.renderer.domElement,
    preventDefault: nop,
    shiftKey: false,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
  }
}

async function inspect(fixture, release = true) {
  const { pointerDown, pointerUp } = await import('../app/scene-input-runtime.ts'),
    event = eventFor(fixture)
  pointerDown(fixture.scene, event)
  if (release) pointerUp(fixture.scene, { ...event, buttons: 0 })
  fixture.frame()
  return event
}

function startScene(t, scene) {
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {} })
  t.after(() => {
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
}

async function typed(world) {
  const key = Symbol('controlled manual Temple checkpoint')
  Object.defineProperty(globalThis, key, {
    configurable: true,
    value: { version: 1, world },
  })
  try {
    return await checkpointObservation({ observationName: key })
  } finally {
    delete globalThis[key]
  }
}

test('completed Temple waits for actual first name display to own its manual painter', async t => {
  const { scene, temple, frame, paint } = await templePanelFixture(t)
  frame(0)
  paint()
  assert.equal(visible(scene, temple), false, 'zero-tick ordinary hover has no manual owner')
  frame()
  assert.match(scene.tooltip.text, /^Temple:/, 'existing imported local string913 is acquired')
  assert.equal(scene.tooltip.draw, 0)
  for (let visits = 0; visits < 120 && !records(scene).has(temple.id); visits++) frame()
  assert.equal(scene.tooltipController.lastVisit.firstDisplay, temple.id)
  assert.equal(records(scene).get(temple.id)?.automatic, false)
  assert.equal(scene.objectPanels.automaticTrainingLatches.size, 0)
  paint()
  assert.equal(visible(scene, temple), true)
  assert.match(
    scene.buildingPanels.get(temple.id).attributes['aria-label'],
    /^Preacher training: 0 of 5 occupants;/
  )
  assert.deepEqual(
    scene.world.secondaryEffects.reservations.filter(owner => owner === reservation(temple)),
    [reservation(temple)]
  )
})

test('Temple explicit held input reuses one record, releases off-target and expires at the existing opportunity', async t => {
  const fixture = await templePanelFixture(t),
    { scene, world, temple, frame, paint } = fixture,
    { pointerDown, pointerMove, pointerUp } = await import('../app/scene-input-runtime.ts'),
    event = eventFor(fixture),
    cues = []
  scene.onSound = cue => cues.push(cue)
  const before = world.effects.length
  pointerDown(scene, event)
  assert.equal(
    scene.tooltipInspectionInputs.length,
    1,
    'real picked Temple queues explicit admission'
  )
  assert.equal(records(scene).size, 0)
  frame()
  const record = records(scene).get(temple.id)
  assert.deepEqual(record, { phase: 0, remaining: 2, hold: 16, automatic: false })
  assert.equal(scene.objectPanels.buildingHeldPointer, event.pointerId)
  assert.deepEqual(cues, [0x6a])
  assert.equal(
    world.effects.slice(before).filter(effect => effect.kind === 'orderMarker').length,
    1
  )
  paint()
  assert.equal(visible(scene, temple), true)
  pointerDown(scene, event)
  frame()
  assert.equal(records(scene).get(temple.id), record)
  assert.equal(record.remaining, 1, 'repeated explicit input advances rather than restarts entry')
  assert.deepEqual(scene.tooltipController.lastVisit.inspection, ['explicit:reused'])
  pointerMove(scene, { clientX: 799, clientY: 1, buttons: 2 })
  for (let visits = 0; visits < 30; visits++) frame()
  assert.equal(records(scene).get(temple.id), record)
  assert.deepEqual(record, { phase: 1, remaining: 15, hold: 16, automatic: false })
  pointerUp(scene, { ...event, clientX: 799, clientY: 1, buttons: 0 })
  frame()
  assert.equal(scene.objectPanels.buildingHeldPointer, null)
  assert.equal(scene.objectPanels.buildingInspected, null)
  for (let visits = 0; visits < 30; visits++) frame()
  paint()
  assert.equal(records(scene).has(temple.id), false)
  assert.equal(visible(scene, temple), false)
  assert.ok(!world.secondaryEffects.reservations.includes(reservation(temple)))
  assert.deepEqual(cues, [0x6a, 0x6a], 'release and expiry emit no feedback')
})

test('manual Temple admission binds local completed class2/model5, without activity or roster restrictions', async t => {
  const fixture = await templePanelFixture(t),
    { scene, temple, frame } = fixture,
    { publishTooltipInput } = await import('../app/scene-tooltip-runtime.ts'),
    original = structuredClone(temple)
  for (const [label, alter] of [
    [
      'incomplete',
      b => {
        b.progress = 0.5
      },
    ],
    [
      'dead',
      b => {
        b.hp = 0
      },
    ],
    [
      'enemy',
      b => {
        b.team = 'red'
      },
    ],
    [
      'wrong class',
      b => {
        b.admission.class = 9
      },
    ],
    [
      'wrong model',
      b => {
        b.admission.model = 7
      },
    ],
    [
      'foreign tribe',
      b => {
        b.admission.tribe = 1
      },
    ],
  ]) {
    alter(temple)
    assert.equal(scene.objectPanels.inspectBuilding(temple.id, 'hover'), 'hover:rejected', label)
    publishTooltipInput(scene)
    assert.equal(scene.tooltipInput.inspectionTarget, null, `${label} explicit target`)
    Object.assign(temple, structuredClone(original))
  }
  // Supplied activity/occupants isolate the lack of a manual idle/empty guard.
  temple.admission.activity |= 0x80
  temple.admission.occupants[0] = 123456
  assert.equal(scene.objectPanels.inspectBuilding(temple.id, 'hover'), 'hover:created')
  assert.equal(records(scene).get(temple.id).automatic, false)
  assert.equal(scene.objectPanels.automaticTrainingLatches.size, 0)
  temple.admission.activity &= ~0x80
  frame()
  temple.admission.model = 7
  frame()
  assert.equal(
    records(scene).has(temple.id),
    false,
    'invalid native identity retires the manual owner'
  )
})

test('Temple manual failure leaves paint hidden and retains explicit feedback and stale-input rejection', async t => {
  const fixture = await templePanelFixture(t),
    { scene, world, temple, frame, paint } = fixture,
    cues = []
  scene.onSound = cue => cues.push(cue)
  for (let id = 0; id < 32; id++) scene.objectPanels.panels.set(100000 + id, {})
  await inspect(fixture)
  assert.deepEqual(scene.tooltipController.lastVisit.inspection, [
    'explicit:rejected-capacity',
    'release',
  ])
  assert.equal(records(scene).has(temple.id), false)
  assert.equal(scene.objectPanels.automaticTrainingLatches.size, 0)
  paint()
  assert.equal(visible(scene, temple), false)
  assert.ok(!world.secondaryEffects.reservations.includes(reservation(temple)))
  assert.deepEqual(cues, [0x6a])
  world.paused = true
  await inspect(fixture)
  assert.deepEqual(cues, [0x6a])
  world.paused = false
  scene.objectPanels.panels.clear()
  const { pointerDown } = await import('../app/scene-input-runtime.ts')
  pointerDown(scene, eventFor(fixture))
  temple.hp = 0
  frame()
  assert.deepEqual(scene.tooltipController.lastVisit.inspection, ['cancel-stale'])
  assert.deepEqual(cues, [0x6a])
})

test('actual Brave training callback reuses the manual Temple owner without reset or duplicate reservation', async t => {
  const fixture = await templePanelFixture(t),
    { scene, world, temple, api, frame } = fixture,
    { pointerDown, pointerUp, pointerMove } = await import('../app/scene-input-runtime.ts')
  startScene(t, scene)
  await inspect(fixture)
  const record = records(scene).get(temple.id)
  assert.ok(record)
  const brave = world.units.find(
    unit => unit.team === 'blue' && unit.kind === 'brave' && unit.hp > 0 && unit.inside === null
  )
  api.setSelection(world, [brave.id])
  const event = { ...eventFor(fixture), button: 0, buttons: 1 }
  pointerDown(scene, event)
  pointerUp(scene, { ...event, buttons: 0 })
  const person = brave.entry.person,
    order = world.buildingOrders.records[person.commands[person.commandCursor]]
  assert.equal(order.model, 8)
  assert.equal(order.a, temple.id)
  // Hold existing controls via the supplied DOM boundary while ordinary entry
  // and fixed-turn simulation complete. No supplied training activity here.
  fixture.paint()
  const panel = scene.buildingPanels.get(temple.id)
  panel.matches = () => true
  pointerMove(scene, { clientX: 799, clientY: 1, buttons: 0 })
  const request = scene.objectPanels.requestAutomaticTraining
  let observed
  scene.objectPanels.requestAutomaticTraining = function (id) {
    const before = { ...record },
      result = request.call(this, id)
    if (id === temple.id && !observed) {
      observed = { result, before, after: { ...records(scene).get(id) } }
      assert.equal(records(scene).get(id), record)
    }
    return result
  }
  world.speed = 1
  for (let visits = 0; visits < 4000 && !observed; visits++) frame(1 / 12)
  assert.ok(observed, 'actual admission reaches the synchronous training consumer')
  assert.equal(observed.result, 'automatic:reused')
  assert.deepEqual(observed.after, { ...observed.before, automatic: true })
  assert.equal(brave.inside, temple.id)
  assert.equal(scene.objectPanels.automaticTrainingLatches.has(temple.id), true)
  assert.deepEqual(
    world.secondaryEffects.reservations.filter(owner => owner === reservation(temple)),
    [reservation(temple)]
  )
})

test('Temple phase2 manual-to-automatic reuse exits without restarting and held controls remain independent', async t => {
  const fixture = await templePanelFixture(t),
    { scene, world, temple, frame, paint } = fixture,
    { stepLiveTraining } = await import('../app/live-building-entry.ts'),
    { pointerMove } = await import('../app/scene-input-runtime.ts')
  startScene(t, scene)
  await inspect(fixture)
  const record = records(scene).get(temple.id)
  assert.ok(record)
  paint()
  const panel = scene.buildingPanels.get(temple.id)
  pointerMove(scene, { clientX: 799, clientY: 1, buttons: 0 })
  for (let visits = 0; visits < 40 && record.phase !== 2; visits++) frame()
  assert.equal(record.phase, 2)
  const before = { ...record }
  // Supplied activity isolates phase-2 reuse independently from ordinary timing.
  temple.admission.activity |= 0x80
  stepLiveTraining(world, temple)
  assert.equal(records(scene).get(temple.id), record)
  assert.deepEqual(record, { ...before, automatic: true })
  panel.matches = () => true
  temple.admission.activity &= ~0x80
  for (let visits = 0; visits < 3; visits++) frame()
  assert.equal(records(scene).has(temple.id), false)
  assert.equal(scene.objectPanels.automaticTrainingLatches.has(temple.id), false)
  paint()
  assert.equal(visible(scene, temple), true)
  panel.matches = () => false
  panel.contains = () => true
  paint()
  assert.equal(
    visible(scene, temple),
    true,
    'keyboard focus remains usable after record retirement'
  )
  panel.contains = () => false
  paint()
  assert.equal(visible(scene, temple), false)
  assert.ok(!world.secondaryEffects.reservations.includes(reservation(temple)))
})

test('typed Save and first Load publication preserve gameplay and discard manual Temple ownership', async t => {
  const fixture = await templePanelFixture(t),
    { scene, temple, paint } = fixture,
    { createGameStore, migrateCheckpoint } = await import('../app/game-store.ts'),
    { ObjectPanels } = await import('../app/object-panels.ts'),
    { createTooltip } = await import('../app/tooltips.ts'),
    { getTooltipController } = await import('../app/scene-tooltip-runtime.ts'),
    { renderBuildingPanels } = await import('../app/building-panels.ts'),
    store = createGameStore()
  store.change(target => Object.assign(target, structuredClone(fixture.world)))
  scene.world = store.getWorld()
  await inspect(fixture)
  paint()
  const record = records(scene).get(temple.id)
  assert.ok(record)
  let publication
  const unsubscribe = store.subscribe(() => {
    publication = structuredClone(store.getWorld())
  })
  t.after(unsubscribe)
  const save = store.saveCheckpoint()
  assert.ok(publication, 'real Save synchronously publishes after normalization')
  const saved = publication,
    expectedLoad = migrateCheckpoint(structuredClone(saved)),
    savedDigest = await typed(saved)
  await save // No browser IDB: in-session Save is the asserted boundary.
  assert.equal(store.hasCheckpoint(), true)
  assert.equal(records(scene).get(temple.id), record, 'Save preserves the live Scene record')
  assert.equal('buildingRecords' in saved, false)
  assert.equal('automaticTrainingLatches' in saved, false)
  assert.equal(store.loadCheckpoint(), true)
  assert.deepEqual(await typed(publication), await typed(expectedLoad))
  assert.deepEqual(await typed(saved), savedDigest, 'Load cannot mutate the captured Save boundary')
  assert.deepEqual(publication.secondaryEffects.reservations, [])
  const session = getTooltipController(scene).session,
    sessionBefore = structuredClone(session),
    next = {
      world: store.getWorld(),
      tooltip: createTooltip(),
      tooltipSession: session,
      buildingPanels: new Map(),
      visible: () => true,
      hoveredObject: temple.id,
    }
  next.objectPanels = new ObjectPanels(next)
  assert.equal(records(next).size, 0)
  assert.equal(next.objectPanels.buildingHeldPointer, null)
  assert.equal(getTooltipController(next).session, session)
  assert.deepEqual(session, sessionBefore)
  renderBuildingPanels(next, { complete: true, naturalWidth: 2048 })
  assert.equal(next.buildingPanels.size, 0, 'Load plus hover paint cannot replay manual admission')
  assert.deepEqual(
    store.getWorld().buildings.find(b => b.id === temple.id),
    saved.buildings.find(b => b.id === temple.id)
  )
})
