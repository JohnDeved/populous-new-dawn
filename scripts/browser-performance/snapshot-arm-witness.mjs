// Dormant adapter for one exact arm, on the existing owned-browser infrastructure.
// No workflow selector, CLI activation, comparison report or save migration.
import assert from 'node:assert/strict'
import { CHECKPOINT_VERSION } from '../../app/checkpoint-format.ts'
import { readFileSync, writeFileSync, realpathSync, lstatSync } from 'node:fs'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { checkpointCodec } from '../tutorial-browser/checkpoint-codec.mjs'
import { createSnapshotFixture, validateSnapshotFixture, loadSnapshot } from './snapshot-setup.mjs'
import { captureSnapshotArmWitness } from './snapshot-arm-witness-core.mjs'
const hash = bytes => createHash('sha256').update(bytes).digest('hex')

// Returns one synchronous canonical graph, preserving World/presentation aliases.
// Effective-light projection is copied from displayedTribeCamera's x/y/angle
// modular correction; raw cameras/held state remain in the same original graph.
export function readArmEndpoint(codec) {
  const sceneRef = window.testSceneRef, store = window.testStore, getWorld = store?.getWorld
  const scene = sceneRef?.current, world = getWorld?.call(store)
  if (!scene || !world || scene.world !== world || scene.started !== true || scene.disposed !== false || !scene.renderer.domElement.isConnected)
    throw Error('Public-load witness Scene/World owner unavailable')
  if (world.paused !== true || scene.modalSuspended || document.visibilityState !== 'visible')
    throw Error('Public-load witness is not a visible quiescent paused endpoint')
  const renderer = scene.renderer, camera = scene.camera, gameClock = scene.gameClock
  const canvas = renderer.domElement, cameras = world.cameras, land = world.land, lights = world.lights
  const tribe = world.manaWorld?.playerTribe, tribeOwner = cameras?.tribes?.[tribe]
  let lightingInput = world.lightView, lightingOwner = 'world.lightView'
  if (cameras) {
    if (cameras.version !== 1) throw Error('Unsupported camera witness owner')
    lightingInput = { ...tribeOwner }; lightingOwner = 'displayedTribeCamera'
    if (cameras.phase === 'idle') {
      const held = cameras.held[tribe]
      lightingInput.x = (lightingInput.x + held.x) & 65535
      lightingInput.y = (lightingInput.y + held.y) & 65535
      lightingInput.angle = (lightingInput.angle + held.angle) & 2047
    }
  }
  const state = { world, sourceBoundary: 'actual-public-load-paused-endpoint',
    lighting: { owner: lightingOwner, effectiveInput: lightingInput, legacyLightView: world.lightView,
      lights: world.lights, revision: world.lightRevision },
    scene: { cameraPosition: scene.cameraPosition, cameraBearing: scene.cameraBearing, viewPoint: scene.viewPoint,
      viewPreset: scene.viewPreset, viewZoom: scene.viewZoom, viewTransition: scene.viewTransition,
      cameraMotion: scene.cameraMotion, resultCamera: scene.resultCamera, velocity: scene.cameraVelocity,
      flybyCamera: scene.flybyCamera, overviewActive: scene.overviewActive, overviewStage: scene.overviewStage,
      globeMorph: scene.globeMorph, globeMotion: scene.globeMotion, keys: scene.keys,
      pointerButtons: scene.pointerButtons, pointerGestureActive: scene.pointerGesture !== null,
      previewButtons: scene.cameraPreviewButtons, animationTime: scene.gameClock.animationTime,
      animationFrame: scene.gameClock.animationFrame, previous: scene.previous,
      projection: { ...scene.view.projection }, config: { ...scene.view.config },
      cameraMatrix: Array.from(scene.camera.matrixWorld.elements), projectionMatrix: Array.from(scene.camera.projectionMatrix.elements) },
    viewport: { width: innerWidth, height: innerHeight, devicePixelRatio,
      canvas: { width: canvas.width, height: canvas.height } },
    observation: { timestampMs: performance.now(), timeOriginUnixMs: performance.timeOrigin } }
  const text = JSON.stringify(codec(state))
  if (window.testSceneRef !== sceneRef || scene !== sceneRef.current || window.testStore !== store ||
      store.getWorld !== getWorld || world !== getWorld.call(store) || scene.world !== world ||
      scene.started !== true || scene.disposed !== false || scene.renderer !== renderer ||
      renderer.domElement !== canvas || !canvas.isConnected || scene.camera !== camera || scene.gameClock !== gameClock ||
      world.cameras !== cameras || world.land !== land || world.lights !== lights ||
      world.manaWorld?.playerTribe !== tribe || cameras?.tribes?.[tribe] !== tribeOwner)
    throw Error('Public-load witness owner changed during synchronous encoding')
  return text
}
const observe = Function(`return function() { const codec = ${checkpointCodec.toString()}; return (${readArmEndpoint.toString()})(codec) }`)()

export default async function snapshotArmWitness(options) {
  // Source import itself is not a sandbox: outer hosted provenance must qualify
  // this complete arm closure before importing the adapter, as in existing smoke.
  const { output } = options
  let root
  // Put even adapter preflight under the core's owned-browser cleanup boundary.
  return captureSnapshotArmWitness(options, {
    checkpointVersion: CHECKPOINT_VERSION,
    createFixture: args => {
      root = realpathSync(output)
      assert.equal(root, resolve(output)); assert.ok(lstatSync(root).isDirectory())
      const generator = hash(readFileSync(new URL('./snapshot-setup.mjs', import.meta.url)))
      const codec = hash(readFileSync(new URL('../tutorial-browser/checkpoint-codec.mjs', import.meta.url)))
      assert.equal(generator, options.expectedGeneratorSha256)
      assert.equal(codec, options.expectedCodecSha256)
      return createSnapshotFixture(args)
    },
    validateFixture: validateSnapshotFixture, loadSnapshot,
    observe: page => page.evaluate(observe),
    writeExclusive: (name, text) => { assert.equal(typeof root, 'string'); writeFileSync(resolve(root, name), text, { flag: 'wx' }) },
  })
}
