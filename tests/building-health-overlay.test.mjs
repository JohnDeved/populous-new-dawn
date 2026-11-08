// Actual building factory/update and original model geometry, with the established
// Node scene fixture supplying texture IO, projection and unrelated plan geometry.
// Controlled render states are not a browser or original-game execution witness.
import assert from 'node:assert/strict'
import test from 'node:test'
import { makeHutSmokeScene } from './support/hut-smoke-scene.mjs'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'

test('building render updates retain staged models without generic overhead health boxes', async () => {
  const api = await loadSceneFixture()
  const world = api.createWorld(2)
  world.buildings = []
  const buildings = []
  for (const team of ['blue', 'red', 'yellow', 'green']) {
    for (const kind of ['hut', 'tower', 'camp', 'temple', 'firewarriorHut', 'spyHut', 'boatHouse', 'balloonHut', 'prison']) {
      buildings.push(api.addBuilding(world, team, kind, { x: 0, z: 0 }))
    }
  }
  const fixture = await makeHutSmokeScene(world)
  try {
    for (const state of ['healthy', 'damaged', 'construction', 'repaired']) {
      for (const building of buildings) {
        building.progress = state === 'construction' ? 0.5 : 1
        building.hp = api.buildingHp(building.kind) * (state === 'damaged' ? 0.5 : 1)
      }
      const simulation = structuredClone(world.buildings)
      fixture.render()
      assert.deepEqual(world.buildings, simulation, 'presentation must not mutate building gameplay')
      for (const building of buildings) {
        const group = fixture.scene.buildingMeshes.get(building.id)
        assert.ok(group?.visible, `${building.team} ${building.kind} ${state} remains rendered`)
        assert.ok(group.userData.signature.startsWith(`${api.buildingObject(building)}-${api.buildingStage(building)}`))
        assert.equal(group.userData.health, undefined)
        assert.equal(group.userData.healthFill, undefined)
        assert.equal(group.children.length, 1, 'only the native model, not a generic box/fill pair')
        let vertices = 0
        group.children[0].traverse(child => {
          assert.notEqual(child.geometry?.type, 'BoxGeometry', 'no substitute health-box geometry')
          vertices += child.geometry?.attributes.position?.count ?? 0
        })
        assert.ok(vertices > 0, 'stage retains actual model vertices')
      }
    }
  } finally {
    fixture.close()
  }
})

test('the actual person update retains the native vertical damaged-friendly gauge', async () => {
  const api = await loadSceneFixture()
  const world = api.createWorld(2)
  const fixture = await makeHutSmokeScene(world)
  try {
    const person = api.addUnit(world, 'blue', 'brave', { x: 0, z: 0 })
    assert.ok(person)
    person.hp = api.maxHp(person.kind) / 2
    world.inputMask = 0
    fixture.scene.keys.add('quote')
    api.updateUnitsFrame(fixture.scene)
    const gauge = fixture.scene.unitMeshes.get(person.id).userData.health
    assert.ok(gauge.isSprite)
    assert.equal(gauge.visible, true)
    assert.deepEqual([gauge.scale.x, gauge.scale.y], [6, 26])
    person.hp = api.maxHp(person.kind)
    api.updateUnitsFrame(fixture.scene)
    assert.equal(gauge.visible, false)
  } finally {
    fixture.close()
  }
})
