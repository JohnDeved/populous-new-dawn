import { createCampaignFixtureStore } from './support/campaign-fixture.mjs'
import { scalableReferenceIds } from './helpers/scalable-reference-ids.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { command, cast, tick, selectUnit, nativePosition } from '../app/model.ts'
import { stepSwarm } from '../app/spell-effects-runtime.ts'
import { spellTargetError } from '../app/live-command.ts'
import { spiralCell, random } from '../app/native-math.ts'
import {
  createSwarmState,
  initializeSwarmInsects,
  stepSwarmBuilding,
  stepSwarmInsectTarget,
} from '../app/swarm.ts'

const referenceId = scalableReferenceIds(22)

const insect = (x = 0, y = 0) => ({ x, y, h: 500, vx: 8, vy: 9, verticalOffset: 0, jitter: [] })
test('Swarm target motion uses strict Manhattan arrival, signed axes and word velocities', () => {
  const arrived = insect()
  assert.ok(stepSwarmInsectTarget(arrived, { x: 199, y: 0 }, true, () => 100))
  assert.deepEqual([arrived.x, arrived.h, arrived.vx, arrived.vy], [0, 500, 99, 0])
  const moving = insect()
  assert.equal(
    stepSwarmInsectTarget(moving, { x: 200, y: 0 }, true, () => 100),
    false
  )
  assert.deepEqual([moving.x, moving.h, moving.vx], [64, 465, 64])
  const seam = insect(32767)
  assert.equal(
    stepSwarmInsectTarget(seam, { x: 32768, y: 0 }, true, () => 100),
    false
  )
  // Separately signed coordinates produce -65535, not a wrapped +1 arrival.
  // The -32767 velocity plus -32 acceleration wraps before clamping.
  assert.equal(seam.x, 32831)
  const wrapped = insect()
  wrapped.vx = 32767
  stepSwarmInsectTarget(wrapped, { x: 200, y: 0 }, false, () => 100)
  assert.equal(wrapped.vx, -64)
})

test('Swarm building stages keep visit boundaries, history RNG, invalidation and return draws', () => {
  const rng = { randomState: 1 },
    state = createSwarmState(rng, { x: 0, y: 0, h: 0 }, 0, () => 0)
  initializeSwarmInsects(rng, state)
  state.phase = 'wandering'
  state.remaining = 192
  state.wander = 10
  let valid = true,
    ejected = 0
  const effects = {
    acquire: () => 42,
    valid: () => valid,
    outside: () => ({ x: 0, y: 0 }),
    inside: () => ({ x: 512, y: 0 }),
    eject: () => ejected++,
  }
  stepSwarmBuilding(rng, state, effects)
  assert.deepEqual([state.phase, state.stage, state.visitedBuildings], ['building', 0, [42]])
  for (let n = 0; n < 4; n++) stepSwarmBuilding(rng, state, effects)
  assert.equal(state.stage, 4)
  assert.ok(state.insects.every(i => i.phase === 1))
  stepSwarmBuilding(rng, state, effects)
  assert.equal(state.stage, 4)
  for (const i of state.insects) i.hidden = true
  stepSwarmBuilding(rng, state, effects)
  assert.equal(ejected, 0)
  stepSwarmBuilding(rng, state, effects)
  assert.equal(ejected, 1)
  for (let n = 0; n < 4; n++) stepSwarmBuilding(rng, state, effects)
  assert.equal(state.stage, 7)
  const oracle = { randomState: rng.randomState }
  const jitter = state.insects.map(() =>
    Array.from({ length: 10 }, () => (random(oracle) & 511) - 256)
  )
  stepSwarmBuilding(rng, state, effects)
  assert.deepEqual(
    state.insects.map(i => i.jitter),
    jitter
  )
  assert.equal(rng.randomState, oracle.randomState)
  for (const i of state.insects) i.hidden = false
  stepSwarmBuilding(rng, state, effects)
  const motion = state.insects.map(() => [
    random(oracle) & 127,
    random(oracle) & 127,
    random(oracle) & 127,
  ])
  stepSwarmBuilding(rng, state, effects)
  assert.deepEqual(
    state.insects.map(i => [i.vx, i.verticalVelocity, i.vy]),
    motion
  )
  assert.equal(state.phase, 'wandering')
  state.phase = 'building'
  state.stage = 2
  state.stopped = false
  valid = false
  const before = structuredClone(state.insects)
  stepSwarmBuilding(rng, state, effects)
  assert.equal(state.phase, 'wandering')
  assert.equal(state.stopped, false)
  assert.deepEqual(state.insects, before)
  state.phase = 'building'
  state.stage = 4
  state.stopped = true
  stepSwarmBuilding(rng, state, effects)
  assert.equal(state.phase, 'wandering')
  assert.equal(state.stopped, true)
  assert.deepEqual(state.insects, before)
  valid = true
  state.phase = 'wandering'
  state.wander = 10
  state.visitedBuildings = Array.from({ length: 10 }, (_, i) => i + 1)
  const historyOracle = { randomState: rng.randomState },
    expected = [...state.visitedBuildings]
  expected[random(historyOracle) % 10] = 42
  stepSwarmBuilding(rng, state, effects)
  assert.deepEqual(state.visitedBuildings, expected)
  assert.equal(rng.randomState, historyOracle.randomState)
})

