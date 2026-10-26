// NEW checker, not recovered Oct 23 bytes. This observer records lifecycle events,
// not retained heap or GPU memory. Its long-lived state contains only scalar
// records, WeakMaps and WeakRefs; listeners never close over their resource.
export function installMaterialObserver({ owner, maxResources = 256 }) {
  if (globalThis.materialRetirementObserver) throw Error('Material observer already installed')
  if (!owner || !Number.isInteger(maxResources) || maxResources < 8 || maxResources > 256)
    throw Error('Invalid material observer bounds')
  const sceneRef = new WeakRef(globalThis.testSceneRef.current)
  const ids = new WeakMap(), resources = [], removers = [], plans = new Map()
  let closed = false, sequence = 0
  // Keep listener creation outside track's resource-bearing activation scope.
  const counter = row => () => { row.disposals++ }
  const live = () => {
    const scene = sceneRef.deref()
    if (!scene || globalThis.testSceneRef.current !== scene) throw Error('Observed scene changed')
    return scene
  }
  const track = (resource, kind) => {
    if (!resource || typeof resource.addEventListener !== 'function') throw Error('Resource missing')
    let id = ids.get(resource)
    if (id) {
      if (resources[id - 1].kind !== kind) throw Error('Resource type changed')
      return id
    }
    if (resources.length >= maxResources) throw Error('Material observer resource limit')
    id = resources.length + 1
    const row = { id, kind, disposals: 0 }
    // Event arguments may contain the resource; deliberately neither store nor
    // close over them. The removable registration itself holds only a WeakRef.
    const listener = counter(row)
    resources.push(row)
    ids.set(resource, id)
    resource.addEventListener('dispose', listener)
    removers.push({ resource: new WeakRef(resource), listener })
    return id
  }
  const materials = object => Array.isArray(object.material) ? object.material : [object.material]
  const shared = () => {
    const cursor = live().cursor.material
    if (Array.isArray(cursor) || !cursor.map) throw Error('Single cursor material and atlas required')
    return { cursor: track(cursor, 'material'), atlas: track(cursor.map, 'texture') }
  }
  const initial = shared()
  const recordPlan = (label, buildingId) => {
    if (closed || plans.has(label)) throw Error('Plan label already observed or observer closed')
    const scene = live(), mesh = scene.plans.get(buildingId)
    if (!mesh || mesh.parent !== scene.ground) throw Error('Attached plan missing')
    const own = materials(mesh)
    if (!own.length || own.some(material => material === scene.cursor.material ||
        !material.userData.nativeUniforms || material.map !== scene.cursor.material.map ||
        material.userData.nativeUniforms === scene.cursor.material.userData.nativeUniforms))
      throw Error('Plan was not prepared with its own material and borrowed atlas')
    const row = { buildingId, object: new WeakRef(mesh), geometry: track(mesh.geometry, 'geometry'),
      materials: [...new Set(own.map(material => track(material, 'material')))] }
    plans.set(label, row)
    return snapshot(label)
  }
  const replacement = buildingId => {
    const scene = live(), object = scene.buildingMeshes.get(buildingId)
    if (!object || object.parent !== scene.objects) throw Error('Replacement building missing')
    const geometryIds = new Set(), materialIds = new Set()
    object.traverse(child => {
      if (child.geometry) geometryIds.add(track(child.geometry, 'geometry'))
      if (child.material) for (const material of materials(child)) {
        if (!material.userData.nativeUniforms) throw Error('Replacement was not prepared')
        materialIds.add(track(material, 'material'))
      }
    })
    if (!geometryIds.size || !materialIds.size) throw Error('Replacement has no render resources')
    return { buildingId, attached: object.parent === scene.objects,
      geometries: [...geometryIds], materials: [...materialIds] }
  }
  const snapshot = label => {
    if (closed) throw Error('Material observer closed')
    const scene = live(), row = plans.get(label), mesh = row?.object.deref()
    if (!row) throw Error('Unknown plan label')
    // Collection is not interpreted as disposal. The listener counters remain
    // authoritative even if a detached mesh has already become unreachable.
    return { label, buildingId: row.buildingId, geometry: row.geometry, materials: [...row.materials],
      inPlans: scene.plans.has(row.buildingId), detached: !mesh || mesh.parent === null,
      preparedIdentity: !mesh || (ids.get(mesh.geometry) === row.geometry &&
        materials(mesh).length === row.materials.length &&
        materials(mesh).every(material => row.materials.includes(ids.get(material)))),
      shared: shared(), disposed: scene.disposed,
      canvasConnected: scene.renderer.domElement.isConnected,
      sequence: ++sequence, resources: resources.map(value => ({ ...value })) }
  }
  const pixels = (kind, buildingId) => {
    const scene = live(), object = (kind === 'plan' ? scene.plans : scene.buildingMeshes).get(buildingId)
    if (!object || !object.visible || scene.disposed) throw Error('Visible live target required')
    const renderer = scene.renderer, gl = renderer.getContext()
    const width = gl.drawingBufferWidth, height = gl.drawingBufferHeight
    if (width <= 0 || height <= 0 || width * height > 2000000 || gl.isContextLost())
      throw Error('Invalid or lost rendered surface')
    const before = new Uint8Array(width * height * 4), after = new Uint8Array(before.length)
    const visible = object.visible
    let differentPixels = 0
    try {
      renderer.render(scene.scene, scene.camera)
      gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, before)
      object.visible = false
      renderer.render(scene.scene, scene.camera)
      gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, after)
      for (let i = 0; i < before.length; i += 4)
        if (before[i] !== after[i] || before[i + 1] !== after[i + 1] || before[i + 2] !== after[i + 2])
          differentPixels++
    } finally {
      object.visible = visible
      renderer.render(scene.scene, scene.camera)
    }
    return { kind, buildingId, width, height, differentPixels, contextLost: gl.isContextLost() }
  }
  const close = () => {
    if (globalThis.materialRetirementObserver?.owner !== owner) throw Error('Observer ownership changed')
    for (const entry of removers) entry.resource.deref()?.removeEventListener('dispose', entry.listener)
    removers.length = 0
    plans.clear()
    closed = true
    delete globalThis.materialRetirementObserver
    return { closed, retainedResourceReferences: 0, registrationCount: 0 }
  }
  globalThis.materialRetirementObserver = { owner, initial, recordPlan, snapshot, replacement, pixels, close }
  return initial
}
