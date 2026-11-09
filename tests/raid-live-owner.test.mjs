import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorldState, addUnit } from '../app/world-state.ts'
import { tick, command, setSelection } from '../app/model.ts'
import { createLivePerson, registerLivePerson } from '../app/live-people.ts'
import { nativeCellPoint } from '../app/world-coordinates.ts'
import { withCampaignTribe } from '../app/campaign-runtime.ts'
import { stepComputerTasks } from '../app/computer-runtime.ts'
import { currentPersonOrder } from '../app/person-orders.ts'

test('controlled live raid retains original owners through combat pre-emption and defender damage', () => {
  const w = createWorldState(2),
    ai = w.campaignAIs[3]
  // Only these three real people inhabit this supplied dry arena. No health,
  // damage, combat selection, or death behavior is overridden.
  w.terrain.fill(3)
  w.land.heights.fill(135)
  w.land.categories.fill(0)
  w.land.flags.fill(0)
  w.terrainVersion++
  w.landVersion = w.terrainVersion
  const make = (team, kind, cell) => {
    const u = addUnit(w, team, kind, nativeCellPoint(cell))
    u.native = createLivePerson(w, u)
    registerLivePerson(w, u.native)
    return u
  }
  const members = [make('green', 'warrior', 0x383a), make('green', 'warrior', 0x383c)]
  const defender = make('blue', 'brave', 0x383a)
  const owners = members.map(u => u.native)
  const defenderOwner = defender.native,
    hp = defender.hp
  const aliveOwned = () =>
    members.forEach((u, i) => {
      assert.ok(u.hp > 0, 'every original member remains alive')
      assert.equal(
        w.units.find(v => v.id === u.id),
        u
      )
      assert.equal(
        w.objectCells.objects.get(u.id),
        owners[i],
        'original registered person identity is retained'
      )
      assert.ok(
        [u.native, u.flight, u.fight?.motion, u.entry?.person, u.builder?.person].includes(
          owners[i]
        )
      )
    })
  setSelection(w, [defender.id])
  assert.ok(command(w, members[0]))
  for (let n = 0; !members[0].fight && n < 100; n++) {
    tick(w, 1 / 12)
    aliveOwned()
  }
  assert.ok(members[0].fight, 'ordinary ticks enter actual combat before raid dispatch')
  assert.equal(members[0].fight.motion, owners[0])
  assert.equal(members[0].native, null, 'dispatcher must handle real fight-only ownership')
  assert.equal(defender.hp, hp, 'combat is admitted before its first damage')
  // Supplied phase-15 task, not natural recruitment evidence (covered separately).
  // Its dispatcher must append to the owner acquired by real combat above.
  const task = ai.tasks[0]
  members.forEach((u, i) => {
    owners[i].computerAssignment = 1
  })
  Object.assign(task, {
    flags: 1,
    type: 20,
    phase: 15,
    fallback: 14,
    entity: 65530,
    target: 0x383a,
    origin: 0x383a,
    members: members.map(u => u.id),
    requested: 2,
    retreatPercent: 25,
    damage: 0,
    extra: 20,
  })
  ai.cursor = 0
  withCampaignTribe(w, 3, () => stepComputerTasks(w, 3))
  aliveOwned()
  assert.equal(task.phase, 16)
  const ids = owners.map(p => p.immediateCommand || p.commands[p.commandCursor])
  assert.equal(new Set(ids).size, 1, 'both originals share the actual attack order')
  for (const p of owners) {
    const order = currentPersonOrder(w.buildingOrders, p)
    assert.equal(order.model, 19)
    assert.equal(order.flags & 1, 0)
    assert.equal(order.a, task.target)
    assert.equal(order.b, 0x0808)
    assert.equal(order.references, members.length)
  }
  for (let n = 0; defender.hp >= hp && n < 200; n++) {
    tick(w, 1 / 12)
    aliveOwned()
    assert.deepEqual(
      task.members,
      members.map(u => u.id)
    )
  }
  assert.ok(defender.hp < hp)
  assert.ok(defender.hp > 0)
  assert.equal(
    w.units.find(u => u.id === defender.id),
    defender
  )
  assert.equal(w.objectCells.objects.get(defender.id), defenderOwner)
  assert.ok(owners.every(p => p.commands.includes(ids[0])))
  assert.equal(w.buildingOrders.records[ids[0]].references, members.length)
  assert.ok(members.some(u => u.id === defender.fight?.opponent))
  assert.equal(task.phase, 16)
  assert.equal(task.fallback, 14)
  assert.ok(task.flags & 1)
})
