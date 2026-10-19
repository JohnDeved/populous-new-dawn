import test from 'node:test'
import assert from 'node:assert/strict'
import { createWorld, addUnit, browserPosition, hudPeople, selectFollowers } from '../app/model.ts'
import { createLivePerson } from '../app/live-people.ts'
import { boardLiveVehicle } from '../app/live-vehicles.ts'
import { vehicleSeat } from '../app/vehicle-seats.ts'
import { hudTaskPeople } from '../app/follower-tasks-runtime.ts'
import { followerTaskCounts } from '../app/hud-tasks.ts'

function occupiedCrew(kind = 1, routeOnly = false) {
  const world = createWorld(22), vehicle = world.vehicles.find(v => v.model === kind)
  world.units = []; world.pathfinding.people.clear(); world.selected = []
  const add = (kind, team = 'blue') => {
    const unit = addUnit(world, team, kind, browserPosition(vehicle))
    unit.native = createLivePerson(world, unit); unit.native.state = 19
    const source = routeOnly ? createLivePerson(world, unit) : unit.native
    source.state = 19; source.flags3 = 0x123456f8
    world.pathfinding.people.set(unit.id, source)
    assert.ok(boardLiveVehicle(world, source, vehicle))
    return { unit, source }
  }
  return { world, vehicle, add }
}

test('persistent class click selects the boarded mixed crew, not just matching passengers', () => {
  for (const kind of [1, 3]) {
    const { world, vehicle, add } = occupiedCrew(kind)
    const brave = add('brave'), warrior = add('warrior')
    selectFollowers(world, 2, vehicle, 'single')
    assert.deepEqual(world.selected, [brave.unit.id, warrior.unit.id])
    assert.ok([brave, warrior].every(({ source }) => source.selectionFlags & 128))
    const counts = followerTaskCounts(hudTaskPeople(world), vehicle)
    assert.deepEqual([counts.tasks[0][1], counts.tasks[2][1], counts.tasks[3][1]], [2, 1, 1])
  }
})

test('persistent strip reads the occupied route owner without touching dormant native people', () => {
  for (const kind of [1, 3]) {
    const { world, vehicle, add } = occupiedCrew(kind, true)
    const brave = add('brave'), warrior = add('warrior'), before = structuredClone(world)
    const people = hudPeople(world)
    for (const [index, entry] of [brave, warrior].entries()) {
      const person = people.find(p => p.id === entry.unit.id), seat = vehicleSeat(vehicle, index)
      assert.equal(person.source, entry.source)
      assert.deepEqual([person.x, person.y], [seat.x, seat.y])
    }
    assert.deepEqual(world, before)
    selectFollowers(world, 2, vehicle, 'single')
    assert.deepEqual(world.selected, [brave.unit.id, warrior.unit.id])
    assert.deepEqual(world.units.map(u => u.native), before.units.map(u => u.native))
    assert.deepEqual(world.vehicles, before.vehicles)
    assert.deepEqual(world.buildingOrders, before.buildingOrders)
    assert.equal(world.randomState, before.randomState)
  }
})

test('single, Ctrl and Shift class/Total/Shaman commands preserve native crew propagation', () => {
  for (const kind of [1, 3]) for (const model of [0, 2, 7]) for (const mode of ['single', 'five', 'all']) {
    if (model === 7 && mode === 'five') continue // The Page/Scene maps Shaman Ctrl to single.
    const { world, vehicle, add } = occupiedCrew(kind, true)
    const first = add(model === 7 ? 'shaman' : 'brave'), other = add(model === 7 ? 'warrior' : 'shaman')
    selectFollowers(world, model, vehicle, mode)
    assert.deepEqual(world.selected, [first.unit.id, other.unit.id], `${kind}/${model}/${mode}`)
  }
})

test('crew propagation is immediate so Ctrl searches for the next unselected passenger', () => {
  const { world, vehicle, add } = occupiedCrew()
  const crew = [add('brave'), add('brave')]
  const foot = []
  for (let i = 0; i < 5; i++) {
    const unit = addUnit(world, 'blue', 'brave', browserPosition(vehicle))
    unit.native = createLivePerson(world, unit)
    unit.native.x += 1000 + i * 100; unit.native.state = 19
    foot.push(unit)
  }
  const sounds = structuredClone(world.sounds)
  selectFollowers(world, 2, vehicle, 'five')
  assert.deepEqual(world.selected, [...crew.map(({ unit }) => unit.id), ...foot.slice(0, 4).map(u => u.id)])
  assert.deepEqual(world.sounds, sounds, 'native Ctrl command does not emit selection voices')
})

test('passenger propagation ignores the acquisition class/tribe/range/reservation filters', () => {
  const { world, vehicle, add } = occupiedCrew()
  const brave = add('brave'), other = add('warrior', 'red')
  other.source.flags4 |= 0x880
  other.source.x = (brave.source.x + 10000) & 65535
  world.castingTribes[0].flags |= 128
  selectFollowers(world, 2, brave.source, 'single')
  assert.deepEqual(world.selected, [brave.unit.id, other.unit.id])
  assert.equal(other.source.flags4 & 0x880, 0x880)
  assert.equal(vehicle.team, 'red', 'selecting a friendly passenger does not claim craft ownership')
})

