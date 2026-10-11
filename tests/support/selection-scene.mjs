// Actual unit-frame and maintained Scene animation/effect wrappers. Texture IO,
// projection and motion remain the existing Node boundaries; no browser/GPU.
import { makeSceneFixture } from './bloodlust-scene.mjs'

export async function makeSelectionScene(world, options = {}) {
  const fixture = await makeSceneFixture(world, options),
    { GameScene } = await import('../../app/scene.ts'),
    { releaseGroup } = await import('../../app/scene-assets.ts'),
    { scene } = fixture,
    personCalls = []
  scene.releaseGroup = releaseGroup
  scene.y = GameScene.prototype.y
  scene.locate = GameScene.prototype.locate
  scene.makeFx = GameScene.prototype.makeFx
  scene.animateFx = GameScene.prototype.animateFx
  scene.animatePerson = function (...args) {
    personCalls.push(args)
    return GameScene.prototype.animatePerson.apply(this, args)
  }
  const render = () => {
    personCalls.length = 0
    fixture.render()
  }
  const directPerson = (...args) => GameScene.prototype.animatePerson.apply(scene, args)
  return { ...fixture, render, personCalls, directPerson }
}
