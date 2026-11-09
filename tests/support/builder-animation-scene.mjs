// The existing construction command/clock supplies a real Work person. Render
// fixtures and cloned populations remain Node diagnostics, not browser/native QA.
import assert from 'node:assert/strict'
import { loadSceneFixture } from './bloodlust-scene.mjs'
import { makeSelectionScene } from './selection-scene.mjs'

let working
export async function normalWorkingConstruction() {
  const api = await loadSceneFixture()
  if (!working) {
    const world = api.createWorld(1),
      clock = { animationTime: 0, animationFrame: 0 }
    world.manaWorld.gameFlags = 32
    api.select(world, 'brave')
    assert.ok(api.placeBuilding(world, 'hut', { x: -2, z: 32 }))
    const building = world.buildings.at(-1),
      preparationAtPlacement = structuredClone(building.preparation)
    assert.ok(preparationAtPlacement)
    let worker
    for (let turn = 0; turn < 1000 && !worker; turn++) {
      api.advanceGame(world, clock, 1 / 12)
      worker = world.units.find(
        unit =>
          unit.work === building.id &&
          !building.preparation &&
          unit.builder?.task === 2 &&
          unit.builder.phase === 4 &&
          unit.builder.person?.speed === 0 &&
          unit.builder.person.timer > 2
      )
    }
    assert.ok(worker, 'the real assigned construction worker reaches a stationary Work pause')
    assert.equal(api.unitAnimationSource(worker), worker.builder.person)
    assert.equal(api.unitAnimation(world, worker), 'work')
    assert.equal(worker.inside, null)
    assert.equal(worker.builder.person.flags2 & 0x800000, 0, 'no separate tower-picking scan')
    assert.equal(world.landVersion, world.terrainVersion, 'no dirty-terrain reconciliation')
    working = {
      world,
      clock,
      buildingId: building.id,
      workerId: worker.id,
      preparationAtPlacement,
    }
  }
  return { api, ...structuredClone(working) }
}

export async function makeBuilderAnimationScene(world, options = {}) {
  const fixture = await makeSelectionScene(world, options),
    { GameScene } = await import('../../app/scene.ts'),
    { UnitMotion } = await import('../../app/unit-motion.ts'),
    { scene } = fixture,
    clock = { animationTime: 0, animationFrame: 0, ...options.clock }
  scene.unitMotion = new UnitMotion()
  scene.gameClock = clock
  clock.beforeTurn = () => scene.unitMotion.beforeTurn(scene.world)
  clock.afterTurn = () => scene.unitMotion.afterTurn(scene.world)
  const render = () => {
    fixture.personCalls.length = 0
    GameScene.prototype.updateUnitsFrame.call(scene)
  }
  const advance = seconds => fixture.api.advanceGame(scene.world, clock, seconds)
  return { ...fixture, render, advance, clock }
}
