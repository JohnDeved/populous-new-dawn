import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { deserialize } from 'node:v8'
import { createHash } from 'node:crypto'
import { advanceGame } from '../app/game-clock.ts'
import { cast, spellTargetError } from '../app/live-command.ts'
import { vehicleSeat } from '../app/vehicle-seats.ts'
import { browserPosition, wrappedDistance } from '../app/world-coordinates.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { withStorage } from './support/profile-storage.mjs'
const linked = (w, p) => {
  assert.equal(w.objectCells.objects.get(p.id), p)
  const cell = ((p.y & 65535) >> 9) * 128 + ((p.x & 65535) >> 9),
    seen = new Set()
  let id = w.objectCells.heads[cell]
  while (id) {
    assert.ok(!seen.has(id))
    seen.add(id)
    id = w.objectCells.objects.get(id).cellNext
  }
  assert.ok(seen.has(p.id), 'Owner linked in actual coordinate cell')
}
const checkpoint = () => {
  const bytes = gunzipSync(
    readFileSync(
      new URL('../references/fixtures/m16-seated-casting/before-cast.v8.gz', import.meta.url)
    )
  )
  assert.equal(
    createHash('sha256').update(bytes).digest('hex'),
    '7585ea4141b940d88e29932e87eaa79e947b20e01a8bc849b15e0586e04ec119'
  )
  return deserialize(bytes)
}
// Historical public campaign input, shipped simulation/animation clock; no actor edits.
test('public seated Tornado finishes casting and permits a second earned cast through Save/Load', async () => {
  await withStorage({}, async ({ freshStore }) => {
    const store = await freshStore()
    store.startMission(16)
    const w = store.getWorld()
    Object.assign(w, migrateCheckpoint(checkpoint()))
    const u = w.units.find(u => u.id === 8286),
      owner = u.native,
      stock = w.shots.tornado,
      target = w.buildings.find(b => b.id === 281)
    assert.equal(w.turn, 26250)
    assert.equal(owner.state, 30)
    assert.equal(owner.vehicle, 8830)
    const priorEffects = new Set(w.effects.map(e => e.id)),
      priorProjectiles = new Set(w.projectiles.map(p => p.id))
    assert.equal(spellTargetError(w, 'tornado', target), null)
    assert.ok(cast(w, 'tornado', target))
    const firstProjectiles = w.projectiles.filter(p => !priorProjectiles.has(p.id))
    assert.equal(firstProjectiles.length, 1)
    assert.equal(firstProjectiles[0].caster, u.id)
    assert.equal(owner.state, 22)
    assert.equal(owner.timer, 10)
    assert.equal(w.shots.tornado, stock - 1)
    assert.ok(await store.saveCheckpoint())
    assert.ok(store.loadCheckpoint())
    const twin = store.getWorld(),
      clocks = [w, twin].map(() => ({ animationTime: 0, animationFrame: 0 }))
    const newEffects = new Set()
    const initialCounter = owner.counter
    for (let visit = 1; visit <= 12; visit++) {
      for (const [i, world] of [w, twin].entries()) advanceGame(world, clocks[i], 1 / 12)
      assert.deepEqual(w, twin)
      assert.equal(
        owner.counter,
        (initialCounter + visit) & 255,
        'One native preparation visit per seated cast turn'
      )
      assert.equal(u.native, owner)
      assert.equal(owner.vehicle, 8830)
      linked(w, owner)
      const v = w.vehicles.find(v => v.id === 8830),
        slot = v.passengers.indexOf(u.id)
      assert.ok(slot >= 0)
      const seat = vehicleSeat(v, slot)
      assert.deepEqual(
        { x: owner.x & 65535, y: owner.y & 65535, h: owner.h },
        { x: seat.x & 65535, y: seat.y & 65535, h: seat.h }
      )
      assert.equal(wrappedDistance(u, browserPosition(owner)), 0)
      if (visit < 6) assert.ok(u.casting)
      else assert.equal(u.casting, null)
      if (visit < 10) {
        assert.equal(owner.state, 22)
        assert.equal(owner.timer, 10 - visit)
        assert.equal(spellTargetError(w, 'tornado', target)?.code, -1)
      }
      for (const e of w.effects) if (e.tornado && !priorEffects.has(e.id)) newEffects.add(e.id)
    }
    assert.equal(newEffects.size, 1, 'First admitted Tornado creates one new effect')
    const firstEffect = [...newEffects][0]
    assert.notEqual(owner.state, 22)
    const second = w.buildings.find(b => b.id === 282)
    assert.equal(spellTargetError(w, 'tornado', second), null)
    for (const world of [w, twin]) assert.ok(cast(world, 'tornado', second))
    assert.deepEqual(w, twin)
    assert.equal(w.shots.tornado, stock - 2)
    const secondProjectile = w.projectiles.filter(p => p.caster === u.id)
    assert.equal(secondProjectile.length, 1)
    assert.notEqual(secondProjectile[0].id, firstProjectiles[0].id)
    for (let i = 0; i < 12; i++) {
      for (const [j, world] of [w, twin].entries()) advanceGame(world, clocks[j], 1 / 12)
      assert.deepEqual(w, twin)
      linked(w, owner)
      for (const e of w.effects) if (e.tornado && !priorEffects.has(e.id)) newEffects.add(e.id)
    }
    assert.equal(newEffects.size, 2)
    assert.ok(newEffects.has(firstEffect))
    assert.equal(w.shots.tornado, stock - 2)
    assert.equal(u.casting, null)
    assert.notEqual(owner.state, 22)
    assert.equal(owner.vehicle, 8830)
    assert.equal(u.hp, 100)
  })
})