test('earned M22 Swarm pursues a unique occupied hut, ejects residents and returns with public checkpoint continuity', async () => {
  const store = await createCampaignFixtureStore([22])
  assert.equal(store.startMission(22), true)
  const w = store.getWorld(),
    shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
  const until = (f, n) => {
    for (let i = 0; i < n && !f(); i++) tick(w, 1 / 12)
    assert.ok(f())
  }
  // Existing mana-focus adapter fixture; stock is earned through actual turns.
  w.charging = true
  w.manaWorld.spells[0].disabled = 0xffffffff & ~(1 << 4)
  until(() => w.shots.swarm > 0, 1500)
  for (const point of [
    { x: 0, z: -45 },
    { x: 20, z: -45 },
  ]) {
    selectUnit(w, shaman.id)
    assert.ok(command(w, point))
    until(() => Math.hypot(shaman.x - point.x, shaman.z - point.z) < 2, 1000)
  }
  const hut = w.buildings.find(b => b.id === 92)
  selectUnit(w, shaman.id)
  assert.ok(command(w, { x: 10, z: -35 }))
  until(() => !spellTargetError(w, 'swarm', hut), 500)
  const residents = w.units.filter(u => u.inside === hut.id)
  assert.deepEqual(
    residents.map(u => u.id),
    [138, 202, 254].map(referenceId)
  )
  assert.ok(residents.every(u => u.hp === 50))
  assert.ok(cast(w, 'swarm', { x: hut.x + 2, z: hut.z }))
  until(() => w.effects.some(f => f.swarm?.remaining === 192), 100)
  const fx = w.effects.find(f => f.swarm),
    swarm = fx.swarm,
    origin = (swarm.origin.y & 0xfe00) | ((swarm.origin.x >>> 8) & 254)
  let first = null
  for (let n = 0; n < 167; n++) {
    const cell = spiralCell(origin, n, 0),
      buildings = w.buildings.filter(b => {
        const p = nativePosition(w, b)
        return b.hp > 0 && b.team !== 'blue' && ((p.y & 0xfe00) | ((p.x >>> 8) & 254)) === cell
      })
    if (buildings.length) {
      first = { n, ids: buildings.map(b => b.id) }
      break
    }
  }
  assert.deepEqual(first, { n: 7, ids: [92] })
  // Supplied class9 plan excludes the earliest candidate, but partial progress
  // alone does not change an already allocated class2 building's eligibility.
  for (const plan of [true, false]) {
    const control = structuredClone(w),
      target = control.buildings.find(b => b.id === 92),
      effect = control.effects.find(f => f.swarm)
    target.progress = 0.5
    if (plan) target.preparation = {}
    else delete target.preparation
    stepSwarm(control, effect)
    assert.equal(effect.swarm.phase, 'building')
    if (plan) assert.notEqual(effect.swarm.building, 92)
    else assert.equal(effect.swarm.building, 92)
  }
  tick(w, 1 / 12)
  assert.deepEqual([swarm.phase, swarm.stage, swarm.building], ['building', 0, 92])
  // Supplied repeat-window projection: an already visited hut is never reacquired.
  const revisiting = structuredClone(w),
    revisitFx = revisiting.effects.find(f => f.swarm)
  revisitFx.swarm.phase = 'wandering'
  revisitFx.swarm.remaining = 192
  revisitFx.swarm.building = undefined
  stepSwarm(revisiting, revisitFx)
  assert.notEqual(revisitFx.swarm.building, 92)
  until(() => swarm.stage === 4, 100)
  assert.ok(residents.every(u => u.inside === hut.id && u.hp === 50))
  await store.saveCheckpoint()
  assert.ok(store.loadCheckpoint())
  const restored = store.getWorld()
  // Existing checkpoint schema supplies these two default rewards on loading.
  const comparable = world => {
    const copy = structuredClone(world)
    for (const index of [0, 2]) copy.shrines[index].reward ??= 'mana'
    return copy
  }
  let ejected = false,
    returned = false,
    ingress = false
  for (let n = 0; n < 240; n++) {
    tick(w, 1 / 12)
    tick(restored, 1 / 12)
    assert.deepEqual(comparable(restored), comparable(w))
    if (!ejected && swarm.stage === 5) {
      ingress = swarm.insects.every(i => i.hidden)
      // Supplied stale slots/count0: source checks count once before traversal.
      const stale = structuredClone(w),
        staleFx = stale.effects.find(f => f.swarm),
        staleHut = stale.buildings.find(b => b.id === 92)
      staleHut.admission.inside = 0
      staleFx.swarm.remaining = 101 // isolate building arm from the common ground scan
      const people = stale.units.filter(u => residents.some(r => r.id === u.id)),
        before = people.map(u => [u.id, u.inside, u.hp])
      stepSwarm(stale, staleFx)
      assert.deepEqual(
        people.map(u => [u.id, u.inside, u.hp]),
        before
      )
      assert.equal(staleFx.swarm.stage, 6)
      for (const invalid of ['deleted', 'class0']) {
        const world = structuredClone(w),
          effect = world.effects.find(f => f.swarm),
          building = world.buildings.find(b => b.id === 92),
          unit = world.units.find(u => u.id === residents[0].id),
          owner = unit.entry?.person ?? unit.native ?? unit.resident?.person
        assert.ok(owner)
        if (invalid === 'deleted') owner.flags2 |= 1
        else owner.class = 0
        effect.swarm.remaining = 101
        const slot = building.admission.occupants.indexOf(unit.id)
        stepSwarm(world, effect)
        assert.equal(building.admission.occupants[slot], unit.id)
        assert.equal(unit.inside, 92)
        assert.equal(unit.hp, 50)
        assert.equal(building.admission.inside, 1)
      }
    }
    if (!ejected && swarm.stage === 6) {
      ejected = true
      assert.ok(ingress)
      assert.ok(residents.every(u => u.inside === null && u.hp < 50 && u.hp > 0))
      assert.ok(hut.admission.occupants.every(id => !residents.some(u => u.id === id)))
      for (const u of residents) assert.equal(w.objectCells.objects.get(u.id), u.native)
    }
    if (ejected && swarm.phase === 'wandering') returned = true
  }
  assert.ok(ejected && returned)
  assert.equal(w.effects.filter(f => f.swarm).length, 0)
  assert.equal(w.shots.swarm, 0)
})
