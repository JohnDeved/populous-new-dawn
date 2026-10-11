// Actual vehicle factory/frame/model/UV/resource and Scene transform methods.
// The existing fixture supplies texture loading and avoids browser/GPU setup.
import { makeSceneFixture } from './bloodlust-scene.mjs'

export async function makeVehicleScene(world) {
  const fixture = await makeSceneFixture(world),
    { GameScene } = await import('../../app/scene.ts'),
    { releaseGroup } = await import('../../app/scene-assets.ts'),
    { scene, api } = fixture
  scene.vehicleMeshes = new Map()
  scene.locate = GameScene.prototype.locate
  scene.orientModel = GameScene.prototype.orientModel
  scene.releaseGroup = releaseGroup
  const render = () => api.updateVehiclesFrame(scene)
  const close = () => {
    for (const group of scene.vehicleMeshes.values()) scene.releaseGroup(group)
    fixture.close()
  }
  return { scene, api, render, close, requests: fixture.requests }
}
