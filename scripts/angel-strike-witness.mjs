import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { bindGame, effectPixels } from './browser-game.mjs'

// Controlled logical-clock visits of the existing authored Angel. No injected
// phase, target, pose, position, damage, or animation-controller state.
export async function witnessAngelStrike(page, angelId, artifactDir, stage) {
  async function visitUntil(stop, maxFrames, targetId = null) {
    return page.evaluate(async ({ angelId, stop, maxFrames, targetId }) => {
      const scene = globalThis.testScene, world = scene.world,
        { advanceGame } = await import('/app/game-clock.ts'),
        angel = world.effects.find(effect => effect.id === angelId)
      world.paused = false
      world.speed = 1
      const observedHits = []
      for (let frame = 0; frame < maxFrames; frame++) {
        const target = world.units.find(unit => unit.id === targetId),
          existingHits = new Set(world.effects.filter(effect => effect.kind === 'hit').map(effect => effect.id))
        advanceGame(world, scene.gameClock, 1 / 24)
        // Observe the real short-lived effect at the proved timer-8 impact;
        // waiting until model 69 returns would inspect it after natural expiry.
        if (target && angel.angel.target === targetId && angel.angel.phase === 'striking' && angel.angel.timer === 8) {
          const hit = world.effects.find(effect => effect.kind === 'hit' && !existingHits.has(effect.id) &&
            effect.x === target.x && effect.z === target.z)
          if (hit) observedHits.push({turn:world.turn,id:hit.id,target:target.id,x:hit.x,z:hit.z,
            timer:angel.angel.timer, angelTarget:angel.angel.target, targetRemoved:!world.units.some(unit => unit.id === target.id)})
        }
        scene.animateFx(scene.fxMeshes.get(angelId), angel)
        const state = angel.angel.presentation
        if ((stop === 'partial' && angel.angel.phase === 'striking' &&
              state.pendingObject === 62 && state.transitionCounter > 0 && state.transitionCounter < 5) ||
            (stop === '62' && state.object === 62 && state.displayedPose.object === 62) ||
            (stop === '69' && state.object === 69 && state.pendingObject === 69 &&
              state.transitionCounter === 0 && state.displayedPose.object === 69)) {
          world.paused = true
          scene.focus(angel)
          scene.onChange()
          scene.animate(scene.previous)
          cancelAnimationFrame(scene.frame)
          scene.renderer.render(scene.scene, scene.camera)
          return { frame, turn: world.turn, target: angel.angel.target,
            phase: angel.angel.phase, state: structuredClone(state), observedHits,
            targetRemoved: targetId !== null && !world.units.some(unit => unit.id === targetId) }
        }
      }
      throw new Error(`Authored Angel did not reach ${stop} within ${maxFrames} visits`)
    }, { angelId, stop, maxFrames, targetId })
  }

  const partial = await visitUntil('partial', 1200)
  assert.ok(partial.target)
  await page.screenshot({ path: resolve(artifactDir, 'mission5-angel-strike-partial.png') })
  assert.equal(await page.evaluate(() => globalThis.testStore.saveCheckpoint()), true)
  assert.equal(await page.evaluate(() => globalThis.testStore.loadCheckpoint()), true)
  await bindGame(page)
  const loaded = await page.evaluate(id => {
    const scene = globalThis.testScene
    cancelAnimationFrame(scene.frame)
    scene.onChange()
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
    return structuredClone(scene.world.effects.find(effect => effect.id === id).angel.presentation)
  }, angelId)
  assert.deepEqual(loaded, partial.state)
  stage('controlled partial strike and public checkpoint', { partial, loaded })

  // Observe actual ownership events, not renderer.info cache counts. Each
  // replacement must dispose its private geometry/material but not shared atlas.
  await page.evaluate(id => {
    const mesh = globalThis.testScene.fxMeshes.get(id).children[0]
    const trace = globalThis.angelStrikeResources = {
      oldMesh: mesh.uuid, oldGeometry: mesh.geometry.uuid,
      oldMaterial: mesh.material.uuid, atlas: mesh.material.map.uuid,
      fallbackId: mesh.userData.painterFallbackId ?? mesh.id,
      geometryDisposals: 0, materialDisposals: 0, atlasDisposals: 0,
    }
    mesh.geometry.addEventListener('dispose', () => trace.geometryDisposals++)
    mesh.material.addEventListener('dispose', () => trace.materialDisposals++)
    mesh.material.map.addEventListener('dispose', () => trace.atlasDisposals++)
  }, angelId)

  async function inspect(expected) {
    const result = await page.evaluate(async ({ id, expected }) => {
      const scene = globalThis.testScene, group = scene.fxMeshes.get(id), mesh = group.children[0],
        { nativeModelResource } = await import('/app/model-resources.ts'),
        { modelStage, modelDepthBias, modelTextureModes } = await import('/app/model-faces.ts'),
        resource = nativeModelResource(expected, scene.environment.objects.bank),
        equal = (actual, values) => JSON.stringify(Array.from(actual)) ===
          JSON.stringify(Array.from(new Float32Array(values))),
        expectedStage = modelStage(resource.data, 4),
        point = scene.screen(scene.world.effects.find(effect => effect.id === id))
      return { model: mesh.userData.nativeModel, children: group.children.length,
        resourceIdentity: mesh.userData.nativeResource === resource,
        uvMatches: equal(mesh.geometry.getAttribute('uv').array, expectedStage.uv),
        biasMatches: equal(mesh.geometry.getAttribute('painterBias').array, modelDepthBias(resource.data, 4)),
        textureModeMatches: equal(mesh.geometry.getAttribute('textureMode').array, modelTextureModes(resource.data, 4)),
        mesh: mesh.uuid, geometry: mesh.geometry.uuid, material: mesh.material.uuid,
        atlas: mesh.material.map.uuid, trace: {...globalThis.angelStrikeResources},
        fallbackId: mesh.userData.painterFallbackId, phase: scene.view.painter.source(mesh)?.phase,
        projectedCenter: { x: point.x, y: point.y } }
    }, { id: angelId, expected })
    assert.equal(result.model, expected)
    assert.equal(result.children, 1)
    assert.ok(result.resourceIdentity && result.uvMatches && result.biasMatches && result.textureModeMatches)
    assert.notEqual(result.mesh, result.trace.oldMesh)
    assert.notEqual(result.geometry, result.trace.oldGeometry)
    assert.notEqual(result.material, result.trace.oldMaterial)
    assert.equal(result.atlas, result.trace.atlas)
    assert.equal(result.fallbackId, result.trace.fallbackId)
    assert.equal(result.phase, 1, 'Resource replacement must retain the native-model Painter phase')
    assert.equal(result.trace.geometryDisposals, 1)
    assert.equal(result.trace.materialDisposals, 1)
    assert.equal(result.trace.atlasDisposals, 0)
    assert.ok(Math.abs(result.projectedCenter.x) < 0.9 && Math.abs(result.projectedCenter.y) < 0.9)
    const pixels = await effectPixels(page, [angelId])
    assert.ok(pixels > 20, `Original Angel model ${expected} must reach GPU pixels (${pixels})`)
    await page.evaluate(() => {
      const scene = globalThis.testScene
      scene.renderer.render(scene.scene, scene.camera)
    })
    return {...result, pixels}
  }

  const strike = await visitUntil('62', 96), strikeMesh = await inspect(62)
  await page.screenshot({ path: resolve(artifactDir, 'mission5-angel-strike-model62.png') })
  stage('actual original model 62 full resource replacement', { strike, strikeMesh })
  await page.evaluate(id => {
    const mesh = globalThis.testScene.fxMeshes.get(id).children[0], trace = globalThis.angelStrikeResources
    trace.oldMesh = mesh.uuid; trace.oldGeometry = mesh.geometry.uuid; trace.oldMaterial = mesh.material.uuid
    trace.geometryDisposals = 0; trace.materialDisposals = 0
    mesh.geometry.addEventListener('dispose', () => trace.geometryDisposals++)
    mesh.material.addEventListener('dispose', () => trace.materialDisposals++)
  }, angelId)
  const returned = await visitUntil('69', 96, partial.target), returnedMesh = await inspect(69)
  assert.ok(returned.observedHits.some(hit => hit.target === partial.target && hit.timer === 8),
    'Actual target-specific timer-8 hit must be observed before its transient effect expires')
  assert.equal(returned.targetRemoved, true, 'The observed strike target must be removed by return to model 69')
  await page.screenshot({ path: resolve(artifactDir, 'mission5-angel-strike-return69.png') })
  stage('actual return to initial model 69 with owned resource cleanup', { returned, returnedMesh })
  return { target: partial.target, hit: returned.observedHits.length > 0 }
}
