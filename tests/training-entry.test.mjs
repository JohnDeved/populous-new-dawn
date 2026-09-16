import assert from 'node:assert/strict'
import test from 'node:test'
import captures from './fixtures/movement-order.json' with { type: 'json' }
import manifest from '../decomp/exports.json' with { type: 'json' }
import { createWorld, addBuilding, addUnit, campaignPersonCount, command, disguiseSelectedSpies, entrance, tick, housing, manaRate, unitAnimationSource, nativePosition, buildingPose } from '../app/model.ts'
import { nativePersonModel } from '../app/live-combat.ts'
import { createLivePerson } from '../app/live-people.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { buildingQueuePoint } from '../app/building-shapes.ts'
import { prepareMovementOrder } from '../app/person-orders.ts'
import { advanceGame } from '../app/game-clock.ts'
import sprites from '../app/original-units.json' with { type: 'json' }
import rules from '../app/original-rules.json' with { type: 'json' }
import { unitSpeed } from '../app/world-rules.ts'
import { nativeUnitDraw } from '../app/unit-kinds.ts'

function schoolScenario(kind, count, direction) {
  const w = createWorld()
  w.manaWorld.gameFlags = 32 // Native building-development gate: observe an unfunded queue.
  w.units = w.units.filter(u => u.kind === 'shaman')
  const b = addBuilding(w, 'blue', kind, { x: -2, z: 32 }, true, { angle: direction * Math.PI / 2 })
  const people = Array.from({ length: count }, (_, i) => addUnit(w, 'blue', 'brave', { x: 7 + i * .4, z: 33 }))
  w.selected = people.map(u => u.id)
  command(w, b)
  return { w, b, people }
}
const scenario = (direction = 0) => schoolScenario('camp', 8, direction)
function until(w, condition, limit = 300) {
  for (let i = 0; i < limit && !condition(); i++) tick(w, 1 / 12)
  assert.ok(condition(), 'training must reach the expected state')
}
function queue(w, b) {
  const result = []
  for (let id = b.admission.queueHead; id;) {
    assert.ok(!result.includes(id), 'queue must be acyclic')
    result.push(id)
    id = w.units.find(u => u.id === id).entry.person.reservationNext
  }
  return result
}

test('training exit orders match original coastal correction and building precedence', () => {
  assert.equal(captures.executableSha256, manifest.executableSha256)
  const land = { categories: new Uint8Array(16384), flags: new Uint32Array(16384), buildingIds: new Uint16Array(16384) }
  for (const c of captures.cases) {
    const p = c.point, i = (p.y >> 9) * 128 + (p.x >> 9), order = { ...c.before }
    land.categories[i] = c.category; land.flags[i] = c.building ? 512 : 0; land.buildingIds[i] = 100
    prepareMovementOrder(order, p, c.flags, land, id => { assert.equal(id, 100); return c.outside })
    assert.deepEqual(order, c.expected)
  }
})

test('training admits five visible residents and places overflow on native rotated queue sockets', () => {
  for (let direction = 0; direction < 4; direction++) {
    const { w, b, people } = scenario(direction)
    assert.equal(housing(b), 5)
    until(w, () => people.filter(u => u.inside === b.id).length === 5 && people.every(u => u.entry?.person.speed === 0))
    assert.equal(b.admission.inside, 5)
    assert.equal(w.stats.trained, 0, 'native development gate stops conversion')
    assert.equal(w.buildingOrders.active, 8, 'training retains each active command')
    assert.equal(queue(w, b).length, 3)
    for (const u of people) {
      const p = unitAnimationSource(u)
      assert.equal(p, u.entry.person)
      assert.equal(p.renderFlags & 16, 0, 'mode 3 does not hide a trainee')
      if (u.inside === b.id) { assert.equal(p.substate, 13); assert.ok(p.flags2 & 0x800000) }
      else {
        const expected = buildingQueuePoint(buildingPose(b), p.commandPhase), actual = nativePosition(w, u)
        assert.ok(Math.abs(((actual.x - expected.x) << 16) >> 16) < 12)
        assert.ok(Math.abs(((actual.y - expected.y) << 16) >> 16) < 12)
      }
    }
  }
})

