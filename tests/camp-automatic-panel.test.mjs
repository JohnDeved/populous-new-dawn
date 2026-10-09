// Failure-first caller contract for issue25. Actual Mission2 construction, input,
// admission and fixed turns run; DOM/projection/texture IO and frame deltas are
// supplied. This is not the ordinary browser or original executable witness.
import assert from 'node:assert/strict'
import test from 'node:test'
import { campPanelFixture } from './support/camp-panel-scene.mjs'

const nop = () => {}
const records = scene => scene.objectPanels.buildingRecords
const reservation = camp => `building-panel:${camp.id}`

function startScene(t, scene) {
  if (!('window' in globalThis)) {
    Object.defineProperty(globalThis, 'window', { configurable: true, value: {} })
    t.after(() => {
      delete globalThis.window
    })
  }
  // Execute the actual start lifecycle. Full WebGL construction and listener
  // installation are outside this controlled fixture; no presentation producer
  // or controller method is substituted here.
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

test('bare camp activity cannot allocate automatic DOM or capacity on a zero-turn paint', async t => {
  const { scene, world, camp, frame, paint } = await campPanelFixture(t)
  startScene(t, scene)
  assert.equal(records(scene).size, 0)
  assert.equal(scene.buildingPanels.size, 0)
  // Negative renderer-authority case only. The positive request test below earns
  // activity from actual selected-Brave input and ordinary admission.
  camp.admission.activity |= 0x80
  const turn = world.turn
  frame(0)
  paint()
  assert.equal(world.turn, turn)
  assert.deepEqual(
    {
      record: records(scene).has(camp.id),
      latched: scene.objectPanels.automaticTrainingLatches?.has(camp.id) ?? false,
      dom: scene.buildingPanels.has(camp.id),
      reservations: world.secondaryEffects.reservations.filter(
        owner => owner === reservation(camp)
      ),
    },
    { record: false, latched: false, dom: false, reservations: [] },
    'activity is a producer guard, not independent render-time allocation authority'
  )
})

// The cases below deliberately supply activity/inventory/controller state to
// isolate source-backed lifetime boundaries. The natural caller case in this file is
// the separate proof that actual player input reaches this owner.
async function automaticFixture(t) {
  const fixture = await campPanelFixture(t),
    { stepLiveTraining } = await import('../app/live-building-entry.ts')
  startScene(t, fixture.scene)
  fixture.camp.admission.activity |= 0x80
  fixture.scene.pointerScreen = null
  return {
    ...fixture,
    source: (target = fixture.camp) => stepLiveTraining(fixture.world, target),
    step: () => fixture.scene.objectPanels.stepBuildingInspections(false),
  }
}

test('ordered live callbacks reserve immediately, latch only admission, and retry a later source visit', async t => {
  const { scene, world, camp, api, source } = await automaticFixture(t),
    { buildingAdmission } = await import('../app/live-building-entry.ts'),
    other = api.addBuilding(world, 'blue', 'camp', { x: camp.x + 16, z: camp.z }, true)
  buildingAdmission(world, other).activity |= 0x80
  for (let id = 0; id < 31; id++) scene.objectPanels.panels.set(100000 + id, {})
  const turn = world.turn
  source()
  assert.equal(records(scene).get(camp.id)?.automatic, true)
  assert.equal(scene.objectPanels.automaticTrainingLatches.has(camp.id), true)
  assert.ok(world.secondaryEffects.reservations.includes(reservation(camp)))
  scene.tooltipController.dwell = 5
  const first = structuredClone(records(scene).get(camp.id))
  source(other)
  assert.equal(records(scene).has(other.id), false)
  assert.equal(scene.objectPanels.automaticTrainingLatches.has(other.id), false)
  assert.equal(scene.tooltipController.dwell, 5, 'failed allocation cannot accelerate D')
  source()
  assert.deepEqual(
    records(scene).get(camp.id),
    first,
    'latched repeated callback does not renew or reset phases'
  )
  assert.equal(scene.tooltipController.dwell, 5)
  scene.objectPanels.panels.delete(100000)
  source(other)
  assert.equal(records(scene).get(other.id)?.automatic, true)
  assert.equal(scene.objectPanels.automaticTrainingLatches.has(other.id), true)
  assert.equal(world.turn, turn, 'source order is synchronous, with no later turn or frame needed')
  assert.equal(
    world.secondaryEffects.reservations.filter(owner => owner === reservation(other)).length,
    1
  )
})

test('secondary-capacity failure leaves no latch or feedback and retries when a physical slot is released', async t => {
  const { scene, world, camp, source } = await automaticFixture(t),
    { allocateSecondaryEffect, releaseSecondaryEffect, secondaryEffectCount } =
      await import('../app/secondary-effects.ts'),
    slots = []
  let slot
  while (
    (slot = allocateSecondaryEffect(world.secondaryEffects, {
      kind: 'orderMarker',
      effect: 0,
      counter: 0,
    })) !== null
  )
    slots.push(slot)
  assert.equal(secondaryEffectCount(world.secondaryEffects), 160)
  const cues = []
  scene.onSound = cue => cues.push(cue)
  const dwell = scene.tooltipController.dwell
  source()
  assert.equal(records(scene).has(camp.id), false)
  assert.equal(scene.objectPanels.automaticTrainingLatches.has(camp.id), false)
  assert.equal(scene.tooltipController.dwell, dwell)
  assert.deepEqual(cues, [])
  releaseSecondaryEffect(world.secondaryEffects, slots.at(-1))
  source()
  assert.equal(records(scene).get(camp.id)?.automatic, true)
  assert.equal(secondaryEffectCount(world.secondaryEffects), 160)
})

test('manual reuse preserves D and phase; phase1 expiry clears only the latch; phase2 reuse still retires', async t => {
  const { scene, world, camp, source, step } = await automaticFixture(t)
  scene.objectPanels.inspectBuilding(camp.id, 'explicit', 71)
  for (let visit = 0; visit < 4; visit++) step()
  const record = records(scene).get(camp.id)
  assert.deepEqual(record, { automatic: false, phase: 1, remaining: 15, hold: 16 })
  scene.tooltipController.dwell = 3
  source()
  assert.equal(records(scene).get(camp.id), record)
  assert.deepEqual(record, { automatic: true, phase: 1, remaining: 15, hold: 16 })
  assert.equal(scene.tooltipController.dwell, 3)
  step()
  assert.equal(record.remaining, 15, 'positive phase1 renews to hold16 before decrement')
  camp.admission.activity &= ~0x80
  scene.objectPanels.renewBuildingInspection(camp.id)
  step()
  assert.deepEqual(record, { automatic: true, phase: 2, remaining: 2, hold: 16 })
  assert.equal(scene.objectPanels.automaticTrainingLatches.has(camp.id), false)
  camp.admission.activity |= 0x80
  source()
  assert.equal(scene.objectPanels.automaticTrainingLatches.has(camp.id), true)
  assert.equal(records(scene).get(camp.id), record)
  assert.equal(record.remaining, 2, 'reusing phase2 never restarts its exit')
  assert.equal(scene.tooltipController.dwell, 3)
  for (let visit = 0; visit < 3; visit++) step()
  assert.equal(records(scene).has(camp.id), false)
  assert.equal(scene.objectPanels.automaticTrainingLatches.has(camp.id), false)
  assert.ok(!world.secondaryEffects.reservations.includes(reservation(camp)))
  source()
  assert.notEqual(records(scene).get(camp.id), record)
  assert.deepEqual(records(scene).get(camp.id), {
    automatic: true,
    phase: -1,
    remaining: 0,
    hold: 16,
  })
  assert.equal(scene.tooltipController.dwell, scene.tooltipController.session.threshold + 1)
})

test('stopping during entry waits for the next phase1 test, and hovered controls cannot freeze automatic exit', async t => {
  const { scene, world, camp, source, step, paint } = await automaticFixture(t)
  source()
  camp.admission.activity &= ~0x80
  for (let visit = 0; visit < 4; visit++) step()
  const record = records(scene).get(camp.id)
  assert.equal(record.phase, 1)
  assert.equal(record.remaining, 15)
  assert.equal(scene.objectPanels.automaticTrainingLatches.has(camp.id), true)
  paint()
  const panel = scene.buildingPanels.get(camp.id)
  panel.matches = () => true
  step()
  assert.equal(record.phase, 2)
  assert.equal(scene.objectPanels.automaticTrainingLatches.has(camp.id), false)
  for (let visit = 0; visit < 3; visit++) step()
  assert.equal(records(scene).has(camp.id), false)
  assert.equal(
    scene.buildingPanels.get(camp.id),
    panel,
    'DOM controls can outlive the retired automatic record'
  )
  assert.equal(panel.removed, undefined)
  assert.equal(
    world.secondaryEffects.reservations.filter(owner => owner === reservation(camp)).length,
    1
  )
  panel.matches = () => false
  paint()
  assert.equal(panel.hidden, true)
  assert.ok(!world.secondaryEffects.reservations.includes(reservation(camp)))
})

test('automatic admission rejects wrong-class, nonlocal and blocked targets; ownership loss exits and death retires', async t => {
  const { scene, world, camp, source, step } = await automaticFixture(t)
  camp.admission.class = 9
  source()
  assert.equal(records(scene).size, 0)
  camp.admission.class = 2
  camp.admission.tribe = 1
  source()
  assert.equal(records(scene).size, 0)
  camp.admission.tribe = world.manaWorld.playerTribe
  scene.overviewActive = true
  source()
  assert.equal(records(scene).size, 0)
  assert.equal(scene.objectPanels.automaticTrainingLatches.size, 0)
  scene.overviewActive = false
  const query = document.querySelector
  document.querySelector = selector =>
    selector === 'dialog[open]' ? {} : query.call(document, selector)
  try {
    source()
    assert.equal(records(scene).size, 0)
    assert.equal(scene.objectPanels.automaticTrainingLatches.size, 0)
  } finally {
    document.querySelector = query
  }
  world.manaWorld.gameFlags |= 32
  source()
  assert.equal(records(scene).size, 0)
  world.manaWorld.gameFlags &= ~32
  source()
  for (let visit = 0; visit < 4; visit++) step()
  camp.team = 'red'
  camp.admission.tribe = 1
  step()
  assert.equal(records(scene).get(camp.id).phase, 2)
  assert.equal(scene.objectPanels.automaticTrainingLatches.has(camp.id), false)
  camp.hp = 0
  step()
  assert.equal(records(scene).has(camp.id), false)
  assert.ok(!world.secondaryEffects.reservations.includes(reservation(camp)))
})

test('first automatic T initialization uses the previous sample before the same-frame one-second sample update', async t => {
  const { scene, world, camp, frame, source } = await automaticFixture(t),
    { createTooltipController, createTooltipSession } = await import('../app/tooltip-controller.ts')
  frame(0)
  const session = Object.assign(createTooltipSession(), {
    visits: 50,
    sampleCount: 0,
    sample: 20,
    sampleAt: scene.previous - 1000,
  })
  scene.tooltipSession = session
  scene.tooltipController = createTooltipController(scene.tooltip, session)
  world.speed = 1
  let duringTurn
  scene.gameClock.afterTurn = () => {
    duringTurn = {
      threshold: session.threshold,
      sample: session.sample,
      dwell: scene.tooltipController.dwell,
    }
  }
  frame(1 / 12)
  assert.deepEqual(duringTurn, { threshold: 20, sample: 20, dwell: 21 })
  assert.equal(session.sample, 50, 'later frontend visit publishes the new sample')
  assert.equal(session.threshold, 20, 'the first cache remains permanent across that update')
  assert.equal(session.initializedBy, 'inspection')
  assert.equal(records(scene).get(camp.id).automatic, true)
  source()
  assert.equal(session.threshold, 20)
})

test('actual training callback creates its owner before an affordable conversion clears source activity', async t => {
  const { scene, world, camp, api, frame } = await campPanelFixture(t),
    { stepLiveTraining } = await import('../app/live-building-entry.ts')
  api.select(world, 'brave')
  assert.equal(api.command(world, camp), true)
  world.speed = 1
  scene.pointerScreen = null
  for (let visits = 0; visits < 4000 && !camp.admission.inside; visits++) frame(1 / 12)
  assert.ok(camp.admission.inside > 0)
  assert.equal(records(scene).has(camp.id), false, 'no Scene binding existed during admission')
  startScene(t, scene)
  // Controlled affordability boundary, after real admission. No runtime parity
  // or natural mana timing is claimed by this supplied high-mana case.
  camp.timer = 1000000000
  const request = scene.objectPanels.requestAutomaticTraining,
    beforeTrained = world.stats.trained
  let snapshot
  scene.objectPanels.requestAutomaticTraining = function (id) {
    const activity = camp.admission.activity,
      inside = camp.admission.inside
    const result = request.call(this, id)
    snapshot = {
      activity,
      inside,
      automatic: records(scene).get(id)?.automatic,
      latched: this.automaticTrainingLatches.has(id),
      reserved: world.secondaryEffects.reservations.includes(reservation(camp)),
    }
    return result
  }
  stepLiveTraining(world, camp)
  assert.ok(snapshot.activity & 0x80)
  assert.ok(snapshot.inside > 0)
  assert.equal(snapshot.automatic, true)
  assert.equal(snapshot.latched, true)
  assert.equal(snapshot.reserved, true)
  assert.equal(camp.admission.activity & 0x80, 0)
  assert.ok(world.stats.trained > beforeTrained)
  assert.equal(
    records(scene).has(camp.id),
    true,
    'final inactive state cannot erase the earlier request'
  )
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

test('replacement binding survives stale Scene disposal and headless Worlds create no owner', async t => {
  const { scene, world, camp, source } = await automaticFixture(t),
    { trainingPanelRequestOwner } = await import('../app/training-panel-requests.ts')
  source()
  const previous = records(scene).get(camp.id),
    next = await replacementScene(t, scene, world)
  source()
  const current = records(next).get(camp.id)
  assert.ok(current)
  assert.notEqual(current, previous)
  disposeScene(t, scene)
  assert.equal(trainingPanelRequestOwner(world), next.objectPanels)
  assert.equal(records(scene).size, 0)
  assert.equal(scene.objectPanels.automaticTrainingLatches.size, 0)
  assert.equal(records(next).get(camp.id), current)
  assert.equal(next.objectPanels.automaticTrainingLatches.has(camp.id), true)
  assert.equal(
    world.secondaryEffects.reservations.filter(owner => owner === reservation(camp)).length,
    1
  )
  source()
  assert.equal(records(next).get(camp.id), current)
  disposeScene(t, next)
  assert.equal(trainingPanelRequestOwner(world), undefined)
  source()
  assert.equal(records(next).size, 0)
  assert.ok(!world.secondaryEffects.reservations.includes(reservation(camp)))
})

test('Save preserves the current owner; Load clears transient ownership and stale bit23 cannot suppress the next request', async t => {
  const fixture = await campPanelFixture(t),
    { scene } = fixture,
    { createGameStore } = await import('../app/game-store.ts'),
    { stepLiveTraining } = await import('../app/live-building-entry.ts'),
    { getTooltipController } = await import('../app/scene-tooltip-runtime.ts'),
    { renderBuildingPanels } = await import('../app/building-panels.ts'),
    store = createGameStore()
  store.change(target => Object.assign(target, structuredClone(fixture.world)))
  scene.world = store.getWorld()
  scene.presentationBinding = store.bindPresentation(scene.world)
  const camp = scene.world.buildings.find(b => b.id === fixture.camp.id)
  camp.admission.activity |= 0x80
  camp.admission.flags3 |= 0x800000
  startScene(t, scene)
  stepLiveTraining(scene.world, camp)
  const record = records(scene).get(camp.id),
    session = getTooltipController(scene).session,
    sessionBefore = structuredClone(session),
    gameplay = structuredClone(camp)
  assert.ok(record)
  await store.saveCheckpoint()
  assert.equal(store.hasCheckpoint(), true)
  assert.equal(records(scene).get(camp.id), record)
  assert.equal(scene.objectPanels.automaticTrainingLatches.has(camp.id), true)
  const savedWorld = structuredClone(store.getWorld())
  assert.equal('automaticTrainingLatches' in savedWorld, false)
  assert.equal('buildingRecords' in savedWorld, false)
  assert.equal(store.loadCheckpoint(), true)
  assert.equal(scene.presentationBinding.isCurrent(), false)
  assert.equal(scene.objectPanels.requestAutomaticTraining(camp.id), 'automatic:rejected')
  disposeScene(t, scene)
  const restored = store.getWorld(),
    restoredCamp = restored.buildings.find(b => b.id === camp.id)
  assert.deepEqual(restoredCamp, gameplay)
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
  stepLiveTraining(restored, restoredCamp)
  assert.equal(records(next).get(camp.id)?.automatic, true)
  assert.equal(next.objectPanels.automaticTrainingLatches.has(camp.id), true)
  assert.equal(
    restoredCamp.admission.flags3 & 0x800000,
    0x800000,
    'the port neither reads nor clears saved bit23'
  )
  disposeScene(t, next)
  store.restart()
  assert.deepEqual(store.getWorld().secondaryEffects.reservations, [])
  assert.equal(
    store.getWorld().buildings.some(b => b.id === camp.id && b.kind === 'camp'),
    false
  )
  t.diagnostic(
    'Controlled in-session Save/Load only; typed committed IndexedDB belongs to the ordinary browser witness.'
  )
})

test('actual M2 training input creates a shared automatic record before the fixed-turn observer returns', async t => {
  const { scene, world, camp, point, api, frame, paint } = await campPanelFixture(t),
    { pointerDown, pointerMove, pointerUp } = await import('../app/scene-input-runtime.ts')
  startScene(t, scene)
  frame(0)
  api.select(world, 'brave')
  const selected = world.selected.slice()
  assert.ok(selected.length >= 8, 'the ordinary M2 construction prefix retains eligible Braves')
  const event = {
    ...point,
    button: 0,
    buttons: 1,
    pointerId: 61,
    currentTarget: scene.renderer.domElement,
    preventDefault: nop,
    shiftKey: false,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
  }
  pointerDown(scene, event)
  pointerUp(scene, { ...event, buttons: 0 })
  const recipients = selected.map(id => world.units.find(unit => unit.id === id)),
    orders = recipients.map(unit => {
      const person = unit.entry?.person
      assert.ok(person, `training input owns entry.person for selected Brave ${unit.id}`)
      return world.buildingOrders.records[person.commands[person.commandCursor]]
    })
  assert.ok(orders.every(order => order?.model === 8 && order.a === camp.id))
  assert.ok(
    orders.every(order => order === orders[0]),
    'selected group shares the actual training order'
  )
  assert.equal(records(scene).size, 0, 'input acceptance alone does not create the panel')
  assert.equal(scene.buildingPanels.size, 0)
  pointerMove(scene, { clientX: 799, clientY: 1, buttons: 0 })
  world.speed = 1
  let entered = false,
    eligibleAtTurnStart = false,
    observed
  scene.gameClock.beforeTurn = () => {
    eligibleAtTurnStart = !!(camp.admission.activity & 0x80)
  }
  scene.gameClock.afterTurn = () => {
    entered ||= camp.admission.inside > 0
    const record = records(scene).get(camp.id)
    if (!observed && entered && (record || eligibleAtTurnStart)) {
      // Capture primitives synchronously here. Later frontend/controller/render
      // work and host serialization cannot repair this producer-boundary sample.
      observed = {
        automatic: record?.automatic ?? false,
        latched: scene.objectPanels.automaticTrainingLatches?.has(camp.id) ?? false,
        phase: record?.phase ?? null,
        reservations: world.secondaryEffects.reservations.filter(
          owner => owner === reservation(camp)
        ),
      }
      // Exercise the renderer here: an absent call would not prove that a fresh
      // phase -1 record stays unpainted before the existing controller visit.
      paint()
      observed.dom = scene.buildingPanels.has(camp.id)
    }
  }
  for (let visits = 0; visits < 4000 && !observed; visits++) frame(1 / 12)
  assert.ok(entered, 'actual entry routing admits selected Braves without injected occupants')
  assert.ok(observed, `actual active-building visit reached by turn ${world.turn}`)
  t.diagnostic(
    JSON.stringify({
      selectedBraves: selected.length,
      sharedOrderModel: orders[0].model,
      camp: camp.id,
      turn: world.turn,
      inside: camp.admission.inside,
      activity: camp.admission.activity,
      observed,
    })
  )
  assert.deepEqual(
    observed,
    { automatic: true, latched: true, phase: -1, reservations: [reservation(camp)], dom: false },
    'live training callback must reserve the fresh record synchronously before frontend stepping'
  )
  assert.ok(
    records(scene).get(camp.id).phase >= 0,
    'the existing same-frame controller steps the record'
  )
  paint()
  assert.equal(scene.buildingPanels.get(camp.id)?.hidden, false, 'the stepped record can now paint')
})
