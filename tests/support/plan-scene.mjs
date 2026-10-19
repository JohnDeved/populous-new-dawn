// Actual building frame, plan geometry, Scene transforms and resource cleanup.
// Reuses the smoke fixture's texture and unrelated decoration boundaries.
import { makeHutSmokeScene } from './hut-smoke-scene.mjs'

export async function makePlanScene(world) {
  const fixture = await makeHutSmokeScene(world),
    { GameScene } = await import('../../app/scene.ts'),
    { releaseGroup } = await import('../../app/scene-assets.ts'),
    { scene } = fixture
  scene.planGeometry = GameScene.prototype.planGeometry
  scene.y = GameScene.prototype.y
  scene.locate = GameScene.prototype.locate
  scene.orientModel = GameScene.prototype.orientModel
  scene.releaseGroup = releaseGroup
  return fixture
}