test('queue cancellation retains successors and occupant departure reuses the first empty slot', () => {
  const { w, b, people } = scenario(2)
  until(w, () => b.admission?.inside === 5 && people.every(u => !u.entry?.person.speed))
  const before = queue(w, b), leaving = w.units.find(u => u.id === before[1])
  w.selected = [leaving.id]; command(w, { x: 9, z: 30 })
  assert.deepEqual(queue(w, b), [before[0], before[2]])
  assert.equal(leaving.entry, undefined)
  assert.equal(w.buildingOrders.active, 8) // Seven trainees and the new movement order.
  assert.equal(leaving.native.commandStatus, 3)
  const original = b.admission.occupants.slice(), occupant = w.units.find(u => u.id === original[1])
  w.selected = [occupant.id]; command(w, { x: 8, z: 30 })
  assert.equal(b.admission.occupants[1], 0)
  until(w, () => b.admission.inside === 5)
  assert.equal(b.admission.occupants[1], before[0])
  for (const i of [0, 2, 3, 4, 5]) assert.equal(b.admission.occupants[i], original[i])
})

test('funded training replaces a complete batch, releases references and walks warriors out', () => {
  const { w, b, people } = scenario(2)
  until(w, () => b.admission?.inside === 5 && people.every(u => !u.entry?.person.speed))
  const sources = b.admission.occupants.filter(Boolean), queued = queue(w, b)
  const effectIds = w.effects.map(f => f.id)
  w.manaWorld.gameFlags = 0; b.timer = 65535
  tick(w, 1 / 12)
  const warriors = w.units.filter(u => u.team === 'blue' && u.kind === 'warrior')
  assert.equal(warriors.length, 5)
  assert.equal(w.stats.trained, 5)
  assert.ok(sources.every(id => !w.units.some(u => u.id === id)), 'conversion replaces identities')
  assert.deepEqual(queue(w, b), queued)
  assert.equal(w.buildingOrders.active, 4, 'three trainees and one shared native exit order')
  assert.equal(b.timer, 0)
  assert.ok(warriors.every(u => u.inside === null && u.path.length && !u.entry))
  assert.ok(w.effects.every(f => effectIds.includes(f.id) || f.kind !== 'birth' || Math.hypot(f.x - b.x, f.z - b.z) > 2), 'conversion must not invent a hut-birth flash')
  const positions = warriors.map(u => [u.x, u.z])
  until(w, () => warriors.every(u => u.path.length === 0))
  assert.equal(w.buildingOrders.active, 3, 'arrival releases the shared exit order')
  assert.ok(warriors.every((u, i) => Math.hypot(u.x - positions[i][0], u.z - positions[i][1]) > 1))
  until(w, () => queued.every(id => w.units.find(u => u.id === id)?.inside === b.id))
})

test('a funded Temple trains a native model-4 preacher and sends it outside', () => {
  const { w, b, people } = schoolScenario('temple', 1, 1)
  until(w, () => people[0].inside === b.id && !people[0].entry?.person.speed)
  w.manaWorld.gameFlags = 0
  b.timer = 65535
  until(w, () => w.units.some(u => u.team === 'blue' && u.kind === 'preacher'), 60)
  const preacher = w.units.find(u => u.team === 'blue' && u.kind === 'preacher')
  assert.ok(preacher)
  assert.equal(w.stats.trained, 1)
  assert.equal(preacher.hp, 55)
  assert.equal(nativePersonModel(preacher), 4)
  assert.equal(campaignPersonCount(w, 0, 4), 1)
  assert.ok(manaRate(w) > 0)
  assert.equal(unitAnimationSource(preacher)?.model, 4)
  assert.equal(preacher.inside, null)
  assert.ok(preacher.path.length)
  assert.equal(sprites.animations['blue-preacher'].preachStart[0].source, 160)
  assert.equal(sprites.animations['blue-preacher'].preach[0].source, 168)
})

