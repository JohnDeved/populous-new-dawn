import assert from 'node:assert/strict'
import test from 'node:test'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'
import { makeBuilderAnimationScene } from './support/builder-animation-scene.mjs'
import { createStartedWorld } from './level-start-fixture.mjs'
import { setSelection } from '../app/selection-runtime.ts'
import { currentPersonOrder } from '../app/person-orders.ts'

let acquired
async function ordinaryMixedGuard() {
  const api = await loadSceneFixture()
  if (!acquired) {
    const world = createStartedWorld(10), clock = { animationTime: 0, animationFrame: 0 },
      hut = world.buildings.find(b => b.id === 98)
    assert.equal(hut.kind, 'firewarriorHut')
    setSelection(world, [121])
    assert.equal(api.command(world, hut), true)
    assert.equal(world.units.find(u => u.id === 121).entry.person.commandStatus, 8)
    let follower
    for (let turn = 0; turn < 1000 && !follower; turn++) {
      api.advanceGame(world, clock, 1 / 12)
      follower = world.units.find(u => u.team === 'blue' && u.kind === 'firewarrior' && u.inside === null && [17, 19].includes(u.native?.state))
    }
    assert.ok(follower, 'authored Brave trains with ordinary mana before the guard check')
    setSelection(world, [follower.id]); api.guardShaman(world)
    api.advanceGame(world, clock, 1 / 12)
    assert.equal(follower.native.commandStatus, 30)
    setSelection(world, [120])
    assert.equal(api.command(world, hut), true)
    const busy = world.units.find(u => u.id === 120)
    assert.equal(busy.work, hut.id)
    assert.equal(currentPersonOrder(world.buildingOrders, busy.entry.person).model, 8)
    setSelection(world, [busy.id, follower.id])
    acquired = { world, clock, id: follower.id, busyId: busy.id }
  }
  return { api, ...structuredClone(acquired) }
}

const phase = p => [p.object, p.draw, p.f1, p.f2, p.stamp]

test('actual Scene keeps native frame ownership after public training-busy G and deselection', async () => {
  const { api, world, clock, id, busyId } = await ordinaryMixedGuard(),
    follower = world.units.find(u => u.id === id), person = follower.native,
    busy = world.units.find(u => u.id === busyId), oldTraining = currentPersonOrder(world.buildingOrders, busy.entry.person),
    before = phase(person), fixture = await makeBuilderAnimationScene(world, { clock })
  api.guardShaman(world)
  assert.equal(follower.native, person)
  assert.deepEqual(phase(person), before, 'G itself does not replace the supported owner or run its setter')
  assert.equal(person.guardInputPending, true)
  assert.equal(follower.guard, false)
  assert.equal(busy.guard, true)
  assert.equal(busy.entry, undefined)
  assert.equal(oldTraining.references, 0)
  const render = () => {
    const snapshot = phase(person)
    fixture.render()
    const group = fixture.scene.unitMeshes.get(id), call = fixture.personCalls.find(args => args[0] === group)
    assert.ok(call)
    assert.equal(call[3], 0, 'actual Scene never substitutes state age for this native owner')
    assert.equal(call[5], person.f2)
    assert.equal(group.userData.draw, 18)
    assert.deepEqual(phase(person), snapshot, 'render does not advance native phase')
    return group.userData.frame
  }
  render()
  fixture.advance(1 / 24); render()
  fixture.advance(1 / 24); render()
  assert.equal(person.commandStatus, 30)
  for (let turn = 0; turn < 8; turn++) {
    const prior = phase(person)
    fixture.advance(1 / 24)
    const frame = render()
    assert.deepEqual(phase(person), prior, 'same-turn presentation cannot age native Guard')
    fixture.render()
    assert.equal(fixture.scene.unitMeshes.get(id).userData.frame, frame)
    fixture.advance(1 / 24); render()
  }
  const adopted = phase(person)
  setSelection(world, [])
  render()
  assert.deepEqual(phase(person), adopted, 'deselection does not reset native phase')
  world.paused = true
  fixture.advance(0.5); render()
  assert.deepEqual(phase(person), adopted)
})

test('mixed G pending checkpoint and refresh schedules retain native order/phase', async () => {
  const { api, world: initial, clock: initialClock, id } = await ordinaryMixedGuard()
  api.guardShaman(initial)
  const run = schedule => {
    const world = structuredClone(initial), clock = structuredClone(initialClock),
      follower = world.units.find(u => u.id === id)
    api.migrateCheckpoint(world)
    assert.equal(follower.native.guardInputPending, true)
    let elapsed = 0, index = 0
    while (elapsed < 1 - 1e-9) {
      const dt = Math.min(schedule[index++ % schedule.length], 1 - elapsed)
      api.advanceGame(world, clock, dt); elapsed += dt
    }
    assert.equal(follower.native.commandStatus, 30)
    assert.equal(follower.guard, false)
    return { person: follower.native, orders: world.buildingOrders, turn: world.turn, random: world.randomState, guards: world.manaTribes[0].shamanGuards, animationFrame: clock.animationFrame }
  }
  const expected = run([1 / 60])
  for (const schedule of [[1 / 30], [1 / 120], [1 / 144], [.007, .021, .04]]) {
    const actual = run(schedule)
    assert.deepEqual(actual, expected)
  }
})
