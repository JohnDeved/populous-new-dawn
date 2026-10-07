import assert from 'node:assert/strict'
import test from 'node:test'
import { fullHutScene, makeHutSmokeScene } from './support/hut-smoke-scene.mjs'

const occupants = (world, hut) => world.units.filter(unit => unit.inside === hut.id && unit.hp > 0)
const roots = (world, hut) => world.secondaryEffects.order
  .map(slot => world.secondaryEffects.slots[slot])
  .filter(entry => entry?.kind === 'hutRoot' && entry.building === hut.id)
const children = world => world.secondaryEffects.order
  .map(slot => world.secondaryEffects.slots[slot])
  .filter(entry => entry?.kind === 'hutPuff')
const closeFixture = fixture => {
  for (const group of fixture.scene.hutSmokePuffs.values()) fixture.scene.releaseGroup(group)
  fixture.close()
}

async function fixtureWithResidents(count, withChild = false) {
  const fixture = await fullHutScene()
  const { scene, api, hut, residents, render } = fixture
  try {
    if (withChild) {
      for (let turn = 0; turn < 512 && !children(scene.world).length; turn++) {
        api.advanceGame(scene.world, scene.gameClock, 1 / 12)
        render()
      }
      assert.ok(children(scene.world).length, 'The actual owner must emit the retained child')
    }
    for (const resident of residents.slice(count)) {
      scene.world.selected = [resident.id]
      assert.ok(api.command(scene.world, { x: 9, z: 30 }))
      assert.equal(resident.inside, null)
    }
    render()
    assert.equal(occupants(scene.world, hut).length, count)
    return fixture
  } catch (error) {
    closeFixture(fixture)
    throw error
  }
}

// Controlled world/cohort, real command8 admission, and actual ignition consumer.
// The separate captured baseline/native comparison owns failure provenance.
for (const count of [3, 1, 0])
  test(`Lightning retires a ${count}-resident hut root after fire initialization`, async () => {
    const fixture = await fixtureWithResidents(count, count === 3)
    const { scene, hut, render } = fixture
    const world = scene.world
    const { igniteLightningScenery } = await import('../app/spell-effects-runtime.ts')
    const { nativePosition } = await import('../app/world-terrain-runtime.ts')
    const { buildingFirePoints, buildingPose } = await import('../app/building-shapes.ts')
    const { reconcileWorldHutSmoke } = await import('../app/hut-smoke-runtime.ts')
    const before = {
      ids: occupants(world, hut).map(unit => unit.id),
      slots: [...hut.admission.occupants],
      children: structuredClone(children(world)),
      free: world.secondaryEffects.free.length,
      rootCount: roots(world, hut).length,
    }
    const fireRootPresence = []
    const originalPush = world.effects.push
    const socketCount = buildingFirePoints(buildingPose(hut)).length
    try {
      world.effects.push = function (...effects) {
        if (effects.some(effect => effect.kind === 'fire'))
          fireRootPresence.push(roots(world, hut).length)
        return originalPush.apply(this, effects)
      }
      igniteLightningScenery(world, nativePosition(world, hut), 0)
      world.effects.push = originalPush
      assert.ok(socketCount > 0)
      assert.deepEqual(fireRootPresence.slice(0, socketCount), Array(socketCount).fill(before.rootCount))
      assert.equal(hut.damageState.state, 4)
      assert.equal(hut.burn.remaining, 127)
      assert.deepEqual(occupants(world, hut).map(unit => unit.id), before.ids)
      assert.deepEqual(hut.admission.occupants, before.slots)
      assert.deepEqual(children(world), before.children)
      assert.equal(roots(world, hut).length, 0)
      assert.equal(world.secondaryEffects.free.length, before.free + before.rootCount)
      assert.equal(world.secondaryEffects.roots[hut.id].slot, null)
      assert.equal(world.secondaryEffects.roots[hut.id].state.root, null)
      const owner = structuredClone(world.secondaryEffects)
      const rng = [world.randomState, world.cosmeticRandom.randomState, world.effectCounter]
      reconcileWorldHutSmoke(world, hut)
      render()
      render()
      assert.deepEqual(world.secondaryEffects, owner, 'Neither admission reconciliation nor scene binding recreates a burning root')
      assert.deepEqual([world.randomState, world.cosmeticRandom.randomState, world.effectCounter], rng)
      assert.equal(scene.buildingMeshes.get(hut.id).userData.hutOccupancySmoke.group.visible, false)
    } finally {
      world.effects.push = originalPush
      closeFixture(fixture)
    }
  })

