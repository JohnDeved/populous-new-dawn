// Node-only render-caller fixture. No browser/GPU, server, network or app writes.
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import * as THREE from 'three'

let loaded
export async function loadSceneFixture() {
  if (loaded) return loaded
  const app = new URL('../../app/', import.meta.url)
  // Resolve the unchanged Vite-style TS/JSON imports in Node in memory. This
  // does not add helpers to app/ or replace the scene implementation under test.
  registerHooks({
    resolve(specifier, context, next) {
      if (specifier.startsWith('.') && context.parentURL?.startsWith(app.href)) {
        const url = new URL(specifier, context.parentURL)
        if (!/\.[a-z]+$/i.test(url.pathname) && existsSync(fileURLToPath(url) + '.ts'))
          return next(url.href + '.ts', context)
      }
      return next(specifier, context)
    },
    load(url, context, next) {
      if (url.startsWith(app.href) && url.endsWith('.json'))
        return {
          format: 'module',
          source: 'export default ' + readFileSync(new URL(url), 'utf8'),
          shortCircuit: true,
        }
      if (url.startsWith(app.href) && url.endsWith('.ts'))
        return {
          format: 'module',
          source: ts.transpileModule(readFileSync(new URL(url), 'utf8'), {
            compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
          }).outputText,
          shortCircuit: true,
        }
      return next(url, context)
    },
  })
  const sceneCode = await import('../../app/scene-entities.ts')
  const model = await import('../../app/model.ts')
  const { advanceGame } = await import('../../app/game-clock.ts')
  const { migrateCheckpoint } = await import('../../app/game-store.ts')
  const { cameraPreset } = await import('../../app/projection.ts')
  loaded = { ...sceneCode, ...model, advanceGame, migrateCheckpoint, cameraPreset }
  return loaded
}

let acquired
export async function normalBloodlustWorld() {
  const api = await loadSceneFixture()
  if (!acquired) {
    const world = api.createWorld(16)
    const head = world.shrines.find(shrine => shrine.reward === 'bloodlust' && shrine.x < 0)
    const shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
    assert.ok(head && shaman)
    api.select(world, 'brave')
    assert.equal(world.selected.length, 6)
    assert.ok(api.command(world, head))
    for (let turn = 0; turn < 4000 && !world.shots.bloodlust; turn++) api.tick(world, 1 / 12)
    assert.equal(world.shots.bloodlust, 1)
    assert.equal(head.uses, 1)
    api.select(world, 'shaman')
    assert.ok(api.command(world, { x: -26, z: -13 }))
    for (let turn = 0; turn < 2000 && Math.hypot(shaman.x + 26, shaman.z + 13) > 1; turn++)
      api.tick(world, 1 / 12)
    const target = world.units.find(unit => unit.team === 'blue' && unit.kind === 'brave')
    assert.ok(api.cast(world, 'bloodlust', target))
    for (let turn = 0; turn < 150 && !world.units.some(unit => unit.bloodlust); turn++)
      api.tick(world, 1 / 12)
    assert.equal(world.units.filter(unit => unit.bloodlust).length, 6)
    assert.equal(world.shots.bloodlust, 0)
    acquired = world
  }
  return structuredClone(acquired)
}

export async function makeSceneFixture(world, options = {}) {
  const api = await loadSceneFixture()
  const requests = []
  const originalLoad = THREE.TextureLoader.prototype.load
  const originalDocument = globalThis.document
  // Supply only texture loading and projection/motion boundaries, not the
  // actual makeUnit/updateUnitsFrame/animatePerson code or status decisions.
  THREE.TextureLoader.prototype.load = function load(url, onLoad) {
    requests.push(url)
    const texture = new THREE.Texture({ src: url, width: 320, height: 32 })
    queueMicrotask(() => onLoad?.(texture))
    return texture
  }
  globalThis.document = { querySelector: () => null }
  const scene = {
    world,
    objects: new THREE.Group(),
    unitMeshes: new Map(),
    keys: new Set(),
    overviewStage: 0,
    cameraBearing: options.heading ?? 0,
    gameClock: { animationTime: 0, animationFrame: options.frame ?? 0 },
    view: {
      config: { ...api.cameraPreset(0), scaledSprites: options.scaled ? 1 : 0 },
      project: () => ({ z: options.depth ?? 0 }),
    },
    unitMotion: { position: (_world, unit, vector) => vector.set(unit.x, 0, unit.z) },
    releaseGroup: group => group.traverse(object => object.material?.dispose()),
  }
  scene.animatePerson = (...args) => api.animatePerson(scene, ...args)
  const render = () => api.updateUnitsFrame(scene)
  const close = () => {
    for (const group of scene.unitMeshes.values()) scene.releaseGroup(group)
    THREE.TextureLoader.prototype.load = originalLoad
    if (originalDocument === undefined) delete globalThis.document
    else globalThis.document = originalDocument
  }
  return { scene, render, close, requests, api }
}
