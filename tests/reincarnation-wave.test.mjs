import test from 'node:test'
import assert from 'node:assert/strict'
import { createWorld, tick, joinBattle, command } from '../app/model.ts'
import { createWorldState, addUnit } from '../app/world-state.ts'
import { createLivePerson, registerLivePerson } from '../app/live-people.ts'
import { browserPosition } from '../app/world-coordinates.ts'
import { refreshTerrainSurface } from '../app/world-terrain-runtime.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { createSwamp } from '../app/swamp.ts'
import { queueTerrain, updateWalkMasks } from '../app/native-terrain.ts'
import { effect } from '../app/world-effects.ts'
import { stepReincarnation } from '../app/reincarnation.ts'
import {
  createReincarnationWave,
  reincarnationWaveHeight,
  stepReincarnationWave,
} from '../app/reincarnation-wave-runtime.ts'

const advance = (w, n) => { for (let i = 0; i < n; i++) tick(w, 1 / 12) }
const center = { x: 4096, y: 4096, h: 240 }
function fixture() {
  const w = createWorldState(1)
  w.land.heights.fill(128)
  w.land.flags.fill(0)
  queueTerrain(w.land, 0, 64, 1, {surface(){}, globe(){}})
  updateWalkMasks(w.land, 0, 64)
  refreshTerrainSurface(w)
  w.reincarnationSites[0] = { ...center }
  w.randomState = 0x12345678
  return w
}
function person(w, kind = 'brave', options = {}) {
  const u = addUnit(w, options.team ?? 'red', kind, browserPosition(center))
  u.hp = 150
  const p = u.native = createLivePerson(w, u)
  Object.assign(p, { state: 17, life: 3000 }, options.person)
  registerLivePerson(w, p)
  return u
}
const state = w => ({
  sites: w.reincarnationSites,
  effects: w.effects,
  flags: w.castingTribes.map(t => t.flags),
  terrain: Array.from(w.land.heights),
  people: w.units,
  nextId: w.nextId,
  randomState: w.randomState,
  sounds: w.sounds,
})

test('failed allocation consumes the sole producer opportunity before a later spawn', () => {
  const w = fixture()
  let remaining = 6, attempts = 0, spawned = 0
  for (let visit = 0; visit < 6; visit++) {
    const step = stepReincarnation(remaining, true, false)
    remaining = step.remaining
    if (step.event === 'rise') createReincarnationWave(w, 0, point => {
      attempts++
      assert.deepEqual(point, center)
      return undefined
    })
    if (step.event === 'spawn') spawned++
  }
  assert.equal(attempts, 1)
  assert.equal(spawned, 1)
  assert.equal(remaining, 0)
  assert.equal(w.effects.length, 0)
  assert.equal(w.castingTribes[0].flags & 1, 0)
  assert.equal(w.sounds.length, 0)
})

test('busy rejection consumes allocation identity but preserves the active wave and saved site', () => {
  const w = fixture(), first = createReincarnationWave(w, 0)
  const before = structuredClone(state(w)), id = w.nextId, count = w.effectCounter
  assert.equal(createReincarnationWave(w, 0), undefined)
  assert.equal(w.nextId, id + 1)
  assert.equal(w.effectCounter, (count + 1) & 255)
  assert.deepEqual(w.effects, before.effects)
  assert.deepEqual(w.reincarnationSites, before.sites)
  assert.equal(w.effects[0], first)
  assert.equal(w.sounds.length, 1)
  assert.equal(w.castingTribes[0].flags & 1, 1)
})

test('site height follows native ground-then-quantize arithmetic', () => {
  for (const [saved, ground, expected] of [[240,128,256],[128,641,640],[-20,128,128],[1024,1100,1024]]) {
    assert.equal(reincarnationWaveHeight(saved, ground), expected)
    const w = fixture()
    w.reincarnationSites[0].h = saved
    w.land.heights.fill(ground)
    refreshTerrainSurface(w)
    const fx = createReincarnationWave(w, 0)
    assert.equal(fx.reincarnationWave.center.h, expected)
    assert.equal(w.reincarnationSites[0].h, expected)
    assert.equal(fx.reincarnationWave.mode, 2)
    assert.equal(fx.reincarnationWave.id, fx.id)
    assert.equal(fx.reincarnationWave.visits, 0)
  }
})

