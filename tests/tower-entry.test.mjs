import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, addBuilding, addUnit, command, tick, buildingPose } from '../app/model.ts'
import { buildingInsidePoint, buildingSocketPoint } from '../app/building-shapes.ts'
import { unitPosition } from '../app/unit-motion.ts'
import { advanceGame } from '../app/game-clock.ts'
import { objectsInCell } from '../app/object-cells.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { createLivePerson } from '../app/live-people.ts'

function until(w, ready, limit = 300) {
  for (let i = 0; i < limit && !ready(); i++) tick(w, 1 / 12)
  assert.ok(ready())
}
function scenario(team = 'blue', direction = 2, kind = 'brave', count = 1) {
  const w = createWorld()
  w.inputMask = 0
  w.manaWorld.gameFlags = 32
  w.units = w.units.filter(u => u.kind === 'shaman')
  const b = addBuilding(w, team, 'tower', { x: -2, z: 32 }, true, {
    angle: (direction * Math.PI) / 2,
  })
  const people = Array.from({ length: count }, (_, i) =>
    addUnit(w, team, kind, { x: 7 + i * 0.25, z: 33 })
  )
  if (team === 'blue') {
    w.selected = people.map(u => u.id)
    command(w, b)
  } else for (const u of people) u.work = b.id
  return { w, b, people }
}

test('tower admission uses rotated tribe sockets, ground membership and original one-shot occupant pose', () => {
  for (const team of ['blue', 'red'])
    for (let direction = 0; direction < 4; direction++)
      for (const kind of ['brave', 'warrior', 'shaman']) {
        const {
          w,
          b,
          people: [u],
        } = scenario(team, direction, kind)
        try {
          until(w, () => u.inside === b.id)
        } catch (e) {
          throw new Error(
            `${team}/${direction}/${kind}: ${JSON.stringify({ work: u.work, inside: u.inside, hp: u.hp, entry: u.entry?.person })}`,
            { cause: e }
          )
        }
        const p = u.entry.person,
          point = buildingSocketPoint(buildingPose(b), 1)
        assert.equal(p.state, 21)
        assert.equal(p.supportHeight, point.heightOffset)
        assert.equal(p.x, point.x)
        assert.equal(p.y, point.y)
        assert.equal(p.renderFlags & 16, 0, 'tower occupants stay visible')
        assert.equal(p.flags2 & 0x20000, 0x20000, 'occupants keep their ground-cell membership')
        const cell = ((p.x >>> 8) & 254) | (p.y & 0xfe00)
        assert.ok([...objectsInCell(w.objectCells, cell)].some(o => o.id === u.id))
        assert.equal(unitPosition(w, u).y, (p.h + point.heightOffset) / 128)
        assert.equal(w.buildingOrders.active, 0)
        assert.equal(b.admission.inside, 1)
        const timer = p.timer
        assert.ok(timer > 0)
        for (let i = 0; i < timer; i++) tick(w, 1 / 12)
        assert.equal(p.timer, 0)
        assert.ok(p.renderFlags & 2)
        const frame = [p.f1, p.f2]
        for (let i = 0; i < 8; i++) advanceGame(w, { animationTime: 0, animationFrame: 0 }, 1 / 12)
        assert.deepEqual([p.f1, p.f2], frame, 'original rest pose remains frozen')
      }
})

test('a tower admits one follower and movement orders preserve elevation until physics resumes', () => {
  const { w, b, people } = scenario('blue', 2, 'brave', 2)
  until(w, () => people.some(u => u.inside === b.id))
  for (let i = 0; i < 80; i++) tick(w, 1 / 12)
  assert.equal(people.filter(u => u.inside === b.id).length, 1)
  const u = people.find(u => u.inside === b.id),
    before = [u.x, u.z],
    offset = u.entry.person.supportHeight
  w.selected = [u.id]
  command(w, { x: 9, z: 37 })
  assert.equal(u.inside, null)
  assert.deepEqual([u.x, u.z], before)
  assert.equal(u.supportHeight, offset)
  tick(w, 1 / 12)
  assert.equal(u.supportHeight, undefined)
  until(w, () => !u.path.length)
  assert.equal(b.admission.inside, 0)
  assert.ok(Math.hypot(u.x - before[0], u.z - before[1]) > 2)
})