test('empty recipient and enemy-only crews do not select or alter orders', () => {
  const { world, vehicle, add } = occupiedCrew()
  const other = add('brave', 'red')
  other.source.selectionFlags = 128
  const before = structuredClone(world)
  for (const model of [0, 2, 3, 7]) for (const mode of ['single', 'five', 'all']) {
    selectFollowers(world, model, vehicle, mode)
    assert.deepEqual(world.selected, [])
  }
  assert.deepEqual(world.units, before.units)
  assert.deepEqual(world.buildingOrders, before.buildingOrders)
  assert.equal(other.source.selectionFlags & 128, 128, 'an unrelated enemy owner is untouched')
})

test('persistent focus uses the occupied seat and does not change selection or ownership', async () => {
  const { focusHudPerson } = await import('../app/hud-selection.ts')
  const { world, vehicle, add } = occupiedCrew(1, true)
  const brave = add('brave'), warrior = add('warrior'), before = structuredClone(world)
  const people = hudPeople(world)
  assert.equal(focusHudPerson(people, 2, vehicle, 0), brave.unit.id)
  assert.equal(focusHudPerson(people, 3, vehicle, 0), warrior.unit.id)
  assert.deepEqual(world, before)
})

test('unload and checkpoint restoration retain persistent crew selection semantics', async () => {
  const { migrateCheckpoint } = await import('../app/game-store.ts')
  const { leaveLiveVehicle } = await import('../app/live-vehicles.ts')
  for (const kind of [1, 3]) {
    const { world, vehicle, add } = occupiedCrew(kind, true)
    const brave = add('brave'), warrior = add('warrior')
    const restored = migrateCheckpoint(structuredClone(world))
    selectFollowers(restored, 2, vehicle, 'single')
    assert.deepEqual(restored.selected, [brave.unit.id, warrior.unit.id])
    leaveLiveVehicle(world, vehicle, warrior.source, vehicle)
    selectFollowers(world, 2, vehicle, 'single')
    assert.deepEqual(world.selected, [brave.unit.id])
  }
})

test('actual Page pointer/keyboard handlers reach Scene crew selection once and focus its seat', async () => {
  const { loadSceneFixture } = await import('./support/bloodlust-scene.mjs')
  const { pageSource, pageNode, evaluatePage, nearbyEvent } = await import('./support/follower-nearby-page.mjs')
  const { default: ts } = await import('typescript')
  await loadSceneFixture()
  const { GameScene } = await import('../app/scene.ts')
  for (const kind of [1, 3]) for (const input of ['pointer', 'ctrl', 'shift', 'keyboard', 'shaman-ctrl']) {
    const { world, vehicle, add } = occupiedCrew(kind, true)
    const first = add(input === 'shaman-ctrl' ? 'shaman' : 'brave'), second = add('warrior')
    world.manaWorld.gameFlags &= ~32
    world.inputMask = 0
    let changes = 0
    const focused = [], panels = []
    const scene = Object.assign(Object.create(GameScene.prototype), {
      world, cameraPosition: { x: vehicle.x, y: vehicle.y },
      overviewActive: false, overviewStage: null,
      hudFocus: Array(9).fill(0), hudTaskFocus: Array(54).fill(0),
      focus: (...args) => focused.push(args), objectPanels: { open: id => panels.push(id) },
      onChange: () => changes++,
    })
    const followerPress = { current: null }
    const makeControl = evaluatePage(pageNode(node => ts.isFunctionDeclaration(node) && node.name?.text === 'followerControl').getText(pageSource), {
      engine: { current: scene }, followerPress,
    })
    const control = makeControl(input === 'shaman-ctrl' ? 7 : 2)
    const event = nearbyEvent({
      ctrlKey: input === 'ctrl' || input === 'shaman-ctrl',
      shiftKey: input === 'shift', detail: input === 'keyboard' ? 0 : 1,
    })
    if (input !== 'keyboard') {
      control.onPointerDown(event)
      if (event.ctrlKey) control.onContextMenu(event)
      control.onPointerUp(event)
    }
    control.onClick(event)
    assert.deepEqual(world.selected, [first.unit.id, second.unit.id], `${kind}/${input}`)
    assert.equal(changes, 1, 'Ctrl pointer-up and click do not dispatch twice')
    const before = structuredClone(world)
    control.onContextMenu(nearbyEvent({ button: 2 }))
    assert.equal(panels.at(-1), first.unit.id)
    assert.deepEqual(focused.at(-1)[0], browserPosition(first.source))
    assert.deepEqual(world.units, before.units)
    assert.deepEqual(world.selected, before.selected)
  }
})
