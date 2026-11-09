// Actual shrine factories/frame/Scene transforms/resources; texture IO and
// projection come from the maintained Node fixture, without browser/GPU setup.
import { makeSceneFixture } from './bloodlust-scene.mjs'

export async function makeShrineScene(world) {
  const fixture = await makeSceneFixture(world),
    { GameScene } = await import('../../app/scene.ts'),
    { releaseGroup } = await import('../../app/scene-assets.ts'),
    { scene, api } = fixture
  scene.shrineMeshes = new Map()
  scene.waveFrames = new WeakMap()
  scene.y = GameScene.prototype.y
  scene.locate = GameScene.prototype.locate
  scene.orientModel = GameScene.prototype.orientModel
  scene.releaseGroup = releaseGroup
  // The real Scene constructor makes initial shrines before its frame caller.
  api.makeShrines(scene)
  const render = () => api.updateShrinesFrame(scene)
  const close = () => {
    for (const { g } of scene.shrineMeshes.values()) {
      if (g.userData.vaultKnowledgeMarker) scene.releaseGroup(g.userData.vaultKnowledgeMarker)
      scene.releaseGroup(g)
    }
    fixture.close()
  }
  return { scene, api, render, close, requests: fixture.requests }
}
