// Preparation only: inspect existing authored objects and rendered pick geometry.
// These queries may refresh picker/matrix caches; they issue no input or world command.
export function authoredHoverTargets(scene = window.testSceneRef.current) {
  const tree = scene.world.trees.filter(t => t.x === 3 && t.z === 23 && t.model === 1 && t.logs > 0)
  const huts = [[-12, 34], [-4, 42]].map(([x, z]) => scene.world.buildings.find(
    b => b.x === x && b.z === z && b.team === 'blue' && b.kind === 'hut'))
  if (tree.length !== 1 || !huts[0]) throw Error('Declared authored Mission1 targets unavailable')
  return { tree: { id: tree[0].id, x: 3, z: 23, model: 1, sourceObject: 20 },
    building: { id: huts[0].id, x: -12, z: 34, sourceObject: 42 } }
}

export async function hoverInput({ target, scene = window.testSceneRef.current, findEntityInput, doc = document }) {
  findEntityInput ??= (await import('/qa/erosion-ordinary/input.mjs')).findEntityInput
  const canvas = scene.renderer.domElement, rect = canvas.getBoundingClientRect()
  const group = target.kind === 'tree'
    ? scene.decorations.children.find(g => g.userData.point?.id === target.id)
    : scene.buildingMeshes.get(target.id)
  const candidates = [], bodies = [], viewKey = JSON.stringify(scene.view.projection)
  group?.traverse(mesh => {
    if (!mesh.visible || mesh.userData.nativeModel === undefined) return
    bodies.push({ nativeModel: mesh.userData.nativeModel, stage: mesh.userData.stage,
      size: mesh.userData.nativeSize,
      textureModes: [...new Set(mesh.geometry.getAttribute('textureMode')?.array ?? [])] })
    for (const face of scene.picking.model(mesh, viewKey).filter(row => row.kind === 'model'))
      for (const weights of [[1, 1, 1], [2, 1, 1], [1, 2, 1], [1, 1, 2]]) {
        const total = weights.reduce((a, b) => a + b, 0)
        candidates.push({ x: rect.left + face.points.reduce((sum, p, i) => sum + p.x * weights[i], 0) / total,
          y: rect.top + face.points.reduce((sum, p, i) => sum + p.y * weights[i], 0) / total })
      }
  })
  if (candidates.length > 4096) throw Error('Declared 4096 target-candidate bound exceeded')
  const probe = { candidates: candidates.length, inspected: 0, wrongTarget: 0, notCanvas: 0, bodies }
  const point = findEntityInput(candidates, target.id, point => {
    probe.inspected++
    const canvasOwned = doc.elementFromPoint(point.x, point.y) === canvas
    // pickWorldObject omits trees. This is the exact ordinary no-mode picker.
    const hitId = canvasOwned ? scene.picking.pick({ clientX: point.x, clientY: point.y }) : null
    if (!canvasOwned) probe.notCanvas++
    else if (hitId !== target.id) probe.wrongTarget++
    return { ...point, canvasOwned, hitId }
  })
  return { target, point, probe, camera: { point: { ...scene.viewPoint }, bearing: scene.cameraBearing,
    preset: scene.viewPreset }, turn: scene.world.turn, sceneFrame: scene.frame, rendererFrame: scene.renderer.info.render.frame }
}

// Mirrors installInputListeners' minimap arguments, including the current heading.
export async function hoverMinimapInput({ target, scene = window.testSceneRef.current, minimapInput, minimapPick, doc = document }) {
  minimapInput ??= (await import('/qa/erosion-ordinary/minimap-input.mjs')).minimapInput
  minimapPick ??= (await import('/app/minimap.ts')).minimapPick
  return minimapInput({ width: scene.mini.width, height: scene.mini.height,
    rect: scene.mini.getBoundingClientRect(),
    center: { x: Math.round((scene.viewPoint.x + 8) * 256), y: Math.round((-scene.viewPoint.z - 8) * 256) },
    heading: Math.round(scene.cameraBearing * 1024 / Math.PI),
    target: { x: Math.round((target.x + 8) * 256), y: Math.round((-target.z - 8) * 256) },
    maxDistance: 8 * 256 }, minimapPick, point => doc.elementFromPoint(point.x, point.y) === scene.mini)
}
