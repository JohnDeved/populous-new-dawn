import assert from 'node:assert/strict'

export const gameplayResourceLimits = [
  'One same-document public Restart Level after unchanged gameplay phases; not a leak slope, long-session plateau, heap/RSS reduction or memory cap.',
  'Renderer counters and scene-reachable identities are observations, not GPU bytes or a complete inventory of module caches, browser allocations or retained JavaScript objects. Texture inventory covers direct material properties only, not shader uniforms.',
  'Shared textures/images and cached geometry intentionally survive Scene disposal. Identity reuse is not evidence of complete cache accounting or absence of leaks.',
  'The pre-existing bindGame testScene alias temporarily retains the retiring Scene until disposal-state sampling; it is deleted before rebinding. No GC or collection claim.',
  'Disposed/aborted/context-lost state is not independent accounting of every RAF, event listener, timer or resource release.',
]

// Evaluated in the page. Local Sets are discarded at return; output contains
// only primitive values/arrays, never a Scene, renderer, DOM node or GPU object.
export function observeGameplayResources() {
  const scene = window.testSceneRef?.current, world = window.testStore?.getWorld()
  if (!scene || scene !== window.testScene || scene.world !== world) throw Error('Missing current scene/store')
  const geometryIds = new Set(), textureIds = new Set(), materialIds = new Set()
  scene.scene.traverse(object => {
    if (object.geometry) geometryIds.add(object.geometry.uuid)
    for (const material of Array.isArray(object.material) ? object.material : object.material ? [object.material] : []) {
      materialIds.add(material.uuid)
      for (const value of Object.values(material)) if (value?.isTexture) textureIds.add(value.uuid)
    }
  })
  const sorted = values => [...values].sort()
  return {
    timestampMs: performance.now(), timeOriginUnixMs: performance.timeOrigin,
    sceneUuid: scene.scene.uuid,
    level: world.outcome.level, turn: world.turn, paused: world.paused, inputMask: world.inputMask,
    speed: world.speed, visibility: document.visibilityState,
    disposed: scene.disposed, aborted: scene.terrainLoad.signal.aborted,
    canvasConnected: scene.renderer.domElement.isConnected,
    connectedBattlefieldCanvases: document.querySelectorAll('.world-viewport canvas.battlefield').length,
    contextLost: scene.renderer.getContext().isContextLost(),
    rendererGeometries: scene.renderer.info.memory.geometries,
    rendererTextures: scene.renderer.info.memory.textures,
    rendererPrograms: scene.renderer.info.programs?.length ?? null,
    reachableGeometryIds: sorted(geometryIds), reachableTextureIds: sorted(textureIds),
    reachableMaterialIds: sorted(materialIds),
  }
}

// Use only bindGame's existing alias, never add an old-scenes list/closure.
// Delete all observation aliases even if sampling throws, before new binding.
export function captureRetiredGameplayScene() {
  try {
    const scene = window.testScene
    if (!scene) throw Error('Retiring scene alias missing')
    return { disposed: scene.disposed, aborted: scene.terrainLoad.signal.aborted,
      canvasConnected: scene.renderer.domElement.isConnected,
      contextLost: scene.renderer.getContext().isContextLost(),
      ownedSoundCount: scene.ownedSounds.size, buildingPanelCount: scene.buildingPanels.size,
      fpsGraphReleased: scene.fpsGraph === null }
  } finally {
    delete window.testScene
    delete window.testSceneRef
    delete window.testStore
  }
}

export function assertResourceLive(value) {
  assert.equal(value.level, 2); assert.equal(value.paused, false)
  assert.equal(value.inputMask, 0); assert.equal(value.speed, 1)
  assert.equal(value.visibility, 'visible'); assert.equal(value.disposed, false)
  assert.equal(value.aborted, false); assert.equal(value.canvasConnected, true)
  assert.equal(value.contextLost, false); assert.equal(value.connectedBattlefieldCanvases, 1)
  assert.ok(typeof value.sceneUuid === 'string' && value.sceneUuid.length > 0)
  for (const key of ['timestampMs', 'timeOriginUnixMs'])
    assert.ok(Number.isFinite(value[key]) && value[key] >= 0, key)
  for (const key of ['turn', 'rendererGeometries', 'rendererTextures'])
    assert.ok(Number.isSafeInteger(value[key]) && value[key] >= 0, key)
  assert.ok(value.rendererGeometries > 0 && value.rendererTextures > 0, 'uploaded live renderer resources required')
  for (const key of ['reachableGeometryIds', 'reachableTextureIds', 'reachableMaterialIds']) {
    assert.ok(Array.isArray(value[key]) && value[key].length > 0, key)
    assert.ok(value[key].every(id => typeof id === 'string' && id.length > 0), key)
    assert.equal(new Set(value[key]).size, value[key].length, key)
  }
}

export function summarizeResourceRestart(before, retired, after, settled) {
  for (const value of [before, after, settled]) assertResourceLive(value)
  assert.deepEqual(retired, { disposed: true, aborted: true, canvasConnected: false,
    contextLost: true, ownedSoundCount: 0, buildingPanelCount: 0, fpsGraphReleased: true })
  assert.equal(after.timeOriginUnixMs, before.timeOriginUnixMs, 'restart must not reload document')
  assert.equal(settled.timeOriginUnixMs, before.timeOriginUnixMs)
  assert.notEqual(after.sceneUuid, before.sceneUuid, 'restart must replace Scene')
  assert.equal(settled.sceneUuid, after.sceneUuid, 'settling must observe the same replacement Scene')
  assert.ok(after.timestampMs > before.timestampMs && settled.timestampMs > after.timestampMs)
  assert.ok(settled.turn > after.turn, 'replacement must naturally advance')
  const overlap = key => after[key].filter(id => before[key].includes(id)).length
  return { status: 'passed', sameDocument: true, turnsAdvancedAfterRestart: settled.turn - after.turn,
    reusedReachableGeometryIdentities: overlap('reachableGeometryIds'),
    reusedReachableTextureIdentities: overlap('reachableTextureIds'),
    // Zero intersection is reportable, never silently converted into a pass for
    // cache behavior. These observations cannot enumerate the private module maps.
    cacheAccounting: 'not-measured-private-module-caches', memoryBytes: 'not-measured' }
}

export function assertResourceScenario(enabled, measuredPhases, allPhases) {
  assert.equal(typeof enabled, 'boolean', 'resource lifecycle mode must be explicit boolean')
  if (enabled) assert.deepEqual(measuredPhases, allPhases, 'resource scenario requires all original phases in order')
}