test('mode2 uses native eligibility, panic, descriptor damage and RNG without Swarm filters', () => {
  const cases = [
    ['brave', {}, 500], ['warrior', {}, 900], ['preacher', {}, 550],
    ['spy', {}, 300], ['firewarrior', {}, 350],
    ['brave', {person:{flags3:0x8000}}, 0],
    ['brave', {person:{flags3:0x80000}}, 62],
    ['brave', {person:{flags2:0x800000}}, 500],
    ['brave', {person:{flags4:0x800}}, 500],
    ['brave', {person:{state:23}}, 500],
  ]
  for (const [kind, options, damage] of cases) {
    const w = fixture(), u = person(w, kind, options), fx = createReincarnationWave(w, 0)
    stepReincarnationWave(w, fx)
    assert.equal(u.hp, (3000 - damage) / 20, JSON.stringify([kind, options]))
    assert.equal(u.native.state, 26)
    assert.equal(u.native.timer, 64)
    assert.equal(u.native.speed, 110)
    assert.equal(u.native.turnAngle, 1534)
    assert.equal(w.randomState, 1389729278)
    const hp = u.hp
    stepReincarnationWave(w, fx)
    assert.equal(u.hp, hp, 'state26 prevents repeated damage')
    assert.equal(w.randomState, 1389729278)
  }
  for (const [kind, options] of [
    ['brave', {team:'blue'}], ['brave', {team:'wild'}], ['shaman', {}],
    ['brave', {person:{state:26}}],
  ]) {
    const w = fixture(), u = person(w, kind, options), before = structuredClone(u), fx = createReincarnationWave(w, 0)
    stepReincarnationWave(w, fx)
    assert.equal(u.hp, before.hp)
    assert.equal(u.native.state, before.native.state)
    assert.equal(u.team, before.team)
    assert.equal(w.randomState, 0x12345678)
  }
  const w = fixture(), u = person(w), fx = createReincarnationWave(w, 0)
  w.levelFlags2 |= 0x04000000
  stepReincarnationWave(w, fx)
  assert.equal(u.hp, 150)
  assert.equal(u.native.state, 26)
})

test('protected transitions retain repeated native cell hits and consume no panic RNG', () => {
  const w = fixture(), u = person(w, 'brave', {person:{flags2:0x100000}}), fx = createReincarnationWave(w, 0)
  stepReincarnationWave(w, fx)
  assert.equal(u.hp, 100)
  assert.equal(u.native.state, 17)
  stepReincarnationWave(w, fx)
  assert.equal(u.hp, 50)
  assert.equal(u.native.state, 17)
  assert.equal(w.randomState, 0x12345678)
})

test('a wave removes an older in-cell Swamp before it can process in the same turn', () => {
  const w = fixture(), friend = person(w, 'brave', {team:'blue'})
  const trap = effect(w, 'swamp', browserPosition(center))
  trap.duration = Infinity
  trap.swamp = createSwamp(center, 1, 3, w)
  const oldRemaining = trap.swamp.remaining
  const fx = createReincarnationWave(w, 0)
  tick(w, 1 / 12)
  assert.ok(!w.effects.includes(trap))
  assert.equal(trap.swamp.remaining, oldRemaining, 'removed Swamp must never reach its processor')
  assert.ok(friend.hp > 0, 'older Swamp cannot kill after wave cleanup')
  assert.equal(fx.reincarnationWave.visits, 1)
  assert.equal(fx.reincarnationWave.orbits.length, 32)
})

test('mode2 cleanup keeps an outside Swamp and the next enemy receives panic', () => {
  const w = fixture(), enemy = person(w), traps = [center, {...center, x:4608}].map(point => {
    const fx = effect(w, 'swamp', browserPosition(point))
    fx.duration = Infinity
    fx.swamp = createSwamp(point, 0, 0, w)
    return fx
  })
  const fx = createReincarnationWave(w, 0)
  stepReincarnationWave(w, fx)
  assert.equal(traps[0].duration, traps[0].age)
  assert.equal(traps[1].duration, Infinity)
  assert.equal(enemy.native.state, 26)
  assert.equal(enemy.hp, 125)
})