test('a funded Spy Training Hut trains an original model-5 Spy and sends it outside', () => {
  const { w, b, people } = schoolScenario('spyHut', 1, 3)
  until(w, () => people[0].inside === b.id && !people[0].entry?.person.speed)
  w.manaWorld.gameFlags = 0
  b.timer = 65535
  until(w, () => w.units.some(u => u.team === 'blue' && u.kind === 'spy'), 60)
  const spy = w.units.find(u => u.team === 'blue' && u.kind === 'spy')
  assert.ok(spy)
  assert.equal(w.stats.trained, 1)
  assert.equal(spy.hp, 30)
  assert.equal(unitSpeed(spy), 66)
  assert.equal(nativePersonModel(spy), 5)
  assert.equal(campaignPersonCount(w, 0, 5), 1)
  assert.equal(unitAnimationSource(spy)?.model, 5)
  assert.equal(nativeUnitDraw(spy.kind), 17)
  assert.equal(nativeUnitDraw('firewarrior'), 18)
  assert.equal(spy.inside, null)
  assert.ok(spy.path.length)
  assert.equal(sprites.animations['blue-spy'].walk[0].source, 40)
  assert.deepEqual(rules.animationDescriptors[17], {
    hold: 0,
    step: 0,
    mode: 2,
    person: 2,
    variant: 3,
    palette: 240,
    reset: 0,
    flags: 0,
  })
  until(w, () => spy.path.length === 0)
  w.selected = [spy.id]
  assert.equal(disguiseSelectedSpies(w, 1), true)
  tick(w, 1 / 12)
  assert.equal(spy.native.disguise, 0x7f, 'command 16 starts the native 63-turn disguise')
  for (let turn = 0; turn < 63; turn++) tick(w, 1 / 12)
  assert.equal(spy.native.disguise, 0x40, 'the completed Spy appears as the chosen tribe')

  const target = addBuilding(w, 'red', 'hut', { x: spy.x + 7, z: spy.z }, true),
    door = entrance(w, target),
    detector = addUnit(w, 'red', 'brave', { x: door.x + 0.5, z: door.z })
  detector.native = createLivePerson(w, detector)
  detector.native.state = 14 // Keep the detector present without starting unrelated combat.
  w.selected = [spy.id]
  assert.equal(command(w, target), true)
  assert.equal(currentPersonOrder(w.buildingOrders, spy.native)?.model, 15)
  until(w, () => !!target.burn, 600)
  assert.equal(target.damageState.state, 4)
  assert.equal(target.damageState.attacker, 0)
  assert.equal(spy.native.disguise, 0, 'nearby target-tribe detection reveals the saboteur')
  const checkpoint = structuredClone(w)
  assert.equal(currentPersonOrder(checkpoint.buildingOrders, checkpoint.units.find(u => u.id === spy.id).native)?.model, 15)
  assert.equal(checkpoint.buildings.find(b => b.id === target.id).burn.remaining, target.burn.remaining)
})

test('queue movement, admission, conversion and shared references are independent of render rate', () => {
  const run = hz => {
    const { w, b } = scenario(2), clock = { animationTime: 0, animationFrame: 0 }
    w.manaWorld.gameFlags = 0
    for (let i = 0; i < hz * 12; i++) advanceGame(w, clock, 1 / hz)
    return { turn: w.turn, random: w.randomState, building: b.admission, orders: w.buildingOrders,
      people: w.units.map(u => ({ id: u.id, kind: u.kind, x: u.x, z: u.z, inside: u.inside, entry: u.entry })) }
  }
  const expected = run(144)
  for (const hz of [5, 30, 60, 120, 240]) assert.deepEqual(run(hz), expected)
})

test('already-trained warriors accept training orders and yield queue priority to new braves', () => {
  const { w, b, people } = scenario(2)
  until(w, () => b.admission?.inside === 5 && people.every(u => !u.entry?.person.speed))
  const warrior = addUnit(w, 'blue', 'warrior', { x: 7, z: 33 })
  w.selected = [warrior.id]; command(w, b)
  assert.equal(warrior.work, b.id)
  until(w, () => warrior.entry?.person.substate === 3 && !warrior.entry.person.speed)
  const brave = addUnit(w, 'blue', 'brave', { x: 8, z: 33 })
  w.selected = [brave.id]; command(w, b)
  until(w, () => { const q = queue(w, b); return q.includes(brave.id) && q.indexOf(brave.id) < q.indexOf(warrior.id) })
  until(w, () => !warrior.entry.person.speed && !brave.entry.person.speed)
  assert.ok(brave.entry.person.commandPhase < warrior.entry.person.commandPhase)
})