test('blocked ignition preserves the completed root and its real residents', async () => {
  const fixture = await fixtureWithResidents(3)
  const { scene, hut } = fixture
  const world = scene.world
  const { ensureBuildingDamage, igniteBuilding } = await import('../app/building-damage.ts')
  const { igniteLightningScenery } = await import('../app/spell-effects-runtime.ts')
  const { nativePosition } = await import('../app/world-terrain-runtime.ts')
  try {
    const state = ensureBuildingDamage(hut)
    state.flags2 |= 0x100000 // Explicit native no-state-transition fixture.
    const before = structuredClone(world.secondaryEffects)
    const ids = occupants(world, hut).map(unit => unit.id)
    igniteLightningScenery(world, nativePosition(world, hut), 1)
    assert.equal(state.state, 2)
    assert.equal(hut.burn, undefined)
    assert.deepEqual(world.secondaryEffects, before)
    assert.deepEqual(occupants(world, hut).map(unit => unit.id), ids)
    // Native protected models 18/19 do not own residential roots. Check their
    // initializer gate directly rather than inventing a protected hut model.
    for (const model of [18, 19]) {
      const protectedState = { ...structuredClone(state), model, flags2: 0 }
      const prior = structuredClone(protectedState)
      igniteBuilding(protectedState, 1, () => assert.fail('Protected building cannot initialize fire'))
      assert.deepEqual(protectedState, prior)
    }
  } finally {
    closeFixture(fixture)
  }
})

test('repeat ignition does not reset fire or mutate surviving children', async () => {
  const fixture = await fixtureWithResidents(3, true)
  const { scene, hut } = fixture
  const world = scene.world
  const { igniteLightningScenery } = await import('../app/spell-effects-runtime.ts')
  const { nativePosition } = await import('../app/world-terrain-runtime.ts')
  try {
    const point = nativePosition(world, hut)
    igniteLightningScenery(world, point, 1)
    const owner = structuredClone(world.secondaryEffects)
    const burn = hut.burn
    const fires = world.effects.filter(effect => effect.fire?.suppressEmbers).map(effect => effect.id)
    igniteLightningScenery(world, point, 2)
    assert.equal(hut.burn, burn)
    assert.equal(hut.damageState.attacker, 1)
    assert.deepEqual(world.secondaryEffects, owner)
    assert.deepEqual(world.effects.filter(effect => effect.fire?.suppressEmbers).map(effect => effect.id), fires)
  } finally {
    closeFixture(fixture)
  }
})