test('ordinary death produces a next-turn wave that outlives successful respawn', () => {
  const w = createWorld(1)
  advance(w, 70)
  const old = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
  const stones = structuredClone(w.levelStart[0].stoneTurns)
  old.hp = 0
  tick(w, 1 / 12)
  let fx
  for (let i = 0; i < 470 && !(fx = w.effects.find(f => f.reincarnationWave)); i++) tick(w, 1 / 12)
  assert.ok(fx)
  assert.equal(fx.reincarnationWave.visits, 0, 'new allocation cannot process on its production turn')
  assert.equal(fx.reincarnationWave.orbits.length, 0)
  assert.equal(Math.round(w.respawns[0] * 12), 5)
  advance(w, 5)
  assert.ok(w.units.some(u => u.team === 'blue' && u.kind === 'shaman' && u.id !== old.id))
  assert.ok(w.effects.includes(fx), 'spawn does not own the wave lifetime')
  assert.equal(fx.reincarnationWave.visits, 5)
  assert.deepEqual(w.levelStart[0].stoneTurns, stones)
  assert.equal(w.levelStart[0].phase, 4)
  for (let i = 0; i < 100 && w.effects.includes(fx); i++) tick(w, 1 / 12)
  assert.ok(!w.effects.includes(fx))
  assert.equal(w.castingTribes[0].flags & 1, 0)
})

test('checkpoints preserve mode2 identity, sites, orbits, terrain and RNG without replay', () => {
  for (const visits of [0,1,5,20]) {
    const w = fixture()
    person(w)
    const fx = createReincarnationWave(w, 0)
    for (let i = 0; i < visits; i++) stepReincarnationWave(w, fx)
    const restored = migrateCheckpoint(structuredClone(w)), resumed = restored.effects.find(f => f.id === fx.id)
    assert.deepEqual(state(restored), state(w))
    for (let i = visits; i < 21; i++) {
      stepReincarnationWave(w, fx)
      stepReincarnationWave(restored, resumed)
    }
    assert.deepEqual(state(restored), state(w))
    assert.equal(w.sounds.filter(s => s.cue === 158).length, 1)
    assert.equal(fx.reincarnationWave.orbits.length, 0)
    assert.equal(w.castingTribes[0].flags & 1, 0)
  }
})

test('mode2 interrupts the real encounter owner while retaining its person and order queue', () => {
  const w = fixture(), enemy = person(w, 'warrior', {team:'blue'}), friendly = person(w, 'brave')
  w.reincarnationSites[1] = { ...center }
  w.selected = [enemy.id]
  assert.ok(command(w, {x:enemy.x + 4, z:enemy.z}))
  assert.ok(enemy.native.commands.some(Boolean), 'ordinary move command must create a real queue')
  joinBattle(w, enemy, friendly)
  assert.equal(enemy.fight.action, 'encounter')
  const active = enemy.fight.motion, queue = structuredClone(active.commands), orders = structuredClone(w.buildingOrders)
  assert.equal(active.state, 29)
  assert.equal(enemy.native, null, 'encounter owns the live person')
  const fx = createReincarnationWave(w, 1)
  stepReincarnationWave(w, fx)
  assert.equal(active.state, 26)
  assert.equal(enemy.native, active, 'panic must adopt the actual active person')
  assert.deepEqual(active.commands, queue)
  assert.deepEqual(w.buildingOrders, orders)
  assert.equal(enemy.hp, 105)
  advance(w, 2)
  assert.equal(enemy.native, active)
  assert.equal(active.state, 26, 'old encounter must not overwrite panic on a later visit')
  assert.equal(enemy.fight, null, 'ordinary fight cleanup must release the old wrapper')
  assert.deepEqual(active.commands, queue)
})

