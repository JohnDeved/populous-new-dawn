// Failure-first actual Scene/input/panel callers. Mission2 and construction run
// through the existing model/clock; projection, texture IO and DOM are supplied.
// These controlled visits do not claim an ordinary browser episode or pixels.
import assert from 'node:assert/strict'
import test from 'node:test'
import { campPanelFixture as campFixture } from './support/camp-panel-scene.mjs'

const nop = () => {}
const records = scene => scene.objectPanels.buildingRecords ?? scene.objectPanels.hutRecords

test('completed camp panel waits for actual first-display inspection instead of zero-tick hover paint', async t => {
  const { scene, camp, frame, paint } = await campFixture(t)
  frame(0)
  paint()
  assert.equal(
    scene.buildingPanels.get(camp.id)?.hidden ?? true,
    true,
    'a zero-tick hover paint cannot expose the camp inspection panel'
  )
  frame()
  assert.match(
    scene.tooltip.text,
    /^Warrior Training Hut:/,
    'existing imported string912 is acquired'
  )
  assert.equal(scene.tooltip.draw, 0)
  for (let visits = 0; visits < 120 && !records(scene).has(camp.id); visits++) frame()
  assert.ok(
    records(scene).has(camp.id),
    'actual first-display callback creates the manual camp record'
  )
  assert.equal(scene.tooltipController.lastVisit.firstDisplay, camp.id)
  assert.equal(records(scene).get(camp.id).automatic, false)
  paint()
  const panel = scene.buildingPanels.get(camp.id)
  assert.equal(panel.hidden, false)
  assert.match(panel.attributes['aria-label'], /^Warrior training: 0 of 5 occupants/)
  assert.equal(panel.lastElementChild.attributes['aria-label'], 'Dismantle warrior hut')
  assert.deepEqual(
    scene.world.secondaryEffects.reservations.filter(
      owner => owner === `building-panel:${camp.id}`
    ),
    [`building-panel:${camp.id}`],
    'retained record and visible DOM reserve once'
  )
})

test('real camp right-button edges queue inspection before one composed visit and emit one feedback', async t => {
  const { scene, world, camp, point, frame } = await campFixture(t),
    { pointerDown, pointerUp } = await import('../app/scene-input-runtime.ts')
  const cues = []
  scene.onSound = cue => cues.push(cue)
  const event = {
    ...point,
    button: 2,
    buttons: 2,
    pointerId: 17,
    currentTarget: scene.renderer.domElement,
    preventDefault: nop,
    shiftKey: false,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
  }
  const beforeMarkers = new Set(world.effects.map(effect => effect.id))
  pointerDown(scene, event)
  pointerUp(scene, { ...event, buttons: 0 })
  assert.equal(
    scene.tooltipInspectionInputs?.length ?? 0,
    2,
    'actual camp down and release must both survive until the due controller visit'
  )
  assert.equal(records(scene).size, 0, 'input itself does not allocate a presentation record')
  frame()
  assert.equal(records(scene).size, 1)
  assert.equal(records(scene).get(camp.id).automatic, false)
  assert.deepEqual(scene.tooltipController.lastVisit.inspection, ['explicit:created', 'release'])
  assert.equal(
    'buildingHeldPointer' in scene.objectPanels
      ? scene.objectPanels.buildingHeldPointer
      : scene.objectPanels.hutHeldPointer,
    null
  )
  assert.deepEqual(cues, [0x6a])
  assert.equal(
    world.effects.filter(effect => !beforeMarkers.has(effect.id) && effect.kind === 'orderMarker')
      .length,
    1
  )
})

test('existing dismantling paint stays independent of manual inspection records', async t => {
  const { scene, camp, frame, paint } = await campFixture(t)
  // Supplied dismantling tests the existing independent browser display owner.
  // This is not an automatic request, natural training or native timing witness.
  assert.ok(camp.admission)
  camp.admission.activity |= 0x8000
  scene.pointerScreen = null
  scene.hoveredObject = null
  const before = structuredClone(camp.admission)
  frame(0)
  paint()
  const panel = scene.buildingPanels.get(camp.id)
  assert.equal(panel.hidden, false, 'dismantling still exposes its independent controls')
  assert.equal(records(scene).size, 0, 'activity alone creates no manual or automatic record')
  frame()
  paint()
  assert.equal(panel.hidden, false)
  assert.equal(records(scene).size, 0)
  assert.deepEqual(camp.admission, before, 'presentation does not change training state')
  assert.deepEqual(
    scene.world.secondaryEffects.reservations.filter(
      owner => owner === `building-panel:${camp.id}`
    ),
    [`building-panel:${camp.id}`],
    'the legacy visible activity owner reserves once'
  )
})

