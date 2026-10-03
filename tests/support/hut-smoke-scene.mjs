// Node-only caller fixture. Actual mission, clock, admission and smoke scene code
// run unchanged. Texture IO, projection and unrelated plan geometry are supplied.
import assert from 'node:assert/strict'
import * as THREE from 'three'
import { loadSceneFixture, makeSceneFixture } from './bloodlust-scene.mjs'

export async function makeHutSmokeScene(world) {
  const fixture = await makeSceneFixture(world)
  const { scene, api } = fixture
  Object.assign(scene, {
    buildingMeshes: new Map(),
    plans: new Map(),
    waveFrames: new WeakMap(),
    camera: new THREE.PerspectiveCamera(),
    ground: new THREE.Group(),
    decorations: new THREE.Group(),
    cursor: { material: new THREE.MeshBasicMaterial() },
    locate(group, point, height = 0) {
      group.position.set(point.x, height, point.z)
    },
    orientModel(group, angle) {
      group.rotation.y = angle
    },
    makeDecorations() {},
    planGeometry() {
      return { geometry: new THREE.BufferGeometry() }
    },
  })
  const render = () => api.updateBuildingsFrame(scene)
  const close = () => {
    for (const group of scene.buildingMeshes.values()) {
      const smoke = group.userData.hutOccupancySmoke
      if (smoke) scene.releaseGroup(smoke.group)
      scene.releaseGroup(group)
    }
    for (const plan of scene.plans.values()) plan.geometry.dispose()
    scene.cursor.material.dispose()
    fixture.close()
  }
  return { scene, api, render, close }
}

export async function naturalHutAdmission() {
  const api = await loadSceneFixture()
  const world = api.createWorld(2)
  const fixture = await makeHutSmokeScene(world)
  const { scene, render } = fixture
  render()
  const hut = world.buildings.find(b => b.team === 'blue' && b.kind === 'hut')
  assert.ok(hut)
  assert.equal(world.units.filter(u => u.inside === hut.id).length, 0)
  let event
  const { observeHutOccupancy } = await import('../../app/hut-occupancy-smoke.ts')
  const stop = observeHutOccupancy(hut, () => {
    const ids = world.units.filter(u => u.inside === hut.id && u.hp > 0).map(u => u.id)
    if (!event && ids.length) {
      const smoke = scene.buildingMeshes.get(hut.id).userData.hutOccupancySmoke
      event = {
        turn: world.turn,
        counter: hut.counter,
        building: hut.id,
        residents: ids,
        level: hut.level,
        pose: api.buildingPose(hut),
        callbackRoot: structuredClone(smoke.state.root),
      }
    }
  })
  try {
    for (let turn = 0; turn < 256 && !event; turn++) {
      api.advanceGame(world, scene.gameClock, 1 / 12)
      render()
    }
    assert.ok(event, 'authored Mission2 must reach an ordinary residence admission')
    return { ...fixture, hut, event }
  } catch (error) {
    fixture.close()
    throw error
  } finally {
    stop()
  }
}

export async function captureHutFirstVisits() {
  const fixture = await naturalHutAdmission()
  const { scene, api, hut, event, render, close } = fixture
  const roots = []
  try {
    for (let visit = 0; visit < 16; visit++) {
      if (visit) {
        api.advanceGame(scene.world, scene.gameClock, 1 / 12)
        render()
      }
      assert.deepEqual(
        scene.world.units.filter(u => u.inside === hut.id && u.hp > 0).map(u => u.id),
        event.residents,
        'the normal resident set must remain unchanged through this lifetime sample'
      )
      const root = scene.buildingMeshes.get(hut.id).userData.hutOccupancySmoke.state.root
      roots.push({ lifetime: root.lifetime, visible: root.visible, mode: root.mode })
    }
    return { event, roots }
  } finally {
    close()
  }
}

// Controlled supporting world; residents still use actual command8 admission.
// No direct occupancy, resident slot, building counter or smoke state assignment.
export async function fullHutScene() {
  const api = await loadSceneFixture()
  const world = api.createWorld()
  world.manaWorld.gameFlags = 32 // Existing housing-entry population-isolation fixture.
  world.units = world.units.filter(unit => unit.kind === 'shaman')
  const hut = api.addBuilding(world, 'blue', 'hut', { x: -2, z: 32 }, true)
  const fixture = await makeHutSmokeScene(world)
  const residents = []
  try {
    fixture.render()
    for (let index = 0; index < 3; index++) {
      const person = api.addUnit(world, 'blue', 'brave', { x: 7, z: 33 })
      residents.push(person)
      world.selected = [person.id]
      assert.ok(api.command(world, hut))
      for (let turn = 0; turn < 180 && person.inside !== hut.id; turn++) {
        api.advanceGame(world, fixture.scene.gameClock, 1 / 12)
        fixture.render()
      }
      assert.equal(person.inside, hut.id, 'supporting resident must enter through command8')
    }
    const smoke = fixture.scene.buildingMeshes.get(hut.id).userData.hutOccupancySmoke
    assert.equal(smoke.state.root.mode, 'full')
    return { ...fixture, hut, residents, smoke }
  } catch (error) {
    fixture.close()
    throw error
  }
}