test('ordinary Boat and Balloon boarding retain seats and deselect passengers under mode2 panic', async () => {
  const { selectVehiclePassenger } = await import('../app/vehicle-panel-runtime.ts')
  for (const model of [1, 3]) {
    const w = createWorld(22), vehicle = w.vehicles.find(v => v.model === model)
    const passenger = addUnit(w, 'blue', 'spy', browserPosition(vehicle))
    const shaman = addUnit(w, 'blue', 'shaman', browserPosition(vehicle))
    w.inputMask = 0
    w.selected = [passenger.id, shaman.id]
    assert.ok(command(w, {...browserPosition(vehicle), id:vehicle.id}))
    for (let i=0;i<120 && vehicle.passengerCount<2;i++) tick(w,1/12)
    assert.equal(vehicle.passengerCount, 2)
    assert.equal(passenger.native.vehicle, vehicle.id)
    assert.equal(shaman.native.vehicle, vehicle.id)
    w.selected = []
    selectVehiclePassenger(w, vehicle, passenger.id, true)
    assert.ok(w.selected.includes(passenger.id) && w.selected.includes(shaman.id))
    const active = passenger.native, beforeHP = passenger.hp, seats = [...vehicle.passengers]
    const queue = structuredClone(active.commands), orders = structuredClone(w.buildingOrders)
    const peerSelection = shaman.native.selectionFlags
    w.reincarnationSites[1] = {x:active.x & 0xfe00,y:active.y & 0xfe00,h:active.h}
    const fx = createReincarnationWave(w, 1)
    stepReincarnationWave(w, fx)
    assert.equal(passenger.native, active)
    assert.equal(active.state, 26)
    assert.equal(passenger.hp, beforeHP - 15)
    assert.equal(active.vehicle, vehicle.id)
    assert.equal(shaman.native.vehicle, vehicle.id)
    assert.deepEqual(vehicle.passengers, seats)
    assert.equal(vehicle.passengerCount, 2)
    assert.ok(!w.selected.includes(passenger.id) && !w.selected.includes(shaman.id))
    assert.equal(shaman.native.selectionFlags, peerSelection & ~128)
    assert.deepEqual(active.commands, queue)
    assert.deepEqual(w.buildingOrders, orders)
    advance(w, 3)
    assert.equal(passenger.native.vehicle, vehicle.id)
    assert.equal(shaman.native.vehicle, vehicle.id)
    assert.deepEqual(vehicle.passengers, seats)
  }
})

test('panic transfers a live building-entry queue and resumes it after expiry', async () => {
  const {addBuilding} = await import('../app/model.ts')
  const w = fixture(), hut = addBuilding(w, 'blue', 'hut', {x:13,z:-24}, true)
  addUnit(w, 'red', 'brave', {x:-50,z:50}) // Keep ordinary victory from interrupting the panic fixture.
  const u = addUnit(w, 'blue', 'brave', {x:8,z:-24})
  w.selected = [u.id]
  assert.ok(command(w, hut))
  for (let i=0;i<120 && u.entry?.person.substate!==5;i++) tick(w,1/12)
  assert.equal(u.entry?.person.substate, 5)
  const p = u.entry.person, queue = structuredClone(p.commands), pool = structuredClone(w.buildingOrders)
  assert.ok(queue.some(Boolean))
  w.reincarnationSites[1] = {x:p.x & 0xfe00,y:p.y & 0xfe00,h:p.h}
  const fx = createReincarnationWave(w, 1)
  stepReincarnationWave(w, fx)
  assert.equal(u.native, p)
  assert.equal(p.state, 26)
  assert.equal(u.entry, undefined)
  assert.deepEqual(p.commands, queue)
  assert.deepEqual(w.buildingOrders, pool)
  for (let i=0;i<200 && p.state===26;i++) tick(w,1/12)
  assert.notEqual(p.state, 26)
  assert.deepEqual(p.commands, queue, 'panic expiry resumes the original queue without allocating a replacement')
  assert.equal(u.entry?.person, p)
  assert.deepEqual(w.buildingOrders.records[queue[0]], pool.records[queue[0]])
  for (let i=0;i<200 && u.inside!==hut.id;i++) tick(w,1/12)
  assert.equal(u.inside, hut.id, 'the original building-entry command completes after panic')
  assert.equal(w.buildingOrders.records[queue[0]].references, 0, 'original command ownership is released once on completion')
})
