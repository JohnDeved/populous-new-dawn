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
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {} })
  t.after(() => {
    if (oldWindow) Object.defineProperty(globalThis, 'window', oldWindow)
    else delete globalThis.window
  })
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
      reservations: world.secondaryEffects.reservations.filter(owner => owner === reservation(camp)),
    },
    { record: false, latched: false, dom: false, reservations: [] },
    'activity is a producer guard, not independent render-time allocation authority'
  )
})

test('actual M2 training input creates a shared automatic record before the fixed-turn observer returns', async t => {
  const { scene, world, camp, point, api, frame } = await campPanelFixture(t),
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
  assert.ok(orders.every(order => order === orders[0]), 'selected group shares the actual training order')
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
        reservations: world.secondaryEffects.reservations.filter(owner => owner === reservation(camp)),
        dom: scene.buildingPanels.has(camp.id),
      }
    }
  }
  for (let visits = 0; visits < 4000 && !observed; visits++) frame(1 / 12)
  assert.ok(entered, 'actual entry routing admits selected Braves without injected occupants')
  assert.ok(observed, `actual active-building visit reached by turn ${world.turn}`)
  t.diagnostic(JSON.stringify({
    selectedBraves: selected.length,
    sharedOrderModel: orders[0].model,
    camp: camp.id,
    turn: world.turn,
    inside: camp.admission.inside,
    activity: camp.admission.activity,
    observed,
  }))
  assert.deepEqual(
    observed,
    { automatic: true, latched: true, phase: -1, reservations: [reservation(camp)], dom: false },
    'live training callback must reserve the fresh record synchronously before frontend stepping'
  )
})