test('tower entry and held animation are deterministic at 5–240 Hz', () => {
  let baseline
  for (const hz of [5, 30, 60, 144, 240]) {
    const { w, b, people } = scenario(),
      clock = { animationTime: 0, animationFrame: 0 }
    for (let i = 0; i < hz * 10; i++) advanceGame(w, clock, 1 / hz)
    const state = {
      turn: w.turn,
      rng: w.randomState,
      admission: b.admission,
      people: people.map(u => ({
        x: u.x,
        z: u.z,
        inside: u.inside,
        p: u.entry?.person,
        position: unitPosition(w, u),
      })),
    }
    if (baseline) assert.deepEqual(state, baseline, `${hz} Hz`)
    else baseline = state
  }
})

test('destroying an occupied tower releases its native record and display height', () => {
  const {
    w,
    b,
    people: [u],
  } = scenario()
  until(w, () => u.inside === b.id)
  b.hp = 0
  tick(w, 1 / 12)
  assert.equal(u.inside, null)
  assert.equal(u.entry, undefined)
  assert.equal(u.supportHeight, undefined)
  assert.ok(u.hp > 0)
  assert.equal(w.buildingOrders.active, 0)
})

test('tower preachers hand occupancy to command 31 and cleanly leave or die', () => {
  const entered = scenario('blue', 2, 'preacher'),
    preacher = entered.people[0]
  until(entered.w, () => preacher.inside === entered.b.id && preacher.native)
  const p = preacher.native,
    inside = buildingInsidePoint(buildingPose(entered.b))
  assert.equal(preacher.entry, undefined)
  assert.equal(p.state, 10)
  assert.deepEqual(currentPersonOrder(entered.w.buildingOrders, p), {
    model: 31,
    flags: 0,
    references: 1,
    object: 0,
    a: inside.x,
    b: inside.y,
  })
  tick(entered.w, 1 / 12)
  assert.equal(p.commandAux, 5)
  assert.equal(p.workTarget, entered.b.id)
  entered.w.selected = [preacher.id]
  command(entered.w, { x: 9, z: 37 })
  assert.equal(preacher.inside, null)
  assert.equal(p.building, null)
  assert.equal(entered.b.admission.inside, 0)
  assert.equal(currentPersonOrder(entered.w.buildingOrders, p)?.model, 3)

  const destroyed = scenario('blue', 2, 'preacher'),
    guard = destroyed.people[0]
  until(destroyed.w, () => guard.inside === destroyed.b.id && guard.native)
  tick(destroyed.w, 1 / 12)
  const listener = addUnit(destroyed.w, 'red', 'brave', { x: guard.x, z: guard.z })
  listener.native = createLivePerson(destroyed.w, listener)
  listener.native.state = 23
  listener.native.workTarget = guard.id
  listener.hp = 0
  destroyed.b.hp = 0
  tick(destroyed.w, 1 / 12)
  assert.equal(guard.inside, null)
  assert.equal(destroyed.b.admission.inside, 0)
  assert.deepEqual(destroyed.b.admission.occupants, [0, 0, 0, 0, 0, 0])
  assert.notEqual(currentPersonOrder(destroyed.w.buildingOrders, guard.native)?.model, 31)
  assert.notEqual(listener.native.state, 23)

  const killed = scenario('blue', 2, 'preacher'),
    victim = killed.people[0]
  until(killed.w, () => victim.inside === killed.b.id && victim.native)
  victim.hp = 0
  tick(killed.w, 1 / 12)
  assert.equal(killed.b.admission.inside, 0)
  assert.deepEqual(killed.b.admission.occupants, [0, 0, 0, 0, 0, 0])
  assert.equal(killed.w.buildingOrders.active, 0)
  assert.ok(!killed.w.units.includes(victim))
})