async function inspectWithPointer({ scene, point, frame }, pointerId = 21) {
  const { pointerDown, pointerUp } = await import('../app/scene-input-runtime.ts')
  const event = {
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
  pointerDown(scene, event)
  pointerUp(scene, { ...event, buttons: 0 })
  frame()
}

test('manual camp record survives dismantling start and its expiry preserves independent controls', async t => {
  const fixture = await campFixture(t),
    { scene, camp, frame, paint } = fixture
  await inspectWithPointer(fixture)
  const record = records(scene).get(camp.id)
  assert.ok(record)
  const before = structuredClone(record),
    dwell = scene.tooltipController.dwell
  // Supplied dismantling exercises the independent browser-owner handoff.
  camp.admission.activity |= 0x8000
  frame(0)
  paint()
  assert.deepEqual(record, before, 'activity start does not reset the manual phase')
  assert.equal(scene.tooltipController.dwell, dwell, 'activity start does not accelerate dwell')
  await inspectWithPointer(fixture)
  assert.equal(records(scene).get(camp.id), record, 'active manual inspection reuses identity')
  assert.equal(record.automatic, false, 'manual reuse does not manufacture an automatic record')
  assert.deepEqual(scene.tooltipController.lastVisit.inspection, ['explicit:reused', 'release'])
  const panel = scene.buildingPanels.get(camp.id)
  scene.pointerScreen = null
  frame(0)
  for (let visits = 0; visits < 48; visits++) frame()
  assert.equal(records(scene).has(camp.id), false, 'off-target manual lifetime expires')
  assert.equal(panel.removed, undefined, 'manual expiry cannot remove the active panel')
  paint()
  assert.equal(scene.buildingPanels.get(camp.id), panel)
  assert.equal(panel.hidden, false)
  assert.deepEqual(
    scene.world.secondaryEffects.reservations.filter(
      owner => owner === `building-panel:${camp.id}`
    ),
    [`building-panel:${camp.id}`]
  )
  camp.admission.activity &= ~0x8000
  panel.matches = () => true
  paint()
  assert.equal(panel.hidden, false, 'existing pointer-held controls survive activity ending')
  panel.matches = () => false
  panel.contains = () => true
  paint()
  assert.equal(panel.hidden, false, 'existing keyboard focus remains usable')
  panel.contains = () => false
  paint()
  assert.equal(panel.hidden, true, 'leaving both independent owners releases the panel')
})

test('visible camp transfers into the full supported inventory without a second capacity charge', async t => {
  const fixture = await campFixture(t),
    { scene, world, camp, paint } = fixture,
    { syncSecondaryReservations } = await import('../app/scene-secondary-effects.ts'),
    { allocateSecondaryEffect, secondaryEffectCount } = await import('../app/secondary-effects.ts')
  camp.admission.activity |= 0x8000
  paint()
  // Controlled inventory occupancy isolates the already-supported count adapter.
  for (let id = 0; id < 31; id++) scene.objectPanels.panels.set(100000 + id, {})
  syncSecondaryReservations(scene)
  assert.equal(world.secondaryEffects.reservations.length, 32)
  while (
    allocateSecondaryEffect(world.secondaryEffects, {
      kind: 'orderMarker',
      effect: 0,
      counter: 0,
    }) !== null
  ) {
    // Fill only through the actual capacity adapter.
  }
  assert.equal(secondaryEffectCount(world.secondaryEffects), 160)
  const cues = []
  scene.onSound = cue => cues.push(cue)
  await inspectWithPointer(fixture)
  const record = records(scene).get(camp.id)
  assert.ok(record, 'a visible-to-retained transfer has zero additional capacity cost')
  assert.deepEqual(scene.tooltipController.lastVisit.inspection, ['explicit:created', 'release'])
  assert.equal(scene.tooltipController.dwell, scene.tooltipController.session.threshold + 1)
  assert.equal(secondaryEffectCount(world.secondaryEffects), 160)
  assert.equal(world.secondaryEffects.reservations.length, 32)
  assert.deepEqual(cues, [0x6a], 'feedback survives full marker capacity')
  await inspectWithPointer(fixture)
  assert.equal(records(scene).get(camp.id), record)
  assert.deepEqual(scene.tooltipController.lastVisit.inspection, ['explicit:reused', 'release'])
  assert.equal(secondaryEffectCount(world.secondaryEffects), 160)
})

test('new camp allocation failure still feeds back once and rejects stale or blocked presses', async t => {
  const fixture = await campFixture(t),
    { scene, camp, frame } = fixture
  for (let id = 0; id < 32; id++) scene.objectPanels.panels.set(100000 + id, {})
  const cues = []
  scene.onSound = cue => cues.push(cue)
  await inspectWithPointer(fixture)
  assert.deepEqual(scene.tooltipController.lastVisit.inspection, [
    'explicit:rejected-capacity',
    'release',
  ])
  assert.equal(records(scene).has(camp.id), false)
  assert.deepEqual(cues, [0x6a])
  const before = cues.length
  scene.world.paused = true
  await inspectWithPointer(fixture)
  assert.equal(cues.length, before)
  assert.equal(scene.tooltipInspectionInputs.length, 0)
  scene.world.paused = false
  // A genuine pending edge must not replay after the target ceases to exist.
  const { pointerDown } = await import('../app/scene-input-runtime.ts')
  scene.objectPanels.panels.clear()
  pointerDown(scene, {
    ...fixture.point,
    button: 2,
    buttons: 2,
    pointerId: 31,
    currentTarget: scene.renderer.domElement,
    preventDefault: nop,
  })
  camp.hp = 0
  frame()
  assert.deepEqual(scene.tooltipController.lastVisit.inspection, ['cancel-stale'])
  assert.equal(cues.length, before)
})

test('actual store migration and Scene disposal separate saved camps from transient inspection owners', async t => {
  const fixture = await campFixture(t),
    { scene, world, camp, paint } = fixture,
    { createGameStore } = await import('../app/game-store.ts'),
    { createTooltip } = await import('../app/tooltips.ts'),
    { getTooltipController } = await import('../app/scene-tooltip-runtime.ts'),
    { ObjectPanels } = await import('../app/object-panels.ts')
  await inspectWithPointer(fixture)
  paint()
  const panel = scene.buildingPanels.get(camp.id),
    session = scene.tooltipController.session,
    sessionBefore = structuredClone(session),
    store = createGameStore()
  // The real constructed World supplies this controlled store fixture. The
  // ordinary browser witness separately verifies typed committed IndexedDB.
  store.change(target => Object.assign(target, structuredClone(world)))
  const savedCamp = structuredClone(
    store.getWorld().buildings.find(building => building.id === camp.id)
  )
  await store.saveCheckpoint()
  assert.equal(store.hasCheckpoint(), true)
  assert.ok(store.getWorld().secondaryEffects.reservations.includes(`building-panel:${camp.id}`))
  scene.tooltipInspectionInputs.push({
    kind: 'down',
    pointerId: 45,
    target: camp.id,
    cell: scene.tooltipInput.cell,
  })
  const cancelFrame = Object.getOwnPropertyDescriptor(globalThis, 'cancelAnimationFrame')
  Object.defineProperty(globalThis, 'cancelAnimationFrame', { configurable: true, value: nop })
  t.after(() => {
    if (cancelFrame) Object.defineProperty(globalThis, 'cancelAnimationFrame', cancelFrame)
    else delete globalThis.cancelAnimationFrame
  })
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
  assert.equal(records(scene).size, 0)
  assert.deepEqual(scene.tooltipInspectionInputs, [])
  assert.equal(scene.objectPanels.buildingHeldPointer, null)
  assert.equal(scene.tooltipInput, null)
  assert.equal(panel.removed, true)
  assert.deepEqual(world.secondaryEffects.reservations, [])
  assert.equal(store.loadCheckpoint(), true)
  const restored = store.getWorld()
  assert.deepEqual(
    restored.buildings.find(building => building.id === camp.id),
    savedCamp
  )
  assert.deepEqual(restored.secondaryEffects.reservations, [])
  const next = { world: restored, tooltip: createTooltip(), tooltipSession: session }
  next.objectPanels = new ObjectPanels(next)
  const controller = getTooltipController(next)
  assert.equal(next.objectPanels.buildingRecords.size, 0)
  assert.equal(controller.category, 'none')
  assert.equal(controller.session, session)
  assert.deepEqual(
    session,
    sessionBefore,
    'scene replacement neither resets nor advances the page cache'
  )
  store.restart()
  assert.equal(store.getWorld().outcome.level, 2)
  assert.equal(
    store
      .getWorld()
      .buildings.some(building => building.id === camp.id && building.kind === 'camp'),
    false
  )
  assert.deepEqual(store.getWorld().secondaryEffects.reservations, [])
})