test('paused restore retires historically saved burning roots while preserving children and legacy completed huts', async () => {
  const fixture = await fixtureWithResidents(3, true)
  const { world } = fixture.scene
  const { ensureBuildingDamage } = await import('../app/building-damage.ts')
  const { restoreSecondaryEffects } = await import('../app/hut-smoke-runtime.ts')
  let restoredFixture
  try {
    for (const damageState of [undefined, null]) {
      const legacy = structuredClone(world)
      const hut = legacy.buildings.find(building => building.id === fixture.hut.id)
      hut.damageState = damageState
      const root = legacy.secondaryEffects.roots[hut.id].state.root
      restoreSecondaryEffects(legacy)
      assert.equal(legacy.secondaryEffects.roots[hut.id].state.root, root)
      assert.equal(roots(legacy, hut).length, 1)
    }
    const restored = structuredClone(world)
    const hut = restored.buildings.find(building => building.id === fixture.hut.id)
    // This serialized combination is proved reachable by live-baseline-01:
    // state4/timer127 with residents, root and independently owned child intact.
    ensureBuildingDamage(hut).state = 4
    hut.burn = { remaining: 127, soundPlaying: false }
    restored.paused = true
    const oldChildren = structuredClone(children(restored))
    const clock = [restored.turn, restored.secondaryEffects.animationFrame]
    const rng = [restored.randomState, restored.cosmeticRandom.randomState, restored.effectCounter]
    restoreSecondaryEffects(restored)
    assert.equal(roots(restored, hut).length, 0)
    assert.deepEqual(children(restored), oldChildren)
    assert.deepEqual([restored.turn, restored.secondaryEffects.animationFrame], clock)
    assert.deepEqual([restored.randomState, restored.cosmeticRandom.randomState, restored.effectCounter], rng)
    restoredFixture = await makeHutSmokeScene(restored)
    restoredFixture.render()
    assert.equal(restoredFixture.scene.buildingMeshes.get(hut.id).userData.hutOccupancySmoke.group.visible, false)
    assert.deepEqual(children(restored), oldChildren)
    // A legacy checkpoint without the secondary owner has no root history to
    // migrate; first scene binding still must not fabricate a burning root.
    closeFixture(restoredFixture)
    restoredFixture = undefined
    delete restored.secondaryEffects
    restoreSecondaryEffects(restored)
    restoredFixture = await makeHutSmokeScene(restored)
    restoredFixture.render()
    assert.equal(roots(restored, hut).length, 0)
    assert.equal(restored.secondaryEffects.roots[hut.id].state.root, null)
  } finally {
    if (restoredFixture) closeFixture(restoredFixture)
    closeFixture(fixture)
  }
})

test('Spy command15 ignition retires the same occupied-hut root', async () => {
  const fixture = await fixtureWithResidents(3, true)
  const { scene, api, hut } = fixture
  const world = scene.world
  const { createLivePerson } = await import('../app/live-people.ts')
  const { allocatePersonOrder, attachPersonOrder } = await import('../app/person-orders.ts')
  const { orderEffects } = await import('../app/live-movement.ts')
  const { stepLiveBuildingAttack } = await import('../app/live-building-combat.ts')
  const { nativePosition, browserPosition } = await import('../app/model.ts')
  const { buildingOutsidePoint, buildingPose } = await import('../app/building-shapes.ts')
  try {
    const outside = buildingOutsidePoint(buildingPose(hut))
    const spy = api.addUnit(world, 'red', 'spy', browserPosition(outside))
    const person = createLivePerson(world, spy)
    spy.native = person
    const point = nativePosition(world, hut)
    const order = allocatePersonOrder(world.buildingOrders)
    assert.ok(order)
    Object.assign(world.buildingOrders.records[order], { model: 15, flags: 0, a: point.x, b: point.y })
    attachPersonOrder(world.buildingOrders, person, order, 0, orderEffects(world))
    // Supporting native command15 phase3/timer1 boundary, not a Spy acquisition
    // or movement proof. The actual exported controller owns dispatch/ignition.
    Object.assign(person, { state: 10, substate: 3, timer: 1, commandStatus: 15,
      goalX: person.x, goalY: person.y })
    person.flags2 &= ~0x40000000
    const ids = occupants(world, hut).map(unit => unit.id)
    const beforeChildren = structuredClone(children(world))
    stepLiveBuildingAttack(world, spy)
    assert.equal(person.substate, 4, 'Actual command15 ignition phase must run')
    assert.equal(hut.damageState.state, 4)
    assert.equal(hut.burn.remaining, 127)
    assert.equal(roots(world, hut).length, 0)
    assert.deepEqual(occupants(world, hut).map(unit => unit.id), ids)
    assert.deepEqual(children(world), beforeChildren)
  } finally {
    closeFixture(fixture)
  }
})