// Supplied ownership controls: retained combat order, moving craft, Boat model,
// and protected admission are separated from the historical public witness.
test('seated cast state owns retained area orders and moving Boat/Balloon seat visits', async () => {
  const { beginCast } = await import('../app/spell-casting.ts')
  const { command } = await import('../app/live-command.ts')
  const { setSelection } = await import('../app/selection-runtime.ts')
  const { currentPersonOrder } = await import('../app/person-orders.ts')
  for (const model of [2, 3]) {
    const w = checkpoint(),
      u = w.units.find(u => u.id === 8286),
      v = w.vehicles.find(v => v.id === 8830),
      p = u.native
    v.model = model
    setSelection(w, [115])
    assert.ok(command(w, { x: -71, z: 35 }))
    const vehicleStart = { x: v.x, y: v.y }
    setSelection(w, [u.id])
    assert.ok(command(w, { x: -75, z: 39 }))
    const order = currentPersonOrder(w.buildingOrders, p)
    assert.equal(order.model, 19)
    const references = order.references
    p.cargo = model === 2 ? 100 : 0
    beginCast(
      w,
      u,
      'tornado',
      w.buildings.find(b => b.id === 281)
    )
    assert.equal(p.state, 22)
    assert.equal(currentPersonOrder(w.buildingOrders, p), order)
    p.flags4 |= 0x100000
    p.reactionTimer = 30
    p.reactionDuration = 30
    const clock = { animationTime: 0, animationFrame: 0 },
      counter = p.counter
    for (let i = 1; i <= 10; i++) {
      advanceGame(w, clock, 1 / 12)
      assert.equal(p.counter, (counter + i) & 255)
      assert.equal(p.reactionDuration, 30 - i)
      linked(w, p)
      assert.equal(order.references, references)
      assert.equal(p.vehicle, v.id)
      assert.equal(w.objectCells.objects.get(p.id), p)
      if (i < 10) {
        assert.equal(p.state, 22)
        assert.equal(p.timer, 10 - i)
        assert.equal(currentPersonOrder(w.buildingOrders, p), order)
      }
      const slot = v.passengers.indexOf(p.id)
      assert.ok(slot >= 0)
      const seat = vehicleSeat(v, slot)
      assert.deepEqual(
        { x: p.x & 65535, y: p.y & 65535, h: p.h },
        { x: seat.x & 65535, y: seat.y & 65535, h: seat.h }
      )
    }
    assert.equal(u.casting, null)
    assert.notEqual(p.state, 22)
    assert.ok(v.x !== vehicleStart.x || v.y !== vehicleStart.y, 'Craft actually moves during cast')
  }
})
test('protected seated Shaman rejects public cast without stock or projectile changes', () => {
  const w = checkpoint(),
    u = w.units.find(u => u.id === 8286),
    p = u.native
  p.flags2 |= 0x100000
  const before = w.shots.tornado,
    count = w.projectiles.length
  assert.equal(
    cast(
      w,
      'tornado',
      w.buildings.find(b => b.id === 281)
    ),
    false
  )
  assert.equal(w.shots.tornado, before)
  assert.equal(w.projectiles.length, count)
  assert.equal(p.state, 30)
  assert.equal(p.vehicle, 8830)
})
