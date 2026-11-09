// Actual maintained Scene effect frame/factories/transforms/resources and real
// ProjectileMotion. Texture IO/projection use the Node fixture; no browser/GPU.
import * as THREE from 'three'
import { makeSceneFixture } from './bloodlust-scene.mjs'

export async function makeEffectScene(world) {
  const fixture = await makeSceneFixture(world),
    { GameScene } = await import('../../app/scene.ts'),
    { releaseGroup } = await import('../../app/scene-assets.ts'),
    { ProjectileMotion } = await import('../../app/projectile-motion.ts'),
    { scene } = fixture
  scene.ground = new THREE.Group()
  scene.fxMeshes = new Map()
  scene.projectileMotion = new ProjectileMotion()
  scene.y = GameScene.prototype.y
  scene.locate = GameScene.prototype.locate
  scene.makeFx = GameScene.prototype.makeFx
  scene.animateFx = GameScene.prototype.animateFx
  scene.releaseGroup = releaseGroup
  const render = () => GameScene.prototype.updateEffectsFrame.call(scene)
  const close = () => {
    for (const group of scene.fxMeshes.values()) scene.releaseGroup(group)
    fixture.close()
  }
  return { ...fixture, render, close }
}
