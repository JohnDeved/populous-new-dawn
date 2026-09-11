import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, addBuilding, addUnit, command, tick } from '../app/model.ts'
import { stepLiveTraining } from '../app/live-building-entry.ts'
import { advanceGame } from '../app/game-clock.ts'
import captures from './fixtures/building-entry-orders.json' with { type: 'json' }
import manifest from '../decomp/exports.json' with { type: 'json' }
import { currentPersonOrder, prepareBuildingEntryOrder } from '../app/person-orders.ts'

function scenario(kind = 'camp', count = 3, angle = 0) {
  const w = createWorld()
  w.units = []
  w.buildings = []
  w.shrines = []
  w.trees = []
  w.terrain.fill(3)
  w.terrainVersion++
  w.manaWorld.gameFlags = 32
  const b = addBuilding(w, 'blue', kind, { x: 4, z: 24 }, true, { angle })
  const people = Array.from({ length: count }, (_, i) =>
    addUnit(w, 'blue', 'brave', { x: -25 + i * 0.5, z: 8 })
  )
  w.selected = people.map(u => u.id)
  return { w, b, people }
}
const person = u => u.native ?? u.entry?.person
const turn = (w, n = 1) => {
  for (let i = 0; i < n; i++) tick(w, 1 / 12)
}
function until(w, condition, limit = 600) {
  for (let i = 0; i < limit && !condition(); i++) turn(w)
  assert.ok(condition())
}
function issue(w, b) {
  command(w, { x: -4, z: 8 }, { ctrlKey: true })
  command(w, b, { ctrlKey: true })
  command(w, { x: 20, z: 8 })
}
function fund(w, b) {
  w.manaWorld.gameFlags = 0
  b.timer = 65535
  stepLiveTraining(w, b)
  w.manaWorld.gameFlags = 32
}

test('shared ground → training → destination queues retain identities until conversion and inherit the original tail', () => {
  for (let direction = 0; direction < 4; direction++) {
    const { w, b, people } = scenario('camp', 3, (direction * Math.PI) / 2)
    issue(w, b)
    const states = people.map(person),
      ids = states[0].commands.slice(),
      tail = w.buildingOrders.records[ids[2]]
    assert.deepEqual(
      ids.filter(Boolean).map(id => w.buildingOrders.records[id].model),
      [3, 8, 3]
    )
    assert.ok(
      people.every(u => u.work === null),
      'the future building must not preempt the first waypoint'
    )
    turn(w, 20)
    assert.ok(people.every(u => u.x < 0 && u.z < 10))
    until(w, () => people.every(u => u.inside === b.id && person(u).substate === 13))
    assert.ok(
      people.every((u, i) => person(u) === states[i]),
      'entry must not replace the native person'
    )
    assert.equal(w.buildingOrders.records[ids[0]].references, 0)
    assert.equal(tail.references, 3)
    assert.equal(w.buildingOrders.active, 2)
    fund(w, b)
    const warriors = w.units.filter(u => u.hp > 0 && u.kind === 'warrior')
    assert.equal(warriors.length, 3)
    assert.ok(warriors.every(u => currentPersonOrder(w.buildingOrders, person(u)) === tail))
    assert.ok(
      warriors.every(u => person(u).flags2 & 16),
      'initialize at the first person visit'
    )
    assert.equal(tail.references, 3)
    assert.equal(w.buildingOrders.active, 1)
    until(w, () => w.buildingOrders.active === 0)
    assert.ok(warriors.every(u => u.x > 18 && u.z < 10))
    until(w, () => w.motionRoutes.active === 0)
  }
})

test('a waypoint added while trainees are inside preserves occupancy; ordinary hut admission consumes the complete queue', () => {
  const { w, b, people } = scenario()
  command(w, b, { ctrlKey: true })
  until(w, () => people.every(u => u.inside === b.id && person(u).substate === 13))
  const occupants = b.admission.occupants.slice()
  command(w, { x: 20, z: 8 })
  assert.deepEqual(b.admission.occupants, occupants)
  assert.ok(people.every(u => u.inside === b.id))
  fund(w, b)
  until(w, () => w.buildingOrders.active === 0)
  assert.ok(w.units.filter(u => u.hp > 0).every(u => u.x > 18 && u.z < 10))
  for (const kind of ['hut', 'tower']) {
    const { w, b, people } = scenario(kind, 1)
    issue(w, b)
    until(w, () => people[0].inside === b.id)
    assert.equal(w.buildingOrders.active, 0, 'ordinary occupancy clears all eight slots')
    assert.ok(people[0].x < 10, 'a trailing waypoint must not eject an admitted occupant')
  }
})

test('unavailable or cancelled buildings advance to the next order; replacement and death release shared references', () => {
  for (const mode of ['removed', 'cancelled', 'dead', 'replace']) {
    const { w, b, people } = scenario('camp', 1)
    issue(w, b)
    until(w, () => !!people[0].entry)
    const u = people[0],
      p = person(u),
      tail = p.commands[2]
    if (mode === 'removed') w.buildings = []
    if (mode === 'cancelled') currentPersonOrder(w.buildingOrders, p).flags |= 1
    if (mode === 'dead') u.hp = 0
    if (mode === 'replace') command(w, { x: -20, z: 8 })
    turn(w)
    if (mode === 'removed' || mode === 'cancelled') {
      assert.equal(u.native, p)
      assert.equal(p.commandCursor, 2)
      assert.equal(w.buildingOrders.records[tail].references, 1)
      until(w, () => w.buildingOrders.active === 0)
      assert.ok(u.x > 18)
    } else {
      assert.equal(w.buildingOrders.records[tail].references, 0)
      until(w, () => w.buildingOrders.active === 0)
    }
  }
})

test('mixed movement, training, inherited orders, RNG and footprints match from 5 to 240 Hz and irregular frames', () => {
  const run = schedule => {
    const { w, b } = scenario()
    issue(w, b)
    const history = [],
      clock = {
        animationTime: 0,
        animationFrame: 0,
        afterTurn: () => {
          if (w.turn === 240) fund(w, b)
          history.push(
            w.units
              .filter(u => u.hp > 0)
              .map(u => {
                const p = person(u)
                return [
                  u.id,
                  u.kind,
                  u.x,
                  u.z,
                  u.inside,
                  p?.state,
                  p?.commandCursor,
                  p?.object,
                  p?.frame,
                ]
              })
          )
        },
      }
    let elapsed = 0,
      index = 0
    while (elapsed < 50 - 1e-9) {
      const dt = Math.min(schedule[index++ % schedule.length], 50 - elapsed)
      advanceGame(w, clock, dt)
      elapsed += dt
    }
    assert.equal(w.buildingOrders.active, 0)
    assert.equal(w.motionRoutes.active, 0)
    assert.ok(w.units.every(u => u.kind === 'warrior' && u.x > 18))
    return {
      history,
      random: w.randomState,
      footprints: w.footprints.cursor,
      orders: w.buildingOrders,
    }
  }
  const expected = run([1 / 60])
  for (const schedule of [
    [1 / 5],
    [1 / 30],
    [1 / 120],
    [1 / 144],
    [1 / 240],
    [0.004, 0.13, 0.009, 0.034],
  ])
    assert.deepEqual(run(schedule), expected)
})

test('building order preparation matches complete original CPU calls', () => {
  assert.equal(captures.executableSha256, manifest.executableSha256)
  for (const c of captures.cases) {
    const order = { ...c.before }
    prepareBuildingEntryOrder(order, c.a, c.b, c.flags, c.dismantling)
    assert.deepEqual(order, c.expected)
  }
})
